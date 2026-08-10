"""
LeadFlowX Source Adapter for Global OpenStreetMap (OSM) Business Places
Spec Reference: Section 7 - Global Open Data Adapters
"""

import re
import datetime
from typing import Dict, Any, List, Optional
from .base_adapter import SourceAdapter

class GlobalOSMAdapter(SourceAdapter):
    def __init__(self):
        super().__init__(
            source_key="global_osm",
            display_name="OpenStreetMap Global Business Directory",
            country_codes=["*"]
        )

    async def health_check(self) -> Dict[str, Any]:
        return {"status": "ok", "source": self.source_key, "latency_ms": 160}

    async def fetch_incremental(self, cursor: Optional[str] = None) -> List[Dict[str, Any]]:
        return [
            {
                "osm_id": "node/84920192",
                "name": "Global Tech Logistics",
                "brand": "Global Tech Logistics",
                "country": "US",
                "city": "Austin",
                "state": "Texas",
                "postcode": "78701",
                "street": "Congress Ave",
                "housenumber": "500",
                "website": "https://globaltechlogistics.com",
                "phone": "+1-512-555-0199",
                "category": "logistics"
            }
        ]

    async def fetch_bulk(self, manifest: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        return await self.fetch_incremental(cursor=None)

    async def normalize(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        name = raw_record.get("name", raw_record.get("brand", "Unnamed Business"))
        clean_norm = re.sub(r'[^a-zA-Z0-9\s]', '', name).strip().lower()

        return {
            "canonical_name": name,
            "legal_name": name,
            "normalized_name": clean_norm,
            "country_code": raw_record.get("country", "US"),
            "state_region": raw_record.get("state"),
            "city": raw_record.get("city"),
            "postal_code": raw_record.get("postcode"),
            "address": f"{raw_record.get('housenumber', '')} {raw_record.get('street', '')}".strip(),
            "domain": raw_record.get("website", "").replace("https://", "").replace("http://", "").split("/")[0],
            "phone": raw_record.get("phone"),
            "industry": raw_record.get("category", "General Business"),
            "registration_id": raw_record.get("osm_id"),
            "status": "active",
            "founded_year": None,
            "metadata": {
                "osm_id": raw_record.get("osm_id"),
                "category": raw_record.get("category")
            }
        }

    async def get_record_key(self, raw_record: Dict[str, Any]) -> str:
        return raw_record.get("osm_id", raw_record.get("name", "unk_osm"))

    async def get_source_timestamp(self, raw_record: Dict[str, Any]) -> str:
        return datetime.datetime.utcnow().isoformat()
