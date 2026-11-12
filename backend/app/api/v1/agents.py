import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.agents.orchestrator import Orchestrator
from backend.app.agents.schemas import AgentRunItem, OrchestratorRunResult
from backend.app.database.session import get_db
from backend.app.models.agent_run import AgentRun
from backend.app.models.farm import CurrentCropCycle, Farm
from backend.app.models.user import User
from backend.app.security.auth import get_current_user
from pydantic import BaseModel, Field

router = APIRouter(prefix="/agents", tags=["Agents"])


class AgentRunRequest(BaseModel):
    farm_id: int = Field(..., description="Target farm ID")
    image_path: Optional[str] = Field(None, description="Optional path or URI to crop leaf image")


def _row_to_item(row: AgentRun) -> AgentRunItem:
    inputs = {}
    outputs = {}
    warnings = []
    if row.inputs_json:
        try:
            inputs = json.loads(row.inputs_json)
        except Exception:
            inputs = {"raw": row.inputs_json}
    if row.outputs_json:
        try:
            outputs = json.loads(row.outputs_json)
        except Exception:
            outputs = {"raw": row.outputs_json}
    if row.warnings_json:
        try:
            warnings = json.loads(row.warnings_json)
        except Exception:
            warnings = [row.warnings_json]

    return AgentRunItem(
        id=row.id,
        run_id=row.run_id or str(row.id),
        farm_id=row.farm_id,
        agent_name=row.agent_name,
        trigger_type=row.trigger_type,
        status=row.status.value if hasattr(row.status, "value") else str(row.status),
        duration_ms=row.duration_ms,
        inputs=inputs,
        outputs=outputs,
        warnings=warnings,
        created_at=row.created_at,
    )


@router.post("/run", response_model=OrchestratorRunResult)
async def trigger_agent_run(
    payload: AgentRunRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Trigger the multi-agent sequential pipeline (Weather → Irrigation → Disease → Yield → Advisory).
    Validates farm ownership before execution.
    """
    farm = db.query(Farm).filter(Farm.id == payload.farm_id).first()
    if not farm:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Farm with id {payload.farm_id} not found",
        )

    if farm.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: farm does not belong to the authenticated user",
        )

    active_crop = (
        db.query(CurrentCropCycle)
        .filter(CurrentCropCycle.farm_id == farm.id, CurrentCropCycle.is_active == True)
        .first()
    )

    orchestrator = Orchestrator()
    result = await orchestrator.run(
        farm=farm,
        db=db,
        image_path=payload.image_path,
        crop_cycle=active_crop,
    )
    return result


@router.get("/runs", response_model=List[AgentRunItem])
def list_agent_runs(
    farm_id: Optional[int] = Query(None, description="Filter runs by farm ID"),
    agent_name: Optional[str] = Query(None, description="Filter by agent name"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by run status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve agent activity log records with optional filtering.
    Restricted to farms owned by the authenticated user.
    """
    query = db.query(AgentRun)

    if farm_id is not None:
        farm = db.query(Farm).filter(Farm.id == farm_id).first()
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm with id {farm_id} not found",
            )
        if farm.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: farm does not belong to the authenticated user",
            )
        query = query.filter(AgentRun.farm_id == farm_id)
    else:
        user_farm_ids = [
            f.id for f in db.query(Farm.id).filter(Farm.user_id == current_user.id).all()
        ]
        query = query.filter(AgentRun.farm_id.in_(user_farm_ids))

    if agent_name:
        query = query.filter(AgentRun.agent_name == agent_name)

    if status_filter:
        query = query.filter(AgentRun.status == status_filter)

    rows = (
        query.order_by(AgentRun.created_at.desc(), AgentRun.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [_row_to_item(row) for row in rows]


@router.get("/runs/{run_identifier}", response_model=List[AgentRunItem])
def get_agent_run_detail(
    run_identifier: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve all agent executions for a specific run (by integer ID or UUID run_id).
    Restricted to farms owned by the authenticated user.
    """
    # Try querying by run_id (UUID string) first
    rows = db.query(AgentRun).filter(AgentRun.run_id == run_identifier).order_by(AgentRun.id.asc()).all()

    # If no rows found and identifier is numeric, query by primary key ID
    if not rows and run_identifier.isdigit():
        single_row = db.query(AgentRun).filter(AgentRun.id == int(run_identifier)).first()
        if single_row:
            rows = [single_row]

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent run '{run_identifier}' not found",
        )

    # Check farm ownership for all rows returned
    user_farm_ids = set(
        f.id for f in db.query(Farm.id).filter(Farm.user_id == current_user.id).all()
    )
    for row in rows:
        if row.farm_id and row.farm_id not in user_farm_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: this agent run belongs to another user's farm",
            )

    return [_row_to_item(row) for row in rows]
