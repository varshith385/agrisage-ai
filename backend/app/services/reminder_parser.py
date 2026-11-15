"""
AgriSage AI — Deterministic Voice Command Date/Time Parser for Reminders
Parses natural farmer speech into exact Asia/Kolkata timestamps with localized confirmations.
Supports English, Telugu (తెలుగు), and Hindi (हिन्दी).
Confirmed strictly in Asia/Kolkata timezone (UTC+05:30).
"""

import re
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

KOLKATA_OFFSET = timedelta(hours=5, minutes=30)
KOLKATA_TZ = timezone(KOLKATA_OFFSET, name="Asia/Kolkata")

WEEKDAYS = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6,
    "సోమవారం": 0, "మంగళవారం": 1, "బుధవారం": 2, "గురువారం": 3, "శుక్రవారం": 4, "శనివారం": 5, "ఆదివారం": 6,
    "सोमवार": 0, "मंगलवार": 1, "बुधवार": 2, "गुरुवार": 3, "शुक्रवार": 4, "शनिवार": 5, "रविवार": 6,
}


def parse_reminder_voice_command(
    query: str,
    lang: str = "en",
    reference_time: Optional[datetime] = None,
) -> Optional[Tuple[str, datetime, str]]:
    """
    Parses a voice reminder command.
    Uses Asia/Kolkata as the base timezone.
    Returns:
        (title, due_at_utc, confirmation_prompt) if successfully parsed, else None.
    """
    q = query.strip()
    q_lower = q.lower()

    # 1. Verify trigger pattern
    trigger_patterns = [
        "remind me to", "remind me", "set a reminder", "add a reminder", "create reminder",
        "schedule a reminder", "schedule reminder",
        "గుర్తు చేయండి", "గుర్తుచేయండి", "గుర్తు చేయి", "గుర్తుచేయి", "జ్ఞాపిక ఉంచండి", "జ్ఞాపిక",
        "రిమైండర్ పెట్టండి", "రిమైండర్ పెట్టు", "రిమైండర్ జోడించండి", "రిమైండర్ జోడించు",
        "యాడ్ రిమైండర్", "రిమైండర్",
        "का स्मरण कराएं", "स्मरण कराएं", "स्मरण दिलाएं", "स्मरण कराओ", "स्मरण दिलाओ",
        "याद दिलाएं", "याद दिलाना", "याद दिलाओ", "याद कराएं", "स्मरण पत्र", "स्मरण",
        "रिमाइंडर लगाएं", "रिमाइंडर लगाओ", "रिमाइंडर जोड़ें", "रिमाइंडर"
    ]
    matched_trigger = False
    for pat in trigger_patterns:
        if pat in q_lower:
            matched_trigger = True
            break

    if not matched_trigger:
        return None

    # Reference time in Asia/Kolkata
    if reference_time is not None:
        if reference_time.tzinfo is not None:
            now_kolkata = reference_time.astimezone(KOLKATA_TZ)
        else:
            now_kolkata = reference_time.replace(tzinfo=KOLKATA_TZ)
    else:
        now_kolkata = datetime.now(timezone.utc).astimezone(KOLKATA_TZ)

    target_date = now_kolkata.date()
    target_hour = 8
    target_minute = 0
    is_relative_hours = False
    explicit_day_specified = False

    # Check relative hours first: "in 2 hours", "in 3 hours", "గంటల్లో", "घंटे में"
    in_hours_m = (
        re.search(r"in\s+(\d+)\s+hours?", q_lower)
        or re.search(r"(\d+)\s*hours?", q_lower)
        or re.search(r"(\d+)\s*గంటల్లో", q_lower)
        or re.search(r"(\d+)\s*घंटे", q_lower)
    )
    if in_hours_m:
        h_ahead = int(in_hours_m.group(1))
        target_dt_kolkata = now_kolkata + timedelta(hours=h_ahead)
        target_date = target_dt_kolkata.date()
        target_hour = target_dt_kolkata.hour
        target_minute = target_dt_kolkata.minute
        is_relative_hours = True
        explicit_day_specified = True

    if not is_relative_hours:
        # Check date
        if "day after tomorrow" in q_lower or "ఎల్లుండి" in q_lower or "परसों" in q_lower:
            target_date = target_date + timedelta(days=2)
            explicit_day_specified = True
        elif "tomorrow" in q_lower or "రేపు" in q_lower or "कल" in q_lower:
            target_date = target_date + timedelta(days=1)
            explicit_day_specified = True
        elif "today" in q_lower or "ఈరోజు" in q_lower or "आज" in q_lower:
            target_date = target_date
            explicit_day_specified = True
        else:
            # Check "in N days"
            in_days_m = (
                re.search(r"in\s+(\d+)\s+days?", q_lower)
                or re.search(r"(\d+)\s*రోజుల్లో", q_lower)
                or re.search(r"(\d+)\s*दिन", q_lower)
            )
            if in_days_m:
                target_date = target_date + timedelta(days=int(in_days_m.group(1)))
                explicit_day_specified = True
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
                    explicit_day_specified = True

        # Check time of day
        if "midnight" in q_lower or "అర్థరాత్రి" in q_lower or "आधी रात" in q_lower:
            target_hour = 0
            target_minute = 0
            if not explicit_day_specified:
                target_date = target_date + timedelta(days=1)
                explicit_day_specified = True
        elif "morning" in q_lower or "ఉదయం" in q_lower or "सुबह" in q_lower:
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

        # Explicit hour match (e.g. 6 am, 7 pm, 10:30 am, at 6 pm, 6 గంటలకు, 6 बजे)
        time_match_en = re.search(r"(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)", q_lower)
        time_match_te = re.search(r"(\d{1,2})(?::(\d{2}))?\s*గంటల(?:కు|కి)", q_lower)
        time_match_hi = re.search(r"(\d{1,2})(?::(\d{2}))?\s*बजे", q_lower)

        if time_match_en:
            h = int(time_match_en.group(1))
            m = int(time_match_en.group(2) or 0)
            meridiem = time_match_en.group(3).lower()
            if meridiem == "pm" and h < 12:
                h += 12
            elif meridiem == "am" and h == 12:
                h = 0
            target_hour = h
            target_minute = m
        elif time_match_te:
            h = int(time_match_te.group(1))
            m = int(time_match_te.group(2) or 0)
            if ("సాయంత్రం" in q_lower or "రాత్రి" in q_lower) and h < 12:
                h += 12
            elif "ఉదయం" in q_lower and h == 12:
                h = 0
            target_hour = h
            target_minute = m
        elif time_match_hi:
            h = int(time_match_hi.group(1))
            m = int(time_match_hi.group(2) or 0)
            if ("शाम" in q_lower or "रात" in q_lower) and h < 12:
                h += 12
            elif "सुबह" in q_lower and h == 12:
                h = 0
            target_hour = h
            target_minute = m

        # If no explicit day was specified (e.g. "at 6 pm") and that time has already passed today,
        # roll forward to tomorrow at that time.
        tentative_dt = datetime(
            target_date.year, target_date.month, target_date.day,
            target_hour, target_minute, 0, tzinfo=KOLKATA_TZ
        )
        if not explicit_day_specified and tentative_dt <= now_kolkata:
            target_date = target_date + timedelta(days=1)

        target_dt_kolkata = datetime(
            target_date.year, target_date.month, target_date.day,
            target_hour, target_minute, 0, tzinfo=KOLKATA_TZ
        )

    # Convert to UTC naive datetime for DB storage
    target_dt_utc = target_dt_kolkata.astimezone(timezone.utc).replace(tzinfo=None)

    # 4. Extract task title
    cleaned_title = q
    for p in sorted(trigger_patterns, key=len, reverse=True):
        if re.search(r"[a-zA-Z]", p):
            cleaned_title = re.sub(rf"\b{re.escape(p)}\b", "", cleaned_title, flags=re.IGNORECASE)
        else:
            cleaned_title = re.sub(re.escape(p), "", cleaned_title, flags=re.IGNORECASE)

    # Strip Indic hour patterns
    cleaned_title = re.sub(r"\d{1,2}(?::\d{2})?\s*గంటల(?:కు|కి)", "", cleaned_title)
    cleaned_title = re.sub(r"\d{1,2}(?::\d{2})?\s*बजे", "", cleaned_title)

    date_words_en = [
        "day after tomorrow", "tomorrow", "today", "morning", "evening", "afternoon", "noon", "midnight",
        "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
        "on", "at", "to", "for", "in", "hours?", "days?",
    ]
    for dw in sorted(date_words_en, key=len, reverse=True):
        cleaned_title = re.sub(rf"\b{re.escape(dw)}\b", "", cleaned_title, flags=re.IGNORECASE)

    date_words_indic = [
        "ఎల్లుండి", "రేపు", "ఈరోజు", "ఉదయం", "సాయంత్రం", "మధ్యాహ్నం", "అర్థరాత్రి", "గంటల్లో", "రోజుల్లో",
        "సోమవారం", "మంగళవారం", "బుధవారం", "గురువారం", "శుక్రవారం", "శనివారం", "ఆదివారం",
        "परसों", "कल", "आज", "सुबह", "शाम", "दोपहर", "आधी रात", "घंटे", "दिन",
        "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार", "रविवार",
    ]
    for dw in sorted(date_words_indic, key=len, reverse=True):
        cleaned_title = re.sub(re.escape(dw), "", cleaned_title, flags=re.IGNORECASE)

    # Clean time patterns like "6 am", "7 pm", "2 hours"
    cleaned_title = re.sub(r"\b\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b", "", cleaned_title, flags=re.IGNORECASE)
    cleaned_title = re.sub(r"[\.,!\?]", "", cleaned_title)
    cleaned_title = re.sub(r"\s+", " ", cleaned_title).strip()

    if not cleaned_title:
        cleaned_title = {
            "te": "వ్యవసాయ పని",
            "hi": "कृषि कार्य",
            "en": "Farm Task"
        }.get(lang, "Farm Task")

    cleaned_title = cleaned_title[0].upper() + cleaned_title[1:] if len(cleaned_title) > 0 else "Farm Task"

    # 5. Format localized confirmation prompt (asking for confirmation before saving)
    formatted_date = target_dt_kolkata.strftime("%d %b, %I:%M %p")
    if lang == "te":
        confirmation_prompt = (
            f"మీరు ఈ జ్ఞాపిక షెడ్యూల్ చేయాలనుకుంటున్నారా: '{cleaned_title}', సమయం {formatted_date} (Asia/Kolkata)? "
            f"జ్ఞాపిక నమోదు చేయబడింది నిర్ధారణ తర్వాత మాత్రమే. సేవ్ చేయడానికి 'అవును' లేదా రద్దు చేయడానికి 'వద్దు' అనండి."
        )
    elif lang == "hi":
        confirmation_prompt = (
            f"क्या आप यह स्मरणपत्र जोड़ना चाहते हैं: '{cleaned_title}', समय {formatted_date} (Asia/Kolkata)? "
            f"स्मरणपत्र दर्ज किया गया पुष्टि के बाद ही। सहेजने के लिए 'हाँ' या रद्द करने के लिए 'नहीं' कहें।"
        )
    else:
        confirmation_prompt = (
            f"Would you like me to schedule a reminder: '{cleaned_title}' for {formatted_date} (Asia/Kolkata)? "
            f"Reminder scheduled only after your confirmation. Reply 'Yes' to confirm or 'No' to cancel."
        )

    return cleaned_title, target_dt_utc, confirmation_prompt
