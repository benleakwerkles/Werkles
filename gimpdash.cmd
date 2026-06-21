@echo off
title GimpDash — GD Intent Router
set "REPO=%~dp0"
cd /d "%REPO%"
echo Starting / refreshing Foreman for GimpDash...
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
node "%REPO%scripts\foreman\foreman-control-server.mjs" --no-browser
if errorlevel 1 (
  echo.
  echo GIMPDASH FAILED - see above
  pause
  exit /b %errorlevel%
)
start "" "http://127.0.0.1:4317/#gimpdash"
echo Opened http://127.0.0.1:4317/#gimpdash
