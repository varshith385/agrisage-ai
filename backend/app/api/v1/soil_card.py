"""
AgriSage AI — Soil Health Card API Router
Module 20: /api/v1/soil-card

Endpoints:
- GET  /engines: Detected OCR backends and PowerShell installation instructions.
- POST /ocr: Pluggable OCR extraction from uploaded image or raw text.
- POST /confirm: Commit reviewed/edited soil metrics to farm profile. Strictly guarded by user confirmation.
- GET  /latest: Retrieve latest confirmed Soil Health Card for a farm.
- POST /impact: Before vs After impact analysis feeding into Crop Recommender and Yield regressor.
"""

import base64
import json
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.farm import Farm
from backend.app.models.soil_card import SoilHealthCard
from backend.app.models.user import User
from backend.app.schemas.soil_card import (
    SoilCardConfirmRequest,
    SoilCardConfirmResponse,
    SoilCardExtractionResponse,
    SoilImpactAnalysisRequest,
    SoilImpactAnalysisResponse,
)
from backend.app.security.auth import get_current_user
from backend.app.services.soil_card_ocr import (
    POWERSHELL_INSTALL_INSTRUCTIONS,
    analyze_soil_impact,
    detect_ocr_engines,
    execute_pluggable_ocr,
    generate_image_thumbnail_base64,
    parse_soil_card_text,
)

router = APIRouter(prefix="/soil-card", tags=["Soil Health Card"])

STORAGE_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "soil_cards"


@router.get("/engines")
def get_ocr_engine_status():
    """
    Returns detected OCR backends and PowerShell installation instructions for missing engines.
    """
    active_engine, available_engines, install_instructions = detect_ocr_engines()
    return {
        "engine_detected": active_engine,
        "available_engines": available_engines,
        "install_instructions": install_instructions,
        "powershell_help": POWERSHELL_INSTALL_INSTRUCTIONS,
        "status": "READY" if active_engine else "MANUAL_ENTRY_REQUIRED",
    }


@router.post("/ocr", response_model=SoilCardExtractionResponse)
async def extract_soil_card_data(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    language: str = Form("en"),
):
    """
    Extracts N, P, K, pH, Organic Carbon, and EC from card image or raw text transcript.
    If OCR backend is missing or image is unclear, returns partial extraction with PowerShell setup guidance.
    Does NOT save any data to database.
    """
    text_to_parse = raw_text or ""
    preview_base64: Optional[str] = None

    if file and file.filename:
        image_bytes = await file.read()
        if len(image_bytes) > 0:
            preview_base64 = generate_image_thumbnail_base64(image_bytes)
            # Run pluggable OCR if raw_text wasn't explicitly supplied
            if not text_to_parse.strip():
                ocr_result = execute_pluggable_ocr(image_bytes, lang=language)
                text_to_parse = ocr_result

    extraction = parse_soil_card_text(text_to_parse, requested_lang=language)
    if preview_base64:
        extraction.preview_image_base64 = preview_base64

    return extraction


@router.post("/confirm", response_model=SoilCardConfirmResponse)
def confirm_soil_card_values(
    payload: SoilCardConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Explicit confirmation step: Commits user-reviewed soil values to database.
    Nothing reaches the farm profile until this endpoint is called with farmer consent.
    Respects privacy: Card image is only stored if store_image_opt_in is True.
    """
    # 1. Verify farm ownership
    farm = db.query(Farm).filter(Farm.id == payload.farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with id {payload.farm_id} not found or does not belong to user.",
        )

    # 2. Update farm soil_type if specified
    if payload.soil_texture:
        farm.soil_type = payload.soil_texture.strip()

    # 3. Privacy-preserving image handling
    image_stored = False
    stored_path = None
    if payload.store_image_opt_in and payload.image_base64:
        try:
            STORAGE_DIR.mkdir(parents=True, exist_ok=True)
            img_data = payload.image_base64
            if "," in img_data:
                img_data = img_data.split(",", 1)[1]
            decoded_bytes = base64.b64decode(img_data)
            filename = f"farm_{farm.id}_{int(time.time())}.jpg"
            target_path = STORAGE_DIR / filename
            with open(target_path, "wb") as f:
                f.write(decoded_bytes)
            image_stored = True
            stored_path = str(target_path)
        except Exception:
            image_stored = False
            stored_path = None

    # Calculate overall confidence from confirmed field confidences
    conf_dict = payload.field_confidences or {}
    overall_conf = 1.0
    if payload.extraction_method != "manual" and conf_dict:
        vals = [float(v) for v in conf_dict.values() if v is not None]
        overall_conf = round(sum(vals) / len(vals), 2) if vals else 0.85

    # 4. Create confirmed SoilHealthCard entry
    card = SoilHealthCard(
        farm_id=farm.id,
        nitrogen_kg_ha=payload.nitrogen_kg_ha,
        phosphorus_kg_ha=payload.phosphorus_kg_ha,
        potassium_kg_ha=payload.potassium_kg_ha,
        ph=payload.ph,
        organic_carbon_pct=payload.organic_carbon_pct,
        electrical_conductivity_ds_m=payload.electrical_conductivity_ds_m,
        soil_texture=payload.soil_texture,
        extraction_method=payload.extraction_method,
        overall_confidence=overall_conf,
        field_confidences_json=json.dumps(conf_dict),
        is_confirmed=True,
        image_stored=image_stored,
        image_path=stored_path,
    )
    db.add(card)
    db.commit()
    db.refresh(card)

    confirmed_dict = {
        "nitrogen_kg_ha": card.nitrogen_kg_ha,
        "phosphorus_kg_ha": card.phosphorus_kg_ha,
        "potassium_kg_ha": card.potassium_kg_ha,
        "ph": card.ph,
        "organic_carbon_pct": card.organic_carbon_pct,
        "electrical_conductivity_ds_m": card.electrical_conductivity_ds_m,
        "soil_texture": card.soil_texture,
        "image_stored": card.image_stored,
    }

    return SoilCardConfirmResponse(
        success=True,
        message="Soil Health Card values confirmed and linked to farm profile.",
        card_id=card.id,
        farm_id=farm.id,
        confirmed_values=confirmed_dict,
        created_at=card.created_at.isoformat(),
    )


@router.get("/latest")
def get_latest_soil_card(
    farm_id: int = Query(..., description="Target farm ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns latest confirmed Soil Health Card for a farm.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with id {farm_id} not found or does not belong to user.",
        )

    card = (
        db.query(SoilHealthCard)
        .filter(SoilHealthCard.farm_id == farm.id, SoilHealthCard.is_confirmed == True)
        .order_by(SoilHealthCard.created_at.desc())
        .first()
    )

    if not card:
        return {
            "has_card": False,
            "card": None,
            "message": "No confirmed Soil Health Card exists for this farm.",
        }

    return {
        "has_card": True,
        "card": {
            "id": card.id,
            "farm_id": card.farm_id,
            "nitrogen_kg_ha": card.nitrogen_kg_ha,
            "phosphorus_kg_ha": card.phosphorus_kg_ha,
            "potassium_kg_ha": card.potassium_kg_ha,
            "ph": card.ph,
            "organic_carbon_pct": card.organic_carbon_pct,
            "electrical_conductivity_ds_m": card.electrical_conductivity_ds_m,
            "soil_texture": card.soil_texture,
            "extraction_method": card.extraction_method,
            "overall_confidence": card.overall_confidence,
            "image_stored": card.image_stored,
            "created_at": card.created_at.isoformat(),
        },
    }


@router.post("/impact", response_model=SoilImpactAnalysisResponse)
def get_soil_impact_analysis(
    payload: SoilImpactAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Evaluates how confirmed soil values impact Crop Recommendation and Yield predictions.
    Displays side-by-side comparison (Before vs After) with confidence shifts.
    """
    farm = db.query(Farm).filter(Farm.id == payload.farm_id, Farm.user_id == current_user.id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with id {payload.farm_id} not found or does not belong to user.",
        )

    # Retrieve latest confirmed card
    card = (
        db.query(SoilHealthCard)
        .filter(SoilHealthCard.farm_id == farm.id, SoilHealthCard.is_confirmed == True)
        .order_by(SoilHealthCard.created_at.desc())
        .first()
    )

    n = card.nitrogen_kg_ha if card else None
    p = card.phosphorus_kg_ha if card else None
    k = card.potassium_kg_ha if card else None
    ph = card.ph if card else None
    oc = card.organic_carbon_pct if card else None
    ec = card.electrical_conductivity_ds_m if card else None

    target_crop = payload.crop_name or "Rice"

    return analyze_soil_impact(
        farm_id=farm.id,
        state=farm.state or "Telangana",
        district=farm.district or "Warangal",
        area_acres=farm.area or 2.5,
        crop_name=target_crop,
        n=n,
        p=p,
        k=k,
        ph=ph,
        oc=oc,
        ec=ec,
    )
