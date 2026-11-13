from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class MachineryGuideStage(BaseModel):
    stage: str
    recommended_machinery: str
    category: str
    purpose: str
    operational_hours_per_acre: float
    cost_saving_tip: str
    source_note: str


class MachineryGuideResponse(BaseModel):
    crop: str
    stages: List[MachineryGuideStage]
    total_stages: int
    source_citation: str
    notes: List[str]
    supported_crops: Optional[List[str]] = None


class MachineryListingCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    category: str = Field(..., pattern="^(tractor|rotavator|harvester|sprayer|seed_drill|power_tiller|laser_leveler|other)$")
    hourly_rate: float = Field(..., gt=0)
    daily_rate: float = Field(..., gt=0)
    village: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    state: str = Field(default="Telangana", min_length=2, max_length=100)
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    contact_phone_opt_in: bool = Field(default=False)
    description: Optional[str] = None


class MachineryListingResponse(BaseModel):
    id: int
    owner_id: int
    owner_name_or_alias: str
    owner_phone: Optional[str] = None  # None unless owner_phone_opt_in is True
    name: str
    category: str
    hourly_rate: float
    daily_rate: float
    village: str
    district: str
    state: str
    latitude: float
    longitude: float
    distance_km: Optional[float] = None
    is_available: bool
    contact_phone_opt_in: bool
    description: Optional[str]
    is_demo: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MachineryBookingCreate(BaseModel):
    listing_id: int
    start_date: date
    end_date: date
    duration_hours: Optional[float] = Field(default=None, ge=0)
    rate_type: str = Field(default="daily", pattern="^(daily|hourly)$")
    crop_purpose: Optional[str] = Field(default=None, max_length=100)
    notes: Optional[str] = None


class MachineryBookingResponse(BaseModel):
    id: int
    listing_id: int
    listing_name: str
    owner_id: int
    renter_id: int
    renter_alias: str
    start_date: date
    end_date: date
    duration_hours: Optional[float]
    rate_type: str
    estimated_total: float
    crop_purpose: Optional[str]
    status: str
    notes: Optional[str]
    created_at: datetime
    booking_note: str

    class Config:
        from_attributes = True


class BookingStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(APPROVED|REJECTED|CANCELLED|COMPLETED)$")
