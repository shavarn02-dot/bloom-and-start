"""
Unit Tests for LeadFlowX Entity Resolution & Deduplication
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from modal.entity_resolver import EntityResolver, normalize_company_name

def test_normalize_company_name():
    assert normalize_company_name("Acme Tech Private Limited") == "acme tech"
    assert normalize_company_name("CloudScale Solutions Inc.") == "cloudscale solutions"

def test_entity_resolver_deduplication():
    records = [
        {
            "canonical_name": "TechFlow Innovations Private Limited",
            "registration_id": "U72900KA2024PTC184920",
            "country_code": "IN",
            "city": "Bengaluru",
            "domain": "techflow.in"
        },
        {
            "canonical_name": "TechFlow Innovations Pvt Ltd",
            "registration_id": "U72900KA2024PTC184920", # Same registration ID
            "country_code": "IN",
            "city": "Bengaluru",
            "phone": "+91-9876543210"
        },
        {
            "canonical_name": "Unique Company LLC",
            "registration_id": "US999111222",
            "country_code": "US",
            "city": "Austin",
            "domain": "uniquecompany.com"
        }
    ]

    deduped, decisions = EntityResolver.deduplicate_records(records)
    assert len(deduped) == 2
    assert len(decisions) == 1
    assert decisions[0]["decision"] == "merged"
    assert decisions[0]["match_method"] == "registration_id"
    assert deduped[0]["phone"] == "+91-9876543210" # Merged field

if __name__ == "__main__":
    test_normalize_company_name()
    test_entity_resolver_deduplication()
    print("[OK] All Entity Resolution & Deduplication Unit Tests Passed!")
