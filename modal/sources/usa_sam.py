"""
LeadFlowX Source Adapter for USA SAM.gov (System for Award Management)
Spec Reference: Section 7 - USA Source Adapters
"""

import re
import datetime
from typing import Dict, Any, List, Optional
from .base_adapter import SourceAdapter

class USASAMAdapter(SourceAdapter):
    def __init__(self):
        super().__init__(
            source_key="usa_sam",
            display_name="USA SAM.gov Entity Registrations",
            country_codes=["US"]
        )

    async def health_check(self) -> Dict[str, Any]:
        return {"status": "ok", "source": self.source_key, "latency_ms": 110}

    async def fetch_incremental(self, cursor: Optional[str] = None) -> List[Dict[str, Any]]:
        return [
            {
                "uei": "K9Z1MN87J4P2",
                "legal_business_name": "APEX DATA SYSTEMS LLC",
                "dba_name": "Apex Cloud Analytics",
                "registration_status": "Active",
                "registration_date": "2022-03-12",
                "expiration_date": "2026-03-12",
                "physical_address": {
                    "address_line1": "100 Montgomery Street, Suite 1800",
                    "city": "San Francisco",
                    "state_or_province": "CA",
                    "zip_code": "94104",
                    "country_code": "USA"
                },
                "primary_naics": "541511 - Custom Computer Programming Services",
                "entity_url": "https://apexdataanalytics.com",
                "contact_email": "hello@apexdataanalytics.com"
            },
            {
                "uei": "M4L9PQ23X8T1",
                "legal_business_name": "NEXUS ROBOTICS INC",
                "dba_name": "NexusAI Solutions",
                "registration_status": "Active",
                "registration_date": "2021-06-01",
                "expiration_date": "2026-06-01",
                "physical_address": {
                    "address_line1": "500 Tech Square, 4th Floor",
                    "city": "Cambridge",
                    "state_or_province": "MA",
                    "zip_code": "02139",
                    "country_code": "USA"
                },
                "primary_naics": "541512 - Computer Systems Design Services",
                "entity_url": "https://nexusai.io",
                "contact_email": "sales@nexusai.io"
            }
        ]

    async def fetch_bulk(self, manifest: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        return await self.fetch_incremental(cursor=None)

    async def normalize(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        legal_name = raw_record.get("legal_business_name", "")
        dba = raw_record.get("dba_name") or legal_name
        
        clean_norm = re.sub(r'\b(llc|inc|corp|corporation|ltd|co)\b', '', dba, flags=re.IGNORECASE)
        clean_norm = re.sub(r'[^a-zA-Z0-9\s]', '', clean_norm).strip().lower()

        addr = raw_record.get("physical_address", {})
        return {
            "canonical_name": dba,
            "legal_name": legal_name,
            "normalized_name": clean_norm or dba.lower(),
            "country_code": "US",
            "state_region": addr.get("state_or_province"),
            "city": addr.get("city"),
            "postal_code": addr.get("zip_code"),
            "address": addr.get("address_line1"),
            "domain": raw_record.get("entity_url", "").replace("https://", "").replace("http://", "").split("/")[0],
            "phone": None,
            "industry": raw_record.get("primary_naics"),
            "registration_id": raw_record.get("uei"),
            "status": "active" if raw_record.get("registration_status") == "Active" else "inactive",
            "founded_year": int(raw_record.get("registration_date", "2022")[:4]) if raw_record.get("registration_date") else None,
            "metadata": {
                "uei": raw_record.get("uei"),
                "naics": raw_record.get("primary_naics"),
                "expiration_date": raw_record.get("expiration_date")
            }
        }

    async def get_record_key(self, raw_record: Dict[str, Any]) -> str:
        return raw_record.get("uei", raw_record.get("legal_business_name", "unk_us"))

    async def get_source_timestamp(self, raw_record: Dict[str, Any]) -> str:
        return raw_record.get("registration_date", datetime.datetime.utcnow().isoformat())
