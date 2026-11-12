from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class CropCandidate(BaseModel):
    crop_name: str
    probability: float = Field(..., description="Model probability (uncalibrated)")
    reasons: List[str] = Field(default_factory=list)
    climate_suitable: bool = True
    suitability_note: Optional[str] = None


class CropRecommendationRequest(BaseModel):
    farm_id: Optional[int] = Field(None, description="Optional farm ID to auto-populate location and soil")
    n: Optional[float] = Field(None, ge=0.0, le=300.0, description="Nitrogen content in soil (kg/ha)")
    p: Optional[float] = Field(None, ge=0.0, le=300.0, description="Phosphorous content in soil (kg/ha)")
    k: Optional[float] = Field(None, ge=0.0, le=400.0, description="Potassium content in soil (kg/ha)")
    ph: Optional[float] = Field(None, ge=2.0, le=12.0, description="Soil pH level")
    temperature: Optional[float] = Field(None, ge=-10.0, le=60.0, description="Ambient temperature (°C)")
    humidity: Optional[float] = Field(None, ge=0.0, le=100.0, description="Relative humidity (%)")
    rainfall: Optional[float] = Field(None, ge=0.0, le=500.0, description="Precipitation (mm)")
    state: Optional[str] = Field("Telangana", description="State name for regional climate filtering")
    district: Optional[str] = Field("Warangal", description="District name")
    season: Optional[str] = Field("Kharif", description="Agricultural season (Kharif, Rabi, Summer)")


class CropRecommendationResponse(BaseModel):
    top_crops: List[CropCandidate]
    soil_values_missing: bool
    fallback_used: str
    confidence: float
    confidence_type: str = "model_metric"
    supported_crops: List[str]
    unsupported_common_crops: List[str]
    climate_warnings: List[str]
    explanation: Dict[str, Any]
    status: Literal["WORKING", "PARTIAL", "DEMO"] = "WORKING"
