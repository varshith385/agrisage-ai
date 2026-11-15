from datetime import datetime, timedelta, timezone
from typing import Optional, List, Union
from pydantic import BaseModel, Field

KOLKATA_OFFSET = timedelta(hours=5, minutes=30)
KOLKATA_TZ = timezone(KOLKATA_OFFSET, name="Asia/Kolkata")


class ReminderBase(BaseModel):
    title: str = Field(..., max_length=255, description="Clear reminder task title")
    notes: Optional[str] = Field(None, description="Optional agronomic context or guidance")
    due_at: datetime = Field(..., description="Due timestamp (UTC or ISO 8601)")
    repeat: str = Field("none", description="none, daily, weekly, or custom_days")
    source: str = Field("user", description="user, system_advisory, weather_alert, irrigation_plan, calendar_stage")


class ReminderCreate(ReminderBase):
    farm_id: Optional[int] = Field(None, description="Target farm parcel ID if associated")


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    notes: Optional[str] = None
    due_at: Optional[datetime] = None
    repeat: Optional[str] = None
    status: Optional[str] = Field(None, description="pending, done, snoozed")
    snooze_days: Optional[int] = Field(None, description="Optional relative snooze increment in days (e.g. 1, 2, 3)")


class ReminderResponse(BaseModel):
    id: int
    user_id: int
    farm_id: Optional[int] = None
    title: str
    notes: Optional[str] = None
    due_at: datetime
    repeat: str
    status: str
    source: str
    created_at: datetime
    updated_at: datetime
    due_at_kolkata_iso: Optional[str] = None

    class Config:
        from_attributes = True


class ReminderSuggestion(BaseModel):
    id: str
    farm_id: Optional[int] = None
    title: str
    notes: Optional[str] = None
    due_at: datetime
    repeat: str = "none"
    source: str
    reason: str
    badge_label: str
    weather_fetched_at: Optional[Union[datetime, str]] = None
