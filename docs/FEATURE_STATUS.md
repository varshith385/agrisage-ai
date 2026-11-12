# AgriSage AI — Feature Status Ledger (`docs/FEATURE_STATUS.md`)

**Yuktik 2026 Hackathon | Synchronized Code Reality Ledger**

> [!NOTE]
> In accordance with the **Honesty Rules** and the `/status-sync` workflow, status is based strictly on what the codebase currently executes (not planned intent).
> Permitted statuses: `WORKING`, `PARTIAL`, `DEMO`, and `NOT STARTED`.

---

## 1. Feature Status Matrix

| Module / Feature | Tier | Current Status | UI Badge | Evidence / Route | Known Limitations / Notes |
|---|---|---|---|---|---|
| **User Authentication & JWT Security** | Tier 1 | WORKING | `WORKING` | `POST /api/v1/auth/login`, `POST /api/v1/auth/register` | Direct bcrypt hashing, role dependency guards (Farmer/Expert/Buyer/Admin), JWT tokens. |
| **Instant One-Click Demo Mode ("Ramesh")** | Tier 1 | WORKING | `WORKING` | `POST /api/v1/auth/demo-login` | Passwordless demo login restricted exclusively to Farmer Ramesh when DEMO_MODE=true. |
| **Multi-Farm CRUD & Ownership Math** | Tier 1 | WORKING | `WORKING` | `POST /api/v1/farms`, `GET /api/v1/farms` | Multiple farms per user, strict owned+leased area validation on mixed tenure, positive area guards. |
| **Location Hierarchy & Geocoding** | Tier 1 | WORKING | `WORKING` | `GET /api/v1/location/districts`, `/geocode` | 4-state hierarchy, partial village disclosure, Open-Meteo geocoding with centroid fallback. |
| **Resilient Weather Service & Caching** | Tier 1 | WORKING | `WORKING` | `GET /api/v1/weather/current`, `/forecast` | Open-Meteo integration, 30-min TTL SQLite cache, stale=true resilience, 7-day daily ET0 & rain. |
| **Weather Crop Suitability Signal** | Tier 1 | WORKING | `WORKING` | `GET /api/v1/weather/suitability` | Rule-based agronomic window evaluation returning complete ExplainabilitySchema. |
| **Multi-Agent Orchestrator Pipeline** | Tier 1 | WORKING | `WORKING` | `POST /api/v1/agents/run` | Sequential orchestration (Weather → Irrigation → Disease → Yield → Advisory) with typed messages, timeout isolation, and persistence. |
| **Agent Conflict Detection & Resolution** | Tier 1 | WORKING | `WORKING` | `backend/app/agents/conflict_rules.py` | 15mm 24h rain-skip Rule 1 and 80% humidity overhead irrigation Rule 2 conflict detection & resolution. |
| **Dashboard Shell & Agent Activity Log** | Tier 1 | WORKING | `WORKING` | `/dashboard` (UI) | Live weather, crop phenology from API, primary holding summary, animated AgentFlowDiagram, and interactive AgentActivityLog with one-click trigger. |
| **PlantVillage CV Model & Quality Gate** | Tier 1 | WORKING | `WORKING` | `POST /api/v1/disease/predict` | Lightweight MobileNetV2 CPU inference (<150ms). Heuristic quality gate rejects dark (<20), blurry (<60), and non-leaf (<0.20) images with diagnostic feedback. |
| **Calibrated Disease Confidence & Disclaimer** | Tier 1 | WORKING | `WORKING` | `backend/app/ml/disease_model.py` | Explicitly uncalibrated confidence output. Mandatory PlantVillage lab-dataset disclaimer. Low confidence (<45%) inconclusive diagnosis warning prompts KVK consultation. Supported crops card (14 crops) and mismatch warnings for Cotton/Chilli/Rice/Wheat. |
| **Disease Knowledge Base (Safe Prescriptions)** | Tier 1 | WORKING | `WORKING` | `backend/app/ml/disease_kb.json` | 38 classes mapped to symptoms, organic IPM practices, and authoritative citations (IIHR, PJTSAU, FAO). Strictly zero chemical dosages. |
| **Village-Level Disease Telemetry** | Tier 1 | WORKING | `WORKING` | `disease_predictions` table | Ephemeral image handling (images never saved to disk). Outbreak persistence is strictly opt-in (`report_to_outbreak=true`, default unchecked) and stores only village centroid. |
| **Weather-Informed Disease Risk Adjustment** | Tier 1 | WORKING | `WORKING` | `backend/app/agents/disease_agent.py`| Relative humidity >= 80% and 24h rainfall >= 15mm evaluate elevated microclimate fungal risk, presented separately without altering model raw probability. Integrated in DiseaseAgent and conflict rules. |
| **FAO-56 Single Kc Evapotranspiration** | Tier 1 | NOT STARTED | `NOT STARTED` | `POST /api/v1/irrigation/plan` | Awaiting Phase 3 implementation. |
| **Soil Water Balance Bucket Model** | Tier 1 | NOT STARTED | `NOT STARTED` | `backend/app/ml/irrigation_fao56.py` | Awaiting Phase 3 implementation. |
| **Rain-Skip Water Conservation** | Tier 1 | NOT STARTED | `NOT STARTED` | `POST /api/v1/irrigation/plan` | Awaiting Phase 3 implementation. |
| **Irrigation Problem Diagnosis** | Tier 1 | NOT STARTED | `NOT STARTED` | `POST /api/v1/irrigation/diagnose` | Awaiting Phase 3 implementation. |
| **Machine-Learned Crop Recommendation** | Tier 1 | NOT STARTED | `NOT STARTED` | `POST /api/v1/recommend/crop` | Awaiting Phase 3 implementation. |
| **Yield Regressor with Prediction Intervals** | Tier 1 | NOT STARTED | `NOT STARTED` | `POST /api/v1/yield/predict` | Awaiting Phase 3 implementation. |
| **Dynamic Yield Adjustment Heuristics** | Tier 1 | NOT STARTED | `NOT STARTED` | `backend/app/agents/yield_agent.py` | Awaiting Phase 3 implementation. |
| **Growth-Stage Engine (DAS & Phenology)** | Tier 1 | NOT STARTED | `NOT STARTED` | `backend/app/services/growth_stage.py`| Awaiting Phase 3 implementation. |
| **Growth-Stage-Aware Guidance & Tasks** | Tier 1 | NOT STARTED | `NOT STARTED` | `GET /api/v1/advisory/tasks` | Awaiting Phase 3 implementation. |
| **Advisory Coordinator (7-Day Plan)** | Tier 1 | NOT STARTED | `NOT STARTED` | `POST /api/v1/advisory/plan` | Awaiting Phase 3 implementation. |
| **Farm Health Score (0–100) & Breakdown** | Tier 1 | NOT STARTED | `NOT STARTED` | `/dashboard` gauge widget | Awaiting Phase 3 implementation. |
| **Universal Explainable "Because..." Cards** | Tier 1 | WORKING | `WORKING` | `<ExplainCard/>` component | Standardized component rendering reasons, sources, limitations, confidence, and status. |
| **Cost of Cultivation Engine (`Decimal`)** | Tier 1 | NOT STARTED | `NOT STARTED` | `POST /api/v1/economics/calculate` | Awaiting Phase 4 implementation. |
| **Owned vs Leased vs Mixed Tenure Math** | Tier 1 | NOT STARTED | `NOT STARTED` | `backend/app/services/economics.py` | Awaiting Phase 4 implementation. |
| **Interactive What-If Scenario Simulator** | Tier 1 | NOT STARTED | `NOT STARTED` | `/economics` slider view | Awaiting Phase 4 implementation. |
| **Side-by-Side Crop Comparison** | Tier 1 | NOT STARTED | `NOT STARTED` | `GET /api/v1/economics/compare` | Awaiting Phase 4 implementation. |
| **Agronomic Crop Rotation Planner** | Tier 1 | NOT STARTED | `NOT STARTED` | `GET /api/v1/rotation/recommend` | Awaiting Phase 4 implementation. |
| **Crop Lifecycle Calendar & `.ics` Export** | Tier 1 | NOT STARTED | `NOT STARTED` | `GET /api/v1/calendar/export.ics` | Awaiting Phase 4 implementation. |
| **Seasonal Awareness Engine (Kharif/Rabi)** | Tier 1 | NOT STARTED | `NOT STARTED` | `GET /api/v1/calendar/season` | Awaiting Phase 4 implementation. |
| **Mobile-First Design System** | Tier 1 | WORKING | `WORKING` | `frontend/src/` | Warm earthy AgriTech theme, 44px tap targets, bottom navigation, evaluated at 390px. |
| **Multilingual i18n (`en`, `te`, `hi`)** | Tier 1 | WORKING | `WORKING` | `frontend/src/i18n/` | Full i18n dictionary for English, Telugu, and Hindi; Noto Sans Telugu & Devanagari fonts. |
| **Voice Assistant (STT & TTS)** | Tier 1 | NOT STARTED | `NOT STARTED` | `<VoiceAssistant/>` global FAB | Awaiting Phase 2/6 implementation. |
| **Voice Capability Detection & Fallback** | Tier 1 | NOT STARTED | `NOT STARTED` | `POST /api/v1/voice/query` | Awaiting Phase 2/6 implementation. |
| **Community Groups & Peer Boards** | Tier 2 | NOT STARTED | `NOT STARTED` | `POST /api/v1/community/groups` | Awaiting Phase 5 implementation. |
| **Pooled Transport & Input Purchasing** | Tier 2 | NOT STARTED | `NOT STARTED` | `POST /api/v1/community/requests` | Awaiting Phase 5 implementation. |
| **Opt-in Contact Sharing Flow** | Tier 2 | NOT STARTED | `NOT STARTED` | `group_members.consent_*` | Awaiting Phase 5 implementation. |
| **Machinery Rental Hub & Distance Search** | Tier 2 | NOT STARTED | `NOT STARTED` | `GET /api/v1/machinery/listings` | Awaiting Phase 5 implementation. |
| **Disease Outbreak Map (Village Clusters)** | Tier 2 | NOT STARTED | `NOT STARTED` | `/community#outbreak-map` | Awaiting Phase 5 implementation. |
| **Mandi Price Service & AGMARKNET Client** | Tier 2 | NOT STARTED | `NOT STARTED` | `GET /api/v1/market/prices` | Awaiting Phase 5 implementation. |
| **Net Realization Mandi Ranking** | Tier 2 | NOT STARTED | `NOT STARTED` | `GET /api/v1/market/ranking` | Awaiting Phase 5 implementation. |
| **MSP Benchmark Comparison** | Tier 2 | NOT STARTED | `NOT STARTED` | `GET /api/v1/market/msp` | Awaiting Phase 5 implementation. |
| **Farmer-to-Buyer Marketplace** | Tier 2 | NOT STARTED | `NOT STARTED` | `POST /api/v1/marketplace/listings`| Awaiting Phase 5 implementation. |
| **Government Scheme Matching Engine** | Tier 2 | NOT STARTED | `NOT STARTED` | `GET /api/v1/schemes/match` | Awaiting Phase 5 implementation. |
| **Institutional Loan EMI Calculator** | Tier 2 | NOT STARTED | `NOT STARTED` | `POST /api/v1/loans/calculate-emi` | Awaiting Phase 5 implementation. |
| **Soil Health Card Upload & Pluggable OCR** | Tier 2 | NOT STARTED | `NOT STARTED` | `/schemes#soil-card-upload` | Awaiting Phase 5 implementation. |

