"""
LeadFlowX Real Source Adapter for USA SAM.gov (System for Award Management)
Spec Reference: RC-01 Real Integration (No Mock Data)
Pending official SAM.gov API key. Set to status PENDING_REVIEW (disabled by default).
"""

import re
import datetime
from typing import Dict, Any, List, Optional
try:
    from .base_adapter import SourceAdapter
except ImportError:
    from base_adapter import SourceAdapter

class USASAMAdapter(SourceAdapter):
    def __init__(self):
        super().__init__(
            source_key="usa_sam",
            display_name="USA SAM.gov Entity Registrations",
            country_codes=["US"]
        )

    async def health_check(self) -> Dict[str, Any]:
        return {"status": "pending_credentials", "source": self.source_key, "requires_api_key": True}

    async def fetch_incremental(self, cursor: Optional[str] = None) -> List[Dict[str, Any]]:
        # Hard rule: No fixture/mock records. Returns empty list until official SAM API key is configured.
        return []

    async def fetch_bulk(self, manifest: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        return []

    async def normalize(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        legal_name = raw_record.get("legal_business_name", "")
        dba = raw_record.get("dba_name") or legal_name
        clean_norm = re.sub(r'\b(llc|inc|corp|ltd)\b', '', dba, flags=re.IGNORECASE)
        clean_norm = re.sub(r'[^a-zA-Z0-9\s]', '', clean_norm).strip().lower()

        return {
            "canonical_name": dba,
            "legal_name": legal_name,
            "normalized_name": clean_norm or dba.lower(),
            "country_code": "US",
            "state_region": raw_record.get("physical_address", {}).get("state_or_province"),
            "city": raw_record.get("physical_address", {}).get("city"),
            "postal_code": raw_record.get("physical_address", {}).get("zip_code"),
            "address": raw_record.get("physical_address", {}).get("address_line1"),
            "domain": raw_record.get("entity_url", "").replace("https://", "").replace("http://", "").split("/")[0],
            "phone": None,
            "industry": raw_record.get("primary_naics"),
            "registration_id": raw_record.get("uei"),
            "status": "active" if raw_record.get("registration_status") == "Active" else "inactive",
            "founded_year": int(raw_record.get("registration_date", "2022")[:4]) if raw_record.get("registration_date") else None,
            "metadata": {
                "uei": raw_record.get("uei"),
                "naics": raw_record.get("primary_naics")
            }
        }

    async def get_record_key(self, raw_record: Dict[str, Any]) -> str:
        return raw_record.get("uei", raw_record.get("legal_business_name", "unk_us"))

    async def get_source_timestamp(self, raw_record: Dict[str, Any]) -> str:
        return raw_record.get("registration_date", datetime.datetime.utcnow().isoformat())
