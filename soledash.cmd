@echo off
title SoleDash v0 — Werkles visibility
cd /d "C:\Dev\Werkles"

echo Checking localhost:3000 (snapshot surface only)...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$repo = 'C:\Dev\Werkles';" ^
  "$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1;" ^
  "$needsStart = $true;" ^
  "if ($conn) {" ^
  "  $p = Get-CimInstance Win32_Process -Filter ('ProcessId=' + $conn.OwningProcess);" ^
  "  if ($p.CommandLine -like ('*' + $repo + '*')) { Write-Host 'OK: snapshot dev server on :3000'; $needsStart = $false }" ^
  "  elseif ($p.CommandLine -like '*Desktop\github\Werkles*') { Write-Host 'BLOCKED: rescue clone owns :3000. Stop that dev server first.'; exit 2 }" ^
  "  else { Write-Host 'Port :3000 in use by another process. Starting snapshot dev may fail.' }" ^
  "};" ^
  "if ($needsStart) {" ^
  "  Write-Host 'Starting npm run dev on snapshot surface...';" ^
  "  Start-Process powershell -ArgumentList '-NoExit','-NoProfile','-Command','cd C:\Dev\Werkles; npm.cmd run dev';" ^
  "}"

if errorlevel 2 (
  echo.
  echo SoleDash requires C:\Dev\Werkles on port 3000. Do not use the Sally rescue clone.
  pause
  exit /b 2
)

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
