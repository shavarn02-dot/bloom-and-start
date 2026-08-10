"""
LeadFlowX Source Router & Registry Orchestrator
Spec Reference: Section 4 - Country / Location Routing
"""

from typing import List, Dict, Any, Optional
from .base_adapter import SourceAdapter
from .india_mca import IndiaMCAAdapter
from .usa_sam import USASAMAdapter
from .uk_companies_house import UKCompaniesHouseAdapter
from .global_osm import GlobalOSMAdapter

class SourceRouter:
    def __init__(self):
        self.adapters: Dict[str, SourceAdapter] = {
            "india_mca": IndiaMCAAdapter(),
            "usa_sam": USASAMAdapter(),
            "uk_companies_house": UKCompaniesHouseAdapter(),
            "global_osm": GlobalOSMAdapter(),
        }

    def get_adapters_for_countries(self, country_codes: List[str]) -> List[SourceAdapter]:
        """
        Route request to source adapters matching target countries (e.g. ['IN', 'US', 'GB']).
        Includes global adapters (['*']) as fallback.
        """
        matched: List[SourceAdapter] = []
        codes_upper = [c.upper() for c in country_codes]

        for adapter in self.adapters.values():
            if "*" in adapter.country_codes:
                matched.append(adapter)
            elif any(code in adapter.country_codes for code in codes_upper):
                matched.append(adapter)

        return matched

    async def run_country_ingestion(self, country_codes: List[str]) -> List[Dict[str, Any]]:
        """
        Execute parallel ingestion across approved source adapters for target countries,
        returning normalized canonical records.
        """
        adapters = self.get_adapters_for_countries(country_codes)
        all_normalized: List[Dict[str, Any]] = []

        for adapter in adapters:
            try:
                raw_records = await adapter.fetch_incremental()
                for rec in raw_records:
                    normalized = await adapter.normalize(rec)
                    normalized["_source_key"] = adapter.source_key
                    normalized["_record_key"] = await adapter.get_record_key(rec)
                    all_normalized.append(normalized)
            except Exception as e:
                print(f"Error executing source adapter {adapter.source_key}: {e}")

        return all_normalized
