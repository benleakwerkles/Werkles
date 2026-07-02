@echo off
title GimpDash — GD Intent Router
cd /d "C:\Users\benle\Desktop\github\Werkles"
echo Starting / refreshing Foreman for GimpDash...
node "C:\Users\benle\Desktop\github\Werkles\scripts\foreman\foreman-control-server.mjs" --no-browser
if errorlevel 1 (
  echo.
  echo GIMPDASH FAILED - see above
  pause
  exit /b %errorlevel%
)
start "" "http://127.0.0.1:4317/#gimpdash"
echo Opened http://127.0.0.1:4317/#gimpdash
