"""
LeadFlowX Pipeline — Modal-deployed orchestrator.

This is the main entry point deployed to Modal. It chains:
  Search → Scrape → Extract → Verify → Score → Save

Triggered by Cloudflare Worker via HTTP webhook.
Reads/writes campaign data to Supabase.

Cost: ~$0.001/campaign on Modal ($25 credit = 25K campaigns = 1.4 years)
RAM: ~80MB (Tier 1 only), ~380MB (with Crawl4AI)
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from dataclasses import asdict
from datetime import datetime

import modal

# ---------------------------------------------------------------------------
# Modal app setup
# ---------------------------------------------------------------------------

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "httpx",
        "beautifulsoup4",
        "dnspython",
        "supabase",
        "fastapi",
    )
    .add_local_file("ai_router.py", "/root/ai_router.py")
    .add_local_file("email_engine.py", "/root/email_engine.py")
    .add_local_file("scraper_tiered.py", "/root/scraper_tiered.py")
    .add_local_file("lead_scorer.py", "/root/lead_scorer.py")
)

app = modal.App("leadflowx-engine", image=image)

# Secrets (stored in Modal dashboard, never in code)
secrets = modal.Secret.from_name("leadflowx-secrets")

logger = logging.getLogger("pipeline")
logging.basicConfig(level=logging.INFO)


# ---------------------------------------------------------------------------
# Supabase client helper
# ---------------------------------------------------------------------------

def _get_supabase():
    """Create Supabase client from env vars."""
    from supabase import create_client
    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)


# ---------------------------------------------------------------------------
# Job status updater
# ---------------------------------------------------------------------------

def _update_job(job_id: str, **fields):
    """Update a scrape job's status/progress in Supabase."""
    sb = _get_supabase()
    data = {k: v for k, v in fields.items() if v is not None}
    if data:
        sb.table("scrape_jobs").update(data).eq("id", job_id).execute()


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

    Steps:
      1. Fetch campaign + business profile from Supabase
      2. Generate search queries using AI router
      3. Search for company URLs using DuckDuckGo
      4. Scrape each company page (tiered: httpx → Crawl4AI → Playwright)
      5. Extract contacts and emails
      6. Verify emails (MX check)
      7. Score leads against ICP
      8. Save leads to Supabase
      9. Update job status
    """
    import sys
    sys.path.insert(0, "/root")

    from ai_router import call_ai, call_ai_json, TaskType, get_usage_stats
    from email_engine import (
        generate_email_patterns, verify_emails_batch, verify_email,
        extract_emails_from_text,
    )
    from scraper_tiered import (
        search_duckduckgo, scrape_company, ExtractedCompany,
    )
    from lead_scorer import (
        score_leads_batch, ICPProfile, LeadData, deduplicate_leads,
    )

    sb = _get_supabase()
    start_time = time.time()

    try:
        # ----- Step 0: Update job status -----
        _update_job(job_id, status="running", started_at=datetime.utcnow().isoformat(), progress=5)

        # ----- Step 1: Fetch campaign + business profile -----
        logger.info(f"📋 Fetching campaign {campaign_id}")

        campaign_resp = sb.table("lead_campaigns").select("*").eq("id", campaign_id).single().execute()
        campaign = campaign_resp.data
        if not campaign:
            raise ValueError(f"Campaign {campaign_id} not found")

        # Update campaign status
        sb.table("lead_campaigns").update({"status": "running"}).eq("id", campaign_id).execute()

        # Fetch business profile if linked
        business_profile = None
        if campaign.get("business_profile_id"):
            bp_resp = sb.table("business_profiles").select("*").eq("id", campaign["business_profile_id"]).single().execute()
            business_profile = bp_resp.data

        _update_job(job_id, progress=10)

        # ----- Step 2: Generate search queries -----
        logger.info("🔍 Generating search queries...")

        # Build context for AI
        context_parts = [f"Campaign query: {campaign.get('query', '')}"]
        if business_profile:
            context_parts.append(f"Business: {business_profile.get('name', '')}")
            context_parts.append(f"Description: {business_profile.get('description', '')}")
            context_parts.append(f"Target customer: {business_profile.get('target_customer', '')}")
            context_parts.append(f"Website: {business_profile.get('website', '')}")

        context = "\n".join(context_parts)

        try:
            search_queries = await call_ai_json(
                prompt=f"""Generate 3-5 specific Google search queries to find potential business leads/companies.

Context:
{context}

Return a JSON array of search query strings. Each query should:
- Target specific companies/businesses that match the ideal customer profile
- Include location if specified
- Use terms like "companies", "businesses", industry-specific terms
- Be diverse (different angles to find leads)

Example output: ["marketing agencies in Mumbai", "digital marketing companies India", "SEO agencies Delhi NCR"]""",
                task=TaskType.GENERATE_QUERY,
                system_prompt="You are a lead generation expert. Return ONLY a valid JSON array of search query strings.",
            )
            if not isinstance(search_queries, list):
                search_queries = [campaign.get("query", "companies")]
        except Exception as e:
            logger.warning(f"AI query generation failed, using campaign query: {e}")
            search_queries = [campaign.get("query", "companies")]

        logger.info(f"📝 Generated {len(search_queries)} search queries: {search_queries}")
        _update_job(job_id, progress=20)

        # ----- Step 3: Search for companies -----
        logger.info("🌐 Searching for companies...")

        all_search_results = []
        max_leads = min(campaign.get("requested_limit", 25), 50)  # Cap at 50 for free tier

        for query in search_queries[:5]:
            results = await search_duckduckgo(query, max_results=15)
            all_search_results.extend(results)
            await asyncio.sleep(2)  # Polite delay between searches

        # Deduplicate by domain
        seen_domains = set()
        unique_results = []
        for r in all_search_results:
            from urllib.parse import urlparse
            domain = urlparse(r.url).netloc
            if domain and domain not in seen_domains:
                seen_domains.add(domain)
                unique_results.append(r)

        logger.info(f"🔗 Found {len(unique_results)} unique company URLs")
        _update_job(job_id, progress=30, total_urls_found=len(unique_results))

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

                # Update progress (30-60%)
                progress = 30 + int((i / min(len(unique_results), max_leads)) * 30)
                _update_job(job_id, progress=progress, total_urls_scraped=urls_scraped)

            except Exception as e:
                logger.warning(f"Scrape failed for {result.url}: {e}")
                continue

        logger.info(f"✅ Scraped {len(scraped_companies)} companies successfully")
        _update_job(job_id, status="extracting", progress=60)

        # ----- Step 5: Build leads from scraped data -----
        logger.info("📊 Building leads...")

        raw_leads: list[LeadData] = []

        for company in scraped_companies:
            domain = ""
            if company.website:
                from urllib.parse import urlparse
                domain = urlparse(company.website).netloc.replace("www.", "")

            # Create leads from explicit contacts
            for contact in company.contacts:
                lead = LeadData(
                    company_name=company.company_name,
                    contact_name=contact.name,
                    title=contact.title,
                    email=contact.email,
                    phone=contact.phone or (company.phones[0] if company.phones else ""),
                    website=company.website,
                    source_url=company.source_url,
                    description=company.description,
                )

                # If no email but we have name + domain, generate patterns
                if not lead.email and contact.name and domain:
                    parts = contact.name.split()
                    if len(parts) >= 2:
                        patterns = generate_email_patterns(parts[0], parts[-1], domain)
                        if patterns:
                            lead.email = patterns[0]  # Use most common pattern

                raw_leads.append(lead)

            # Create a company-level lead if we have emails but no contacts
            if not company.contacts and company.emails:
                for email in company.emails[:3]:  # Max 3 emails per company
                    raw_leads.append(LeadData(
                        company_name=company.company_name,
                        email=email,
                        phone=company.phones[0] if company.phones else "",
                        website=company.website,
                        source_url=company.source_url,
                        description=company.description,
                    ))

            # If no contacts and no emails, still add the company
            if not company.contacts and not company.emails:
                raw_leads.append(LeadData(
                    company_name=company.company_name,
                    phone=company.phones[0] if company.phones else "",
                    website=company.website,
                    source_url=company.source_url,
                    description=company.description,
                ))

        logger.info(f"📝 Built {len(raw_leads)} raw leads")
        _update_job(job_id, progress=65, total_leads_extracted=len(raw_leads))

        # ----- Step 6: Verify emails -----
        logger.info("📧 Verifying emails...")
        _update_job(job_id, status="verifying", progress=70)

        emails_to_verify = [l.email for l in raw_leads if l.email]
        if emails_to_verify:
            verification_results = await verify_emails_batch(emails_to_verify, max_concurrent=5)
            # Map results back to leads
            email_verification_map = {v["email"]: v for v in verification_results}

            for lead in raw_leads:
                if lead.email and lead.email in email_verification_map:
                    lead.email_verification = email_verification_map[lead.email]

            # Cache verifications in Supabase
            for vr in verification_results:
                try:
                    sb.table("email_verifications").upsert({
                        "email": vr["email"],
                        "domain": vr["domain"],
                        "mx_valid": vr["mx_valid"],
                        "mx_records": vr.get("mx_records", []),
                        "is_disposable": vr["is_disposable"],
                        "is_catch_all": vr.get("is_catch_all"),
                        "is_role_account": vr["is_role"],
                        "verification_method": "mx",
                    }, on_conflict="email").execute()
                except Exception as e:
                    logger.warning(f"Failed to cache verification for {vr['email']}: {e}")

        _update_job(job_id, progress=80, total_emails_verified=len(emails_to_verify))

        # ----- Step 7: Score leads -----
        logger.info("⭐ Scoring leads...")
        _update_job(job_id, status="scoring", progress=85)

        # Build ICP from business profile
        icp = ICPProfile()
        if business_profile:
            icp.description = business_profile.get("description", "")
            icp.target_industry = business_profile.get("target_customer", "")
            if business_profile.get("website"):
                icp.keywords.append(business_profile["website"])

        scored = score_leads_batch(raw_leads, icp, deduplicate=True, min_score=10)
        logger.info(f"⭐ Scored {len(scored)} leads (after dedup and filtering)")

        # ----- Step 8: Save leads to Supabase -----
        logger.info("💾 Saving leads to Supabase...")
        _update_job(job_id, progress=90)

        saved_count = 0
        for scored_lead in scored[:max_leads]:
            ld = scored_lead.lead
            try:
                lead_data = {
                    "campaign_id": campaign_id,
                    "user_id": campaign.get("user_id"),
                    "company_name": ld.company_name or "Unknown",
                    "contact_name": ld.contact_name or None,
                    "title": ld.title or None,
                    "email": ld.email or None,
                    "phone": ld.phone or None,
                    "website": ld.website or None,
                    "source_url": ld.source_url or None,
                    "source_type": "public_web",
                    "confidence": scored_lead.total_score,
                    "verification_status": _map_verification_status(ld.email_verification),
                    "metadata": json.dumps({
                        "score_breakdown": scored_lead.breakdown,
                        "company_score": scored_lead.company_score,
                        "contact_score": scored_lead.contact_score,
                        "email_score": scored_lead.email_score,
                    }),
                }

                sb.table("leads").upsert(
                    lead_data,
                    on_conflict="campaign_id,company_name,contact_name,email",
                ).execute()
                saved_count += 1

            except Exception as e:
                logger.warning(f"Failed to save lead {ld.company_name}: {e}")
                continue

        # ----- Step 9: Finalize -----
        elapsed = round(time.time() - start_time, 1)
        logger.info(f"🎉 Campaign complete! Saved {saved_count} leads in {elapsed}s")

        # Update campaign
        sb.table("lead_campaigns").update({
            "status": "completed",
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", campaign_id).execute()

        # Update job
        _update_job(
            job_id,
            status="completed",
            progress=100,
            total_leads_extracted=saved_count,
            completed_at=datetime.utcnow().isoformat(),
        )

        # Log AI usage
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

        # Update statuses to failed
        _update_job(job_id, status="failed", error_message=str(e)[:500])
        sb.table("lead_campaigns").update({"status": "failed"}).eq("id", campaign_id).execute()

        raise


def _map_verification_status(ev: dict) -> str:
    """Map email verification result to lead verification_status."""
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
async def trigger_campaign(request: dict):
    """
    HTTP webhook endpoint for Cloudflare Worker.
    Receives campaign_id and job_id, spawns the pipeline async.

    POST body: { "campaign_id": "...", "job_id": "..." }
    """
    campaign_id = request.get("campaign_id")
    job_id = request.get("job_id")

    if not campaign_id or not job_id:
        return {"error": "campaign_id and job_id are required"}, 400

    # Spawn the pipeline asynchronously (non-blocking)
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
    """Health check endpoint."""
    return {"ok": True, "service": "leadflowx-engine", "version": "1.0.0"}
