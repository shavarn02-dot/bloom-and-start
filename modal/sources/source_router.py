"""
LeadFlowX Source Router & Registry Orchestrator
Spec Reference: RC-02 Source Registry as Source of Truth
"""

from typing import List, Dict, Any, Optional
try:
    from .base_adapter import SourceAdapter
    from .india_mca import IndiaMCAAdapter
    from .usa_sam import USASAMAdapter
    from .usa_sec import USASECAdapter
    from .uk_companies_house import UKCompaniesHouseAdapter
    from .global_osm import GlobalOSMAdapter
except ImportError:
    from base_adapter import SourceAdapter
    from india_mca import IndiaMCAAdapter
    from usa_sam import USASAMAdapter
    from usa_sec import USASECAdapter
    from uk_companies_house import UKCompaniesHouseAdapter
    from global_osm import GlobalOSMAdapter

class SourceRouter:
    def __init__(self):
        self.adapters: Dict[str, SourceAdapter] = {
            "usa_sec": USASECAdapter(),
            "uk_companies_house": UKCompaniesHouseAdapter(),
            "global_osm": GlobalOSMAdapter(),
            "india_mca": IndiaMCAAdapter(),
            "usa_sam": USASAMAdapter(),
        }

        # Status registry: Only APPROVED + enabled sources run in production
        self.approved_sources = {"usa_sec", "uk_companies_house", "global_osm", "india_mca", "usa_sam"}

    def get_adapters_for_countries(self, country_codes: List[str]) -> List[SourceAdapter]:
        """
        Routes request ONLY to approved and active source adapters matching target countries.
        """
        matched: List[SourceAdapter] = []
        codes_upper = [c.upper() for c in country_codes]

        for source_key, adapter in self.adapters.items():
            # Check RC-02 hard rule: Only APPROVED sources are allowed
            if source_key not in self.approved_sources:
                continue

            if "*" in adapter.country_codes:
                matched.append(adapter)
            elif any(code in adapter.country_codes for code in codes_upper):
                matched.append(adapter)

        return matched

    async def run_country_ingestion(self, country_codes: List[str]) -> List[Dict[str, Any]]:
        """
        Executes real ingestion across approved source adapters for target countries.
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
