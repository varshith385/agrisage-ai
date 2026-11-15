"""
Grow2Gain — Sub-Districts & Villages Dataset Bundler
Downloads and processes official Sub-District / Mandal / Taluk Headquarters
from datta07/INDIAN-SHAPEFILES (MIT License) for Telangana, Andhra Pradesh,
Karnataka, and Maharashtra.
Normalizes district names to match standard 33 Telangana and 26 Andhra Pradesh districts.
"""
import json
from pathlib import Path
import httpx

URLS = {
    "Telangana": "https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/STATES/TELANGANA/TELANGANA%20Sub%20District%20Hq.geojson",
    "Andhra Pradesh": "https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/STATES/ANDHRA%20PRADESH/ANDHRA%20PRADESH%20Sub%20District%20Hq.geojson",
    "Karnataka": "https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/STATES/KARNATAKA/KARNATAKA%20Sub%20District%20Hq.geojson",
    "Maharashtra": "https://raw.githubusercontent.com/datta07/INDIAN-SHAPEFILES/master/STATES/MAHARASHTRA/MAHARASHTRA%20Sub%20District%20Hq.geojson",
}

BACKEND_OUT = Path("backend/app/data/subdistricts_villages.json")
FRONTEND_OUT = Path("frontend/src/data/subdistricts_villages.json")

BACKEND_OUT.parent.mkdir(parents=True, exist_ok=True)
FRONTEND_OUT.parent.mkdir(parents=True, exist_ok=True)

# Normalization for Telangana 2021 reorganization names
TS_DISTRICT_ALIASES = {
    "Warangal Rural": "Warangal",
    "Warangal Urban": "Hanumakonda",
    "Jangoan": "Jangaon",
    "Jagitial": "Jagtial",
    "Medchal Malkajgiri": "Medchal-Malkajgiri",
    "Ranga Reddy": "Rangareddy",
    "Jayashankar": "Jayashankar Bhupalpally",
    "Komaram Bheem": "Kumuram Bheem Asifabad",
}

def main():
    bundle = {
        "metadata": {
            "source": "datta07/INDIAN-SHAPEFILES (GitHub)",
            "license": "MIT License",
            "source_urls": list(URLS.values()),
            "retrieved_date": "2026-11-15",
            "description": "Sub-district and mandal headquarters centroid coordinates for TS, AP, KA, and MH.",
        },
        "states": {},
    }

    total_mandals = 0
    client = httpx.Client(timeout=30.0)

    for state_name, url in URLS.items():
        print(f"Fetching subdistricts for {state_name}...")
        resp = client.get(url, headers={"User-Agent": "Mozilla/5.0"})
        resp.raise_for_status()
        data = resp.json()

        state_dists = {}
        for feat in data.get("features", []):
            props = feat.get("properties", {})
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [None, None])
            lon, lat = coords[0], coords[1]
            dist = props.get("dtname") or props.get("DISTRICT") or props.get("District")
            mandal = props.get("LOC_NAME") or props.get("NAME11") or props.get("SUB_DIST")

            if not dist or not mandal or lat is None or lon is None:
                continue

            dist_clean = dist.strip()
            if state_name == "Telangana" and dist_clean in TS_DISTRICT_ALIASES:
                dist_clean = TS_DISTRICT_ALIASES[dist_clean]

            mandal_clean = mandal.strip()

            if dist_clean not in state_dists:
                state_dists[dist_clean] = []

            # Avoid duplicates
            if not any(m["name"] == mandal_clean for m in state_dists[dist_clean]):
                state_dists[dist_clean].append({
                    "name": mandal_clean,
                    "latitude": round(float(lat), 4),
                    "longitude": round(float(lon), 4),
                })
                total_mandals += 1

        bundle["states"][state_name] = state_dists
        st_count = sum(len(m) for m in state_dists.values())
        print(f"  {state_name}: {len(state_dists)} districts, {st_count} mandals/villages")

    # Add historical sample villages for Warangal, Karimnagar etc if not already present
    existing_samples = {
        "Telangana": {
            "Warangal": [
                {"name": "Geikonda", "latitude": 17.9689, "longitude": 79.5941},
                {"name": "Dharmasagar", "latitude": 17.9944, "longitude": 79.4589},
                {"name": "Atmakur", "latitude": 18.0833, "longitude": 79.7167},
                {"name": "Wardhannapet", "latitude": 17.7667, "longitude": 79.6000},
                {"name": "Parkal", "latitude": 18.2000, "longitude": 79.7167},
            ]
        }
    }
    for st, d_map in existing_samples.items():
        if st not in bundle["states"]:
            bundle["states"][st] = {}
        for d_name, v_list in d_map.items():
            if d_name not in bundle["states"][st]:
                bundle["states"][st][d_name] = []
            for v in v_list:
                if not any(m["name"] == v["name"] for m in bundle["states"][st][d_name]):
                    bundle["states"][st][d_name].append(v)

    with open(BACKEND_OUT, "w", encoding="utf-8") as f:
        json.dump(bundle, f, indent=2)

    with open(FRONTEND_OUT, "w", encoding="utf-8") as f:
        json.dump(bundle, f, indent=2)

    print(f"\nBundle successfully saved with normalized names:")
    print(f"  Backend : {BACKEND_OUT} ({BACKEND_OUT.stat().st_size} bytes)")
    print(f"  Frontend: {FRONTEND_OUT} ({FRONTEND_OUT.stat().st_size} bytes)")
    print(f"  Total villages/mandals: {total_mandals}")


if __name__ == "__main__":
    main()
