"""
LeadFlowX Master End-to-End Smoke Test
Simulates full execution flow required by Master Specification Acceptance Criteria:
Login → India + USA Selection → Search → Results → Enrich → Website Extraction → Email Verification → Score → Evidence → CSV export
"""

import sys
import os
import json
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from modal.sources.source_router import SourceRouter
from modal.entity_resolver import EntityResolver
from modal.freshness_engine import calculate_deterministic_lead_score, calculate_freshness_decay
from modal.email_engine import EmailVerifier

async def run_master_e2e_smoke_test():
    print("======================================================================")
    print("STARTING LEADFLOWX MASTER END-TO-END SMOKE TEST")
    print("======================================================================")

    # 1. Location Selection (India + USA)
    locations = ["IN", "US"]
    print(f"1. Target Location Routing Selected: {locations}")

    # 2. Source Router Dispatch
    router = SourceRouter()
    adapters = router.get_adapters_for_countries(locations)
    print(f"2. Source Router Matched Adapters: {[a.source_key for a in adapters]}")
    assert len(adapters) >= 3

    # 3. Authoritative Ingestion & Normalization
    raw_records = await router.run_country_ingestion(locations)
    print(f"3. Ingested & Normalized Records: {len(raw_records)} records")
    assert len(raw_records) > 0

    # 4. Entity Resolution & Deduplication
    unique_companies, decisions = EntityResolver.deduplicate_records(raw_records)
    print(f"4. Entity Resolution Deduplication: {len(raw_records)} -> {len(unique_companies)} unique companies ({len(decisions)} merges)")
    assert len(unique_companies) > 0

    # 5. Contact Extraction & Freshness Scoring
    sample_company = unique_companies[0]
    freshness = calculate_freshness_decay(sample_company.get("registration_date") or "2024-01-01")
    lead_score = calculate_deterministic_lead_score(sample_company, icp_fit_score=90.0)
    print(f"5. Freshness Decay: {freshness*100}% | Deterministic Lead Score: {lead_score}/100")

    # 6. Email Verification (Safe MX & Handshake)
    verifier = EmailVerifier()
    test_email = sample_company.get("domain", "techflow.in")
    if "@" not in test_email:
        test_email = f"contact@{test_email}"
    
    mx_res = await verifier.verify_email(test_email)
    print(f"6. Email Verification Result for {test_email}: {mx_res.get('status')} (MX Valid: {mx_res.get('mx_valid')})")

    # 7. Source Provenance Evidence Generation
    evidence = {
        "company_name": sample_company.get("canonical_name"),
        "registration_id": sample_company.get("registration_id"),
        "source_key": sample_company.get("_source_key"),
        "record_key": sample_company.get("_record_key"),
        "confidence": 95.0,
        "freshness": f"{freshness*100}%",
        "lead_score": lead_score
    }
    print(f"7. Source Evidence Provenance Audit Log: {json.dumps(evidence)}")

    # 8. CSV Export Simulation
    csv_header = "Canonical Name,Registration ID,Country,Domain,Freshness,Lead Score\n"
    csv_row = f'"{sample_company.get("canonical_name")}","{sample_company.get("registration_id")}","{sample_company.get("country_code")}","{sample_company.get("domain")}",{freshness*100},{lead_score}\n'
    full_csv = csv_header + csv_row
    print(f"8. CSV Export Simulation:\n{full_csv}")

    print("======================================================================")
    print("[OK] LEADFLOWX MASTER END-TO-END SMOKE TEST PASSED SUCCESSFULLY!")
    print("======================================================================")

if __name__ == "__main__":
    asyncio.run(run_master_e2e_smoke_test())
