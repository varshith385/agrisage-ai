"""
AgriSage AI — Deterministic Intent and Navigation Router
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
        "నీటి పారుదల తెరవండి", "सिंचाई पेज", "सिंचाई खोलो", "सिंचाई पृष्ठ"
    ]):
        text = {
            "te": "నీటి పారుదల మరియు నీటి ప్రణాళిక పేజీకి వెళ్తున్నారు.",
            "hi": "सिंचाई एवं जल बजट पृष्ठ खोला जा रहा है।",
            "en": "Navigating to Irrigation & Water Budget."
        }.get(lang, "Navigating to Irrigation & Water Budget.")
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Navigation Registry"],
            action_link="/irrigation",
            action_label="Open Irrigation",
            action_type="navigate",
            confirmation_chip="Opening Irrigation...",
            mode="basic",
            suggestion_chips=["Should I irrigate today?", "Check soil moisture reserves"],
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
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Navigation Registry"],
            action_link="/market",
            action_label="Open Mandi Market",
            action_type="navigate",
            confirmation_chip="Opening Mandi Market...",
            mode="basic",
            suggestion_chips=["Best mandi price", "Check mandi distance"],
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
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Navigation Registry"],
            action_link="/setup",
            action_label="Open Weather",
            action_type="navigate",
            confirmation_chip="Opening Weather...",
            mode="basic",
            suggestion_chips=["Will it rain today?", "Check 7-day rain forecast"],
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
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Navigation Registry"],
            action_link="/calendar",
            action_label="Open Crop Calendar",
            action_type="navigate",
            confirmation_chip="Opening Calendar...",
            mode="basic",
            suggestion_chips=["Current growth stage", "Next field milestone"],
        )

    # 5. Navigation: Disease Diagnosis
    if match_any(q, [
        "open disease", "show disease page", "disease page", "leaf scan page", "navigate to disease",
        "తెగులు పేజీ", "ఆకు స్కాన్ పేజీ", "తెగులు తెరవండి", "रोग पहचान पेज", "रोग पेज", "पत्ती स्कैन पेज"
    ]):
        text = {
            "te": "ఆకు తెగుళ్ల గుర్తింపు పేజీకి వెళ్తున్నారు. ఆకు ఫోటో తీసి అప్‌లోడ్ చేయండి.",
            "hi": "पत्ती रोग पहचान पृष्ठ खोला जा रहा है। पत्ती का फोटो अपलोड करें।",
            "en": "Navigating to Disease Diagnosis. Upload a leaf photo for automated diagnosis."
        }.get(lang, "Navigating to Disease Diagnosis.")
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Navigation Registry"],
            action_link="/disease",
            action_label="Open Disease Diagnosis",
            action_type="navigate",
            confirmation_chip="Opening Disease Scan...",
            mode="basic",
            suggestion_chips=["Upload leaf photo", "Check pest remedies"],
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
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Navigation Registry"],
            action_link="/economics",
            action_label="Open Economics",
            action_type="navigate",
            confirmation_chip="Opening Economics...",
            mode="basic",
            suggestion_chips=["What is my net profit?", "Compare crop profit"],
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
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Navigation Registry"],
            action_link="/farms",
            action_label="Open My Farms",
            action_type="navigate",
            confirmation_chip="Opening My Farms...",
            mode="basic",
            suggestion_chips=["Register new farm", "Update soil type"],
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
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Navigation Registry"],
            action_link="/reminders",
            action_label="Open Reminders",
            action_type="navigate",
            confirmation_chip="Opening Reminders...",
            mode="basic",
            suggestion_chips=["Remind me tomorrow", "Irrigation schedule reminder"],
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
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Navigation Registry"],
            action_link="/schemes",
            action_label="Open Schemes & Soil Card",
            action_type="navigate",
            confirmation_chip="Opening Soil Card...",
            mode="basic",
            suggestion_chips=["Parse soil test card", "Check nutrient balance"],
        )

    # 10. Navigation: Community Hub
    if match_any(q, [
        "open community", "show community page", "community page", "machinery rental page",
        "outbreak map page", "navigate to community", "రైతు సంఘం పేజీ", "కమ్యూనిటీ పేజీ",
        "రైతు సంఘం తెరవండి", "किसान समुदाय पेज", "सामुदायिक मंच पेज"
    ]):
        text = {
            "te": "రైతు సంఘం, పరికరాల అద్దె మరియు వ్యాధుల మ్యాప్ పేజీకి వెళ్తున్నారు.",
            "hi": "किसान समुदाय, मशीनरी किराया एवं कीट प्रकोप मानचित्र पृष्ठ खोला जा रहा है।",
            "en": "Navigating to Community Forum, Machinery & Outbreak Map."
        }.get(lang, "Navigating to Community.")
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Navigation Registry"],
            action_link="/community",
            action_label="Open Community",
            action_type="navigate",
            confirmation_chip="Opening Community...",
            mode="basic",
            suggestion_chips=["Rent farm machinery", "Check pest outbreak map"],
        )

    # 11. Navigation: How to Use & Walkthrough
    if match_any(q, [
        "open guide", "how to page", "show guide page", "help guide page", "open how to",
        "ఎలా ఉపయోగించాలి పేజీ", "యాప్ సహాయం పేజీ", "మార్గదర్శి పేజీ", "मार्गदर्शिका पेज", "सहायता गाइड पेज"
    ]):
        text = {
            "te": "అగ్రిసేజ్ యాప్ ఎలా ఉపయోగించాలో వివరించే మార్గదర్శి పేజీకి వెళ్తున్నారు.",
            "hi": "एग्रीसेज ऐप का उपयोग कैसे करें, गाइड पृष्ठ खोला जा रहा है।",
            "en": "Navigating to How to Use Guide."
        }.get(lang, "Navigating to How to Use.")
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Navigation Registry"],
            action_link="/how-to",
            action_label="Open Guide",
            action_type="navigate",
            confirmation_chip="Opening Guide...",
            mode="basic",
            suggestion_chips=["Start interactive tour", "Watch video guide"],
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
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Tour Engine"],
            action_type="start_tour",
            confirmation_chip="Starting Tour...",
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
            sources=["AgriSage Localization"],
            action_type="set_lang:te",
            confirmation_chip="Switched to Telugu (తెలుగు)",
            mode="basic",
        )

    # 14. Actions: Switch Language to Hindi
    if match_any(q, ["switch to hindi", "change to hindi", "hindi language", "हिन्दी करें", "भाषा हिन्दी"]):
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text="ऐप की भाषा हिन्दी में बदल दी गई है।",
            status="WORKING",
            sources=["AgriSage Localization"],
            action_type="set_lang:hi",
            confirmation_chip="Switched to Hindi (हिन्दी)",
            mode="basic",
        )

    # 15. Actions: Switch Language to English
    if match_any(q, ["switch to english", "change to english", "english language", "ఇంగ్లీష్ కి మార్చండి", "अंग्रेजी करें"]):
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text="Switched app language to English.",
            status="WORKING",
            sources=["AgriSage Localization"],
            action_type="set_lang:en",
            confirmation_chip="Switched to English",
            mode="basic",
        )

    # 16. Actions: Dark Mode
    if match_any(q, ["turn on dark mode", "dark mode on", "enable dark mode", "డార్క్ మోడ్ ఆన్", "डार्क मोड चालू"]):
        text = {
            "te": "డార్క్ మోడ్ ఆన్ చేయబడింది.",
            "hi": "डार्क मोड चालू कर दिया गया है।",
            "en": "Dark mode has been enabled."
        }.get(lang, "Dark mode enabled.")
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Theme Engine"],
            action_type="set_theme:dark",
            confirmation_chip="Dark Mode On",
            mode="basic",
        )

    # 17. Actions: Light Mode
    if match_any(q, ["turn on light mode", "light mode on", "disable dark mode", "లైట్ మోడ్ ఆన్", "लाइट मोड चालू"]):
        text = {
            "te": "లైట్ మోడ్ ఆన్ చేయబడింది.",
            "hi": "लाइट मोड चालू कर दिया गया है।",
            "en": "Light mode has been enabled."
        }.get(lang, "Light mode enabled.")
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Theme Engine"],
            action_type="set_theme:light",
            confirmation_chip="Light Mode On",
            mode="basic",
        )

    # 18. Actions: Pictorial Mode (Pictures)
    if match_any(q, ["turn on pictorial mode", "pictorial mode on", "pictures mode on", "చిత్రాల మోడ్ ఆన్", "चित्र मोड चालू"]):
        text = {
            "te": "చిత్రాల మోడ్ ఆన్ చేయబడింది.",
            "hi": "चित्र मोड चालू कर दिया गया है।",
            "en": "Pictures visual mode has been activated."
        }.get(lang, "Pictures mode activated.")
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Visual Engine"],
            action_type="set_pictorial:true",
            confirmation_chip="Pictures Mode On",
            mode="basic",
        )

    # 19. Actions: Words Mode
    if match_any(q, ["turn off pictorial mode", "words mode on", "detailed mode on", "వివరాల మోడ్ ఆన్", "विस्तृत मोड चालू"]):
        text = {
            "te": "వివరాల పాఠ్య మోడ్ ఆన్ చేయబడింది.",
            "hi": "विस्तृत टेक्स्ट मोड चालू कर दिया गया है।",
            "en": "Detailed words mode has been activated."
        }.get(lang, "Words mode activated.")
        return VoiceQueryResponse(
            intent="navigation",
            confidence=1.0,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Visual Engine"],
            action_type="set_pictorial:false",
            confirmation_chip="Words Mode On",
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
        return VoiceQueryResponse(
            intent="smalltalk",
            confidence=0.98,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Conversational Engine"],
            mode="basic",
            suggestion_chips=["Will it rain today?", "Should I irrigate?", "What is my profit?"],
        )

    # Gratitude: thanks, thank you
    if match_any(q, ["thanks", "thank you", "thx", "many thanks", "ధన్యవాదాలు", "థాంక్స్", "ధన్యవాదం", "धन्यवाद", "शुक्रिया", "बहुत धन्यवाद"]):
        kw = KEYWORDS_BY_LANG.get(lang, KEYWORDS_BY_LANG["en"])
        return VoiceQueryResponse(
            intent="thanks",
            confidence=0.98,
            confidence_type="rule",
            spoken_text=kw.RESPONSES["thanks"],
            status="WORKING",
            sources=["AgriSage Conversational Engine"],
            action_link="/dashboard",
            action_label="Back to Dashboard",
            mode="basic",
            suggestion_chips=kw.SUGGESTION_CHIPS,
        )

    # Identity / About: who are you, what is your name
    if match_any(q, ["who are you", "what is your name", "what are you", "nuvvu evaru", "నువ్వు ఎవరు", "నీ పేరేంటి", "మీరెవరు", "आप कौन हैं", "तुम्हारा नाम क्या है", "तुम कौन हो"]):
        kw = KEYWORDS_BY_LANG.get(lang, KEYWORDS_BY_LANG["en"])
        return VoiceQueryResponse(
            intent="about",
            confidence=0.98,
            confidence_type="rule",
            spoken_text=kw.RESPONSES["about"],
            status="WORKING",
            sources=["AgriSage System Specification"],
            action_link="/dashboard",
            action_label="Explore Features",
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
    if match_any(q, ["help", "what can you do", "commands", "how to use", "సహాయం", "సహాయం కావాలి", "నీతో ఏమి చేయవచ్చు", "मदद", "क्या कर सकते हो", "सहायता"]):
        text = {
            "te": "నేను ఈ క్రింది పనుల్లో సహాయపడగలను: 1. నేటి వర్షపాత సూచన, 2. నీటిపారుదల సలహా, 3. ఆకు తెగులు గుర్తింపు, 4. వ్యవసాయ లాభం లెక్కింపు, మరియు 5. పేజీలను తెరవడం.",
            "hi": "मैं इन कार्यों में सहायता कर सकता हूँ: 1. आज का मौसम व वर्षा, 2. सिंचाई सलाह, 3. पत्ती रोग पहचान, 4. शुद्ध लाभ गणना, और 5. कोई भी पेज खोलना।",
            "en": "I can assist you with: 1. Today's weather & rain forecast, 2. FAO-56 irrigation advice, 3. Leaf disease diagnosis, 4. Farm profit simulator, and 5. Navigating to any page."
        }.get(lang, "I can assist with weather, irrigation, disease diagnosis, and economics.")
        return VoiceQueryResponse(
            intent="help",
            confidence=0.98,
            confidence_type="rule",
            spoken_text=text,
            status="WORKING",
            sources=["AgriSage Capability Registry"],
            mode="basic",
            suggestion_chips=["Will it rain today?", "Should I irrigate today?", "Open irrigation"],
        )

    return None
