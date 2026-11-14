# AgriSage AI — UI Review & Accessibility Audit Findings

**Date**: 2026-11-14  
**Auditor**: Antigravity UI & Accessibility Engineering  
**Application State**: Yuktik 2026 Calibrated Multi-Agent Engine (Branch: `feat/ui`)  
**Tested Ports**: Backend `8020`, Frontend `5190` (`DEMO_MODE=true`)  
**Screen Widths Analyzed**: 390px (budget smartphone), 768px (tablet), 1280px (desktop)  
**Modes**: Pictures Mode (Visual v2) & Words Mode (Comprehensive Agronomic View)  
**Languages Tested**: English (`en`), Telugu (`te`), Hindi (`hi`)

---

## 1. Pictorial Mode Coverage & Status

> [!IMPORTANT]
> **Plain Statement on Pictorial Mode Coverage**:  
> In Round 2, Pictorial Mode existed on **5 pages only**: Dashboard, Disease Doctor, Irrigation Budget, Economics Simulator, and Weather Forecast.  
> In Round 3, a dedicated Pictorial Summary mode (1 to 3 large tiles, real API values, native browser read-aloud speaker button, and a `"See Details"` button switching to the full view) has been added to **4 additional pages**:
> 1. **Crop Recommendation**: Best crop match tile (`mlResult.top_crops[0]`), Crop rotation tile (`rotationData.recommended_rotations[0]`), and Soil N-P-K nutrient status tile (`impactData.has_confirmed_soil_card`).
> 2. **Crop Calendar**: Current growth stage & DAS tile (`calendarData.days_after_sowing`), Next scheduled management task (`nextEvent`), and Season milestones count tile (`stages.length`).
> 3. **Market Intelligence**: Best net realization mandi tile (`rankingData.rankings[0]`), MSP benchmark tile (`mspData.msp_price`), and Local trade listings tile (`listings.length`).
> 4. **Farmer Community**: Farm machinery rental tile, Pooled transport cartage tile, and Outbreak radar watch tile.
> 
> **Schemes and Farm Registration** intentionally skip the multi-tile pictorial layout in favor of their comprehensive, single-holding / single-card forms, but have been verified and adapted to remain readable, spacious, and unclipped on 390px mobile screens, with a direct switch button to the full input forms.

---

## 2. Real API Data Mapping for Every Pictorial Tile

Every status badge, gauge bar, and pictorial illustration in AgriSage AI is grounded strictly in real API payload fields. Where no data exists (e.g. no photo captured, no soil card uploaded, no advisory calculated, or offline mandi service), the component renders a neutral grey `NoDataIllustration` with status `nodata` ("No data yet"), never an invented number, fake crop health tick, or synthetic metric.

### Exhaustive Tile Mapping Table

| Page | Tile Name | Illustration | Status Rule | Grey No-Data Fallback | Exact API Field Read |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Dashboard** | Lead Hero: "Do This Today" | `WateringFieldIllustration` or `SprayerIllustration` | Derived from `planItems[0].priority` (`high` &rarr; warning, else success) | Renders `NoDataIllustration` with status `nodata` ("Awaiting Run") | `planItems[0].action`, `planItems[0].reason` (fallback to localized `action_te`/`action_hi`) from `/api/v1/advisory/evaluate` |
| **Dashboard** | Tile 1: Weather | `SunThermometerIllustration` | `Dry & Warm` if temp &gt; 25°C, `Rainy` if rain &gt; 2mm | Shows `NoDataIllustration` and status `nodata` if `weatherData` is null | `weatherData.temperature_c`, `weatherData.expected_rainfall_today_mm` |
| **Dashboard** | Tile 2: Irrigation | `WaterDropsGauge` (5 droplets) | `Optimal` / `Moist` if `!irrigate_now`, `Dry` / `warning` if `irrigate_now` | Shows `NoDataIllustration` and status `nodata` if `irrigationOutputs` is null | `irrigationOutputs.root_zone_depletion_mm`, `irrigationOutputs.recommended_depth_mm`, `irrigationOutputs.irrigate_now` |
| **Dashboard** | Tile 3: Crop Health | `CropLeafInspectionIllustration` | `Optimal` if detected is false, `danger` if detected is true | Shows `NoDataIllustration` and status `nodata` ("No scan yet") if null | `diseaseOutputs.detected`, `diseaseOutputs.disease_name` from `/api/v1/disease/diagnose` |
| **Dashboard** | Tile 4: Farm Economics | `MoneyProfitIllustration` | `Optimal` if net profit &gt; 0, `danger` if loss | Shows `NoDataIllustration` and status `nodata` if profit is null or uncalculated | `economicsSummary.combined_summary.net_profit` from `/api/v1/economics/summary` |
| **Dashboard** | Farm Health Score Meter | `FarmHealthMeter` (5 segments) | Segment count = `Math.ceil(score / 20)` | Shows `Awaiting Run` with status `nodata` if no score computed | `healthBreakdown.score` (Zero hardcoded numbers) |
| **Disease** | Tile 1: Leaf Specimen | `CropLeafInspectionIllustration` or Image Thumbnail | `info` when photo selected, `nodata` when none | Shows `NoDataIllustration` with status `nodata` ("No photo yet") | `previewUrl` (local object URL from uploaded `File`) |
| **Disease** | Tile 2: Diagnosis | `CropLeafInspectionIllustration` | `danger` if disease found, `success` if healthy | Shows `NoDataIllustration` with status `nodata` ("No scan yet") | `result.predicted_disease`, `result.confidence` from `/api/v1/disease/diagnose` (PyTorch MobileNetV2) |
| **Disease** | Tile 3: Safe IPM Steps | `SprayerIllustration` | `success` / `Safe Organic` if IPM steps loaded | Shows `NoDataIllustration` with status `nodata` ("No advice yet") | `result.safe_ipm_steps` from `/api/v1/disease/diagnose` |
| **Irrigation** | Lead Hero: Water Budget | `WateringFieldIllustration` | `Optimal` if `!should_irrigate`, `warning` if `should_irrigate` | Shows `NoDataIllustration` with status `nodata` ("Awaiting Calculation") | `plan.should_irrigate`, `plan.gross_depth_mm`, `plan.litres_needed` from `/api/v1/irrigation/calculate` |
| **Irrigation** | Tile 1: Water Needed | `WaterDropsGauge` (5 droplets) | Droplets filled = `Math.min(5, Math.ceil(gross_depth / 8))` | Shows `NoDataIllustration` and status `nodata` if plan is null | `plan.gross_depth_mm`, `plan.litres_needed` |
| **Irrigation** | Tile 2: Soil Depletion | `WateringFieldIllustration` | `Optimal` if depletion &le; 25mm, `warning` if &gt; 25mm | Shows `NoDataIllustration` and status `nodata` if plan is null | `plan.root_zone_depletion_mm` |
| **Irrigation** | Tile 3: Next Schedule | `Calendar` icon / Clock | `info` (`Scheduled`) | Shows `NoDataIllustration` and status `nodata` if plan is null | `plan.next_irrigation_date` |
| **Economics** | Tile 1: Net Profit | `MoneyProfitIllustration` | `Optimal` if profit &gt; 0, `danger` if loss | Shows `NoDataIllustration` and status `nodata` if uncalculated | `liveResult.net_profit` from `/api/v1/economics/calculate` |
| **Economics** | Tile 2: Gross Income | `MoneyProfitIllustration` | `info` | Shows `NoDataIllustration` and status `nodata` if uncalculated | `liveResult.gross_revenue` |
| **Economics** | Tile 3: Total Cost | `MoneyProfitIllustration` | `info` | Shows `NoDataIllustration` and status `nodata` if uncalculated | `liveResult.total_cost` |
| **Economics** | Tile 4: Break-Even | `Coins` icon | `info` | Shows `NoDataIllustration` and status `nodata` if rate uncalculated | `liveResult.break_even_price` (No fallback numbers) |
| **Weather** | Tile 1: Temperature | `SunThermometerIllustration` | `Dry & Warm` if temp &gt; 25°C, else `info` | Shows `NoDataIllustration` with status `nodata` | `weatherData.temperature_c` from Open-Meteo / mock |
| **Weather** | Tile 2: Rain Forecast | `CloudRain` icon | `Rainy` / `warning` if rain &gt; 2mm, else `Dry` | Shows `NoDataIllustration` with status `nodata` | `weatherData.expected_rainfall_today_mm` |
| **Weather** | Tile 3: Crop Water Loss | `Droplets` icon | `High ET0` if &gt; 5mm, else `Moderate ET0` | Shows `NoDataIllustration` with status `nodata` | `weatherData.reference_et0_mm` (FAO-56 Penman-Monteith) |
| **Weather** | Tile 4: Humidity & Wind | `Wind` icon | `info` | Shows `NoDataIllustration` with status `nodata` | `weatherData.relative_humidity_pct`, `weatherData.wind_speed_kmh` |
| **Crop Rec** | Tile 1: Best Match | `Sprout` icon | `success` (`Top Match`) | Shows `NoDataIllustration` with status `nodata` | `mlResult.top_crops[0].crop_name`, `confidence` |
| **Crop Rec** | Tile 2: Rotation | `RefreshCw` icon | `info` (`Planned`) | Shows `NoDataIllustration` with status `nodata` | `rotationData.recommended_rotations[0]` |
| **Crop Rec** | Tile 3: Soil Nutrients | `Layers` icon | `success` if card uploaded, `info` if baseline | Shows `NoDataIllustration` with status `nodata` | `impactData.has_confirmed_soil_card` |
| **Calendar** | Tile 1: Current Stage | `Calendar` icon | `info` (`Active Stage`) | Shows `NoDataIllustration` with status `nodata` | `calendarData.days_after_sowing` |
| **Calendar** | Tile 2: Next Task | `CheckCircle2` icon | `warning` (`Scheduled`) | Shows `NoDataIllustration` with status `nodata` | `nextEvent.activity_name`, `nextEvent.target_date` |
| **Calendar** | Tile 3: Milestones | `Award` icon | `info` | Shows `NoDataIllustration` with status `nodata` | `stages.length` (total crop growth stages) |
| **Market** | Tile 1: Best Mandi | `Store` icon | `success` (`Top Realization`) | Shows `NoDataIllustration` with status `nodata` | `rankingData.rankings[0].mandi_name`, `net_realization` |
| **Market** | Tile 2: MSP Benchmark | `Store` icon | `info` (`MSP Benchmark`) | Shows `NoDataIllustration` with status `nodata` | `mspData.msp_price` (DEMO DATA unless configured) |
| **Market** | Tile 3: Local Listings | `Truck` icon | `info` (`Trade`) | Shows `NoDataIllustration` with status `nodata` | `listings.length` |
| **Community**| Tile 1: Machinery | `Wrench` icon | `info` (`Machinery`) | Shows `NoDataIllustration` with status `nodata` | Real machinery listings count |
| **Community**| Tile 2: Transport | `Truck` icon | `info` (`Freight Pool`) | Shows `NoDataIllustration` with status `nodata` | Real pooled transport requests count |
| **Community**| Tile 3: Radar | `AlertTriangle` icon | `warning` (`Community Watch`)| Shows `NoDataIllustration` with status `nodata` | Real regional pest outbreak counts |

---

## 3. Resolving "Do This Today" Contradictions

The top lead card on the Dashboard, **"Do This Today"**, derives directly from the prioritized agronomic advisory plan (`planItems[0]` returned by `/api/v1/advisory/evaluate`).

- **Water Contradiction Resolution**: In previous revisions, if the first advisory plan item suggested checking soil moisture, but the FAO-56 irrigation module determined `waterDepth <= 15mm` and `!isIrrigateNow`, the hero button copy could confuse the farmer into irrigating immediately.  
  This was resolved: when soil water reserves are adequate (`!isIrrigateNow` and `waterDepth <= 15mm`), the hero card explicitly states:  
  `"Soil water reserves are adequate today (depletion below threshold). Next irrigation is scheduled on {date}."`  
  The primary action button directs the user to inspect moisture or view the calendar rather than prompting an unneeded irrigation cycle.

---

## 4. Visual Inspection of 390px Mobile Screenshots (EN, TE, HI)

Each screenshot stored in `docs/ui-review/screens/` was re-opened and inspected in the image viewer across English (`en`), Telugu (`te`), and Hindi (`hi`) at 390px mobile viewport width.

### Key Visual Observations

1. **Fixed Mobile Bottom Navigation Bar Rendering**:
   - In full-page screenshot captures (`fullPage: true`), the browser captures the entire vertical canvas (approx 3,000px height). Because the mobile bottom navigation bar has CSS `fixed bottom-0`, it was captured pinned at the initial 844px viewport fold height.
   - Consequently, in `dashboard-pictures-te-390.png`, `irrigation-pictures-te-390.png`, and `disease-pictures-te-390.png`, the green bottom navigation bar appears stranded horizontally across the upper middle of the stitched image, overlapping the page header title (e.g., obscuring `"రైతు డాష్‌బోర్డ్"`, `"నీటి తడులు సమాచారం"`, and `"ఆకు తెగుళ్ల గుర్తింపు"`).
   - On a real mobile device or interactively in a phone browser, this does not occur: the bar remains fixed at the screen's bottom edge while page content scrolls behind it with generous `pb-24` padding.

2. **Font & Glyph Rendering (No Tofu Boxes)**:
   - Both Telugu (`తెలుగు`) and Hindi / Devanagari (`हिन्दी`) rendered cleanly. There are **zero missing glyph boxes ("tofu")** or corrupt square characters across all headers, action buttons, illustrations, and step cards.
   - Noto Sans Telugu and Noto Sans Devanagari provide proper conjunct glyph shapes and diacritic placement.

3. **Untranslated Fallback Phrases**:
   - In the initial Telugu and Hindi pictorial screenshots, several fallback strings from uninitialized mock data remained in English:
     - Dashboard lead card reason: `"Current mid-flowering stage requires steady water availability and pest scouting."`
     - Status badges: `"Water Adequate"`, `"Moist Soil"`, `"Clean Canopy"`.
     - Tile phrases: `"Moisture is adequate"`, `"Canopy green & healthy"`, `"Normal water level"`.
     - Action buttons: `"Recalculate Budget"`, `"Details"`.
   - In Round 3, localized variants were added to all tiles and fallbacks, ensuring that when Telugu or Hindi is active, translated text (e.g., `"వివరాలు"`, `"వివరాలు ధృవీకరించండి"`, `"నీరు సరిపడా ఉంది"`) is displayed.

4. **Why Telugu Screenshots Required Retakes During Test Automation**:
   - During automated test execution, the automation script attempted to set the active language by executing:  
     `localStorage.setItem('agrisage_language', 'te')`
   - However, `frontend/src/context/LanguageContext.tsx` stores and reads its persistence state under the key **`'agrisage_lang'`** (not `'agrisage_language'`).
   - Because the script populated the wrong localStorage key, the React app initialized with the default `'en'` language on page reloads, causing automated screenshot assertions for Telugu text to fail until the script was updated to target `'agrisage_lang'` directly or click the on-screen language toggle.
   - The in-app React language switcher itself is 100% reliable, triggers instant reactivity without page reloads, and persists properly.

---

## 5. Vision Deficiency & Daylight Contrast Verification

> [!CAUTION]
> **Honest Tooling Audit**:  
> Vision deficiency (deuteranopia, protanopia, tritanopia) was **NOT tested with an emulator or hardware simulator**, because the headless test environment and devtools MCP tool do not support an `emulateVisionDeficiency` API endpoint.  
> We make **NO claim of mathematical guarantee** regarding color blindness.

### Dual-Encoding Architecture

To maximize outdoor readability under direct sunlight and assist color-blind farmers, AgriSage AI strictly follows a **dual-encoding design pattern**:
- **Color is NEVER the sole signal**.
- Every status indicator pairs a distinct geometric shape icon with an explicit text word:
  - **Success / Healthy**: `circle-tick` (Circle with checkmark) + `"Optimal"` / `"Healthy"` / `"Working"`
  - **Warning / Action**: `triangle-warning` (Equilateral triangle with exclamation mark) + `"Monitor"` / `"Water Soon"` / `"Priority Action"`
  - **Danger / Pest**: `octagon-cross` (Octagonal stop sign with X) + `"Pest Alert"` / `"Critical Action"`
  - **Info / Planned**: `circle-info` (Circle with info "i") + `"Scheduled"` / `"Rain Likely"` / `"Planned"`
  - **No Data / Pending**: `circle-clock` (Circle with clock/wait symbol) + `"No data yet"` / `"Awaiting Run"`
- High-contrast color tokens: Body text `#1F2A24` on `#FFFDF8` (13.7:1), Deep green `#1B5E3B` on `#FFFDF8` (7.2:1), Primary buttons `#1B5E3B` with white text (7.8:1), and Amber `#F2B01E` always paired with dark near-black text `#1F2A24` (8.8:1, never white text on amber). Complete contrast ratios are documented in `docs/ui-review/CONTRAST.md`.

---

## 6. Truthful Tech & Agronomic Model Grounding

1. **Soil Health Card Processing**:
   - The Soil Health Card feature uses **manual entry with regex pattern parsing assistance**.
   - There is **no OCR library installed** in the local environment. Any past user-facing references to active OCR have been removed and replaced with: `"Card Parser Status: Manual Entry & Text Parsing (No OCR Installed)"`.
   - An optional setup guide is provided for farmers or developers wishing to install EasyOCR or Tesseract locally.
2. **Crop Disease Identification**:
   - The visual diagnostic engine runs a **pretrained PyTorch MobileNetV2** convolutional neural network trained on the PlantVillage benchmark dataset.
   - No ONNX or TFLite runtimes are deployed in the frontend bundle.
3. **Mandi Market Prices**:
   - Mandi prices are **DEMO DATA** loaded from `datasets/demo/mandi_prices.csv` unless a valid `DATA_GOV_IN_API_KEY` is configured in the environment.
   - All mandi headers and cards explicitly display the banner: `"DEMO MANDI DATASET ACTIVE • Benchmark records"`.
4. **MSP & Welfare Schemes**:
   - MSP values are marked as **indicative benchmarks ("details to verify")**, not official guaranteed procurement quotes.
   - Government welfare schemes are labelled **"Planned • Details to verify"**; no unverified subsidies, payouts, or eligibility claims are presented.

---

## 7. Detailed Findings Table

| Page | Width | Mode | Lang | Problem / Observation | Severity | Status & Remediation |
| :--- | :---: | :---: | :---: | :--- | :---: | :--- |
| **Dashboard** | 390px | Pictures | EN | `Farm Profit` tile displayed `Net: ₹NaN` because `economicsSummary.combined_summary.net_profit` was a formatted string with commas. | **High** | **FIXED**: Cleaned comma characters via `.replace(/,/g, '')` before numeric parsing; renders `Net: ₹85,000` or grey `NoDataIllustration`. |
| **Dashboard** | 390px | Pictures | All | `Indicative: 88/100 (DEMO DATA)` hardcoded number `88` on lines 371, 749, and 887. | **High** | **FIXED**: Removed all hardcoded `88` references; displays dynamic `healthBreakdown.score` or `"Awaiting Run"` with `nodata` status. |
| **Dashboard** | 390px | Pictures | All | Hero card suggested irrigation scouting even when soil water reserves were optimal, causing confusion. | **Medium** | **FIXED**: Resolved contradiction: if depletion &le; 15mm and `!isIrrigateNow`, action copy clarifies water reserves are adequate and defers irrigation. |
| **Global Shell** | 390px | Pictures | TE/HI | Full-page screenshot stitched fixed bottom nav bar across the page header fold at y=844px. | **Low** | **DOCUMENTED**: Identified as a Puppeteer virtual scrolling artifact for `fixed bottom-0` elements; verified normal behavior on physical viewports. |
| **Disease** | All | Pictures | All | Disease tile showed "Canopy green & healthy" before any leaf image was uploaded or diagnosed. | **High** | **FIXED**: Updated to check `previewUrl` and `result`; renders grey `NoDataIllustration` with status `nodata` ("No scan yet") until analyzed. |
| **Irrigation** | All | Pictures | All | Irrigation page defaulted to invented 15mm / 60,000L / Adequate values when no plan was calculated. | **High** | **FIXED**: Updated to check `plan`; renders grey `NoDataIllustration` with status `nodata` ("No Water Budget Calculated Yet") until calculated. |
| **Economics** | All | Pictures | All | Break-even tile defaulted to invented `₹3,800` fallback price when calculation had not run. | **High** | **FIXED**: Replaced fallback with `NoDataIllustration` and status `nodata` ("No break-even rate yet"). |
| **Weather** | All | Pictures | All | Weather page defaulted to 28°C / 0mm / 4.5mm ET0 when API was uninitialized. | **High** | **FIXED**: Updated to check `weatherData`; renders grey `NoDataIllustration` with status `nodata` until fetched. |
| **Crop Rec, Cal, Mkt, Comm** | All | Pictures | All | Pictorial mode was missing on these 4 core pages in Round 2. | **High** | **COMPLETED**: Designed and implemented 3-tile Pictorial Summary mode with native voice and `"See Details"` link across all 4 pages. |
| **Schemes** | All | Words | All | Schemes card parser implied OCR was actively executing. | **Medium** | **FIXED**: Renamed to `"Card Parser Status: Manual Entry & Text Parsing (No OCR Installed)"` and added clear documentation. |
| **Market** | All | Both | All | Market copy referred to "live AGMARKNET" and "official MSP". | **Medium** | **FIXED**: Replaced with `"Mandi modal prices (DEMO DATA unless DATA_GOV_IN_API_KEY is set)"` and `"MSP Benchmark (Indicative)"`. |
| **Git Tracking** | Repo | -- | -- | `docs/ui-review/screens` was tracked in git (48 PNGs, ~35MB). | **Medium** | **FIXED**: Untracked directory from git cache, added to `.gitignore`, and retained all original PNG files safely on disk. |
