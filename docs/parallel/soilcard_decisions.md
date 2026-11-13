# Soil Health Card — Decisions & Architectural Notes
**Branch**: `feat/soilcard`  
**Date**: 2026-11-13  
**Status**: APPROVED

---

### Decision 1: Pluggable OCR Architecture with PowerShell Fallback
- **Context**: In multi-agent environments, heavy native C++ dependencies like Tesseract binaries or Torch-based EasyOCR packages may not be present in every worker environment or `.venv`.
- **Decision**: 
  - Pluggable engine detection detects `easyocr`, `pytesseract` (with binary check), and `gemini_vision` (via `GEMINI_API_KEY`).
  - When no OCR engine is detected, the system does NOT crash or mock fake OCR. Instead, it exposes clear PowerShell installation commands (`winget install UB-Mannheim.TesseractOCR`, `py -3.12 -m pip install easyocr`) and gracefully falls back to smart regex parsing and manual calibration.
  - Zero hallucination / zero synthetic claims: The UI clearly flags "Manual / Assist Mode" and shows the exact engine detected.

---

### Decision 2: Strict Farmer Confirmation Guard
- **Context**: OCR transcripts are error-prone, particularly on weathered, stained, or mobile-camera-captured Soil Health Cards. Silently writing raw OCR outputs to the farm profile could corrupt critical downstream crop recommendation, soil water budgeting, and yield predictions.
- **Decision**:
  - `POST /api/v1/soil-card/ocr` is strictly non-persistent and read-only.
  - Extracted values are presented in editable fields with per-field confidence meters (High, Medium, Low/Out-of-range, Missing).
  - Data is committed to the database ONLY when the farmer reviews, edits, and explicitly clicks "Confirm & Save to Farm Profile" via authenticated `POST /api/v1/soil-card/confirm`.
  - The UI and API responses prominently display the warning: *"Nothing is saved to your farm profile until you review and click Confirm. Never silently trust OCR."*

---

### Decision 3: Privacy-Preserving Image Handling (Opt-In Retention)
- **Context**: Land records and Soil Health Cards contain personal farmer identifiers, survey numbers, and location details. Default image storage risks farmer privacy.
- **Decision**:
  - Zero retention default: Card images uploaded for OCR are processed in memory and immediately discarded.
  - An image is saved to disk ONLY if `store_image_opt_in=True` is explicitly checked by the farmer.
  - Even if opt-in is enabled, images are saved to a protected internal directory with randomized, unguessable filenames.

---

### Decision 4: Real Model Outputs Only (Zero Synthetic Yield Adjustments)
- **Context**: Agronomic models should not invent unverified percentage adjustments.
- **Decision**:
  - Removed all hardcoded soil fertility adjustments (e.g. "optimal pH 6.2-7.8 (+4.0%)").
  - The impact analysis displays the real outputs of `crop_recommender_engine` and `yield_model_engine` before vs after.
  - Removed the hardcoded fallback confidence of 0.88 or 0.50. If the model returns no confidence, `confidence` is returned as `null` (displayed as *"Not Available"* in UI).
  - All comparisons carry the transparent disclaimer: *"Indicative agronomic modeling. Verify soil health recommendations with your local KVK or Agriculture Officer."*

---

### Decision 5: Explicit Scope Isolation (Partial Pipeline Integration)
- **Context**: Other multi-agent teammates depend on the stable contracts of `crop_recommendation.py`, `yield_service.py`, and domain agents.
- **Decision**:
  - Neither `crop_recommendation.py`, `yield_service.py`, nor any domain agents were modified.
  - Confirmed soil health values are evaluated within this comparison screen only.
  - A prominent `integration_scope_note` response field and UI banner explicitly state: *"Confirmed soil values are evaluated only within this comparison screen and are not yet passed to the farm's main recommendation (/api/v1/crop-recommendation) and yield (/api/v1/yield) endpoints."*
  - This limitation is formally recorded as `PARTIAL` in `docs/parallel/soilcard_feature_status.md`.
