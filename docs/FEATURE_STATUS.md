# AgriSage AI — Feature Status Ledger (`docs/FEATURE_STATUS.md`)

**Yuktik 2026 Hackathon | Synchronized Code Reality Ledger**

> [!NOTE]
> In accordance with the **Honesty Rules** and the `/status-sync` workflow, status is based strictly on what the codebase currently executes (not planned intent).
> Permitted statuses: `WORKING`, `PARTIAL`, `DEMO`, and `NOT STARTED`.

---

## 1. Feature Status Matrix

| Module / Feature | Tier | Current Status | UI Badge | Evidence / Route | Known Limitations / Notes |
|---|---|---|---|---|---|
| **User Authentication & JWT Security** | Tier 1 | NOT STARTED | `NOT STARTED` | `POST /api/v1/auth/login` | Awaiting Phase 2 implementation. |
| **Instant One-Click Demo Mode ("Ramesh")** | Tier 1 | NOT STARTED | `NOT STARTED` | `POST /api/v1/auth/demo-login` | Awaiting Phase 2 implementation. |
| **Multi-Farm CRUD & Ownership Math** | Tier 1 | NOT STARTED | `NOT STARTED` | `POST /api/v1/farms` | Awaiting Phase 2 implementation. |
| **Location Hierarchy & Geocoding** | Tier 1 | NOT STARTED | `NOT STARTED` | `GET /api/v1/location/districts` | Awaiting Phase 2 implementation. |
| **Resilient Weather Service & Caching** | Tier 1 | NOT STARTED | `NOT STARTED` | `GET /api/v1/weather/current` | Awaiting Phase 2 implementation. |
| **Weather Crop Suitability Signal** | Tier 1 | NOT STARTED | `NOT STARTED` | `GET /api/v1/weather/suitability` | Awaiting Phase 2 implementation. |
| **Multi-Agent Orchestrator Pipeline** | Tier 1 | NOT STARTED | `NOT STARTED` | `POST /api/v1/agents/run` | Awaiting Phase 3 implementation. |
| **Agent Conflict Detection & Resolution** | Tier 1 | NOT STARTED | `NOT STARTED` | `backend/app/agents/orchestrator.py` | Awaiting Phase 3 implementation. |
| **Dashboard Shell & Agent Activity Log** | Tier 1 | NOT STARTED | `NOT STARTED` | `/dashboard` (UI) | Awaiting Phase 2 & 3 implementation. |
| **PlantVillage CV Model & Quality Gate** | Tier 1 | NOT STARTED | `NOT STARTED` | `POST /api/v1/disease/predict` | Awaiting Phase 3 implementation. |
| **Calibrated Disease Confidence & Disclaimer** | Tier 1 | NOT STARTED | `NOT STARTED` | `backend/app/ml/disease_model.py` | Awaiting Phase 3 implementation. |
| **Disease Knowledge Base (Safe Prescriptions)** | Tier 1 | NOT STARTED | `NOT STARTED` | `backend/app/ml/disease_kb.json` | Awaiting Phase 3 implementation. |
| **Village-Level Disease Telemetry** | Tier 1 | NOT STARTED | `NOT STARTED` | `disease_predictions` table | Awaiting Phase 3 implementation. |
| **Weather-Informed Disease Risk Adjustment** | Tier 1 | NOT STARTED | `NOT STARTED` | `backend/app/agents/disease_agent.py`| Awaiting Phase 3 implementation. |
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
| **Universal Explainable "Because..." Cards** | Tier 1 | NOT STARTED | `NOT STARTED` | `<ExplainCard/>` component | Awaiting Phase 2 implementation. |
| **Cost of Cultivation Engine (`Decimal`)** | Tier 1 | NOT STARTED | `NOT STARTED` | `POST /api/v1/economics/calculate` | Awaiting Phase 4 implementation. |
| **Owned vs Leased vs Mixed Tenure Math** | Tier 1 | NOT STARTED | `NOT STARTED` | `backend/app/services/economics.py` | Awaiting Phase 4 implementation. |
| **Interactive What-If Scenario Simulator** | Tier 1 | NOT STARTED | `NOT STARTED` | `/economics` slider view | Awaiting Phase 4 implementation. |
| **Side-by-Side Crop Comparison** | Tier 1 | NOT STARTED | `NOT STARTED` | `GET /api/v1/economics/compare` | Awaiting Phase 4 implementation. |
| **Agronomic Crop Rotation Planner** | Tier 1 | NOT STARTED | `NOT STARTED` | `GET /api/v1/rotation/recommend` | Awaiting Phase 4 implementation. |
| **Crop Lifecycle Calendar & `.ics` Export** | Tier 1 | NOT STARTED | `NOT STARTED` | `GET /api/v1/calendar/export.ics` | Awaiting Phase 4 implementation. |
| **Seasonal Awareness Engine (Kharif/Rabi)** | Tier 1 | NOT STARTED | `NOT STARTED` | `GET /api/v1/calendar/season` | Awaiting Phase 4 implementation. |
| **Mobile-First Design System** | Tier 1 | NOT STARTED | `NOT STARTED` | `frontend/src/` | Awaiting Phase 2 implementation. |
| **Multilingual i18n (`en`, `te`, `hi`)** | Tier 1 | NOT STARTED | `NOT STARTED` | `frontend/src/i18n/` | Awaiting Phase 2 implementation. |
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

