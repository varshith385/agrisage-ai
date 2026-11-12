# ==============================================================================
# AgriSage AI — Backend Environment Setup Script (Windows PowerShell)
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "`n=== Setting up AgriSage AI Backend Environment ===" -ForegroundColor Cyan

# 1. Verify py -3.12 availability
try {
    $pyVer = py -3.12 --version 2>&1
    Write-Host "Detected Python 3.12 launcher: $pyVer" -ForegroundColor Green
} catch {
    Write-Error "Python 3.12 is required but could not be located via 'py -3.12'. Please install Python 3.12."
    exit 1
}

# 2. Create virtual environment if it does not exist
if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "Creating virtual environment in .venv with Python 3.12..." -ForegroundColor Yellow
    py -3.12 -m venv .venv
    Write-Host "Virtual environment created." -ForegroundColor Green
} else {
    Write-Host "Virtual environment already exists in .venv." -ForegroundColor Green
}

# 3. Upgrade pip and install pinned dependencies
Write-Host "Installing dependencies from backend/requirements.txt..." -ForegroundColor Yellow
& .venv\Scripts\python -m pip install --quiet --upgrade pip
& .venv\Scripts\pip install -r backend/requirements.txt

# 4. Copy .env.example to .env if not present
if (-not (Test-Path ".env")) {
    Write-Host "Copying .env.example to .env..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host ".env created with template configuration." -ForegroundColor Green
} else {
    Write-Host ".env configuration already present." -ForegroundColor Green
}

# 5. Run idempotent database migrations and seeding
Write-Host "Executing database migrations and initial demo data seeding..." -ForegroundColor Yellow
& .venv\Scripts\python scripts/seed.py

Write-Host "`n=== Setup Completed Successfully! ===" -ForegroundColor Green
Write-Host "Start the backend server using: .\scripts\dev-backend.ps1`n" -ForegroundColor Cyan

