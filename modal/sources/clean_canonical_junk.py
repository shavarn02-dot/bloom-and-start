"""
LeadFlowX Canonical Data Sanitizer & Junk Cleaner
Cleans up scraped HTML page titles, SEO spam directories, and formats company names + contacts cleanly in Supabase PostgreSQL.
"""

import os
import json
import re
import urllib.request

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://vkwerkdqffvcydksmebn.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY", "sb_publishable_2yjgPV4IIo5uXGuy1ETAEg_rRxlyZ2W")

def _supabase_req(path: str, method: str = "GET", body: any = None):
    headers = {
        "apikey": SUPABASE_KEY,
        "content-type": "application/json",
        "prefer": "return=representation",
    }
    if SUPABASE_KEY.startswith("eyJ"):
        headers["authorization"] = f"Bearer {SUPABASE_KEY}"

    clean_base = SUPABASE_URL.rstrip('/')
    url = f"{clean_base}/rest/v1/{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8")) if resp.status != 204 else []

def clean_company_name(name: str) -> tuple[str, bool]:
    """
    Returns (clean_name, is_junk_spam_directory)
    """
    if not name:
        return ("Target Business", True)

    name_lower = name.lower()
    
    # 1. Identify SEO directory / spam titles to delete
    spam_patterns = [
        r"email list", r"verified contacts", r"how to find", r"database \|",
        r"\d+,\d+", r"\$\d+", r"verified saas", r"founders email list",
        r"ceo contact list", r"global contacts"
    ]
    if any(re.search(p, name_lower) for p in spam_patterns):
        # Check if there's a clear brand at the end after '|'
        if "|" in name:
            parts = [p.strip() for p in name.split("|") if p.strip()]
            last_part = parts[-1]
            if not any(re.search(p, last_part.lower()) for p in spam_patterns) and len(last_part) > 2:
                return (last_part, False)
        return (name, True)  # Flag as junk directory to delete

    # 2. Clean page titles with '|' or '-'
    clean = name
    if "leadership team |" in name_lower or "leadership team" in name_lower:
        clean = re.sub(r"(?i).*leadership team\s*\|?\s*", "", clean).strip()
    if "chairman and chief executive officer |" in name_lower:
        clean = re.sub(r"(?i).*chairman and chief executive officer\s*\|\s*", "", clean).strip()

    if "|" in clean:
        parts = [p.strip() for p in clean.split("|") if p.strip()]
        # Pick shortest non-generic part or last part
        clean = parts[-1] if len(parts[-1]) > 2 else parts[0]

    # Clean remaining unwanted prefixes
    clean = re.sub(r"^https?://", "", clean).strip()
    clean = re.sub(r"^www\.", "", clean).strip()
    
    return (clean or name, False)

def main():
    print("======================================================================")
    print("STARTING CANONICAL DATABASE JUNK CLEANER & NAME SANITIZER")
    print("======================================================================")

    # 1. Fetch companies
    companies = _supabase_req("companies?select=*")
    print(f"Auditing {len(companies)} company records...")

    deleted_count = 0
    cleaned_count = 0

    for c in companies:
        raw_name = c.get("canonical_name", "")
        c_id = c["id"]

        clean_name, is_junk = clean_company_name(raw_name)

        if is_junk:
            print(f"  ❌ Deleting SEO spam directory record: [{c_id}] '{raw_name}'")
            try:
                _supabase_req(f"contacts?company_id=eq.{c_id}", method="DELETE")
                _supabase_req(f"company_sources?company_id=eq.{c_id}", method="DELETE")
                _supabase_req(f"companies?id=eq.{c_id}", method="DELETE")
                deleted_count += 1
            except Exception as err:
                print(f"     Error deleting {c_id}: {err}")
        elif clean_name != raw_name:
            print(f"  ✨ Sanitizing company title: '{raw_name}' -> '{clean_name}'")
            try:
                norm_name = re.sub(r'[^a-zA-Z0-9\s]', '', clean_name).strip().lower()
                _supabase_req(f"companies?id=eq.{c_id}", method="PATCH", body={
                    "canonical_name": clean_name,
                    "legal_name": clean_name,
                    "normalized_name": norm_name
                })
                cleaned_count += 1
            except Exception as err:
                print(f"     Error updating {c_id}: {err}")

    # 2. Audit remaining clean companies
    remaining = _supabase_req("companies?select=id,canonical_name,domain,country_code")
    print("\n======================================================================")
    print(f"CLEANUP SUMMARY: Deleted {deleted_count} spam titles | Sanitized {cleaned_count} company names")
    print(f"Remaining Clean Companies: {len(remaining)}")
    print("======================================================================")
    for r in remaining[:10]:
        print(f"  • {r['canonical_name']} | Domain: {r.get('domain')} | Country: {r.get('country_code')}")

if __name__ == "__main__":
    main()
