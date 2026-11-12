"""
Static dataset of Indian States, Districts, and Sample Villages with approximate centroid coordinates.
Covers Telangana, Andhra Pradesh, Karnataka, and Maharashtra.
NOTE: Village list is a representative sample and is explicitly partial.
"""

from typing import Dict, List, Optional

INDIAN_LOCATIONS: Dict[str, Dict[str, List[Dict[str, float]]]] = {
    "Telangana": {
        "Warangal": [
            {"village": "Geikonda", "lat": 17.9689, "lon": 79.5941},
            {"village": "Dharmasagar", "lat": 17.9944, "lon": 79.4589},
            {"village": "Atmakur", "lat": 18.0833, "lon": 79.7167},
            {"village": "Wardhannapet", "lat": 17.7667, "lon": 79.6000},
            {"village": "Parkal", "lat": 18.2000, "lon": 79.7167},
        ],
        "Karimnagar": [
            {"village": "Choppadandi", "lat": 18.5833, "lon": 79.1667},
            {"village": "Manakondur", "lat": 18.4000, "lon": 79.1833},
            {"village": "Huzurabad", "lat": 18.1833, "lon": 79.3833},
            {"village": "Jammikunta", "lat": 18.3000, "lon": 79.4667},
        ],
        "Nalgonda": [
            {"village": "Miryalaguda", "lat": 16.8667, "lon": 79.5667},
            {"village": "Devarakonda", "lat": 16.7000, "lon": 78.9167},
            {"village": "Nakrekal", "lat": 17.1667, "lon": 79.4167},
        ],
        "Nizamabad": [
            {"village": "Armoor", "lat": 18.7833, "lon": 78.2833},
            {"village": "Bodhan", "lat": 18.6667, "lon": 77.9000},
            {"village": "Bheemgal", "lat": 18.7167, "lon": 78.4333},
        ],
    },
    "Andhra Pradesh": {
        "Guntur": [
            {"village": "Tenali", "lat": 16.2430, "lon": 80.6400},
            {"village": "Mangalagiri", "lat": 16.4300, "lon": 80.5700},
            {"village": "Sattenapalle", "lat": 16.4000, "lon": 80.1800},
        ],
        "Krishna": [
            {"village": "Gudivada", "lat": 16.4300, "lon": 80.9900},
            {"village": "Machilipatnam", "lat": 16.1800, "lon": 81.1300},
            {"village": "Nuzvid", "lat": 16.7800, "lon": 80.8500},
        ],
        "Kurnool": [
            {"village": "Nandyal", "lat": 15.4800, "lon": 78.4800},
            {"village": "Adoni", "lat": 15.6300, "lon": 77.2800},
            {"village": "Yemmiganur", "lat": 15.7300, "lon": 77.4800},
        ],
    },
    "Karnataka": {
        "Dharwad": [
            {"village": "Hubballi Rural", "lat": 15.3647, "lon": 75.1240},
            {"village": "Navalgund", "lat": 15.5667, "lon": 75.3667},
            {"village": "Kalghatgi", "lat": 15.1833, "lon": 74.9667},
        ],
        "Belagavi": [
            {"village": "Gokak", "lat": 16.1667, "lon": 74.8333},
            {"village": "Chikkodi", "lat": 16.4333, "lon": 74.6000},
            {"village": "Athani", "lat": 16.7333, "lon": 75.0667},
        ],
    },
    "Maharashtra": {
        "Nagpur": [
            {"village": "Katol", "lat": 21.2667, "lon": 78.5833},
            {"village": "Umred", "lat": 20.8500, "lon": 79.3333},
            {"village": "Saoner", "lat": 21.3833, "lon": 78.9167},
        ],
        "Yavatmal": [
            {"village": "Pusad", "lat": 19.9000, "lon": 77.5833},
            {"village": "Darwha", "lat": 20.3167, "lon": 77.7667},
            {"village": "Wani", "lat": 20.0667, "lon": 78.9500},
        ],
    },
}


def get_states() -> List[str]:
    return list(INDIAN_LOCATIONS.keys())


def get_districts(state: str) -> List[str]:
    state_data = INDIAN_LOCATIONS.get(state)
    if not state_data:
        return []
    return list(state_data.keys())


def get_villages(state: str, district: str) -> List[Dict[str, float]]:
    state_data = INDIAN_LOCATIONS.get(state)
    if not state_data:
        return []
    return state_data.get(district, [])


def find_approx_centroid(query: str) -> Optional[Dict[str, float]]:
    q = query.strip().lower()
    for state, districts in INDIAN_LOCATIONS.items():
        if q in state.lower():
            # Return first district's first village
            first_dist = list(districts.keys())[0]
            v = districts[first_dist][0]
            return {"name": state, "lat": v["lat"], "lon": v["lon"]}
        for district, villages in districts.items():
            if q in district.lower():
                v = villages[0]
                return {"name": f"{district}, {state}", "lat": v["lat"], "lon": v["lon"]}
            for v in villages:
                if q in v["village"].lower():
                    return {"name": f"{v['village']}, {district}, {state}", "lat": v["lat"], "lon": v["lon"]}
    return None

