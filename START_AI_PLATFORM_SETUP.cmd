@echo off
setlocal

powershell -STA -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-ai-platforms.ps1"

if errorlevel 1 (
    echo.
    echo Setup script exited with an error.
    pause
)
