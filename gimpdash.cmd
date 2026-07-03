@echo off
title GimpDash — GD Intent Router
cd /d "%USERPROFILE%\github\Werkles"
echo Starting / refreshing Foreman for GimpDash...
node "%USERPROFILE%\github\Werkles\scripts\foreman\foreman-control-server.mjs" --no-browser
if errorlevel 1 (
  echo.
  echo GIMPDASH FAILED - see above
  pause
  exit /b %errorlevel%
)
start "" "http://127.0.0.1:4317/#gimpdash"
echo Opened http://127.0.0.1:4317/#gimpdash
