"""
Grow2Gain — Crop Recommendation Pydantic Schemas (Round 7b)
Implements:
- CropCandidate (crop name, probability, reasons, climate suitability)
- InputFeatureDetail (value, unit, source, window_dates, training_range, in_training_range)
- CropRecommendationRequest (farm_id, soil parameters, weather parameters, location)
- CropRecommendationResponse (top_crops, decision_status, confidence_label, backward-compatible fields)
"""
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class CropCandidate(BaseModel):
    crop_name: str
    probability: float = Field(..., description="Model probability (uncalibrated model score)")
    reasons: List[str] = Field(default_factory=list)
    climate_suitable: bool = True
    suitability_note: Optional[str] = None


class InputFeatureDetail(BaseModel):
    value: Optional[float] = None
    unit: str
    source: str = "Not provided"
    window_dates: Optional[str] = None
    training_range: str
    in_training_range: bool = True


class CropRecommendationRequest(BaseModel):
    farm_id: Optional[int] = Field(None, description="Optional farm ID to auto-populate location and soil")
    n: Optional[float] = Field(None, description="Nitrogen content in soil (kg/ha)")
    p: Optional[float] = Field(None, description="Phosphorous content in soil (kg/ha)")
    k: Optional[float] = Field(None, description="Potassium content in soil (kg/ha)")
    ph: Optional[float] = Field(None, description="Soil pH level")
    temperature: Optional[float] = Field(None, description="Ambient temperature (°C)")
    humidity: Optional[float] = Field(None, description="Relative humidity (%)")
    rainfall: Optional[float] = Field(None, description="Precipitation (mm)")
    latitude: Optional[float] = Field(None, description="Farm latitude")
    longitude: Optional[float] = Field(None, description="Farm longitude")
    state: Optional[str] = Field("Telangana", description="State name for regional climate filtering")
    district: Optional[str] = Field("Warangal", description="District name")
    season: Optional[str] = Field("Kharif", description="Agricultural season (Kharif, Rabi, Summer)")
    soil_source: Optional[str] = Field(None, description="Source of soil values")
    weather_source: Optional[str] = Field(None, description="Source of weather values")
    window_dates: Optional[str] = Field(None, description="Weather aggregation window dates")


class CropRecommendationResponse(BaseModel):
    top_crops: List[CropCandidate]
    soil_values_missing: bool
    fallback_used: str
    confidence: float
    confidence_type: str = "model_metric"
    supported_crops: List[str]
    unsupported_common_crops: List[str]
    climate_warnings: List[str]
    is_out_of_distribution: bool = False
    ood_warning: Optional[str] = None
    explanation: Dict[str, Any]
    status: Literal["WORKING", "PARTIAL", "DEMO", "CONFIDENT", "LOW_CONFIDENCE", "UNUSUAL", "INVALID"] = "WORKING"
    # Round 7b extensions (strictly backward-compatible):
    decision_status: Literal["CONFIDENT", "LOW_CONFIDENCE", "UNUSUAL", "INVALID"] = "CONFIDENT"
    decision_reasons: List[str] = Field(default_factory=list)
    confidence_label: Literal["High", "Medium", "Low", "None"] = "Medium"
    model_name: str = "GaussianNB"
    model_probability: float = 0.0
    input_sources: Dict[str, InputFeatureDetail] = Field(default_factory=dict)
