$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontend = Join-Path $root "frontend"

if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    Push-Location $frontend
    try { npm install } finally { Pop-Location }
}

Write-Host "Starting frontend on http://localhost:3000 ..." -ForegroundColor Green
Push-Location $frontend
try {
    npm run dev
} finally {
    Pop-Location
}