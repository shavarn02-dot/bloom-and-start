"""
Targeted Lead Generation for LeadFlowX — Finding potential B2B buyers for LeadFlowX AI.
Target ICPs:
1. Digital Marketing Agencies (India & US)
2. B2B SaaS & IT Companies (Bangalore, NCR, Pune)
3. B2B Sales & Consulting Firms
"""

import asyncio
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from scraper_tiered import search_duckduckgo, scrape_company
from email_engine import generate_email_patterns, verify_emails_batch
from lead_scorer import score_leads_batch, ICPProfile, LeadData

TARGET_QUERIES = [
    "B2B SaaS companies in Bangalore contact email",
    "Digital marketing agency Delhi NCR contact email",
    "IT services company Pune email phone",
    "B2B sales consulting firm India email",
]

async def find_leads_for_leadflowx():
    print("🚀 Finding B2B buyers & clients specifically for LeadFlowX...\n")
    all_raw_leads = []

    for query in TARGET_QUERIES:
        print(f"🔍 Searching: '{query}'...")
        results = await search_duckduckgo(query, max_results=4)
        for r in results:
            if any(w in r.url.lower() for w in ["youtube", "wikipedia", "facebook", "twitter", "linkedin.com/in/"]):
                continue
            try:
                company = await scrape_company(r.url)
                if not company.company_name or company.company_name in ["Checking your browser", "Just a moment...", "Attention Required! | Cloudflare"]:
                    continue

                domain = company.website.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]

                # Extract contacts
                for contact in company.contacts:
                    lead = LeadData(
                        company_name=company.company_name,
                        contact_name=contact.name,
                        title=contact.title or "Decision Maker",
                        email=contact.email,
                        phone=contact.phone or (company.phones[0] if company.phones else ""),
                        website=company.website,
                        source_url=r.url,
                        description=company.description or r.snippet,
                    )
                    if not lead.email and contact.name and domain:
                        parts = contact.name.split()
                        if len(parts) >= 2:
                            p = generate_email_patterns(parts[0], parts[-1], domain)
                            if p:
                                lead.email = p[0]
                    all_raw_leads.append(lead)

                # Company level emails
                if not company.contacts and company.emails:
                    for email in company.emails[:2]:
                        all_raw_leads.append(LeadData(
                            company_name=company.company_name,
                            email=email,
                            phone=company.phones[0] if company.phones else "",
                            website=company.website,
                            source_url=r.url,
                            description=company.description or r.snippet,
                        ))

            except Exception as e:
                continue

    # Verify emails
    emails_to_verify = [l.email for l in all_raw_leads if l.email]
    if emails_to_verify:
        verifications = await verify_emails_batch(emails_to_verify)
        v_map = {v["email"]: v for v in verifications}
        for l in all_raw_leads:
            if l.email in v_map:
                l.email_verification = v_map[l.email]

    # ICP Profile for LeadFlowX target buyers
    icp = ICPProfile(
        target_industry="B2B Software, Marketing, IT Services",
        target_location="India, Global",
        description="B2B companies, agencies, and SaaS founders looking for lead generation tools",
    )
    scored = score_leads_batch(all_raw_leads, icp, deduplicate=True, min_score=15)

    return scored

if __name__ == "__main__":
    leads = asyncio.run(find_leads_for_leadflowx())
    print(f"\nTOTAL_LEADS_FOUND={len(leads)}")
    for i, s in enumerate(leads, 1):
        ld = s.lead
        ev = ld.email_verification.get("status", "unverified")
        print(f"{i}|{ld.company_name}|{ld.contact_name or 'Team'}|{ld.title or 'N/A'}|{ld.email or 'N/A'}|{ev}|{ld.phone or 'N/A'}|{ld.website or 'N/A'}|{s.total_score}")
