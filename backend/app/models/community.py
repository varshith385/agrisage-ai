from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from backend.app.database.session import Base, utc_now


class FarmerGroup(Base):
    __tablename__ = "farmer_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    village = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    crop_focus = Column(String(100), nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    creator = relationship("User", foreign_keys=[created_by_user_id])
    members = relationship(
        "GroupMember",
        back_populates="group",
        cascade="all, delete-orphan",
    )
    requests = relationship(
        "CommunityRequest",
        back_populates="group",
        cascade="all, delete-orphan",
    )


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("farmer_groups.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    consent_share_contact = Column(Boolean, default=False, nullable=False)
    consent_at = Column(DateTime, nullable=True)  # Timestamp when consent was explicitly given
    role = Column(String(50), default="member", nullable=False)  # "creator", "admin", "member"
    joined_at = Column(DateTime, default=utc_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("group_id", "user_id", name="uq_group_user"),
    )

    group = relationship("FarmerGroup", back_populates="members")
    user = relationship("User")


class CommunityRequest(Base):
    __tablename__ = "community_requests"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("farmer_groups.id"), nullable=True, index=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    request_type = Column(String(50), nullable=False)  # "transport", "input_purchase", "pooled_sale"
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    target_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="OPEN", nullable=False)  # "OPEN", "FULL", "COMPLETED", "CANCELLED"
    village = Column(String(100), nullable=False, index=True)
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)

    # Transport-specific parameters
    destination = Column(String(200), nullable=True)
    total_capacity_quintals = Column(Float, nullable=True)
    current_weight_quintals = Column(Float, default=0.0, nullable=False)
    base_truck_cost = Column(Float, nullable=True)
    rate_per_km = Column(Float, nullable=True)
    distance_km = Column(Float, nullable=True)

    # Input-purchase parameters
    item_name = Column(String(150), nullable=True)
    target_quantity = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)  # e.g., "bags", "kg", "quintals"
    bulk_price_per_unit = Column(Float, nullable=True)
    retail_price_per_unit = Column(Float, nullable=True)

    # Pooled-sale parameters
    crop_name = Column(String(100), nullable=True)
    target_quantity_quintals = Column(Float, nullable=True)
    expected_price_per_quintal = Column(Float, nullable=True)

    is_demo = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    creator = relationship("User", foreign_keys=[created_by_user_id])
    group = relationship("FarmerGroup", back_populates="requests")
    participants = relationship(
        "RequestParticipant",
        back_populates="request",
        cascade="all, delete-orphan",
    )


class RequestParticipant(Base):
    __tablename__ = "request_participants"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("community_requests.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    quantity_or_weight = Column(Float, nullable=False)
    distance_km = Column(Float, default=0.0, nullable=False)
    estimated_cost = Column(Float, nullable=True)
    savings_vs_solo = Column(Float, nullable=True)
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    request = relationship("CommunityRequest", back_populates="participants")
    user = relationship("User")

