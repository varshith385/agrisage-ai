"""
AgriSage AI — Soil Health Card Model
Module 20: /api/v1/soil-card
"""

from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database.session import Base, utc_now


class SoilHealthCard(Base):
    __tablename__ = "soil_health_cards"

    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=False, index=True)
    
    # Soil macronutrients & chemical properties
    nitrogen_kg_ha = Column(Float, nullable=True)          # N in kg/ha
    phosphorus_kg_ha = Column(Float, nullable=True)        # P in kg/ha
    potassium_kg_ha = Column(Float, nullable=True)         # K in kg/ha
    ph = Column(Float, nullable=True)                      # Soil reaction (0-14)
    organic_carbon_pct = Column(Float, nullable=True)      # OC in %
    electrical_conductivity_ds_m = Column(Float, nullable=True) # EC in dS/m
    soil_texture = Column(String(100), nullable=True)      # e.g., Sandy Loam, Clay, Black Cotton

    # Metadata & Provenance
    extraction_method = Column(String(50), default="manual", nullable=False) # manual, easyocr, tesseract, gemini_vision
    overall_confidence = Column(Float, default=1.0, nullable=False)
    field_confidences_json = Column(Text, nullable=True)   # JSON string of per-field confidences
    is_confirmed = Column(Boolean, default=True, nullable=False) # Explicit confirmation guard
    
    # Privacy protection
    image_stored = Column(Boolean, default=False, nullable=False)
    image_path = Column(String(500), nullable=True)        # Only if user opted in

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    farm = relationship("Farm", backref="soil_cards")

