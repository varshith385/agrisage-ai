from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


class AgentEnvelope(BaseModel):
    agent_name: str
    status: Literal["success", "degraded", "failed"]
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    inputs_used: Dict[str, Any] = Field(default_factory=dict)
    outputs: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = Field(ge=0.0, le=1.0)
    warnings: List[str] = Field(default_factory=list)


class ExplainabilitySchema(BaseModel):
    value: Any
    confidence: float = Field(ge=0.0, le=1.0)
    confidence_type: Literal["model_metric", "heuristic", "rule"]
    reasons: List[str]
    sources: List[str]
    status: Literal["WORKING", "PARTIAL", "DEMO"]
    limitations: List[str] = Field(default_factory=list)

