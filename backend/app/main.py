import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.app.config import settings
from backend.app.database.session import init_db
from backend.app.api.v1.health import router as health_router
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.location import router as location_router
from backend.app.api.v1.weather import router as weather_router
from backend.app.api.v1.farms import router as farms_router
from backend.app.api.v1.agents import router as agents_router
from backend.app.api.v1.disease import router as disease_router
from backend.app.api.v1.irrigation import router as irrigation_router
from backend.app.api.v1.crop_recommendation import router as crop_recommendation_router
from backend.app.api.v1.yield_prediction import router as yield_router
from backend.app.api.v1.advisory import router as advisory_router
from backend.app.api.v1.economics import router as economics_router
from backend.app.api.v1.rotation import router as rotation_router
from backend.app.api.v1.calendar import router as calendar_router
from backend.app.api.v1.voice import router as voice_router
from backend.app.api.v1.soil_card import router as soil_card_router
from backend.app.api.v1.community import router as community_router
from backend.app.api.v1.machinery import router as machinery_router
from backend.app.api.v1.outbreaks import router as outbreaks_router
from backend.app.api.v1.market import router as market_router
from backend.app.api.v1.marketplace import router as marketplace_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist
    init_db()
    yield
    # Shutdown logic if any


app = FastAPI(
    title="AgriSage AI API",
    description="Multi-agent smart agriculture intelligence system for the Yuktik 2026 hackathon.",
    version="1.0.0",
    lifespan=lifespan,
)

# 1. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 2. Request-ID Middleware
@app.middleware("http")
async def request_id_logging_middleware(request: Request, call_next):
    req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = req_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = req_id
    return response


# 3. Global Exception Handlers
def _serialize_errors(errors: list) -> list:
    serialized = []
    for err in errors:
        item = dict(err)
        if "ctx" in item and isinstance(item["ctx"], dict):
            item["ctx"] = {k: str(v) for k, v in item["ctx"].items()}
        serialized.append(item)
    return serialized


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    req_id = getattr(request.state, "request_id", "unknown")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "error_code": f"HTTP_{exc.status_code}",
            "request_id": req_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        headers=getattr(exc, "headers", None),
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    req_id = getattr(request.state, "request_id", "unknown")
    raw_errors = exc.errors()
    clean_errors = _serialize_errors(raw_errors)
    error_msg = "; ".join(f"{e.get('loc', [])}: {e.get('msg', '')}" for e in raw_errors)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": error_msg or "Validation error on request payload.",
            "errors": clean_errors,
            "error_code": "VALIDATION_ERROR",
            "request_id": req_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    req_id = getattr(request.state, "request_id", "unknown")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred.",
            "error_code": "INTERNAL_SERVER_ERROR",
            "request_id": req_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


# 4. Include Routers under /api/v1
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(location_router, prefix=settings.API_V1_PREFIX)
app.include_router(weather_router, prefix=settings.API_V1_PREFIX)
app.include_router(farms_router, prefix=settings.API_V1_PREFIX)
app.include_router(agents_router, prefix=settings.API_V1_PREFIX)
app.include_router(disease_router, prefix=settings.API_V1_PREFIX)
app.include_router(irrigation_router, prefix=settings.API_V1_PREFIX)
app.include_router(crop_recommendation_router, prefix=settings.API_V1_PREFIX)
app.include_router(yield_router, prefix=settings.API_V1_PREFIX)
app.include_router(advisory_router, prefix=settings.API_V1_PREFIX)
app.include_router(economics_router, prefix=settings.API_V1_PREFIX)
app.include_router(rotation_router, prefix=settings.API_V1_PREFIX)
app.include_router(calendar_router, prefix=settings.API_V1_PREFIX)
app.include_router(voice_router, prefix=settings.API_V1_PREFIX)
app.include_router(soil_card_router, prefix=settings.API_V1_PREFIX)
app.include_router(community_router, prefix=settings.API_V1_PREFIX)
app.include_router(machinery_router, prefix=settings.API_V1_PREFIX)
app.include_router(outbreaks_router, prefix=settings.API_V1_PREFIX)
app.include_router(market_router, prefix=settings.API_V1_PREFIX)
app.include_router(marketplace_router, prefix=settings.API_V1_PREFIX)
