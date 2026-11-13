from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class OutbreakClusterResponse(BaseModel):
    village: str
    district: str
    state: str
    latitude: float
    longitude: float
    predicted_disease: str
    raw_disease_key: str
    crop: str
    report_count: int
    avg_confidence: float
    severity: str
    last_reported_at: Optional[str]
    privacy_note: str


class OutbreakMapSummary(BaseModel):
    total_qualifying_clusters: int
    total_qualifying_reports: int
    total_opted_in_raw_reports: int
    suppressed_clusters_count: int
    unique_villages_displayed: int
    privacy_guard_enforced: bool
    headline: str


class OutbreakMapResponse(BaseModel):
    status: str
    district: str
    state: str
    time_window_days: int
    crop_filter: str
    min_reports_threshold: int
    clusters: List[OutbreakClusterResponse]
    summary: OutbreakMapSummary


class DistrictOfficerSummaryResponse(BaseModel):
    status: str
    district: str
    state: str
    time_window_days: int
    total_cases_in_district: int
    disease_breakdown: List[Dict[str, Any]]
    crop_breakdown: List[Dict[str, Any]]
    weekly_trends: List[Dict[str, Any]]
    hotspot_villages: List[Dict[str, Any]]
    officer_action_advisories: List[str]
    data_provenance: str

