from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database.session import Base, utc_now


class DiseasePrediction(Base):
    __tablename__ = "disease_predictions"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    image_path = Column(String(255), nullable=True)  # Privacy rule: image is discarded after inference
    crop_hint = Column(String(100), nullable=True)
    predicted_disease = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)  # Prediction confidence (uncalibrated)
    top3_json = Column(Text, nullable=False)
    village = Column(String(100), nullable=False, index=True)   # Village-level privacy only
    district = Column(String(100), nullable=False, index=True)
    state = Column(String(100), nullable=False, index=True)
    reported_to_outbreak = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    user = relationship("User")
    farm = relationship("Farm")
