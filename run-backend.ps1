param(
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$venv = Join-Path $root "venv"
$python = Join-Path $venv "Scripts\python.exe"

if (-not (Test-Path $python)) {
    Write-Host "Creating virtual environment..." -ForegroundColor Cyan
    python -m venv $venv
}

Write-Host "Installing dependencies..." -ForegroundColor Cyan
& $python -m pip install --upgrade pip | Out-Null
& $python -m pip install -r (Join-Path $root "requirements.txt")

$envFile = Join-Path $root ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "WARNING: No .env file found. Copy .env.example to .env and add GROK_API_KEY." -ForegroundColor Yellow
} else {
    $key = (Get-Content $envFile | Where-Object { $_ -match '^\s*GROK_API_KEY\s*=\s*(.+)$' } | Select-Object -First 1)
    if (-not $key) {
        Write-Host "WARNING: GROK_API_KEY is empty in .env. Test generation will fail until you add it." -ForegroundColor Yellow
    }
}

Write-Host "Starting backend on http://localhost:$Port ..." -ForegroundColor Green
Push-Location (Join-Path $root "src")
try {
    & $python -m uvicorn api:app --reload --host 0.0.0.0 --port $Port
} finally {
    Pop-Location
}