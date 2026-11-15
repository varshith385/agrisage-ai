# Grow2Gain — Soil Health Card Flow & Advisory Integration (`docs/SOIL_CARD_FLOW.md`)

This document provides a plain-language and architectural reference for the end-to-end Soil Health Card ingestion, AI reading, validation, persistence, and Crop Advisory integration implemented in Grow2Gain.

---

## 1. Overview & Architecture

The Soil Card workflow allows Indian smallholder farmers to digitize physical Soil Health Cards issued by government laboratories or private testing centres. The pipeline converts physical printed certificates into calibrated, farm-specific soil parameters ($N, P, K, \text{pH}$) that feed directly into the scikit-learn Crop Recommendation model.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT BROWSER                                   |
|                                                                                   |
|  [Photo Capture]  --->  [Client-Side Compression]  --->  [POST /api/v1/soil-card/ocr]
|  (Camera/Upload)        (Canvas: <=1280px, 85% JPEG)              |               |
+-------------------------------------------------------------------|---------------+
                                                                    v
+-----------------------------------------------------------------------------------+
|                                 BACKEND PIPELINE                                  |
|                                                                                   |
|  1. Engine Selector: Gemini Vision -> EasyOCR -> Tesseract -> Manual             |
|  2. Vision Model: gemini-3.1-flash-lite with strict JSON schema instructions     |
|  3. Unit Normalization: Standardizes ppm, lbs/acre, or % to kg/ha               |
|  4. Bounds & Sanity Gate: pH [0-14], non-negative nutrients, envelope checks      |
|  5. Non-Card Rejection: Evaluates is_soil_health_card flag                       |
+-------------------------------------------------------------------|---------------+
                                                                    v
+-----------------------------------------------------------------------------------+
|                                  CLIENT CONFIRM                                   |
|                                                                                   |
|  [Pre-filled Form]  --->  Farmer Reviews & Edits  --->  [Confirm & Save to Farm]  |
|  - Confidence badges      (Manual entry fallback)      (POST /soil-card/confirm)  |
|  - Unreadable highlighted                                         |               |
+-------------------------------------------------------------------|---------------+
                                                                    v
+-----------------------------------------------------------------------------------+
|                               PERSISTENCE & SHARING                               |
|                                                                                   |
|  SQLite: soil_health_cards (farm_id, n, p, k, ph, source, test_date, created_at)  |
|  Shared Hook: useSoilCard(activeFarmId) via TanStack Query cache invalidation     |
+-------------------------------------------------------------------|---------------+
                                                                    v
+-----------------------------------------------------------------------------------+
|                              CROP ADVISORY PAGE                                   |
|                                                                                   |
|  - Auto-reads farm soil card -> Pre-fills N, P, K, pH                             |
|  - Evaluates full 7-feature GaussianNB / RandomForest advisory                    |
|  - Displays real source attribution: "Soil card, tested <date>"                   |
|  - If missing: RED danger banner with icon & deep link to Schemes/Soil Card       |
|  - What-If overrides supported without overwriting saved farm card                |
+-----------------------------------------------------------------------------------+
```

---

## 2. Step-by-Step Flow

### Step 1: Image Capture & File Selection
- Farmers can either click "Choose photo or capture with camera" on mobile (triggering the native camera via `capture="environment"`) or drag-and-drop an existing photo on desktop.
- Accepted formats: JPEG, PNG, WEBP.
- Unsupported formats (e.g., Apple HEIC/HEIF) are caught with an explicit explanatory message advising conversion to JPG/PNG.

### Step 2: Client-Side Compression
- High-resolution mobile camera uploads (often 10–25 MB) are scaled to a maximum dimension of 1280px via an HTML5 canvas and re-encoded as an 85% quality JPEG.
- Keeps transmission lightweight (<500 KB), fast on 2G/3G rural networks, and well below server body limits.

### Step 3: Engine Selection
- The endpoint `GET /api/v1/soil-card/engines` inspects backend availability.
- Priority order:
  1. `gemini_vision`: Active when `GEMINI_API_KEY` is present.
  2. `easyocr`: Used if local python packages are installed.
  3. `tesseract`: Used if Windows Tesseract binary is detected in PATH.
  4. `manual_only`: Fallback when no OCR engine is available.

### Step 4: AI Vision Inference (Gemini Vision)
- The compressed image bytes are forwarded to Google Gemini Vision.
- Model: `gemini-3.1-flash-lite` (or custom override via `GEMINI_VISION_MODEL`).
- Prompt instruction enforces strict JSON output containing:
  - `is_soil_health_card`: boolean (true if image is a certified soil report).
  - `nitrogen`: `{ "value": number | null, "unit": string, "confidence": number }`
  - `phosphorus`: `{ "value": number | null, "unit": string, "confidence": number }`
  - `potassium`: `{ "value": number | null, "unit": string, "confidence": number }`
  - `ph`: `{ "value": number | null, "unit": "pH", "confidence": number }`
  - `organic_carbon`: `{ "value": number | null, "unit": "%", "confidence": number }`
  - `electrical_conductivity`: `{ "value": number | null, "unit": "dS/m", "confidence": number }`
  - `test_date`: string (YYYY-MM-DD or printed date)
- Instructed never to guess unreadable or blurred numbers; returns `null`.

### Step 5: Agronomic Unit Normalization
- Target representation: $N, P, K$ in $\text{kg/ha}$.
- Standard conversion applied if printed unit is explicit:
  - $\text{kg/ha}$ or $\text{kg/hectare}$: 1:1 direct pass-through.
  - $\text{ppm}$ or $\text{mg/kg}$: $\text{kg/ha} = \text{ppm} \times 2.2417$.
  - $\text{lbs/acre}$: $\text{kg/ha} = \text{lbs/acre} \times 1.12085$.
  - $\text{kg/acre}$: $\text{kg/ha} = \text{kg/acre} \times 2.471$.
- If unit is unstated or ambiguous, the raw value is retained with a notice that the unit could not be confirmed.

### Step 6: Physical Limits & Sanity Validation
- $\text{pH}$: Must be within 0.0 to 14.0. Out-of-bounds values are discarded to `null`.
- Nutrients: Negative values are strictly rejected.
- Training envelope comparison: If values exceed standard benchmark ranges (e.g. $N > 300\text{ kg/ha}$), a warning badge is attached, but the value is NOT silently clamped.

### Step 7: Pre-filled Confirmation Form
- The farmer is presented with an editable form pre-filled with the extracted values.
- Each field displays a green badge ("Read from your card") with individual confidence percentage.
- Any unreadable field is left empty, styled with a distinct amber border, and focused for manual entry.
- Double-click protection prevents redundant network submissions.

### Step 8: Farm Persistence & Tenancy Isolation
- Upon farmer confirmation ("Confirm and save to this farm"), values are saved to SQLite table `soil_health_cards`.
- Saved metadata includes: `farm_id`, `nitrogen_kg_ha`, `phosphorus_kg_ha`, `potassium_kg_ha`, `ph`, `source` (`"photo read by AI"` or `"typed by farmer"`), `test_date`, and `created_at`.
- Strict Ownership: Farmers can only read, save, or delete soil cards for farms they own (returns 403 Forbidden otherwise).
- A farmer can click "Remove saved values" to clear saved card data after confirmation.

### Step 9: Crop Advisory Auto-Fill
- When navigating to Crop Advisory (`/recommend`), the page invokes `useSoilCard(activeFarm.id)`.
- If a confirmed card exists:
  - Inputs ($N, P, K, \text{pH}$) are pre-filled automatically.
  - Crop recommendation runs the full 7-feature model ($N, P, K, \text{pH}$, temperature, humidity, rainfall).
  - Input attribution chips display the authentic source: `"Soil card, tested <date>"` or `"Typed by farmer"`.
- If any of $N, P, K$, or $\text{pH}$ is missing:
  - A prominent RED banner with icon and words alerts the user: *"Soil values missing. Add them from your Soil Card for the best crop recommendation"*.
  - A "Calibrate Soil" button links directly to the Soil Card tab with a validated `returnTo=/recommend` parameter.
  - After saving the card, the farmer is provided a "Back to Crop Advisory" button to return immediately with fresh values.
- Farmers can modify soil values on the Advisory page for temporary "What-If" exploration; an amber notice clarifies that edits are not saved to the farm profile unless explicitly committed.

---

## 3. Failure Paths & Graceful Recovery

Every failure condition degrades gracefully to ensure the farmer is never stranded:

| Failure Scenario | Detection / Status | System Behavior & Farmer Experience |
|---|---|---|
| **API Timeout** | Call exceeds 8.0 seconds | Cancels request, displays *"Image reading timed out"*, leaves form unlocked for manual entry. |
| **Rate Limit (429)** | Provider returns 429 Too Many Requests | Displays *"AI service temporarily busy (rate limit)"*, manual entry form remains open. |
| **Upstream 5xx** | Provider service outage or network error | Displays friendly error message without technical trace; manual entry unlocked. |
| **Non-Soil-Card Image** | AI reports `is_soil_health_card=false` or low confidence | Rejects image with explicit notice: *"The uploaded image does not appear to be a Soil Health Card. Please upload a clear photo of your card or type values manually."* |
| **Bad / Malformed JSON** | Model outputs non-JSON or broken formatting | Logs provider status, notifies farmer that values could not be parsed, unlocks manual form. |
| **Empty Response** | Model produces zero tokens | Handled as extraction failure; falls back to manual entry. |
| **Unsupported Format** | User selects `.heic`, `.tiff`, etc. | Validated in frontend; alerts user to upload JPG, PNG, or WEBP. |
| **Missing API Key** | `GEMINI_API_KEY` not configured | Reports engine status as `manual_only` or local OCR; presents PowerShell installation guidance without crashing. |

---

## 4. Privacy & Data Protection

- **Zero Permanent Disk Storage**: Uploaded Soil Card photos are processed in memory and are **never written to permanent disk storage**.
- **Ephemeral Processing**: Image bytes sent to Gemini Vision are processed ephemerally.
- **Thumbnail Opt-In**: A low-resolution thumbnail is stored in the database only if the farmer explicitly checks the opt-in box (`store_image_opt_in=true`).
- **Transparency Notice**: The UI displays a clear notice in the farmer's language before upload: *"Photo is sent to an AI provider (Google Gemini) to read values."*
- **Tenancy Boundary**: Data separation guarantees that farm soil records are strictly segregated by `user_id` and `farm_id`.

---

## 5. Environment Variables & Configuration

The Soil Card service is configured through the following environment variables in `backend/.env`:

| Variable | Type | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | String (Secret) | `""` | Google Gemini API key used for Vision OCR and reasoning. |
| `GEMINI_VISION_MODEL` | String | `gemini-3.1-flash-lite` | Vision model identifier used for multimodal soil card extraction. |
| `GEMINI_MODEL` | String | `gemini-3.1-flash-lite` | Default fallback Gemini model for general chat and fallback reasoning. |
| `OCR_TIMEOUT_SECONDS` | Float | `8.0` | Timeout threshold for upstream multimodal vision requests. |
