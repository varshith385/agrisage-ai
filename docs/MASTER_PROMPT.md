# AgriSage AI — Antigravity Prompt Pack (Yuktik 2026)

## 0. What is going on (read this first)

Your master prompt is excellent as a **spec**, but it is too large to give an agent as one instruction. A single huge prompt makes the agent skim, skip, and fake things. The fix:

1. Store the master prompt **inside the repo** as the permanent source of truth.
2. Make Antigravity load it **automatically** through a Rule, so every agent in every conversation remembers the honesty rules and the structure.
3. Feed the work in **small, verifiable phases**. Each prompt has a Definition of Done and the agent must run something to prove it.
4. Use **Agent Manager** to run parallel agents on separate folders (backend / frontend / ML / data) once the contracts exist.
5. Finish with an adversarial **audit** prompt that hunts fake outputs and breaks the app like a judge would.

### Risks I found in the plan, and how the prompts handle them
| Risk | Handling |
|---|---|
| 24 hours, 5 people, huge scope | Strict tiers. Tier 1 is frozen first. A "scope guard" rule stops agents from starting Tier 2 before Tier 1 passes. |
| Agents fake "AI" output | Honesty rules are a Rule file, plus an audit prompt that greps for hardcoded/random outputs. |
| Pretrained disease model needs internet and a license check | Prompt 3.2 tells the agent to pick the model, record the license, and fall back honestly if it can't download. |
| Soil Health Card OCR needs Tesseract (a Windows install) | Prompt 5.6 makes OCR pluggable (EasyOCR / Tesseract / vision LLM) with a confirm-values screen, so it never silently trusts OCR. |
| data.gov.in needs an API key; markets may be unreachable | Cached and labelled DEMO fallback is mandatory. |
| Telugu voice differs by browser | Voice prompt requires a capability check and graceful fallback. |
| Demo failing live | Prompt 8 builds Demo Mode, offline cache, and a pre-demo smoke test script. |
| Merge conflicts between 5 humans plus agents | Folder ownership map in section 2. |

---

## 1. Setup you do manually (10 minutes, before any prompt)

1. Save your master prompt text into the repo as `docs/MASTER_PROMPT.md` (copy the whole document you pasted to me). Commit it.
2. In Antigravity, open **Settings → Agent** and set:
   - Mode: **Planning** (not Fast) for Prompts 1 to 5. You can use Fast for small fixes later.
   - Terminal policy: **Request review** (or Auto if you trust it. Not on a machine with secrets you care about).
   - Browser: enable the **browser agent / Chrome extension**, so the agent can open `localhost` and verify pages itself.
3. Install on your laptop: **Python 3.11 or 3.12**, **Node 20 LTS**, **Git**. Check with `python --version`, `node --version`, `git --version`.
4. Optional keys (put them into `.env` later, never in chat): `GEMINI_API_KEY` (free tier, for chat/translation), `DATA_GOV_IN_API_KEY` (mandi prices), `HF_TOKEN` (only if the model repo needs it).
5. Use a **separate Git branch per teammate/agent task**: `git checkout -b feat/<area>`.

### Folder ownership (so five people and several agents do not collide)
- Person 1: `backend/app/api`, `models`, `schemas`, `database`, `security`
- Person 2: `backend/app/agents`, `ml`, `scripts` (models and training/eval)
- Person 3: `frontend` core (layout, auth, dashboard, i18n)
- Person 4: `frontend` feature pages (disease, economics, market, community)
- Person 5: `datasets`, `tests`, `docs`, demo script, pitch

---

## 2. Prompt 0A — Install the permanent Rules (run once)

Paste in Antigravity. This creates the always-on memory.

```
You are setting up persistent project guidance for this workspace. Do not write application code yet.

1. Read docs/MASTER_PROMPT.md completely. It is the source of truth for the project "AgriSage AI" (Yuktik 2026 hackathon).

2. Create the file .agent/rules/agrisage-core.md (create the folder if needed) containing, in concise form, these always-on rules:
   - Project identity, stack (React+TS+Vite+Tailwind+Recharts+Leaflet; FastAPI+Pydantic+SQLAlchemy+SQLite+JWT; scikit-learn/XGBoost; pretrained PlantVillage CV model; FAO-56 irrigation), and the exact folder structure from section 7 of MASTER_PROMPT.md.
   - The 9 HONESTY RULES from section 3, verbatim.
   - Status labelling rule: every feature is WORKING, PARTIAL or DEMO, shown in the UI via a reusable <StatusBadge/> component and recorded in docs/FEATURE_STATUS.md.
   - Scope guard: do NOT start Tier 2 work until all Tier 1 acceptance checks in docs/ACCEPTANCE.md pass. Do NOT start Tier 3 until Tier 2 is done or explicitly cut.
   - Engineering rules: the host is Windows, so all setup and run commands must work in PowerShell; secrets only from environment variables; never commit model weights, .env, or datasets larger than 20 MB; Python type hints everywhere; TypeScript strict mode; every API route has a Pydantic request and response schema; every user-facing string goes through i18n (en, te, hi).
   - Verification rule: never say a task is done without running the relevant command (tests, build, curl/Invoke-RestMethod, or the browser) and showing the output as evidence in an Artifact or in the final message.
   - Agent communication rule: agents exchange typed Pydantic models (AgentEnvelope with agent name, status, timestamp, inputs_used, outputs, confidence, warnings) and every run is persisted in the agent_runs table.
   - Decision rule: make reasonable decisions yourself, record them in docs/DECISIONS.md with a one-line reason, and do not stop to ask unless blocked by something only a human can do (a missing API key, a download that needs login).

3. Create .agent/workflows/verify.md describing a /verify workflow: run backend tests, run frontend type-check and build, start both servers, hit /api/v1/health, and open the app in the browser to confirm that the home page renders, then report PASS or FAIL per step.

4. Create .agent/workflows/status-sync.md describing a /status-sync workflow: re-audit every feature in the code, then update docs/FEATURE_STATUS.md so each feature is WORKING, PARTIAL or DEMO based on what the code actually does (not what was planned).

5. Create docs/ACCEPTANCE.md: turn every Tier 1 bullet from section 4 of MASTER_PROMPT.md into a numbered, testable acceptance check (observable behaviour plus how to verify it).

Report what you created. Keep the rule file under 150 lines.
```

---

## 3. Prompt 0B — Recon and environment check

```
Inspect this workspace and my machine before we build.

1. List the repo contents and read docs/MASTER_PROMPT.md and any README present.
2. Check and report versions of: python, pip, node, npm, git. Check whether tesseract is installed (it is optional). Check free disk space and whether a GPU/CUDA is available (it is optional; CPU inference must work).
3. Check internet reachability by fetching https://api.open-meteo.com/v1/forecast?latitude=17.38&longitude=78.48&current=temperature_2m and https://huggingface.co (just reachability, no secrets).
4. Check git status and the current branch.
5. Write docs/ENVIRONMENT.md with the findings, and a list of anything I (the human) must install or provide, with the exact winget or download command for Windows PowerShell where relevant.

Do not install anything big without telling me. Do not write app code yet.
```

---

## 4. Phase 1 — Architecture and contracts

### Prompt 1.1 — PROJECT.md, SPEC.md, DB schema, API contracts

```
PHASE 1: Architecture and contracts. Follow the rules in .agent/rules. Read docs/MASTER_PROMPT.md fully first.

Produce these files with real, specific content (no vague placeholders):

1. PROJECT.md: problem, vision, users and roles (Farmer, Expert, Buyer, Admin), the demo story, tech stack with the reason for each choice, and the final folder tree.

2. docs/SPEC.md containing:
   a) A numbered functional spec for all 12 pages and every Tier 1 and Tier 2 feature, each tagged with its tier.
   b) A complete database schema (SQLAlchemy-ready): users, farms (area, ownership_type owned/leased/mixed, owned_area, leased_area, lease_amount, soil_type, water_source, irrigation_method, budget, village, district, state, lat, lon), crops_history, current_crop_cycles (crop, variety, planting_date, stage), weather_cache, agent_runs, disease_predictions (with village-level anonymised location), cost_items, scenarios, market_prices, mandis, listings, inquiries, ratings, farmer_groups, group_members (with consent flags), shared_requests, machinery, machinery_listings, schemes, loans, alerts, tasks, calendar_events, soil_cards, chat_history. Include keys, indexes, and consent fields for contact sharing.
   c) An ER diagram in Mermaid.
   d) Full API contract under /api/v1 grouped by module (auth, location, weather, farms, agents, disease, irrigation, yield, economics, recommend, rotation, market, marketplace, community, machinery, schemes, loans, outbreaks, calendar, soil-card, voice, chat, dashboard, health). For each endpoint: method, path, auth requirement, request schema, response schema, error cases.
   e) The AgentEnvelope schema and the orchestrator flow as a Mermaid sequence diagram: Weather → Irrigation → Disease → Yield → Advisory, including how conflicts between agents are flagged.
   f) Explainability schema: every recommendation returns {value, confidence, confidence_type ("model_metric"|"heuristic"|"rule"), reasons[], sources[], status (WORKING|PARTIAL|DEMO), limitations[]}.

3. docs/ARCHITECTURE.md with the Mermaid diagram: User → Frontend → API → Orchestrator → Agents / Models / External APIs → DB → Dashboard.

4. docs/DATA_SOURCES.md: a table of every data source we plan to use (Open-Meteo, data.gov.in AGMARKNET, PlantVillage model, Kaggle crop recommendation dataset, ICRISAT or other yield data, MSP, scheme sources), with licence, how it is used, and a fallback if it is unavailable. Mark anything unverified as "to verify". Do not invent figures.

5. Create the full empty folder structure from the master prompt with __init__.py files, plus .gitignore (Python, Node, SQLite db files, model_artifacts weights, .env, datasets large files) and .env.example (JWT secret, DB url, API keys, CORS origins, feature flags).

6. docs/FEATURE_STATUS.md with every feature listed as NOT STARTED for now, and docs/DECISIONS.md with your key decisions so far.

Then self-review: check that every Tier 1 item from the master prompt maps to at least one endpoint and one page. List any gap and fix it. Show me the coverage matrix in an Artifact.
```

---

## 5. Phase 2 — Vertical slice

### Prompt 2.1 — Backend skeleton (auth, location, weather, farms)

```
PHASE 2, part 1: backend vertical slice. Read docs/SPEC.md first and implement exactly its contracts.

Build in backend/:
- FastAPI app with CORS from env, request-ID logging middleware, global exception handler returning a consistent error schema, /api/v1/health.
- Config via pydantic-settings reading .env.
- SQLAlchemy models and Alembic or create_all setup for the tables needed in this slice: users, farms, crops_history, current_crop_cycles, weather_cache, agent_runs.
- Auth: register, login, JWT access tokens, password hashing (bcrypt or argon2), role-based dependency (Farmer, Expert, Buyer, Admin), /auth/demo-login that creates or returns the demo farmer "Ramesh" (Telangana village, pre-loaded farm and a cotton cycle) with the roles needing no password.
- Location: static dataset of Indian states, districts and a sample of villages with lat/lon (for Telangana, Andhra Pradesh, Karnataka, Maharashtra, at least; clearly mark the village list as partial), endpoints for state to district to village selection and for lat/lon lookup. Include geocoding via Open-Meteo geocoding API with a graceful fallback.
- Weather service: Open-Meteo client with timeouts, retries, response caching in weather_cache (TTL 30 min), returning temperature, humidity, rainfall probability, expected rainfall, wind, ET0 (Open-Meteo provides reference ET), a 7-day forecast, and a "should I grow crop X now?" signal that is rule-based on crop temperature/rain windows (label it rule-based, with reasons). If the API fails, return the last cached value flagged stale=true; if there is no cache, return a clear error. Never invent weather.
- Farms CRUD (multiple farms per user) with validation: area > 0, lease_amount >= 0, ownership consistency (owned+leased areas must equal total for "mixed"), valid coordinates, etc.
- Seed script scripts/seed.py that creates demo data idempotently.

Write pytest tests as you go: auth flow, role guards, validation errors, owned/leased/mixed validation, weather service with a mocked Open-Meteo success and a mocked failure (cache fallback).

Provide PowerShell scripts: scripts/setup.ps1 (create venv, install deps, copy .env.example to .env if missing, seed), scripts/dev-backend.ps1.

Run the tests and the server. Prove it works by calling the endpoints (Invoke-RestMethod) for demo-login, location, weather, create farm. Paste real outputs in an Artifact. Fix every failure before finishing.
```

### Prompt 2.2 — Frontend skeleton and design system

```
PHASE 2, part 2: frontend vertical slice. First load and follow the frontend-design skill if it is available, then build in frontend/.

Design direction: modern AgriTech with an earthy, warm look. Deep green primary, soil-brown and harvest-gold accents, cream backgrounds, high-contrast risk colours (green/amber/red), strong typography (a distinctive heading font and a very readable body font; choose from Google Fonts but also provide system fallbacks), rounded cards, subtle texture or illustration touches, and large touch targets. It must be mobile-first and must NOT look like a generic admin template.

Technical:
- Vite + React + TypeScript (strict) + Tailwind + React Router + TanStack Query + Recharts + Leaflet (react-leaflet).
- Typed API client generated or hand-written from the contracts in docs/SPEC.md; central error handling; JWT stored safely.
- i18n with en, te, hi JSON files and a language switcher; ALL text goes through i18n keys (no hardcoded UI strings). Telugu and Hindi translations must be real, natural translations, not machine garble. Mark any uncertain string in a translations review list in docs/I18N_REVIEW.md for a native speaker to check.
- Reusable components: StatusBadge (WORKING/PARTIAL/DEMO), ConfidenceMeter (distinguishes "model accuracy" from "prediction confidence"), ExplainCard ("because..."), RiskPill, EmptyState, LoadingSkeleton, ErrorState with retry, AgentChip, BottomNav for mobile.
- Pages in this slice: 1) Welcome and Login (login, register, Demo Mode button), 2) Location and Language with live weather card and 7-day forecast chart, 3) Farm Registration form with owned/leased/mixed logic that reveals lease fields, 4) Dashboard shell showing weather, farm summary and a placeholder panel for agents clearly marked NOT STARTED (do not fake agent results).
- Every button calls a real backend API. Handle loading, empty and error states everywhere.

Run npm run build and the TypeScript type-check with zero errors. Start both servers and use the browser agent to complete the flow: Demo Login → select location → see weather → create a farm → reach the dashboard. Capture screenshots at mobile width (390px) and desktop width as evidence in an Artifact and fix visual problems (overflow, contrast, tap targets) you notice. Add scripts/dev-frontend.ps1 and scripts/dev.ps1 that starts both.
```

### Prompt 2.3 — Phase 2 gate

```
Run the /verify workflow. Then check items in docs/ACCEPTANCE.md that apply to this slice and mark each PASS or FAIL with evidence. Fix all FAILs. Update docs/FEATURE_STATUS.md using /status-sync. Commit with a clear message on the current branch. Show me a short summary table of what really works.
```

---

## 6. Phase 3 — Five agents and real models

### Prompt 3.1 — Orchestrator, agent framework, Activity Log

```
PHASE 3, part 1: the agent framework. Read the agent sections of docs/SPEC.md.

Implement in backend/app/agents:
- base.py: an abstract BaseAgent with run(context) -> AgentEnvelope, timing, error capture, and automatic persistence to agent_runs. An agent failure must NOT crash the pipeline; it yields status="failed" or "degraded" with a reason and the orchestrator continues with fallbacks.
- schemas for typed inter-agent messages (Pydantic): WeatherReport, IrrigationPlan, DiseaseFinding, YieldEstimate, AdvisoryPlan, plus a Conflict model (agent_a, agent_b, issue, resolution, rationale).
- orchestrator.py: runs Weather → Irrigation → Disease → Yield → Advisory, passing typed messages, with handoff records ("Weather agent passed rain_in_48h=true to Irrigation agent"), cancellation-safe, and a "partial run" mode when no disease image exists.
- Conflict detection rules (for example: irrigation says irrigate but weather forecasts 15 mm rain in 24h; disease says fungal risk high but irrigation recommends overhead irrigation). Resolve with transparent rules and explain them.
- Endpoints: POST /api/v1/agents/run (for a farm), GET /api/v1/agents/runs (activity log with filters), GET /api/v1/agents/runs/{id}.
- Frontend: Agent Activity Log component on the dashboard, showing a timeline of which agent passed what to which, with status, time, inputs, outputs, confidence, and an expandable JSON view. Add an animated "agents cooperating" flow diagram for the demo.

For now, the four non-weather agents may be thin, but they MUST report status "stub" via StatusBadge as DEMO until Prompts 3.2 to 3.5 replace them. No fake numbers presented as predictions.

Write tests for: agent communication, failure isolation, conflict detection, persistence. Run everything and show the real outputs.
```

### Prompt 3.2 — Disease agent (real CV)

```
PHASE 3, part 2: the Disease agent with a real pretrained model.

1. Find a pretrained plant-disease classification model trained on PlantVillage that is available free on HuggingFace (or another public source) and runs on CPU. Check its licence and class list. Record the choice, licence, class labels and reason in docs/DATA_SOURCES.md and docs/DECISIONS.md. If the model cannot be downloaded in this environment, say exactly why, and fall back to the most reasonable alternative, never silently to fake output. Download weights into model_artifacts/ (gitignored) via scripts/download_models.ps1 and scripts/download_models.py so teammates can fetch them.
2. backend/app/ml/disease_model.py: load once (lazy singleton), preprocess, return top-3 predictions with softmax probabilities, handle invalid/corrupt/oversized images, and run in a threadpool so the API doesn't block.
3. Add an input-quality gate: a cheap check for blurry, too-dark, or non-leaf images (for example a simple heuristic or a plant/non-plant check) so a random photo is not forced into a disease label. If rejected, say so honestly.
4. Calibrated honesty: show the model probability as "prediction confidence" and add a clear note that the model was trained on lab-style PlantVillage images and is weaker on real field photos. Below a confidence threshold (documented, configurable) return "uncertain" and a "consult an agriculture officer" fallback.
5. Map each predicted class to a knowledge base entry in backend/app/ml/disease_kb.json: crop, disease name, symptoms, general cultural/organic control steps, and sourced notes. NO specific chemical dosages. Give only indicative guidance and cite sources (ICAR, state agriculture university or FAO documents). Mark facts you could not source as "to verify".
6. Link to schemes: map disease or severity to relevant scheme categories (resolved in Phase 5 from the schemes table) with a clear "check eligibility" note.
7. Endpoint POST /api/v1/disease/predict (multipart image, optional farm_id, crop hint). Save an anonymised prediction (village-level location only) for the outbreak map. Include the weather context so the agent can raise or lower fungal risk based on humidity and rain (rule-based and explained).
8. Evaluation: write scripts/eval_disease.py that evaluates the model on a held-out sample of PlantVillage images if the dataset is obtainable (state how many images and from where). Report accuracy, per-class precision/recall on that sample, and clearly say it is a lab-image sample. If the dataset is not obtainable, report that, and do not publish any number.
9. Frontend Disease and Crop Protection page: camera/upload, preview, result card with top-3 bars, ConfidenceMeter, symptoms, safe treatment steps, "why" explanation, fallback banner, scheme suggestions, and a Report to outbreak map opt-in toggle.

Tests: valid image, corrupt file, huge file, non-image, low-confidence path, endpoint auth. Use 2 to 3 real sample leaf images from the dataset in tests/fixtures (small ones only). Show real outputs.
```

### Prompt 3.3 — Irrigation agent (FAO-56) and the image/text irrigation problem input

```
PHASE 3, part 3: the Irrigation agent.

1. backend/app/ml/irrigation.py implements the FAO-56 approach: ETc = Kc * ET0 with crop coefficients per growth stage (initial, development, mid, late) for at least 10 major Indian crops (rice, wheat, maize, cotton, groundnut, chilli, tomato, sugarcane, soybean, pulses). Put the Kc tables in a data file with a source note (FAO Irrigation and Drainage Paper 56) and mark any value you could not verify. Compute effective rainfall, soil water balance with a simple bucket model using soil type (available water capacity ranges by soil texture), the irrigation method efficiency (flood, furrow, sprinkler, drip), and output: whether to irrigate, depth in mm, litres for the farm area, next irrigation date, and litres saved if rain is forecast. All formulas unit-tested against hand-calculated examples included in the test file.
2. The agent consumes the WeatherReport from the Weather agent (including ET0 and rain forecast) and the crop growth stage from the cycle's planting date.
3. Irrigation problem input: text (user describes the problem, for example "water stagnating", "leaves wilting in afternoon", "borewell dries up") — implement a rule-based issue classifier with keyword matching in English, Telugu and Hindi plus the optional LLM (if GEMINI_API_KEY exists) that returns structured categories (waterlogging, water stress, salinity, uneven distribution, source scarcity) with cautious suggestions. For an image input, DO NOT claim that a normal photo measures soil moisture. Instead, run the disease/visual-stress model or a simple visual check for wilting/waterlogging cues and label it clearly as "visual indication only, not a measurement", and ask the farmer to confirm with a simple field check (finger test guide). Mark this feature PARTIAL.
4. Endpoints: POST /api/v1/irrigation/plan, POST /api/v1/irrigation/diagnose (text and/or image).
5. Frontend Irrigation and Weather page: 7-day water balance chart (rain vs ETc), next-irrigation card, litres saved, the "should I grow this crop now?" panel, diagnose box (text and image), explanation cards.

Tests for: Kc stage selection, water balance, rain-skip logic, method efficiencies, invalid inputs. Run and show outputs.
```

### Prompt 3.4 — Yield agent with honest ML

```
PHASE 3, part 4: the Yield agent and the Crop Recommendation model.

1. Datasets: look for free, redistributable data. Candidates are the Kaggle Crop Recommendation dataset (N, P, K, temperature, humidity, pH, rainfall, label) for crop recommendation, and an Indian crop production dataset (state, district, crop, season, area, production, yield by year, e.g. from data.gov.in or ICRISAT district data) for yield. Download what is accessible from here into datasets/ (gitignored if large) and write datasets/README.md with the source URL, licence and column descriptions. If a download needs a login or is blocked, tell me exactly what to download manually and where to place it, and meanwhile build the full pipeline so it runs the moment the file exists. Do NOT generate synthetic training data and call it real. If you must generate any synthetic data for tests, name it clearly as synthetic and keep it only in tests.
2. scripts/train_crop_recommender.py: train with a proper train/validation/test split (stratified), compare at least RandomForest, XGBoost/GradientBoosting and a baseline, tune lightly with cross-validation, and save the best model with joblib plus a metrics.json (accuracy, macro-F1, confusion matrix, feature importances, dataset size and date). Report only holdout test metrics.
3. scripts/train_yield_model.py: a yield regressor with features such as crop, state, district, season, area, year trend, rainfall, temperature where available. Use time-aware or group-aware splits to avoid leakage (for example, hold out the latest years). Report MAE, RMSE and R² on the holdout, compare against a naive baseline (previous-year or district mean) and say honestly whether the model beats the baseline. Produce prediction intervals (quantile regression or bootstrap) so the app shows a range, not just one number.
4. backend/app/ml: loaders, explainability (feature contributions via SHAP or permutation importance summarised in plain language), and graceful degradation if the model files are missing (return status DEMO with a clear message, not fake numbers).
5. The Yield agent adjusts the baseline using the Weather and Disease agent messages (for example high disease risk lowers the expected yield), and each adjustment is a visible, rule-based, cited factor with its size shown. Say "adjustment heuristic" where it is not learned.
6. Endpoints: POST /api/v1/yield/predict, POST /api/v1/recommend/crop. The recommendation returns the top-3 crops with reasons, and uses soil values (N, P, K, pH) if the user has them, otherwise says that soil values are missing and lowers the confidence.
7. Write docs/MODEL_CARD.md for each model: data, features, split, metrics, limitations, intended use. The metrics must be copied from the real metrics.json.

Tests: model loads, shape validation, invalid inputs, the missing-artifact path. Show real metrics from the training run in an Artifact.
```

### Prompt 3.5 — Advisory agent and growth-stage engine

```
PHASE 3, part 5: the Advisory (coordinator) agent and the growth-stage engine.

1. backend/app/services/growth_stage.py: for at least 10 crops, define the stage timeline in days after sowing (germination, vegetative, flowering, fruiting/grain filling, maturity/harvest) with a source note, compute the current stage from planting_date, and provide per-stage tasks (fertilizer windows, scouting, spraying windows, irrigation sensitivity) as general guidance without dosages.
2. The Advisory agent consumes all four typed messages and produces a 7-day action plan (day, action, reason, priority, responsible agent), a list of flagged conflicts and how each was resolved, risk alerts, an overall Farm Health Score (0 to 100) with a transparent formula and component breakdown (weather risk, disease risk, water status, stage-appropriateness, economic health), and an "Explain" block for every item ("because rain probability is 80% and humidity is high").
3. Multilingual output: translate the plan into the user's language. Use deterministic template-based translation for fixed phrases (keep en/te/hi dictionaries in files), and the free LLM (only if a key exists) for free text with a clear fallback. Never show untranslated English silently: if the translation is missing, mark it.
4. Endpoint: POST /api/v1/advisory/plan and wire the full orchestrator so POST /api/v1/agents/run returns the combined result.
5. Dashboard: finish it. Farm summary, growth stage progress bar, weather alerts, disease warnings, irrigation need, yield range, cost and profit snapshot (placeholder until Phase 4, clearly marked), task list, Farm Health Score gauge with breakdown, and the Agent Activity Log. Every panel has a StatusBadge and ConfidenceMeter.

Test the full orchestrated run for the demo farmer with a real disease photo, and show the output. Then use the browser agent to walk through the dashboard on mobile width and desktop and attach screenshots. Run /verify and /status-sync.
```

---

## 7. Phase 4 — Economics, recommendation, lifecycle

```
PHASE 4: Economics engine, crop recommendation, rotation, lifecycle, calendar, explainability.

1. backend/app/services/economics.py: a cost-of-cultivation and profit/loss engine. Inputs are crop, area (acres or hectares, with unit conversion), ownership (owned, leased, mixed), lease cost, irrigation method, expected yield (from the Yield agent), expected price (from market data, user override allowed), and every cost line item editable: seed, fertilizer, pesticide, labour, machinery, irrigation, fuel, transport, storage, lease, other, interest on loan if any. Provide default per-acre cost templates per crop and state in a data file with source notes; mark any template that is an estimate as "indicative estimate, edit to your actual cost". Compute total cost, cost per acre, revenue, gross profit, net profit, margin, break-even price and break-even yield, with best/base/worst cases driven by yield range and price range. Owned and leased land are computed separately and then combined for mixed holdings. Use Decimal for money. Do not invent prices; take prices only from the market service or the user.
2. Crop comparison: compare top candidate crops side by side (cost, expected revenue, profit, risk, water need, duration).
3. What-if simulator: a backend endpoint plus a frontend page with live sliders (crop, area, irrigation type, lease cost, price, yield) where the profit updates instantly (debounced calls or client-side shared formulas that are verified against the backend by a test). Show a chart of profit vs the changing variable.
4. Crop rotation planner (backend/app/services/rotation.py): rule-based from the previous crops (for example legumes after cotton or cereals to restore nitrogen, avoid the same family twice to reduce disease build-up, break pest cycles). Each suggestion has reasons and sources. Mark it as rule-based.
5. Lifecycle timeline (pre-sowing, sowing, vegetative, flowering, harvest, post-harvest, sale) and a crop calendar generator that creates dated events (sowing, fertilizing windows, spraying scouting, irrigation checks, harvest) tied to the planting date, with reminders (in-app notifications; add a browser Notification API opt-in) and export to .ics.
6. Seasonal awareness: Kharif, Rabi, Zaid detection by month and region, with a seasonal awareness card (rain/temperature expectations, typical crops, typical risks). Use only generally accepted statements and mark them as general guidance.
7. Frontend: the Economics page (cost editor, charts, lease vs own comparison, break-even, scenarios, what-if), Lifecycle and Calendar page, and the Crop Recommendation view with reasons.
8. Everything shows explainability ("because...") and confidence/StatusBadge.

Tests: owned vs leased vs mixed math, break-even, scenarios, zero/negative edge cases, unit conversion, Decimal rounding, rotation rules, calendar generation. Show passing output. Then do the full browser walk-through: farm → crop → economics → what-if → calendar.
```

---

## 8. Phase 5 — Tier 2 differentiators (run as parallel agents)

Open **Agent Manager** and start these as separate agents on separate branches. Give each the shared header below plus its own block.

### Shared header (put on top of every Phase 5 prompt)

```
Follow .agent/rules. Tier 1 must already pass (check docs/ACCEPTANCE.md first; if anything fails, fix it before starting). Work only inside the folders that your task needs. Add your routes to the existing API structure without changing other modules' contracts. Every feature gets: backend schema + route + tests, frontend page or section with i18n, StatusBadge, ConfidenceMeter or limits note where relevant, and an entry in docs/FEATURE_STATUS.md. Real data where available; otherwise a clearly labelled DEMO dataset in datasets/demo/ with a "DEMO DATA" banner in the UI. Never invent real-world figures: scheme details, loan terms, MSP values and mandi prices must come from a cited source with a last_verified date, or be labelled DEMO. Verify in the browser and show evidence.
```

### 5.1 Community, collaboration, machinery sharing, outbreak map

```
[Shared header above]

Build:
1. Nearby farmers at village-level only (never exact coordinates or full names to others unless opted in). Farmer groups (create, join, leave), shared transport requests (a pooled truck with cost-splitting calculator by weight share and by distance), shared input purchase requests (fertilizer, seed), pooled-sale requests.
2. Cost-splitting calculator with a transparent formula and an example breakdown, plus savings vs going alone.
3. Opt-in contact sharing: the explicit consent flow, per-group, revocable, stored with timestamp. Until consented, others see only a first name or alias and the village. Test the permission boundary thoroughly (a user who has not consented must never receive the phone number from any endpoint).
4. Machinery module: machinery needed per crop and stage (rule-based table with a source note), machinery listing and rental (owner lists the machine, hourly or daily rate, village, availability), search by distance (haversine from village centroid), booking request flow (no payments).
5. Disease outbreak map: Leaflet map using the anonymised disease predictions aggregated by village (for example "Leaf blight reported in 3 villages this week"), time window filter, crop filter, a minimum-reports threshold before display to protect privacy, plus a district-level officer view for Expert/Admin roles with counts and trends.
6. Seed realistic DEMO community data around the demo farmer's village (clearly labelled).
Tests: consent, privacy, group permissions, distance search, cost-split math, outbreak aggregation threshold.
```

### 5.2 Markets, marketplace, MSP, storage

```
[Shared header above]

Build:
1. Mandi price service: try the data.gov.in AGMARKNET API using DATA_GOV_IN_API_KEY (variety, modal, min and max price, arrival date, mandi, district, state), cache responses, store history, fall back to datasets/demo/mandi_prices.csv labelled DEMO if the key is missing or the API fails. The response always includes source, fetched_at and demo=true/false.
2. Net realization ranking: for each nearby mandi, net = price * quantity - transport cost (distance by haversine times an editable per-km-per-quintal rate - label the rate as an editable assumption) - market fee assumption (editable). Rank by net realization and show the reasoning.
3. MSP comparison: store MSP data in datasets/msp.csv with the source URL, season and last_verified date for the crops you can verify from official sources (look them up; do not rely on memory). Show "your expected price vs MSP". Any crop without a verified value shows "MSP not verified".
4. Price trend and a best-time-to-sell hint from historical modal prices (simple seasonal pattern + trend, labelled as indicative with its error, never as a guarantee). Nearby warehouse/cold storage list from a labelled demo dataset unless a real source is found.
5. Farmer-to-buyer marketplace: listings (crop, quantity, expected price, village, harvest date), buyer inquiries, accept/decline, ratings and a "Verified" badge granted by Admin (workflow), no payments. Role permissions: only the owner edits a listing; buyers cannot see contact details until the farmer accepts. Test these.
6. Frontend: Market and Marketplace page with a mandi ranking table, price chart, MSP chip, listing creation, inquiries inbox.
Tests: net realization math, MSP comparison, API-failure fallback, marketplace permissions.
```

### 5.3 Schemes, loans, insurance, fertilizer, crop protection

```
[Shared header above]

Build:
1. A schemes knowledge base (datasets/schemes.json) with fields: id, name, authority, category, eligibility rules in a machine-checkable form, benefits (as stated by the source), how to apply, official URL, last_verified. Research from official sources (for example PM-KISAN, PMFBY, Soil Health Card, Kisan Credit Card, RKVY, state schemes for Telangana and AP, NHM, PKVY, and agriculture-department disease-support programmes). For each entry, include only facts you can verify from the cited page. Where you can't verify, set verified=false and the UI shows "details to verify". NO invented amounts or deadlines.
2. Rule-based matcher that outputs "may be eligible / check eligibility / not eligible" with the reason, never a guarantee, plus the disclaimer text. Triggered by farm size, ownership (lease farmers have different eligibility in some schemes; model that carefully only where documented), crop, state, disease result, and category of farmer if given.
3. Loans and funding: a similar knowledge base for KCC and bank/NABARD-type products with a loan-need estimate computed from the cost-of-cultivation engine (cost minus own funds), a simple EMI / interest-cost calculator with user-editable interest rate (do not hard-code a rate as fact), and the shortlist ranked by fit. Source link + last_verified on every item.
4. PMFBY insurance check: a one-line eligibility pointer based on crop/season/state notified status if verifiable; otherwise "check with your bank/CSC". Display premium info only if sourced.
5. Fertilizer advisory: crop + stage + soil values + the Soil Health Card values give nutrient-focused guidance (general, source-based, no unsafe dosing; recommend a soil test and local agri officer for exact quantity), organic alternatives, and purchase links (official/government e-commerce links such as the fertilizer retail locator, plus a DEMO nearby supplier list labelled as demo).
6. Crop protection for insects, animals and weeds: text or image input of the problem and the animal/pest type (wild boar, monkeys, stray cattle, birds, locusts, etc.), returns non-lethal and legal preventive measures (fencing, trenching, bio-fencing, repellents, timing), crop choice guidance (which crops are less attractive to the animals), weed management stage guidance (no herbicide dosages), and a link to the forest/agri department helplines if verifiable. Mark rule-based.
7. Frontend: Schemes and Loans page (filters, match cards with reasons and disclaimers, EMI calculator) and the protection and fertilizer sections.
Tests: matcher rules, EMI math, missing-data paths, disclaimers present in responses.
```

### 5.4 Marketplace of identity: Soil Health Card OCR + Buyer features + privacy admin

```
[Shared header above]

Build:
1. Soil Health Card upload with OCR: pluggable backend (EasyOCR or Tesseract if installed; optional Gemini vision when a key exists). Extract N, P, K, pH, organic carbon, EC where present, using regex and fuzzy matching on labels in English (and note Telugu/Hindi as PARTIAL). Show a confirmation screen: extracted values appear in editable fields with a per-field confidence and the cropped image; nothing is saved to the farm profile until the farmer confirms. The model never silently trusts OCR. If OCR is not installed, report how to install it (PowerShell instructions) and keep manual entry working.
2. Feed confirmed soil values into crop recommendation, fertilizer advice and the yield agent, and show how these changed the outputs.
3. Admin console: user list, verification workflow for Experts and Buyers, moderation of listings, consent audit log view, data export/delete for a user (privacy basics).
4. A privacy page in the app explaining what is shared, with village-level location only, and toggles.
Tests: OCR parsing with 3 sample card text strings, confirm-flow, admin permissions.
```

### 5.5 Phase 5 gate

```
Merge all Phase 5 branches carefully (resolve conflicts, keep every contract intact), then run /verify, the complete backend test suite, and the frontend build. Use the browser agent to walk through every Tier 2 feature as the demo farmer and the buyer role, with screenshots. Run /status-sync. Produce a table: feature, status, evidence, known limitation. Fix all failures.
```

---

## 9. Phase 6 — Voice, multilingual, alerts, polish, Tier 3

### Prompt 6.1 — Voice assistant

```
PHASE 6, part 1: voice.
1. A floating voice button on every page opens a voice panel. Speech-to-text uses the browser Web Speech API (SpeechRecognition) with language codes en-IN, te-IN, hi-IN matched to the selected language. Text-to-speech uses speechSynthesis with a voice picker that prefers a voice matching the language, and a read-aloud button on the advisory plan, disease result and market ranking.
2. Capability detection and graceful fallback: if recognition or a Telugu voice is unavailable (common on some browsers), show a clear message, offer the typed input, and keep text working. Explain in the UI which browsers work best (Chrome on Android/desktop). Provide a microphone-permission-denied state.
3. Intent handling in backend POST /api/v1/voice/query: classify the user's utterance into intents (weather, irrigation, disease help, price, cost, scheme, general), route to the matching service, and return a short spoken-length answer plus structured data for the UI. Use rules and keyword lists in en/te/hi first; use the free LLM when GEMINI_API_KEY exists for open questions, constrained to answer only from our data and to say "I don't know, please consult an agriculture officer" otherwise. Label the answers clearly with sources and confidence.
4. Conversation history, a clear/reset button, and chat safety: no dosages, no guarantees.
Tests: intent routing for 5 sample utterances per language, the no-key fallback path.
Verify with the browser agent as far as the automated browser can (typed fallback path), and tell me exactly which parts need manual testing on a real phone with a microphone.
```

### Prompt 6.2 — i18n refinement, alerts, offline/low-internet

```
PHASE 6, part 2.
1. Audit all UI strings: find any hardcoded text, missing te/hi keys, overflow with longer Telugu/Hindi text, and fonts that fail to render Telugu/Devanagari (load Noto Sans Telugu and Noto Sans Devanagari with fallbacks). Fix them. Produce docs/I18N_REVIEW.md with the list of strings a native speaker must verify.
2. Alerts engine: backend job (APScheduler or an on-demand endpoint) that generates alerts (heavy rain, heat stress, high fungal risk, irrigation due, price spike, scheme deadline only if sourced, task due) and stores them. In-app alert centre, with severity colours. SMS/WhatsApp-style summary text generator (plain, under 300 characters, in the user's language) that can be copied or shared via wa.me link. No SMS gateway is integrated, so say this plainly.
3. Low-internet mode: a PWA (service worker, manifest) that caches the app shell and the last advisory, weather and calendar for the farm, a visible "Offline - showing last saved advice from <time>" banner, and a queue for actions that need the network. Make sure stale data is always labelled with its timestamp.
4. Accessibility and performance pass: keyboard navigation, aria labels, contrast, image compression before upload, lazy-loaded routes, Lighthouse run (report real scores).
Tests plus a browser check with the network throttled or offline.
```

### Prompt 6.3 — Tier 3 (only after Tier 2 gate passes)

```
PHASE 6, part 3: Tier 3, in this order, stopping when time is short. Each must be honest.
1. NDVI satellite crop health: use a free source (for example Sentinel-2 via a public STAC/Earth-Search endpoint or Google Earth Engine only if credentials exist). Compute NDVI for the farm's bounding box and for a neighbouring buffer area, show a time series and "greener/weaker than neighbours" statement. If live satellite access fails or needs an account I must create, tell me, and implement the pipeline so it works when the credentials exist, with a DEMO precomputed sample clearly labelled. Mention cloud cover and resolution limits.
2. Sustainability score: water saved (irrigation agent plan vs a typical flood schedule baseline, with the baseline assumption stated) and fertilizer reduction vs a typical plan (state the baseline source or mark as assumption), combined into a transparent score.
3. Best time to sell/store: extend the market module (already has price trends) with storage options and a hold-vs-sell calculator that includes storage cost and spoilage assumptions (editable).
4. Conflict-resolution panel: a UI that shows each flagged agent conflict, the competing recommendations, the rule that resolved it, and lets the farmer override.
5. Farm Digital Twin: a simple visual of the farm (field with crop, growth stage, soil moisture bucket from the water-balance model, risk overlays) driven by the real model state; no fake sensors, label the soil moisture as "modelled".
Run /verify and /status-sync after each.
```

---

## 10. Phase 7 — Tests, audit, docs, demo

### Prompt 7.1 — Full test suite and real metrics

```
PHASE 7, part 1. Complete the test suite required by section 9 of docs/MASTER_PROMPT.md: auth, validation, owned vs leased calculations, profit math, agent communication, disease endpoint, irrigation formula, yield endpoint, invalid inputs, external API failure fallback, marketplace permissions, consent/privacy, plus frontend component tests for the key components (StatusBadge, ConfidenceMeter, cost editor, what-if) with Vitest and an end-to-end journey test with Playwright for: demo login → language and location → farm → crop → disease image → agent findings → irrigation → yield and cost → market → combined advisory. Run everything. Report coverage and real pass/fail numbers. Fix every failure, and do not delete or weaken a test to make it pass.
Also write docs/TEST_REPORT.md with the real results, and collect the real model metrics from the metrics.json files into docs/EVALUATION.md along with their limitations (lab images vs field photos, dataset size, time span).
```

### Prompt 7.2 — The "judge attack" audit (very important)

```
Act as a hostile hackathon judge and a security reviewer. Audit this entire repository against section 3 (HONESTY RULES) and section 4 of docs/MASTER_PROMPT.md.

1. Search the code for hardcoded, random, or placeholder values returned as AI output (search for random, mock, dummy, lorem, hardcoded arrays in services/agents/api, and fixed numbers in responses). For each finding, either replace it with a real computation, relabel it DEMO in both API response and UI, or remove it.
2. Verify that every feature in the UI has a StatusBadge and that docs/FEATURE_STATUS.md matches the code reality, no feature marked WORKING that is not.
3. Check that every displayed accuracy/R²/price/scheme/loan figure is traceable to a real evaluation file or a cited source with last_verified. List any that are not, and fix them.
4. Verify the privacy rules: contact data never leaves an endpoint without consent, and only village-level location is exposed. Try to break this with test requests as another user.
5. Security: JWT secret from env, password hashing, rate-limit on login and upload, upload size and type limits, CORS config, SQL injection safety, file-name sanitisation, no secrets in git history (check .gitignore and run a quick scan), dependencies with known vulnerabilities (pip-audit and npm audit, report only).
6. Failure testing: turn off the network and check that the app degrades gracefully, send malformed inputs, upload a 50 MB file, upload a PNG with the wrong extension, use an empty farm, and a farm with area 0.
7. Click-through of every button in the browser: find any button that does nothing or does not call a real backend API.
Deliver docs/AUDIT.md with findings as a table (severity, location, fix, status) and fix all High and Medium issues. Then re-run the tests.
```

### Prompt 7.3 — Demo Mode, demo script, JUDGE_QA, README

```
PHASE 7, part 3. Build and document the final demo.
1. One-click Demo Mode on the welcome page that logs in as farmer "Ramesh" (a Telangana village), preloads the farm (mixed owned and leased, cotton as the previous crop), the language switch to Telugu, a stored sample diseased leaf photo (include one small real image in demo assets with its licence noted), nearby farmers, mandis, and schemes. It must follow the story in section 11 of the master prompt end to end: Telugu speech → crop recommendation with cost, profit, lease-vs-own → disease photo with confidence and scheme → rain warning and skip-watering → pooled transport saving → best mandi, MSP, loan → final advice spoken in Telugu. Every demo-only data element has a DEMO label.
2. scripts/smoke_test.ps1: starts nothing new, just checks the backend health, the key endpoints, the model files, and the offline cache, and prints a green/red checklist to run 5 minutes before presenting. Also create a "pre-warm" step that loads the ML models so the first request isn't slow.
3. docs/DEMO_SCRIPT.md: a timed 5-minute walkthrough with exact clicks, what to say, and a backup plan for if the internet, microphone or model fails (including a pre-recorded screen capture checklist).
4. docs/JUDGE_QA.md: at least 40 likely judge questions with honest answers (about the accuracy numbers, lab vs field images, data privacy, how agents cooperate, why not just one LLM, scalability, business model, what is real vs demo, what happens when the model is wrong, how lease vs own changes the numbers, and risks).
5. README.md with: overview, architecture diagram, feature status table (copied from FEATURE_STATUS.md), Windows PowerShell setup and run commands, .env explained, how to download the models and seed the DB, how to run tests, API docs link (FastAPI /docs), data sources and licences, limitations and future work, and team credits.
6. docs/PITCH_OUTLINE.md: a 3-minute pitch with the problem, the solution, the demo, the impact (only sourced numbers), and the ask.
Finally run /verify, the smoke test, and the complete test suites, and show the final real outputs.
```

---

## 11. Utility prompts (keep handy)

### When an agent claims it is done but you doubt it
```
Do not trust your previous summary. Re-verify from scratch: run the tests, start the servers, exercise the feature in the browser, and show me the real output and screenshots. List anything that was not actually working, and fix it.
```

### When the agent stops to ask lots of questions
```
Do not ask me questions. Decide using the master prompt and the project rules, record the decision in docs/DECISIONS.md, and continue. Only stop for something that only a human can provide (a key, a login, a manual download), and when you do, tell me the exact step.
```

### When something breaks and the agent loops
```
Stop. Do not make another blind attempt. Reproduce the error, show the full traceback or console error, identify the root cause with evidence (read the relevant code and logs), explain it in two sentences, then fix the root cause and add a regression test. If this needs a different approach than the planned one, say so and choose the simplest one that works.
```

### Scope cut when time is running out
```
We have X hours left. Freeze all new features. List the Tier 1 and Tier 2 features that currently work end to end and those that are half-done. Propose a cut list: finish, relabel as DEMO, or hide. Prioritise the demo story in section 11. Execute the plan, then run /verify and the smoke test.
```

### Git hygiene before each commit
```
Review git status. Make sure no .env, model weights, large datasets, __pycache__, node_modules or database files are staged. Write a clear commit message summarising the change and push to my feature branch only (not main).
```

### Code-quality pass
```
Review the whole backend and frontend for dead code, duplicated logic, missing type hints, unclear names, missing error handling and N+1 queries. Refactor safely with tests staying green. Do not change any API contract.
```

---

## 12. Recommended order and timing for 24 hours (5 people)

| Hours | Who | What |
|---|---|---|
| 0 – 1 | All | Section 1 setup, Prompts 0A and 0B |
| 1 – 3 | P1 + P3 | Prompt 1.1, then 2.1 (backend) and 2.2 (frontend) in parallel agents, 2.3 gate |
| 3 – 8 | P2 (ML), P1 (agents), P3 (dashboard) | Prompts 3.1 to 3.5 (3.2, 3.3 and 3.4 can run in parallel agents) |
| 8 – 11 | P4 | Phase 4 |
| 11 – 17 | P1 to P4 in parallel | Phase 5 blocks 5.1, 5.2, 5.3, 5.4, then the 5.5 gate |
| 17 – 20 | P3 + P4 | Phase 6 (voice, i18n, offline), Tier 3 only if the gate is clean |
| 20 – 23 | P5 leads, all test | Phase 7: 7.1, 7.2, 7.3 |
| 23 – 24 | All | Smoke test, rehearse the demo twice, record a backup video |

**Golden rules for you as the human driver**
- Read the agent's plan before approving it. If it skips an acceptance check, send it back.
- After every phase, run `/verify` yourself and look at the app with your own eyes.
- Commit after every passing gate, so you can roll back.
- Native Telugu and Hindi speakers on the team should review `docs/I18N_REVIEW.md`.
- Never let the agent present a number you cannot trace. Judges will ask.
