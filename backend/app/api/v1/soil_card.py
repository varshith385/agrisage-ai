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
    extract_soil_card_from_image,
    generate_image_thumbnail_base64,
    parse_soil_card_text,
)

router = APIRouter(prefix="/soil-card", tags=["Soil Health Card"])

STORAGE_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "soil_cards"


@router.get("/engines")
def get_ocr_engine_status():
    """
    Returns detected OCR backends and PowerShell installation instructions for missing engines.
    Reports only engines that can really run, and states which one will be used.
    """
    active_engine, available_engines, install_instructions = detect_ocr_engines()
    return {
        "engine_detected": active_engine,
        "preferred_engine": active_engine or "manual",
        "engine_in_use": active_engine or "manual",
        "available_engines": available_engines,
        "install_instructions": install_instructions,
        "powershell_help": POWERSHELL_INSTALL_INSTRUCTIONS,
        "status": "READY" if active_engine else "MANUAL_ENTRY_REQUIRED",
        "message": (
            f"Active automated extraction engine: {active_engine}."
            if active_engine
            else "No automated OCR engine is installed. Manual entry is ready."
        ),
    }


@router.post("/ocr", response_model=SoilCardExtractionResponse)
async def extract_soil_card_data(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    language: str = Form("en"),
):
    """
    Extracts N, P, K, pH, Organic Carbon, and EC from card image or raw text transcript.
    Engine order: gemini_vision (if configured) -> easyocr/pytesseract -> manual entry.
    Does NOT save any data to database.
    """
    if raw_text and raw_text.strip():
        extraction = parse_soil_card_text(raw_text, requested_lang=language)
        if file and file.filename:
            image_bytes = await file.read()
            if image_bytes:
                extraction.preview_image_base64 = generate_image_thumbnail_base64(image_bytes)
        return extraction

    if file and file.filename:
        image_bytes = await file.read()
        if len(image_bytes) > 0:
            return extract_soil_card_from_image(image_bytes, filename=file.filename, lang=language)

    return parse_soil_card_text("", requested_lang=language)


@router.post("/confirm", response_model=SoilCardConfirmResponse)
def confirm_soil_card_values(
    payload: SoilCardConfirmRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Explicit confirmation step: Commits user-reviewed soil values to database.
    Enforces farm ownership: returns 403 if farm belongs to another user.
    """
    # 1. Verify farm existence and ownership
    farm = db.query(Farm).filter(Farm.id == payload.farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with id {payload.farm_id} not found.",
        )
    if farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify soil values for this farm.",
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

    source_val = payload.source or ("photo read by AI" if payload.extraction_method == "gemini_vision" else "typed by farmer")

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
        source=source_val,
        test_date=payload.test_date,
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
        "source": card.source,
        "test_date": card.test_date,
    }

    return SoilCardConfirmResponse(
        success=True,
        message="Soil Health Card values confirmed and linked to farm profile.",
        card_id=card.id,
        farm_id=farm.id,
        confirmed_values=confirmed_dict,
        created_at=card.created_at.isoformat(),
        source=card.source,
        test_date=card.test_date,
    )


@router.get("/latest")
def get_latest_soil_card(
    farm_id: int = Query(..., description="Target farm ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns latest confirmed Soil Health Card for a farm.
    Enforces farm ownership: returns 403 if farm belongs to another user.
    """
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with id {farm_id} not found.",
        )
    if farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view soil values for this farm.",
        )

    card = (
        db.query(SoilHealthCard)
        .filter(SoilHealthCard.farm_id == farm.id, SoilHealthCard.is_confirmed == True)
        .order_by(SoilHealthCard.created_at.desc(), SoilHealthCard.id.desc())
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
            "source": card.source or ("photo read by AI" if card.extraction_method == "gemini_vision" else "typed by farmer"),
            "test_date": card.test_date,
            "overall_confidence": card.overall_confidence,
            "image_stored": card.image_stored,
            "created_at": card.created_at.isoformat(),
        },
    }


@router.delete("")
def delete_soil_card(
    farm_id: Optional[int] = Query(None, description="Target farm ID whose soil cards will be deleted"),
    card_id: Optional[int] = Query(None, description="Specific card ID to delete"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Removes saved soil values for a farm or deletes a specific card.
    Enforces ownership: returns 403 if target farm belongs to another user.
    """
    if farm_id is None and card_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either farm_id or card_id must be provided.",
        )

    if farm_id is not None:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm with id {farm_id} not found.",
            )
        if farm.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete soil values for this farm.",
            )

        deleted = db.query(SoilHealthCard).filter(SoilHealthCard.farm_id == farm.id).delete()
        db.commit()
        return {
            "success": True,
            "message": f"Saved soil values removed for farm '{farm.name}'.",
            "farm_id": farm.id,
            "deleted_count": deleted,
        }

    if card_id is not None:
        card = db.query(SoilHealthCard).filter(SoilHealthCard.id == card_id).first()
        if not card:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Soil Health Card with id {card_id} not found.",
            )
        farm = db.query(Farm).filter(Farm.id == card.farm_id).first()
        if not farm or farm.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete this soil card.",
            )

        db.delete(card)
        db.commit()
        return {
            "success": True,
            "message": "Soil Health Card removed.",
            "card_id": card_id,
        }


@router.delete("/{card_id}")
def delete_soil_card_by_path(
    card_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes a specific Soil Health Card by path parameter.
    Enforces ownership: returns 403 if target farm belongs to another user.
    """
    return delete_soil_card(card_id=card_id, db=db, current_user=current_user)


@router.post("/impact", response_model=SoilImpactAnalysisResponse)
def get_soil_impact_analysis(
    payload: SoilImpactAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Evaluates how confirmed soil values impact Crop Recommendation and Yield predictions.
    Displays side-by-side comparison (Before vs After) with confidence shifts.
    Enforces farm ownership: returns 403 if farm belongs to another user.
    """
    farm = db.query(Farm).filter(Farm.id == payload.farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with id {payload.farm_id} not found.",
        )
    if farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this farm.",
        )

    # Retrieve latest confirmed card
    card = (
        db.query(SoilHealthCard)
        .filter(SoilHealthCard.farm_id == farm.id, SoilHealthCard.is_confirmed == True)
        .order_by(SoilHealthCard.created_at.desc(), SoilHealthCard.id.desc())
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

