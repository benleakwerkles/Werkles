@echo off
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0..\Invoke-WerklesOp.ps1" %*
exit /b %ERRORLEVEL%
