"""
Disease Outbreak Map API Endpoints: Village Clusters & District Officer Summary
Yuktik 2026 Hackathon | AgriSage AI Outbreak Module
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.security.auth import get_current_user
from backend.app.models.user import User, UserRole
from backend.app.schemas.outbreak import OutbreakMapResponse, DistrictOfficerSummaryResponse
from backend.app.services.outbreak_service import (
    get_outbreak_map_data,
    get_district_officer_summary,
)

router = APIRouter(prefix="/outbreaks", tags=["Disease Outbreak Telemetry"])


@router.get("/map", response_model=OutbreakMapResponse)
def get_outbreak_map(
    district: Optional[str] = Query(default="Warangal", description="District filter"),
    state: Optional[str] = Query(default="Telangana", description="State filter"),
    days: int = Query(default=14, ge=1, le=180, description="Time window in days"),
    crop: Optional[str] = Query(default=None, description="Crop filter (e.g. Tomato, Cotton)"),
    min_threshold: int = Query(default=3, ge=1, le=20, description="Privacy threshold (min reports per cluster)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns anonymized village-level disease clusters meeting the minimum reports threshold.
    Protects farmer privacy: individual coordinates and reports below threshold are suppressed.
    """
    data = get_outbreak_map_data(
        db=db,
        district=district,
        state=state,
        days=days,
        crop=crop,
        min_threshold=min_threshold,
    )
    return OutbreakMapResponse(**data)


@router.get("/district-summary", response_model=DistrictOfficerSummaryResponse)
def get_district_officer_dashboard(
    district: str = Query(default="Warangal", description="Target district"),
    state: str = Query(default="Telangana", description="Target state"),
    days: int = Query(default=30, ge=7, le=180, description="Aggregation window"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    District-level officer view for agricultural extension officers, agronomists, and administrators.
    Guarded strictly for Expert and Admin roles.
    """
    if current_user.role not in [UserRole.EXPERT, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The district officer analytics dashboard is restricted to Expert and Admin roles.",
        )

    data = get_district_officer_summary(
        db=db,
        district=district,
        state=state,
        days=days,
    )
    return DistrictOfficerSummaryResponse(**data)

