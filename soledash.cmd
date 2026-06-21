@echo off
title SoleDash — Werkles Operator Cockpit
set "REPO=%~dp0"
cd /d "%REPO%"

if exist "%ProgramFiles%\nodejs\node.exe" (
  set "PATH=%ProgramFiles%\nodejs;%PATH%"
)

set "PORT=3000"
set "URL=http://localhost:3000/soledash"

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000/soledash' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { try { $r = Invoke-WebRequest -Uri 'http://localhost:3001/soledash' -UseBasicParsing -TimeoutSec 2; exit 2 } catch { exit 1 } }"

if errorlevel 2 (
  set "PORT=3001"
  set "URL=http://localhost:3001/soledash"
  goto :open
)
if errorlevel 1 (
  echo Starting Werkles dev server...
  start "Werkles dev" /min cmd /c "cd /d \"%REPO%\" && npm run dev"
  echo Waiting for localhost...
  timeout /t 5 /nobreak >nul
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "for ($i=0; $i -lt 24; $i++) { try { Invoke-WebRequest -Uri 'http://localhost:3000/soledash' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 0 } catch { Start-Sleep -Seconds 1 } }; try { Invoke-WebRequest -Uri 'http://localhost:3001/soledash' -UseBasicParsing -TimeoutSec 2 | Out-Null; exit 2 } catch { exit 1 }"
  if errorlevel 2 (
    set "PORT=3001"
    set "URL=http://localhost:3001/soledash"
  )
)

:open
echo Opening SoleDash at %URL%
start "" "%URL%"
echo.
echo Desktop icon: run scripts\foreman\install-soledash-desktop-shortcut.ps1
echo Or in Edge: open %URL% then Install SoleDash as app
echo SoleDash launcher done. Dev server port: %PORT%
exit /b 0
