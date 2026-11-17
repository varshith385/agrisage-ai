"""
Grow2Gain — Brand & Identity Consistency Test Suite
Scans frontend/src, frontend/index.html, frontend/public (if exists), and backend response/prompt strings.
FAILS if user-visible text contains 'AgriSage' or 'Yuktik'.
Allowed internal identifiers are explicitly documented with reasons below.
"""

import os
import re
from pathlib import Path
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# Allowed internal technical identifiers and their reasons:
ALLOWED_INTERNAL_IDENTIFIERS = {
    # 1. LocalStorage / SessionStorage keys: preserved so existing users are not logged out and settings persist
    "agrisage_token": "Preserved localStorage JWT auth key so existing logged-in farmers are not logged out.",
    "agrisage_user": "Preserved localStorage user profile cache.",
    "agrisage_active_farm_id": "Preserved localStorage selected farm ID across navigations.",
    "agrisage_active_farm": "Preserved localStorage cached active farm details.",
    "agrisage_last_irrigation_plan": "Preserved localStorage cached FAO-56 irrigation plan.",
    "agrisage_location": "Preserved localStorage cached GPS coordinate payload.",
    "agrisage_active_crop": "Preserved localStorage active crop name.",
    "agrisage_tour_completed_v1": "Preserved localStorage flag for guided tour completion.",
    "agrisage_visual_choice_v1": "Preserved localStorage choice between words and pictorial modes.",
    "agrisage_sidebar_collapsed": "Preserved localStorage sidebar layout state.",
    "agrisage_pictorial_mode": "Preserved localStorage pictorial UI mode toggle.",
    "agrisage_always_show_listen": "Preserved localStorage persistent TTS listen button toggle.",
    "agrisage_theme": "Preserved localStorage dark/light theme setting.",
    "agrisage_lang": "Preserved localStorage language preference setting.",
    # 2. Internal DOM IDs / Custom Events:
    "agrisage-command-palette-btn": "Internal DOM element id for shortcut trigger.",
    "agrisage:start-tour": "Internal browser CustomEvent name for dispatching the guided tour.",
    # 3. Internal repo / package / DB / logger identifiers:
    "agrisage-ai": "GitHub repository slug in User-Agent header.",
    "agrisage-frontend": "Package.json npm package name (internal package descriptor).",
    "agrisage.db": "SQLite database file name on disk.",
    "agrisage.llm": "Python logging module hierarchy identifier.",
    "agrisage.demo": "Internal demo user account email domain (e.g., ramesh@agrisage.demo).",
    "agrisage.com": "Mock email domain used strictly in automated test fixtures.",
    "agrisage.internal": "Internal test fixture email domain.",
    "agrisage.local": "Internal UID suffix for calendar reminders.",
    "agrisage_insecure_development_secret_change_me_in_production": "Internal fallback JWT secret in config.",
}


def _strip_allowed_identifiers(line: str) -> str:
    cleaned = line
    for ident in ALLOWED_INTERNAL_IDENTIFIERS:
        cleaned = re.sub(re.escape(ident), "", cleaned, flags=re.IGNORECASE)
    return cleaned


def test_no_agrisage_or_yuktik_in_frontend():
    """Ensures no user-visible AgriSage or Yuktik exists in frontend/src, frontend/index.html, frontend/public."""
    frontend_dir = PROJECT_ROOT / "frontend"
    scan_paths = [frontend_dir / "index.html"]

    src_dir = frontend_dir / "src"
    if src_dir.exists():
        for root, _, files in os.walk(src_dir):
            for file in files:
                scan_paths.append(Path(root) / file)

    pub_dir = frontend_dir / "public"
    if pub_dir.exists():
        for root, _, files in os.walk(pub_dir):
            for file in files:
                scan_paths.append(Path(root) / file)

    violations = []
    for file_path in scan_paths:
        if (
            not file_path.exists()
            or file_path.suffix.lower() in [".png", ".jpg", ".jpeg", ".ico", ".svg", ".lock"]
            or file_path.name == "BrandConsistency.test.ts"
        ):
            continue
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                for line_idx, line in enumerate(f, 1):
                    cleaned = _strip_allowed_identifiers(line)
                    if re.search(r"agrisage|yuktik", cleaned, re.IGNORECASE):
                        violations.append(f"{file_path.relative_to(PROJECT_ROOT)}:{line_idx}: {line.strip()}")
        except Exception:
            pass

    assert not violations, f"Found {len(violations)} brand violations in frontend:\n" + "\n".join(violations)


def test_no_agrisage_or_yuktik_in_backend_responses_and_prompts():
    """Ensures no AgriSage or Yuktik exists in backend response strings, prompt templates, and API endpoints."""
    backend_targets = [
        PROJECT_ROOT / "backend" / "app" / "main.py",
        PROJECT_ROOT / "backend" / "app" / "keywords" / "en.py",
        PROJECT_ROOT / "backend" / "app" / "keywords" / "te.py",
        PROJECT_ROOT / "backend" / "app" / "keywords" / "hi.py",
        PROJECT_ROOT / "backend" / "app" / "services" / "voice_service.py",
        PROJECT_ROOT / "backend" / "app" / "services" / "intent_router.py",
        PROJECT_ROOT / "backend" / "app" / "services" / "calendar_service.py",
        PROJECT_ROOT / "backend" / "app" / "services" / "market_service.py",
        PROJECT_ROOT / "backend" / "app" / "agents" / "advisory_agent.py",
    ]

    violations = []
    for file_path in backend_targets:
        if not file_path.exists():
            continue
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for line_idx, line in enumerate(f, 1):
                cleaned = _strip_allowed_identifiers(line)
                if re.search(r"agrisage|yuktik", cleaned, re.IGNORECASE):
                    violations.append(f"{file_path.relative_to(PROJECT_ROOT)}:{line_idx}: {line.strip()}")

    assert not violations, f"Found {len(violations)} brand violations in backend responses/prompts:\n" + "\n".join(violations)
