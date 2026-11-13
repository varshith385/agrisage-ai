from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class VoiceQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="Spoken transcript or typed user query")
    language: Optional[str] = Field("en", description="Language code: en, te, or hi")
    farm_id: Optional[int] = Field(None, description="Optional target farm holding ID")


class VoiceQueryResponse(BaseModel):
    intent: str = Field(..., description="Classified intent: weather, irrigation, disease, cost, scheme, price, general")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Calibrated confidence score")
    confidence_type: str = Field(..., description="Confidence provenance: rule, model, or fallback")
    spoken_text: str = Field(..., description="Concise 1-3 sentence spoken-length text suitable for TTS")
    status: str = Field(..., description="Feature status: WORKING, PARTIAL, or DEMO")
    sources: List[str] = Field(..., description="Agronomic or meteorological sources cited")
    action_link: Optional[str] = Field(None, description="In-app deep link (e.g. /weather, /disease, /economics)")
    action_label: Optional[str] = Field(None, description="User-facing action label for quick navigation")
    structured_data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Key domain payload")
    limitations: List[str] = Field(default_factory=list, description="Explicit caveats and limitations")
    upstream_status: Optional[str] = Field(None, description="Status of upstream meteorological or domain APIs")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="UTC timestamp")

