"""
AgriSage AI — Soil Health Card Schemas
Module 20: /api/v1/soil-card
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SoilCardFieldConfidence(BaseModel):
    value: Optional[float] = Field(None, description="Extracted numerical metric")
    confidence: float = Field(0.0, ge=0.0, le=1.0, description="Calibrated confidence (0.0 to 1.0)")
    unit: str = Field(..., description="Measurement unit (e.g. kg/ha, %, dS/m, pH)")
    status: str = Field("UNAVAILABLE", description="Field match quality: HIGH, MEDIUM, LOW, UNAVAILABLE")
    raw_match: Optional[str] = Field(None, description="Raw label snippet extracted from OCR")


class SoilCardExtractionResponse(BaseModel):
    engine_detected: Optional[str] = Field(None, description="Active OCR engine (easyocr, tesseract, gemini_vision, or None)")
    available_engines: List[str] = Field(default_factory=list, description="Engines currently ready in this environment")
    install_instructions: Dict[str, str] = Field(default_factory=dict, description="PowerShell installation commands for missing engines")
    nitrogen: SoilCardFieldConfidence
    phosphorus: SoilCardFieldConfidence
    potassium: SoilCardFieldConfidence
    ph: SoilCardFieldConfidence
    organic_carbon: SoilCardFieldConfidence
    electrical_conductivity: SoilCardFieldConfidence
    overall_confidence: float = Field(0.0, ge=0.0, le=1.0)
    preview_image_base64: Optional[str] = Field(None, description="Base64 encoded thumbnail preview for verification UI")
    raw_text: Optional[str] = Field(None, description="Complete OCR transcript text")
    language: str = Field("en", description="Card language detected or requested")
    status: str = Field("WORKING", description="WORKING, PARTIAL (indic languages), or MANUAL_ONLY")
    notes: List[str] = Field(default_factory=list)


class SoilCardConfirmRequest(BaseModel):
    farm_id: int = Field(..., description="Target farm holding ID")
    nitrogen_kg_ha: Optional[float] = Field(None, ge=0.0, le=2000.0, description="Available N in kg/ha")
    phosphorus_kg_ha: Optional[float] = Field(None, ge=0.0, le=1000.0, description="Available P in kg/ha")
    potassium_kg_ha: Optional[float] = Field(None, ge=0.0, le=2000.0, description="Available K in kg/ha")
    ph: Optional[float] = Field(None, ge=1.0, le=14.0, description="Soil pH reaction")
    organic_carbon_pct: Optional[float] = Field(None, ge=0.0, le=10.0, description="Organic Carbon in %")
    electrical_conductivity_ds_m: Optional[float] = Field(None, ge=0.0, le=20.0, description="EC in dS/m")
    soil_texture: Optional[str] = Field(None, description="Confirmed soil texture (e.g. Sandy Loam, Clay)")
    store_image_opt_in: bool = Field(False, description="Explicit privacy consent to store card image on server")
    image_base64: Optional[str] = Field(None, description="Image payload if user opted in to storage")
    extraction_method: str = Field("manual", description="Method used: manual, easyocr, tesseract, gemini_vision")
    field_confidences: Optional[Dict[str, float]] = Field(default_factory=dict)


class SoilCardConfirmResponse(BaseModel):
    success: bool
    message: str
    card_id: int
    farm_id: int
    confirmed_values: Dict[str, Any]
    created_at: str


class SoilImpactAnalysisRequest(BaseModel):
    farm_id: int
    crop_name: Optional[str] = "Rice"


class SoilImpactAnalysisResponse(BaseModel):
    farm_id: int
    crop_name: str
    has_confirmed_soil_card: bool
    soil_values: Optional[Dict[str, Any]] = None
    without_soil_card: Dict[str, Any]
    with_soil_card: Dict[str, Any]
    impact_summary: List[str]
    disclaimer: str = "Indicative agronomic modeling. Verify soil health recommendations with your local KVK or Agriculture Officer."
