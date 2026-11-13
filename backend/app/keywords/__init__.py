"""
AgriSage AI — Multilingual Keywords Package (en, te, hi)
"""

from backend.app.keywords import en, te, hi

KEYWORDS_BY_LANG = {
    "en": en,
    "te": te,
    "hi": hi,
}

__all__ = ["en", "te", "hi", "KEYWORDS_BY_LANG"]
