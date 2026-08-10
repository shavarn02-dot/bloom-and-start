/**
 * LeadFlowX Cost Guardrails, Quota Enforcement & SSRF Protection
 * Spec Reference: Section 3 (Cost Target), Section 26 (Metering), Section 27 (Security)
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

/** SSRF Protection: Checks if a target URL is safe to fetch or crawl. */
export function isSafeUrlForFetch(urlStr: string): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(urlStr);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { safe: false, reason: "Forbidden protocol" };
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

    // Block RFC 1918 Private Subnets
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
