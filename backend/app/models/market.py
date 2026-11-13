from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database.session import Base, utc_now


class MandiPriceCache(Base):
    __tablename__ = "mandi_price_cache"

    id = Column(Integer, primary_key=True, index=True)
    mandi = Column(String(100), index=True, nullable=False)
    district = Column(String(50), index=True, nullable=False)
    state = Column(String(50), index=True, nullable=False)
    commodity = Column(String(100), index=True, nullable=False)
    variety = Column(String(100), nullable=True)
    arrival_date = Column(String(30), nullable=False)
    min_price = Column(Float, nullable=False)
    max_price = Column(Float, nullable=False)
    modal_price = Column(Float, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_demo = Column(Boolean, default=False, nullable=False)
    source = Column(String(255), nullable=False)
    last_verified = Column(String(30), nullable=True)
    fetched_at = Column(DateTime, default=utc_now, nullable=False)


class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_name = Column(String(100), index=True, nullable=False)
    variety = Column(String(100), nullable=True)
    quantity_quintals = Column(Float, nullable=False)
    expected_price_per_q = Column(Float, nullable=False)
    state = Column(String(50), nullable=False)
    district = Column(String(50), nullable=False)
    village = Column(String(100), nullable=False)
    harvest_date = Column(String(30), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(30), default="active", nullable=False)  # active, completed, cancelled
    is_verified_seller = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    farmer = relationship("User", foreign_keys=[farmer_id])
    inquiries = relationship("MarketplaceInquiry", back_populates="listing", cascade="all, delete-orphan")


class MarketplaceInquiry(Base):
    __tablename__ = "marketplace_inquiries"

    id = Column(Integer, primary_key=True, index=True)
    listing_id = Column(Integer, ForeignKey("marketplace_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    offered_price_per_q = Column(Float, nullable=False)
    quantity_quintals = Column(Float, nullable=False)
    message = Column(Text, nullable=True)
    status = Column(String(30), default="pending", nullable=False)  # pending, accepted, declined
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    listing = relationship("MarketplaceListing", back_populates="inquiries")
    buyer = relationship("User", foreign_keys=[buyer_id])


class FarmerRating(Base):
    __tablename__ = "farmer_ratings"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    listing_id = Column(Integer, ForeignKey("marketplace_listings.id", ondelete="SET NULL"), nullable=True)
    rating = Column(Integer, nullable=False)  # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

