from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from backend.app.database.session import Base, utc_now
import enum


class AgentRunStatus(str, enum.Enum):
    SUCCESS = "success"
    DEGRADED = "degraded"
    FAILED = "failed"


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(String(36), index=True, nullable=False)  # Shared UUID across all agents in one run
    farm_id = Column(Integer, ForeignKey("farms.id"), nullable=True, index=True)
    agent_name = Column(String(50), nullable=True, index=True)  # e.g. "Orchestrator", "WeatherAgent", etc.
    trigger_type = Column(String(50), default="manual", nullable=False)
    status = Column(SQLEnum(AgentRunStatus), default=AgentRunStatus.SUCCESS, nullable=False)
    duration_ms = Column(Integer, default=0, nullable=False)
    inputs_json = Column(Text, nullable=True)
    outputs_json = Column(Text, nullable=True)
    warnings_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)
