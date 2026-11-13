from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from backend.app.models.user import User
from backend.app.schemas.calendar import CropCalendarResponse, SeasonalAwarenessResponse
from backend.app.security.auth import get_current_user
from backend.app.services.calendar_service import (
    generate_crop_calendar,
    generate_rfc5545_ics,
    get_seasonal_awareness,
)

router = APIRouter(prefix="/calendar", tags=["Lifecycle & Calendar"])


@router.get("/events", response_model=CropCalendarResponse)
def get_crop_lifecycle_and_events(
    crop_name: str = Query("Cotton", description="Cultivated crop name"),
    planting_date: Optional[str] = Query(None, description="Planting date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
):
    """
    Generates dated lifecycle stages and operational crop calendar events
    tied directly to the planting date and phenological growth stage.
    """
    pdate = None
    if planting_date:
        try:
            pdate = datetime.strptime(planting_date, "%Y-%m-%d").date()
        except Exception:
            pdate = date(2026, 8, 15)
    return generate_crop_calendar(crop_name=crop_name, planting_date=pdate)


@router.get("/export.ics")
def export_crop_calendar_ics(
    crop_name: str = Query("Cotton", description="Cultivated crop name"),
    planting_date: Optional[str] = Query(None, description="Planting date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
):
    """
    Exports the crop calendar as a strictly valid RFC 5545 iCalendar (.ics) stream
    for import into Google Calendar, Apple Calendar, or Outlook.
    """
    pdate = None
    if planting_date:
        try:
            pdate = datetime.strptime(planting_date, "%Y-%m-%d").date()
        except Exception:
            pdate = date(2026, 8, 15)
    ics_text = generate_rfc5545_ics(crop_name=crop_name, planting_date=pdate)
    filename = f"{crop_name.lower().replace(' ', '_')}_calendar.ics"
    return Response(
        content=ics_text,
        media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/season", response_model=SeasonalAwarenessResponse)
def get_current_season_awareness(
    month: Optional[int] = Query(None, ge=1, le=12, description="Target calendar month (1-12)"),
    lat: float = Query(17.9689, description="Farm centroid latitude"),
    lon: float = Query(79.5941, description="Farm centroid longitude"),
    current_user: User = Depends(get_current_user),
):
    """
    Returns Kharif, Rabi, or Zaid seasonal climatic expectations, typical crops,
    and primary regional agronomic risks.
    """
    return get_seasonal_awareness(month=month, lat=lat, lon=lon)
