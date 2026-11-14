"""
AgriSage AI — Pluggable Multi-Provider LLM Client Layer
Supports Groq (OpenAI-compatible) and Google Gemini with automatic failover.
Reads API keys, models, and provider order strictly from configuration / .env.
Never hardcodes model names in logic.
Never logs, returns, or leaks API keys.
"""

import logging
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import httpx

from backend.app.config import settings

logger = logging.getLogger("agrisage.llm")


@dataclass
class LLMResponse:
    text: str
    provider: str  # "Groq" or "Gemini"
    model: str
    status_label: str  # "AI connected (Groq)" or "AI connected (Gemini)"
    privacy_notice: str


def log_llm_startup_status() -> None:
    """
    Safe startup logging: records only boolean configuration status and provider order.
    Never logs or exposes API keys.
    """
    providers = [p.strip().lower() for p in settings.LLM_PROVIDER_ORDER.split(",") if p.strip()]
    msg = f"LLM Providers configured: groq={bool(settings.GROQ_API_KEY)}, gemini={bool(settings.GEMINI_API_KEY)}, order={providers}"
    logger.info(msg)
    print(f"INFO:     {msg}")


async def call_groq_chat(
    system_instruction: str,
    user_prompt: str,
    history: Optional[List[Dict[str, Any]]] = None,
    timeout: float = 8.0,
) -> Optional[LLMResponse]:
    """
    Queries Groq via its OpenAI-compatible chat completions endpoint.
    Handles rate limits (429), timeouts, and HTTP errors gracefully.
    """
    if not settings.GROQ_API_KEY:
        return None

    model = settings.GROQ_MODEL
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    messages: List[Dict[str, str]] = [{"role": "system", "content": system_instruction}]

    if history:
        for turn in history[-6:]:
            role = turn.get("role", "user")
            content = turn.get("content") or turn.get("text") or ""
            if content:
                mapped_role = "assistant" if role in ["assistant", "model"] else "user"
                messages.append({"role": mapped_role, "content": str(content)})

    messages.append({"role": "user", "content": user_prompt})

    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 1024,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 429:
                logger.warning("Groq rate limit (429) hit; falling through to next provider.")
                return None
            if resp.status_code != 200:
                err_detail = ""
                try:
                    err_json = resp.json()
                    err_detail = err_json.get("error", {}).get("message", "")
                except Exception:
                    pass
                logger.warning("Groq responded with status %s: %s; falling through.", resp.status_code, err_detail)
                return None

            data = resp.json()
            choices = data.get("choices", [])
            if not choices:
                return None
            content = choices[0].get("message", {}).get("content", "").strip()
            if not content:
                return None

            return LLMResponse(
                text=content,
                provider="Groq",
                model=model,
                status_label="AI connected (Groq)",
                privacy_notice="Farm context is securely sent to Groq to generate tailored answers.",
            )
    except httpx.TimeoutException:
        logger.warning("Groq request timed out (%ss); falling through.", timeout)
        return None
    except Exception as exc:
        logger.warning("Groq request failed (%s); falling through.", type(exc).__name__)
        return None


async def call_gemini_chat(
    system_instruction: str,
    user_prompt: str,
    history: Optional[List[Dict[str, Any]]] = None,
    timeout: float = 8.0,
) -> Optional[LLMResponse]:
    """
    Queries Google Gemini REST API.
    Handles rate limits (429), timeouts, and HTTP errors gracefully.
    """
    if not settings.GEMINI_API_KEY:
        return None

    model = settings.GEMINI_MODEL
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}

    contents: List[Dict[str, Any]] = []
    if history:
        for turn in history[-6:]:
            role = turn.get("role", "user")
            content = turn.get("content") or turn.get("text") or ""
            if content:
                gemini_role = "model" if role in ["assistant", "model"] else "user"
                contents.append({"role": gemini_role, "parts": [{"text": str(content)}]})

    contents.append({"role": "user", "parts": [{"text": user_prompt}]})

    payload = {
        "system_instruction": {"parts": [{"text": system_instruction}]},
        "contents": contents,
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 1024,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code == 429:
                logger.warning("Gemini rate limit (429) hit; falling through to next provider.")
                return None
            if resp.status_code != 200:
                err_detail = ""
                try:
                    err_json = resp.json()
                    err_detail = err_json.get("error", {}).get("message", "")
                except Exception:
                    pass
                logger.warning("Gemini responded with status %s: %s; falling through.", resp.status_code, err_detail)
                return None

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return None
            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                return None
            content = parts[0].get("text", "").strip()
            if not content:
                return None

            return LLMResponse(
                text=content,
                provider="Gemini",
                model=model,
                status_label="AI connected (Gemini)",
                privacy_notice="Farm context is securely sent to Google to generate tailored answers.",
            )
    except httpx.TimeoutException:
        logger.warning("Gemini request timed out (%ss); falling through.", timeout)
        return None
    except Exception as exc:
        logger.warning("Gemini request failed (%s); falling through.", type(exc).__name__)
        return None


async def generate_chat_completion(
    system_instruction: str,
    user_prompt: str,
    history: Optional[List[Dict[str, Any]]] = None,
    timeout: float = 8.0,
) -> Optional[LLMResponse]:
    """
    Iterates through configured providers in LLM_PROVIDER_ORDER.
    Falls through on failure (429, timeout, error) to the next provider.
    Returns None if all fail or no keys are set, triggering deterministic Basic mode.
    """
    providers = [p.strip().lower() for p in settings.LLM_PROVIDER_ORDER.split(",") if p.strip()]

    for provider in providers:
        if provider == "groq":
            res = await call_groq_chat(
                system_instruction=system_instruction,
                user_prompt=user_prompt,
                history=history,
                timeout=timeout,
            )
            if res:
                return res
        elif provider == "gemini":
            res = await call_gemini_chat(
                system_instruction=system_instruction,
                user_prompt=user_prompt,
                history=history,
                timeout=timeout,
            )
            if res:
                return res

    return None
