# Soil Health Card — Feature Status
**Branch**: `feat/soilcard`  
**Date**: 2026-11-13  

| Module / Component | Status | Notes |
| :--- | :--- | :--- |
| **Pluggable OCR Engine Detection** | `WORKING` | Detects EasyOCR, Tesseract, and Gemini Vision. PowerShell installation guide displayed when uninstalled. |
| **PowerShell Setup Guidance** | `WORKING` | In-app drawer provides exact commands for Windows PowerShell: `winget install UB-Mannheim.TesseractOCR; py -3.12 -m pip install pytesseract`. |
| **Multi-Language Card Extraction** | `WORKING` (EN), `PARTIAL` (TE, HI) | High-accuracy regex/fuzzy parsing across English, Telugu, and Hindi formats. Indic scripts flagged as partial for human review. |
| **Plausibility Bounds Validation** | `WORKING` | Evaluates typical agronomic ranges (N: 10-1500, P: 1-300, K: 10-1500, pH: 3.5-11, OC: 0.01-5%, EC: 0.01-10 dS/m). Out-of-bounds metrics marked LOW confidence. |
| **Confirmation Screen Guard** | `WORKING` | Strictly non-persistent OCR. Values require explicit user review and confirmation before committing to `soil_health_cards` table. |
| **Image Privacy Protection** | `WORKING` | Zero retention default. Uploaded card images are processed in-memory and discarded unless the user explicitly checks `store_image_opt_in=True`. |
| **Crop Recommender Impact** | `WORKING` | Activates full 7-feature N-P-K model (~88-99% confidence) replacing weather-only fallback (~50% confidence). |
| **Yield Regressor Impact** | `WORKING` | Computes soil fertility adjustment factor (+/- %) based on soil pH and organic carbon with transparent rationale. |
| **Frontend Schemes Page** | `WORKING` | Interactive UI at `/schemes#soil-card-upload` with quick demo presets, confirmation meters, Before vs After cards, and admin placeholders. |
| **Unit Test Suite** | `PASS` | 15 / 15 unit tests pass in `backend/tests/test_soil_card.py`. Full suite: 130 / 130 tests pass. |
