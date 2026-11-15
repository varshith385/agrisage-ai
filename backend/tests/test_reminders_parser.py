"""
Tests for Voice Reminder Parser (Asia/Kolkata) & Confirmation Flow
Verifies:
1. "in 2 hours"
2. "tomorrow 6 am"
3. "at 6 pm" when it is already 7 pm (rolls forward to tomorrow 6 pm)
4. "midnight" (00:00 upcoming)
5. Unparseable phrase returns None
6. Voice reminders ask for a yes before saving
7. Replying 'yes' confirms and persists to DB
"""

from datetime import datetime, timezone, timedelta
import pytest
from unittest.mock import MagicMock

from backend.app.services.reminder_parser import parse_reminder_voice_command, KOLKATA_TZ
from backend.app.services.voice_service import voice_service
from backend.app.schemas.voice import VoiceQueryRequest
from backend.app.models.user import User, UserRole, Language
from backend.app.models.reminder import Reminder


@pytest.fixture
def mock_farmer():
    return User(
        id=101,
        email="reminder_farmer@agrisage.internal",
        full_name="Farmer Ramesh",
        role=UserRole.FARMER,
        preferred_language=Language.EN,
        is_active=True,
    )


def test_parser_in_2_hours():
    # Fixed reference time: 2026-11-14 10:00 AM Kolkata
    ref_time = datetime(2026, 11, 14, 10, 0, 0, tzinfo=KOLKATA_TZ)
    result = parse_reminder_voice_command("remind me to check drip filter in 2 hours", lang="en", reference_time=ref_time)

    assert result is not None
    title, due_at_utc, prompt = result
    assert "Check drip filter" in title
    # Due time should be 12:00 PM Kolkata = 06:30 AM UTC
    due_at_kolkata = due_at_utc.replace(tzinfo=timezone.utc).astimezone(KOLKATA_TZ)
    assert due_at_kolkata.hour == 12
    assert due_at_kolkata.minute == 0
    assert "Would you like me to schedule a reminder" in prompt


def test_parser_tomorrow_6_am():
    ref_time = datetime(2026, 11, 14, 15, 0, 0, tzinfo=KOLKATA_TZ)
    result = parse_reminder_voice_command("remind me to irrigate field tomorrow 6 am", lang="en", reference_time=ref_time)

    assert result is not None
    title, due_at_utc, prompt = result
    assert "Irrigate field" in title
    due_at_kolkata = due_at_utc.replace(tzinfo=timezone.utc).astimezone(KOLKATA_TZ)
    assert due_at_kolkata.date() == ref_time.date() + timedelta(days=1)
    assert due_at_kolkata.hour == 6
    assert due_at_kolkata.minute == 0


def test_parser_at_6_pm_when_already_7_pm():
    """When user says 'at 6 pm' but it is already 7 pm (19:00), parser rolls forward to tomorrow 6 pm."""
    ref_time = datetime(2026, 11, 14, 19, 0, 0, tzinfo=KOLKATA_TZ)  # 7:00 PM
    result = parse_reminder_voice_command("remind me to spray neem oil at 6 pm", lang="en", reference_time=ref_time)

    assert result is not None
    title, due_at_utc, prompt = result
    assert "Spray neem oil" in title
    due_at_kolkata = due_at_utc.replace(tzinfo=timezone.utc).astimezone(KOLKATA_TZ)
    # Must be tomorrow 6:00 PM (18:00)
    assert due_at_kolkata.date() == ref_time.date() + timedelta(days=1)
    assert due_at_kolkata.hour == 18
    assert due_at_kolkata.minute == 0


def test_parser_midnight():
    ref_time = datetime(2026, 11, 14, 14, 0, 0, tzinfo=KOLKATA_TZ)
    result = parse_reminder_voice_command("remind me to check borewell pump at midnight", lang="en", reference_time=ref_time)

    assert result is not None
    title, due_at_utc, prompt = result
    assert "Check borewell pump" in title
    due_at_kolkata = due_at_utc.replace(tzinfo=timezone.utc).astimezone(KOLKATA_TZ)
    # Midnight is 00:00 of the upcoming day
    assert due_at_kolkata.hour == 0
    assert due_at_kolkata.minute == 0
    assert due_at_kolkata.date() == ref_time.date() + timedelta(days=1)


def test_parser_unparseable_phrase():
    result = parse_reminder_voice_command("what is the weather in Hyderabad today?", lang="en")
    assert result is None

    result2 = parse_reminder_voice_command("random conversation about cotton prices", lang="en")
    assert result2 is None


def test_parser_title_cleaning_water():
    """Verify 'remind me tomorrow 6 am to water' yields clean task title 'Water', not 'Morrow water'."""
    ref_time = datetime(2026, 11, 14, 15, 0, 0, tzinfo=KOLKATA_TZ)
    result = parse_reminder_voice_command("remind me tomorrow 6 am to water", lang="en", reference_time=ref_time)
    assert result is not None
    title, due_at_utc, prompt = result
    assert title == "Water"


def test_parser_telugu_tomorrow_6_am():
    """Verify Telugu voice reminder command parsing for tomorrow 6 AM with confirmation prompt."""
    ref_time = datetime(2026, 11, 14, 15, 0, 0, tzinfo=KOLKATA_TZ)
    result = parse_reminder_voice_command("రేపు ఉదయం 6 గంటలకు పత్తికి నీరు పెట్టాలని గుర్తు చేయండి", lang="te", reference_time=ref_time)
    assert result is not None
    title, due_at_utc, prompt = result
    assert "పత్తికి నీరు పెట్టాలని" in title
    due_at_kolkata = due_at_utc.replace(tzinfo=timezone.utc).astimezone(KOLKATA_TZ)
    assert due_at_kolkata.date() == ref_time.date() + timedelta(days=1)
    assert due_at_kolkata.hour == 6
    assert due_at_kolkata.minute == 0
    assert "మీరు ఈ జ్ఞాపిక షెడ్యూల్ చేయాలనుకుంటున్నారా" in prompt
    assert "నిర్ధారణ తర్వాత మాత్రమే" in prompt


def test_parser_hindi_tomorrow_6_am():
    """Verify Hindi voice reminder command parsing for tomorrow 6 AM with confirmation prompt."""
    ref_time = datetime(2026, 11, 14, 15, 0, 0, tzinfo=KOLKATA_TZ)
    result = parse_reminder_voice_command("कल सुबह 6 बजे कपास में पानी देने का स्मरण कराएं", lang="hi", reference_time=ref_time)
    assert result is not None
    title, due_at_utc, prompt = result
    assert "कपास में पानी देने" in title
    due_at_kolkata = due_at_utc.replace(tzinfo=timezone.utc).astimezone(KOLKATA_TZ)
    assert due_at_kolkata.date() == ref_time.date() + timedelta(days=1)
    assert due_at_kolkata.hour == 6
    assert due_at_kolkata.minute == 0
    assert "क्या आप यह स्मरणपत्र जोड़ना चाहते हैं" in prompt
    assert "पुष्टि के बाद ही" in prompt


@pytest.mark.asyncio
async def test_voice_reminder_asks_yes_before_saving(mock_farmer):
    """Voice reminder command MUST prompt for confirmation rather than saving immediately."""
    db_mock = MagicMock()

    req = VoiceQueryRequest(
        query="remind me to weed the cotton rows tomorrow 6 am",
        language="en"
    )

    res = await voice_service.process_query(req, mock_farmer, db_mock)

    assert res.intent == "reminder_confirm"
    assert res.action_type == "confirm_reminder"
    assert "Would you like me to schedule a reminder" in res.spoken_text
    assert "Reply 'Yes' to confirm" in res.spoken_text
    # Verify it was NOT saved to DB on first turn!
    db_mock.add.assert_not_called()
    db_mock.commit.assert_not_called()


@pytest.mark.asyncio
async def test_voice_reminder_telugu_asks_confirmation(mock_farmer):
    """Telugu voice reminder command MUST prompt for confirmation in Telugu rather than saving immediately."""
    db_mock = MagicMock()
    mock_farmer.preferred_language = Language.TE

    req = VoiceQueryRequest(
        query="రేపు ఉదయం 6 గంటలకు పత్తికి నీరు పెట్టాలని గుర్తు చేయండి",
        language="te"
    )

    res = await voice_service.process_query(req, mock_farmer, db_mock)

    assert res.intent == "reminder_confirm"
    assert res.action_type == "confirm_reminder"
    assert "మీరు ఈ జ్ఞాపిక షెడ్యూల్ చేయాలనుకుంటున్నారా" in res.spoken_text
    assert "నిర్ధారణ తర్వాత మాత్రమే" in res.spoken_text
    assert "పత్తికి నీరు పెట్టాలని" in res.spoken_text
    db_mock.add.assert_not_called()
    db_mock.commit.assert_not_called()


@pytest.mark.asyncio
async def test_voice_reminder_hindi_asks_confirmation(mock_farmer):
    """Hindi voice reminder command MUST prompt for confirmation in Hindi rather than saving immediately."""
    db_mock = MagicMock()
    mock_farmer.preferred_language = Language.HI

    req = VoiceQueryRequest(
        query="कल सुबह 6 बजे कपास में पानी देने का स्मरण कराएं",
        language="hi"
    )

    res = await voice_service.process_query(req, mock_farmer, db_mock)

    assert res.intent == "reminder_confirm"
    assert res.action_type == "confirm_reminder"
    assert "क्या आप यह स्मरणपत्र जोड़ना चाहते हैं" in res.spoken_text
    assert "पुष्टि के बाद ही" in res.spoken_text
    assert "कपास में पानी देने" in res.spoken_text
    db_mock.add.assert_not_called()
    db_mock.commit.assert_not_called()


@pytest.mark.asyncio
async def test_voice_reminder_confirm_yes_saves_to_db(mock_farmer):
    """When user replies 'yes' in the following turn, reminder is saved to DB."""
    db_mock = MagicMock()

    # Turn 2: User says "Yes, save reminder" with previous history asking for confirmation
    history = [
        {"role": "user", "content": "remind me to weed the cotton rows tomorrow 6 am"},
        {
            "role": "assistant",
            "content": "Would you like me to schedule a reminder: 'Weed the cotton rows' for 15 Nov, 06:00 AM (Asia/Kolkata)? Reply 'Yes' to confirm.",
        }
    ]

    req = VoiceQueryRequest(
        query="Yes",
        language="en",
        history=history
    )

    res = await voice_service.process_query(req, mock_farmer, db_mock)

    assert res.intent == "reminder_saved"
    assert "Reminder saved successfully" in res.spoken_text
    assert "Weed the cotton rows" in res.spoken_text
    # Verify it WAS saved to DB upon yes confirmation
    db_mock.add.assert_called_once()
    db_mock.commit.assert_called_once()
