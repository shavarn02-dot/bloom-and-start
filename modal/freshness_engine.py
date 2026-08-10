"""
LeadFlowX Freshness Decay Engine & Deterministic Lead Scoring
Spec Reference: Section 16 (Freshness Engine) & Section 21 (Lead Score)
"""

import datetime
from typing import Dict, Any, Optional

def calculate_freshness_decay(last_updated_at: Optional[str]) -> float:
    """Calculates freshness score (0.05 - 1.00) based on record recency."""
    if not last_updated_at:
        return 0.50

    try:
        if isinstance(last_updated_at, str):
            dt = datetime.datetime.fromisoformat(last_updated_at.replace("Z", "+00:00"))
        else:
            dt = last_updated_at
        now = datetime.datetime.now(datetime.timezone.utc)
        days_old = (now - dt).days

        if days_old <= 7:
            return 1.00
        elif days_old <= 30:
            return 0.90
        elif days_old <= 90:
            return 0.75
        elif days_old <= 180:
            return 0.50
        elif days_old <= 365:
            return 0.25
        else:
            return 0.05
    except Exception:
        return 0.50

def calculate_deterministic_lead_score(company: Dict[str, Any], icp_fit_score: float = 80.0) -> float:
    """
    Computes deterministic lead score (0 - 100) combining:
    - 25% Source Quality
    - 20% Freshness Score
    - 20% ICP Fit Score
    - 15% Contact Completeness Score
    - 10% Recent Activity Score
    - 10% Cross-Source Consistency Score
    Enforces hard penalties for inactive, stale, or suppressed records.
    """
    # Hard Penalty 1: Authoritative Inactive / Dissolved -> Suppress
    if company.get("status") in ("inactive", "dissolved", "cancelled"):
        return 0.0

    source_quality = float(company.get("source_quality_score", 80.0))
    freshness = calculate_freshness_decay(company.get("last_seen_at") or company.get("updated_at")) * 100.0
    icp_fit = float(icp_fit_score)
    contact_completeness = float(company.get("contact_completeness_score", 50.0 if company.get("phone") or company.get("domain") else 20.0))
    recent_activity = 90.0 if freshness >= 75.0 else 40.0
    cross_source = float(company.get("cross_source_consistency_score", 90.0))

    score = (
        (0.25 * source_quality) +
        (0.20 * freshness) +
        (0.20 * icp_fit) +
        (0.15 * contact_completeness) +
        (0.10 * recent_activity) +
        (0.10 * cross_source)
    )

    # Penalty for very stale records (>365d)
    if freshness <= 5.0:
        score -= 25.0

    return max(0.0, min(100.0, round(score, 2)))
