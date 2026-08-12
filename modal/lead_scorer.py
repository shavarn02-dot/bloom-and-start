"""
Lead Scorer — rule-based + optional LLM enhancement.

API-independent scoring: pure Python rules that NEVER fail.
LLM enhancement is additive (improves score if available, but not required).

Scoring dimensions:
  1. Company match (industry, size, location)  → 0-30 pts
  2. Contact quality (name, title, email)      → 0-30 pts
  3. Email quality (verified, business domain) → 0-25 pts
  4. Data completeness                         → 0-15 pts
  Total: 0-100

Deduplication: by (email, company_name) pair.
"""

from __future__ import annotations

import hashlib
import logging
import re
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger("lead_scorer")


# ---------------------------------------------------------------------------
# Scoring config
# ---------------------------------------------------------------------------

@dataclass
class ICPProfile:
    """Ideal Customer Profile — what the business is looking for."""
    target_industry: str = ""
    target_industries: list[str] = field(default_factory=list)
    target_location: str = ""
    target_locations: list[str] = field(default_factory=list)
    target_company_sizes: list[str] = field(default_factory=list)  # small, medium, large, enterprise
    target_titles: list[str] = field(default_factory=list)  # CEO, CTO, Manager, etc.
    keywords: list[str] = field(default_factory=list)  # ICP-specific keywords
    description: str = ""


@dataclass
class LeadData:
    """A single lead to be scored."""
    company_name: str = ""
    contact_name: str = ""
    title: str = ""
    email: str = ""
    phone: str = ""
    company_industry: str = ""
    company_size: str = ""
    company_location: str = ""
    website: str = ""
    source_url: str = ""
    email_verification: dict = field(default_factory=dict)
    description: str = ""


@dataclass
class ScoredLead:
    """Lead with computed scores."""
    lead: LeadData
    total_score: int = 0
    company_score: int = 0
    contact_score: int = 0
    email_score: int = 0
    completeness_score: int = 0
    breakdown: dict = field(default_factory=dict)
    dedup_key: str = ""


# ---------------------------------------------------------------------------
# Company match scoring (0-30)
# ---------------------------------------------------------------------------

def _score_company(lead: LeadData, icp: ICPProfile) -> tuple[int, dict]:
    """Score company fit against ICP."""
    score = 0
    breakdown = {}

    # Industry match (0-15)
    if lead.company_industry:
        lead_ind = lead.company_industry.lower()
        target_inds = [icp.target_industry.lower()] + [i.lower() for i in icp.target_industries]
        target_inds = [i for i in target_inds if i]

        if any(ind in lead_ind or lead_ind in ind for ind in target_inds):
            score += 15
            breakdown["industry_match"] = "exact"
        elif any(_fuzzy_match(lead_ind, ind) for ind in target_inds):
            score += 8
            breakdown["industry_match"] = "partial"
        else:
            breakdown["industry_match"] = "none"
    else:
        breakdown["industry_match"] = "unknown"

    # Location match (0-10)
    if lead.company_location:
        lead_loc = lead.company_location.lower()
        target_locs = [icp.target_location.lower()] + [l.lower() for l in icp.target_locations]
        target_locs = [l for l in target_locs if l]

        if any(loc in lead_loc or lead_loc in loc for loc in target_locs):
            score += 10
            breakdown["location_match"] = "exact"
        elif any(_fuzzy_match(lead_loc, loc) for loc in target_locs):
            score += 5
            breakdown["location_match"] = "partial"
        else:
            breakdown["location_match"] = "none"
    else:
        breakdown["location_match"] = "unknown"

    # Company size match (0-5)
    if lead.company_size and icp.target_company_sizes:
        lead_size = lead.company_size.lower()
        if any(s.lower() in lead_size or lead_size in s.lower() for s in icp.target_company_sizes):
            score += 5
            breakdown["size_match"] = "yes"
        else:
            breakdown["size_match"] = "no"
    else:
        breakdown["size_match"] = "unknown"

    return score, breakdown


# ---------------------------------------------------------------------------
# Contact quality scoring (0-30)
# ---------------------------------------------------------------------------

def _score_contact(lead: LeadData, icp: ICPProfile) -> tuple[int, dict]:
    """Score contact quality and ICP fit."""
    score = 0
    breakdown = {}

    # Has contact name (0-10)
    if lead.contact_name:
        name_parts = lead.contact_name.strip().split()
        if len(name_parts) >= 2:
            score += 10
            breakdown["has_full_name"] = True
        elif len(name_parts) == 1:
            score += 5
            breakdown["has_full_name"] = False
    else:
        breakdown["has_full_name"] = False

    # Title match (0-15)
    if lead.title:
        title_lower = lead.title.lower()
        breakdown["title"] = lead.title

        # C-level / VP / Director = highest value
        if any(t in title_lower for t in ["ceo", "cto", "cfo", "coo", "chief", "founder", "owner", "president"]):
            score += 15
            breakdown["title_tier"] = "c_level"
        elif any(t in title_lower for t in ["vp", "vice president", "director", "head of", "partner"]):
            score += 12
            breakdown["title_tier"] = "vp_director"
        elif any(t in title_lower for t in ["manager", "lead", "senior", "principal"]):
            score += 8
            breakdown["title_tier"] = "manager"
        elif any(t in title_lower for t in ["specialist", "coordinator", "analyst", "engineer"]):
            score += 5
            breakdown["title_tier"] = "individual"
        else:
            score += 3
            breakdown["title_tier"] = "other"

        # Check against ICP target titles
        if icp.target_titles:
            if any(t.lower() in title_lower for t in icp.target_titles):
                score += 5  # Bonus for ICP title match
                breakdown["icp_title_match"] = True
    else:
        breakdown["title_tier"] = "none"

    # Has phone (0-5)
    if lead.phone:
        score += 5
        breakdown["has_phone"] = True
    else:
        breakdown["has_phone"] = False

    return min(score, 30), breakdown


# ---------------------------------------------------------------------------
# Email quality scoring (0-25)
# ---------------------------------------------------------------------------

def _score_email(lead: LeadData) -> tuple[int, dict]:
    """Score email quality based on verification results."""
    score = 0
    breakdown = {}

    if not lead.email:
        breakdown["has_email"] = False
        return 0, breakdown

    breakdown["has_email"] = True
    score += 5  # Has any email

    ev = lead.email_verification
    if ev:
        # MX verified
        if ev.get("mx_valid"):
            score += 8
            breakdown["mx_valid"] = True
        else:
            breakdown["mx_valid"] = ev.get("mx_valid", "unchecked")

        # Not disposable
        if ev.get("is_disposable") is False:
            score += 3
            breakdown["not_disposable"] = True

        # Not role account (info@, admin@)
        if ev.get("is_role") is False:
            score += 3
            breakdown["not_role"] = True

        # Business domain (not gmail/yahoo)
        if ev.get("is_free") is False:
            score += 6
            breakdown["business_email"] = True
        else:
            breakdown["business_email"] = False
    else:
        # No verification data — give partial credit
        # Check if it looks like a business email
        domain = lead.email.split("@")[-1].lower() if "@" in lead.email else ""
        free_domains = {"gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com"}
        if domain and domain not in free_domains:
            score += 6
            breakdown["business_email"] = True
        else:
            breakdown["business_email"] = False

    return min(score, 25), breakdown


# ---------------------------------------------------------------------------
# Data completeness scoring (0-15)
# ---------------------------------------------------------------------------

def _score_completeness(lead: LeadData) -> tuple[int, dict]:
    """Score based on how much data we have about the lead."""
    fields = {
        "company_name": 3,
        "contact_name": 2,
        "email": 3,
        "title": 2,
        "phone": 1,
        "company_industry": 1,
        "company_location": 1,
        "website": 1,
        "company_size": 1,
    }

    score = 0
    filled = 0
    total = len(fields)

    for field_name, weight in fields.items():
        value = getattr(lead, field_name, "")
        if value and str(value).strip():
            score += weight
            filled += 1

    breakdown = {
        "fields_filled": filled,
        "fields_total": total,
        "completeness_pct": round(filled / total * 100),
    }

    return min(score, 15), breakdown


# ---------------------------------------------------------------------------
# Fuzzy matching helper
# ---------------------------------------------------------------------------

def _fuzzy_match(a: str, b: str, threshold: float = 0.5) -> bool:
    """Simple token overlap fuzzy match."""
    tokens_a = set(a.lower().split())
    tokens_b = set(b.lower().split())
    if not tokens_a or not tokens_b:
        return False
    overlap = tokens_a & tokens_b
    return len(overlap) / min(len(tokens_a), len(tokens_b)) >= threshold


# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------

def compute_dedup_key(lead: LeadData) -> str:
    """Compute deduplication key from email + company_name."""
    raw = f"{lead.email.lower().strip()}|{lead.company_name.lower().strip()}"
    return hashlib.md5(raw.encode()).hexdigest()


def deduplicate_leads(leads: list[ScoredLead]) -> list[ScoredLead]:
    """Remove duplicate leads, keeping the highest-scored version."""
    seen = {}
    for lead in leads:
        key = lead.dedup_key
        if key not in seen or lead.total_score > seen[key].total_score:
            seen[key] = lead
    # Sort by score descending
    return sorted(seen.values(), key=lambda x: x.total_score, reverse=True)


# ---------------------------------------------------------------------------
# Main scoring function
# ---------------------------------------------------------------------------

def compute_bant_score(lead: LeadData, icp: ICPProfile) -> float:
    """
    Algorithmic BANT Scoring Formula (Mode B Fallback):
    Score = 0.35 * I(Title) + 0.25 * I(Employees) + 0.25 * I(TechStack) + 0.15 * I(Location)
    where I(x) in [0.0, 1.0] binary or tiered match score.
    Returns float score between 0.0 and 100.0.
    """
    # 1. I(Title) — 0.35 weight
    i_title = 0.0
    if lead.title:
        t = lead.title.lower()
        if any(w in t for w in ["ceo", "cto", "cfo", "coo", "founder", "owner", "president"]):
            i_title = 1.0
        elif any(w in t for w in ["vp", "director", "head of"]):
            i_title = 0.8
        elif any(w in t for w in ["manager", "lead", "senior"]):
            i_title = 0.5
        else:
            i_title = 0.3

    # 2. I(Employees / Size) — 0.25 weight
    i_size = 0.0
    if lead.company_size:
        i_size = 0.8
        if icp.target_company_sizes:
            if any(s.lower() in lead.company_size.lower() for s in icp.target_company_sizes):
                i_size = 1.0

    # 3. I(TechStack / Industry) — 0.25 weight
    i_tech = 0.0
    if lead.company_industry:
        i_tech = 0.7
        if icp.target_industry and icp.target_industry.lower() in lead.company_industry.lower():
            i_tech = 1.0

    # 4. I(Location) — 0.15 weight
    i_loc = 0.0
    if lead.company_location:
        i_loc = 0.7
        if icp.target_location and icp.target_location.lower() in lead.company_location.lower():
            i_loc = 1.0

    bant_val = (0.35 * i_title) + (0.25 * i_size) + (0.25 * i_tech) + (0.15 * i_loc)
    return round(bant_val * 100, 2)


def score_lead(lead: LeadData, icp: ICPProfile) -> ScoredLead:
    """
    Score a single lead against the ICP.
    Returns ScoredLead with total score (0-100) and detailed breakdown.
    """
    company_score, company_breakdown = _score_company(lead, icp)
    contact_score, contact_breakdown = _score_contact(lead, icp)
    email_score, email_breakdown = _score_email(lead)
    completeness_score, completeness_breakdown = _score_completeness(lead)

    total = company_score + contact_score + email_score + completeness_score
    bant_score = compute_bant_score(lead, icp)

    return ScoredLead(
        lead=lead,
        total_score=min(total, 100),
        company_score=company_score,
        contact_score=contact_score,
        email_score=email_score,
        completeness_score=completeness_score,
        breakdown={
            "company": company_breakdown,
            "contact": contact_breakdown,
            "email": email_breakdown,
            "completeness": completeness_breakdown,
            "bant_score": bant_score,
        },
        dedup_key=compute_dedup_key(lead),
    )


def score_leads_batch(
    leads: list[LeadData],
    icp: ICPProfile,
    deduplicate: bool = True,
    min_score: int = 0,
) -> list[ScoredLead]:
    """
    Score and optionally deduplicate a batch of leads.
    Returns scored leads sorted by total_score descending.
    """
    scored = [score_lead(lead, icp) for lead in leads]

    if deduplicate:
        scored = deduplicate_leads(scored)

    if min_score > 0:
        scored = [s for s in scored if s.total_score >= min_score]

    return scored
