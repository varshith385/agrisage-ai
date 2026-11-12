# AgriSage AI — Data Sources Catalog (`docs/DATA_SOURCES.md`)

**Yuktik 2026 Hackathon | Data Provenance & Verification Ledger**

> [!IMPORTANT]
> In strict accordance with the **Honesty Rules** and Phase 1 instructions, licenses, row counts, terms, and dataset details are **NOT** assumed as verified facts. Every license and dataset detail below is explicitly marked **"to verify"** unless directly inspected and authenticated from the official primary source. No metrics or figures are invented.

---

## 1. Data Sources Master Table

| Data Source | Intended Usage | License Status | Dataset Details (Rows / Terms) | Fallback Mechanism | Verification Status |
|---|---|---|---|---|---|
| **Open-Meteo Weather API** (`api.open-meteo.com`) | Live hourly/daily weather, precipitation probability, wind speed, reference evapotranspiration ($ET_0$). | Open Database License (ODbL) / Non-commercial terms *[to verify]* | Free tier API access limits and attribution terms *[to verify]* | `weather_cache` table (30-min TTL); stale cache returned if network unavailable; clear error if no cache exists. | **Partially Verified** (Endpoint connectivity verified; license/terms *to verify*) |
| **Open-Meteo Geocoding API** (`geocoding-api.open-meteo.com`) | Village / district search and coordinates resolution (lat/lon). | Open Database License (ODbL) *[to verify]* | Global geographic database *[to verify]* | Static internal dictionary of Indian states, districts, and sample villages for Telangana, AP, Maharashtra, and Karnataka. | **To verify** |
| **data.gov.in AGMARKNET Mandi Arrivals & Prices** | Real-time and historical commodity arrival volumes and modal prices across agricultural markets. | Government Open Data License - India (GODL) *[to verify]* | Requires user API key (`DATA_GOV_IN_API_KEY`); row counts and frequency *[to verify]* | Local offline dataset `datasets/demo/mandi_prices.csv`, visibly badged as `DEMO DATA` in API and UI. | **To verify** |
| **PlantVillage Dataset & Pretrained CV Weights** | Leaf image classification across healthy and diseased plant classes on CPU (`neghani/plantvillage-mobilenetv2`). | Apache-2.0 on HuggingFace; upstream dataset CC BY-SA 4.0 *[to verify]* | MobileNetV2 architecture, 38 classes across 14 crops (Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Bell Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato; does NOT cover Cotton, Chilli, Rice, Wheat). Weights: `model.safetensors` (9.26 MB, SHA256: `f1a98e77629c36b5fe90a0fbed7ba56f097ce419c6dad8456bd135f36ea8d426`). | Input quality gate rejects dark/blurry/non-leaf images; crop mismatch/unsupported warnings emitted; low confidence fallback prompts KVK consultation. | **Verified** (Model downloaded, SHA256 matched, run on CPU; upstream dataset terms *to verify*) |
| **Kaggle Crop Recommendation Dataset** | Multi-class crop classification using N, P, K, pH, rainfall, temperature, and humidity. | Open Database / Public Domain *[to verify]* | Frequently cited as 2,200 rows across 22 crops *[to verify]* | Regional agro-climatic heuristic fallback with lower confidence score; marked `DEMO` if model artifacts are unbuilt. | **To verify** |
| **ICRISAT / Directorate of Economics & Statistics (DES)** | District-level historical agricultural yield, area, and seasonal production data. | Government / Academic Open Access terms *[to verify]* | District-wise crop production statistics *[to verify]* | Baseline naive mean (district average) with prediction intervals; labelled `DEMO` if unverified. | **To verify** |
| **Commission for Agricultural Costs & Prices (CACP) MSP** | Minimum Support Price (MSP) benchmarks for Kharif and Rabi notified crops. | Government official notification *[to verify]* | Notified benchmark prices per quintal *[to verify]* | `datasets/msp.csv` with cited official release links; crops without verified MSP show "MSP not verified". | **To verify** |
| **Central & State Government Schemes** (PM-KISAN, PMFBY, Rythu Bharosa, KCC) | Rule-based matching for financial subsidies, crop insurance, and institutional credit. | Public Government Portals *[to verify]* | Eligibility criteria, subsidy amounts, and official application links *[to verify]* | `datasets/demo/demo_schemes.json` with unverified fields flagged `verified: false` and displayed as "details to verify". | **To verify** |

---

## 2. Verification Action Plan

Before moving to Phase 3 and Phase 5 implementations:
1. **Model Weights & Class Labels**:
   - Locate the exact Hugging Face or PyTorch Hub model repository for PlantVillage.
   - Record its exact license file URL, commit SHA, and class list in `docs/DECISIONS.md`.
2. **Dataset Attribution**:
   - For any dataset downloaded into `datasets/`, record its source URL, author/authority, license text, and download timestamp in `datasets/README.md`.
3. **Mandi Prices & MSP Data**:
   - Validate AGMARKNET API key registration requirements on `data.gov.in`.
   - Verify all MSP figures directly against official Press Information Bureau (PIB) or Ministry of Agriculture notifications with exact release dates.

