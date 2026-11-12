from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from backend.app.models.user import UserRole, Language


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=2, max_length=100)
    phone_number: Optional[str] = Field(default=None, max_length=20)
    role: UserRole = UserRole.FARMER
    preferred_language: Language = Language.EN


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    role: UserRole
    preferred_language: Language
    is_active: bool
    is_demo_account: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class DemoFarmSummary(BaseModel):
    id: int
    name: str
    area: float
    ownership_type: str
    owned_area: float
    leased_area: float
    lease_amount: float
    village: str
    district: str
    state: str
    latitude: float
    longitude: float

    model_config = ConfigDict(from_attributes=True)


class DemoLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    farm: Optional[DemoFarmSummary] = None
    active_crop: Optional[str] = None
    message: str = "Demo Mode session initialized successfully for Ramesh (Farmer)."
