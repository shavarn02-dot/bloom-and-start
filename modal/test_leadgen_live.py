"""
Live Test Script — Test search, scraping, email generation, and lead scoring.
Run this script to find real leads for LeadFlowX target audience.
"""

import asyncio
import json
import sys
from pathlib import Path

# Add modal dir to sys.path
sys.path.insert(0, str(Path(__file__).parent))

from scraper_tiered import search_duckduckgo, scrape_company
from email_engine import generate_email_patterns, verify_emails_batch
from lead_scorer import score_leads_batch, ICPProfile, LeadData


async def run_live_test(query: str = "Digital Marketing Agencies in Mumbai", limit: int = 5):
    print(f"\n🔍 Searching web for: '{query}'...")
    search_results = await search_duckduckgo(query, max_results=limit)
    print(f"✅ Found {len(search_results)} search results:")
    for i, r in enumerate(search_results, 1):
        print(f"  {i}. {r.title} -> {r.url}")

    print("\n🕷️ Scraping company websites & extracting contact details...")
    raw_leads = []

    for r in search_results:
        print(f"\nScraping {r.url}...")
        try:
            company = await scrape_company(r.url)
            print(f"  Company Name: {company.company_name}")
            print(f"  Page Type: {company.page_type} | Tier: {company.scrape_tier}")
            print(f"  Emails found: {company.emails}")
            print(f"  Contacts found: {[c.name for c in company.contacts]}")

            domain = company.website.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]

            for contact in company.contacts:
                lead = LeadData(
                    company_name=company.company_name or r.title,
                    contact_name=contact.name,
                    title=contact.title,
                    email=contact.email,
                    phone=contact.phone or (company.phones[0] if company.phones else ""),
                    website=company.website,
                    source_url=r.url,
                    description=company.description or r.snippet,
                )
                if not lead.email and contact.name and domain:
                    patterns = generate_email_patterns(parts[0], parts[-1], domain) if (parts := contact.name.split()) and len(parts) >= 2 else []
                    if patterns:
                        lead.email = patterns[0]
                raw_leads.append(lead)

            if not company.contacts and company.emails:
                for email in company.emails[:2]:
                    raw_leads.append(LeadData(
                        company_name=company.company_name or r.title,
                        email=email,
                        phone=company.phones[0] if company.phones else "",
                        website=company.website,
                        source_url=r.url,
                        description=company.description or r.snippet,
                    ))

            if not company.contacts and not company.emails:
                raw_leads.append(LeadData(
                    company_name=company.company_name or r.title,
                    phone=company.phones[0] if company.phones else "",
                    website=company.website,
                    source_url=r.url,
                    description=company.description or r.snippet,
                ))

        except Exception as e:
            print(f"  ❌ Error scraping {r.url}: {e}")

    print(f"\n📧 Verifying email addresses...")
    emails_to_verify = [l.email for l in raw_leads if l.email]
    if emails_to_verify:
        verifications = await verify_emails_batch(emails_to_verify)
        v_map = {v["email"]: v for v in verifications}
        for l in raw_leads:
            if l.email in v_map:
                l.email_verification = v_map[l.email]

    print("\n⭐ Scoring and deduplicating leads against ICP...")
    icp = ICPProfile(
        target_industry="Marketing",
        target_location="Mumbai",
        description="Digital marketing and advertising agencies in Mumbai needing lead gen tools",
    )
    scored = score_leads_batch(raw_leads, icp, deduplicate=True)

    print(f"\n========================================================")
    print(f"🎉 FINAL GENERATED LEADS ({len(scored)} leads found):")
    print(f"========================================================")
    for i, s in enumerate(scored, 1):
        ld = s.lead
        print(f"\nLead #{i} [Score: {s.total_score}/100]")
        print(f"  Company:  {ld.company_name}")
        print(f"  Contact:  {ld.contact_name or 'N/A'} ({ld.title or 'N/A'})")
        print(f"  Email:    {ld.email or 'N/A'} [Verified: {ld.email_verification.get('status', 'unverified')}]")
        print(f"  Phone:    {ld.phone or 'N/A'}")
        print(f"  Website:  {ld.website or 'N/A'}")
        print(f"  Source:   {ld.source_url}")

    return scored


if __name__ == "__main__":
    asyncio.run(run_live_test())
