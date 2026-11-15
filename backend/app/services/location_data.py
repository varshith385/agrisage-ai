"""
Grow2Gain — Location Hierarchy & Geocoding Service (Round 7c)
Implements:
- Strict cascading hierarchy: State -> District -> Village/Mandal
- Official 33 Telangana and 26 Andhra Pradesh districts
- 1,659 verified Mandal/Sub-District headquarters with Point coordinates from datta07/INDIAN-SHAPEFILES (MIT License)
- District Centre fallback marked 'approximate district centre' when village unlisted
- Strict validation rejecting mismatched child entries (422)
"""
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
FRONTEND_DATA_DIR = Path(__file__).resolve().parent.parent.parent.parent / "frontend" / "src" / "data"

SUBDISTRICTS_FILE = DATA_DIR / "subdistricts_villages.json"
if not SUBDISTRICTS_FILE.exists():
    SUBDISTRICTS_FILE = FRONTEND_DATA_DIR / "subdistricts_villages.json"

DISTRICTS_FILE = FRONTEND_DATA_DIR / "india_districts.json"

_VILLAGE_CACHE: Optional[Dict[str, Any]] = None
_DISTRICTS_CACHE: Optional[Dict[str, Any]] = None

# Backward compatibility alias
INDIAN_LOCATIONS: Dict[str, Any] = {}


def _load_data():
    global _VILLAGE_CACHE, _DISTRICTS_CACHE, INDIAN_LOCATIONS
    if _VILLAGE_CACHE is None and SUBDISTRICTS_FILE.exists():
        with open(SUBDISTRICTS_FILE, "r", encoding="utf-8") as f:
            _VILLAGE_CACHE = json.load(f).get("states", {})
            INDIAN_LOCATIONS.update(_VILLAGE_CACHE)

    if _DISTRICTS_CACHE is None and DISTRICTS_FILE.exists():
        with open(DISTRICTS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            _DISTRICTS_CACHE = {}
            for s in data.get("states", []):
                s_name = s.get("state")
                d_list = s.get("districts", [])
                _DISTRICTS_CACHE[s_name] = {
                    "latitude": s.get("latitude", 20.5937),
                    "longitude": s.get("longitude", 78.9629),
                    "districts": {
                        d.get("name"): {
                            "latitude": d.get("latitude", s.get("latitude", 20.5937)),
                            "longitude": d.get("longitude", s.get("longitude", 78.9629)),
                        }
                        for d in d_list
                    },
                }


def get_states() -> List[str]:
    _load_data()
    preferred_order = ["Telangana", "Andhra Pradesh", "Karnataka", "Maharashtra"]
    all_states = list(_DISTRICTS_CACHE.keys()) if _DISTRICTS_CACHE else preferred_order
    res = [s for s in preferred_order if s in all_states]
    res.extend([s for s in all_states if s not in res])
    return res


def get_districts(state: str) -> List[str]:
    _load_data()
    if not _DISTRICTS_CACHE or state not in _DISTRICTS_CACHE:
        # Fallback to village cache if available
        if _VILLAGE_CACHE and state in _VILLAGE_CACHE:
            return list(_VILLAGE_CACHE[state].keys())
        return []
    return list(_DISTRICTS_CACHE[state]["districts"].keys())


def get_district_centroid(state: str, district: str) -> Dict[str, float]:
    _load_data()
    if _DISTRICTS_CACHE and state in _DISTRICTS_CACHE:
        dists = _DISTRICTS_CACHE[state]["districts"]
        if district in dists:
            return dists[district]
        return {
            "latitude": _DISTRICTS_CACHE[state]["latitude"],
            "longitude": _DISTRICTS_CACHE[state]["longitude"],
        }
    return {"latitude": 17.9689, "longitude": 79.5941}


def get_villages(state: str, district: str) -> List[Dict[str, Any]]:
    _load_data()
    centroid = get_district_centroid(state, district)
    dist_centre_entry = {
        "village": "District Centre",
        "lat": centroid["latitude"],
        "lon": centroid["longitude"],
        "precision": "approximate district centre",
        "is_district_centre": True,
    }

    villages: List[Dict[str, Any]] = [dist_centre_entry]

    if _VILLAGE_CACHE and state in _VILLAGE_CACHE:
        state_mandals = _VILLAGE_CACHE[state]
        # Match district case-insensitively
        matched_dist = next((d for d in state_mandals if d.lower() == district.lower()), None)
        if matched_dist:
            for m in state_mandals[matched_dist]:
                villages.append({
                    "village": m["name"],
                    "lat": m["latitude"],
                    "lon": m["longitude"],
                    "precision": "village",
                    "is_district_centre": False,
                })

    return villages


def validate_location_hierarchy(
    state: Optional[str],
    district: Optional[str],
    village: Optional[str],
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validates State -> District -> Village hierarchy.
    Returns (is_valid, invalid_field_name, error_message).
    """
    _load_data()
    if not state:
        return True, None, None

    valid_states = get_states()
    matched_state = next((s for s in valid_states if s.lower() == state.lower()), None)
    if not matched_state:
        return False, "state", f"State '{state}' is not recognized in location directory."

    if not district:
        return True, None, None

    valid_districts = get_districts(matched_state)
    matched_district = next((d for d in valid_districts if d.lower() == district.lower()), None)
    if not matched_district:
        return (
            False,
            "district",
            f"District '{district}' is not valid for state '{matched_state}'.",
        )

    if not village:
        return True, None, None

    # Check village validity
    v_clean = village.strip().lower()
    # Accept district centre variants
    if v_clean in ("district centre", "approximate district centre", "district centre (approximate district centre)"):
        return True, None, None

    allowed_villages = get_villages(matched_state, matched_district)
    # Check if village name matches any entry
    matched_v = next((v for v in allowed_villages if v["village"].strip().lower() == v_clean), None)
    if not matched_v:
        # Check if it was in any other district of the state (to give explicit error)
        other_dist = None
        if _VILLAGE_CACHE and matched_state in _VILLAGE_CACHE:
            for d_name, m_list in _VILLAGE_CACHE[matched_state].items():
                if d_name.lower() != matched_district.lower():
                    if any(m["name"].strip().lower() == v_clean for m in m_list):
                        other_dist = d_name
                        break

        detail_msg = f"Village '{village}' is not in chosen district '{matched_district}'."
        if other_dist:
            detail_msg += f" (Note: '{village}' belongs to district '{other_dist}')."

        return False, "village", detail_msg

    return True, None, None


def find_approx_centroid(query: str) -> Optional[Dict[str, float]]:
    _load_data()
    q = query.strip().lower()
    if _DISTRICTS_CACHE:
        for s_name, s_data in _DISTRICTS_CACHE.items():
            if q == s_name.lower():
                return {"name": s_name, "lat": s_data["latitude"], "lon": s_data["longitude"]}
            for d_name, d_coords in s_data["districts"].items():
                if q == d_name.lower() or d_name.lower() in q:
                    return {"name": f"{d_name}, {s_name}", "lat": d_coords["latitude"], "lon": d_coords["longitude"]}
    return None
