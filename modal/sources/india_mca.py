"""
LeadFlowX Source Adapter for India MCA (Ministry of Corporate Affairs)
Spec Reference: Section 7 - India Source Adapters
"""

import re
import datetime
from typing import Dict, Any, List, Optional
from .base_adapter import SourceAdapter

class IndiaMCAAdapter(SourceAdapter):
    def __init__(self):
        super().__init__(
            source_key="india_mca",
            display_name="India Ministry of Corporate Affairs",
            country_codes=["IN"]
        )

    async def health_check(self) -> Dict[str, Any]:
        return {"status": "ok", "source": self.source_key, "latency_ms": 120}

    async def fetch_incremental(self, cursor: Optional[str] = None) -> List[Dict[str, Any]]:
        # Mock/simulated public API response payload for new MCA registrations
        return [
            {
                "cin": "U72900KA2024PTC184920",
                "company_name": "TECHFLOW INNOVATIONS PRIVATE LIMITED",
                "roc": "ROC Bangalore",
                "registration_date": "2024-01-15",
                "category": "Company limited by Shares",
                "class": "Private",
                "state": "Karnataka",
                "city": "Bengaluru",
                "address": "No 42, 100 Feet Road, Indiranagar, Bengaluru, KA 560038",
                "pin_code": "560038",
                "status": "Active",
                "authorized_capital": 1000000,
                "email": "contact@techflowinnovations.in",
                "website": "https://techflowinnovations.in"
            },
            {
                "cin": "U74999MH2023PTC412345",
                "company_name": "CLOUDSCALE INDIA PRIVATE LIMITED",
                "roc": "ROC Mumbai",
                "registration_date": "2023-08-10",
                "category": "Company limited by Shares",
                "class": "Private",
                "state": "Maharashtra",
                "city": "Mumbai",
                "address": "Level 5, BKC Cyber Tower, Bandra East, Mumbai, MH 400051",
                "pin_code": "400051",
                "status": "Active",
                "authorized_capital": 5000000,
                "email": "info@cloudscale.in",
                "website": "https://cloudscale.in"
            }
        ]

    async def fetch_bulk(self, manifest: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        return await self.fetch_incremental(cursor=None)

    async def normalize(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        raw_name = raw_record.get("company_name", "")
        # Clean company name: lower + strip common legal suffixes for normalized_name
        clean_norm = re.sub(r'\b(private|limited|pvt|ltd|inc|corp)\b', '', raw_name, flags=re.IGNORECASE)
        clean_norm = re.sub(r'[^a-zA-Z0-9\s]', '', clean_norm).strip().lower()

        return {
            "canonical_name": raw_name.title(),
            "legal_name": raw_name,
            "normalized_name": clean_norm or raw_name.lower(),
            "country_code": "IN",
            "state_region": raw_record.get("state"),
            "city": raw_record.get("city"),
            "postal_code": raw_record.get("pin_code"),
            "address": raw_record.get("address"),
            "domain": raw_record.get("website", "").replace("https://", "").replace("http://", "").split("/")[0],
            "phone": None,
            "industry": "Information Technology",
            "registration_id": raw_record.get("cin"),
            "status": "active" if raw_record.get("status") == "Active" else "inactive",
            "founded_year": int(raw_record.get("registration_date", "2024")[:4]) if raw_record.get("registration_date") else None,
            "metadata": {
                "roc": raw_record.get("roc"),
                "authorized_capital": raw_record.get("authorized_capital"),
                "class": raw_record.get("class")
            }
        }

    async def get_record_key(self, raw_record: Dict[str, Any]) -> str:
        return raw_record.get("cin", raw_record.get("company_name", "unk_in"))

    async def get_source_timestamp(self, raw_record: Dict[str, Any]) -> str:
        return raw_record.get("registration_date", datetime.datetime.utcnow().isoformat())
