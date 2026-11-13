# Soil Health Card — Acceptance Criteria & Test Results
**Branch**: `feat/soilcard`  
**Phase**: 5.4  
**Date**: 2026-11-13  
**Tier 1 Test Status**: PASS (130 / 130 tests passing, 0 failures)

---

### Criteria 1: Pluggable OCR Backend & PowerShell Setup
- [x] Pluggable engine detection detects `easyocr`, `pytesseract`, and `gemini_vision`.
- [x] When zero OCR engines are installed, `GET /api/v1/soil-card/engines` returns status `MANUAL_ENTRY_REQUIRED` without crashing or inventing synthetic OCR output.
- [x] Exact PowerShell installation commands returned in API and accessible in frontend collapsible drawer:
  - `py -3.12 -m pip install easyocr`
  - `winget install UB-Mannheim.TesseractOCR; py -3.12 -m pip install pytesseract`
  - `GEMINI_API_KEY` in `backend/.env`
- [x] Frontend displays "Manual / Assist Mode" badge and provides fallback manual calibration inputs.

---

### Criteria 2: Multi-Language Parsing & Plausibility Validation
- [x] Standard English Soil Health Card extracts N, P, K, pH, OC, EC with high calibrated confidence (>0.85).
- [x] Telangana State Telugu Soil Health Card extracts N (నత్రజని), P (భాస్వరం), K (పొటాష్), pH (పీహెచ్), OC (సేంద్రీయ కర్బనం), EC (విద్యుత్ వాహకత) and marks `status="PARTIAL"` with review instructions.
- [x] Hindi Krishi Bhavan Soil Health Card extracts N (नाइट्रोजन), P (फास्फोरस), K (पोटाश), pH (पीएच), OC (जैविक कार्बन), EC (विद्युत चालकता) and marks `status="PARTIAL"` with review instructions.
- [x] Out-of-bounds metrics (e.g. N > 1500 kg/ha or pH > 14) are flagged with low confidence (<0.50) and marked "out of expected range".

---

### Criteria 3: Confirmation Screen Guard & Privacy Opt-In
- [x] Non-persistent OCR endpoint: `POST /api/v1/soil-card/ocr` extracts parameters into memory only. Zero database rows are inserted.
- [x] Explicit Confirmation Guard: Nothing is saved to the farm profile until the farmer reviews, edits missing/imprecise values, and clicks "Confirm & Save".
- [x] Prominent UI Banner: *"Nothing is saved to your farm profile until you review and click Confirm. Never silently trust OCR."*
- [x] Privacy Protection: Default image retention is OFF. Images are discarded unless the user explicitly checks `store_image_opt_in=True`.
- [x] Security: `POST /api/v1/soil-card/confirm` enforces authentication and farm ownership checks (returns 401 if unauthenticated, 404 if farm not found).

---

### Criteria 4: Agronomic Impact (Before vs After Comparison)
- [x] Without Soil Card: Weather-only crop recommendation model evaluates temperature, humidity, rainfall with baseline model confidence and standard district-mean yield.
- [x] With Confirmed Soil Card: Full 7-feature N-P-K-pH model activates; top crops re-ranked based on soil nutrient profile.
- [x] Real Model Outputs Only: Zero synthetic yield adjustments (+4% removed). Real regressor predictions returned before vs after.
- [x] No Hardcoded Fallback Confidence: Real model confidence returned directly (or null / 'not available' if model returns None; 0.88 fallback removed).
- [x] Disclaimers: Clear notice displayed: *"Indicative agronomic modeling. Verify soil health recommendations with your local KVK or Agriculture Officer."*

---

### Criteria 5: Downstream Pipeline Scope Isolation (Known Gap)
- [x] `crop_recommendation.py`, `yield_service.py`, and domain agents remain untouched.
- [x] Confirmed soil values are used strictly for this page's comparison.
- [x] Explicit `integration_scope_note` returned in API response and displayed in UI.
- [x] Gap recorded as `PARTIAL` in `docs/parallel/soilcard_feature_status.md`.

---

### Criteria 6: URL & Navigation
- [x] Accessible at `/schemes#soil-card-upload`.
- [x] Nav item added in `Header.tsx` (`t('nav.schemes')`).
- [x] Placeholder cards provided for Admin Console, Consent Audit Log, Listing Moderation, and Privacy Page.

