"""
AgriSage AI — Voice Assistant API Router
Module 21: /api/v1/voice

Implements:
- POST /api/v1/voice/query: Process spoken transcript or typed agricultural query (login required)
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.models.user import User
from backend.app.schemas.voice import VoiceQueryRequest, VoiceQueryResponse
from backend.app.security.auth import get_current_user
from backend.app.services.voice_service import voice_service

router = APIRouter(prefix="/voice", tags=["Voice Assistant"])


@router.post("/query", response_model=VoiceQueryResponse, status_code=status.HTTP_200_OK)
async def query_voice_assistant(
    payload: VoiceQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Multilingual agronomic voice assistant endpoint.
    Classifies intent (weather, irrigation, disease, cost, scheme, price, general),
    routes to farm-specific domain engines, and returns concise spoken-length advice
    strictly sanitized of chemical dosages.
    """
    return await voice_service.process_query(request=payload, user=current_user, db=db)

