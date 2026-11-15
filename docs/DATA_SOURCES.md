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

### Data Provenance & Licenses

| Jurisdiction / Component | Source Repository & URL | License Status | District Count | Verification & Notes |
|---|---|---|---|---|
| **Telangana Official Districts** | [`gpavanb1/Telangana-Visualisation`](https://raw.githubusercontent.com/gpavanb1/Telangana-Visualisation/master/data/Telangana.geojson) | Government Open Data License - India (GODL) / Open Data Telangana (`data.telangana.gov.in`) | **33 districts** | **100% Verified**: Matched all 33 official districts including Hanumakonda (Warangal Urban), Warangal (Warangal Rural), Mulugu, and Jayashankar Bhupalpally. Coordinates calculated directly from boundary polygon centroids. Zero fallbacks. |
| **Andhra Pradesh Official Districts** | [`satishvmadala/andhrapradesh_opendata_locations`](https://raw.githubusercontent.com/satishvmadala/andhrapradesh_opendata_locations/master/AndhraPradesh_Districts.geojson) | GNU General Public License v3.0 (GPL-3.0) / AP Official Gazette (2022 Reorganization) | **26 districts** | **100% Verified**: Matched all 26 official post-2022 districts including Alluri Sitharama Raju, Dr. B.R. Ambedkar Konaseema, Anakapalli, Nandyal, Palnadu, and NTR. Coordinates calculated directly from boundary polygon centroids. Zero fallbacks. |
| **Pan-India District Coordinates** | [`nswamy14/geoJson`](https://raw.githubusercontent.com/nswamy14/geoJson/master/indianDistrictLatLong.json) | MIT License (Copyright 2020 Narayana Swamy) | **771 centroids** | Provides pan-India district headquarters coordinates across remaining 34 States and Union Territories. |
| **State & District Hierarchy** | [`sab99r/Indian-States-And-Districts`](https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json) | Open Access Public Domain / Community Sourced | **36 States/UTs** | Augmented with Andaman and Nicobar Islands and Ladakh UTs. |
| **Geocoding Fallback Engine** | Open-Meteo Geocoding API (`geocoding-api.open-meteo.com`) | Open Database License (ODbL) | Ad-hoc fallback | Where district coordinates are absent, falls back to state centroid with visible `is_fallback: true` ("approximate district centre") label. |

### Verification Ledger for Telangana and Andhra Pradesh
- **Telangana Official 33 Districts**: Adilabad, Bhadradri Kothagudem, Hanumakonda, Hyderabad, Jagtial, Jangaon, Jayashankar Bhupalpally, Jogulamba Gadwal, Kamareddy, Karimnagar, Khammam, Kumuram Bheem Asifabad, Mahabubabad, Mahabubnagar, Mancherial, Medak, Medchal-Malkajgiri, Mulugu, Nagarkurnool, Nalgonda, Narayanpet, Nirmal, Nizamabad, Peddapalli, Rajanna Sircilla, Rangareddy, Sangareddy, Siddipet, Suryapet, Vikarabad, Wanaparthy, Warangal, Yadadri Bhuvanagiri.
- **Andhra Pradesh Official 26 Districts**: Alluri Sitharama Raju, Anakapalli, Ananthapuramu, Annamayya, Bapatla, Chittoor, Dr. B.R. Ambedkar Konaseema, East Godavari, Eluru, Guntur, Kakinada, Krishna, Kurnool, Nandyal, NTR, Palnadu, Parvathipuram Manyam, Prakasam, Sri Potti Sriramulu Nellore, Sri Sathya Sai, Srikakulam, Tirupati, Visakhapatnam, Vizianagaram, West Godavari, YSR Kadapa.
- **Localizations**: Both Telangana and Andhra Pradesh districts carry official Telugu (`te`) and Hindi (`hi`) transliterations. Other Indian states carry English names with `[EN]` indicators in multilingual mode.

---

## 5. Sub-Districts, Mandals, and Taluk Coordinates (`backend/app/data/subdistricts_villages.json`, `frontend/src/data/subdistricts_villages.json`)

**Retrieved Date**: 2026-11-15  
**Source Repository**: [`datta07/INDIAN-SHAPEFILES`](https://github.com/datta07/INDIAN-SHAPEFILES)  
**Repository License**: MIT License (Copyright (c) 2020 Datta Prasad)  
**Underlying Data Provenance & License**:
- The boundary features carry Census of India 2011 administrative codes (`STCODE11`, `DTCODE11`, `SDTCODE11`, `NAME11`).
- The repository does NOT include a license declaration for the underlying government survey data. In strict accordance with honesty rules, **no claim of "official government portal" or "Government Open Data License (GODL)" is made**.
- **Mandal/Taluk Level**: This dataset contains sub-district (mandal/taluk) headquarters centroid coordinates, **not village-level cadastral survey boundaries**.

### Counts, Assignment Methodology, and Official Discrepancy Ledger

| State | Districts Covered | Sub-Districts / Mandals Count | Administrative Unit Type | Assignment Method & Discrepancy Disclosures |
|---|---|---|---|---|
| **Telangana** | 33 districts | **459 mandals** | Mandals | **Mandal Assignment**: Feature `dtname` mapped to 33 districts using alias normalization (`Warangal Rural` $\to$ `Warangal`, `Warangal Urban` $\to$ `Hanumakonda`, `Ranga Reddy` $\to$ `Rangareddy`, etc.).<br>**Discrepancy Disclosure**: Official Telangana state records list **612 mandals** across 33 districts. The bundled dataset contains **459 mandals**, leaving an official mismatch of 153 mandals formed during post-2016 re-divisions. Mandals not in the dataset fall back to district centre. |
| **Andhra Pradesh** | 13 legacy / 26 modern | **669 mandals** | Mandals | **Mandal Assignment**: Feature `dtname` groups 669 mandals under the **13 pre-2022 undivided districts** (Anantapur, Chittoor, East Godavari, Guntur, Krishna, Kurnool, Prakasam, SPSR Nellore, Srikakulam, Visakhapatnam, Vizianagaram, West Godavari, YSR Kadapa).<br>**Discrepancy Disclosure**: Andhra Pradesh reorganized into 26 districts in April 2022. Mandals created or reassigned in 2022 that lack direct sub-district entries fall back to district headquarters coordinates. |
| **Karnataka** | 30 districts | **176 talukas** | Talukas | Mapped directly from `dtname` polygon centroids. |
| **Maharashtra** | 34 districts | **355 talukas** | Talukas | Mapped directly from `dtname` polygon centroids. |
| **Total** | **123 districts** | **1,659 units** | Sub-district level | **Verified Centroid Coordinates** |

### Khammam District Mandals List (20 Bundled Mandals)
`Madhira`, `Yerrupalem`, `Kusumanchi`, `Nelakondapalle`, `Kallur`, `Tallada`, `Khammam (Rural)`, `Bonakal`, `Chinthakani`, `Enkuru`, `Kamepalle`, `Konijerla`, `Mudigonda`, `Penuballi`, `Sathupalle`, `Singareni`, `Thirumalayapalem`, `Vemsoor`, `Wyra`, `Khammam (Urban)`.

### Integrity & Hierarchy Rules
1. **Cascading Dropdowns**: In the UI (`FarmRegistrationPage.tsx`), State $\to$ District $\to$ Mandal/Taluk are strictly chained. Selecting a state filters the districts; selecting a district filters the mandals/taluks. Changing a parent immediately resets the child selection.
2. **Read-Only Coordinate Transparency**: Selecting a mandal displays its exact latitude and longitude with a read-only badge indicating precision level.
3. **District-Centre Fallback**: If a district has no sub-district entry (or for states outside the bundled 4 states), the selector offers the district headquarters centroid with a read-only badge indicating `precision: "district"` ("approximate district centre"). Coordinates are never invented or guessed.
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

