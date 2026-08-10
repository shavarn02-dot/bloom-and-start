"""
LeadFlowX Base Source Adapter Class
Spec Reference: Section 7 - Source Adapter Contract
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
import datetime

class SourceAdapter(ABC):
    def __init__(self, source_key: str, display_name: str, country_codes: List[str]):
        self.source_key = source_key
        self.display_name = display_name
        self.country_codes = country_codes
        self.cursor = None

    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Check if source API / feed is responsive."""
        pass

    @abstractmethod
    async def fetch_incremental(self, cursor: Optional[str] = None) -> List[Dict[str, Any]]:
        """Fetch updated records since last cursor."""
        pass

    @abstractmethod
    async def fetch_bulk(self, manifest: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Fetch bulk data snapshot."""
        pass

    @abstractmethod
    async def normalize(self, raw_record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalize raw record into canonical LeadFlowX schema:
        {
          "canonical_name": str,
          "legal_name": str,
          "normalized_name": str,
          "country_code": str,
          "state_region": str,
          "city": str,
          "postal_code": str,
          "address": str,
          "domain": str,
          "phone": str,
          "industry": str,
          "registration_id": str,
          "status": "active" | "inactive" | "dissolved" | "cancelled",
          "founded_year": int,
          "metadata": dict
        }
        """
        pass

    @abstractmethod
    async def get_record_key(self, raw_record: Dict[str, Any]) -> str:
        """Return unique source record identifier."""
        pass

    @abstractmethod
    async def get_source_timestamp(self, raw_record: Dict[str, Any]) -> str:
        """Return timestamp when record was updated at source."""
        pass

    def get_cursor(self) -> Optional[str]:
        """Return current incremental pagination cursor."""
        return self.cursor
