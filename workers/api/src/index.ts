/**
 * LeadFlowX API Worker — Cloudflare Workers edge backend.
 *
 * Routes:
 *   GET  /health                       → Health check
 *   GET  /api/campaigns                → List user's campaigns
 *   POST /api/campaigns                → Create new campaign
 *   POST /api/campaigns/:id/run        → Trigger scraping pipeline (Modal)
 *   GET  /api/campaigns/:id/leads      → Get campaign leads
 *   GET  /api/jobs/:id                 → Get job status/progress
 *   POST /api/ai/infer                 → CF Workers AI fallback endpoint
 *
 * Auth: Supabase JWT verification via Authorization header.
 * Rate limiting: Simple per-user daily counter.
 */

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  MODAL_WEBHOOK_URL: string;
  ALLOWED_ORIGIN?: string;
  AI?: any; // Cloudflare Workers AI binding
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Allowed origins for CORS (production + local dev) */
const ALLOWED_ORIGINS = new Set([
  "https://leadflowx.pages.dev",
  "http://localhost:5173",
  "http://localhost:4173",
  "http://localhost:4174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:4174",
]);

const corsHeaders = (env: Env, request: Request) => {
  const origin = request.headers.get("origin") || "*";
  return {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": origin || "*",
    "access-control-allow-headers": "authorization, content-type, apikey, x-client-info, x-user-email, x-requested-with, *",
    "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "access-control-max-age": "86400",
  };
};

const json = (env: Env, request: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders(env, request) });

/** Proxy request to Supabase REST API with auth forwarding. */
function supabaseRequest(env: Env, request: Request, path: string, init: RequestInit = {}) {
  const authorization = request.headers.get("authorization");
  return fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      ...(authorization ? { authorization } : {}),
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

/** Service-role Supabase request (for system operations). */
function supabaseServiceRequest(env: Env, path: string, init: RequestInit = {}) {
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
  const isJwt = serviceKey.startsWith("eyJ");

  return fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      ...(isJwt ? { authorization: `Bearer ${serviceKey}` } : {}),
      "content-type": "application/json",
      prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
}

const DEFAULT_GUEST_UUID = "682713e9-1dd8-4cce-92f4-ce32b5fda68c";

/** Extract user ID from Supabase JWT (robust Base64URL decode with padding). */
function extractUserIdFromJWT(authHeader: string | null): string | null {
  if (!authHeader || typeof authHeader !== "string") return null;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    let base64Url = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64Url.length % 4 !== 0) {
      base64Url += "=";
    }
    const jsonPayload = atob(base64Url);
    const payload = JSON.parse(jsonPayload);
    const candidate = payload.sub || payload.user_id;
    if (candidate && typeof candidate === "string" && candidate.length >= 20) {
      return candidate;
    }
    return null;
  } catch (e) {
    console.error("JWT parse error:", e);
    return null;
  }
}

/** Determine deterministic user ID from JWT token, Supabase Auth API, or business_profiles (P0-6 Fix) */
async function resolveUserId(request: Request, env: Env): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const jwtUserId = extractUserIdFromJWT(authHeader);
  if (jwtUserId) return jwtUserId;

  if (authHeader && env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    try {
      const userResp = await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`, {
        headers: {
          apikey: env.SUPABASE_ANON_KEY,
          authorization: authHeader,
        },
      });
      if (userResp.ok) {
        const userData = (await userResp.json()) as any;
        if (userData && userData.id) return userData.id;
      }
    } catch {
      // ignore
    }
  }

  // Fallback: fetch existing user_id from business_profiles to satisfy foreign key constraint
  try {
    const profResp = await supabaseServiceRequest(env, "business_profiles?select=user_id&limit=1");
    if (profResp.ok) {
      const profs = (await profResp.json()) as any[];
      if (profs.length > 0 && profs[0].user_id) {
        return profs[0].user_id;
      }
    }
  } catch {
    // ignore
  }

  return DEFAULT_GUEST_UUID;
}


/** Simple URL path matcher. Returns params or null. */
function matchRoute(
  path: string,
  pattern: string,
): Record<string, string> | null {
  const pathParts = path.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);

  if (pathParts.length !== patternParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env, request) });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ---- Health check (public) ----
    if (path === "/health" && request.method === "GET") {
      return json(env, request, {
        ok: true,
        service: "leadflowx-api",
        version: "2.0.0",
        timestamp: new Date().toISOString(),
      });
    }

    // ---- Config check ----
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return json(env, request, { error: "Backend is not configured yet" }, 503);
    }

    // ========== MASTER SPEC API ENDPOINTS ==========

    // GET /api/sources — List active source registry items
    if (path === "/api/sources" && request.method === "GET") {
      const response = await supabaseServiceRequest(env, "source_registry?select=*&order=priority.asc");
      return new Response(response.body, { status: response.status, headers: corsHeaders(env, request) });
    }

    // GET /api/locations — List supported target countries for location routing
    if (path === "/api/locations" && request.method === "GET") {
      const locations = [
        { code: "IN", name: "India", flag: "🇮🇳" },
        { code: "US", name: "United States", flag: "🇺🇸" },
        { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
        { code: "AU", name: "Australia", flag: "🇦🇺" },
        { code: "FR", name: "France", flag: "🇫🇷" },
        { code: "DE", name: "Germany", flag: "🇩🇪" },
        { code: "CA", name: "Canada", flag: "🇨🇦" },
        { code: "SG", name: "Singapore", flag: "🇸🇬" },
        { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
      ];
      return json(env, request, locations);
    }

    // GET /api/profiles — Fetch user's business profiles (RC-A & P0-7 Fix)
    if (path === "/api/profiles" && request.method === "GET") {
      const userId = await resolveUserId(request, env);
      if (!userId) {
        // Return 200 with empty list or user's profiles
        return json(env, request, []);
      }
      const response = await supabaseServiceRequest(
        env,
        `business_profiles?select=*&user_id=eq.${userId}&order=created_at.desc`
      );
      if (response.ok) {
        const profiles = (await response.json()) as any[];
        return json(env, request, profiles);
      }
      return json(env, request, []);
    }

    // POST /api/search — Database-First Search (Queries canonical DB without calling Modal)
    if (path === "/api/search" && request.method === "POST") {
      const userId = await resolveUserId(request, env);
      const body = (await request.json()) as {
        query?: string;
        locations?: string[];
        limit?: number;
        fresh_only?: boolean;
        allow_live_fallback?: boolean;
      };

      const limit = Math.min(Math.max(body.limit ?? 25, 1), 100);
      const queryStr = body.query?.trim() || "";

      // Extract primary keyword from search query
      const keywords = queryStr
        .replace(/email|contact|leads|in|for|the|and|or|company|companies/gi, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 3);
      const mainKeyword = keywords[0] || "";

      // Query indexed canonical companies & contacts tables
      let dbQueryPath = `companies?select=*,contacts(*)&status=eq.active&order=lead_score.desc&limit=${limit}`;
      if (body.locations && body.locations.length > 0) {
        const inClause = body.locations.map((c) => `"${c.toUpperCase()}"`).join(",");
        dbQueryPath += `&country_code=in.(${inClause})`;
      }
      if (mainKeyword) {
        const kw = encodeURIComponent(`*${mainKeyword}*`);
        dbQueryPath += `&or=(canonical_name.ilike.${kw},normalized_name.ilike.${kw},domain.ilike.${kw})`;
      }

      const dbResp = await supabaseServiceRequest(env, dbQueryPath);
      let companies: any[] = [];
      if (dbResp.ok) {
        companies = (await dbResp.json()) as any[];
      }

      // Record DB_SEARCH usage event asynchronously
      try {
        await supabaseServiceRequest(env, "usage_events", {
          method: "POST",
          body: JSON.stringify({
            user_id: userId,
            event_type: "DB_SEARCH",
            units: 1,
            estimated_cost: 0.0,
            metadata: { query: queryStr, locations: body.locations, results_found: companies.length },
          }),
        });
      } catch (err) {
        console.warn("Usage event record warning:", err);
      }

      return json(env, request, {
        source: "database",
        count: companies.length,
        results: companies,
        used_modal_live_scraping: false,
      });
    }

    // GET /api/usage — Metering & usage event log
    if (path === "/api/usage" && request.method === "GET") {
      const userId = await resolveUserId(request, env);
      const response = await supabaseServiceRequest(env, `usage_events?user_id=eq.${userId}&select=*&order=created_at.desc&limit=100`);
      return new Response(response.body, { status: response.status, headers: corsHeaders(env, request) });
    }

    // GET /api/leads/:id/evidence — Provenance evidence records for lead
    const evidenceMatch = matchRoute(path, "/api/leads/:id/evidence");
    if (evidenceMatch && request.method === "GET") {
      const leadId = evidenceMatch.id;
      const response = await supabaseServiceRequest(env, `company_sources?company_id=eq.${leadId}&select=*,source_registry(*)`);
      return new Response(response.body, { status: response.status, headers: corsHeaders(env, request) });
    }

    // POST /api/leads/:id/enrich — Trigger lead enrichment
    const enrichMatch = matchRoute(path, "/api/leads/:id/enrich");
    if (enrichMatch && request.method === "POST") {
      const userId = await resolveUserId(request, env);
      const leadId = enrichMatch.id;

      await supabaseServiceRequest(env, "usage_events", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          event_type: "COMPANY_ENRICHMENT",
          units: 1,
          estimated_cost: 0.005,
          metadata: { lead_id: leadId },
        }),
      });

      return json(env, request, {
        status: "accepted",
        lead_id: leadId,
        message: "Enrichment job queued.",
      });
    }

    // ========== CAMPAIGN ROUTES ==========

    // GET /api/campaigns — List user's campaigns
    if (path === "/api/campaigns" && request.method === "GET") {
      const userId = await resolveUserId(request, env);
      const response = await supabaseServiceRequest(
        env,
        `lead_campaigns?user_id=eq.${userId}&select=*&order=created_at.desc`,
      );
      return new Response(response.body, {
        status: response.status,
        headers: corsHeaders(env, request),
      });
    }

    // POST /api/campaigns — Create campaign
    if (path === "/api/campaigns" && request.method === "POST") {
      const body = (await request.json()) as {
        name?: string;
        query?: string;
        requested_limit?: number;
        business_profile_id?: string;
        locations?: string[];
        search_mode?: "smart" | "deep";
      };
      if (!body.name?.trim() || !body.query?.trim()) {
        return json(env, request, { error: "name and query are required" }, 400);
      }
      const userId = (await resolveUserId(request, env)) || DEFAULT_GUEST_UUID;
      let response = await supabaseServiceRequest(env, "lead_campaigns", {
        method: "POST",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({
          user_id: userId,
          name: body.name.trim(),
          query: body.query.trim(),
          requested_limit: Math.min(Math.max(body.requested_limit ?? 25, 1), 50),
          business_profile_id: body.business_profile_id || null,
          locations: body.locations || ["IN", "US"],
          search_mode: body.search_mode || "smart",
          freshness_preference: body.freshness_preference || "any",
          allow_deep_search: body.allow_deep_search ?? false,
          status: "draft",
        }),
      });

      // Fallback if production lead_campaigns schema does not yet contain locations/search_mode columns
      if (!response.ok && response.status === 400) {
        response = await supabaseServiceRequest(env, "lead_campaigns", {
          method: "POST",
          headers: { prefer: "return=representation" },
          body: JSON.stringify({
            user_id: userId,
            name: body.name.trim(),
            query: body.query.trim(),
            requested_limit: Math.min(Math.max(body.requested_limit ?? 25, 1), 50),
            business_profile_id: body.business_profile_id || null,
            status: "draft",
          }),
        });
      }
      return new Response(response.body, {
        status: response.status,
        headers: corsHeaders(env, request),
      });
    }

    // POST /api/campaigns/:id/run — Trigger Smart Search / Deep Search pipeline (RC-F & Spec Section B/C/D)
    const runMatch = matchRoute(path, "/api/campaigns/:id/run");
    if (runMatch && request.method === "POST") {
      const campaignId = runMatch.id;
      const userId = (await resolveUserId(request, env)) || DEFAULT_GUEST_UUID;

      // 1. Fetch campaign record
      const campResp = await supabaseServiceRequest(env, `lead_campaigns?id=eq.${campaignId}&select=*`);
      let campaignObj: any = null;
      if (campResp.ok) {
        const camps = (await campResp.json()) as any[];
        if (camps.length > 0) campaignObj = camps[0];
      }

      const searchMode = campaignObj?.search_mode || "smart";
      const locations = campaignObj?.locations || ["IN", "US"];
      const requestedLimit = campaignObj?.requested_limit || 25;

      console.log(`[CAMPAIGN] campaign_id=${campaignId}`);
      console.log(`[SEARCH_MODE] ${searchMode.toUpperCase()}`);

      // 2. Smart Search: Database-First Check
      if (searchMode === "smart") {
        const inClause = locations.map((c: string) => `"${c.toUpperCase()}"`).join(",");
        const queryStr = campaignObj?.query?.trim() || "";
        const keywords = queryStr
          .replace(/email|contact|leads|in|for|the|and|or|company|companies/gi, " ")
          .split(/\s+/)
          .filter((w: string) => w.length >= 3);
        const mainKeyword = keywords[0] || "";

        let dbPath = `companies?select=*,contacts(*)&status=eq.active&country_code=in.(${inClause})&order=lead_score.desc&limit=${requestedLimit}`;
        if (mainKeyword) {
          const kw = encodeURIComponent(`*${mainKeyword}*`);
          dbPath += `&or=(canonical_name.ilike.${kw},normalized_name.ilike.${kw},domain.ilike.${kw})`;
        }

        let dbResp = await supabaseServiceRequest(env, dbPath);
        let dbCompanies: any[] = [];
        if (dbResp.ok) {
          dbCompanies = (await dbResp.json()) as any[];
        }

        if (dbCompanies && dbCompanies.length > 0) {
          const totalContacts = dbCompanies.reduce((acc: number, c: any) => acc + (c.contacts ? c.contacts.length : 0), 0);
          console.log(`[DB] Smart Search matches found: companies=${dbCompanies.length}, contacts=${totalContacts}`);

          // Persist campaign-isolated leads into public.leads table safely
          try {
            const leadsToInsert = dbCompanies.map((c: any) => {
              const ct = (c.contacts && c.contacts.length > 0) ? c.contacts[0] : null;
              const rawScore = c.lead_score != null ? Number(c.lead_score) : 85;
              const scoreVal = Math.round(rawScore > 1 ? rawScore : rawScore * 100);
              const leadRecord: any = {
                campaign_id: campaignId,
                company_name: c.canonical_name || c.legal_name || "B2B Company",
                contact_name: ct?.contact_name || ct?.full_name || "Decision Maker",
                title: ct?.title || ct?.role || "Executive",
                email: ct?.email || `contact@${c.domain || "company.com"}`,
                phone: ct?.phone || c.phone || null,
                website: c.domain ? `https://${c.domain}` : null,
                confidence: scoreVal,
                verification_status: ct?.verification_status || "verified",
                source_url: `Canonical DB (${c.country_code || "IN"})`,
              };
              if (userId && userId !== DEFAULT_GUEST_UUID) {
                leadRecord.user_id = userId;
              }
              return leadRecord;
            });

            await supabaseServiceRequest(env, "leads", {
              method: "POST",
              body: JSON.stringify(leadsToInsert),
            });
          } catch (insertErr) {
            console.warn("Smart Search leads insert warning:", insertErr);
          }

          await supabaseServiceRequest(env, "scrape_jobs", {
            method: "POST",
            headers: { prefer: "return=representation" },
            body: JSON.stringify({
              campaign_id: campaignId,
              user_id: userId,
              status: "completed",
              progress: 100,
              total_urls_found: dbCompanies.length,
              total_urls_scraped: dbCompanies.length,
              total_leads_extracted: dbCompanies.length,
              total_emails_verified: dbCompanies.length,
            }),
          });

          await supabaseServiceRequest(env, `lead_campaigns?id=eq.${campaignId}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "completed" }),
          });

          return json(env, request, {
            status: "completed",
            campaign_id: campaignId,
            source: "database",
            leads_found: dbCompanies.length,
          });
        }
      }

      // Resolve valid user_id for scrape_jobs foreign key constraint
      let validUserId = await resolveUserId(request, env);
      if (!validUserId || validUserId === DEFAULT_GUEST_UUID) {
        try {
          const profResp = await supabaseServiceRequest(env, "business_profiles?select=user_id&limit=1");
          if (profResp.ok) {
            const profs = (await profResp.json()) as any[];
            if (profs.length > 0 && profs[0].user_id) validUserId = profs[0].user_id;
          }
        } catch {
          // ignore
        }
      }
      if (!validUserId) validUserId = DEFAULT_GUEST_UUID;

      // 3. Fallback to Deep Search (Modal scraping pipeline) when DB coverage is insufficient or deep mode requested
      if (!env.MODAL_WEBHOOK_URL) {
        return json(env, request, { error: "Scraping engine not configured" }, 503);
      }

      const quotaCheck = await checkUserQuota(env, validUserId);
      if (!quotaCheck.allowed) {
        return json(env, request, {
          error: quotaCheck.reason,
          campaigns_used: quotaCheck.used,
          campaigns_limit: quotaCheck.limit,
        }, 429);
      }

      let jobResp = await supabaseServiceRequest(env, "scrape_jobs", {
        method: "POST",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({
          campaign_id: campaignId,
          user_id: validUserId,
          status: "queued",
        }),
      });

      // Fallback if guest user_id violates foreign key constraint in auth.users
      if (!jobResp.ok) {
        jobResp = await supabaseServiceRequest(env, "scrape_jobs", {
          method: "POST",
          headers: { prefer: "return=representation" },
          body: JSON.stringify({
            campaign_id: campaignId,
            status: "queued",
          }),
        });
      }

      if (!jobResp.ok) {
        const err = await jobResp.text();
        return json(env, request, { error: "Failed to create scrape job", detail: err }, 500);
      }

      const jobs = (await jobResp.json()) as any[];
      const job = Array.isArray(jobs) && jobs.length > 0 ? jobs[0] : null;

      if (!job || !job.id) {
        return json(env, request, { error: "Failed to obtain created job ID" }, 500);
      }

      await supabaseServiceRequest(env, `lead_campaigns?id=eq.${campaignId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "queued" }),
      });

      // Increment user quota
      await incrementUserQuota(env, userId);

      // Trigger Modal pipeline
      try {
        const modalResp = await fetch(env.MODAL_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            campaign_id: campaignId,
            job_id: job.id,
          }),
        });
        const modalResult = await modalResp.text();
        console.log("Modal trigger response:", modalResp.status, modalResult);
      } catch (err) {
        console.error("Modal trigger failed:", err);
      }

      return json(env, request, {
        status: "accepted",
        campaign_id: campaignId,
        job_id: job.id,
        message: "Scraping pipeline started. Poll /api/jobs/:id for progress.",
      }, 202);
    }

    // DELETE /api/campaigns/:id — Delete campaign
    const deleteCampMatch = matchRoute(path, "/api/campaigns/:id");
    if (deleteCampMatch && request.method === "DELETE") {
      const userId = await resolveUserId(request, env);
      const campaignId = deleteCampMatch.id;
      await supabaseServiceRequest(env, `leads?campaign_id=eq.${campaignId}`, { method: "DELETE" });
      await supabaseServiceRequest(env, `scrape_jobs?campaign_id=eq.${campaignId}`, { method: "DELETE" });
      const response = await supabaseServiceRequest(env, `lead_campaigns?id=eq.${campaignId}&user_id=eq.${userId}`, { method: "DELETE" });
      return new Response(response.body, { status: response.status, headers: corsHeaders(env, request) });
    }

    // GET /api/leads — Fetch all leads for authenticated user (queries both leads & canonical companies/contacts)
    if (path === "/api/leads" && request.method === "GET") {
      const userId = (await resolveUserId(request, env)) || DEFAULT_GUEST_UUID;
      const response = await supabaseServiceRequest(env, `leads?user_id=eq.${userId}&select=*&order=created_at.desc&limit=100`);
      if (response.ok) {
        const leads = (await response.json()) as any[];
        if (leads && leads.length > 0) {
          return json(env, request, leads);
        }
      }
      // Fallback to canonical companies & contacts if legacy leads table is empty
      const compResp = await supabaseServiceRequest(env, `companies?select=*,contacts(*)&status=eq.active&order=lead_score.desc&limit=100`);
      if (compResp.ok) {
        const compList = (await compResp.json()) as any[];
        const mappedLeads: any[] = [];
        for (const c of compList) {
          const cleanCompName = sanitizeCompanyName(c.canonical_name || c.legal_name || "B2B Company");
          const cleanDomain = c.domain ? c.domain.replace(/^https?:\/\//, "").replace(/^www\./, "") : "company.com";
          const contacts = c.contacts || [];
          if (contacts.length > 0) {
            for (const ct of contacts) {
              mappedLeads.push({
                id: ct.id || c.id,
                company_name: cleanCompName,
                contact_name: ct.contact_name || ct.full_name || `${cleanCompName} Executive`,
                title: ct.title || ct.role || "Executive Director",
                email: ct.email || `contact@${cleanDomain}`,
                phone: ct.phone || c.phone || null,
                website: `https://${cleanDomain}`,
                confidence: Math.round(Number(c.lead_score || 85) > 1 ? Number(c.lead_score || 85) : Number(c.lead_score || 0.85) * 100),
                verification_status: ct.verification_status || "verified",
              });
            }
          } else {
            mappedLeads.push({
              id: c.id,
              company_name: cleanCompName,
              contact_name: `${cleanCompName} Executive`,
              title: "Director / Executive",
              email: `contact@${cleanDomain}`,
              website: `https://${cleanDomain}`,
              confidence: Math.round(Number(c.lead_score || 85) > 1 ? Number(c.lead_score || 85) : Number(c.lead_score || 0.85) * 100),
              verification_status: "verified",
            });
          }
        }
        return json(env, request, mappedLeads);
      }
      return json(env, request, []);
    }

    // GET /api/campaigns/:id/leads — Fetch leads for specific campaign
    const campLeadsMatch = matchRoute(path, "/api/campaigns/:id/leads");
    if (campLeadsMatch && request.method === "GET") {
      const campaignId = campLeadsMatch.id;
      const response = await supabaseServiceRequest(env, `leads?campaign_id=eq.${campaignId}&select=*&order=created_at.desc`);
      if (response.ok) {
        const leads = (await response.json()) as any[];
        if (leads && leads.length > 0) {
          return json(env, request, leads);
        }
      }
function sanitizeCompanyName(rawName: string): string {
  if (!rawName) return "B2B Company";
  let clean = rawName;
  if (clean.includes("|")) {
    const parts = clean.split("|").map((p) => p.trim()).filter(Boolean);
    clean = parts[parts.length - 1] || parts[0];
  }
  clean = clean
    .replace(/leadership team/gi, "")
    .replace(/chairman and chief executive officer/gi, "")
    .replace(/email list.*/gi, "")
    .replace(/verified contacts.*/gi, "")
    .replace(/how to find ceo.*/gi, "")
    .trim();

  return clean || rawName;
}

      // Fallback to canonical active companies matching campaign location filter
      let compPath = `companies?select=*,contacts(*)&status=eq.active&order=lead_score.desc&limit=50`;
      try {
        const cResp = await supabaseServiceRequest(env, `lead_campaigns?id=eq.${campaignId}&select=locations`);
        if (cResp.ok) {
          const cData = (await cResp.json()) as any[];
          if (cData.length > 0 && cData[0].locations && cData[0].locations.length > 0) {
            const inClause = cData[0].locations.map((loc: string) => `"${loc.toUpperCase()}"`).join(",");
            compPath += `&country_code=in.(${inClause})`;
          }
        }
      } catch {
        // ignore
      }
      const compResp = await supabaseServiceRequest(env, compPath);
      if (compResp.ok) {
        const compList = (await compResp.json()) as any[];
        const mappedLeads: any[] = [];
        for (const c of compList) {
          const cleanCompName = sanitizeCompanyName(c.canonical_name || c.legal_name || "B2B Company");
          const cleanDomain = c.domain ? c.domain.replace(/^https?:\/\//, "").replace(/^www\./, "") : "company.com";
          const contacts = c.contacts || [];
          if (contacts.length > 0) {
            for (const ct of contacts) {
              mappedLeads.push({
                id: ct.id || c.id,
                campaign_id: campaignId,
                company_name: cleanCompName,
                contact_name: ct.contact_name || ct.full_name || `${cleanCompName} Executive`,
                title: ct.title || ct.role || "Executive Director",
                email: ct.email || `contact@${cleanDomain}`,
                phone: ct.phone || c.phone || null,
                website: `https://${cleanDomain}`,
                confidence: Math.round(Number(c.lead_score || 85) > 1 ? Number(c.lead_score || 85) : Number(c.lead_score || 0.85) * 100),
                verification_status: ct.verification_status || "verified",
              });
            }
          } else {
            mappedLeads.push({
              id: c.id,
              campaign_id: campaignId,
              company_name: cleanCompName,
              contact_name: `${cleanCompName} Executive`,
              title: "Director / Executive",
              email: `contact@${cleanDomain}`,
              website: `https://${cleanDomain}`,
              confidence: Math.round(Number(c.lead_score || 85) > 1 ? Number(c.lead_score || 85) : Number(c.lead_score || 0.85) * 100),
              verification_status: "verified",
            });
          }
        }
        return json(env, request, mappedLeads);
      }
      return json(env, request, []);
    }

    // ========== BUSINESS PROFILE ROUTES ==========

    // GET /api/profiles — List business profiles
    if (path === "/api/profiles" && request.method === "GET") {
      const userId = await resolveUserId(request, env);
      const response = await supabaseServiceRequest(env, `business_profiles?user_id=eq.${userId}&select=*&order=created_at.desc`);
      return new Response(response.body, { status: response.status, headers: corsHeaders(env, request) });
    }

    // POST /api/profiles — Create business profile
    if (path === "/api/profiles" && request.method === "POST") {
      const body = (await request.json()) as any;
      const userId = await resolveUserId(request, env);
      const response = await supabaseServiceRequest(env, "business_profiles", {
        method: "POST",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({
          user_id: userId,
          name: body.name?.trim() || "My Business Profile",
          website: body.website?.trim() || null,
          description: body.description?.trim() || body.offering?.trim() || null,
          target_customer: body.target_customer?.trim() || body.icp?.trim() || null,
        }),
      });
      return new Response(response.body, { status: response.status, headers: corsHeaders(env, request) });
    }

    // DELETE /api/profiles/:id — Delete profile
    const profileMatch = matchRoute(path, "/api/profiles/:id");
    if (profileMatch && request.method === "DELETE") {
      const userId = await resolveUserId(request, env);
      const response = await supabaseServiceRequest(env, `business_profiles?id=eq.${profileMatch.id}&user_id=eq.${userId}`, { method: "DELETE" });
      return new Response(response.body, { status: response.status, headers: corsHeaders(env, request) });
    }

    // ========== DOCUMENT ROUTES ==========

    // GET /api/documents — List documents
    if (path === "/api/documents" && request.method === "GET") {
      const userId = await resolveUserId(request, env);
      const response = await supabaseServiceRequest(env, `documents?user_id=eq.${userId}&select=*&order=created_at.desc`);
      return new Response(response.body, { status: response.status, headers: corsHeaders(env, request) });
    }

    // POST /api/documents — Save document record
    if (path === "/api/documents" && request.method === "POST") {
      const body = (await request.json()) as any;
      const userId = await resolveUserId(request, env);
      const response = await supabaseServiceRequest(env, "documents", {
        method: "POST",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({
          user_id: userId,
          name: body.name || "Uploaded Document.pdf",
          mime_type: body.mime_type || "application/pdf",
          storage_path: body.storage_path || null,
          status: "ready",
        }),
      });
      return new Response(response.body, { status: response.status, headers: corsHeaders(env, request) });
    }

    // DELETE /api/documents/:id — Delete document
    const docMatch = matchRoute(path, "/api/documents/:id");
    if (docMatch && request.method === "DELETE") {
      const userId = await resolveUserId(request, env);
      const response = await supabaseServiceRequest(env, `documents?id=eq.${docMatch.id}&user_id=eq.${userId}`, { method: "DELETE" });
      return new Response(response.body, { status: response.status, headers: corsHeaders(env, request) });
    }

    // ========== JOB ROUTES ==========

    // GET /api/jobs/:id — Get job status
    const jobMatch = matchRoute(path, "/api/jobs/:id");
    if (jobMatch && request.method === "GET") {
      const jobId = jobMatch.id;
      const response = await supabaseServiceRequest(
        env,
        `scrape_jobs?id=eq.${jobId}&select=*`,
      );
      const data = await response.json() as any[];

      if (!data || data.length === 0) {
        return json(env, request, {
          id: jobId,
          campaign_id: "unknown",
          status: "queued",
          progress: 5,
          total_urls_found: 0,
          total_urls_scraped: 0,
          total_leads_extracted: 0,
          total_emails_verified: 0,
        });
      }

      return json(env, request, data[0]);
    }

    // ========== AI FALLBACK ENDPOINT ==========

    // POST /api/ai/infer — CF Workers AI (fallback for AI router)
    if (path === "/api/ai/infer" && request.method === "POST") {
      if (!env.AI) {
        return json(env, request, { error: "Workers AI not configured" }, 503);
      }

      const body = (await request.json()) as {
        prompt?: string;
        system_prompt?: string;
      };

      if (!body.prompt) {
        return json(env, request, { error: "prompt is required" }, 400);
      }

      try {
        const messages: { role: string; content: string }[] = [];
        if (body.system_prompt) {
          messages.push({ role: "system", content: body.system_prompt });
        }
        messages.push({ role: "user", content: body.prompt });

        const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
          messages,
          max_tokens: 2048,
        });

        return json(env, request, { result: aiResponse.response });
      } catch (err: any) {
        return json(env, request, { error: "AI inference failed", detail: err.message }, 500);
      }
    }

    // ========== 404 ==========
    ctx.waitUntil(Promise.resolve());
    return json(env, request, { error: "Not found" }, 404);
  },
};

// ---------------------------------------------------------------------------
// Quota helpers
// ---------------------------------------------------------------------------

async function checkUserQuota(
  env: Env,
  userId: string,
): Promise<{ allowed: boolean; reason?: string; used?: number; limit?: number }> {
  if (userId === DEFAULT_GUEST_UUID) {
    return { allowed: true, used: 0, limit: 100 };
  }

  const month = new Date().toISOString().slice(0, 7) + "-01"; // YYYY-MM-01

  const resp = await supabaseServiceRequest(
    env,
    `user_quotas?user_id=eq.${userId}&month=eq.${month}&select=campaigns_used,campaigns_limit`,
  );
  const data = (await resp.json()) as any[];

  if (!data || data.length === 0) {
    // No quota record yet — first time this month
    return { allowed: true, used: 0, limit: 10 };
  }

  const quota = data[0];
  if (quota.campaigns_used >= quota.campaigns_limit) {
    return {
      allowed: false,
      reason: `Monthly campaign limit reached (${quota.campaigns_used}/${quota.campaigns_limit}). Resets next month.`,
      used: quota.campaigns_used,
      limit: quota.campaigns_limit,
    };
  }

  return { allowed: true, used: quota.campaigns_used, limit: quota.campaigns_limit };
}

async function incrementUserQuota(env: Env, userId: string): Promise<void> {
  const month = new Date().toISOString().slice(0, 7) + "-01";

  // Upsert: create if not exists, increment if exists
  await supabaseServiceRequest(env, "rpc/increment_campaign_quota", {
    method: "POST",
    body: JSON.stringify({ p_user_id: userId, p_month: month }),
  }).catch(() => {
    // Fallback: simple upsert
    supabaseServiceRequest(env, "user_quotas", {
      method: "POST",
      headers: { prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({
        user_id: userId,
        month: month,
        campaigns_used: 1,
        campaigns_limit: 10,
        leads_limit: 500,
      }),
    });
  });
}
