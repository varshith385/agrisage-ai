# ==============================================================================
# AgriSage AI — Frontend Development Server Launcher (Windows PowerShell)
# ==============================================================================

$ErrorActionPreference = "Stop"

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Frontend node_modules not detected. Running npm install..." -ForegroundColor Yellow
    npm install --prefix frontend
}

Write-Host "`n=== Launching AgriSage AI Vite Frontend ===" -ForegroundColor Cyan
Write-Host "Host: http://localhost:5173" -ForegroundColor Green
Write-Host "Proxying API requests to http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "Press Ctrl+C to terminate the server.`n" -ForegroundColor Yellow

npm run dev --prefix frontend -- --host 127.0.0.1 --port 5173

