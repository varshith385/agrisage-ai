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

### Decision 4: Agronomic Impact Analysis (Before vs After Comparison)
- **Context**: Farmers need to see how uploading a Soil Health Card improves their farm advisory and why testing soil matters.
- **Decision**:
  - Without confirmed soil card: AgriSage activates the weather-only crop recommendation model (temperature, humidity, rainfall) with an honest lower confidence (~50%) and unadjusted district-mean baseline yields.
  - With confirmed soil card: The full 7-feature N-P-K-pH model is activated with high confidence (~88-99%), and yield predictions receive an indicative soil fertility factor based on optimal pH (6.2-7.8) and organic carbon balance.
  - All adjustments are accompanied by transparent disclaimers: *"Indicative agronomic modeling. Verify soil health recommendations with your local KVK or Agriculture Officer."*
