"""
Tests for Pluggable Multi-Provider LLM Client Layer (Groq & Gemini)
Covers:
1. Groq first
2. Fallback on 429 (Rate Limit)
3. Fallback on timeout
4. Both providers failing -> Basic mode
5. No key at all -> Basic mode
6. Secret guards: API keys never appear in responses, status strings, or logs.
"""

import logging
import pytest
import httpx
from unittest.mock import AsyncMock, patch, MagicMock

from backend.app.config import settings
from backend.app.services.llm_client import (
    call_groq_chat,
    call_gemini_chat,
    generate_chat_completion,
    log_llm_startup_status,
)
from backend.app.services.voice_service import voice_service
from backend.app.schemas.voice import VoiceQueryRequest
from backend.app.models.user import User, UserRole, Language


@pytest.fixture
def mock_farmer_user():
    return User(
        id=999,
        email="test_llm_farmer@agrisage.internal",
        full_name="Ramesh Test",
        role=UserRole.FARMER,
        preferred_language=Language.EN,
        is_active=True,
    )


@pytest.mark.asyncio
async def test_groq_success():
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "choices": [{"message": {"content": "Your cotton crop soil moisture is optimal."}}]
    }

    with patch.object(settings, "GROQ_API_KEY", "gsk_test_secret_key_12345"), \
         patch.object(settings, "GROQ_MODEL", "llama-3.3-70b-versatile"), \
         patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_resp

        res = await call_groq_chat(
            system_instruction="You are Grow2Gain",
            user_prompt="How is my soil?",
        )

        assert res is not None
        assert res.provider == "Groq"
        assert res.model == "llama-3.3-70b-versatile"
        assert "optimal" in res.text
        assert res.status_label == "AI connected (Groq)"
        assert "Groq" in res.privacy_notice
        # Verify key is never in the returned object
        assert "gsk_test_secret_key_12345" not in res.text
        assert "gsk_test_secret_key_12345" not in res.status_label
        assert "gsk_test_secret_key_12345" not in res.privacy_notice


@pytest.mark.asyncio
async def test_groq_fallback_on_429():
    """Groq returns 429; generate_chat_completion falls through to Gemini."""
    groq_429_resp = MagicMock()
    groq_429_resp.status_code = 429

    gemini_200_resp = MagicMock()
    gemini_200_resp.status_code = 200
    gemini_200_resp.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "Gemini answered after Groq 429."}]}}]
    }

    async def side_effect_post(url, **kwargs):
        if "groq.com" in str(url):
            return groq_429_resp
        return gemini_200_resp

    with patch.object(settings, "GROQ_API_KEY", "gsk_test_key"), \
         patch.object(settings, "GEMINI_API_KEY", "gemini_test_key"), \
         patch.object(settings, "LLM_PROVIDER_ORDER", "groq,gemini"), \
         patch("httpx.AsyncClient.post", side_effect=side_effect_post):

        res = await generate_chat_completion(
            system_instruction="System prompt",
            user_prompt="User query",
        )

        assert res is not None
        assert res.provider == "Gemini"
        assert "Gemini answered after Groq 429." in res.text
        assert res.status_label == "AI connected (Gemini)"


@pytest.mark.asyncio
async def test_groq_fallback_on_timeout():
    """Groq times out; generate_chat_completion falls through to Gemini."""
    gemini_200_resp = MagicMock()
    gemini_200_resp.status_code = 200
    gemini_200_resp.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "Gemini answered after Groq timeout."}]}}]
    }

    async def side_effect_post(url, **kwargs):
        if "groq.com" in str(url):
            raise httpx.TimeoutException("Groq connection timeout")
        return gemini_200_resp

    with patch.object(settings, "GROQ_API_KEY", "gsk_test_key"), \
         patch.object(settings, "GEMINI_API_KEY", "gemini_test_key"), \
         patch.object(settings, "LLM_PROVIDER_ORDER", "groq,gemini"), \
         patch("httpx.AsyncClient.post", side_effect=side_effect_post):

        res = await generate_chat_completion(
            system_instruction="System prompt",
            user_prompt="User query",
            timeout=1.0,
        )

        assert res is not None
        assert res.provider == "Gemini"
        assert "Gemini answered after Groq timeout." in res.text


@pytest.mark.asyncio
async def test_both_providers_failing_gives_basic_mode(mock_farmer_user):
    """When Groq and Gemini both fail (e.g. 500 error), process_query gracefully degrades to Basic mode."""
    error_resp = MagicMock()
    error_resp.status_code = 500

    with patch.object(settings, "GROQ_API_KEY", "gsk_test_key"), \
         patch.object(settings, "GEMINI_API_KEY", "gemini_test_key"), \
         patch.object(settings, "LLM_PROVIDER_ORDER", "groq,gemini"), \
         patch("httpx.AsyncClient.post", return_value=error_resp):

        db_mock = MagicMock()
        db_mock.query.return_value.filter.return_value.first.return_value = None
        db_mock.query.return_value.filter.return_value.order_by.return_value.first.return_value = None

        req = VoiceQueryRequest(query="General agricultural query about crops", language="en")
        res = await voice_service.process_query(req, mock_farmer_user, db_mock)

        assert res is not None
        assert res.mode == "basic"
        assert res.upstream_status == "Basic mode (no AI key)"
        # Confirm no API keys are present in any field
        res_json = res.model_dump_json()
        assert "gsk_test_key" not in res_json
        assert "gemini_test_key" not in res_json


@pytest.mark.asyncio
async def test_no_keys_gives_basic_mode(mock_farmer_user):
    """When no LLM keys are configured, query resolves to Basic mode."""
    with patch.object(settings, "GROQ_API_KEY", ""), \
         patch.object(settings, "GEMINI_API_KEY", ""):

        db_mock = MagicMock()
        db_mock.query.return_value.filter.return_value.first.return_value = None
        db_mock.query.return_value.filter.return_value.order_by.return_value.first.return_value = None

        req = VoiceQueryRequest(query="Tell me about farming", language="en")
        res = await voice_service.process_query(req, mock_farmer_user, db_mock)

        assert res.mode == "basic"
        assert res.upstream_status == "Basic mode (no AI key)"


def test_keys_never_appear_in_startup_logs(caplog):
    """Confirm startup logging only records boolean presence and order, never secrets."""
    with caplog.at_level(logging.INFO), \
         patch.object(settings, "GROQ_API_KEY", "SUPER_SECRET_GROQ_KEY_999"), \
         patch.object(settings, "GEMINI_API_KEY", "SUPER_SECRET_GEMINI_KEY_888"):

        log_llm_startup_status()

        log_output = caplog.text
        assert "SUPER_SECRET_GROQ_KEY_999" not in log_output
        assert "SUPER_SECRET_GEMINI_KEY_888" not in log_output
        assert "groq=True" in log_output
        assert "gemini=True" in log_output
