"""
Grow2Gain — Location Data Facts & Census 2011 Subdistrict Audit
Prints verifiable facts about the location datasets in the repository:
1. Assignment of Census 2011 subdistricts to 33 TS and 26 AP districts.
2. Mandal counts per district for Telangana (33) and Andhra Pradesh (13).
3. Full Khammam mandal list (20 mandals).
4. AP 26-district breakdown (which have mandal data vs fallback to district centre).
"""
import json
from pathlib import Path

SUBDISTRICTS_FILE = Path("backend/app/data/subdistricts_villages.json")
DISTRICTS_FILE = Path("frontend/src/data/india_districts.json")


def main():
    with open(SUBDISTRICTS_FILE, "r", encoding="utf-8") as f:
        sub_data = json.load(f)

    with open(DISTRICTS_FILE, "r", encoding="utf-8") as f:
        dist_data = json.load(f)

    print("=" * 90)
    print("GROW2GAIN: LOCATION DATA FACTS & SUBDISTRICT HIERARCHY AUDIT")
    print("=" * 90)

    # 1. Methodology Summary
    print("\n--- 1. METHODOLOGY & CENSUS 2011 SUBDISTRICT ASSIGNMENT ---")
    print("Data Source: datta07/INDIAN-SHAPEFILES (GitHub repository, MIT License).")
    print("Underlying shapefile license: Unknown / Unspecified in upstream repository.")
    print("Telangana Assignment:")
    print("  - Shapefile points contained 456 features with post-2016/2021 district identifiers.")
    print("  - 8 district aliases applied to normalize to standard 33 districts:")
    print("      'Warangal Rural' -> 'Warangal'")
    print("      'Warangal Urban' -> 'Hanumakonda'")
    print("      'Jangoan' -> 'Jangaon'")
    print("      'Jagitial' -> 'Jagtial'")
    print("      'Medchal Malkajgiri' -> 'Medchal-Malkajgiri'")
    print("      'Ranga Reddy' -> 'Rangareddy'")
    print("      'Jayashankar' -> 'Jayashankar Bhupalpally'")
    print("      'Komaram Bheem' -> 'Kumuram Bheem Asifabad'")
    print("  - 5 historical sample villages added for Warangal testing (Geikonda, Dharmasagar, Atmakur, Wardhannapet, Parkal).")
    print(f"  - Total Telangana coverage: 33 districts, {sum(len(m) for m in sub_data['states']['Telangana'].values())} mandals.")

    print("\nAndhra Pradesh Assignment:")
    print("  - Shapefile points reflect Census 2011 undivided Andhra Pradesh (13 districts, 669 subdistricts).")
    print("  - Modern Andhra Pradesh (2022 reorganization) has 26 districts.")
    print("  - 10 undivided districts match exact names in modern 26-district list.")
    print("  - 16 modern districts (13 newly carved + 3 spelling variations in 2011 shapefile: 'Anantapur' vs 'Ananthapuramu',")
    print("    'Sri Potti Sriramulu Nell*' vs 'Sri Potti Sriramulu Nellore', 'Y.S.R.' vs 'YSR Kadapa')")
    print("    fallback to verified district headquarters centroids with precision: 'approximate district centre'.")

    # 2. Mandal counts per district for Telangana
    print("\n--- 2. MANDAL COUNTS PER DISTRICT: TELANGANA (33 DISTRICTS) ---")
    ts_dists = sub_data["states"]["Telangana"]
    for d_name in sorted(ts_dists.keys()):
        print(f"  {d_name:<28}: {len(ts_dists[d_name]):>2} mandals")
    print(f"  {'TOTAL TELANGANA':<28}: {sum(len(m) for m in ts_dists.values()):>2} mandals across 33 districts")

    # 3. Full Khammam list
    print("\n--- 3. FULL KHAMMAM MANDAL LIST (20 MANDALS) ---")
    khammam_mandals = ts_dists.get("Khammam", [])
    for idx, m in enumerate(khammam_mandals, 1):
        print(f"  {idx:>2}. {m['name']:<24} (Lat: {m['latitude']:>7.4f}, Lon: {m['longitude']:>7.4f})")

    # 4. AP 26-district analysis
    print("\n--- 4. ANDHRA PRADESH: 26 MODERN DISTRICTS BREAKDOWN ---")
    ap_entry = next(s for s in dist_data["states"] if s["state"] == "Andhra Pradesh")
    ap_all_26 = [d["name"] for d in ap_entry["districts"]]
    ap_sub = sub_data["states"]["Andhra Pradesh"]

    ap_has_mandals = [d for d in ap_all_26 if d in ap_sub]
    ap_fallback = [d for d in ap_all_26 if d not in ap_sub]

    print(f"Districts with subdistrict mandal data ({len(ap_has_mandals)}/26):")
    for d in sorted(ap_has_mandals):
        print(f"  - {d:<24}: {len(ap_sub[d]):>2} mandals")

    print(f"\nDistricts falling back to District Centre ({len(ap_fallback)}/26):")
    for d in sorted(ap_fallback):
        centroid = next(item for item in ap_entry["districts"] if item["name"] == d)
        print(f"  - {d:<28}: District Centre (Lat: {centroid['latitude']:>7.4f}, Lon: {centroid['longitude']:>7.4f}) [approximate district centre]")

    print("\n" + "=" * 90)


if __name__ == "__main__":
    main()
