from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, Field, model_validator, ConfigDict
from backend.app.models.farm import OwnershipType, IrrigationMethod, CropStage


class FarmBase(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    area: float = Field(gt=0, description="Total farm area in acres")
    ownership_type: OwnershipType = OwnershipType.OWNED
    owned_area: float = Field(default=0.0, ge=0)
    leased_area: float = Field(default=0.0, ge=0)
    lease_amount: float = Field(default=0.0, ge=0, description="Annual lease cost in INR")
    soil_type: Optional[str] = Field(default="Red Loam", max_length=50)
    water_source: Optional[str] = Field(default="Borewell", max_length=50)
    irrigation_method: IrrigationMethod = IrrigationMethod.FLOOD
    budget: float = Field(default=0.0, ge=0)
    village: str = Field(min_length=2, max_length=100)
    district: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)

    @model_validator(mode="after")
    def validate_ownership_areas(self) -> "FarmBase":
        if self.ownership_type == OwnershipType.MIXED:
            expected_sum = self.owned_area + self.leased_area
            if abs(expected_sum - self.area) > 0.01:
                raise ValueError(
                    f"For mixed ownership, owned_area ({self.owned_area}) + "
                    f"leased_area ({self.leased_area}) must equal total area ({self.area})."
                )
            if self.lease_amount < 0:
                raise ValueError("Lease amount cannot be negative.")
        elif self.ownership_type == OwnershipType.OWNED:
            if self.owned_area == 0.0:
                self.owned_area = self.area
            self.leased_area = 0.0
            self.lease_amount = 0.0
        elif self.ownership_type == OwnershipType.LEASED:
            if self.leased_area == 0.0:
                self.leased_area = self.area
            self.owned_area = 0.0
            if self.lease_amount < 0:
                raise ValueError("Lease amount cannot be negative.")
        return self


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    name: Optional[str] = None
    area: Optional[float] = Field(default=None, gt=0)
    ownership_type: Optional[OwnershipType] = None
    owned_area: Optional[float] = Field(default=None, ge=0)
    leased_area: Optional[float] = Field(default=None, ge=0)
    lease_amount: Optional[float] = Field(default=None, ge=0)
    soil_type: Optional[str] = None
    water_source: Optional[str] = None
    irrigation_method: Optional[IrrigationMethod] = None
    budget: Optional[float] = Field(default=None, ge=0)
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)


class CropHistoryResponse(BaseModel):
    id: int
    crop_name: str
    season: str
    year: int
    yield_obtained: Optional[float] = None
    profit_realized: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CropCycleResponse(BaseModel):
    id: int
    crop_name: str
    variety: Optional[str] = None
    planting_date: date
    expected_harvest_date: Optional[date] = None
    current_stage: CropStage
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FarmResponse(FarmBase):
    id: int
    user_id: int
    created_at: datetime
    crops_history: List[CropHistoryResponse] = []
    current_crop_cycles: List[CropCycleResponse] = []

    model_config = ConfigDict(from_attributes=True)
