@echo off
title Foreman Control Panel
set "REPO=%~dp0"
cd /d "%REPO%"
echo Starting Foreman Control Panel on http://127.0.0.1:4317 ...
echo (NOT localhost:3000 — that is the Werkles app preview / npm run dev)
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"
node "%REPO%scripts\foreman\foreman-control-server.mjs"
if errorlevel 1 (
  echo.
  echo FOREMAN CONTROL PANEL FAILED - see above
  echo If port 4317 is occupied by an unknown process: HUMAN GATE REQUIRED - close it manually.
  pause
  exit /b %errorlevel%
)
