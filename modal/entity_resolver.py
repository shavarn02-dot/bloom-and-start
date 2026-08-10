"""
LeadFlowX Conservative Entity Resolution & Deduplication Engine
Spec Reference: RC-10 Conservative Entity Resolution

Hard Rule: Ambiguous records must NOT be automatically merged.
Automatic Merging Conditions (Strict Priority):
  1. Exact Registration ID match (100% confidence)
  2. Exact Source Record ID match (100% confidence)
  3. Exact Domain match (95% confidence)
  4. Exact Phone + Address match (90% confidence)

Ambiguous name-only matches across different cities/countries are preserved as separate entities.
"""

import re
from typing import List, Dict, Any, Tuple

def normalize_company_name(name: str) -> str:
    """Normalizes company legal name by removing common legal suffixes and punctuation."""
    if not name:
        return ""
    cleaned = re.sub(r'\b(inc|incorporated|corp|corporation|llc|ltd|limited|private|pvt|co|company|plc|gmbh|sa|sarl)\b', '', name, flags=re.IGNORECASE)
    cleaned = re.sub(r'[^a-zA-Z0-9\s]', '', cleaned)
    return ' '.join(cleaned.lower().split())

class EntityResolver:
    @staticmethod
    def calculate_match_confidence(record_a: Dict[str, Any], record_b: Dict[str, Any]) -> Tuple[float, str]:
        """
        Calculates match confidence according to RC-10 strict priority rules.
        Returns (confidence_percentage, match_method).
        """
        reg_a = record_a.get("registration_id")
        reg_b = record_b.get("registration_id")
        if reg_a and reg_b and str(reg_a).strip().lower() == str(reg_b).strip().lower():
            return (100.0, "registration_id")

        rec_a = record_a.get("_record_key")
        rec_b = record_b.get("_record_key")
        if rec_a and rec_b and str(rec_a).strip().lower() == str(rec_b).strip().lower():
            return (100.0, "source_record_id")

        dom_a = record_a.get("domain")
        dom_b = record_b.get("domain")
        if dom_a and dom_b and len(dom_a) > 3 and dom_a.lower() == dom_b.lower():
            return (95.0, "official_domain")

        phone_a = record_a.get("phone")
        phone_b = record_b.get("phone")
        addr_a = record_a.get("address")
        addr_b = record_b.get("address")
        if phone_a and phone_b and phone_a == phone_b and addr_a and addr_b and addr_a == addr_b:
            return (90.0, "phone_and_address")

        # Ambiguous check: Name match without identifier confirmation is NOT merged
        norm_a = normalize_company_name(record_a.get("canonical_name", ""))
        norm_b = normalize_company_name(record_b.get("canonical_name", ""))
        city_a = (record_a.get("city") or "").lower()
        city_b = (record_b.get("city") or "").lower()

        if norm_a and norm_b and norm_a == norm_b:
            if city_a and city_b and city_a == city_b:
                return (75.0, "ambiguous_name_and_city")
            return (50.0, "ambiguous_name_only")

        return (0.0, "no_match")

    @staticmethod
    def deduplicate_records(records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Deduplicates raw normalized records.
        Only merges records with confidence >= 90.0 (RC-10 Conservative Rule).
        """
        deduped: List[Dict[str, Any]] = []
        decisions: List[Dict[str, Any]] = []

        for record in records:
            matched_index = None
            highest_confidence = 0.0
            best_method = "no_match"

            for idx, existing in enumerate(deduped):
                conf, method = EntityResolver.calculate_match_confidence(record, existing)
                if conf >= 90.0 and conf > highest_confidence:
                    matched_index = idx
                    highest_confidence = conf
                    best_method = method

            if matched_index is not None:
                # Merge fields conservatively
                target = deduped[matched_index]
                for key, val in record.items():
                    if val and not target.get(key):
                        target[key] = val

                decisions.append({
                    "record_a": record.get("canonical_name"),
                    "record_b": target.get("canonical_name"),
                    "decision": "merged",
                    "confidence": highest_confidence,
                    "match_method": best_method
                })
            else:
                deduped.append(record.copy())

        return deduped, decisions
