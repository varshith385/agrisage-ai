from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class YieldAdjustmentFactor(BaseModel):
    factor_name: str
    adjustment_pct: float
    rationale: str
    citation: str = "indicative assumption, no source"


class YieldPredictionRequest(BaseModel):
    farm_id: Optional[int] = Field(None, description="Optional farm ID to auto-populate location and crop")
    crop_name: str = Field("Rice", description="Crop name (e.g. Rice, Wheat, Maize, Groundnut, Sugarcane, etc.)")
    state: Optional[str] = Field("Telangana", description="State name")
    district: Optional[str] = Field("Warangal", description="District name")
    season: Optional[str] = Field("Kharif", description="Season (Kharif, Rabi, Summer, Whole Year)")
    area_acres: Optional[float] = Field(1.0, ge=0.01, description="Cultivated land area in acres")
    fungal_disease_present: Optional[bool] = Field(False, description="Flag from disease agent")
    moisture_stress_present: Optional[bool] = Field(False, description="Flag from irrigation / weather agent")
    waterlogging_present: Optional[bool] = Field(False, description="Flag from irrigation agent")


class YieldPredictionResponse(BaseModel):
    crop_name: str
    state: str
    district: str
    season: str
    area_acres: float
    expected_yield_quintals_per_acre: Optional[float] = None
    yield_range_lower: Optional[float] = None
    yield_range_upper: Optional[float] = None
    expected_total_quintals: Optional[float] = None
    total_range_lower: Optional[float] = None
    total_range_upper: Optional[float] = None
    baseline_district_mean: Optional[float] = None
    model_beats_baseline: bool = False
    empirical_coverage_10_90: float = 0.7726
    training_period: str = "1997-2012"
    district_fallback_used: bool = False
    district_fallback_message: Optional[str] = None
    adjustment_factors: List[YieldAdjustmentFactor] = Field(default_factory=list)
    unsupported_crops: List[str] = Field(default_factory=list)
    explanation: Dict[str, Any]
    status: Literal["WORKING", "PARTIAL", "DEMO"] = "WORKING"
