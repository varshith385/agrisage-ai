from pathlib import Path
from typing import List
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_FILE = PROJECT_ROOT / "agrisage.db"
PLACEHOLDER_SECRETS = {
    "agrisage_insecure_development_secret_change_me_in_production",
    "your-secret-key-here",
    "change-me",
    "secret",
    "",
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    DEMO_MODE: bool = True
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    JWT_SECRET: str = "agrisage_insecure_development_secret_change_me_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    DATABASE_URL: str = ""

    DEMO_EXPERT_PASSWORD: str = "ExpertDemo@2026"
    DEMO_BUYER_PASSWORD: str = "BuyerDemo@2026"
    DEMO_ADMIN_PASSWORD: str = "AdminDemo@2026"
    DEMO_FARMER_PASSWORD: str = "FarmerRamesh@2026"

    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    GEMINI_API_KEY: str = ""
    DATA_GOV_IN_API_KEY: str = ""
    HF_TOKEN: str = ""

    ENABLE_DEMO_FALLBACKS: bool = True
    DISEASE_CONFIDENCE_THRESHOLD: float = 0.45  # Adjustable default indicative heuristic
    IMAGE_GATE_THRESHOLD: float = 0.55           # Minimum positive class probability for authoritative acceptance
    IMAGE_GATE_BORDERLINE_THRESHOLD: float = 0.35 # Borderline range [0.35, 0.55) requires explicit user confirmation
    IMAGE_GATE_USE_CLIP: bool = True             # Zero-shot CLIP gate with CPU inference; falls back to heuristics if false/unloaded
    QUALITY_GATE_MIN_LUMINANCE: float = 20.0     # Indicative heuristic
    QUALITY_GATE_MAX_LUMINANCE: float = 240.0    # Indicative heuristic
    QUALITY_GATE_MIN_LAPLACIAN_VAR: float = 60.0 # Indicative heuristic on 224x224 resize
    QUALITY_GATE_MIN_FOLIAR_RATIO: float = 0.20  # Indicative heuristic for vegetative/diseased chromaticity
    MAX_IMAGE_FILE_SIZE_BYTES: int = 15 * 1024 * 1024 # 15 MB
    MAX_IMAGE_PIXELS: int = 25_000_000           # Decompression bomb protection limit
    WEATHER_CACHE_TTL_MINUTES: int = 30

    # Agent Engine & Conflict Resolution Indicative Baselines
    AGENT_TIMEOUT_SECONDS: float = 10.0
    RAIN_CONFLICT_THRESHOLD_MM: float = 15.0  # Indicative baseline from SPEC.md (15mm in 24h)
    RAIN_CONFLICT_WINDOW_HOURS: int = 24
    FUNGAL_HUMIDITY_THRESHOLD_PCT: float = 80.0  # Indicative heuristic for elevated fungal spore germination

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def resolved_database_url(self) -> str:
        if self.DATABASE_URL and self.DATABASE_URL.strip():
            return self.DATABASE_URL.strip()
        # Ensure absolute SQLite path
        db_path = str(DEFAULT_DB_FILE.as_posix())
        return f"sqlite:///{db_path}"

    @model_validator(mode="after")
    def validate_production_jwt_secret(self) -> "Settings":
        if not self.DEBUG and self.JWT_SECRET in PLACEHOLDER_SECRETS:
            raise ValueError(
                "CRITICAL SECURITY: Cannot start application in production (DEBUG=false) "
                "with an insecure placeholder JWT_SECRET! Please configure a secure secret in .env."
            )
        return self


settings = Settings()

