"""
Unit Tests for LeadFlowX Multi-Country Source Adapters & Source Router
"""

import sys
import os
import asyncio

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from modal.sources.source_router import SourceRouter
from modal.sources.india_mca import IndiaMCAAdapter
from modal.sources.usa_sam import USASAMAdapter
from modal.sources.uk_companies_house import UKCompaniesHouseAdapter
from modal.sources.global_osm import GlobalOSMAdapter

def test_source_router_country_matching():
    router = SourceRouter()

    # Route India + USA
    adapters = router.get_adapters_for_countries(["IN", "US"])
    keys = [a.source_key for a in adapters]
    
    assert "usa_sec" in keys
    assert "global_osm" in keys # Global adapter included

def test_india_mca_adapter_normalization():
    adapter = IndiaMCAAdapter()
    raw = {
        "company_name": "ACME TECH INDIA PRIVATE LIMITED",
        "cin": "U72900KA2024PTC184920",
        "registration_date": "2024-01-15",
        "state": "Karnataka",
        "city": "Bengaluru",
        "status": "Active",
        "website": "https://acmetech.in"
    }

    norm = asyncio.run(adapter.normalize(raw))
    assert norm["country_code"] == "IN"
    assert norm["canonical_name"] == "Acme Tech India Private Limited"
    assert norm["registration_id"] == "U72900KA2024PTC184920"
    assert norm["domain"] == "acmetech.in"
    assert norm["status"] == "active"

def test_usa_sam_adapter_normalization():
    adapter = USASAMAdapter()
    raw = {
        "legal_business_name": "CYBERNETIX CORP",
        "uei": "K9Z1MN87J4P2",
        "registration_status": "Active",
        "physical_address": {"city": "Austin", "state_or_province": "TX"}
    }

    norm = asyncio.run(adapter.normalize(raw))
    assert norm["country_code"] == "US"
    assert norm["canonical_name"] == "CYBERNETIX CORP"
    assert norm["registration_id"] == "K9Z1MN87J4P2"

if __name__ == "__main__":
    test_source_router_country_matching()
    test_india_mca_adapter_normalization()
    test_usa_sam_adapter_normalization()
    print("[OK] All Source Adapter Unit Tests Passed!")
