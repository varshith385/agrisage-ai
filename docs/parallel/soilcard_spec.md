# Soil Health Card — API Specification (Module 20)
**Base Route**: `/api/v1/soil-card`  
**Tags**: `Soil Health Card`  
**Data Table**: `soil_health_cards`  

---

### Endpoint 1: Detected OCR Engines & PowerShell Instructions
`GET /api/v1/soil-card/engines`

**Response (200 OK)**:
```json
{
  "engine_detected": null,
  "available_engines": [],
  "install_instructions": {
    "easyocr": "py -3.12 -m pip install easyocr",
    "tesseract": "winget install UB-Mannheim.TesseractOCR; py -3.12 -m pip install pytesseract",
    "gemini_vision": "Add GEMINI_API_KEY=your_key_here to backend/.env"
  },
  "powershell_help": {
    "easyocr": "py -3.12 -m pip install easyocr",
    "tesseract": "winget install UB-Mannheim.TesseractOCR; py -3.12 -m pip install pytesseract",
    "gemini_vision": "Add GEMINI_API_KEY=your_key_here to backend/.env"
  },
  "status": "MANUAL_ENTRY_REQUIRED"
}
```

---

### Endpoint 2: Pluggable OCR Parameter Extraction
`POST /api/v1/soil-card/ocr`  
**Content-Type**: `multipart/form-data`  
**Parameters**:
- `file`: (Optional UploadFile) Image of Soil Health Card (JPEG, PNG, PDF)
- `raw_text`: (Optional str) Raw OCR text transcript
- `language`: (Optional str, default: `"en"`) Script language ("en", "te", "hi")

**Response (200 OK)**:
```json
{
  "engine_detected": null,
  "available_engines": [],
  "install_instructions": { ... },
  "nitrogen": {
    "value": 280.5,
    "confidence": 0.95,
    "unit": "kg/ha",
    "status": "HIGH",
    "raw_match": "Available Nitrogen (N): 280.5"
  },
  "phosphorus": {
    "value": 18.2,
    "confidence": 0.95,
    "unit": "kg/ha",
    "status": "HIGH",
    "raw_match": "Available Phosphorus (P): 18.2"
  },
  "potassium": {
    "value": 310.0,
    "confidence": 0.95,
    "unit": "kg/ha",
    "status": "HIGH",
    "raw_match": "Available Potassium (K): 310.0"
  },
  "ph": {
    "value": 7.2,
    "confidence": 0.95,
    "unit": "pH",
    "status": "HIGH",
    "raw_match": "Soil Reaction (pH): 7.2"
  },
  "organic_carbon": {
    "value": 0.54,
    "confidence": 0.95,
    "unit": "%",
    "status": "HIGH",
    "raw_match": "Organic Carbon (OC): 0.54"
  },
  "electrical_conductivity": {
    "value": 0.42,
    "confidence": 0.95,
    "unit": "dS/m",
    "status": "HIGH",
    "raw_match": "Electrical Conductivity (EC): 0.42"
  },
  "overall_confidence": 0.95,
  "preview_image_base64": null,
  "raw_text": "...",
  "language": "en",
  "status": "WORKING",
  "notes": [
    "Nothing is saved to your farm profile until you review and click Confirm. Never silently trust OCR."
  ]
}
```

---

### Endpoint 3: Farmer Value Confirmation Guard
`POST /api/v1/soil-card/confirm`  
**Security**: Bearer JWT token required  
**Request Body**:
```json
{
  "farm_id": 1,
  "nitrogen_kg_ha": 280.5,
  "phosphorus_kg_ha": 18.2,
  "potassium_kg_ha": 310.0,
  "ph": 7.2,
  "organic_carbon_pct": 0.54,
  "electrical_conductivity_ds_m": 0.42,
  "soil_texture": "Sandy Clay Loam",
  "store_image_opt_in": false,
  "extraction_method": "manual"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "message": "Soil Health Card values confirmed and linked to farm profile.",
  "card_id": 1,
  "farm_id": 1,
  "confirmed_values": {
    "nitrogen_kg_ha": 280.5,
    "phosphorus_kg_ha": 18.2,
    "potassium_kg_ha": 310.0,
    "ph": 7.2,
    "organic_carbon_pct": 0.54,
    "electrical_conductivity_ds_m": 0.42,
    "soil_texture": "Sandy Clay Loam",
    "image_stored": false
  },
  "created_at": "2026-11-13T06:00:00Z"
}
```

---

### Endpoint 4: Get Latest Confirmed Card for Farm
`GET /api/v1/soil-card/latest?farm_id=1`  
**Security**: Bearer JWT token required  

**Response (200 OK)**:
```json
{
  "has_card": true,
  "card": {
    "id": 1,
    "farm_id": 1,
    "nitrogen_kg_ha": 280.5,
    "phosphorus_kg_ha": 18.2,
    "potassium_kg_ha": 310.0,
    "ph": 7.2,
    "organic_carbon_pct": 0.54,
    "electrical_conductivity_ds_m": 0.42,
    "soil_texture": "Sandy Clay Loam",
    "extraction_method": "manual",
    "overall_confidence": 0.95,
    "image_stored": false,
    "created_at": "2026-11-13T06:00:00Z"
  }
}
```

---

### Endpoint 5: Soil Health Advisory Impact Analysis
`POST /api/v1/soil-card/impact`  
**Security**: Bearer JWT token required  
**Request Body**:
```json
{
  "farm_id": 1,
  "crop_name": "Rice"
}
```

**Response (200 OK)**:
```json
{
  "farm_id": 1,
  "crop_name": "Rice",
  "has_confirmed_soil_card": true,
  "soil_values": {
    "nitrogen_kg_ha": 280.5,
    "phosphorus_kg_ha": 18.2,
    "potassium_kg_ha": 310.0,
    "ph": 7.2,
    "organic_carbon_pct": 0.54,
    "electrical_conductivity_ds_m": 0.42
  },
  "without_soil_card": {
    "top_crops": [
      { "crop_name": "jute", "probability": 0.32 },
      { "crop_name": "rice", "probability": 0.28 }
    ],
    "confidence": 0.50,
    "fallback_used": "weather_only_model (soil N, P, K, pH not provided)",
    "expected_yield_q_acre": 12.8,
    "yield_range": [10.2, 15.4]
  },
  "with_soil_card": {
    "top_crops": [
      { "crop_name": "rice", "probability": 0.94 },
      { "crop_name": "blackgram", "probability": 0.04 }
    ],
    "confidence": 0.88,
    "fallback_used": "none_full_features",
    "expected_yield_q_acre": 13.82,
    "yield_range": [11.02, 16.63],
    "soil_fertility_adjustment_pct": 8.0
  },
  "impact_summary": [
    "Crop recommendation confidence increased from 50% (weather-only fallback) to 88% (full 7-feature N-P-K model).",
    "Top recommended crop shifted from 'Jute' to 'Rice' based on your soil's actual N=280.5 kg/ha, P=18.2 kg/ha, K=310.0 kg/ha test results.",
    "Yield expectation adjusted by +8.0% (+1.02 q/acre) based on measured pH 7.2 and fertility balance (indicative assumption, no source)."
  ],
  "disclaimer": "Indicative agronomic modeling. Verify soil health recommendations with your local KVK or Agriculture Officer."
}
```
