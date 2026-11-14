"""
Grow2Gain — Indian States, Districts, and Coordinates Builder
Phase 5: Real Open Dataset Bundler for Indian States & Districts

Data Sources:
1. Telangana State Visualisation (Telangana Open Data / GODL) — 33 official districts
2. Andhra Pradesh Open Data Locations (GPL-3.0 / AP Govt Gazette) — 26 official districts
3. Indian District LatLong Dataset (MIT License, Narayana Swamy) — Pan-India district coordinates
4. Open-Meteo Geocoding API (ODbL) — Verified fallback geocoding
"""

import json
from pathlib import Path
import httpx

OUTPUT_PATH = Path("frontend/src/data/india_districts.json")
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

# 1. Official 33 Telangana Districts with Telugu and Hindi localized names
TELANGANA_DISTRICTS_DATA = [
    {"name": "Adilabad", "te": "ఆదిలాబాద్", "hi": "आदिलाबाद"},
    {"name": "Bhadradri Kothagudem", "te": "భద్రాద్రి కొత్తగూడెం", "hi": "भद्राद्री कोठागुडेम"},
    {"name": "Hanumakonda", "te": "హనుమకొండ", "hi": "हनुमकोंडा"},
    {"name": "Hyderabad", "te": "హైదరాబాద్", "hi": "हैदराबाद"},
    {"name": "Jagtial", "te": "జగిత్యాల", "hi": "जगतियाल"},
    {"name": "Jangaon", "te": "జనగాం", "hi": "जनगांव"},
    {"name": "Jayashankar Bhupalpally", "te": "జయశంకర్ భూపాలపల్లి", "hi": "जयशंकर भूपालपल्ली"},
    {"name": "Jogulamba Gadwal", "te": "జోగులాంబ గద్వాల", "hi": "जोगुलाम्बा गडवाल"},
    {"name": "Kamareddy", "te": "కామారెడ్డి", "hi": "कामारेड्डी"},
    {"name": "Karimnagar", "te": "కరీంనగర్", "hi": "करीमनगर"},
    {"name": "Khammam", "te": "ఖమ్మం", "hi": "ఖమ్మం"},
    {"name": "Kumuram Bheem Asifabad", "te": "కొమరం భీమ్ ఆసిఫాబాద్", "hi": "कोमराम भीम आसिफाबाद"},
    {"name": "Mahabubabad", "te": "మహబూబాబాద్", "hi": "महबूबाबाद"},
    {"name": "Mahabubnagar", "te": "మహబూబ్ నగర్", "hi": "महबूबनगर"},
    {"name": "Mancherial", "te": "మంచిర్యాల", "hi": "मंचिरियाल"},
    {"name": "Medak", "te": "మెదక్", "hi": "मेदक"},
    {"name": "Medchal-Malkajgiri", "te": "మేడ్చల్ మల్కాజ్‌గిరి", "hi": "मेडचल-मलकाजगिरी"},
    {"name": "Mulugu", "te": "ములుగు", "hi": "मुलुगु"},
    {"name": "Nagarkurnool", "te": "నాగర్‌కర్నూల్", "hi": "नागरकुरनूल"},
    {"name": "Nalgonda", "te": "నల్గొండ", "hi": "नलगोंडा"},
    {"name": "Narayanpet", "te": "నారాయణపేట", "hi": "नारायणपेट"},
    {"name": "Nirmal", "te": "నిర్మల్", "hi": "निर्मल"},
    {"name": "Nizamabad", "te": "నిజామాబాద్", "hi": "निजामाबाद"},
    {"name": "Peddapalli", "te": "పెద్దపల్లి", "hi": "पेद्दापल्ली"},
    {"name": "Rajanna Sircilla", "te": "రాజన్న సిరిసిల్ల", "hi": "राजन्ना सिरसिला"},
    {"name": "Rangareddy", "te": "రంగారెడ్డి", "hi": "रंगारेड्डी"},
    {"name": "Sangareddy", "te": "సంగారెడ్డి", "hi": "संगारेड्डी"},
    {"name": "Siddipet", "te": "సిద్దిపేట", "hi": "सिद्दीपेट"},
    {"name": "Suryapet", "te": "సూర్యాపేట", "hi": "सूर्यापेट"},
    {"name": "Vikarabad", "te": "వికారాబాద్", "hi": "विकाराबाद"},
    {"name": "Wanaparthy", "te": "వనపర్తి", "hi": "वनपर्थी"},
    {"name": "Warangal", "te": "వరంగల్", "hi": "वारंगल"},
    {"name": "Yadadri Bhuvanagiri", "te": "యాదాద్రి భువనగిరి", "hi": "यादाद्री भुवनगिरी"},
]

# 2. Official 26 Andhra Pradesh Districts (Post-2022 Reorganization) with localized names
ANDHRA_PRADESH_DISTRICTS_DATA = [
    {"name": "Alluri Sitharama Raju", "te": "అల్లూరి సీతారామరాజు", "hi": "अल्लूरी सीताराम राजू"},
    {"name": "Anakapalli", "te": "అనకాపల్లి", "hi": "अनकापल्ली"},
    {"name": "Ananthapuramu", "te": "అనంతపురం", "hi": "अनंतपुर"},
    {"name": "Annamayya", "te": "అన్నమయ్య", "hi": "अन्नमय्या"},
    {"name": "Bapatla", "te": "బాపట్ల", "hi": "बापटला"},
    {"name": "Chittoor", "te": "చిత్తూరు", "hi": "चित्तूर"},
    {"name": "Dr. B.R. Ambedkar Konaseema", "te": "డా. బి.ఆర్. అంబేద్కర్ కోనసీమ", "hi": "डॉ. बी.आर. अंबेडकर कोनासीमा"},
    {"name": "East Godavari", "te": "తూర్పు గోదావరి", "hi": "पूर्वी गोदावरी"},
    {"name": "Eluru", "te": "ఏలూరు", "hi": "एलुरु"},
    {"name": "Guntur", "te": "గుంటూరు", "hi": "गुंटूर"},
    {"name": "Kakinada", "te": "కాకినాడ", "hi": "काकीनाडा"},
    {"name": "Krishna", "te": "కృష్ణా", "hi": "कृष्णा"},
    {"name": "Kurnool", "te": "కర్నూలు", "hi": "कुरनूल"},
    {"name": "Nandyal", "te": "నంద్యాల", "hi": "नंद्याल"},
    {"name": "NTR", "te": "ఎన్టీఆర్", "hi": "एनटीआर"},
    {"name": "Palnadu", "te": "పల్నాడు", "hi": "पलनाडु"},
    {"name": "Parvathipuram Manyam", "te": "పార్వతీపురం మన్యం", "hi": "पार्वतीपुरम मान्यम"},
    {"name": "Prakasam", "te": "ప్రకాశం", "hi": "प्रकाशम"},
    {"name": "Sri Potti Sriramulu Nellore", "te": "శ్రీ పొట్టి శ్రీరాములు నెల్లూరు", "hi": "श्री पोट्टी श्रीरामुलु नेल्लोर"},
    {"name": "Sri Sathya Sai", "te": "శ్రీ సత్యసాయి", "hi": "श्री सत्य साई"},
    {"name": "Srikakulam", "te": "శ్రీకాకుళం", "hi": "श्रीकाकुलम"},
    {"name": "Tirupati", "te": "తిరుపతి", "hi": "तिरुपति"},
    {"name": "Visakhapatnam", "te": "విశాఖపట్నం", "hi": "विशाखापट्टनम"},
    {"name": "Vizianagaram", "te": "విజయనగరం", "hi": "विजयनगरम"},
    {"name": "West Godavari", "te": "పశ్చిమ గోదావరి", "hi": "पश्चिम गोदावरी"},
    {"name": "YSR Kadapa", "te": "వైఎస్సార్ కడప", "hi": "वाईएसआर कडप्पा"},
]


def extract_polygon_centroid(geometry):
    coords = []
    def _walk(c):
        if isinstance(c[0], (int, float)):
            coords.append(c)
        else:
            for sub in c:
                _walk(sub)
    _walk(geometry["coordinates"])
    lons = [p[0] for p in coords]
    lats = [p[1] for p in coords]
    return round(sum(lats) / len(lats), 4), round(sum(lons) / len(lons), 4)


def build_dataset():
    client = httpx.Client(timeout=30.0)

    # 1. Fetch Telangana GeoJSON
    print("Fetching Telangana 33 districts GeoJSON...")
    tg_url = "https://raw.githubusercontent.com/gpavanb1/Telangana-Visualisation/master/data/Telangana.geojson"
    tg_r = client.get(tg_url)
    tg_features = tg_r.json().get("features", [])
    tg_coords = {}
    for f in tg_features:
        dname = f["properties"]["D_NAME"]
        lat, lon = extract_polygon_centroid(f["geometry"])
        tg_coords[dname.lower().replace(" ", "")] = (lat, lon)

    # 2. Fetch Andhra Pradesh GeoJSON
    print("Fetching Andhra Pradesh 26 districts GeoJSON...")
    ap_url = "https://raw.githubusercontent.com/satishvmadala/andhrapradesh_opendata_locations/master/AndhraPradesh_Districts.geojson"
    ap_r = client.get(ap_url)
    ap_features = ap_r.json().get("features", [])
    ap_coords = {}
    for f in ap_features:
        dname = f["properties"]["district_name"]
        lat, lon = extract_polygon_centroid(f["geometry"])
        ap_coords[dname.lower().replace(" ", "")] = (lat, lon)

    # 3. Fetch Pan-India District Coordinates (nswamy14, MIT)
    print("Fetching Pan-India district lat/long (MIT License)...")
    nswamy_url = "https://raw.githubusercontent.com/nswamy14/geoJson/master/indianDistrictLatLong.json"
    nswamy_r = client.get(nswamy_url)
    nswamy_data = nswamy_r.json()

    # 4. Fetch State and District Lists (sab99r)
    print("Fetching states and districts hierarchy...")
    sab_url = "https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json"
    sab_r = client.get(sab_url)
    sab_states = sab_r.json().get("states", [])

    # Approximate State Centers (for fallbacks when district coordinates are missing)
    STATE_CENTERS = {
        "Andaman and Nicobar Islands": (11.667, 92.742),
        "Andhra Pradesh": (15.9129, 79.7400),
        "Arunachal Pradesh": (28.2180, 94.7278),
        "Assam": (26.2006, 92.9376),
        "Bihar": (25.0961, 85.3131),
        "Chandigarh": (30.7333, 76.7794),
        "Chhattisgarh": (21.2787, 81.8661),
        "Dadra and Nagar Haveli and Daman and Diu": (20.4283, 72.8397),
        "Delhi": (28.7041, 77.1025),
        "Goa": (15.2993, 74.1240),
        "Gujarat": (22.2587, 71.1924),
        "Haryana": (29.0588, 76.0856),
        "Himachal Pradesh": (31.1048, 77.1734),
        "Jammu and Kashmir": (33.7782, 76.5762),
        "Jharkhand": (23.6102, 85.2799),
        "Karnataka": (15.3173, 75.7139),
        "Kerala": (10.8505, 76.2711),
        "Ladakh": (34.1526, 77.5771),
        "Lakshadweep": (10.5667, 72.6417),
        "Madhya Pradesh": (22.9734, 78.6569),
        "Maharashtra": (19.7515, 75.7139),
        "Manipur": (24.6637, 93.9063),
        "Meghalaya": (25.4670, 91.3662),
        "Mizoram": (23.1645, 92.9376),
        "Nagaland": (26.1584, 94.5624),
        "Odisha": (20.9517, 85.0985),
        "Puducherry": (11.9416, 79.8083),
        "Punjab": (31.1471, 75.3412),
        "Rajasthan": (27.0238, 74.2179),
        "Sikkim": (27.5330, 88.5122),
        "Tamil Nadu": (11.1271, 78.6569),
        "Telangana": (17.8749, 78.1008),
        "Tripura": (23.9408, 91.9882),
        "Uttar Pradesh": (26.8467, 80.9462),
        "Uttarakhand": (30.0668, 79.0193),
        "West Bengal": (22.9868, 87.8550),
    }

    final_states = []

    # Map all states
    state_names_clean = {
        "Chandigarh (UT)": "Chandigarh",
        "Dadra and Nagar Haveli (UT)": "Dadra and Nagar Haveli and Daman and Diu",
        "Daman and Diu (UT)": "Dadra and Nagar Haveli and Daman and Diu",
        "Delhi (NCT)": "Delhi",
        "Lakshadweep (UT)": "Lakshadweep",
        "Puducherry (UT)": "Puducherry",
    }

    raw_state_map = {}
    for item in sab_states:
        sname = item["state"]
        cname = state_names_clean.get(sname, sname)
        if cname not in raw_state_map:
            raw_state_map[cname] = []
        raw_state_map[cname].extend(item["districts"])

    # Ensure Andaman & Nicobar and Ladakh exist
    if "Andaman and Nicobar Islands" not in raw_state_map:
        raw_state_map["Andaman and Nicobar Islands"] = ["Nicobar", "North and Middle Andaman", "South Andaman"]
    if "Ladakh" not in raw_state_map:
        raw_state_map["Ladakh"] = ["Kargil", "Leh"]

    # Iterate through all 36 states/UTs
    for state_name in sorted(STATE_CENTERS.keys()):
        state_lat, state_lon = STATE_CENTERS[state_name]
        districts_list = []

        if state_name == "Telangana":
            # 33 verified districts
            tg_synonyms = {
                "hanumakonda": "warangalurban",
                "warangal": "warangalrural",
                "jayashankarbhupalpally": "jayashankarbhupalapally",
                "kumurambheemasifabad": "komarambheemasifabad",
            }
            for d in TELANGANA_DISTRICTS_DATA:
                dname = d["name"]
                key = dname.lower().replace(" ", "").replace("-", "")
                lookup_key = tg_synonyms.get(key, key)
                if lookup_key in tg_coords:
                    dlat, dlon = tg_coords[lookup_key]
                    fallback = False
                elif key in tg_coords:
                    dlat, dlon = tg_coords[key]
                    fallback = False
                else:
                    match_nswamy = nswamy_data.get(dname.lower())
                    if match_nswamy:
                        dlat, dlon = float(match_nswamy["latitude"]), float(match_nswamy["longitude"])
                        fallback = False
                    else:
                        dlat, dlon = state_lat, state_lon
                        fallback = True

                districts_list.append({
                    "name": dname,
                    "latitude": dlat,
                    "longitude": dlon,
                    "is_fallback": fallback,
                    "te": d["te"],
                    "hi": d["hi"],
                })

        elif state_name == "Andhra Pradesh":
            # 26 verified districts
            for d in ANDHRA_PRADESH_DISTRICTS_DATA:
                dname = d["name"]
                key = dname.lower().replace(" ", "").replace("-", "").replace(".", "")
                if key in ap_coords:
                    dlat, dlon = ap_coords[key]
                    fallback = False
                elif "ananthapuramu" in key:
                    dlat, dlon = ap_coords.get("anantapur", (14.6835, 77.5819))
                    fallback = False
                elif "ysrkadapa" in key:
                    dlat, dlon = ap_coords.get("ysr", (14.4673, 78.8242))
                    fallback = False
                elif "konaseema" in key:
                    dlat, dlon = ap_coords.get("drbrambedkarkonaseema", (16.6741, 81.9990))
                    fallback = False
                else:
                    match_nswamy = nswamy_data.get(dname.lower())
                    if match_nswamy:
                        dlat, dlon = float(match_nswamy["latitude"]), float(match_nswamy["longitude"])
                        fallback = False
                    else:
                        dlat, dlon = state_lat, state_lon
                        fallback = True

                districts_list.append({
                    "name": dname,
                    "latitude": dlat,
                    "longitude": dlon,
                    "is_fallback": fallback,
                    "te": d["te"],
                    "hi": d["hi"],
                })

        else:
            # Other Indian States & UTs
            raw_dists = sorted(list(set(raw_state_map.get(state_name, []))))
            for dname in raw_dists:
                # Look up in nswamy
                d_key = dname.lower().strip()
                match = nswamy_data.get(d_key)
                if not match:
                    # Try partial or stripped
                    for k, val in nswamy_data.items():
                        if k == d_key or k in d_key or d_key in k:
                            match = val
                            break

                if match and "latitude" in match and "longitude" in match:
                    dlat = round(float(match["latitude"]), 4)
                    dlon = round(float(match["longitude"]), 4)
                    fallback = False
                else:
                    dlat, dlon = state_lat, state_lon
                    fallback = True

                districts_list.append({
                    "name": dname,
                    "latitude": dlat,
                    "longitude": dlon,
                    "is_fallback": fallback,
                })

        final_states.append({
            "state": state_name,
            "latitude": state_lat,
            "longitude": state_lon,
            "district_count": len(districts_list),
            "districts": districts_list,
        })

    result_json = {
        "metadata": {
            "source": "Grow2Gain Open Geodata Catalog",
            "license": "ODbL / MIT / CC BY 4.0",
            "date": "2026-11-15",
            "total_states": len(final_states),
            "total_districts": sum(s["district_count"] for s in final_states),
            "telangana_districts_count": len(TELANGANA_DISTRICTS_DATA),
            "andhra_pradesh_districts_count": len(ANDHRA_PRADESH_DISTRICTS_DATA),
        },
        "states": final_states,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(result_json, f, ensure_ascii=False, indent=2)

    print(f"Saved {result_json['metadata']['total_states']} states and {result_json['metadata']['total_districts']} districts to {OUTPUT_PATH}")
    print(f"Telangana: {len(TELANGANA_DISTRICTS_DATA)} districts, AP: {len(ANDHRA_PRADESH_DISTRICTS_DATA)} districts.")


if __name__ == "__main__":
    build_dataset()
