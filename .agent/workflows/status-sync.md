# `/status-sync` — Feature Status Audit & Synchronization Workflow

This workflow audits the actual code and running behaviour of AgriSage AI, synchronizing `docs/FEATURE_STATUS.md` and UI `<StatusBadge/>` values to eliminate discrepancy between planned features and current reality.

---

## Audit Principles
1. **Reality Over Intent**: A feature is NEVER marked `WORKING` because a prompt asked for it, a doc outlined it, or code comments claim it. It must be demonstrated through executable code and verified tests.
2. **Strict Categorization**:
   - `WORKING`: Complete implementation with real ML model/API calculations, automated unit/integration tests passing, and end-to-end UI verification.
   - `PARTIAL`: Implemented and functional, but with known limitations (e.g., heuristics used instead of learned weights, optical leaf analysis used as surface symptom rather than direct moisture sensor, or unverified secondary translations).
   - `DEMO`: Uses pre-generated/mocked seed data or fallback datasets (e.g. offline mandi prices, synthetic sample disease records) with an explicit `DEMO` badge in both UI and API response.
   - `NOT STARTED`: Interface stubbed, placeholder returned, or not yet implemented.

---

## Workflow Steps

### Step 1: Backend Code & Test Audit
- Inspect `backend/app/api/` routes and corresponding service modules in `backend/app/services/`, `backend/app/agents/`, and `backend/app/ml/`.
- Check if real algorithms, external APIs, or ML inference run. Flag any mock, hardcoded array, or dummy output.
- Check test coverage in `backend/tests/` for the feature.

### Step 2: Frontend Integration & `<StatusBadge/>` Audit
- Inspect frontend pages in `frontend/src/pages/` and components in `frontend/src/components/`.
- Verify every button triggers a live backend API call rather than simulated state.
- Verify that every feature card/panel renders `<StatusBadge status={featureStatus} />` with the exact status.

### Step 3: Reality Reconciliation & Update
- Update `docs/FEATURE_STATUS.md` with:
  - Feature name and module.
  - Tier (Tier 1, Tier 2, or Tier 3).
  - Current Status (`WORKING` / `PARTIAL` / `DEMO` / `NOT STARTED`).
  - Evidence (passing test name, API route, or browser capture).
  - Explicit limitations and notes.

### Step 4: Discrepancy Alert
- If any UI component shows `WORKING` when code is actually `DEMO` or `PARTIAL`, update the code immediately to reflect reality.

