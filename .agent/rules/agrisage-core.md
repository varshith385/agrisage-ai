# AgriSage AI — Core Project Rules & Constraints

## 1. Project Identity & Stack
AgriSage AI is an autonomous multi-agent smart agriculture intelligence system for the Yuktik 2026 hackathon.
- **Frontend**: React (TypeScript, strict mode), Vite, Tailwind CSS, Recharts, Leaflet (`react-leaflet`).
- **Backend**: FastAPI, Pydantic (v2), SQLAlchemy (async or standard session), SQLite, PyJWT.
- **ML & Domain Models**: scikit-learn, XGBoost, pretrained PlantVillage CV model (CPU inference), FAO-56 irrigation balance.
- **Python Environment**: Host default Python is 3.14, which lacks wheel support for many ML libraries. The backend virtual environment must strictly be created with: `py -3.12 -m venv .venv`.

## 2. Repository Folder Structure
```
agrisage-ai/
├── backend/app/          # api, agents, ml, models, schemas, services, database, security
├── backend/tests/        # pytest unit and integration test suite
├── frontend/src/         # components, pages, services, i18n, types
├── frontend/public/      # static assets and manifest
├── datasets/demo/        # public and clearly labelled demo fallback datasets (< 20 MB)
├── model_artifacts/      # model weights & serialized pipelines (.gitignore, never committed)
├── docs/                 # SPEC.md, ACCEPTANCE.md, FEATURE_STATUS.md, DECISIONS.md, etc.
└── scripts/              # setup.ps1, dev.ps1, verify.ps1, download_models.ps1
```

## 3. The 9 Honesty Rules
1. **No Fake AI Output**: Never return hardcoded, dummy, or random numbers as AI output. If a model or API is unavailable, return status `DEMO` with a clear explanation or fail gracefully.
2. **Calibrated Confidence**: Model metric is distinct from prediction confidence. State training limits (e.g., PlantVillage lab images vs real fields). Below threshold, return "uncertain" and recommend expert consultation.
3. **No Sensor Hallucinations**: Never claim standard smartphone photos measure soil moisture. Surface visual stress cues must be labelled as visual indications only, requiring physical confirmation.
4. **No Unlabelled Synthetic Data**: Never generate synthetic training data and present it as real. Synthetic data is permitted only inside tests and must be explicitly identified.
5. **Universal Explainability**: Every recommendation must return `{value, confidence, confidence_type, reasons[], sources[], status, limitations[]}`.
6. **Safe Agricultural Prescriptions**: Never prescribe specific chemical or herbicide dosages. Provide only cultural, organic, and IPM guidance citing authoritative sources (ICAR, SAU, FAO).
7. **Traceable Real-World Figures**: Mandi prices, MSP values, loan terms, and government schemes must cite official sources with a `last_verified` date or be labelled `DEMO`.
8. **Strict Privacy by Default**: Never expose exact farm coordinates or farmer contact details without explicit, revocable consent. External views use village centroids only.
9. **UI & Documentation Parity**: Every feature must display a `<StatusBadge/>` reflecting its real state (`WORKING`, `PARTIAL`, `DEMO`), perfectly synced with `docs/FEATURE_STATUS.md`.

## 4. Status Labelling & Scope Guard
- **Status Labelling**: Every feature is classified as `WORKING`, `PARTIAL`, or `DEMO`. It must render a reusable `<StatusBadge/>` in the UI and be tracked in `docs/FEATURE_STATUS.md`.
- **Scope Guard**: Do NOT begin Tier 2 work until all Tier 1 acceptance checks in `docs/ACCEPTANCE.md` pass. Do NOT begin Tier 3 until Tier 2 is fully complete or explicitly cut.

## 5. Engineering & Windows Host Rules
- **PowerShell Native**: Host OS is Windows. All CLI commands and helper scripts must execute in PowerShell (`.ps1`).
- **Secrets Management**: Secrets (API keys, JWT secrets) load only from environment variables via `.env`. Never commit `.env`.
- **Artifact Protection**: Never commit model weights, `.env`, or dataset files larger than 20 MB.
- **Type Safety**: Python type hints required everywhere. TypeScript `strict: true` enforced on frontend with zero compiler errors.
- **Contract Enforcement**: Every API route must define explicit Pydantic request and response schemas.
- **Internationalization (i18n)**: Every user-facing UI string must pass through i18n (`en`, `te`, `hi`). Zero hardcoded text in UI.

## 6. Verification & Output Evidence Rule
Never claim a task is complete without running the relevant command (test suite, build, `Invoke-RestMethod`, or browser agent) and providing verbatim console/visual output as evidence in an Artifact or in the response.

## 7. Agent Communication & Persistence
Cooperating agents communicate via typed Pydantic models (`AgentEnvelope` with `agent_name`, `status`, `timestamp`, `inputs_used`, `outputs`, `confidence`, `warnings`). Every execution must be persisted in the `agent_runs` database table.

## 8. Autonomous Decision Rule
Make reasonable technical decisions autonomously. Log each decision in `docs/DECISIONS.md` with a one-line reason. Do not pause to ask questions unless strictly blocked by an action only a human can perform (e.g., providing a private API key or completing an authenticated download).

