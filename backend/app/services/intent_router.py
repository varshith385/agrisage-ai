"""
Grow2Gain AI — Deterministic Intent and Navigation Router
Runs strictly BEFORE any LLM call to guarantee instant, 100% reliable navigation,
setting switches, and friendly small talk without requiring an external AI key.
Supports English, Telugu (తెలుగు), and Hindi (हिन्दी).
"""

import re
from typing import Optional
from backend.app.schemas.voice import VoiceQueryResponse
from backend.app.keywords import KEYWORDS_BY_LANG


def match_any(query: str, patterns: list[str]) -> bool:
    """Case-insensitive pattern matching supporting word boundary regex and Indic substrings."""
    q = query.strip().lower()
    for p in patterns:
        p_clean = p.lower()
        if any(ord(c) < 128 and c.isalpha() for c in p_clean):
            # ASCII alphabet: use word boundary regex
            if re.search(rf"\b{re.escape(p_clean)}\b", q):
                return True
        else:
            # Indic script: substring check
            if p_clean in q:
                return True
    return False


def route_navigation_or_action(query: str, lang: str) -> Optional[VoiceQueryResponse]:
    """
    Evaluates user input for explicit in-app navigation and action commands.
    Only matches explicit commands to navigate, open, or switch settings.
    Does NOT match general domain inquiries (e.g. 'what is the price' or 'will it rain').
    Returns VoiceQueryResponse if matched, else None.
    """
    q = query.strip().lower()

    # 1. Navigation: Irrigation & Water
    if match_any(q, [
        "open irrigation", "take me to irrigation", "show irrigation page", "go to irrigation",
        "irrigation page", "navigate to irrigation", "నీటిపారుదల పేజీ", "ఇరిగేషన్ పేజీ",
        "నీటి పారుదల తెరవండి", "నీటిపారుదల తెరవండి", "సిंचाई पेज", "सिंचाई खोलो", "सिंचाई पृष्ठ"
    ]):
        text = {
            "te": "నీటి పారుదల మరియు నీటి ప్రణాళిక పేజీకి వెళ్తున్నారు.",
            "hi": "सिंचाई एवं जल बजट पृष्ठ खोला जा रहा है।",
            "en": "Navigating to Irrigation & Water Budget."
        }.get(lang, "Navigating to Irrigation & Water Budget.")
        action_label = {
            "te": "నీటిపారుదల తెరవండి",
            "hi": "सिंचाई पेज खोलें",
            "en": "Open Irrigation"
        }.get(lang, "Open Irrigation")
        confirmation_chip = {
            "te": "నీటిపారుదల తెరవబడుతోంది... (Opening Irrigation...)",
            "hi": "सिंचाई पेज खोला जा रहा है... (Opening Irrigation...)",
            "en": "Opening Irrigation..."
        }.get(lang, "Opening Irrigation...")
        chips = {
            "te": ["ఈరోజు నా పంటకు నీరు పెట్టాలా?", "నేల తేమ నిల్వలు తనిఖీ చేయండి"],
            "hi": ["क्या आज फसल को पानी देना चाहिए?", "मिट्टी की नमी जांचें"],
            "en": ["Should I irrigate today?", "Check soil moisture reserves"]
        }.get(lang, ["Should I irrigate today?", "Check soil moisture reserves"])
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Navigation Registry"],
            action_link="/irrigation",
            action_label=action_label,
            action_type="navigate",
            confirmation_chip=confirmation_chip,
            mode="basic",
            suggestion_chips=chips,
        )

    # 2. Navigation: Mandi Market
    if match_any(q, [
        "take me to market", "open market", "show market page", "go to market",
        "mandi market page", "market page", "navigate to market", "మార్కెట్ పేజీ",
        "మండి పేజీ", "మార్కెట్ తెరవండి", "మండి తెరవండి", "మండి మార్కెట్ పేజీ",
        "मंडी खोलो", "मंडी पेज", "बाजार खोलो", "बाजार पृष्ठ"
    ]):
        text = {
            "te": "మండి మార్కెట్ మరియు నికర ధరల పేజీకి వెళ్తున్నారు.",
            "hi": "मंडी भाव एवं शुद्ध लाभ रैंकिंग पृष्ठ खोला जा रहा है।",
            "en": "Navigating to Mandi Market & Prices."
        }.get(lang, "Navigating to Mandi Market & Prices.")
        action_label = {
            "te": "మార్కెట్ తెరవండి",
            "hi": "मंडी भाव खोलें",
            "en": "Open Mandi Market"
        }.get(lang, "Open Mandi Market")
        confirmation_chip = {
            "te": "మార్కెట్ తెరవబడుతోంది... (Opening Mandi Market...)",
            "hi": "मंडी पेज खोला जा रहा है... (Opening Mandi Market...)",
            "en": "Opening Mandi Market..."
        }.get(lang, "Opening Mandi Market...")
        chips = {
            "te": ["పత్తి మార్కెట్ ధర ఎంత?", "మార్కెట్ దూరం తనిఖీ చేయండి"],
            "hi": ["कपास का मंडी भाव क्या है?", "मंडी दूरी देखें"],
            "en": ["Best mandi price", "Check mandi distance"]
        }.get(lang, ["Best mandi price", "Check mandi distance"])
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Navigation Registry"],
            action_link="/market",
            action_label=action_label,
            action_type="navigate",
            confirmation_chip=confirmation_chip,
            mode="basic",
            suggestion_chips=chips,
        )

    # 3. Navigation: Weather & Forecast
    if match_any(q, [
        "show weather page", "open weather", "weather page", "go to weather", "navigate to weather",
        "వాతావరణ పేజీ", "వాతావరణం పేజీ", "వాతావరణం తెరవండి", "వాతావరణం చూపించు", "मौसम पेज", "मौसम खोलो", "मौसम पृष्ठ", "मौसम दिखाओ"
    ]):
        text = {
            "te": "వాతావరణ సూచన మరియు ఉష్ణోగ్రత పేజీకి వెళ్తున్నారు.",
            "hi": "मौसम पूर्वानुमान एवं तापमान पृष्ठ खोला जा रहा है।",
            "en": "Navigating to Weather & Farm Setup."
        }.get(lang, "Navigating to Weather & Farm Setup.")
        action_label = {
            "te": "వాతావరణం తెరవండి",
            "hi": "मौसम खोलें",
            "en": "Open Weather"
        }.get(lang, "Open Weather")
        confirmation_chip = {
            "te": "వాతావరణం తెరవబడుతోంది... (Opening Weather...)",
            "hi": "मौसम पेज खोला जा रहा है... (Opening Weather...)",
            "en": "Opening Weather..."
        }.get(lang, "Opening Weather...")
        chips = {
            "te": ["ఈరోజు వర్షం పడుతుందా?", "7 రోజుల వర్ష సూచన"],
            "hi": ["क्या आज बारिश होगी?", "7-दिवसीय वर्षा पूर्वानुमान"],
            "en": ["Will it rain today?", "Check 7-day rain forecast"]
        }.get(lang, ["Will it rain today?", "Check 7-day rain forecast"])
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Navigation Registry"],
            action_link="/setup",
            action_label=action_label,
            action_type="navigate",
            confirmation_chip=confirmation_chip,
            mode="basic",
            suggestion_chips=chips,
        )

    # 4. Navigation: Crop Calendar
    if match_any(q, [
        "go to calendar", "open calendar", "show calendar page", "calendar page", "navigate to calendar",
        "crop calendar page", "పంట క్యాలెండర్ పేజీ", "క్యాలెండర్ పేజీ", "క్యాలెండర్ తెరవండి",
        "फसल कैलेंडर पेज", "कैलेंडर खोलो", "कैलेंडर पृष्ठ"
    ]):
        text = {
            "te": "పంట క్యాలెండర్ మరియు వ్యవసాయ పనుల పేజీకి వెళ్తున్నారు.",
            "hi": "फसल कैलेंडर एवं कार्य समय-सारणी पृष्ठ खोला जा रहा है।",
            "en": "Navigating to Crop Calendar."
        }.get(lang, "Navigating to Crop Calendar.")
        action_label = {
            "te": "క్యాలెండర్ తెరవండి",
            "hi": "कैलेंडर खोलें",
            "en": "Open Crop Calendar"
        }.get(lang, "Open Crop Calendar")
        confirmation_chip = {
            "te": "క్యాలెండర్ తెరవబడుతోంది...",
            "hi": "कैलेंडर खोला जा रहा है...",
            "en": "Opening Calendar..."
        }.get(lang, "Opening Calendar...")
        chips = {
            "te": ["ప్రస్తుత పంట దశ", "తదుపరి వ్యవసాయ పని"],
            "hi": ["वर्तमान फसल चरण", "अगला कृषि कार्य"],
            "en": ["Current growth stage", "Next field milestone"]
        }.get(lang, ["Current growth stage", "Next field milestone"])
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Navigation Registry"],
            action_link="/calendar",
            action_label=action_label,
            action_type="navigate",
            confirmation_chip=confirmation_chip,
            mode="basic",
            suggestion_chips=chips,
        )

    # 5. Navigation: Disease Diagnosis
    if match_any(q, [
        "open disease", "show disease page", "disease page", "leaf scan page", "navigate to disease",
        "తెగులు పేజీ", "ఆకు స్కాన్ పేజీ", "తెగులు తెరవండి", "రోగ पहचान पेज", "रोग पेज", "पत्ती स्कैन पेज"
    ]):
        text = {
            "te": "ఆకు తెగుళ్ల గుర్తింపు పేజీకి వెళ్తున్నారు. ఆకు ఫోటో తీసి అప్‌లోడ్ చేయండి.",
            "hi": "पत्ती रोग पहचान पृष्ठ खोला जा रहा है। पत्ती का फोटो अपलोड करें।",
            "en": "Navigating to Disease Diagnosis. Upload a leaf photo for automated diagnosis."
        }.get(lang, "Navigating to Disease Diagnosis.")
        action_label = {
            "te": "తెగులు గుర్తింపు తెరవండి",
            "hi": "रोग पहचान खोलें",
            "en": "Open Disease Diagnosis"
        }.get(lang, "Open Disease Diagnosis")
        confirmation_chip = {
            "te": "తెగులు గుర్తింపు తెరవబడుతోంది...",
            "hi": "रोग पहचान खोली जा रही है...",
            "en": "Opening Disease Scan..."
        }.get(lang, "Opening Disease Scan...")
        chips = {
            "te": ["ఆకు ఫోటో అప్‌లోడ్ చేయండి", "సేంద్రీయ నివారణలు"],
            "hi": ["पत्ती फोटो अपलोड करें", "जैविक उपचार देखें"],
            "en": ["Upload leaf photo", "Check pest remedies"]
        }.get(lang, ["Upload leaf photo", "Check pest remedies"])
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Navigation Registry"],
            action_link="/disease",
            action_label=action_label,
            action_type="navigate",
            confirmation_chip=confirmation_chip,
            mode="basic",
            suggestion_chips=chips,
        )

    # 6. Navigation: Economics & Profit
    if match_any(q, [
        "open economics", "show profit page", "economics page", "profit calculator page",
        "navigate to economics", "ఆర్థిక లాభం పేజీ", "ఖర్చుల పేజీ", "లాభ నష్టాల పేజీ",
        "లాభం పేజీ", "कृषि अर्थशास्त्र पेज", "मुनाफा पेज", "लागत पेज"
    ]):
        text = {
            "te": "వ్యవసాయ ఖర్చులు మరియు లాభ కాలిక్యులేటర్ పేజీకి వెళ్తున్నారు.",
            "hi": "कृषि लागत एवं शुद्ध मुनाफा कैलकुलेटर पृष्ठ खोला जा रहा है।",
            "en": "Navigating to Farm Economics & Net Profit Calculator."
        }.get(lang, "Navigating to Economics & Profit.")
        action_label = {
            "te": "సాగు ఖర్చులు తెరవండి",
            "hi": "खेती लागत खोलें",
            "en": "Open Economics"
        }.get(lang, "Open Economics")
        confirmation_chip = {
            "te": "సాగు ఖర్చులు తెరవబడుతోంది...",
            "hi": "लागत पेज खोला जा रहा है...",
            "en": "Opening Economics..."
        }.get(lang, "Opening Economics...")
        chips = {
            "te": ["ఎకరాకు పత్తి సాగు ఖర్చు ఎంత?", "లాభాల పోలిక"],
            "hi": ["प्रति एकड़ कपास खेती लागत कितनी है?", "फसल लाभ तुलना"],
            "en": ["What is my net profit?", "Compare crop profit"]
        }.get(lang, ["What is my net profit?", "Compare crop profit"])
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Navigation Registry"],
            action_link="/economics",
            action_label=action_label,
            action_type="navigate",
            confirmation_chip=confirmation_chip,
            mode="basic",
            suggestion_chips=chips,
        )

    # 7. Navigation: My Farms
    if match_any(q, [
        "open farms", "show farms page", "my farms page", "register farm page", "navigate to farms",
        "నా పొలాలు పేజీ", "పొలాల పేజీ", "పొలం వివరాల పేజీ", "मेरे खेत पेज", "खेत प्रोफाइल पेज"
    ]):
        text = {
            "te": "మీ రిజిస్టర్డ్ పొలాల నిర్వహణ పేజీకి వెళ్తున్నారు.",
            "hi": "आपके पंजीकृत खेतों के प्रबंधन पृष्ठ पर जाया जा रहा है।",
            "en": "Navigating to My Farms management page."
        }.get(lang, "Navigating to My Farms.")
        action_label = {
            "te": "నా పొలాలు తెరవండి",
            "hi": "मेरे खेत खोलें",
            "en": "Open My Farms"
        }.get(lang, "Open My Farms")
        confirmation_chip = {
            "te": "నా పొలాలు తెరవబడుతోంది...",
            "hi": "खेत पेज खोला जा रहा है...",
            "en": "Opening My Farms..."
        }.get(lang, "Opening My Farms...")
        chips = {
            "te": ["కొత్త పొలం నమోదు చేయండి", "నేల రకం నవీకరించండి"],
            "hi": ["नया खेत जोड़ें", "मिट्टी का प्रकार बदलें"],
            "en": ["Register new farm", "Update soil type"]
        }.get(lang, ["Register new farm", "Update soil type"])
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Navigation Registry"],
            action_link="/farms",
            action_label=action_label,
            action_type="navigate",
            confirmation_chip=confirmation_chip,
            mode="basic",
            suggestion_chips=chips,
        )

    # 8. Navigation: Reminders
    if match_any(q, [
        "open reminders", "show reminders page", "reminders page", "navigate to reminders",
        "జ్ఞాపికల పేజీ", "రిమైండర్ పేజీ", "రిమైండర్లు తెరవండి", "स्मरणपत्र पेज", "रिमाइंडर पेज", "रिमाइंडर खोलो"
    ]):
        text = {
            "te": "వ్యవసాయ జ్ఞాపికలు మరియు అలర్ట్‌ల పేజీకి వెళ్తున్నారు.",
            "hi": "कृषि स्मरणपत्र एवं अलर्ट पृष्ठ खोला जा रहा है।",
            "en": "Navigating to Reminders & Field Task Alerts."
        }.get(lang, "Navigating to Reminders.")
        action_label = {
            "te": "రిమైండర్లు తెరవండి",
            "hi": "स्मरणपत्र खोलें",
            "en": "Open Reminders"
        }.get(lang, "Open Reminders")
        confirmation_chip = {
            "te": "రిమైండర్లు తెరవబడుతోంది...",
            "hi": "स्मरणपत्र खोला जा रहा है...",
            "en": "Opening Reminders..."
        }.get(lang, "Opening Reminders...")
        chips = {
            "te": ["రేపటి జ్ఞాపికలు", "నీటిపారుదల షెడ్యూల్ జ్ఞాపిక"],
            "hi": ["कल के स्मरणपत्र", "सिंचाई अनुसूची स्मरणपत्र"],
            "en": ["Remind me tomorrow", "Irrigation schedule reminder"]
        }.get(lang, ["Remind me tomorrow", "Irrigation schedule reminder"])
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Navigation Registry"],
            action_link="/reminders",
            action_label=action_label,
            action_type="navigate",
            confirmation_chip=confirmation_chip,
            mode="basic",
            suggestion_chips=chips,
        )

    # 9. Navigation: Soil Health Card & Schemes
    if match_any(q, [
        "open schemes", "show schemes page", "schemes page", "soil card page", "soil health card page",
        "navigate to schemes", "సాయిల్ కార్డ్ పేజీ", "నేల ఆరోగ్య పత్రం పేజీ", "పథకాల పేజీ",
        "పథకాలు పేజీ", "పథకాలు తెరవండి", "मृदा स्वास्थ्य कार्ड पेज", "सरकारी योजनाएं पेज", "योजना पेज खोलो"
    ]):
        text = {
            "te": "సాయిల్ హెల్త్ కార్డ్ మరియు ప్రభుత్వ సంక్షేమ సమాచార పేజీకి వెళ్తున్నారు.",
            "hi": "मृदा स्वास्थ्य कार्ड एवं कृषि योजनाओं के पृष्ठ पर जाया जा रहा है।",
            "en": "Navigating to Soil Health Card & Welfare Schemes page."
        }.get(lang, "Navigating to Schemes.")
        action_label = {
            "te": "పథకాలు & సాయిల్ కార్డ్ తెరవండి",
            "hi": "योजनाएं एवं सॉइल कार्ड खोलें",
            "en": "Open Schemes & Soil Card"
        }.get(lang, "Open Schemes & Soil Card")
        confirmation_chip = {
            "te": "సాయిల్ కార్డ్ తెరవబడుతోంది...",
            "hi": "सॉइल कार्ड खोला जा रहा है...",
            "en": "Opening Soil Card..."
        }.get(lang, "Opening Soil Card...")
        chips = {
            "te": ["నేల ఆరోగ్య పరీక్ష వివరాలు", "పోషకాల సమతుల్యత"],
            "hi": ["मृदा स्वास्थ्य कार्ड विवरण", "पोषक तत्व संतुलन"],
            "en": ["Parse soil test card", "Check nutrient balance"]
        }.get(lang, ["Parse soil test card", "Check nutrient balance"])
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Navigation Registry"],
            action_link="/schemes",
            action_label=action_label,
            action_type="navigate",
            confirmation_chip=confirmation_chip,
            mode="basic",
            suggestion_chips=chips,
        )

    # 10. Navigation: Community Hub
    if match_any(q, [
        "open community", "show community page", "community page", "machinery rental page",
        "outbreak map page", "navigate to community", "రైతు సంఘం పేజీ", "కమ్యూనిటీ పేజీ",
        "రైతు సంఘం తెరవండి", "కమ్యూనిటీ తెరవండి", "किसान समुदाय पेज", "सामुदायिक मंच पेज", "समुदाय खोलो"
    ]):
        text = {
            "te": "రైతు సంఘం, పరికరాల అద్దె మరియు వ్యాధుల మ్యాప్ పేజీకి వెళ్తున్నారు.",
            "hi": "किसान समुदाय, मशीनरी किराया एवं कीट प्रकोप मानचित्र पृष्ठ खोला जा रहा है।",
            "en": "Navigating to Community Forum, Machinery & Outbreak Map."
        }.get(lang, "Navigating to Community.")
        action_label = {
            "te": "రైతు సంఘం తెరవండి",
            "hi": "किसान समुदाय खोलें",
            "en": "Open Community"
        }.get(lang, "Open Community")
        confirmation_chip = {
            "te": "రైతు సంఘం తెరవబడుతోంది...",
            "hi": "समुदाय खोला जा रहा है...",
            "en": "Opening Community..."
        }.get(lang, "Opening Community...")
        chips = {
            "te": ["వ్యవసాయ పరికరాల అద్దె", "తెగుళ్ల ముప్పు మ్యాప్"],
            "hi": ["कृषि उपकरण किराया", "कीट प्रकोप मानचित्र"],
            "en": ["Rent farm machinery", "Check pest outbreak map"]
        }.get(lang, ["Rent farm machinery", "Check pest outbreak map"])
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Navigation Registry"],
            action_link="/community",
            action_label=action_label,
            action_type="navigate",
            confirmation_chip=confirmation_chip,
            mode="basic",
            suggestion_chips=chips,
        )

    # 11. Navigation: How to Use & Walkthrough
    if match_any(q, [
        "open guide", "how to page", "show guide page", "help guide page", "open how to",
        "ఎలా ఉపయోగించాలి పేజీ", "యాప్ సహాయం పేజీ", "మార్గదర్శి పేజీ", "మార్గదర్శి తెరవండి", "मार्गदर्शिका पेज", "सहायता गाइड पेज", "गाइड खोलो"
    ]):
        text = {
            "te": "Grow2Gain యాప్ ఎలా ఉపయోగించాలో వివరించే మార్గదర్శి పేజీకి వెళ్తున్నారు.",
            "hi": "Grow2Gain ऐप का उपयोग कैसे करें, गाइड पृष्ठ खोला जा रहा है।",
            "en": "Navigating to How to Use Guide."
        }.get(lang, "Navigating to How to Use.")
        action_label = {
            "te": "మార్గదర్శి తెరవండి",
            "hi": "गाइड खोलें",
            "en": "Open Guide"
        }.get(lang, "Open Guide")
        confirmation_chip = {
            "te": "మార్గదర్శి తెరవబడుతోంది...",
            "hi": "गाइड खोला जा रहा है...",
            "en": "Opening Guide..."
        }.get(lang, "Opening Guide...")
        chips = {
            "te": ["గైడెడ్ టూర్ ప్రారంభించండి", "వీడియో మార్గదర్శి"],
            "hi": ["गाइडेड टूर शुरू करें", "वीडियो गाइड"],
            "en": ["Start interactive tour", "Watch video guide"]
        }.get(lang, ["Start interactive tour", "Watch video guide"])
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Navigation Registry"],
            action_link="/how-to",
            action_label=action_label,
            action_type="navigate",
            confirmation_chip=confirmation_chip,
            mode="basic",
            suggestion_chips=chips,
        )

    # 12. Actions: Start Guided Tour
    if match_any(q, [
        "start the tour", "start tour", "guided tour", "walkthrough",
        "టూర్ ప్రారంభించండి", "గైడెడ్ టూర్", "టూర్ మొదలుపెట్టు", "टूर शुरू करें", "गाइडेड टूर"
    ]):
        text = {
            "te": "ఇంటరాక్టివ్ గైడెడ్ టూర్ ప్రారంభమవుతోంది.",
            "hi": "इंटरैक्टिव गाइडेड टूर शुरू किया जा रहा है।",
            "en": "Starting interactive guided walkthrough tour."
        }.get(lang, "Starting Guided Tour.")
        chip = {
            "te": "టూర్ ప్రారంభమవుతోంది...",
            "hi": "टूर शुरू हो रहा है...",
            "en": "Starting Tour..."
        }.get(lang, "Starting Tour...")
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Tour Engine"],
            action_type="start_tour",
            confirmation_chip=chip,
            mode="basic",
        )

    # 13. Actions: Switch Language to Telugu
    if match_any(q, ["switch to telugu", "change to telugu", "telugu language", "తెలుగులోకి మార్చండి", "భాష తెలుగు"]):
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text="యాప్ భాష తెలుగులోకి మార్చబడింది.",
            status="WORKING",
            sources=["Grow2Gain Localization"],
            action_type="set_lang:te",
            confirmation_chip="తెలుగులోకి మార్చబడింది (Telugu)",
            mode="basic",
        )

    # 14. Actions: Switch Language to Hindi
    if match_any(q, ["switch to hindi", "change to hindi", "hindi language", "హిందీలోకి మార్చండి", "हिन्दी करें", "भाषा हिन्दी"]):
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text="ऐप की भाषा हिन्दी में बदल दी गई है।",
            status="WORKING",
            sources=["Grow2Gain Localization"],
            action_type="set_lang:hi",
            confirmation_chip="हिन्दी में बदला गया (Hindi)",
            mode="basic",
        )

    # 15. Actions: Switch Language to English
    if match_any(q, ["switch to english", "change to english", "english language", "ఇంగ్లీష్ కి మార్చండి", "ఇంగ్లీషులోకి మార్చండి", "अंग्रेजी करें"]):
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text="Switched app language to English.",
            status="WORKING",
            sources=["Grow2Gain Localization"],
            action_type="set_lang:en",
            confirmation_chip="Switched to English",
            mode="basic",
        )

    # 16. Actions: Dark Mode
    if match_any(q, ["turn on dark mode", "dark mode on", "enable dark mode", "డార్క్ మోడ్ ఆన్", "డార్క్ మోడ్", "डार्क मोड चालू"]):
        text = {
            "te": "డార్క్ మోడ్ ఆన్ చేయబడింది.",
            "hi": "डार्क मोड चालू कर दिया गया है।",
            "en": "Dark mode has been enabled."
        }.get(lang, "Dark mode enabled.")
        chip = {
            "te": "డార్క్ మోడ్ ఆన్",
            "hi": "डार्क मोड चालू",
            "en": "Dark Mode On"
        }.get(lang, "Dark Mode On")
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Theme Engine"],
            action_type="set_theme:dark",
            confirmation_chip=chip,
            mode="basic",
        )

    # 17. Actions: Light Mode
    if match_any(q, ["turn on light mode", "light mode on", "disable dark mode", "లైట్ మోడ్ ఆన్", "లైట్ మోడ్", "लाइट मोड चालू"]):
        text = {
            "te": "లైట్ మోడ్ ఆన్ చేయబడింది.",
            "hi": "लाइट मोड चालू कर दिया गया है।",
            "en": "Light mode has been enabled."
        }.get(lang, "Light mode enabled.")
        chip = {
            "te": "లైట్ మోడ్ ఆన్",
            "hi": "लाइट मोड चालू",
            "en": "Light Mode On"
        }.get(lang, "Light Mode On")
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Theme Engine"],
            action_type="set_theme:light",
            confirmation_chip=chip,
            mode="basic",
        )

    # 18. Actions: Pictorial Mode (Pictures)
    if match_any(q, ["turn on pictorial mode", "pictorial mode on", "pictures mode on", "చిత్రాల మోడ్ ఆన్", "చిత్రాల మోడ్", "चित्र मोड चालू"]):
        text = {
            "te": "చిత్రాల మోడ్ ఆన్ చేయబడింది.",
            "hi": "चित्र मोड चालू कर दिया गया है।",
            "en": "Pictures visual mode has been activated."
        }.get(lang, "Pictures mode activated.")
        chip = {
            "te": "చిత్రాల మోడ్ ఆన్",
            "hi": "चित्र मोड चालू",
            "en": "Pictures Mode On"
        }.get(lang, "Pictures Mode On")
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Visual Engine"],
            action_type="set_pictorial:true",
            confirmation_chip=chip,
            mode="basic",
        )

    # 19. Actions: Words Mode
    if match_any(q, ["turn off pictorial mode", "words mode on", "detailed mode on", "వివరాల మోడ్ ఆన్", "పాఠ్య మోడ్ ఆన్", "వివరాల మోడ్", "विस्तृत मोड चालू"]):
        text = {
            "te": "వివరాల పాఠ్య మోడ్ ఆన్ చేయబడింది.",
            "hi": "विस्तृत टेक्स्ट मोड चालू कर दिया गया है।",
            "en": "Detailed words mode has been activated."
        }.get(lang, "Words mode activated.")
        chip = {
            "te": "పాఠ్య మోడ్ ఆన్",
            "hi": "टेक्स्ट मोड चालू",
            "en": "Words Mode On"
        }.get(lang, "Words Mode On")
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Visual Engine"],
            action_type="set_pictorial:false",
            confirmation_chip=chip,
            mode="basic",
        )

    return None


def route_smalltalk(query: str, lang: str) -> Optional[VoiceQueryResponse]:
    """
    Handles conversational small talk gracefully without unhelpful "I don't know" canned responses.
    """
    q = query.strip().lower()

    # Acknowledgement: ok, okay, k, sure, fine
    if match_any(q, ["ok", "okay", "k", "sure", "fine", "cool", "got it", "understood", "సరే", "హా", "అర్థమైంది", "ठीक है", "अच्छा", "समझ गया"]):
        text = {
            "te": "సంతోషం! మీ పొలానికి సంబంధించి తర్వాత ఏమి తనిఖీ చేయాలనుకుంటున్నారు?",
            "hi": "बहुत बढ़िया! आप अपने खेत के बारे में आगे क्या जानना चाहते हैं?",
            "en": "Glad to help! What would you like to check next on your farm?"
        }.get(lang, "Glad to help! What would you like to check next on your farm?")
        chips = {
            "te": ["ఈరోజు వర్షం పడుతుందా?", "ఈరోజు నా పంటకు నీరు పెట్టాలా?", "సాగు ఖర్చులు ఎంత?"],
            "hi": ["क्या आज बारिश होगी?", "क्या आज फसल को पानी देना चाहिए?", "खेती लागत कितनी है?"],
            "en": ["Will it rain today?", "Should I irrigate?", "What is my profit?"]
        }.get(lang, ["Will it rain today?", "Should I irrigate?", "What is my profit?"])
        return VoiceQueryResponse(
            intent="smalltalk",
            confidence=0.98,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Conversational Engine"],
            mode="basic",
            suggestion_chips=chips,
        )

    # Gratitude: thanks, thank you
    if match_any(q, ["thanks", "thank you", "thx", "many thanks", "ధన్యవాదాలు", "థాంక్స్", "ధన్యవాదం", "కృతజ్ఞతలు", "धन्यवाद", "शुक्रिया", "बहुत धन्यवाद"]):
        kw = KEYWORDS_BY_LANG.get(lang, KEYWORDS_BY_LANG["en"])
        action_label = {
            "te": "డాష్‌బోర్డ్‌కు తిరిగి వెళ్ళండి",
            "hi": "डैशबोर्ड पर वापस जाएं",
            "en": "Back to Dashboard"
        }.get(lang, "Back to Dashboard")
        return VoiceQueryResponse(
            intent="thanks",
            confidence=0.98,
            confidence_type="rule",
            spoken_text=kw.RESPONSES["thanks"],
            status="WORKING",
            sources=["Grow2Gain Conversational Engine"],
            action_link="/dashboard",
            action_label=action_label,
            mode="basic",
            suggestion_chips=kw.SUGGESTION_CHIPS,
        )

    # Identity / About: who are you, what is your name
    if match_any(q, ["who are you", "what is your name", "what are you", "nuvvu evaru", "నువ్వు ఎవరు", "నీ పేరేంటి", "మీరెవరు", "మీరు ఎవరు", "आप कौन हैं", "तुम्हारा नाम क्या है", "तुम कौन हो"]):
        kw = KEYWORDS_BY_LANG.get(lang, KEYWORDS_BY_LANG["en"])
        action_label = {
            "te": "సదుపాయాలను చూడండి",
            "hi": "सुविधाएं देखें",
            "en": "Explore Features"
        }.get(lang, "Explore Features")
        return VoiceQueryResponse(
            intent="about",
            confidence=0.98,
            confidence_type="rule",
            spoken_text=kw.RESPONSES["about"],
            status="WORKING",
            sources=["Grow2Gain System Specification"],
            action_link="/dashboard",
            action_label=action_label,
            mode="basic",
            structured_data={
                "features": {
                    "weather": "LIVE",
                    "irrigation": "LIVE",
                    "disease": "LIVE",
                    "economics": "LIVE",
                    "market": "DEMO",
                    "schemes": "NOT_BUILT",
                }
            },
            limitations=["Honesty label: schemes are not built on this branch."],
            suggestion_chips=kw.SUGGESTION_CHIPS,
        )

    # General Help / Capabilities
    if match_any(q, ["help", "what can you do", "commands", "how to use", "సహాయం", "సహాయం కావాలి", "నీతో ఏమి చేయవచ్చు", "మదద్", "मदद", "क्या कर सकते हो", "सहायता"]):
        text = {
            "te": "నేను ఈ క్రింది పనుల్లో సహాయపడగలను: 1. నేటి వర్షపాత సూచన, 2. నీటిపారుదల సలహా, 3. ఆకు తెగులు గుర్తింపు, 4. వ్యవసాయ లాభం లెక్కింపు, మరియు 5. పేజీలను తెరవడం.",
            "hi": "मैं इन कार्यों में सहायता कर सकता हूँ: 1. आज का मौसम व वर्षा, 2. सिंचाई सलाह, 3. पत्ती रोग पहचान, 4. शुद्ध लाभ गणना, और 5. कोई भी पेज खोलना।",
            "en": "I can assist you with: 1. Today's weather & rain forecast, 2. FAO-56 irrigation advice, 3. Leaf disease diagnosis, 4. Farm profit simulator, and 5. Navigating to any page."
        }.get(lang, "I can assist with weather, irrigation, disease diagnosis, and economics.")
        chips = {
            "te": ["ఈరోజు వర్షం పడుతుందా?", "ఈరోజు నా పంటకు నీరు పెట్టాలా?", "నీటిపారుదల తెరవండి"],
            "hi": ["क्या आज बारिश होगी?", "क्या आज फसल को पानी देना चाहिए?", "सिंचाई खोलो"],
            "en": ["Will it rain today?", "Should I irrigate today?", "Open irrigation"]
        }.get(lang, ["Will it rain today?", "Should I irrigate today?", "Open irrigation"])
        return VoiceQueryResponse(
            intent="help",
            confidence=0.98,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["Grow2Gain Capability Registry"],
            mode="basic",
            suggestion_chips=chips,
        )

    return None
