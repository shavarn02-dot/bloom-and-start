"""Pure validation helpers for source-backed lead records.

These helpers intentionally score evidence, not guessed identity. They do not
perform network calls and are safe to exercise in unit tests.
"""

from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse


@dataclass(frozen=True)
class LeadEvidence:
    company_name: str = ""
    contact_name: str = ""
    title: str = ""
    email: str = ""
    phone: str = ""
    website: str = ""
    source_url: str = ""


def contact_completeness(lead: LeadEvidence) -> float:
    """Return the percentage of expected fields that are actually present."""
    fields = [
        lead.contact_name,
        lead.title,
        lead.email,
        lead.phone,
        lead.website,
        lead.source_url,
    ]
    return round(sum(bool(value and value.strip()) for value in fields) / len(fields) * 100, 2)


def contact_confidence(lead: LeadEvidence) -> float:
    """Score explicit evidence without treating inferred values as facts."""
    score = 20.0 if lead.source_url else 0.0
    score += 25.0 if lead.contact_name else 0.0
    score += 15.0 if lead.title else 0.0
    score += 20.0 if lead.email else 0.0
    score += 20.0 if lead.phone else 0.0
    return min(score, 100.0)


def source_confidence(lead: LeadEvidence) -> float:
    """Give official registry provenance more weight than a normal web page."""
    if not lead.source_url:
        return 0.0
    return 100.0 if lead.source_url.startswith("registry://") else 85.0


def is_public_source_url(url: str) -> bool:
    """Accept HTTP(S) pages and explicit registry references, never fake URLs."""
    if not url:
        return False
    if url.startswith("registry://"):
        return len(url.removeprefix("registry://").strip()) > 0
    parsed = urlparse(url)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def build_provenance(lead: LeadEvidence) -> dict:
    """Build an explicit provenance object for storage and API responses."""
    return {
        "source_url": lead.source_url or None,
        "email_explicitly_published": bool(lead.email),
        "email_inferred": False,
        "phone_explicitly_published": bool(lead.phone),
    }


def should_save_lead(lead: LeadEvidence) -> bool:
    """Require a real company name and a source before saving a lead."""
    return bool(lead.company_name.strip() and is_public_source_url(lead.source_url))


__all__ = [
    "LeadEvidence",
    "build_provenance",
    "contact_completeness",
    "contact_confidence",
    "is_public_source_url",
    "should_save_lead",
    "source_confidence",
]


if __name__ == "__main__":
    raise SystemExit("This module is imported by the pipeline and is not a CLI.")

