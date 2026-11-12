# PowerShell script to download disease classification model and fixtures
Write-Host "Running download_models.py..." -ForegroundColor Cyan

$pythonExe = Join-Path $PSScriptRoot "..\.venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
    $pythonExe = "python"
}

$scriptPath = Join-Path $PSScriptRoot "download_models.py"
& $pythonExe $scriptPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "Model artifacts downloaded and verified successfully." -ForegroundColor Green
} else {
    Write-Host "Model download encountered an error (exit code $LASTEXITCODE)." -ForegroundColor Red
    exit $LASTEXITCODE
}

