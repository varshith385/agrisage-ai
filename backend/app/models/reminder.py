from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.session import Base, utc_now


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    due_at = Column(DateTime, nullable=False, index=True)
    repeat = Column(String(50), default="none", nullable=False)  # none, daily, weekly, custom_days
    status = Column(String(20), default="pending", nullable=False, index=True)  # pending, done, snoozed
    source = Column(String(50), default="user", nullable=False)  # user, system_advisory, weather_alert, irrigation_plan, calendar_stage
    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", foreign_keys=[user_id])
    farm = relationship("Farm", foreign_keys=[farm_id])
