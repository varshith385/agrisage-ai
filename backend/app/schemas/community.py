from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class GroupCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    description: Optional[str] = None
    village: str = Field(..., min_length=2, max_length=100)
    district: str = Field(..., min_length=2, max_length=100)
    state: str = Field(default="Telangana", min_length=2, max_length=100)
    crop_focus: Optional[str] = Field(default="Cotton", max_length=100)
    consent_share_contact: bool = Field(
        default=False,
        description="Explicit opt-in to share phone number with consented members of this group.",
    )


class GroupResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    village: str
    district: str
    state: str
    crop_focus: Optional[str]
    created_by_user_id: int
    member_count: int
    is_member: bool
    user_has_consented: bool
    created_at: datetime
    is_demo: bool

    class Config:
        from_attributes = True


class GroupMemberResponse(BaseModel):
    user_id: int
    alias_or_name: str
    village: str
    role: str
    consent_share_contact: bool
    consent_at: Optional[datetime] = None
    phone_number: Optional[str] = None  # None unless both caller and member consented or viewing self
    joined_at: datetime


class GroupJoinInput(BaseModel):
    consent_share_contact: bool = Field(
        default=False,
        description="Explicit opt-in to share phone number with fellow group members.",
    )


class ConsentUpdateInput(BaseModel):
    consent_share_contact: bool = Field(
        ...,
        description="True to grant revocable consent; False to revoke consent immediately.",
    )


class NearbyFarmerResponse(BaseModel):
    user_id: int
    alias_or_name: str
    village: str
    district: str
    crops_grown: List[str]
    has_shared_contact: bool
    phone_number: Optional[str] = None  # None by default unless reciprocal consent in group


class CommunityRequestCreate(BaseModel):
    group_id: Optional[int] = None
    request_type: str = Field(..., pattern="^(transport|input_purchase|pooled_sale)$")
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    target_date: Optional[datetime] = None
    village: str
    district: str
    state: str = "Telangana"

    # Transport-specific
    destination: Optional[str] = None
    total_capacity_quintals: Optional[float] = None
    base_truck_cost: Optional[float] = None
    rate_per_km: Optional[float] = None
    distance_km: Optional[float] = None

    # Input purchase
    item_name: Optional[str] = None
    target_quantity: Optional[float] = None
    unit: Optional[str] = "bags"
    bulk_price_per_unit: Optional[float] = None
    retail_price_per_unit: Optional[float] = None

    # Pooled sale
    crop_name: Optional[str] = None
    target_quantity_quintals: Optional[float] = None
    expected_price_per_quintal: Optional[float] = None

    # Creator's initial participation
    creator_quantity_or_weight: float = Field(..., gt=0)
    creator_distance_km: float = Field(default=0.0, ge=0)


class JoinRequestInput(BaseModel):
    quantity_or_weight: float = Field(..., gt=0)
    distance_km: float = Field(default=0.0, ge=0)
    notes: Optional[str] = None


class ParticipantResponse(BaseModel):
    id: int
    user_id: int
    alias_or_name: str
    village: str
    quantity_or_weight: float
    distance_km: float
    estimated_cost: Optional[float] = None
    savings_vs_solo: Optional[float] = None
    notes: Optional[str] = None
    created_at: datetime


class CommunityRequestResponse(BaseModel):
    id: int
    group_id: Optional[int]
    created_by_user_id: int
    creator_alias: str
    request_type: str
    title: str
    description: Optional[str]
    target_date: Optional[datetime]
    status: str
    village: str
    district: str
    state: str

    destination: Optional[str] = None
    total_capacity_quintals: Optional[float] = None
    current_weight_quintals: float = 0.0
    base_truck_cost: Optional[float] = None
    rate_per_km: Optional[float] = None
    distance_km: Optional[float] = None

    item_name: Optional[str] = None
    target_quantity: Optional[float] = None
    unit: Optional[str] = None
    bulk_price_per_unit: Optional[float] = None
    retail_price_per_unit: Optional[float] = None

    crop_name: Optional[str] = None
    target_quantity_quintals: Optional[float] = None
    expected_price_per_quintal: Optional[float] = None

    is_demo: bool
    created_at: datetime
    participants: List[ParticipantResponse]
    is_participant: bool
    cost_split_summary: Optional[Dict[str, Any]] = None

