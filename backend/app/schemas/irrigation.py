from datetime import date
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class IrrigationPlanRequest(BaseModel):
    farm_id: Optional[int] = Field(None, description="Optional registered farm ID to auto-populate location, soil, and active crop.")
    crop_name: Optional[str] = Field("Cotton", description="Crop name (e.g. Cotton, Rice, Wheat, Maize, Chilli, Tomato, etc.)")
    planting_date: Optional[date] = Field(None, description="Sowing date to determine DAS and FAO-56 phenological growth stage.")
    soil_type: Optional[str] = Field("Black Cotton", description="Soil type classification (e.g. Sandy, Loam, Black Cotton, Red Loam, etc.)")
    irrigation_method: Optional[str] = Field("drip", description="Irrigation method: flood, furrow, sprinkler, drip.")
    area_acres: Optional[float] = Field(1.0, ge=0.01, description="Farm holding area in acres.")
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    reference_et0_mm: Optional[float] = Field(None, ge=0.0, description="Override reference ET0 in mm/day.")
    rain_forecast_24h_mm: Optional[float] = Field(None, ge=0.0, description="Forecasted 24h rain in mm.")
    rain_forecast_48h_mm: Optional[float] = Field(None, ge=0.0, description="Forecasted 48h rain in mm.")
    current_depletion_mm: Optional[float] = Field(None, ge=0.0, description="Current soil moisture depletion in mm.")


class DailyBalanceItem(BaseModel):
    date: str
    day_index: int
    kc: float
    et0_mm: float
    etc_mm: float
    rain_mm: float
    effective_rain_mm: float
    root_zone_depletion_mm: float
    taw_mm: float
    raw_mm: float
    moisture_stress_risk: bool
    rain_skip_potential: bool


class IrrigationPlanResponse(BaseModel):
    crop_name: str
    growth_stage: str
    days_after_sowing: int
    kc: float
    reference_et0_mm: float
    etc_today_mm: float
    effective_rain_today_mm: float
    should_irrigate: bool
    net_depth_mm: float
    gross_depth_mm: float
    litres_needed: float
    litres_saved: float
    rain_skip_triggered: bool
    next_irrigation_date: str
    irrigation_method: str
    method_efficiency: float
    soil_type: str
    awc_mm_per_m: float
    taw_mm: float
    raw_mm: float
    depletion_today_mm: float
    daily_forecast_balance: List[DailyBalanceItem]
    recommendation_text: str
    explanation: Dict[str, Any]
    status: Literal["WORKING", "PARTIAL", "DEMO", "stub"] = "WORKING"


class IrrigationDiagnosisResponse(BaseModel):
    category: str
    title: str
    severity: str
    confidence: float
    description: str
    suggestions: List[str]
    visual_cues: Optional[Dict[str, Any]] = None
    finger_test_guide: Dict[str, Any]
    status: Literal["WORKING", "PARTIAL", "DEMO"] = "PARTIAL"
