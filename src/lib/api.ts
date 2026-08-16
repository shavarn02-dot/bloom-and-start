/**
 * LeadFlowX API Client
 * Connects React UI to Cloudflare Worker API & Supabase
 * Spec Reference: RC-2.1 Environment-controlled API origin, RC-A Profiles Contract, RC-C/D Campaign Payload
 */

import { supabase } from "@/lib/supabase";

export const API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL ||
  "https://leadflowx-api.sarthak2005shavarn.workers.dev";

/** Helper to attach Supabase JWT & user email to API requests for data isolation */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }
    const userEmail = session?.user?.email || localStorage.getItem("leadgen_user_email");
    if (userEmail) {
      headers["X-User-Email"] = userEmail;
    }
  } catch {
    // fallback if supabase client fails
  }
  return headers;
}

export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  return fetch(url, {
    ...init,
    headers: {
      ...authHeaders,
      ...(init.headers || {}),
    },
  });
}

export interface BusinessProfile {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  target_customer?: string;
  created_at?: string;
}

export interface Campaign {
  id: string;
  name: string;
  query: string;
  status: "draft" | "queued" | "running" | "completed" | "failed" | "paused";
  requested_limit: number;
  locations?: string[];
  search_mode?: "smart" | "deep";
  created_at: string;
}

export interface PremiumOrder {
  key_id: string;
  order_id: string;
  amount: number;
  currency: string;
  plan: "premium";
}

export interface SearchQuota {
  plan: "free" | "premium";
  searches_used: number;
  searches_limit: number;
  searches_remaining: number;
  leads_per_search_limit: number;
  monthly_leads_limit: number;
  month: string;
}

export interface ScrapeJob {
  id: string;
  campaign_id: string;
  status: "queued" | "running" | "extracting" | "verifying" | "scoring" | "completed" | "failed";
  progress: number;
  total_urls_found: number;
  total_urls_scraped: number;
  total_leads_extracted: number;
  total_emails_verified: number;
  error_message?: string;
}

export interface Lead {
  id: string;
  campaign_id: string;
  company_name: string;
  contact_name?: string;
  title?: string;
  email?: string;
  phone?: string;
  website?: string;
  source_url?: string;
  confidence?: number;
  verification_status:
    "unverified" | "pending" | "verified" | "rejected" | "risky" | "stale" | "suppressed";
  metadata?: any;
}

/** Create a Razorpay premium order on the server. */
export async function createPremiumOrder(): Promise<PremiumOrder> {
  const resp = await authFetch(`${API_BASE}/api/billing/create-order`, { method: "POST" });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "Unable to create premium order");
    throw new Error(detail);
  }
  return resp.json();
}

/** Verify Razorpay Checkout response and activate premium on the server. */
export async function verifyPremiumPayment(payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ status: string; plan: "premium"; payment_id: string }> {
  const resp = await authFetch(`${API_BASE}/api/billing/verify`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "Unable to verify payment");
    throw new Error(detail);
  }
  return resp.json();
}

/** Fetch the current user's monthly search quota. */
export async function getSearchQuota(): Promise<SearchQuota> {
  const resp = await authFetch(`${API_BASE}/api/quota`);
  if (!resp.ok) throw new Error("Unable to load search quota");
  return resp.json();
}

/** RC-A: Fetch user business profiles from Worker API */
export async function getProfiles(): Promise<BusinessProfile[]> {
  try {
    const resp = await authFetch(`${API_BASE}/api/profiles`);
    if (resp.ok) {
      return await resp.json();
    }
  } catch (err) {
    console.warn("getProfiles API call error:", err);
  }
  return [];
}

/** RC-C & RC-D: Create campaign transmitting locations and search_mode */
export async function createCampaign(
  name: string,
  query: string,
  requestedLimit = 25,
  profileId?: string,
  locations: string[] = ["IN", "US"],
  searchMode: "smart" | "deep" = "smart",
): Promise<Campaign> {
  const resp = await authFetch(`${API_BASE}/api/campaigns`, {
    method: "POST",
    body: JSON.stringify({
      name,
      query,
      requested_limit: requestedLimit,
      business_profile_id: profileId || null,
      locations,
      search_mode: searchMode,
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "Unknown error");
    console.error(`createCampaign failed (${resp.status}):`, errBody);
    throw new Error(`Campaign creation failed (${resp.status}): ${errBody}`);
  }

  const data = await resp.json();
  if (Array.isArray(data) && data.length > 0) return data[0];
  if (data && data.id) return data;
  throw new Error("Unexpected response from campaign creation");
}

export async function runCampaign(
  campaignId: string,
): Promise<{ status: string; job_id: string; leads_found?: number }> {
  const resp = await authFetch(`${API_BASE}/api/campaigns/${campaignId}/run`, {
    method: "POST",
  });

  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "Unknown error");
    console.error(`runCampaign failed (${resp.status}):`, errBody);
    throw new Error(`Run campaign failed (${resp.status}): ${errBody}`);
  }

  return resp.json();
}

export async function getJobStatus(jobId: string): Promise<ScrapeJob> {
  const resp = await authFetch(`${API_BASE}/api/jobs/${jobId}`);
  if (!resp.ok) throw new Error("Failed to get job status");
  return resp.json();
}

export async function getCampaignLeads(campaignId: string): Promise<Lead[]> {
  const resp = await authFetch(`${API_BASE}/api/campaigns/${campaignId}/leads`);
  if (!resp.ok) throw new Error("Failed to get leads");
  return resp.json();
}
