# ==============================================================================
# AgriSage AI — Unified Development Environment Launcher (Windows PowerShell)
# Starts both FastAPI Backend (127.0.0.1:8000) and Vite Frontend (127.0.0.1:5173)
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "`n=== Launching AgriSage AI Full Development Environment ===" -ForegroundColor Cyan

# 1. Ensure backend virtualenv exists
if (-not (Test-Path ".venv\Scripts\uvicorn.exe")) {
    Write-Host "Setting up backend first via scripts/setup.ps1..." -ForegroundColor Yellow
    & .\scripts\setup.ps1
}

# 2. Ensure frontend node_modules exists
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    npm install --prefix frontend
}

Write-Host "`nStarting Backend on http://127.0.0.1:8000 in background job..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    & .venv\Scripts\uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
}

Write-Host "Backend job started (ID: $($backendJob.Id))." -ForegroundColor Green
Write-Host "Starting Frontend on http://127.0.0.1:5173..." -ForegroundColor Green
Write-Host "To stop both, press Ctrl+C.`n" -ForegroundColor Yellow

try {
    npm run dev --prefix frontend -- --host 127.0.0.1 --port 5173
} finally {
    Write-Host "`nStopping background backend job..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Write-Host "All development servers terminated cleanly." -ForegroundColor Green
}

