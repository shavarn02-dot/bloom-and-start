"""
LeadFlowX Entity Resolution & Deduplication Engine
Spec Reference: Section 11 - Entity Resolution / Deduplication
"""

import re
from typing import Dict, Any, List, Optional, Tuple

def normalize_company_name(name: str) -> str:
    if not name:
        return ""
    # Strip common legal suffixes
    clean = re.sub(r'\b(inc|llc|ltd|limited|corp|corporation|private|pvt|co|plc)\b', '', name, flags=re.IGNORECASE)
    clean = re.sub(r'[^a-zA-Z0-9\s]', '', clean)
    return ' '.join(clean.lower().split())

class EntityResolver:
    @staticmethod
    def calculate_match_score(rec_a: Dict[str, Any], rec_b: Dict[str, Any]) -> Tuple[float, str]:
        """
        Determines similarity between two company records using deterministic rules.
        Returns (score 0.0-100.0, match_method).
        """
        # Rule 1: Registration ID exact match (Strongest)
        reg_a = rec_a.get("registration_id")
        reg_b = rec_b.get("registration_id")
        if reg_a and reg_b and reg_a.strip().lower() == reg_b.strip().lower():
            return (100.0, "registration_id")

        # Rule 2: Official Domain match (Strong)
        dom_a = rec_a.get("domain")
        dom_b = rec_b.get("domain")
        if dom_a and dom_b and dom_a.strip().lower() == dom_b.strip().lower() and len(dom_a.strip()) > 3:
            return (95.0, "domain")

        # Rule 3: Normalized Name + Country + City match
        norm_a = normalize_company_name(rec_a.get("canonical_name", ""))
        norm_b = normalize_company_name(rec_b.get("canonical_name", ""))
        country_a = rec_a.get("country_code", "").upper()
        country_b = rec_b.get("country_code", "").upper()
        city_a = (rec_a.get("city") or "").lower().strip()
        city_b = (rec_b.get("city") or "").lower().strip()

        if norm_a and norm_a == norm_b:
            if country_a and country_b and country_a == country_b:
                if city_a and city_b and city_a == city_b:
                    return (90.0, "exact_name_country_city")
                return (85.0, "exact_name_country")
            return (75.0, "exact_name")

        return (0.0, "no_match")

    @staticmethod
    def deduplicate_records(records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Deduplicates a list of company records deterministically.
        Returns (unique_records, match_decisions).
        """
        unique_records: List[Dict[str, Any]] = []
        match_decisions: List[Dict[str, Any]] = []

        for record in records:
            matched_index = None
            highest_score = 0.0
            best_method = "no_match"

            for idx, existing in enumerate(unique_records):
                score, method = EntityResolver.calculate_match_score(record, existing)
                if score >= 85.0 and score > highest_score:
                    highest_score = score
                    matched_index = idx
                    best_method = method

            if matched_index is not None:
                existing = unique_records[matched_index]
                # Merge missing metadata fields into canonical record
                for k, v in record.items():
                    if v and not existing.get(k):
                        existing[k] = v

                match_decisions.append({
                    "company_a_name": existing.get("canonical_name"),
                    "company_b_name": record.get("canonical_name"),
                    "match_score": highest_score,
                    "match_method": best_method,
                    "decision": "merged"
                })
            else:
                unique_records.append(record)

        return unique_records, match_decisions
