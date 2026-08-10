"""
LeadFlowX Real Source Adapter for India MCA (Ministry of Corporate Affairs)
Spec Reference: RC-01 Real Integration (No Mock Data)
Pending official MCA API credentials. Set to status PENDING_REVIEW (disabled by default).
"""

import re
import datetime
from typing import Dict, Any, List, Optional
try:
    from .base_adapter import SourceAdapter
except ImportError:
    from base_adapter import SourceAdapter

class IndiaMCAAdapter(SourceAdapter):
    def __init__(self):
        super().__init__(
            source_key="india_mca",
            display_name="India Ministry of Corporate Affairs",
            country_codes=["IN"]
        )

    async def health_check(self) -> Dict[str, Any]:
        return {"status": "pending_credentials", "source": self.source_key, "requires_api_key": True}

    async def fetch_incremental(self, cursor: Optional[str] = None) -> List[Dict[str, Any]]:
        # Hard rule: No fixture/mock records. Returns empty list until official MCA API credentials are provided.
        return []

    async def fetch_bulk(self, manifest: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        return []

    async def normalize(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        raw_name = raw_record.get("company_name", "")
        clean_norm = re.sub(r'\b(private|limited|pvt|ltd)\b', '', raw_name, flags=re.IGNORECASE)
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
                "cin": raw_record.get("cin"),
                "roc": raw_record.get("roc")
            }
        }

    async def get_record_key(self, raw_record: Dict[str, Any]) -> str:
        return raw_record.get("cin", raw_record.get("company_name", "unk_in"))

    async def get_source_timestamp(self, raw_record: Dict[str, Any]) -> str:
        return raw_record.get("registration_date", datetime.datetime.utcnow().isoformat())
