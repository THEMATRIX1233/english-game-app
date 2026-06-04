#Requires -Version 5.1
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ENGLISH GAME APP - KAHOOT SERVER" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check node
$nodeVer = node --version 2>$null
if (-not $nodeVer) { Write-Host "ERROR: Node.js not installed" -ForegroundColor Red; exit 1 }
Write-Host "Node: $nodeVer"

# Kill old processes
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

# Clean start - pick a free port
$port = 3001
$inUse = netstat -ano | Select-String ":$port\s" | Select-String "LISTEN"
if ($inUse) {
    # If 3001 is still in TIME_WAIT, use 3002
    $port = 3002
}

# Build fresh
Write-Host "`nBuilding frontend..."
Set-Location "$PSScriptRoot"
npm run build 2>&1 | Out-Null
if (-not (Test-Path "dist\index.html")) { Write-Host "ERROR: Build failed" -ForegroundColor Red; exit 1 }

# Start server
Write-Host "Starting server on port $port ..."
$env:PORT = $port
$serverJob = Start-Job -ScriptBlock { param($d,$p) Set-Location $d; $env:PORT=$p; node server.js } -ArgumentList $PSScriptRoot, $port
Start-Sleep -Seconds 3

# Check server job
$sj = Receive-Job $serverJob 2>&1
if ($sj -match "running") { Write-Host "  ✓ Server running" -ForegroundColor Green } else { Write-Host "  ⚠ $sj" }

# Start localtunnel
Write-Host "Starting internet tunnel..."
$tunnelJob = Start-Job -ScriptBlock { param($p) cmd /c "npx --yes localtunnel --port $p" } -ArgumentList $port
Start-Sleep -Seconds 6
$tj = Receive-Job $tunnelJob 2>&1

$url = ""
if ($tj -match "(https://[a-z-]+\.loca\.lt)") { $url = $Matches[1] }

# Get local IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notmatch "^169" }).IPAddress | Select-Object -First 1

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  ✅ SERVER RUNNING!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  LOCAL:     http://localhost:$port" -ForegroundColor White
if ($ip) { Write-Host "  RED LOCAL: http://${ip}:${port}" -ForegroundColor Yellow }
Write-Host ""
Write-Host "  == ACCESOS DIRECTOS ==" -ForegroundColor Cyan
Write-Host "  PROFESOR:  /#lobby" -ForegroundColor White
Write-Host "  PANTALLA:  /#game" -ForegroundColor White  
Write-Host "  JUGADORES: /#play" -ForegroundColor White
Write-Host ""
if ($url) {
    Write-Host "  🌐 INTERNET (comparte este enlace):" -ForegroundColor Green
    Write-Host "  $url" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Profesor:  $url/#lobby" -ForegroundColor White
    Write-Host "  Jugadores: $url/#play" -ForegroundColor White
    Write-Host "  Pantalla:  $url/#game" -ForegroundColor White
}
Write-Host ""
Write-Host "  Presiona CTRL+C para detener" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Cyan

# Keep alive
while ($true) {
    Start-Sleep -Seconds 10
    $sj = Receive-Job $serverJob 2>&1
    $tj = Receive-Job $tunnelJob 2>&1
}
