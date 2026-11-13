"""
AgriSage AI — Advisory & Growth Stage Pydantic Schemas
Defines request and response schemas for:
- Growth Stage Phenology Calculation
- Stage-Specific Tasks & Agronomic Guidance
- Farm Health Score (0-100) with Component Breakdown
- 7-Day Actionable Plan with Sources and Explainability
"""
from datetime import date
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

from backend.app.schemas.envelope import ExplainabilitySchema


class PhenologicalStageInfo(BaseModel):
    stage_key: str
    stage_name_en: str
    stage_name_te: str
    stage_name_hi: str
    start_das: int
    end_das: int
    duration_days: int
    fao56_kc_stage: str
    is_current: bool = False
    progress_pct: float = Field(default=0.0, ge=0.0, le=100.0)


class GrowthStageResponse(BaseModel):
    crop_name: str
    planting_date: date
    days_after_sowing: int
    current_stage: str
    current_stage_te: str
    current_stage_hi: str
    fao56_kc_stage: str
    stage_progress_pct: float = Field(..., ge=0.0, le=100.0)
    cycle_progress_pct: float = Field(..., ge=0.0, le=100.0)
    estimated_days_to_next_stage: Optional[int] = None
    next_stage_name: Optional[str] = None
    total_crop_duration_days: int
    stages_timeline: List[PhenologicalStageInfo]
    stage_guidance: Dict[str, Any]
    source_notes: str = "Indicative mapping onto FAO-56 4-stage model; to verify"


class AgronomicTaskItem(BaseModel):
    id: str
    title: str
    category: Literal["irrigation", "fertilizer", "scouting", "spraying", "cultural"]
    description: str
    criticality: Literal["high", "medium", "low"]
    guidance_disclaimer: str = "general guidance, confirm with your local agriculture officer"
    dosages_included: bool = False


class StageTasksResponse(BaseModel):
    crop_name: str
    current_stage: str
    days_after_sowing: int
    tasks: List[AgronomicTaskItem]
    source_notes: str = "general guidance, confirm with your local agriculture officer; no quantities"


class HealthScoreComponent(BaseModel):
    name: str
    key: str
    score: Optional[int] = Field(None, ge=0, le=100, description="Component score 0-100")
    nominal_weight: float = Field(..., description="Design weight (indicative design choice, not validated)")
    normalized_weight: Optional[float] = Field(None, description="Re-normalized weight among active components")
    status: Literal["INCLUDED", "EXCLUDED"]
    exclusion_reason: Optional[str] = None
    inputs_used: Dict[str, Any] = Field(default_factory=dict)
    rationale: str
    threshold_notes: str = "indicative, not validated"


class FarmHealthScoreBreakdown(BaseModel):
    score: Optional[int] = Field(None, ge=0, le=100, description="Composite score or None if insufficient data")
    status: Literal["COMPUTED", "INSUFFICIENT_DATA"]
    active_components_count: int
    total_components_count: int = 5
    summary: str
    formula_description: str
    components: List[HealthScoreComponent]


class SevenDayPlanItem(BaseModel):
    day_number: int
    date_str: str
    action: str
    action_te: Optional[str] = None
    action_hi: Optional[str] = None
    reason: str
    reason_te: Optional[str] = None
    reason_hi: Optional[str] = None
    priority: Literal["high", "medium", "low"]
    responsible_agent: str
    source: str = Field(..., description="Exact agent output or weather forecast driver")
    translation_status: Literal["translated", "untranslated_marked"] = "translated"


class ConflictResolutionItem(BaseModel):
    agent_a: str
    agent_b: str
    issue: str
    resolution: str
    rationale: str
    rule_type: str = "rule_based"
    indicative: bool = True


class AdvisoryPlanRequest(BaseModel):
    farm_id: int
    crop_cycle_id: Optional[int] = None
    image_path: Optional[str] = None


class HeadlineYieldSummary(BaseModel):
    crop_name: str
    is_supported: bool
    headline_yield_quintals_per_acre: Optional[float] = None
    headline_label: str
    ml_range_lower: Optional[float] = None
    ml_range_upper: Optional[float] = None
    district_mean_baseline: Optional[float] = None
    unit: str = "quintals/acre"
    disclaimer: str


class AdvisoryPlanResponse(BaseModel):
    status: Literal["WORKING", "PARTIAL", "DEMO", "stub"] = "WORKING"
    message: str
    farm_id: int
    crop_name: Optional[str] = None
    growth_stage: Optional[GrowthStageResponse] = None
    headline_yield: HeadlineYieldSummary
    farm_health_score: FarmHealthScoreBreakdown
    seven_day_plan: List[SevenDayPlanItem]
    conflicts: List[ConflictResolutionItem] = Field(default_factory=list)
    risk_alerts: List[str] = Field(default_factory=list)
    explainable_cards: List[ExplainabilitySchema] = Field(default_factory=list)
    summary: str
    confidence: float = Field(default=0.85, ge=0.0, le=1.0)
