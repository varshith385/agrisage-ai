"""
AgriSage AI — Advisory & Growth Stage API Router
Implements:
- GET /api/v1/advisory/stage: Phenology progress & stage timeline
- GET /api/v1/advisory/tasks: Stage-specific tasks & guidance
- POST /api/v1/advisory/plan: Full 7-day actionable plan & Farm Health Score
"""
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.agents.orchestrator import Orchestrator
from backend.app.database.session import get_db
from backend.app.models.farm import CurrentCropCycle, Farm
from backend.app.models.user import User
from backend.app.schemas.advisory import (
    AdvisoryPlanRequest,
    AdvisoryPlanResponse,
    GrowthStageResponse,
    HeadlineYieldSummary,
    StageTasksResponse,
)
from backend.app.security.auth import get_current_user
from backend.app.services.growth_stage import growth_stage_service

router = APIRouter(prefix="/advisory", tags=["Advisory & Growth Stages"])


@router.get("/stage", response_model=GrowthStageResponse)
def get_growth_stage(
    crop: str = Query("cotton", description="Crop name (e.g. cotton, rice, wheat, maize)"),
    planting_date: str = Query("2026-08-15", description="Planting date in YYYY-MM-DD format"),
):
    """
    Computes Days After Sowing (DAS), 5 phenological stages mapped onto FAO-56 stage lengths,
    and stage progress percentage from planting date.
    """
    try:
        p_date = datetime.strptime(planting_date, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid planting_date format. Must be YYYY-MM-DD.",
        )

    res = growth_stage_service.compute_phenology(crop_name=crop, planting_date=p_date)
    return res


@router.get("/tasks", response_model=StageTasksResponse)
def get_stage_tasks(
    crop_cycle_id: Optional[int] = Query(None, description="Optional active crop cycle ID"),
    crop: Optional[str] = Query(None, description="Crop name if cycle_id is omitted"),
    planting_date: Optional[str] = Query(None, description="Planting date if cycle_id is omitted"),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves stage-specific guidance tasks (critical irrigation sensitivity, fertilizer windows,
    pest scouting, spraying windows) for the active growth stage. Strictly zero chemical dosages.
    """
    c_name = crop or "cotton"
    p_date = date(2026, 8, 15)

    if crop_cycle_id is not None:
        cycle = db.query(CurrentCropCycle).filter(CurrentCropCycle.id == crop_cycle_id).first()
        if not cycle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Crop cycle with ID {crop_cycle_id} not found",
            )
        c_name = cycle.crop_name
        p_date = cycle.planting_date
    elif planting_date:
        try:
            p_date = datetime.strptime(planting_date, "%Y-%m-%d").date()
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid planting_date format. Must be YYYY-MM-DD.",
            )

    res = growth_stage_service.get_stage_tasks(crop_name=c_name, planting_date=p_date)
    return res


@router.post("/plan", response_model=AdvisoryPlanResponse)
async def generate_advisory_plan(
    payload: AdvisoryPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Synthesizes multi-agent pipeline and returns complete 7-day actionable plan,
    transparent Farm Health Score (0-100), and headline yield comparison.
    """
    farm = db.query(Farm).filter(Farm.id == payload.farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm holding with ID {payload.farm_id} not found.",
        )

    if farm.user_id != current_user.id and current_user.role.value != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: farm holding does not belong to authenticated farmer.",
        )

    # Determine active crop cycle
    if payload.crop_cycle_id is not None:
        active_crop = (
            db.query(CurrentCropCycle)
            .filter(CurrentCropCycle.id == payload.crop_cycle_id, CurrentCropCycle.farm_id == farm.id)
            .first()
        )
    else:
        active_crop = (
            db.query(CurrentCropCycle)
            .filter(CurrentCropCycle.farm_id == farm.id, CurrentCropCycle.is_active == True)
            .first()
        )

    # Run orchestrator
    orchestrator = Orchestrator()
    orch_result = await orchestrator.run(
        farm=farm,
        db=db,
        image_path=payload.image_path,
        crop_cycle=active_crop,
    )

    adv_plan = orch_result.advisory_plan
    adv_dict = adv_plan.model_dump()

    # Growth stage
    stage_data = adv_dict.get("growth_stage")
    growth_resp = GrowthStageResponse(**stage_data) if stage_data else None

    # Headline yield
    head_data = adv_dict.get("headline_yield")
    if head_data:
        head_summary = HeadlineYieldSummary(**head_data)
    else:
        c_name = active_crop.crop_name if active_crop else "Cotton"
        head_summary = HeadlineYieldSummary(
            crop_name=c_name,
            is_supported=False,
            headline_label="not supported",
            unit="bales",
            disclaimer="Excluded from metric yield regressor.",
        )

    # Farm Health Score
    health_breakdown_raw = adv_dict.get("farm_health_breakdown")
    from backend.app.schemas.advisory import FarmHealthScoreBreakdown
    if health_breakdown_raw:
        health_breakdown = FarmHealthScoreBreakdown(**health_breakdown_raw)
    else:
        health_breakdown = FarmHealthScoreBreakdown(
            score=None,
            status="INSUFFICIENT_DATA",
            active_components_count=0,
            summary="Telemetry missing",
            formula_description="Score calculation aborted",
            components=[],
        )

    # Seven-day plan items
    from backend.app.schemas.advisory import SevenDayPlanItem, ConflictResolutionItem
    plan_raw = adv_dict.get("seven_day_plan") or []
    plan_items = [SevenDayPlanItem(**item) for item in plan_raw if isinstance(item, dict)]

    conflicts_items = [
        ConflictResolutionItem(
            agent_a=c.agent_a,
            agent_b=c.agent_b,
            issue=c.issue,
            resolution=c.resolution,
            rationale=c.rationale,
            rule_type=c.rule_type,
            indicative=c.indicative,
        )
        for c in orch_result.conflicts
    ]

    return AdvisoryPlanResponse(
        status=adv_plan.status,
        message=adv_plan.message,
        farm_id=farm.id,
        crop_name=active_crop.crop_name if active_crop else "Cotton",
        growth_stage=growth_resp,
        headline_yield=head_summary,
        farm_health_score=health_breakdown,
        seven_day_plan=plan_items,
        conflicts=conflicts_items,
        risk_alerts=adv_dict.get("risk_alerts", []),
        explainable_cards=adv_plan.explainable_cards,
        summary=adv_plan.summary or "Multi-agent advisory plan completed.",
        confidence=adv_plan.confidence,
    )

