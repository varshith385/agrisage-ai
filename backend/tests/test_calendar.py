"""
Unit Tests for Crop Lifecycle, Calendar Generator, RFC 5545 Exporter, and Seasonal Awareness
"""

from datetime import date
import re
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services.calendar_service import (
    generate_crop_calendar,
    generate_rfc5545_ics,
    get_seasonal_awareness,
)

client = TestClient(app)


def test_crop_calendar_generation_and_stages():
    """Verifies that calendar generator builds 7 lifecycle stages and dated operational events."""
    planting_date = date(2026, 8, 15)
    cal = generate_crop_calendar("Cotton", planting_date)

    assert cal.crop_name == "Cotton"
    assert cal.total_duration_days == 180
    assert len(cal.lifecycle_stages) == 7

    # Stage order
    stage_ids = [s.stage_id for s in cal.lifecycle_stages]
    assert stage_ids == [
        "pre_sowing",
        "sowing",
        "vegetative",
        "flowering_fruiting",
        "harvest",
        "post_harvest",
        "sale",
    ]

    # Events
    assert len(cal.events) >= 8
    event_types = {e.event_type for e in cal.events}
    assert "sowing" in event_types
    assert "scouting" in event_types
    assert "irrigation" in event_types
    assert "harvest" in event_types

    # First event should start on planting date
    sow_evt = next(e for e in cal.events if e.event_type == "sowing")
    assert sow_evt.start_date == "2026-08-15"


def test_rfc5545_ics_export_validity():
    """
    Verifies that the generated .ics file complies with the RFC 5545 iCalendar specification:
    - Starts with BEGIN:VCALENDAR and ends with END:VCALENDAR
    - Includes VERSION:2.0 and PRODID
    - Contains VEVENT blocks with required UID, DTSTAMP, DTSTART, SUMMARY
    - Uses strict CRLF (\\r\\n) line endings
    """
    planting_date = date(2026, 8, 15)
    ics_text = generate_rfc5545_ics("Cotton", planting_date)

    # 1. CRLF line endings check
    assert "\r\n" in ics_text
    lines = ics_text.split("\r\n")

    # 2. VCALENDAR envelope
    assert lines[0] == "BEGIN:VCALENDAR"
    assert "VERSION:2.0" in lines
    assert any(l.startswith("PRODID:") for l in lines)
    assert lines[-2] == "END:VCALENDAR"

    # 3. VEVENT structures
    vevent_starts = [i for i, l in enumerate(lines) if l == "BEGIN:VEVENT"]
    vevent_ends = [i for i, l in enumerate(lines) if l == "END:VEVENT"]
    assert len(vevent_starts) > 0
    assert len(vevent_starts) == len(vevent_ends)

    # 4. Mandatory VEVENT fields per RFC 5545
    for start_idx, end_idx in zip(vevent_starts, vevent_ends):
        event_lines = lines[start_idx:end_idx]
        assert any(l.startswith("UID:") for l in event_lines)
        assert any(l.startswith("DTSTAMP:") for l in event_lines)
        assert any(l.startswith("DTSTART") for l in event_lines)
        assert any(l.startswith("SUMMARY:") for l in event_lines)
        assert any(l.startswith("STATUS:") for l in event_lines)


def test_seasonal_awareness_detection():
    """Verifies seasonal awareness rules for Kharif, Rabi, and Zaid."""
    # July -> Kharif
    kharif = get_seasonal_awareness(month=7)
    assert kharif.current_season == "Kharif"
    assert "Cotton" in kharif.typical_crops
    assert any("monsoon" in r.lower() or "inundation" in r.lower() for r in kharif.primary_risks)

    # November -> Rabi
    rabi = get_seasonal_awareness(month=11)
    assert rabi.current_season == "Rabi"
    assert any("chickpea" in c.lower() or "wheat" in c.lower() for c in rabi.typical_crops)

    # April -> Zaid
    zaid = get_seasonal_awareness(month=4)
    assert zaid.current_season == "Zaid"
    assert any("melon" in c.lower() or "cucumber" in c.lower() for c in zaid.typical_crops)
    assert any("heat" in r.lower() or "vapor" in r.lower() for r in zaid.primary_risks)


def test_api_calendar_endpoints(farmer_headers):
    """Verifies /api/v1/calendar/events, /export.ics, and /season endpoints."""
    # Events
    r_evt = client.get("/api/v1/calendar/events?crop_name=Cotton&planting_date=2026-08-15", headers=farmer_headers)
    assert r_evt.status_code == 200
    data = r_evt.json()
    assert data["crop_name"] == "Cotton"
    assert len(data["events"]) >= 8

    # ICS Export
    r_ics = client.get("/api/v1/calendar/export.ics?crop_name=Cotton&planting_date=2026-08-15", headers=farmer_headers)
    assert r_ics.status_code == 200
    assert "text/calendar" in r_ics.headers.get("content-type", "")
    assert "BEGIN:VCALENDAR" in r_ics.text
    assert "END:VCALENDAR" in r_ics.text

    # Season
    r_sea = client.get("/api/v1/calendar/season?month=8", headers=farmer_headers)
    assert r_sea.status_code == 200
    sea_data = r_sea.json()
    assert sea_data["current_season"] == "Kharif"
