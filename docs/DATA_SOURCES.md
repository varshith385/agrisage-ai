# Grow2Gain — Data Sources Catalog (`docs/DATA_SOURCES.md`)

**Grow2Gain Platform | Data Provenance & Verification Ledger**

> [!IMPORTANT]
> In strict accordance with the **Honesty Rules** and Phase 1 instructions, licenses, row counts, terms, and dataset details are **NOT** assumed as verified facts. Every license and dataset detail below is explicitly marked **"to verify"** unless directly inspected and authenticated from the official primary source. No metrics or figures are invented.

---

## 1. Data Sources Master Table

| Data Source | Intended Usage | License Status | Dataset Details (Rows / Terms) | Fallback Mechanism | Verification Status |
|---|---|---|---|---|---|
| **Open-Meteo Weather API** (`api.open-meteo.com`) | Live hourly/daily weather, precipitation probability, wind speed, reference evapotranspiration ($ET_0$), and historical climate normals via the Historical Archive API (`archive-api.open-meteo.com`). | Open Database License (ODbL) / Non-commercial terms *[to verify]* | Free tier API access limits and attribution terms *[to verify]*. Trailing 365 complete days window (e.g. `2025-11-15` to `2026-11-14` dynamically derived from current date) used for trailing 12-month climate normals. | `weather_cache` table (30-min TTL); cache keyed by rounded lat/lon and window dates. If API fails, returns clear error; never returns synthetic defaults or old values. | **Partially Verified** (Endpoint connectivity and historical archive verified; license/terms *to verify*) |
| **Open-Meteo Geocoding API** (`geocoding-api.open-meteo.com`) | Village / district search and coordinates resolution (lat/lon). | Open Database License (ODbL) *[to verify]* | Global geographic database *[to verify]* | Static internal dictionary of Indian states, districts, and bundled sub-districts/mandals dataset. | **To verify** |
| **data.gov.in AGMARKNET Mandi Arrivals & Prices** | Real-time and historical commodity arrival volumes and modal prices across agricultural markets. | Government Open Data License - India (GODL) *[to verify]* | Requires user API key (`DATA_GOV_IN_API_KEY`); row counts and frequency *[to verify]* | Local offline dataset `datasets/demo/mandi_prices.csv`, visibly badged as `DEMO DATA` in API and UI. | **To verify** |
| **PlantVillage Dataset & Pretrained CV Weights** | Leaf image classification across healthy and diseased plant classes on CPU (`neghani/plantvillage-mobilenetv2`). | Apache-2.0 on HuggingFace; upstream dataset CC BY-SA 4.0 *[to verify]* | MobileNetV2 architecture, 38 classes across 14 crops (Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Bell Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato; does NOT cover Cotton, Chilli, Rice, Wheat). Weights: `model.safetensors` (9.26 MB, SHA256: `f1a98e77629c36b5fe90a0fbed7ba56f097ce419c6dad8456bd135f36ea8d426`). Evaluation sample is small (exact sample size n = 3). PlantVillage images may overlap with the model's training data (so results are optimistic). The results are not a measure of real-world field accuracy. The dataset licence is 'to verify' unless you open the licence page. No accuracy number is shown in the app UI as the model's accuracy. | Input quality gate rejects dark/blurry/non-leaf images; crop mismatch/unsupported warnings emitted; low confidence fallback prompts KVK consultation. | **Verified** (Model downloaded, SHA256 matched, run on CPU; upstream dataset terms *to verify*) |
| **OpenAI CLIP Zero-Shot Domain Gate** (`openai/clip-vit-base-patch32`) | Authoritative image gate for Disease and Irrigation uploads: verifies field/crop/soil/water vs non-agricultural patterns (code screenshots, documents, portraits, cars, rooms, cartoons) on CPU. | MIT License | Vision Transformer (ViT-B/32) multi-modal zero-shot classifier. Download size: ~605 MB (`model.safetensors` + config/processor). Adds a model-download step on first run if weights are not pre-cached in `~/.cache/huggingface/hub`. | Deterministic Stage 1 heuristics (colour variety + foliar/soil pixel share); graceful fallback to heuristics if offline or unloaded. Rejects non-crop images with HTTP 422. | **Verified** (Weights cached and verified on CPU; MIT license confirmed) |
| **Kaggle Crop Recommendation Dataset** | Multi-class crop classification using N, P, K, pH, rainfall, temperature, and humidity. | Open Database / Public Domain *[to verify]* | Frequently cited as 2,200 rows across 22 crops *[to verify]* | Regional agro-climatic heuristic fallback with lower confidence score; marked `DEMO` if model artifacts are unbuilt. | **To verify** |
| **ICRISAT / Directorate of Economics & Statistics (DES)** | District-level historical agricultural yield, area, and seasonal production data. | Government / Academic Open Access terms *[to verify]* | District-wise crop production statistics *[to verify]* | Baseline naive mean (district average) with prediction intervals; labelled `DEMO` if unverified. | **To verify** |
| **Commission for Agricultural Costs & Prices (CACP) MSP** | Minimum Support Price (MSP) benchmarks for Kharif and Rabi notified crops. | Government official notification *[to verify]* | Notified benchmark prices per quintal *[to verify]* | `datasets/msp.csv` with cited official release links; crops without verified MSP show "MSP not verified". | **To verify** |
| **Central & State Government Schemes** (PM-KISAN, PMFBY, Rythu Bharosa, KCC) | Rule-based matching for financial subsidies, crop insurance, and institutional credit. | Public Government Portals *[to verify]* | Eligibility criteria, subsidy amounts, and official application links *[to verify]* | `datasets/demo/demo_schemes.json` with unverified fields flagged `verified: false` and displayed as "details to verify". | **To verify** |

---

## 2. PlantVillage Evaluation Disclosures & UI Accuracy Policy

1. **Evaluation Sample Size**: The evaluation sample included in the repository fixtures is small: exactly **$n = 3$** sample images (`tomato_early_blight.jpg`, `apple_black_rot.jpg`, `corn_common_rust.jpg`).
2. **Training Data Overlap**: PlantVillage images in the test set may overlap with the model's training data (the model `neghani/plantvillage-mobilenetv2` was trained on PlantVillage). Therefore, benchmark results ($100\%$ on these 3 samples) are highly **optimistic**.
3. **Not Field Accuracy**: These results are **not** a measure of real-world field accuracy under variable lighting, natural field backgrounds, blur, or complex leaf angles.
4. **Dataset Licence**: The upstream dataset licence is marked **"to verify"** unless the upstream licence page is directly inspected.
5. **App UI Policy**: In accordance with Honesty Rules, **no accuracy number is shown in the app UI as the model's accuracy**. Confidence scores in the UI represent uncalibrated softmax probabilities of the individual prediction and are explicitly labelled as uncalibrated.

---

## 4. Indian States, Districts, and Geographic Coordinates (`frontend/src/data/india_districts.json`)

**Retrieved Date**: 2026-11-15  
**Coverage**: 36 States and Union Territories, 742 Districts Total (682 with exact measured coordinates, 60 with state center fallback)

### Data Provenance & Licenses (No Claims of Official Portal / GODL)

| Jurisdiction / Component | Source Repository & URL | License Status | District Count | Verification & Notes |
|---|---|---|---|---|
| **Telangana Boundary Centroids** | [`gpavanb1/Telangana-Visualisation`](https://raw.githubusercontent.com/gpavanb1/Telangana-Visualisation/master/data/Telangana.geojson) | Community GitHub repository; underlying data license unknown (no official portal/GODL claim) | **33 districts** | Polygon centroids for 33 districts including Hanumakonda, Warangal, Mulugu, and Jayashankar Bhupalpally. |
| **Andhra Pradesh Boundary Centroids** | [`satishvmadala/andhrapradesh_opendata_locations`](https://raw.githubusercontent.com/satishvmadala/andhrapradesh_opendata_locations/master/AndhraPradesh_Districts.geojson) | Community GitHub repository (GPL-3.0); underlying government survey license unknown (no official portal/GODL claim) | **26 districts** | Polygon centroids for 26 post-2022 districts including Alluri Sitharama Raju, Dr. B.R. Ambedkar Konaseema, Anakapalli, Nandyal, Palnadu, and NTR. |
| **Pan-India District Coordinates** | [`nswamy14/geoJson`](https://raw.githubusercontent.com/nswamy14/geoJson/master/indianDistrictLatLong.json) | MIT License (Copyright 2020 Narayana Swamy); underlying data license unknown | **771 centroids** | District headquarters coordinates across remaining 34 States and Union Territories. |
| **State & District Hierarchy** | [`sab99r/Indian-States-And-Districts`](https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json) | Community repository (MIT/Public Domain); underlying survey license unknown | **36 States/UTs** | Augmented with Andaman and Nicobar Islands and Ladakh UTs. |
| **Geocoding Fallback Engine** | Open-Meteo Geocoding API (`geocoding-api.open-meteo.com`) | Open Database License (ODbL) | Ad-hoc fallback | Where district coordinates are absent, falls back to state centroid with visible `is_fallback: true` ("approximate district centre") label. |

### Verification Ledger for Telangana and Andhra Pradesh
- **Telangana 33 Districts**: Adilabad, Bhadradri Kothagudem, Hanumakonda, Hyderabad, Jagtial, Jangaon, Jayashankar Bhupalpally, Jogulamba Gadwal, Kamareddy, Karimnagar, Khammam, Kumuram Bheem Asifabad, Mahabubabad, Mahabubnagar, Mancherial, Medak, Medchal-Malkajgiri, Mulugu, Nagarkurnool, Nalgonda, Narayanpet, Nirmal, Nizamabad, Peddapalli, Rajanna Sircilla, Rangareddy, Sangareddy, Siddipet, Suryapet, Vikarabad, Wanaparthy, Warangal, Yadadri Bhuvanagiri.
- **Andhra Pradesh 26 Districts**: Alluri Sitharama Raju, Anakapalli, Ananthapuramu, Annamayya, Bapatla, Chittoor, Dr. B.R. Ambedkar Konaseema, East Godavari, Eluru, Guntur, Kakinada, Krishna, Kurnool, Nandyal, NTR, Palnadu, Parvathipuram Manyam, Prakasam, Sri Potti Sriramulu Nellore, Sri Sathya Sai, Srikakulam, Tirupati, Visakhapatnam, Vizianagaram, West Godavari, YSR Kadapa.
- **Localizations**: Both Telangana and Andhra Pradesh districts carry Telugu (`te`) and Hindi (`hi`) transliterations. Other Indian states carry English names with `[EN]` indicators in multilingual mode.

---

## 5. Sub-Districts, Mandals, and Taluk Coordinates (`backend/app/data/subdistricts_villages.json`, `frontend/src/data/subdistricts_villages.json`)

**Retrieved Date**: 2026-11-15  
**Source Repository**: [`datta07/INDIAN-SHAPEFILES`](https://github.com/datta07/INDIAN-SHAPEFILES) (GitHub)  
**Repository License**: MIT License (Copyright (c) 2020 Datta Prasad)  
**Underlying Data License**: **Unknown / Unspecified in upstream repository**. In strict adherence to honesty rules, **no claim of official government portal or Government Open Data License (GODL) is made**.

### 5.1 Census 2011 Subdistrict Assignment Methodology
1. **Telangana Assignment**:
   - The shapefile contains subdistrict headquarters points carrying Census 2011 codes (`SDTCODE11`, `LOC_NAME`) with post-2016 district names.
   - 8 district alias mappings normalize names to standard 33 districts:
     - `Warangal Rural` $\to$ `Warangal`
     - `Warangal Urban` $\to$ `Hanumakonda`
     - `Jangoan` $\to$ `Jangaon`
     - `Jagitial` $\to$ `Jagtial`
     - `Medchal Malkajgiri` $\to$ `Medchal-Malkajgiri`
     - `Ranga Reddy` $\to$ `Rangareddy`
     - `Jayashankar` $\to$ `Jayashankar Bhupalpally`
     - `Komaram Bheem` $\to$ `Kumuram Bheem Asifabad`
   - 5 sample villages were added for Warangal testing (`Geikonda`, `Dharmasagar`, `Atmakur`, `Wardhannapet`, `Parkal`).
   - Total Telangana coverage: **33 districts, 461 mandals**.

2. **Andhra Pradesh Assignment & Reorganization Disclosure**:
   - The shapefile reflects Census 2011 undivided Andhra Pradesh (**13 districts, 669 subdistricts**).
   - In April 2022, Andhra Pradesh was reorganized into **26 districts**.
   - **10 districts** in the modern 26-district list match undivided names directly and carry subdistrict mandal data (total **509 mandals**):
     - `Chittoor` (66 mandals), `East Godavari` (63), `Guntur` (57), `Krishna` (50), `Kurnool` (54), `Prakasam` (56), `Srikakulam` (38), `Visakhapatnam` (43), `Vizianagaram` (34), `West Godavari` (48).
   - **16 modern districts** (13 newly created districts + 3 historical shapefile spelling variations: `Anantapur` vs `Ananthapuramu`, `Sri Potti Sriramulu Nell*` vs `Sri Potti Sriramulu Nellore`, `Y.S.R.` vs `YSR Kadapa`) do not match shapefile keys and fallback to verified district headquarters centroids with read-only precision label `"approximate district centre"`:
     - `Alluri Sitharama Raju`, `Anakapalli`, `Ananthapuramu`, `Annamayya`, `Bapatla`, `Dr. B.R. Ambedkar Konaseema`, `Eluru`, `Kakinada`, `Nandyal`, `NTR`, `Palnadu`, `Parvathipuram Manyam`, `Sri Potti Sriramulu Nellore`, `Sri Sathya Sai`, `Tirupati`, `YSR Kadapa`.

3. **Karnataka & Maharashtra**:
   - Karnataka: 30 districts, 176 talukas (mapped from `dtname` polygon centroids).
   - Maharashtra: 34 districts, 355 talukas (mapped from `dtname` polygon centroids).

### 5.2 Mandal Counts Per District (Telangana — 33 Districts)

| District | Mandal Count | District | Mandal Count | District | Mandal Count |
|---|---|---|---|---|---|
| Adilabad | 13 | Bhadradri Kothagudem | 17 | Hanumakonda | 7 |
| Hyderabad | 16 | Jagtial | 15 | Jangaon | 11 |
| Jayashankar Bhupalpally | 9 | Jogulamba Gadwal | 9 | Kamareddy | 17 |
| Karimnagar | 12 | **Khammam** | **20** | Kumuram Bheem Asifabad | 12 |
| Mahabubabad | 12 | Mahabubnagar | 12 | Mancherial | 14 |
| Medak | 15 | Medchal-Malkajgiri | 8 | Mulugu | 8 |
| Nagarkurnool | 16 | Nalgonda | 26 | Narayanpet | 9 |
| Nirmal | 13 | Nizamabad | 19 | Peddapalli | 11 |
| Rajanna Sircilla | 9 | Rangareddy | 21 | Sangareddy | 19 |
| Siddipet | 17 | Suryapet | 18 | Vikarabad | 17 |
| Wanaparthy | 9 | Warangal | 16 | Yadadri Bhuvanagiri | 14 |
| **Total** | | | | **33 Districts** | **461 Mandals** |

### 5.3 Full Khammam Mandal List (20 Mandals)

| # | Mandal Name | Latitude | Longitude | # | Mandal Name | Latitude | Longitude |
|---|---|---|---|---|---|---|---|
| 1 | Madhira | 16.9216 | 80.3609 | 11 | Kamepalle | 17.4498 | 80.2804 |
| 2 | Yerrupalem | 16.8223 | 80.4716 | 12 | Konijerla | 17.2249 | 80.2943 |
| 3 | Kusumanchi | 17.2271 | 79.9542 | 13 | Mudigonda | 17.1767 | 80.0976 |
| 4 | Nelakondapalle | 17.1020 | 80.0521 | 14 | Penuballi | 17.2223 | 80.6670 |
| 5 | Kallur | 17.2026 | 80.5465 | 15 | Sathupalle | 17.2116 | 80.8365 |
| 6 | Tallada | 17.2167 | 80.4249 | 16 | Singareni | 17.5010 | 80.2652 |
| 7 | Khammam (Rural) | 17.2412 | 80.1421 | 17 | Thirumalayapalem | 17.3117 | 80.0395 |
| 8 | Bonakal | 17.0198 | 80.2682 | 18 | Vemsoor | 17.1295 | 80.7934 |
| 9 | Chinthakani | 17.1220 | 80.2082 | 19 | Wyra | 17.1949 | 80.3562 |
| 10 | Enkuru | 17.3292 | 80.4404 | 20 | Khammam (Urban) | 17.2413 | 80.1420 |

### 5.4 Integrity & Hierarchy Rules
1. **Cascading Dropdowns**: In the UI (`FarmRegistrationPage.tsx`), State $\to$ District $\to$ Mandal/Taluk are strictly chained. Selecting a state filters districts; selecting a district filters mandals/taluks. Changing a parent resets the child selection.
2. **Read-Only Coordinate Transparency**: Selecting a mandal displays its exact latitude and longitude with a read-only badge indicating precision level (`village` vs `approximate district centre`).
3. **District-Centre Fallback**: If a district has no sub-district entry, the selector provides the district headquarters centroid with `precision: "approximate district centre"`. Coordinates are never invented or guessed.
4. **Backend Hierarchy Enforcement**: Backend endpoints (`POST /api/v1/farms/` and `PUT /api/v1/farms/{id}`) validate that the submitted village/mandal belongs to the chosen district, and the district belongs to the chosen state. Any mismatch is strictly rejected with HTTP 422 naming the invalid field, preventing client bypass.

---

## 6. Pre-Implementation Checklist:
1. **Model Weights & Class Labels**:
   - Locate the exact Hugging Face or PyTorch Hub model repository for PlantVillage.
   - Record its exact license file URL, commit SHA, and class list in `docs/DECISIONS.md`.
2. **Dataset Attribution**:
   - For any dataset downloaded into `datasets/`, record its source URL, author/authority, license text, and download timestamp in `datasets/README.md`.
3. **Mandi Prices & MSP Data**:
   - Validate AGMARKNET API key registration requirements on `data.gov.in`.
   - Verify all MSP figures directly against official Press Information Bureau (PIB) or Ministry of Agriculture notifications with exact release dates.

