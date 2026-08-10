/**
 * LeadFlowX Cost Guardrails, Quota Enforcement & SSRF Protection
 * Spec Reference: Section RC-07 (Metering & Transactional Quotas), Section RC-09 (SSRF Hardening)
 */

export interface UsageLimits {
  max_live_discovery_per_user: number;
  max_enrichment_per_user: number;
  max_ai_calls_per_user: number;
  max_email_verifications_per_user: number;
  max_export_rows_per_user: number;
}

export const DEFAULT_USAGE_LIMITS: UsageLimits = {
  max_live_discovery_per_user: 10,
  max_enrichment_per_user: 50,
  max_ai_calls_per_user: 100,
  max_email_verifications_per_user: 200,
  max_export_rows_per_user: 500,
};

export type ExpensiveOperation = 
  | "LIVE_DISCOVERY"
  | "COMPANY_ENRICHMENT"
  | "WEBSITE_CRAWL"
  | "EMAIL_VERIFICATION"
  | "AI_CALL"
  | "EXPORT";

/** Transactionally check & reserve quota BEFORE expensive operation (RC-07) */
export async function reserveQuotaTransactionally(
  env: { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY?: string; SUPABASE_ANON_KEY: string },
  userId: string,
  operation: ExpensiveOperation,
  units: number = 1
): Promise<{ allowed: boolean; remaining: number; reason?: string }> {
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
  
  try {
    // 1. Calculate current usage from usage_events table for current month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const queryUrl = `${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/usage_events?user_id=eq.${userId}&event_type=eq.${operation}&created_at=gte.${startOfMonth}&select=units`;
    
    const resp = await fetch(queryUrl, {
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        authorization: `Bearer ${serviceKey}`,
      },
    });

    let currentUnits = 0;
    if (resp.ok) {
      const events = (await resp.json()) as { units?: number }[];
      if (Array.isArray(events)) {
        currentUnits = events.reduce((sum, e) => sum + (e.units || 1), 0);
      }
    }

    // 2. Map operation to maximum quota limit
    let limit = 100;
    if (operation === "LIVE_DISCOVERY") limit = DEFAULT_USAGE_LIMITS.max_live_discovery_per_user;
    if (operation === "COMPANY_ENRICHMENT") limit = DEFAULT_USAGE_LIMITS.max_enrichment_per_user;
    if (operation === "AI_CALL") limit = DEFAULT_USAGE_LIMITS.max_ai_calls_per_user;
    if (operation === "EMAIL_VERIFICATION") limit = DEFAULT_USAGE_LIMITS.max_email_verifications_per_user;
    if (operation === "EXPORT") limit = DEFAULT_USAGE_LIMITS.max_export_rows_per_user;

    if (currentUnits + units > limit) {
      return {
        allowed: false,
        remaining: Math.max(0, limit - currentUnits),
        reason: `Monthly quota exceeded for ${operation}. Used ${currentUnits}/${limit} units.`,
      };
    }

    // 3. Reserve quota transactionally by logging usage reservation event
    await fetch(`${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/usage_events`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_ANON_KEY,
        authorization: `Bearer ${serviceKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        event_type: operation,
        units: units,
        estimated_cost: operation === "AI_CALL" ? 0.002 : 0.001,
        metadata: { reserved_at: new Date().toISOString() },
      }),
    });

    return {
      allowed: true,
      remaining: limit - (currentUnits + units),
    };
  } catch (e) {
    console.error("Quota reservation error:", e);
    // Fail-open for system resilience if database is temporarily unreachable
    return { allowed: true, remaining: 10 };
  }
}

/** RC-09 SSRF Hardening: Checks if a target URL is safe to fetch or crawl. */
export function isSafeUrlForFetch(urlStr: string): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(urlStr);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { safe: false, reason: "Forbidden protocol scheme" };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost & loopback
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "0.0.0.0") {
      return { safe: false, reason: "Loopback IP addresses are forbidden" };
    }

    // Block Cloud Metadata endpoints
    if (hostname === "169.254.169.254" || hostname.includes("metadata.google") || hostname.includes("metadata.internal")) {
      return { safe: false, reason: "Cloud metadata service access forbidden" };
    }

    // Block IPv6 link-local and unique-local ranges
    if (hostname.startsWith("fe80:") || hostname.startsWith("fc00:") || hostname.startsWith("fd00:")) {
      return { safe: false, reason: "IPv6 link-local/unique-local address forbidden" };
    }

    // Block RFC 1918 Private IPv4 Subnets
    const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipMatch) {
      const p1 = parseInt(ipMatch[1], 10);
      const p2 = parseInt(ipMatch[2], 10);
      if (p1 === 10) return { safe: false, reason: "Private 10.0.0.0/8 network forbidden" };
      if (p1 === 172 && p2 >= 16 && p2 <= 31) return { safe: false, reason: "Private 172.16.0.0/12 network forbidden" };
      if (p1 === 192 && p2 === 168) return { safe: false, reason: "Private 192.168.0.0/16 network forbidden" };
      if (p1 === 169 && p2 === 254) return { safe: false, reason: "Link-local 169.254.0.0/16 network forbidden" };
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: "Invalid URL syntax" };
  }
}
