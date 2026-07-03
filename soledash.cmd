@echo off
title SoleDash v0 — Werkles visibility
cd /d "%USERPROFILE%\github\Werkles"

echo Checking localhost:3000 (canonical surface)...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$repo = Join-Path $env:USERPROFILE 'github\Werkles';" ^
  "$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1;" ^
  "$needsStart = $true;" ^
  "if ($conn) {" ^
  "  $p = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $conn.OwningProcess);" ^
  "  if ($p.CommandLine -like ('*' + $repo + '*')) { Write-Host 'OK: canonical dev server on :3000'; $needsStart = $false }" ^
  "  else { Write-Host 'Port :3000 in use by another process. Starting canonical dev may fail.' }" ^
  "};" ^
  "if ($needsStart) {" ^
  "  Write-Host 'Starting npm run dev on canonical surface...';" ^
  "  Start-Process powershell -ArgumentList '-NoExit','-NoProfile','-Command',('cd ' + $repo + '; npm.cmd run dev');" ^
  "}"

echo Waiting for Next dev server...
set /a tries=0
:wait_loop
set /a tries+=1
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000/soledash' -UseBasicParsing -TimeoutSec 5; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"
if %errorlevel%==0 goto open_browser
if %tries% geq 12 (
  echo Timed out waiting for http://localhost:3000/soledash
  pause
  exit /b 1
)
timeout /t 3 /nobreak >nul
goto wait_loop

:open_browser
start "" "http://localhost:3000/soledash"
echo Opened http://localhost:3000/soledash
