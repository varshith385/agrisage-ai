from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class VoiceQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="Spoken transcript or typed user query")
    language: Optional[str] = Field("en", description="Language code: en, te, or hi")
    farm_id: Optional[int] = Field(None, description="Optional target farm holding ID")
    history: Optional[List[Dict[str, str]]] = Field(
        default_factory=list,
        description="Conversation history turns: [{'role': 'user'|'assistant', 'content': '...'}]"
    )


class VoiceQueryResponse(BaseModel):
    intent: str = Field(..., description="Classified intent: navigation, weather, irrigation, disease, cost, scheme, price, smalltalk, general")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Calibrated confidence score")
    confidence_type: str = Field(..., description="Confidence provenance: rule, model, or fallback")
    spoken_text: str = Field(..., description="Concise 1-3 sentence spoken-length text suitable for TTS")
    status: str = Field(..., description="Feature status: WORKING, PARTIAL, or DEMO")
    sources: List[str] = Field(..., description="Agronomic or meteorological sources cited")
    action_link: Optional[str] = Field(None, description="In-app deep link (e.g. /irrigation, /market, /disease)")
    action_label: Optional[str] = Field(None, description="User-facing action label for quick navigation")
    action_type: Optional[str] = Field(None, description="Action type: navigate, set_lang, set_theme, set_pictorial, start_tour")
    confirmation_chip: Optional[str] = Field(None, description="Visible confirmation chip (e.g. Opening Irrigation...)")
    mode: Optional[str] = Field("ai", description="Assistant operating mode: 'ai' or 'basic'")
    privacy_notice: Optional[str] = Field(None, description="Privacy disclosure when AI inference is connected")
    structured_data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Key domain payload & context")
    limitations: List[str] = Field(default_factory=list, description="Explicit caveats and limitations")
    upstream_status: Optional[str] = Field(None, description="Status of upstream meteorological or generative APIs")
    suggestion_chips: List[str] = Field(default_factory=list, description="Tappable quick suggestion chips")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="UTC timestamp")
