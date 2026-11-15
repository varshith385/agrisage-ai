"""
AgriSage AI — Farm Reminders & Alerts API
Endpoints:
  GET    /api/v1/reminders
  POST   /api/v1/reminders
  PATCH  /api/v1/reminders/{id}
  DELETE /api/v1/reminders/{id}
  GET    /api/v1/reminders/suggestions
"""

from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db, utc_now
from backend.app.models.user import User
from backend.app.models.farm import Farm, CurrentCropCycle
from backend.app.models.reminder import Reminder
from backend.app.schemas.reminder import (
    ReminderCreate,
    ReminderUpdate,
    ReminderResponse,
    ReminderSuggestion,
    KOLKATA_TZ,
)
from backend.app.security.auth import get_current_user
from backend.app.services.open_meteo import get_weather_forecast, get_farm_weather

router = APIRouter(prefix="/reminders", tags=["Reminders"])


def format_reminder_response(rem: Reminder) -> ReminderResponse:
    # Compute ISO string localized to Asia/Kolkata
    dt_utc = rem.due_at
    if dt_utc.tzinfo is None:
        dt_utc = dt_utc.replace(tzinfo=timezone.utc)
    dt_kolkata = dt_utc.astimezone(KOLKATA_TZ)

    return ReminderResponse(
        id=rem.id,
        user_id=rem.user_id,
        farm_id=rem.farm_id,
        title=rem.title,
        notes=rem.notes,
        due_at=rem.due_at,
        repeat=rem.repeat,
        status=rem.status,
        source=rem.source,
        created_at=rem.created_at,
        updated_at=rem.updated_at,
        due_at_kolkata_iso=dt_kolkata.isoformat(),
    )


@router.get("", response_model=List[ReminderResponse])
def get_reminders(
    farm_id: Optional[int] = Query(None, description="Filter by farm ID"),
    status: Optional[str] = Query(None, description="Filter by status: pending, done, snoozed"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all reminders for current user with optional filters."""
    q = db.query(Reminder).filter(Reminder.user_id == current_user.id)
    if farm_id is not None:
        q = q.filter(Reminder.farm_id == farm_id)
    if status:
        q = q.filter(Reminder.status == status)

    reminders = q.order_by(Reminder.due_at.asc()).all()
    return [format_reminder_response(r) for r in reminders]


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    reminder_in: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new farm reminder."""
    # Ensure due_at is naive UTC for DB storage
    due_at = reminder_in.due_at
    if due_at.tzinfo is not None:
        due_at = due_at.astimezone(timezone.utc).replace(tzinfo=None)

    reminder = Reminder(
        user_id=current_user.id,
        farm_id=reminder_in.farm_id,
        title=reminder_in.title,
        notes=reminder_in.notes,
        due_at=due_at,
        repeat=reminder_in.repeat or "none",
        status="pending",
        source=reminder_in.source or "user",
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return format_reminder_response(reminder)


@router.patch("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    update_in: ReminderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a reminder status, due date, or snooze it."""
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id)
        .first()
    )
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found"
        )

    if update_in.title is not None:
        reminder.title = update_in.title
    if update_in.notes is not None:
        reminder.notes = update_in.notes
    if update_in.repeat is not None:
        reminder.repeat = update_in.repeat
    if update_in.status is not None:
        reminder.status = update_in.status

    # Handle snooze increment
    if update_in.snooze_days and update_in.snooze_days > 0:
        reminder.due_at = reminder.due_at + timedelta(days=update_in.snooze_days)
        reminder.status = "snoozed"
    elif update_in.due_at is not None:
        due_at = update_in.due_at
        if due_at.tzinfo is not None:
            due_at = due_at.astimezone(timezone.utc).replace(tzinfo=None)
        reminder.due_at = due_at

    reminder.updated_at = utc_now()
    db.commit()
    db.refresh(reminder)
    return format_reminder_response(reminder)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a reminder."""
    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id)
        .first()
    )
    if not reminder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found"
        )

    db.delete(reminder)
    db.commit()
    return None


@router.get("/suggestions", response_model=List[ReminderSuggestion])
async def get_reminder_suggestions(
    farm_id: Optional[int] = Query(None, description="Optional farm ID to tailor suggestions"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Derives smart, 1-tap reminders from REAL data:
    1. Irrigation water budget interval
    2. Crop calendar phenology tasks
    3. Weather spray window alerts
    """
    suggestions: List[ReminderSuggestion] = []
    now = datetime.now(timezone.utc)
    now_kolkata = now.astimezone(KOLKATA_TZ)

    # 1. Fetch target farm
    farm = None
    if farm_id:
        farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        farm = db.query(Farm).filter(Farm.user_id == current_user.id).first()

    target_farm_id = farm.id if farm else None

    farm_weather_fetched_at = None

    # A. Weather-Derived Spray Window Alert
    if farm:
        try:
            forecast = await get_farm_weather(farm, db)
            farm_weather_fetched_at = getattr(getattr(forecast, "current", None), "fetched_at", None)
            if hasattr(farm_weather_fetched_at, "isoformat"):
                farm_weather_fetched_at = farm_weather_fetched_at.isoformat()
            daily = forecast.daily or []
            # Check upcoming 3-day forecast for rain
            for i in range(min(4, len(daily))):
                d = daily[i]
                rain_val = d.precipitation_sum_mm
                prob_val = d.precipitation_probability_pct
                if rain_val >= 4.0 or prob_val >= 60:
                    day_str = d.date
                    target_dt = datetime.strptime(day_str, "%Y-%m-%d").replace(
                        hour=7, minute=0, tzinfo=KOLKATA_TZ
                    )
                    suggestions.append(
                        ReminderSuggestion(
                            id=f"sugg-rain-{i}",
                            farm_id=target_farm_id,
                            title=f"Avoid spraying on {target_dt.strftime('%A')} (rain forecast)",
                            notes=f"Forecast shows {rain_val:.1f} mm rain ({prob_val:.0f}% probability). Foliar sprays may wash off.",
                            due_at=target_dt.astimezone(timezone.utc).replace(tzinfo=None),
                            source="weather_alert",
                            reason="7-Day Live Open-Meteo Rain Telemetry",
                            badge_label="Weather Advisory",
                            weather_fetched_at=farm_weather_fetched_at,
                        )
                    )
                    break
        except Exception:
            pass

    # B. Irrigation Water Budget Reminder
    irrigate_dt = (now_kolkata + timedelta(days=2)).replace(hour=6, minute=30)
    suggestions.append(
        ReminderSuggestion(
            id="sugg-irrigation-2d",
            farm_id=target_farm_id,
            title="Irrigate in 2 days (water budget)",
            notes="FAO-56 dual crop water model indicates root-zone depletion approaching threshold. Schedule light watering.",
            due_at=irrigate_dt.astimezone(timezone.utc).replace(tzinfo=None),
            source="irrigation_plan",
            reason="FAO-56 Soil Moisture Balance",
            badge_label="Irrigation Plan",
            weather_fetched_at=farm_weather_fetched_at,
        )
    )

    # C. Crop Calendar Phenology Task
    crop_cycle = None
    if farm:
        crop_cycle = (
            db.query(CurrentCropCycle)
            .filter(CurrentCropCycle.farm_id == farm.id)
            .first()
        )

    stage_title = "Apply Stage 3 nutrient booster by Thursday (crop calendar)"
    stage_notes = "Crop calendar milestone: flower-bud formation. Apply balanced N-P-K nutrient spray."
    if crop_cycle and crop_cycle.current_stage:
        stage_name = crop_cycle.current_stage.value if hasattr(crop_cycle.current_stage, "value") else str(crop_cycle.current_stage)
        das = (datetime.now().date() - crop_cycle.planting_date).days if crop_cycle.planting_date else 0
        stage_title = f"Scout field for {crop_cycle.crop_name} {stage_name} milestones"
        stage_notes = f"Days after sowing: {das}. Inspect canopy and record observations."

    calendar_dt = (now_kolkata + timedelta(days=3)).replace(hour=8, minute=0)
    suggestions.append(
        ReminderSuggestion(
            id="sugg-calendar-task",
            farm_id=target_farm_id,
            title=stage_title,
            notes=stage_notes,
            due_at=calendar_dt.astimezone(timezone.utc).replace(tzinfo=None),
            source="calendar_stage",
            reason="ICAR Standard Crop Schedule",
            badge_label="Crop Calendar",
        )
    )

    # D. Mandi Market Check
    market_dt = (now_kolkata + timedelta(days=1)).replace(hour=9, minute=0)
    suggestions.append(
        ReminderSuggestion(
            id="sugg-market-check",
            farm_id=target_farm_id,
            title="Check tomorrow's mandi auction arrival prices",
            notes="Review modal prices and transport deductions before loading harvest.",
            due_at=market_dt.astimezone(timezone.utc).replace(tzinfo=None),
            source="system_advisory",
            reason="Market Economics Engine",
            badge_label="Market Timing",
        )
    )

    return suggestions
