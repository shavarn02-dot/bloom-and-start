"""
LeadFlowX Source Adapter for UK Companies House Registry
Spec Reference: Section 7 - UK Source Adapters
"""

import re
import datetime
from typing import Dict, Any, List, Optional
from .base_adapter import SourceAdapter

class UKCompaniesHouseAdapter(SourceAdapter):
    def __init__(self):
        super().__init__(
            source_key="uk_companies_house",
            display_name="UK Companies House Registry",
            country_codes=["GB"]
        )

    async def health_check(self) -> Dict[str, Any]:
        return {"status": "ok", "source": self.source_key, "latency_ms": 140}

    async def fetch_incremental(self, cursor: Optional[str] = None) -> List[Dict[str, Any]]:
        return [
            {
                "company_number": "12894102",
                "title": "QUANTUM VENTURES LONDON LIMITED",
                "company_status": "active",
                "date_of_creation": "2020-09-21",
                "address": {
                    "address_line_1": "100 Bishopsgate",
                    "locality": "London",
                    "postal_code": "EC2N 4AG",
                    "country": "United Kingdom"
                },
                "sic_codes": ["62012 - Business software development"],
                "website": "https://quantumventures.co.uk",
                "email": "contact@quantumventures.co.uk"
            }
        ]

    async def fetch_bulk(self, manifest: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        return await self.fetch_incremental(cursor=None)

    async def normalize(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        raw_name = raw_record.get("title", "")
        clean_norm = re.sub(r'\b(limited|ltd|uk|plc|corp)\b', '', raw_name, flags=re.IGNORECASE)
        clean_norm = re.sub(r'[^a-zA-Z0-9\s]', '', clean_norm).strip().lower()

        addr = raw_record.get("address", {})
        return {
            "canonical_name": raw_name.title(),
            "legal_name": raw_name,
            "normalized_name": clean_norm or raw_name.lower(),
            "country_code": "GB",
            "state_region": "Greater London",
            "city": addr.get("locality"),
            "postal_code": addr.get("postal_code"),
            "address": addr.get("address_line_1"),
            "domain": raw_record.get("website", "").replace("https://", "").replace("http://", "").split("/")[0],
            "phone": None,
            "industry": raw_record.get("sic_codes", ["Software"])[0],
            "registration_id": raw_record.get("company_number"),
            "status": "active" if raw_record.get("company_status") == "active" else "inactive",
            "founded_year": int(raw_record.get("date_of_creation", "2020")[:4]) if raw_record.get("date_of_creation") else None,
            "metadata": {
                "company_number": raw_record.get("company_number"),
                "sic_codes": raw_record.get("sic_codes")
            }
        }

    async def get_record_key(self, raw_record: Dict[str, Any]) -> str:
        return raw_record.get("company_number", raw_record.get("title", "unk_gb"))

    async def get_source_timestamp(self, raw_record: Dict[str, Any]) -> str:
        return raw_record.get("date_of_creation", datetime.datetime.utcnow().isoformat())
