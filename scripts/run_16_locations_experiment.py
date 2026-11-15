"""
Grow2Gain — 16 Locations Comprehensive Experiment Suite (Round 7b)
Tests 16 locations across diverse agro-climatic zones in India:
1. Warangal (Telangana)
2. Rajkot (Gujarat)
3. Jaipur (Rajasthan)
4. Kolkata (West Bengal)
5. Chennai (Tamil Nadu)
6. Shimla (Himachal Pradesh)
7. Guwahati (Assam)
8. Kochi (Kerala)
9. Nagpur (Maharashtra)
10. Ludhiana (Punjab)
11. Patna (Bihar)
12. Bhubaneswar (Odisha)
13. Pune (Maharashtra)
14. Coimbatore (Tamil Nadu)
15. Srinagar (Jammu & Kashmir)
16. Bikaner (Rajasthan)

Runs each location:
- Once with fixed typical soil (dataset medians: N=37.0, P=51.0, K=32.0, pH=6.43)
- Once with soil absent (weather-only model)
Outputs formatted markdown tables, counts, and analysis of crop dominance/climatic distribution.
"""
import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pandas as pd
from backend.app.ml.crop_recommender import crop_recommender_engine

WEATHER_FILE = Path(__file__).resolve().parent.parent / "model_artifacts" / "weather_16_locations.json"

# Fixed typical soil values = dataset medians
FIXED_SOIL = {
    "N": 37.0,
    "P": 51.0,
    "K": 32.0,
    "ph": 6.43,
}

LOCATIONS = [
    ("Warangal", "Telangana", 17.97, 79.59),
    ("Rajkot", "Gujarat", 22.30, 70.80),
    ("Jaipur", "Rajasthan", 26.91, 75.79),
    ("Kolkata", "West Bengal", 22.57, 88.36),
    ("Chennai", "Tamil Nadu", 13.08, 80.27),
    ("Shimla", "Himachal Pradesh", 31.10, 77.17),
    ("Guwahati", "Assam", 26.14, 91.74),
    ("Kochi", "Kerala", 9.93, 76.27),
    ("Nagpur", "Maharashtra", 21.15, 79.08),
    ("Ludhiana", "Punjab", 30.90, 75.85),
    ("Patna", "Bihar", 25.60, 85.14),
    ("Bhubaneswar", "Odisha", 20.30, 85.82),
    ("Pune", "Maharashtra", 18.52, 73.86),
    ("Coimbatore", "Tamil Nadu", 11.02, 76.96),
    ("Srinagar", "Jammu & Kashmir", 34.08, 74.80),
    ("Bikaner", "Rajasthan", 28.02, 73.31),
]


def main():
    with open(WEATHER_FILE, "r", encoding="utf-8") as f:
        weather_data = json.load(f)

    print("=" * 100)
    print("EXPERIMENT 1: 16 LOCATIONS WITH FIXED TYPICAL SOIL (N=37.0, P=51.0, K=32.0, pH=6.43)")
    print("Any difference in recommendation comes strictly from Open-Meteo measured weather variations.")
    print("=" * 100)

    fixed_soil_records = []
    fixed_top1_counts = {}
    fixed_status_counts = {"CONFIDENT": 0, "LOW_CONFIDENCE": 0, "UNUSUAL": 0, "INVALID": 0}

    for city, state, lat, lon in LOCATIONS:
        w = weather_data[city]
        t, h, r = w["temp"], w["humidity"], w["rainfall_monthly"]

        res = crop_recommender_engine.recommend(
            n=FIXED_SOIL["N"],
            p=FIXED_SOIL["P"],
            k=FIXED_SOIL["K"],
            ph=FIXED_SOIL["ph"],
            temperature=t,
            humidity=h,
            rainfall=r,
            state=state,
            district=city,
            season="Kharif",
            weather_source="Measured (Open-Meteo 12mo archive)",
            soil_source="Entered (dataset median)",
            window_dates="2025-11-10 to 2026-11-10",
        )

        status = res["decision_status"]
        fixed_status_counts[status] = fixed_status_counts.get(status, 0) + 1
        top_crops = res["top_crops"]
        top1_crop = top_crops[0]["crop_name"] if top_crops else "None"
        if top_crops:
            fixed_top1_counts[top1_crop] = fixed_top1_counts.get(top1_crop, 0) + 1

        top3_str = ", ".join([f"{c['crop_name']} ({c['probability']*100:.1f}%)" for c in top_crops[:3]]) if top_crops else "None (refused)"
        reasons_summary = res["decision_reasons"][0] if res["decision_reasons"] else "None"

        record = {
            "city": city,
            "state": state,
            "lat_lon": f"{lat}, {lon}",
            "vector": f"[N:{FIXED_SOIL['N']}, P:{FIXED_SOIL['P']}, K:{FIXED_SOIL['K']}, pH:{FIXED_SOIL['ph']}, T:{t}°C, H:{h}%, R:{r}mm]",
            "status": status,
            "confidence_label": res["confidence_label"],
            "top3": top3_str,
            "top1": top1_crop,
            "reason": reasons_summary,
        }
        fixed_soil_records.append(record)

        print(f"\nLocation: {city} ({state}) | Lat/Lon: {lat}, {lon}")
        print(f"  Input Vector   : {record['vector']}")
        print(f"  Sources        : Soil: Entered (dataset median) | Weather: Measured (Open-Meteo 12mo archive, 2025-11-10 to 2026-11-10)")
        print(f"  Decision Status: {status} ({res['confidence_label']} confidence)")
        print(f"  Top-3 Crops    : {top3_str}")
        print(f"  Primary Reason : {reasons_summary}")

    print("\n" + "=" * 100)
    print("EXPERIMENT 2: 16 LOCATIONS WITH SOIL ABSENT (WEATHER-ONLY MODEL)")
    print("Evaluates weather-only model variant (N, P, K, pH not provided).")
    print("=" * 100)

    weather_only_records = []
    weather_top1_counts = {}
    weather_status_counts = {"CONFIDENT": 0, "LOW_CONFIDENCE": 0, "UNUSUAL": 0, "INVALID": 0}

    for city, state, lat, lon in LOCATIONS:
        w = weather_data[city]
        t, h, r = w["temp"], w["humidity"], w["rainfall_monthly"]

        res = crop_recommender_engine.recommend(
            n=None,
            p=None,
            k=None,
            ph=None,
            temperature=t,
            humidity=h,
            rainfall=r,
            state=state,
            district=city,
            season="Kharif",
            weather_source="Measured (Open-Meteo 12mo archive)",
            soil_source="Not provided",
            window_dates="2025-11-10 to 2026-11-10",
        )

        status = res["decision_status"]
        weather_status_counts[status] = weather_status_counts.get(status, 0) + 1
        top_crops = res["top_crops"]
        top1_crop = top_crops[0]["crop_name"] if top_crops else "None"
        if top_crops:
            weather_top1_counts[top1_crop] = weather_top1_counts.get(top1_crop, 0) + 1

        top3_str = ", ".join([f"{c['crop_name']} ({c['probability']*100:.1f}%)" for c in top_crops[:3]]) if top_crops else "None (refused)"
        reasons_summary = res["decision_reasons"][0] if res["decision_reasons"] else "None"

        record = {
            "city": city,
            "state": state,
            "lat_lon": f"{lat}, {lon}",
            "vector": f"[T:{t}°C, H:{h}%, R:{r}mm] (Soil omitted)",
            "status": status,
            "confidence_label": res["confidence_label"],
            "top3": top3_str,
            "top1": top1_crop,
            "reason": reasons_summary,
        }
        weather_only_records.append(record)

        print(f"\nLocation: {city} ({state}) | Lat/Lon: {lat}, {lon}")
        print(f"  Input Vector   : {record['vector']}")
        print(f"  Sources        : Soil: Not provided | Weather: Measured (Open-Meteo 12mo archive)")
        print(f"  Decision Status: {status} ({res['confidence_label']} confidence)")
        print(f"  Top-3 Crops    : {top3_str}")
        print(f"  Primary Reason : {reasons_summary}")

    print("\n" + "=" * 100)
    print("SUMMARY STATISTICS")
    print("=" * 100)
    print("Experiment 1 (Fixed Typical Soil):")
    print(f"  Status breakdown: {fixed_status_counts}")
    print(f"  Top-1 Crop frequencies: {fixed_top1_counts}")
    print("\nExperiment 2 (Soil Absent / Weather-Only):")
    print(f"  Status breakdown: {weather_status_counts}")
    print(f"  Top-1 Crop frequencies: {weather_top1_counts}")

    output_summary = {
        "fixed_soil_records": fixed_soil_records,
        "fixed_status_counts": fixed_status_counts,
        "fixed_top1_counts": fixed_top1_counts,
        "weather_only_records": weather_only_records,
        "weather_status_counts": weather_status_counts,
        "weather_top1_counts": weather_top1_counts,
    }
    with open(Path(__file__).resolve().parent.parent / "model_artifacts" / "locations_16_results.json", "w", encoding="utf-8") as f:
        json.dump(output_summary, f, indent=2)


if __name__ == "__main__":
    main()
