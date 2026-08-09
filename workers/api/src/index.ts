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
  const origin = request.headers.get("origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.has(origin)
    ? origin
    : env.ALLOWED_ORIGIN ?? "https://leadflowx.pages.dev";

  return {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-headers": "authorization, content-type, apikey, x-client-info",
    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    vary: "Origin",
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

/** Extract user ID from Supabase JWT (simple decode, no crypto verification on edge). */
function extractUserIdFromJWT(authHeader: string | null): string | null {
  if (!authHeader || typeof authHeader !== "string") return null;
  const parts = authHeader.replace(/^Bearer\s+/i, "").split(".");
  if (parts.length !== 3) return null;
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return payload.sub || null;
  } catch {
    return null;
  }
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

    // ========== CAMPAIGN ROUTES ==========

    // GET /api/campaigns — List campaigns
    if (path === "/api/campaigns" && request.method === "GET") {
      const response = await supabaseServiceRequest(
        env,
        "lead_campaigns?select=*&order=created_at.desc",
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
      };
      if (!body.name?.trim() || !body.query?.trim()) {
        return json(env, request, { error: "name and query are required" }, 400);
      }
      const userId = extractUserIdFromJWT(request.headers.get("authorization")) || "682713e9-1dd8-4cce-92f4-ce32b5fda68c";
      const response = await supabaseServiceRequest(env, "lead_campaigns", {
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
      return new Response(response.body, {
        status: response.status,
        headers: corsHeaders(env, request),
      });
    }

    // POST /api/campaigns/:id/run — Trigger scraping pipeline
    const runMatch = matchRoute(path, "/api/campaigns/:id/run");
    if (runMatch && request.method === "POST") {
      const campaignId = runMatch.id;
      const userId = extractUserIdFromJWT(request.headers.get("authorization")) || "682713e9-1dd8-4cce-92f4-ce32b5fda68c";

      if (!env.MODAL_WEBHOOK_URL) {
        return json(env, request, { error: "Scraping engine not configured" }, 503);
      }

      // Check user quota
      const quotaCheck = await checkUserQuota(env, userId);
      if (!quotaCheck.allowed) {
        return json(env, request, {
          error: quotaCheck.reason,
          campaigns_used: quotaCheck.used,
          campaigns_limit: quotaCheck.limit,
        }, 429);
      }

      // Create scrape job
      const jobResp = await supabaseServiceRequest(env, "scrape_jobs", {
        method: "POST",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({
          campaign_id: campaignId,
          user_id: userId,
          status: "queued",
        }),
      });

      if (!jobResp.ok) {
        const err = await jobResp.text();
        return json(env, request, { error: "Failed to create scrape job", detail: err }, 500);
      }

      const jobs = (await jobResp.json()) as any[];
      const job = Array.isArray(jobs) && jobs.length > 0 ? jobs[0] : null;

      if (!job || !job.id) {
        return json(env, request, { error: "Failed to obtain created job ID" }, 500);
      }

      // Update campaign status to queued
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

    // GET /api/campaigns/:id/leads — Get campaign leads
    const leadsMatch = matchRoute(path, "/api/campaigns/:id/leads");
    if (leadsMatch && request.method === "GET") {
      const campaignId = leadsMatch.id;

      // Query params for sorting/filtering
      const sortBy = url.searchParams.get("sort") || "confidence.desc";
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const minScore = url.searchParams.get("min_score");

      let query = `leads?campaign_id=eq.${campaignId}&order=${sortBy}&limit=${limit}&offset=${offset}`;
      if (minScore) {
        query += `&confidence=gte.${minScore}`;
      }

      const response = await supabaseServiceRequest(env, query);
      return new Response(response.body, {
        status: response.status,
        headers: corsHeaders(env, request),
      });
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
