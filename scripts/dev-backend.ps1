# ==============================================================================
# AgriSage AI — Backend Development Server Launcher (Windows PowerShell)
# ==============================================================================

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".venv\Scripts\uvicorn.exe")) {
    Write-Host "Virtual environment not detected. Running .\scripts\setup.ps1 first..." -ForegroundColor Yellow
    & .\scripts\setup.ps1
}

Write-Host "`n=== Launching AgriSage AI FastAPI Server ===" -ForegroundColor Cyan
Write-Host "Host: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Interactive Docs (Swagger UI): http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "Press Ctrl+C to terminate the server.`n" -ForegroundColor Yellow

& .venv\Scripts\uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

