from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.envelope import AgentEnvelope, ExplainabilitySchema


class WeatherReport(BaseModel):
    temperature_c: float
    relative_humidity_pct: float
    expected_rainfall_today_mm: float
    rain_forecast_24h_mm: float
    rain_forecast_48h_mm: float
    reference_et0_mm: float
    wind_speed_kmh: float
    stale: bool = False
    source: str = "Open-Meteo Global Meteorological Forecast"
    fetched_at: str
    status: Literal["WORKING", "PARTIAL", "DEMO"] = "WORKING"


class IrrigationPlan(BaseModel):
    status: Literal["WORKING", "PARTIAL", "DEMO", "stub"] = "stub"
    message: str = "not implemented yet"
    # All numeric prediction fields must be None in stub
    irrigate: Optional[bool] = None
    water_depth_mm: Optional[float] = None
    litres_needed: Optional[float] = None
    litres_saved: Optional[float] = None
    recommendation_text: Optional[str] = None
    # Allowed rule-based check flags
    rain_skip_triggered: bool = False
    foliar_wetness_caution: bool = False
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class DiseaseFinding(BaseModel):
    status: Literal["WORKING", "PARTIAL", "DEMO", "stub"] = "stub"
    message: str = "not implemented yet"
    image_provided: bool = False
    # Prediction fields must be None in stub
    detected_disease: Optional[str] = None
    risk_level: Optional[str] = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    # Rule-based / heuristic check flag (e.g. humidity > 80%)
    fungal_risk_elevated: bool = False
    safe_ipm_steps: List[str] = Field(default_factory=list)


class YieldEstimate(BaseModel):
    status: Literal["WORKING", "PARTIAL", "DEMO", "stub"] = "stub"
    message: str = "not implemented yet"
    # All numeric prediction fields must be None in stub
    expected_yield_quintals_per_acre: Optional[float] = None
    yield_range_lower: Optional[float] = None
    yield_range_upper: Optional[float] = None
    adjustment_factors: List[str] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class AdvisoryPlan(BaseModel):
    status: Literal["WORKING", "PARTIAL", "DEMO", "stub"] = "stub"
    message: str = "not implemented yet"
    # Prediction fields must be None in stub
    farm_health_score: Optional[int] = None
    seven_day_plan: Optional[List[str]] = None
    summary: Optional[str] = None
    explainable_cards: List[ExplainabilitySchema] = Field(default_factory=list)
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)


class Conflict(BaseModel):
    agent_a: str
    agent_b: str
    issue: str
    resolution: str
    rationale: str
    rule_type: str = "rule_based"
    indicative: bool = True


class HandoffRecord(BaseModel):
    from_agent: str
    to_agent: str
    message: str
    timestamp: str


class OrchestratorRunResult(BaseModel):
    run_id: str
    farm_id: int
    status: str
    duration_ms: int
    handoffs: List[HandoffRecord]
    conflicts: List[Conflict]
    envelopes: Dict[str, AgentEnvelope]
    advisory_plan: AdvisoryPlan
    created_at: str


class AgentRunItem(BaseModel):
    id: int
    run_id: str
    farm_id: Optional[int] = None
    agent_name: Optional[str] = None
    trigger_type: str
    status: str
    duration_ms: int
    inputs: Dict[str, Any] = Field(default_factory=dict)
    outputs: Dict[str, Any] = Field(default_factory=dict)
    warnings: List[str] = Field(default_factory=list)
    created_at: datetime
