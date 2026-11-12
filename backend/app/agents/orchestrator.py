import asyncio
import json
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from backend.app.agents.advisory_agent import AdvisoryAgent
from backend.app.agents.conflict_rules import detect_and_resolve_conflicts
from backend.app.agents.disease_agent import DiseaseAgent
from backend.app.agents.irrigation_agent import IrrigationAgent
from backend.app.agents.schemas import (
    AdvisoryPlan,
    Conflict,
    HandoffRecord,
    OrchestratorRunResult,
)
from backend.app.agents.weather_agent import WeatherAgent
from backend.app.agents.yield_agent import YieldAgent
from backend.app.models.agent_run import AgentRun, AgentRunStatus
from backend.app.models.farm import CurrentCropCycle, Farm
from backend.app.schemas.envelope import AgentEnvelope


class Orchestrator:
    def __init__(
        self,
        weather_agent: Optional[WeatherAgent] = None,
        irrigation_agent: Optional[IrrigationAgent] = None,
        disease_agent: Optional[DiseaseAgent] = None,
        yield_agent: Optional[YieldAgent] = None,
        advisory_agent: Optional[AdvisoryAgent] = None,
    ):
        self.weather_agent = weather_agent or WeatherAgent()
        self.irrigation_agent = irrigation_agent or IrrigationAgent()
        self.disease_agent = disease_agent or DiseaseAgent()
        self.yield_agent = yield_agent or YieldAgent()
        self.advisory_agent = advisory_agent or AdvisoryAgent()

    async def run(
        self,
        farm: Farm,
        db: Session,
        image_path: Optional[str] = None,
        crop_cycle: Optional[CurrentCropCycle] = None,
    ) -> OrchestratorRunResult:
        run_id = str(uuid.uuid4())
        start_time = time.perf_counter()
        now_iso = datetime.now(timezone.utc).isoformat()

        handoffs: List[HandoffRecord] = []
        envelopes: Dict[str, AgentEnvelope] = {}

        # 1. Weather Agent
        weather_context = {
            "latitude": farm.latitude,
            "longitude": farm.longitude,
            "db": db,
        }
        weather_env = await self.weather_agent.run(
            context=weather_context,
            db=db,
            run_id=run_id,
            farm_id=farm.id,
        )
        envelopes["WeatherAgent"] = weather_env

        weather_report = weather_env.outputs if (weather_env.status != "failed" and isinstance(weather_env.outputs, dict) and "error" not in weather_env.outputs) else None

        rain_48h = float(weather_report.get("rain_forecast_48h_mm", 0.0)) if weather_report else 0.0
        rain_24h = float(weather_report.get("rain_forecast_24h_mm", 0.0)) if weather_report else 0.0
        humidity = float(weather_report.get("relative_humidity_pct", 0.0)) if weather_report else 0.0

        # 2. Irrigation Agent
        handoffs.append(
            HandoffRecord(
                from_agent="WeatherAgent",
                to_agent="IrrigationAgent",
                message=f"Weather agent passed rain_in_48h={rain_48h:.1f}mm, rain_in_24h={rain_24h:.1f}mm, humidity={humidity:.1f}% to Irrigation agent",
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
        )
        irrigation_method_val = getattr(farm.irrigation_method, "value", str(farm.irrigation_method))
        crop_stage_val = getattr(crop_cycle.current_stage, "value", str(crop_cycle.current_stage)) if crop_cycle else None

        irrigation_context = {
            "weather_report": weather_report,
            "weather_status": weather_env.status,
            "irrigation_method": irrigation_method_val,
            "crop_stage": crop_stage_val,
            "crop_name": crop_cycle.crop_name if crop_cycle else None,
        }
        irrigation_env = await self.irrigation_agent.run(
            context=irrigation_context,
            db=db,
            run_id=run_id,
            farm_id=farm.id,
        )
        envelopes["IrrigationAgent"] = irrigation_env

        # 3. Disease Agent
        handoffs.append(
            HandoffRecord(
                from_agent="WeatherAgent",
                to_agent="DiseaseAgent",
                message=f"Weather agent passed humidity={humidity:.1f}% to Disease agent for fungal sporulation risk check",
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
        )
        disease_context = {
            "image_path": image_path,
            "weather_report": weather_report,
            "weather_status": weather_env.status,
            "crop_name": crop_cycle.crop_name if crop_cycle else None,
        }
        disease_env = await self.disease_agent.run(
            context=disease_context,
            db=db,
            run_id=run_id,
            farm_id=farm.id,
        )
        envelopes["DiseaseAgent"] = disease_env

        # 4. Yield Agent
        handoffs.append(
            HandoffRecord(
                from_agent="IrrigationAgent",
                to_agent="YieldAgent",
                message="Irrigation agent passed water sufficiency plan to Yield agent",
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
        )
        risk_lvl = disease_env.outputs.get("risk_level") if isinstance(disease_env.outputs, dict) else "unknown"
        handoffs.append(
            HandoffRecord(
                from_agent="DiseaseAgent",
                to_agent="YieldAgent",
                message=f"Disease agent passed risk_level={risk_lvl} to Yield agent",
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
        )
        yield_context = {
            "weather_report": weather_report,
            "weather_status": weather_env.status,
            "disease_finding": disease_env.outputs if isinstance(disease_env.outputs, dict) else None,
            "irrigation_plan": irrigation_env.outputs if isinstance(irrigation_env.outputs, dict) else None,
            "crop_name": crop_cycle.crop_name if crop_cycle else None,
            "crop_area": farm.area,
            "area_acres": farm.area,
            "state": farm.state,
            "district": farm.district,
            "season": "Kharif",
        }
        yield_env = await self.yield_agent.run(
            context=yield_context,
            db=db,
            run_id=run_id,
            farm_id=farm.id,
        )
        envelopes["YieldAgent"] = yield_env

        # Record handoff from Yield to Advisory with predicted range if available
        if isinstance(yield_env.outputs, dict) and yield_env.outputs.get("expected_yield_quintals_per_acre") is not None:
            exp_y = yield_env.outputs.get("expected_yield_quintals_per_acre")
            low_y = yield_env.outputs.get("yield_range_lower")
            up_y = yield_env.outputs.get("yield_range_upper")
            handoffs.append(
                HandoffRecord(
                    from_agent="YieldAgent",
                    to_agent="AdvisoryAgent",
                    message=f"Yield agent passed expected_yield={exp_y} q/acre (Range: {low_y} - {up_y} q/acre) to Advisory agent",
                    timestamp=datetime.now(timezone.utc).isoformat(),
                )
            )

        # Conflict Detection
        conflicts = detect_and_resolve_conflicts(
            weather_report=weather_report or {},
            irrigation_plan=irrigation_env.outputs if isinstance(irrigation_env.outputs, dict) else {},
            disease_finding=disease_env.outputs if isinstance(disease_env.outputs, dict) else {},
            farm_context={"irrigation_method": irrigation_method_val},
        )

        # 5. Advisory Agent
        handoffs.append(
            HandoffRecord(
                from_agent="Orchestrator",
                to_agent="AdvisoryAgent",
                message=f"Orchestrator passed conflict resolutions ({len(conflicts)} found) and upstream agent telemetry to Advisory agent",
                timestamp=datetime.now(timezone.utc).isoformat(),
            )
        )
        advisory_context = {
            "weather_report": weather_report,
            "weather_status": weather_env.status,
            "irrigation_plan": irrigation_env.outputs if isinstance(irrigation_env.outputs, dict) else {},
            "disease_finding": disease_env.outputs if isinstance(disease_env.outputs, dict) else {},
            "yield_estimate": yield_env.outputs if isinstance(yield_env.outputs, dict) else {},
            "conflicts": [c.model_dump() for c in conflicts],
        }
        advisory_env = await self.advisory_agent.run(
            context=advisory_context,
            db=db,
            run_id=run_id,
            farm_id=farm.id,
        )
        envelopes["AdvisoryAgent"] = advisory_env

        # Duration & Overall Status
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        has_failed = any(env.status == "failed" for env in envelopes.values())
        has_degraded = any(env.status == "degraded" for env in envelopes.values())

        overall_status = "failed" if (weather_env.status == "failed" and has_failed) else ("degraded" if (has_failed or has_degraded) else "success")

        # Persist orchestrator master record
        try:
            status_enum = AgentRunStatus.SUCCESS if overall_status == "success" else (
                AgentRunStatus.DEGRADED if overall_status == "degraded" else AgentRunStatus.FAILED
            )
            master_record = AgentRun(
                run_id=run_id,
                farm_id=farm.id,
                agent_name="orchestrator",
                trigger_type="user",
                status=status_enum,
                duration_ms=duration_ms,
                inputs_json=json.dumps({"farm_id": farm.id, "has_image": bool(image_path)}, default=str),
                outputs_json=json.dumps({
                    "overall_status": overall_status,
                    "conflicts_count": len(conflicts),
                    "handoffs_count": len(handoffs),
                    "agent_statuses": {k: v.status for k, v in envelopes.items()},
                }, default=str),
                warnings_json=json.dumps([c.issue for c in conflicts], default=str),
            )
            db.add(master_record)
            db.commit()
        except Exception:
            db.rollback()

        # Build AdvisoryPlan model
        try:
            advisory_plan = AdvisoryPlan(**advisory_env.outputs)
        except Exception:
            advisory_plan = AdvisoryPlan(
                status="stub",
                message="not implemented yet",
                farm_health_score=None,
                seven_day_plan=None,
                confidence=0.0,
            )

        return OrchestratorRunResult(
            run_id=run_id,
            farm_id=farm.id,
            status=overall_status,
            duration_ms=duration_ms,
            handoffs=handoffs,
            conflicts=conflicts,
            envelopes=envelopes,
            advisory_plan=advisory_plan,
            created_at=now_iso,
        )
