from typing import List, Optional
from pydantic import BaseModel, Field


class FarmerContactDetails(BaseModel):
    full_name: str
    phone_number: Optional[str] = None
    email: Optional[str] = None


class ListingCreateRequest(BaseModel):
    crop_name: str
    variety: Optional[str] = None
    quantity_quintals: float = Field(..., gt=0)
    expected_price_per_q: float = Field(..., gt=0)
    state: str
    district: str
    village: str
    harvest_date: str
    description: Optional[str] = None


class ListingUpdateRequest(BaseModel):
    crop_name: Optional[str] = None
    variety: Optional[str] = None
    quantity_quintals: Optional[float] = Field(None, gt=0)
    expected_price_per_q: Optional[float] = Field(None, gt=0)
    village: Optional[str] = None
    harvest_date: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None  # active, completed, cancelled


class ListingResponse(BaseModel):
    id: int
    farmer_id: int
    farmer_name: str
    crop_name: str
    variety: Optional[str] = None
    quantity_quintals: float
    expected_price_per_q: float
    state: str
    district: str
    village: str
    harvest_date: str
    description: Optional[str] = None
    status: str
    is_verified_seller: bool
    is_owner: bool = False
    farmer_contact: Optional[FarmerContactDetails] = None
    contact_unlocked: bool = False
    inquiry_count: int = 0
    average_rating: Optional[float] = None
    created_at: str
    updated_at: str


class InquiryCreateRequest(BaseModel):
    listing_id: int
    offered_price_per_q: float = Field(..., gt=0)
    quantity_quintals: float = Field(..., gt=0)
    message: Optional[str] = None


class InquiryStatusUpdateRequest(BaseModel):
    status: str = Field(..., pattern="^(accepted|declined)$")


class InquiryResponse(BaseModel):
    id: int
    listing_id: int
    listing_crop: str
    listing_village: str
    buyer_id: int
    buyer_name: str
    buyer_phone: Optional[str] = None
    buyer_email: Optional[str] = None
    offered_price_per_q: float
    quantity_quintals: float
    message: Optional[str] = None
    status: str
    farmer_contact: Optional[FarmerContactDetails] = None
    contact_unlocked: bool = False
    created_at: str
    updated_at: str


class ReviewCreateRequest(BaseModel):
    farmer_id: int
    listing_id: Optional[int] = None
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    farmer_id: int
    buyer_id: int
    buyer_name: str
    listing_id: Optional[int] = None
    rating: int
    comment: Optional[str] = None
    created_at: str


class AdminVerificationRequest(BaseModel):
    verified: bool = True

