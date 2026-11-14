"""
AgriSage AI — Deterministic Voice Command Date/Time Parser for Reminders
Parses natural farmer speech into exact Asia/Kolkata timestamps with localized confirmations.
Supports English, Telugu (తెలుగు), and Hindi (हिन्दी).
"""

import re
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional

KOLKATA_OFFSET = timedelta(hours=5, minutes=30)
KOLKATA_TZ = timezone(KOLKATA_OFFSET, name="Asia/Kolkata")

WEEKDAYS = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6,
    "సోమవారం": 0, "మంగళవారం": 1, "బుధవారం": 2, "గురువారం": 3, "శుక్రవారం": 4, "శనివారం": 5, "ఆదివారం": 6,
    "सोमवार": 0, "मंगलवार": 1, "बुधवार": 2, "गुरुवार": 3, "शुक्रवार": 4, "शनिवार": 5, "रविवार": 6,
}


def parse_reminder_voice_command(
    query: str, lang: str = "en"
) -> Optional[Tuple[str, datetime, str]]:
    """
    Parses a voice reminder command.
    Returns:
        (title, due_at_utc, spoken_confirmation) if successfully parsed, else None.
    """
    q = query.strip()
    q_lower = q.lower()

    # 1. Verify that this query is actually a reminder intent
    trigger_patterns = [
        "remind me to", "remind me", "set a reminder", "add a reminder", "create reminder",
        "గుర్తు చేయి", "రిమైండర్ పెట్టు", "రిమైండర్ జోడించు", "గుర్తుచేయి",
        "याद दिलाना", "रिमाइंडर लगाओ", "रिमाइंडर जोड़ें", "याद दिलाओ"
    ]
    matched_trigger = False
    for pat in trigger_patterns:
        if pat in q_lower:
            matched_trigger = True
            break

    if not matched_trigger:
        return None

    # Base reference time in Asia/Kolkata
    now_utc = datetime.now(timezone.utc)
    now_kolkata = now_utc.astimezone(KOLKATA_TZ)
    target_date = now_kolkata.date()
    target_hour = 8
    target_minute = 0

    # 2. Date determination
    if "day after tomorrow" in q_lower or "ఎల్లుండి" in q_lower or "परसों" in q_lower:
        target_date = target_date + timedelta(days=2)
    elif "tomorrow" in q_lower or "రేపు" in q_lower or "कल" in q_lower:
        target_date = target_date + timedelta(days=1)
    elif "today" in q_lower or "ఈరోజు" in q_lower or "आज" in q_lower:
        target_date = target_date
    else:
        # Check "in N days"
        in_days_m = re.search(r"in\s+(\d+)\s+days?", q_lower) or re.search(r"(\d+)\s*రోజుల్లో", q_lower) or re.search(r"(\d+)\s*दिन", q_lower)
        if in_days_m:
            target_date = target_date + timedelta(days=int(in_days_m.group(1)))
        else:
            # Check weekday (e.g. on Monday)
            found_wd = None
            for wd_name, wd_idx in WEEKDAYS.items():
                if wd_name in q_lower:
                    found_wd = wd_idx
                    break
            if found_wd is not None:
                days_ahead = (found_wd - target_date.weekday() + 7) % 7
                if days_ahead == 0:
                    days_ahead = 7
                target_date = target_date + timedelta(days=days_ahead)
            else:
                # Default to tomorrow morning
                target_date = target_date + timedelta(days=1)

    # 3. Time of day determination
    if "morning" in q_lower or "ఉదయం" in q_lower or "सुबह" in q_lower:
        target_hour = 6
        target_minute = 0
    elif "evening" in q_lower or "సాయంత్రం" in q_lower or "शाम" in q_lower:
        target_hour = 17
        target_minute = 0
    elif "afternoon" in q_lower or "మధ్యాహ్నం" in q_lower or "दोपहर" in q_lower:
        target_hour = 14
        target_minute = 0
    elif "noon" in q_lower:
        target_hour = 12
        target_minute = 0

    # Explicit hour match (e.g. 6 am, 7 pm, 10 am)
    time_match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)", q_lower)
    if time_match:
        h = int(time_match.group(1))
        m = int(time_match.group(2) or 0)
        meridiem = time_match.group(3).lower()
        if meridiem == "pm" and h < 12:
            h += 12
        elif meridiem == "am" and h == 12:
            h = 0
        target_hour = h
        target_minute = m

    target_dt_kolkata = datetime(
        target_date.year, target_date.month, target_date.day,
        target_hour, target_minute, 0, tzinfo=KOLKATA_TZ
    )
    # Convert to UTC naive datetime for DB storage
    target_dt_utc = target_dt_kolkata.astimezone(timezone.utc).replace(tzinfo=None)

    # 4. Extract task title
    cleaned_title = q
    # Strip triggers
    for p in trigger_patterns:
        cleaned_title = re.sub(re.escape(p), "", cleaned_title, flags=re.IGNORECASE)
    # Strip date/time keywords
    date_words = [
        "day after tomorrow", "tomorrow", "today", "morning", "evening", "afternoon", "noon",
        "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
        "on", "at", "to", "for", "in",
        "ఎల్లుండి", "రేపు", "ఈరోజు", "ఉదయం", "సాయంత్రం", "మధ్యాహ్నం",
        "సోమవారం", "మంగళవారం", "బుధవారం", "గురువారం", "శుక్రవారం", "శనివారం", "ఆదివారం",
        "परसों", "कल", "आज", "सुबह", "शाम", "दोपहर",
        "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार", "रविवार"
    ]
    for dw in date_words:
        cleaned_title = re.sub(rf"\b{re.escape(dw)}\b", "", cleaned_title, flags=re.IGNORECASE)

    # Clean up punctuation and whitespace
    cleaned_title = re.sub(r"[\.,!\?]", "", cleaned_title).strip()
    if not cleaned_title:
        cleaned_title = {
            "te": "వ్యవసాయ పని జ్ఞాపిక",
            "hi": "कृषि कार्य स्मरणपत्र",
            "en": "Farm Task"
        }.get(lang, "Farm Task")

    # Capitalize title
    cleaned_title = cleaned_title[0].upper() + cleaned_title[1:] if len(cleaned_title) > 0 else "Farm Task"

    # 5. Format localized spoken confirmation
    formatted_date = target_dt_kolkata.strftime("%d %b, %I:%M %p")
    if lang == "te":
        spoken_text = f"జ్ఞాపిక నమోదు చేయబడింది: '{cleaned_title}', తేదీ {formatted_date}."
    elif lang == "hi":
        spoken_text = f"स्मरणपत्र दर्ज किया गया: '{cleaned_title}', समय {formatted_date}।"
    else:
        spoken_text = f"Reminder scheduled: '{cleaned_title}' for {formatted_date} (Asia/Kolkata)."

    return cleaned_title, target_dt_utc, spoken_text
