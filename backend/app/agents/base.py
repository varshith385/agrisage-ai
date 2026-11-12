import asyncio
import json
import time
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.schemas.envelope import AgentEnvelope
from backend.app.models.agent_run import AgentRun, AgentRunStatus


class BaseAgent(ABC):
    def __init__(self, name: str, timeout_seconds: Optional[float] = None):
        self.name = name
        self.timeout_seconds = timeout_seconds if timeout_seconds is not None else settings.AGENT_TIMEOUT_SECONDS

    @abstractmethod
    async def _execute(self, context: Dict[str, Any]) -> AgentEnvelope:
        """Concrete agent execution logic implemented by subclasses."""
        pass

    async def run(self, context: Dict[str, Any], db: Optional[Session] = None, run_id: Optional[str] = None, farm_id: Optional[int] = None) -> AgentEnvelope:
        start_time = time.perf_counter()
        now = datetime.now(timezone.utc)

        try:
            # Enforce configurable per-agent timeout
            envelope = await asyncio.wait_for(
                self._execute(context),
                timeout=self.timeout_seconds,
            )
        except asyncio.TimeoutError:
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            envelope = AgentEnvelope(
                agent_name=self.name,
                status="failed",
                timestamp=now,
                inputs_used=context,
                outputs={"error": f"Agent timed out after {self.timeout_seconds}s"},
                confidence=0.0,
                warnings=[f"Execution timeout ({self.timeout_seconds}s) reached; pipeline continuing with fallback."],
            )
        except Exception as exc:
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            envelope = AgentEnvelope(
                agent_name=self.name,
                status="failed",
                timestamp=now,
                inputs_used=context,
                outputs={"error": str(exc)},
                confidence=0.0,
                warnings=[f"Agent execution encountered an unhandled exception: {type(exc).__name__} - {str(exc)}"],
            )
        else:
            duration_ms = int((time.perf_counter() - start_time) * 1000)

        # Optional database persistence
        if db is not None and run_id is not None:
            self._persist_run(db, run_id, farm_id, envelope, duration_ms)

        return envelope

    def _persist_run(self, db: Session, run_id: str, farm_id: Optional[int], envelope: AgentEnvelope, duration_ms: int) -> None:
        try:
            status_enum = AgentRunStatus.SUCCESS
            if envelope.status == "degraded":
                status_enum = AgentRunStatus.DEGRADED
            elif envelope.status == "failed":
                status_enum = AgentRunStatus.FAILED

            record = AgentRun(
                run_id=run_id,
                farm_id=farm_id,
                agent_name=self.name,
                trigger_type="orchestrator",
                status=status_enum,
                duration_ms=duration_ms,
                inputs_json=json.dumps(envelope.inputs_used, default=str),
                outputs_json=json.dumps(envelope.outputs, default=str),
                warnings_json=json.dumps(envelope.warnings, default=str),
            )
            db.add(record)
            db.commit()
        except Exception as err:
            db.rollback()
            # Database logging failure must not crash execution
            envelope.warnings.append(f"Telemetry persistence notice: {str(err)}")
