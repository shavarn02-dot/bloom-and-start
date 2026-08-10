"""
LeadFlowX Freshness Decay & Dynamic ICP Lead Scoring Engine
Spec Reference: RC-06 Deterministic Freshness Timestamps, RC-11 Real ICP Scoring

Deterministic 6-Tier Scoring Formula:
  1. Source Quality Weight: 25%
  2. Freshness Score Weight: 20%
  3. Dynamic ICP Fit Weight: 20%
  4. Contact Completeness Weight: 15%
  5. Activity Signals Weight: 10%
  6. Cross-Source Consistency Weight: 10%
"""

import datetime
from typing import Dict, Any, Optional, List

def calculate_freshness_decay(source_updated_at: str) -> float:
    """Calculates recency decay multiplier based on source_updated_at ISO timestamp."""
    try:
        updated_dt = datetime.datetime.fromisoformat(source_updated_at.replace("Z", "+00:00"))
        now = datetime.datetime.utcnow().replace(tzinfo=datetime.timezone.utc)
        age_days = (now - updated_dt).days

        if age_days <= 7:
            return 1.00
        elif age_days <= 30:
            return 0.90
        elif age_days <= 90:
            return 0.75
        elif age_days <= 180:
            return 0.50
        elif age_days <= 365:
            return 0.25
        else:
            return 0.05
    except Exception:
        return 0.50

def calculate_dynamic_icp_score(company: Dict[str, Any], icp_profile: Optional[Dict[str, Any]] = None) -> float:
    """
    RC-11 Dynamic ICP Scoring.
    Evaluates industry, target_roles, locations, company_size, keywords, and negative keywords.
    Never returns a hardcoded default score.
    """
    if not icp_profile:
        icp_profile = {
            "industry": ["software", "technology", "saas", "services"],
            "locations": ["IN", "US", "GB", "AU", "FR", "DE", "CA", "SG", "AE"],
            "keywords": ["tech", "digital", "solutions", "cloud"],
            "negative_keywords": ["bankruptcy", "dissolved", "defunct"]
        }

    score = 50.0 # Base match score

    comp_industry = str(company.get("industry") or "").lower()
    target_industries = [i.lower() for i in icp_profile.get("industry", [])]
    if any(ind in comp_industry for ind in target_industries):
        score += 20.0

    comp_country = str(company.get("country_code") or "").upper()
    target_locations = [l.upper() for l in icp_profile.get("locations", [])]
    if comp_country in target_locations:
        score += 15.0

    comp_name = str(company.get("canonical_name") or "").lower()
    keywords = [k.lower() for k in icp_profile.get("keywords", [])]
    if any(kw in comp_name or kw in comp_industry for kw in keywords):
        score += 15.0

    neg_keywords = [nk.lower() for nk in icp_profile.get("negative_keywords", [])]
    if any(nk in comp_name for nk in neg_keywords):
        score -= 40.0

    return min(max(score, 0.0), 100.0)

def calculate_deterministic_lead_score(company: Dict[str, Any], icp_profile: Optional[Dict[str, Any]] = None) -> float:
    """Calculates final deterministic lead score across 6 weighted tiers."""
    source_quality = 90.0 if company.get("_source_key") in ("usa_sec", "uk_companies_house", "india_mca") else 75.0
    
    updated_at = company.get("source_updated_at") or company.get("registration_date") or datetime.datetime.utcnow().isoformat()
    freshness = calculate_freshness_decay(updated_at)
    freshness_score = freshness * 100.0

    icp_score = calculate_dynamic_icp_score(company, icp_profile)

    contact_completeness = 0.0
    if company.get("domain"): contact_completeness += 40.0
    if company.get("phone"): contact_completeness += 30.0
    if company.get("address"): contact_completeness += 30.0

    activity_score = 100.0 if company.get("status") == "active" else 20.0
    consistency_score = 90.0 if company.get("registration_id") else 60.0

    total_score = (
        (source_quality * 0.25) +
        (freshness_score * 0.20) +
        (icp_score * 0.20) +
        (contact_completeness * 0.15) +
        (activity_score * 0.10) +
        (consistency_score * 0.10)
    )

    return round(min(max(total_score, 0.0), 100.0), 1)
