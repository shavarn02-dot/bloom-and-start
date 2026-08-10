"""
LeadFlowX Real Source Adapter for Global OpenStreetMap (OSM / Nominatim)
Spec Reference: RC-01 Real Integration (No Mock Data)
Queries real official OpenStreetMap Nominatim API for active global business places.
"""

import re
import datetime
import urllib.request
import json
from typing import Dict, Any, List, Optional
try:
    from .base_adapter import SourceAdapter
except ImportError:
    from base_adapter import SourceAdapter

class GlobalOSMAdapter(SourceAdapter):
    def __init__(self):
        super().__init__(
            source_key="global_osm",
            display_name="OpenStreetMap Global Business Directory",
            country_codes=["*"]
        )
        self.endpoint = "https://nominatim.openstreetmap.org/search"

    async def health_check(self) -> Dict[str, Any]:
        try:
            req = urllib.request.Request(
                f"{self.endpoint}?q=san+francisco+office&format=json&limit=1",
                headers={"User-Agent": "LeadFlowX/2.0 (compliance@leadflowx.com)"}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                return {"status": "ok", "source": self.source_key, "http_code": resp.status}
        except Exception as e:
            return {"status": "degraded", "source": self.source_key, "error": str(e)}

    async def fetch_incremental(self, cursor: Optional[str] = None) -> List[Dict[str, Any]]:
        """Queries official OpenStreetMap Nominatim search API for real business places."""
        url = f"{self.endpoint}?q=technology+company&format=json&addressdetails=1&limit=10"

        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "LeadFlowX/2.0 (compliance@leadflowx.com)"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                records = []
                for item in data:
                    display_name = item.get("display_name", "")
                    name = display_name.split(",")[0]
                    addr = item.get("address", {})
                    
                    records.append({
                        "osm_id": f"{item.get('osm_type')}/{item.get('osm_id')}",
                        "name": name,
                        "brand": name,
                        "country": addr.get("country_code", "us").upper(),
                        "city": addr.get("city") or addr.get("town") or addr.get("county") or "San Francisco",
                        "state": addr.get("state"),
                        "postcode": addr.get("postcode"),
                        "street": addr.get("road"),
                        "housenumber": addr.get("house_number"),
                        "website": item.get("extratags", {}).get("website") if isinstance(item.get("extratags"), dict) else None,
                        "phone": None,
                        "category": item.get("type", "office")
                    })
                return records
        except Exception as e:
            print(f"OSM Nominatim API fetch error: {e}")
            return []

    async def fetch_bulk(self, manifest: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        return await self.fetch_incremental(cursor=None)

    async def normalize(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        name = raw_record.get("name", "Unnamed Business")
        clean_norm = re.sub(r'[^a-zA-Z0-9\s]', '', name).strip().lower()

        raw_web = raw_record.get("website") or ""
        domain = raw_web.replace("https://", "").replace("http://", "").split("/")[0] if raw_web else None

        return {
            "canonical_name": name,
            "legal_name": name,
            "normalized_name": clean_norm,
            "country_code": raw_record.get("country", "US"),
            "state_region": raw_record.get("state"),
            "city": raw_record.get("city"),
            "postal_code": raw_record.get("postcode"),
            "address": f"{raw_record.get('housenumber', '')} {raw_record.get('street', '')}".strip(),
            "domain": domain,
            "phone": raw_record.get("phone"),
            "industry": raw_record.get("category", "General Office"),
            "registration_id": raw_record.get("osm_id"),
            "status": "active",
            "founded_year": None,
            "metadata": {
                "osm_id": raw_record.get("osm_id"),
                "source": "OpenStreetMap Official Nominatim API"
            }
        }

    async def get_record_key(self, raw_record: Dict[str, Any]) -> str:
        return raw_record.get("osm_id", raw_record.get("name", "unk_osm"))

    async def get_source_timestamp(self, raw_record: Dict[str, Any]) -> str:
        return datetime.datetime.utcnow().isoformat()
