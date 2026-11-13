from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class LifecycleStageItem(BaseModel):
    stage_id: str
    stage_name_en: str
    stage_name_te: Optional[str] = None
    stage_name_hi: Optional[str] = None
    start_das: int
    end_das: int
    start_date: str
    end_date: str
    is_active: bool = False
    key_activities: List[str] = Field(default_factory=list)


class CalendarEventItem(BaseModel):
    event_id: str
    title: str
    title_te: Optional[str] = None
    title_hi: Optional[str] = None
    event_type: Literal["irrigation", "fertilizer", "scouting", "sowing", "harvest", "field_work"]
    start_date: str
    end_date: Optional[str] = None
    growth_stage: str
    priority: Literal["high", "medium", "low"]
    description: str
    notification_text: str


class SeasonalAwarenessResponse(BaseModel):
    current_season: Literal["Kharif", "Rabi", "Zaid"]
    season_name_te: str
    season_name_hi: str
    season_period: str
    current_month: str
    climate_expectations: Dict[str, str]
    typical_crops: List[str]
    primary_risks: List[str]
    general_guidance: str = "General agro-meteorological awareness; verify with local IMD Agromet advisory"
    status: Literal["WORKING", "PARTIAL", "DEMO"] = "WORKING"


class CropCalendarResponse(BaseModel):
    crop_name: str
    planting_date: str
    days_after_sowing: int
    current_stage: str
    total_duration_days: int
    lifecycle_stages: List[LifecycleStageItem]
    events: List[CalendarEventItem]
    status: Literal["WORKING", "PARTIAL", "DEMO"] = "WORKING"
