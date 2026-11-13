from datetime import datetime, date
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base, utc_now


class MachineryCatalog(Base):
    __tablename__ = "machinery_catalog"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)  # "tractor", "rotavator", "harvester", "sprayer", "seed_drill", "power_tiller", "laser_leveler"
    hp_power = Column(String(50), nullable=True)
    typical_hourly_rate = Column(Float, nullable=True)
    typical_daily_rate = Column(Float, nullable=True)
    source_note = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)


class MachineryListing(Base):
    __tablename__ = "machinery_listings"

    id = Column(Integer, primary_key=True, index=True)
    machinery_id = Column(Integer, ForeignKey("machinery_catalog.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(50), nullable=False)
    hourly_rate = Column(Float, nullable=False)
    daily_rate = Column(Float, nullable=False)
    village = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    contact_phone_opt_in = Column(Boolean, default=False, nullable=False)  # Owner consent to display phone
    description = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    owner = relationship("User", foreign_keys=[owner_id])
    catalog_item = relationship("MachineryCatalog", foreign_keys=[machinery_id])
    bookings = relationship(
        "MachineryBooking",
        back_populates="listing",
        cascade="all, delete-orphan",
    )


class MachineryBooking(Base):
    __tablename__ = "machinery_bookings"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("machinery_listings.id"), nullable=False, index=True)
    renter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    duration_hours = Column(Float, nullable=True)
    rate_type = Column(String(20), default="daily", nullable=False)  # "hourly" | "daily"
    estimated_total = Column(Float, nullable=False)
    crop_purpose = Column(String(100), nullable=True)
    status = Column(String(50), default="PENDING", nullable=False)  # "PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    listing = relationship("MachineryListing", back_populates="bookings")
    renter = relationship("User", foreign_keys=[renter_id])

