/**
 * LeadFlowX API Client
 * Connects React UI to Cloudflare Worker API & Supabase
 */

export const API_BASE = "https://leadgen-api.sarthak2005shavarn.workers.dev";

export interface Campaign {
  id: string;
  name: string;
  query: string;
  status: 'draft' | 'queued' | 'running' | 'completed' | 'failed' | 'paused';
  requested_limit: number;
  created_at: string;
}

export interface ScrapeJob {
  id: string;
  campaign_id: string;
  status: 'queued' | 'running' | 'extracting' | 'verifying' | 'scoring' | 'completed' | 'failed';
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
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  metadata?: any;
}

export async function createCampaign(name: string, query: string, requestedLimit = 25): Promise<Campaign> {
  const resp = await fetch(`${API_BASE}/api/campaigns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, query, requested_limit: requestedLimit }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Failed to create campaign: ${err}`);
  }
  return resp.json();
}

export async function runCampaign(campaignId: string): Promise<{ status: string; job_id: string }> {
  // Use anonymous authorization token if user not logged in
  const resp = await fetch(`${API_BASE}/api/campaigns/${campaignId}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer anon-token-user",
    },
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Failed to run campaign: ${err}`);
  }
  return resp.json();
}

export async function getJobStatus(jobId: string): Promise<ScrapeJob> {
  const resp = await fetch(`${API_BASE}/api/jobs/${jobId}`);
  if (!resp.ok) {
    throw new Error("Failed to fetch job status");
  }
  return resp.json();
}

export async function getCampaignLeads(campaignId: string): Promise<Lead[]> {
  const resp = await fetch(`${API_BASE}/api/campaigns/${campaignId}/leads`);
  if (!resp.ok) {
    throw new Error("Failed to fetch leads");
  }
  return resp.json();
}
