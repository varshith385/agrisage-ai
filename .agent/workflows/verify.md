# `/verify` — End-to-End System Verification Workflow

This workflow executes full-system automated verification. Every gate check and PR must run this workflow and record verifiable output.

---

## Workflow Steps

### Step 1: Backend Automated Tests
- **Objective**: Ensure all Python unit, integration, and contract tests pass without failure or regression.
- **PowerShell Command**:
  ```powershell
  & .venv\Scripts\pytest -v backend/tests/
  ```
- **Criterion**: Exit code `0`, zero failed tests, zero unhandled exceptions.

### Step 2: Frontend Type-Check & Production Build
- **Objective**: Enforce strict TypeScript compilation and production bundle generation.
- **PowerShell Commands**:
  ```powershell
  cd frontend
  npm run type-check   # npx tsc --noEmit
  npm run build
  cd ..
  ```
- **Criterion**: Zero TypeScript diagnostics (`tsc` returns 0), Vite build completes and outputs `dist/`.

### Step 3: Start Both Services
- **Objective**: Launch backend API and frontend client in local development mode.
- **PowerShell Commands**:
  ```powershell
  # Start Backend in background or separate terminal
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "& .venv\Scripts\uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"
  
  # Start Frontend in background or separate terminal
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev -- --host 127.0.0.1 --port 5173"
  ```
- **Criterion**: Backend listens on `http://127.0.0.1:8000`, Frontend listens on `http://127.0.0.1:5173`.

### Step 4: API Health Check
- **Objective**: Verify backend route responsiveness, database connection, and core service readiness.
- **PowerShell Command**:
  ```powershell
  Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health" -Method Get
  ```
- **Criterion**: HTTP status 200 returned with JSON payload `{"status": "healthy"}` (or equivalent healthy signature).

### Step 5: Browser Verification (Home Page Render)
- **Objective**: Confirm that the UI loads, mounts correctly in the browser without React crashes, displays the design system, and has no console errors.
- **Action**: Use Chrome DevTools / Browser agent or browser navigation to visit `http://127.0.0.1:5173`.
- **Criterion**: 
  - Root DOM container rendered with Welcome/Login interface.
  - `<StatusBadge/>` components visible.
  - Zero fatal browser console errors.
  - Mobile (390px) and desktop layouts verified.

---

## Verification Output Report Format
Upon completing the workflow, compile a clear PASS/FAIL report:

| Step | Action | Command / Target | Result | Evidence / Output Note |
|---|---|---|---|---|
| 1 | Backend Tests | `pytest -v backend/tests/` | PASS / FAIL | N passed in X.XXs |
| 2 | Frontend Type-Check & Build | `tsc --noEmit && vite build` | PASS / FAIL | Zero TS errors, bundle generated |
| 3 | Server Startup | Port 8000 & 5173 | PASS / FAIL | Both processes running |
| 4 | API Health | `GET /api/v1/health` | PASS / FAIL | HTTP 200 payload verified |
| 5 | Browser Home Page | `http://127.0.0.1:5173` | PASS / FAIL | UI rendered cleanly, 0 console errors |

