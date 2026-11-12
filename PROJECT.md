# AgriSage AI: Autonomous Multi-Agent Smart Agriculture Intelligence System

**Yuktik 2026 Hackathon**

---

## 1. Problem Statement & Agronomic Vision

Smallholder and tenant farmers in India face compounding agronomic and financial volatility:
- **Fragmented Advice**: Guidance for weather, irrigation, disease diagnosis, and fertilizer is siloed across disparate platforms or word-of-mouth.
- **Tenure Inequity**: Over 30% of Indian cultivable land is farmed under oral or informal leases. Most AgriTech tools assume land ownership and produce inaccurate profit projections by ignoring lease rentals and tenure-specific eligibility.
- **Sensor Hallucinations & Opacity**: Farmers are often misled by "AI" apps claiming that smartphone cameras can calculate soil moisture or that guarantee yield figures without confidence intervals or agronomic explanation.
- **Market Asymmetry**: Farmers sell at suboptimal mandi prices due to lack of net-realization calculations (transport cost, market fees) and inability to pool logistics with neighboring peers.

**Vision**: AgriSage AI is an honest, autonomous, multi-agent agricultural intelligence platform. It coordinates five specialized domain agents (Weather, Irrigation, Disease, Yield, and Advisory) using verified agronomic formulas (such as FAO-56 single crop coefficient evapotranspiration) and honest machine learning. It provides tenure-aware economics, transparent explainability ("because..."), multilingual voice interaction (`en`, `te`, `hi`), and peer collaboration while respecting strict privacy boundaries.

---

## 2. User Roles & Personas

1. **Farmer (Primary)**:
   - Needs actionable daily advice in their native language (English, Telugu, Hindi) via text or voice.
   - Manages owned, leased, or mixed landholdings.
   - Requires transparent cost-of-cultivation calculations, break-even targets, disease diagnosis with safe non-chemical guidance, and irrigation schedules.
2. **Agricultural Expert / KVK Extension Officer**:
   - Reviews regional anonymized disease outbreak trends at the village level.
   - Verifies agronomic advice templates, scheme guidelines, and knowledge base updates.
   - Validates farmer community requests and marketplace listings.
3. **Buyer / FPO Procurement Agent**:
   - Discovers harvest listings by crop, quantity, and village centroid.
   - Submits purchase inquiries without seeing personal contact numbers until the farmer explicitly accepts.
   - Requires verified seller badges administered through the platform.
4. **Admin**:
   - Manages platform governance, user verification workflows, and content moderation.
   - Audits contact-sharing consent logs and ensures privacy compliance.

---

## 3. The 5-Minute Hackathon Demo Narrative

The live demonstration follows the journey of farmer **Ramesh** from a village in Telangana:

1. **One-Click Demo Entry & Telugu Voice Query**:
   - Ramesh clicks "Demo Mode" on the Welcome screen.
   - The app instantly authenticates him, sets the language to Telugu (`te`), and preloads his 5-acre mixed landholding (3 acres owned, 2 acres leased) with a previous cotton cycle.
   - Ramesh taps the global floating voice button and speaks in Telugu: *"వరి వేయవచ్చా? ఎంత ఖర్చవుతుంది?"* ("Can I plant paddy? How much will it cost?").
2. **Crop Recommendation & Tenure-Aware Economics**:
   - The platform evaluates soil parameters, local weather, and previous cotton rotation. It recommends groundnut and maize, flagging paddy with water warnings.
   - The economics engine displays a detailed cost-of-cultivation breakdown using `Decimal` arithmetic, separating owned land costs from lease rental costs, and calculates break-even yield and price.
3. **Plant Disease Diagnosis & Safe Guidance**:
   - Ramesh uploads a photo of a diseased leaf. The quality gate confirms image clarity, and the PlantVillage model classifies Early Blight with calibrated confidence (distinguishing model metrics from prediction confidence).
   - The advice provides cultural and organic IPM measures (zero hazardous chemical dosages) and links to government disease-assistance schemes.
4. **Weather Risk Alert & Rain-Skip Irrigation**:
   - The Weather agent detects a forecasted 22 mm rainfall event in the next 36 hours.
   - The Irrigation agent runs the FAO-56 single crop coefficient model ($ET_c = K_c \times ET_0$), automatically flags a "Skip Irrigation" action, and calculates **142,000 litres of water saved**.
5. **Community Pooling & Outbreak Awareness**:
   - The community screen shows 4 nearby farmers in the same village centroid needing DAP and harvest transport. Ramesh joins a pooled truck request, saving ₹1,400 in transport costs.
   - The disease outbreak map displays anonymized cluster reports at the village level without exposing exact farm coordinates.
6. **Market Intelligence & Final 7-Day Plan**:
   - The market engine compares nearby mandis by net realization (modal price minus haversine transport costs and market cess) and checks MSP benchmarks.
   - The Advisory coordinator synthesizes all agent outputs into a unified 7-day action plan with an overall Farm Health Score (84/100) and an explainable "because..." rationale on every item, read aloud in natural Telugu via text-to-speech.

---

## 4. Technology Stack & Technical Rationale

| Layer | Selected Technologies | Rationale for Choice |
|---|---|---|
| **Frontend Framework** | React 18, TypeScript (`strict: true`), Vite | High developer velocity, rapid HMR on Windows, strict type safety to prevent UI runtime errors during judging. |
| **Styling & UI Components** | Tailwind CSS, Lucide React, Google Noto Fonts | Mobile-first responsive design, custom earthy agricultural color system, native glyph support for Telugu and Devanagari. |
| **Data Visualization & Maps** | Recharts, Leaflet (`react-leaflet`) | Lightweight interactive charts for economics and water balance; zero-API-key open-source mapping for mandis and outbreak telemetry. |
| **Backend Framework** | FastAPI (Python 3.12, ASGI) | High performance, native async support, automated OpenAPI contract generation, and seamless integration with Python ML tools. |
| **Data Validation & Schemas**| Pydantic v2 | Strict request/response validation, automatic serialization, and runtime schema enforcement for all inter-agent messages. |
| **Database & ORM** | SQLite, SQLAlchemy 2.0 (async/sync session) | Zero-external-dependency local database perfect for self-contained hackathon evaluation and idempotent seeding. |
| **Authentication & Security** | PyJWT, Passlib (bcrypt) | Stateless authentication, role-based access control (Farmer, Expert, Buyer, Admin), secure password hashing. |
| **Machine Learning & CV** | scikit-learn, XGBoost, PyTorch / ONNX (CPU) | High-performance CPU inference for crop recommendation, yield prediction intervals, and pretrained PlantVillage leaf disease classification. |
| **Domain Agronomy Models** | FAO-56 Single Crop Coefficient ($ET_c = K_c \times ET_0$) | Internationally validated standard for crop evapotranspiration and soil moisture water balance without requiring expensive IoT sensors. |
| **Voice & Speech Interface** | Browser Web Speech API (`SpeechRecognition`, `speechSynthesis`) | Zero-cost client-side speech recognition and synthesis in `en-IN`, `te-IN`, and `hi-IN` with graceful fallback to typed text queries. |

---

## 5. Repository Directory Structure

```
agrisage-ai/
├── .agent/
│   ├── rules/
│   │   └── agrisage-core.md          # Always-on project guidelines and honesty rules
│   └── workflows/
│       ├── verify.md                 # /verify full-stack verification workflow
│       └── status-sync.md            # /status-sync feature audit workflow
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI application initialization & middleware
│   │   ├── config.py                 # Pydantic-settings configuration loading from .env
│   │   ├── api/                      # Route handlers grouped by module
│   │   │   ├── __init__.py
│   │   │   ├── v1/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── location.py
│   │   │   │   ├── weather.py
│   │   │   │   ├── farms.py
│   │   │   │   ├── agents.py
│   │   │   │   ├── disease.py
│   │   │   │   ├── irrigation.py
│   │   │   │   ├── yield_api.py
│   │   │   │   ├── economics.py
│   │   │   │   ├── recommend.py
│   │   │   │   ├── rotation.py
│   │   │   │   ├── market.py
│   │   │   │   ├── community.py
│   │   │   │   ├── schemes.py
│   │   │   │   ├── voice.py
│   │   │   │   └── health.py
│   │   ├── agents/                   # Five cooperating agents & orchestrator
│   │   │   ├── __init__.py
│   │   │   ├── base.py               # Abstract BaseAgent with persistence & envelope
│   │   │   ├── orchestrator.py       # Sequential orchestrator & conflict resolver
│   │   │   ├── weather_agent.py
│   │   │   ├── irrigation_agent.py
│   │   │   ├── disease_agent.py
│   │   │   ├── yield_agent.py
│   │   │   └── advisory_agent.py
│   │   ├── ml/                       # Machine learning inference & feature pipelines
│   │   │   ├── __init__.py
│   │   │   ├── disease_model.py      # PlantVillage CV loader & quality gate
│   │   │   ├── irrigation_fao56.py   # FAO-56 single Kc water balance engine
│   │   │   ├── crop_recommender.py   # Trained classifier loader & explainability
│   │   │   ├── yield_regressor.py    # Yield predictor with prediction intervals
│   │   │   └── disease_kb.json       # Authoritative disease symptoms & non-chemical IPM
│   │   ├── models/                   # SQLAlchemy ORM database models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── farm.py
│   │   │   ├── weather.py
│   │   │   ├── agent_run.py
│   │   │   ├── disease.py
│   │   │   ├── economics.py
│   │   │   ├── market.py
│   │   │   ├── community.py
│   │   │   └── scheme.py
│   │   ├── schemas/                  # Pydantic v2 request & response schemas
│   │   │   ├── __init__.py
│   │   │   ├── envelope.py           # AgentEnvelope & explainability models
│   │   │   ├── auth.py
│   │   │   ├── farm.py
│   │   │   ├── weather.py
│   │   │   ├── disease.py
│   │   │   ├── irrigation.py
│   │   │   ├── economics.py
│   │   │   └── voice.py
│   │   ├── services/                 # Business logic and external API clients
│   │   │   ├── __init__.py
│   │   │   ├── open_meteo.py         # Weather client with caching
│   │   │   ├── growth_stage.py       # Phenological stage timeline engine
│   │   │   └── rotation_logic.py     # Agronomic rotation rules
│   │   ├── database/                 # Database connection & session setup
│   │   │   ├── __init__.py
│   │   │   └── session.py
│   │   └── security/                 # Password hashing & JWT helpers
│   │       ├── __init__.py
│   │       └── auth.py
│   └── tests/                        # Comprehensive pytest test suite
│       ├── __init__.py
│       ├── conftest.py
│       ├── test_auth.py
│       ├── test_farms.py
│       ├── test_weather.py
│       ├── test_fao56.py
│       ├── test_agents.py
│       ├── test_economics.py
│       └── test_voice.py
├── frontend/
│   ├── public/                       # Static public assets, favicon, manifest
│   ├── src/
│   │   ├── components/               # Reusable UI design system components
│   │   │   ├── StatusBadge.tsx       # WORKING / PARTIAL / DEMO badge
│   │   │   ├── ConfidenceMeter.tsx   # Model metric vs prediction confidence
│   │   │   ├── ExplainCard.tsx       # "Because..." rationale card
│   │   │   ├── VoiceAssistant.tsx    # Global floating voice modal present on all pages
│   │   │   ├── Navbar.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── ActivityLog.tsx
│   │   ├── pages/                    # 12 Core application views
│   │   │   ├── WelcomePage.tsx       # Welcome, Auth & Demo Mode entry
│   │   │   ├── SetupPage.tsx         # Location & Language selection
│   │   │   ├── FarmPage.tsx          # Multi-farm profile & tenure management
│   │   │   ├── DashboardPage.tsx     # Executive farmer dashboard & Health Score
│   │   │   ├── RecommendPage.tsx     # Crop recommendation & rotation
│   │   │   ├── DiseasePage.tsx       # Leaf disease detection & safe IPM
│   │   │   ├── IrrigationPage.tsx    # Water balance & rain-skip savings
│   │   │   ├── EconomicsPage.tsx     # Cost lines, break-even & what-if simulator
│   │   │   ├── CalendarPage.tsx      # Agronomic timeline & .ics export
│   │   │   ├── CommunityPage.tsx     # Peer pooling, machinery & Outbreak Map
│   │   │   ├── MarketPage.tsx        # Mandi rankings, MSP & marketplace
│   │   │   └── SchemesPage.tsx       # Government schemes, loans & Soil Health Card OCR
│   │   ├── services/                 # Typed API client functions
│   │   │   └── api.ts
│   │   ├── i18n/                     # Internationalization dictionaries
│   │   │   ├── en.json
│   │   │   ├── te.json
│   │   │   └── hi.json
│   │   ├── types/                    # TypeScript interfaces matching API schemas
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── datasets/
│   ├── demo/                         # Labelled fallback sample datasets (< 20 MB)
│   │   ├── mandi_prices.csv
│   │   ├── sample_leaves/
│   │   └── demo_schemes.json
│   └── README.md                     # Data sources and attribution
├── model_artifacts/                  # Trained model weights & joblib pipelines (.gitignored)
├── docs/
│   ├── MASTER_PROMPT.md              # Permanent hackathon project specification
│   ├── ENVIRONMENT.md               # Host environment diagnostic results
│   ├── ACCEPTANCE.md                 # Numbered acceptance checks (T1-01 to T1-42)
│   ├── SPEC.md                       # Comprehensive API, DB, and UI functional specification
│   ├── ARCHITECTURE.md               # System architecture and data flow diagrams
│   ├── DATA_SOURCES.md               # Catalog of datasets with verification status
│   ├── FEATURE_STATUS.md             # Live feature status ledger
│   └── DECISIONS.md                  # Architectural decision record
├── scripts/                          # Windows PowerShell automation scripts
│   ├── setup.ps1                     # Virtualenv creation, dependency installation, seeding
│   ├── dev.ps1                       # Starts both frontend and backend concurrently
│   ├── dev-backend.ps1               # Starts FastAPI server on port 8000
│   ├── dev-frontend.ps1              # Starts Vite dev server on port 5173
│   ├── seed.py                       # Idempotent database seeder for Ramesh & demo data
│   └── download_models.ps1           # Fetches pretrained CV weights into model_artifacts/
├── .env.example                      # Documented environment variable template
├── .gitignore                        # Git ignore rules protecting secrets & binary assets
└── README.md                         # Quickstart, architecture overview, and team guide
```

