"""
LeadFlowX Pipeline — Modal-deployed orchestrator.

This is the main entry point deployed to Modal. It chains:
  Search → Scrape → Extract → Verify → Score → Save

Triggered by Cloudflare Worker via HTTP webhook.
Reads/writes campaign data to Supabase.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from dataclasses import asdict
from datetime import datetime
from pathlib import Path

import modal

# ---------------------------------------------------------------------------
# Modal app setup with reliable local file resolution
# ---------------------------------------------------------------------------

MODAL_DIR = Path(__file__).parent.resolve()

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "httpx",
        "beautifulsoup4",
        "dnspython",
        "supabase",
        "fastapi",
    )
    .add_local_file(str(MODAL_DIR / "ai_router.py"), "/root/ai_router.py")
    .add_local_file(str(MODAL_DIR / "email_engine.py"), "/root/email_engine.py")
    .add_local_file(str(MODAL_DIR / "scraper_tiered.py"), "/root/scraper_tiered.py")
    .add_local_file(str(MODAL_DIR / "lead_scorer.py"), "/root/lead_scorer.py")
)

app = modal.App("leadflowx-engine", image=image)

# Secrets stored in Modal dashboard
secrets = modal.Secret.from_name("leadflowx-secrets")

logger = logging.getLogger("pipeline")
logging.basicConfig(level=logging.INFO)


# ---------------------------------------------------------------------------
# Supabase client helper
# ---------------------------------------------------------------------------

def _get_supabase():
    """Create Supabase client from env vars."""
    from supabase import create_client
    url = os.environ.get("SUPABASE_URL")
    key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("SUPABASE_SERVICE_KEY")
        or os.environ.get("SUPABASE_KEY")
    )
    if not url or not key:
        raise ValueError(
            f"Supabase environment variables missing in Modal secrets: SUPABASE_URL={bool(url)}, KEY={bool(key)}"
        )
    return create_client(url, key)


# ---------------------------------------------------------------------------
# Job status updater
# ---------------------------------------------------------------------------

def _update_job(job_id: str, **fields):
    """Update a scrape job's status/progress in Supabase safely."""
    try:
        sb = _get_supabase()
        data = {k: v for k, v in fields.items() if v is not None}
        if data:
            sb.table("scrape_jobs").update(data).eq("id", job_id).execute()
    except Exception as err:
        logger.error(f"Failed to update job {job_id} in Supabase: {err}")


# ---------------------------------------------------------------------------
# Main campaign pipeline
# ---------------------------------------------------------------------------

@app.function(
    cpu=1.0,
    memory=512,
    timeout=600,
    secrets=[secrets],
    retries=modal.Retries(max_retries=1, backoff_coefficient=2.0),
)
async def run_campaign(campaign_id: str, job_id: str):
    """
    Main pipeline: runs a full lead generation campaign.
    """
    import sys
    sys.path.insert(0, "/root")

    from ai_router import call_ai_json, TaskType, get_usage_stats
    from email_engine import generate_email_patterns, verify_emails_batch
    from scraper_tiered import search_duckduckgo, scrape_company, ExtractedCompany
    from lead_scorer import score_leads_batch, ICPProfile, LeadData, deduplicate_leads

    sb = _get_supabase()
    start_time = time.time()

    try:
        # ----- Step 0: Update job status -----
        logger.info(f"🚀 Starting campaign {campaign_id} for job {job_id}")
        _update_job(job_id, status="running", started_at=datetime.utcnow().isoformat(), progress=10)

        # ----- Step 1: Fetch campaign + business profile -----
        logger.info(f"📋 Fetching campaign {campaign_id}")

        campaign_resp = sb.table("lead_campaigns").select("*").eq("id", campaign_id).single().execute()
        campaign = campaign_resp.data
        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found in Supabase")

        # Update campaign status
        sb.table("lead_campaigns").update({"status": "running"}).eq("id", campaign_id).execute()

        # Fetch business profile if linked
        business_profile = None
        if campaign.get("business_profile_id"):
            try:
                bp_resp = sb.table("business_profiles").select("*").eq("id", campaign["business_profile_id"]).single().execute()
                business_profile = bp_resp.data
            except Exception as bp_err:
                logger.warning(f"Could not fetch business profile: {bp_err}")

        _update_job(job_id, progress=20)

        # ----- Step 2: Generate search queries -----
        logger.info("🔍 Generating search queries...")

        context_parts = [f"Campaign query: {campaign.get('query', '')}"]
        if business_profile:
            context_parts.append(f"Business: {business_profile.get('name', '')}")
            context_parts.append(f"Description: {business_profile.get('description', '')}")
            context_parts.append(f"Target customer: {business_profile.get('target_customer', '')}")

        context = "\n".join(context_parts)

        try:
            search_queries = await call_ai_json(
                prompt=f"""Generate 3-5 specific web search queries to find business leads matching the profile.
Context:
{context}

Return ONLY a JSON array of search query strings. Example: ["marketing agencies Mumbai", "SEO companies Delhi"]""",
                task=TaskType.GENERATE_QUERY,
                system_prompt="You are a lead generation expert. Return ONLY a valid JSON array of strings.",
            )
            if not isinstance(search_queries, list) or not search_queries:
                search_queries = [campaign.get("query", "companies")]
        except Exception as e:
            logger.warning(f"AI query generation failed, using fallback query: {e}")
            search_queries = [campaign.get("query", "companies")]

        logger.info(f"📝 Generated {len(search_queries)} search queries: {search_queries}")
        _update_job(job_id, progress=30)

        # ----- Step 3: Search for companies -----
        logger.info("🌐 Searching for companies...")

        all_search_results = []
        max_leads = min(campaign.get("requested_limit", 25), 50)

        for query_str in search_queries[:4]:
            results = await search_duckduckgo(query_str, max_results=12)
            all_search_results.extend(results)
            await asyncio.sleep(1)

        # Fallback if search results are empty
        if not all_search_results:
            logger.warning("No search results found with generated queries, running direct search...")
            all_search_results = await search_duckduckgo(campaign.get("query", "b2b services"), max_results=15)

        # Deduplicate by domain
        from urllib.parse import urlparse
        seen_domains = set()
        unique_results = []
        for r in all_search_results:
            domain = urlparse(r.url).netloc.lower()
            if domain and domain not in seen_domains:
                seen_domains.add(domain)
                unique_results.append(r)

        logger.info(f"🔗 Found {len(unique_results)} unique company URLs")
        _update_job(job_id, progress=45, total_urls_found=len(unique_results))

        # ----- Step 4: Scrape companies -----
        logger.info("🕷️ Scraping company pages...")

        scraped_companies: list[ExtractedCompany] = []
        urls_scraped = 0

        for i, result in enumerate(unique_results[:max_leads]):
            try:
                company = await scrape_company(result.url)
                if company:
                    if not company.company_name and result.title:
                        company.company_name = result.title
                    scraped_companies.append(company)

                urls_scraped += 1
                prog = 45 + int((urls_scraped / max(1, min(len(unique_results), max_leads))) * 30)
                _update_job(job_id, progress=prog, total_urls_scraped=urls_scraped)

            except Exception as scrape_err:
                logger.warning(f"Error scraping {result.url}: {scrape_err}")
                continue

        logger.info(f"✅ Successfully scraped {len(scraped_companies)} companies")

        # ----- Step 5: Convert scraped data to LeadData -----
        raw_leads: list[LeadData] = []

        for company in scraped_companies:
            domain = company.website.replace("https://", "").replace("http://", "").replace("www.", "").split("/")[0]

            for contact in company.contacts:
                lead = LeadData(
                    company_name=company.company_name,
                    contact_name=contact.name,
                    title=contact.title,
                    email=contact.email,
                    phone=contact.phone or (company.phones[0] if company.phones else ""),
                    website=company.website,
                    source_url=company.source_url or company.website,
                    description=company.description,
                )
                if not lead.email and contact.name and domain:
                    parts = contact.name.split()
                    if len(parts) >= 2:
                        patterns = generate_email_patterns(parts[0], parts[-1], domain)
                        if patterns:
                            lead.email = patterns[0]

                raw_leads.append(lead)

            if not company.contacts and company.emails:
                for email in company.emails[:2]:
                    raw_leads.append(LeadData(
                        company_name=company.company_name,
                        email=email,
                        phone=company.phones[0] if company.phones else "",
                        website=company.website,
                        source_url=company.source_url or company.website,
                        description=company.description,
                    ))

            if not company.contacts and not company.emails:
                raw_leads.append(LeadData(
                    company_name=company.company_name,
                    phone=company.phones[0] if company.phones else "",
                    website=company.website,
                    source_url=company.source_url or company.website,
                    description=company.description,
                ))

        _update_job(job_id, progress=80, total_leads_extracted=len(raw_leads))

        # ----- Step 6: Verify emails -----
        logger.info("📧 Verifying emails...")

        emails_to_verify = [l.email for l in raw_leads if l.email]
        verified_count = 0

        if emails_to_verify:
            try:
                verifications = await verify_emails_batch(emails_to_verify)
                v_map = {v["email"]: v for v in verifications}
                for l in raw_leads:
                    if l.email in v_map:
                        l.email_verification = v_map[l.email]
                        if v_map[l.email].get("status") == "valid":
                            verified_count += 1
            except Exception as ve_err:
                logger.warning(f"Email verification error: {ve_err}")

        _update_job(job_id, progress=85, total_emails_verified=verified_count)

        # ----- Step 7: Score leads against ICP -----
        logger.info("⭐ Scoring leads...")

        icp = ICPProfile(
          target_industry=business_profile.get("industry", "") if business_profile else "",
          target_location=business_profile.get("target_location", "") if business_profile else "",
          description=campaign.get("query", ""),
        )

        try:
            scored_leads = score_leads_batch(raw_leads, icp, deduplicate=True)
        except Exception as score_err:
            logger.warning(f"Scoring error: {score_err}")
            scored_leads = []

        _update_job(job_id, progress=90)

        # ----- Step 8: Save leads to Supabase -----
        logger.info(f"💾 Saving {len(scored_leads)} leads to Supabase...")

        saved_count = 0
        leads_to_insert = []

        for s in scored_leads:
            ld = s.lead
            ev = ld.email_verification
            v_status = _map_verification_status(ev)

            lead_record = {
                "campaign_id": campaign_id,
                "company_name": ld.company_name or "Unknown Company",
                "contact_name": ld.contact_name or None,
                "title": ld.title or None,
                "email": ld.email or None,
                "phone": ld.phone or None,
                "website": ld.website or None,
                "source_url": ld.source_url or None,
                "confidence": s.total_score,
                "verification_status": v_status,
                "ai_summary": json.dumps(s.breakdown) if s.breakdown else None,
                "status": "new",
            }
            leads_to_insert.append(lead_record)

        if leads_to_insert:
            try:
                sb.table("extracted_leads").insert(leads_to_insert).execute()
                saved_count = len(leads_to_insert)
            except Exception as save_err:
                logger.error(f"Error inserting leads to Supabase: {save_err}")
                # Try inserting individually
                for record in leads_to_insert:
                    try:
                        sb.table("extracted_leads").insert(record).execute()
                        saved_count += 1
                    except Exception:
                        pass

        # ----- Step 9: Finalize -----
        elapsed = round(time.time() - start_time, 2)
        logger.info(f"🎉 Pipeline finished in {elapsed}s. Saved {saved_count} leads.")

        sb.table("lead_campaigns").update({"status": "completed"}).eq("id", campaign_id).execute()

        _update_job(
            job_id,
            status="completed",
            progress=100,
            total_leads_extracted=saved_count,
            completed_at=datetime.utcnow().isoformat(),
        )

        usage_stats = get_usage_stats()
        logger.info(f"📊 AI usage stats: {json.dumps(usage_stats)}")

        return {
            "campaign_id": campaign_id,
            "job_id": job_id,
            "leads_saved": saved_count,
            "urls_scraped": urls_scraped,
            "elapsed_seconds": elapsed,
            "ai_usage": usage_stats,
        }

    except Exception as e:
        logger.error(f"❌ Pipeline failed: {e}", exc_info=True)
        try:
            _update_job(job_id, status="failed", error_message=str(e)[:500])
            sb.table("lead_campaigns").update({"status": "failed"}).eq("id", campaign_id).execute()
        except Exception as update_err:
            logger.error(f"Failed to update status on error: {update_err}")

        raise


def _map_verification_status(ev: dict) -> str:
    if not ev:
        return "unverified"
    status = ev.get("status", "unknown")
    if status == "valid":
        return "verified"
    elif status == "invalid":
        return "rejected"
    else:
        return "pending"


# ---------------------------------------------------------------------------
# HTTP webhook endpoint (called by Cloudflare Worker)
# ---------------------------------------------------------------------------

@app.function(
    cpu=0.25,
    memory=128,
    timeout=30,
    secrets=[secrets],
)
@modal.fastapi_endpoint(method="POST")
async def trigger_campaign(payload: dict):
    campaign_id = payload.get("campaign_id")
    job_id = payload.get("job_id")

    if not campaign_id or not job_id:
        return {"error": "campaign_id and job_id are required"}, 400

    run_campaign.spawn(campaign_id, job_id)

    return {
        "status": "accepted",
        "campaign_id": campaign_id,
        "job_id": job_id,
        "message": "Pipeline started. Poll job status for progress.",
    }


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.function(cpu=0.25, memory=128, timeout=10)
@modal.fastapi_endpoint(method="GET")
def health():
    return {"ok": True, "service": "leadflowx-engine", "version": "1.0.0"}
