from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from backend.app.database.session import Base, utc_now
import enum


class OwnershipType(str, enum.Enum):
    OWNED = "owned"
    LEASED = "leased"
    MIXED = "mixed"


class IrrigationMethod(str, enum.Enum):
    FLOOD = "flood"
    FURROW = "furrow"
    SPRINKLER = "sprinkler"
    DRIP = "drip"


class CropStage(str, enum.Enum):
    GERMINATION = "germination"
    VEGETATIVE = "vegetative"
    FLOWERING = "flowering"
    FRUITING = "fruiting"
    MATURITY = "maturity"


class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    area = Column(Float, nullable=False)
    ownership_type = Column(SQLEnum(OwnershipType), default=OwnershipType.OWNED, nullable=False)
    owned_area = Column(Float, default=0.0, nullable=False)
    leased_area = Column(Float, default=0.0, nullable=False)
    lease_amount = Column(Float, default=0.0, nullable=False)
    soil_type = Column(String(50), nullable=True)
    water_source = Column(String(50), nullable=True)
    irrigation_method = Column(SQLEnum(IrrigationMethod), default=IrrigationMethod.FLOOD, nullable=False)
    budget = Column(Float, default=0.0, nullable=False)
    village = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    owner = relationship("User", back_populates="farms")
    crops_history = relationship("CropHistory", back_populates="farm", cascade="all, delete-orphan")
    current_crop_cycles = relationship("CurrentCropCycle", back_populates="farm", cascade="all, delete-orphan")


class CropHistory(Base):
    __tablename__ = "crops_history"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
    crop_name = Column(String(100), nullable=False)
    season = Column(String(50), nullable=False)  # Kharif, Rabi, Zaid
    year = Column(Integer, nullable=False)
    yield_obtained = Column(Float, nullable=True)
    profit_realized = Column(Float, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    farm = relationship("Farm", back_populates="crops_history")


class CurrentCropCycle(Base):
    __tablename__ = "current_crop_cycles"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
    crop_name = Column(String(100), nullable=False)
    variety = Column(String(100), nullable=True)
    planting_date = Column(Date, nullable=False)
    expected_harvest_date = Column(Date, nullable=True)
    current_stage = Column(SQLEnum(CropStage), default=CropStage.VEGETATIVE, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    farm = relationship("Farm", back_populates="current_crop_cycles")
