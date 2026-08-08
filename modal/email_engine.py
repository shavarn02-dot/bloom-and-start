"""
Email Engine — pattern generation, MX verification, and quality scoring.

Fully API-independent:
  - Pattern generation: pure Python logic
  - MX verification:    DNS lookups via dnspython (no external API)
  - Disposable check:   local blocklist
  - Role account check: local pattern list

RAM usage: ~5MB (no browser, no heavy deps)
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
import re
import socket
from typing import Optional

logger = logging.getLogger("email_engine")

# ---------------------------------------------------------------------------
# Common disposable email domains (top 100+ — extend as needed)
# ---------------------------------------------------------------------------

DISPOSABLE_DOMAINS = frozenset([
    "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
    "yopmail.com", "sharklasers.com", "guerrillamailblock.com", "grr.la",
    "guerrillamail.info", "guerrillamail.de", "trbvm.com", "dispostable.com",
    "trashmail.com", "trashmail.me", "trashmail.net", "mailnesia.com",
    "maildrop.cc", "discard.email", "tempail.com", "temp-mail.org",
    "fakeinbox.com", "mailcatch.com", "mailscrap.com", "meltmail.com",
    "mintemail.com", "mt2015.com", "mytemp.email", "nada.email",
    "spam4.me", "spamgourmet.com", "tempinbox.com", "tempr.email",
    "10minutemail.com", "20minutemail.com", "33mail.com", "anonymbox.com",
    "binkmail.com", "bobmail.info", "bumpymail.com", "chammy.info",
    "devnullmail.com", "emailigo.de", "emailsensei.com", "emailtemporaire.com",
    "ephemail.net", "etranquil.com", "gettempmail.com", "harakirimail.com",
    "jetable.org", "kasmail.com", "link2mail.net", "mailexpire.com",
    "mailforspam.com", "mailhazard.com", "mailmoat.com", "mailnull.com",
    "mailshell.com", "mailsiphon.com", "mailzilla.com", "nomail.xl.cx",
    "nospam.ze.tc", "owlpic.com", "proxymail.eu", "rcpt.at",
    "reallymymail.com", "recode.me", "recursor.net", "regbypass.com",
    "safetymail.info", "spambox.us", "spamcero.com", "spamcorptastic.com",
    "spamex.com", "spamfree24.org", "spamhole.com", "spaml.de",
    "tempmaildemo.com", "tempomail.fr", "temporaryemail.net", "thankyou2010.com",
    "trash-mail.at", "trashmail.at", "trashymail.com", "turual.com",
    "uggsrock.com", "wegwerfmail.de", "wegwerfmail.net", "wh4f.org",
    "yopmail.fr", "yopmail.net", "mailinator.net", "guerrillamail.net",
])

# ---------------------------------------------------------------------------
# Role-based email prefixes (not a person — generic)
# ---------------------------------------------------------------------------

ROLE_PREFIXES = frozenset([
    "info", "admin", "support", "contact", "hello", "help", "sales",
    "marketing", "press", "media", "office", "team", "general",
    "billing", "accounts", "hr", "careers", "jobs", "legal",
    "compliance", "security", "abuse", "postmaster", "webmaster",
    "noreply", "no-reply", "donotreply", "do-not-reply",
    "newsletter", "subscribe", "unsubscribe", "feedback",
    "enquiries", "inquiries", "reception", "service", "services",
])

# ---------------------------------------------------------------------------
# Free email providers (not business email)
# ---------------------------------------------------------------------------

FREE_EMAIL_PROVIDERS = frozenset([
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
    "icloud.com", "mail.com", "protonmail.com", "zoho.com", "yandex.com",
    "gmx.com", "gmx.net", "live.com", "msn.com", "me.com",
    "rediffmail.com", "yahoo.co.in", "yahoo.co.uk", "hotmail.co.uk",
    "googlemail.com", "pm.me", "tutanota.com",
])


# ---------------------------------------------------------------------------
# Email pattern generator
# ---------------------------------------------------------------------------

def generate_email_patterns(
    first_name: str,
    last_name: str,
    domain: str,
) -> list[str]:
    """
    Generate 20+ likely email patterns from a person's name and company domain.
    Returns list of candidate emails, ordered by most common patterns first.
    """
    f = first_name.lower().strip()
    l = last_name.lower().strip()
    d = domain.lower().strip()

    if not f or not l or not d:
        return []

    fi = f[0]   # first initial
    li = l[0]   # last initial

    patterns = [
        # Most common business patterns (ordered by frequency)
        f"{f}.{l}@{d}",           # john.doe@company.com
        f"{f}{l}@{d}",            # johndoe@company.com
        f"{fi}{l}@{d}",           # jdoe@company.com
        f"{f}@{d}",               # john@company.com
        f"{f}_{l}@{d}",           # john_doe@company.com
        f"{l}.{f}@{d}",           # doe.john@company.com
        f"{l}{f}@{d}",            # doejohn@company.com
        f"{fi}.{l}@{d}",          # j.doe@company.com
        f"{f}{li}@{d}",           # johnd@company.com
        f"{f}.{li}@{d}",          # john.d@company.com
        f"{fi}{l[0:3]}@{d}" if len(l) >= 3 else None,  # jdoe (short)
        f"{l}@{d}",               # doe@company.com
        f"{f}-{l}@{d}",           # john-doe@company.com
        f"{l}{fi}@{d}",           # doej@company.com
        f"{l}.{fi}@{d}",          # doe.j@company.com
        f"{l}_{f}@{d}",           # doe_john@company.com
        f"{fi}{li}@{d}",          # jd@company.com
        f"{f}{l[0:2]}@{d}" if len(l) >= 2 else None,   # johndo@company.com
        f"{fi}.{l[0:3]}@{d}" if len(l) >= 3 else None,  # j.doe
        f"{f}.{l[0:1]}@{d}",      # john.d@company.com
    ]

    # Filter out None entries and duplicates while preserving order
    seen = set()
    result = []
    for p in patterns:
        if p and p not in seen:
            seen.add(p)
            result.append(p)

    return result


# ---------------------------------------------------------------------------
# Email syntax validation
# ---------------------------------------------------------------------------

EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
)


def is_valid_syntax(email: str) -> bool:
    """Check if email has valid syntax."""
    return bool(EMAIL_REGEX.match(email.strip()))


# ---------------------------------------------------------------------------
# MX record verification (DNS-based, no external API)
# ---------------------------------------------------------------------------

async def verify_mx(domain: str) -> tuple[bool, list[str]]:
    """
    Check if a domain has valid MX records.
    Returns (is_valid, list_of_mx_hosts).
    Uses dnspython if available, falls back to socket.
    """
    try:
        import dns.resolver
        try:
            answers = dns.resolver.resolve(domain, "MX")
            mx_hosts = [str(r.exchange).rstrip(".") for r in answers]
            return len(mx_hosts) > 0, mx_hosts
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.resolver.NoNameservers):
            return False, []
        except Exception as e:
            logger.warning(f"DNS MX lookup failed for {domain}: {e}")
            return False, []
    except ImportError:
        # Fallback: use socket to check if domain resolves at all
        try:
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(None, socket.getaddrinfo, domain, 25)
            return len(result) > 0, [domain]
        except (socket.gaierror, OSError):
            return False, []


# ---------------------------------------------------------------------------
# Disposable / role / free email checks
# ---------------------------------------------------------------------------

def is_disposable(domain: str) -> bool:
    """Check if domain is a known disposable email provider."""
    return domain.lower() in DISPOSABLE_DOMAINS


def is_role_account(email: str) -> bool:
    """Check if email is a generic role account (not a person)."""
    local_part = email.split("@")[0].lower()
    return local_part in ROLE_PREFIXES


def is_free_provider(domain: str) -> bool:
    """Check if domain is a free email provider (Gmail, Yahoo, etc.)."""
    return domain.lower() in FREE_EMAIL_PROVIDERS


# ---------------------------------------------------------------------------
# Catch-all detection (basic heuristic)
# ---------------------------------------------------------------------------

async def is_catch_all(domain: str) -> Optional[bool]:
    """
    Basic catch-all detection by checking if a random email is accepted.
    Returns True (catch-all), False (not catch-all), or None (couldn't determine).

    NOTE: This does a real SMTP connection. Use sparingly to avoid IP blacklisting.
    For MVP, we skip this and return None.
    """
    # For MVP, skip SMTP-based catch-all detection
    return None


# ---------------------------------------------------------------------------
# Main verification function
# ---------------------------------------------------------------------------

async def verify_email(email: str) -> dict:
    """
    Verify a single email address.

    Returns dict with:
      - email: str
      - domain: str
      - syntax_valid: bool
      - mx_valid: bool
      - mx_records: list[str]
      - is_disposable: bool
      - is_role: bool
      - is_free: bool
      - is_catch_all: bool | None
      - quality_score: int (0-100)
      - status: 'valid' | 'invalid' | 'risky' | 'unknown'
    """
    email = email.strip().lower()
    domain = email.split("@")[-1] if "@" in email else ""

    result = {
        "email": email,
        "domain": domain,
        "syntax_valid": False,
        "mx_valid": False,
        "mx_records": [],
        "is_disposable": False,
        "is_role": False,
        "is_free": False,
        "is_catch_all": None,
        "quality_score": 0,
        "status": "invalid",
    }

    # Step 1: Syntax check
    if not is_valid_syntax(email):
        return result
    result["syntax_valid"] = True

    # Step 2: Domain checks
    result["is_disposable"] = is_disposable(domain)
    result["is_role"] = is_role_account(email)
    result["is_free"] = is_free_provider(domain)

    if result["is_disposable"]:
        result["status"] = "invalid"
        result["quality_score"] = 0
        return result

    # Step 3: MX verification
    mx_valid, mx_records = await verify_mx(domain)
    result["mx_valid"] = mx_valid
    result["mx_records"] = mx_records

    if not mx_valid:
        result["status"] = "invalid"
        result["quality_score"] = 10
        return result

    # Step 4: Calculate quality score
    score = 50  # Base: syntax valid + MX valid

    if not result["is_free"]:
        score += 20  # Business email is higher quality
    if not result["is_role"]:
        score += 15  # Personal email is higher quality
    if len(mx_records) > 1:
        score += 5   # Multiple MX records = well-configured domain
    if any(mx for mx in mx_records if "google" in mx.lower() or "outlook" in mx.lower()):
        score += 10  # Major email provider = legit domain

    result["quality_score"] = min(score, 100)

    # Step 5: Determine status
    if score >= 70:
        result["status"] = "valid"
    elif score >= 40:
        result["status"] = "risky"
    else:
        result["status"] = "unknown"

    return result


# ---------------------------------------------------------------------------
# Batch verification
# ---------------------------------------------------------------------------

async def verify_emails_batch(emails: list[str], max_concurrent: int = 10) -> list[dict]:
    """Verify multiple emails concurrently with a semaphore."""
    sem = asyncio.Semaphore(max_concurrent)

    async def _verify(email: str) -> dict:
        async with sem:
            return await verify_email(email)

    results = await asyncio.gather(*[_verify(e) for e in emails])
    return list(results)


# ---------------------------------------------------------------------------
# Extract emails from text
# ---------------------------------------------------------------------------

def extract_emails_from_text(text: str) -> list[str]:
    """Extract all email addresses from a block of text."""
    pattern = r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
    found = re.findall(pattern, text)
    # Deduplicate while preserving order
    seen = set()
    result = []
    for email in found:
        email_lower = email.lower()
        if email_lower not in seen:
            seen.add(email_lower)
            result.append(email_lower)
    return result
