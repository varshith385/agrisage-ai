"""
AgriSage AI — English Keywords & Small Talk
"""

GREETINGS = [
    "hi",
    "hello",
    "hey",
    "namaste",
    "namaskar",
    "good morning",
    "good afternoon",
    "good evening",
    "greetings",
    "howdy",
]

THANKS = [
    "thanks",
    "thank you",
    "thank you so much",
    "thanks a lot",
    "appreciate it",
    "grateful",
]

BYE = [
    "bye",
    "goodbye",
    "see you",
    "exit",
    "quit",
    "farewell",
    "talk to you later",
]

ABOUT = [
    "who are you",
    "what is your name",
    "what can you do",
    "introduce yourself",
    "about you",
    "help",
    "what do you do",
    "features",
]

WEATHER_KEYWORDS = [
    "weather", "rain", "temperature", "forecast", "climate", "storm",
    "wind", "humidity", "hot", "cloud", "cloudy", "sunny", "precipitation"
]

IRRIGATION_KEYWORDS = [
    "water", "irrigate", "irrigation", "moisture", "dry", "soil water",
    "watering", "drip", "sprinkler", "flood", "bucket", "pump", "fao-56",
    "fao56", "thirst"
]

DISEASE_KEYWORDS = [
    "disease", "pest", "leaf", "blight", "fungus", "spot", "insect",
    "yellowing", "rot", "sick", "infection", "curl", "wilt", "diagnos",
    "scab", "mildew", "spray", "pesticide", "insecticide", "fungicide",
    "chemical", "monocrotophos", "chlorpyrifos"
]

COST_KEYWORDS = [
    "cost", "expense", "budget", "profit", "margin", "economics",
    "spending", "money", "rupees", "investment", "per acre", "cultivation cost"
]

SCHEME_KEYWORDS = [
    "scheme", "subsidy", "government", "rythu bandhu", "rythu bharosa",
    "pm kisan", "pm-kisan", "bima", "yojana", "assistance", "grant",
    "pension", "portal", "loan waiver"
]

PRICE_KEYWORDS = [
    "mandi", "market", "price", "rate", "msp", "bhav", "selling price",
    "commodity", "auction", "yard"
]

SUGGESTION_CHIPS = [
    "Will it rain today?",
    "Should I irrigate today?",
    "Diagnose leaf disease",
    "Cotton cultivation cost",
    "Mandi market price",
]

RESPONSES = {
    "greeting": (
        "Hello! I am AgriSage AI, your agronomic assistant. I can help you with: "
        "1. Live Weather forecasts, 2. Live Irrigation crop water budgets, 3. Live Plant Disease diagnosis, "
        "4. Live Farm Economics & profit simulation, and 5. Mandi Market prices (Demo). How can I help your farm today?"
    ),
    "about": (
        "I am AgriSage AI, an agronomic decision support assistant for Indian farmers. "
        "Working features include Live Weather, Irrigation Budgeting, Disease Scanner, and Farm Economics, "
        "plus Mandi Prices (Demo). Government schemes are not available on this version. What would you like to check?"
    ),
    "thanks": "You're very welcome! Wishing you a healthy and prosperous harvest!",
    "bye": "Goodbye! Take care of your fields, and feel free to return whenever you need farm guidance.",
    "unknown": "I don't know, please consult an agriculture officer.",
}
