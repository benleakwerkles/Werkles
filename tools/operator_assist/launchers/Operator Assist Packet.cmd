@echo off
setlocal

set "TOOL_DIR=C:\Users\Ben Leak\Desktop\github\Werkles\tools\operator_assist"
cd /d "%TOOL_DIR%" || (
  echo Operator Assist folder not found:
  echo %TOOL_DIR%
  goto :done
)

set "DESTINATION=%OPERATOR_ASSIST_DESTINATION%"
set "MISSION=%OPERATOR_ASSIST_MISSION%"

if "%DESTINATION%"=="" set "DESTINATION=%~1"
if "%MISSION%"=="" set "MISSION=%~2"

if "%DESTINATION%"=="" (
  set /p DESTINATION=Destination Aeye@Machine: 
)

if "%MISSION%"=="" (
  set /p MISSION=Mission text: 
)

if "%DESTINATION%"=="" (
  echo Missing destination.
  goto :done
)

if "%MISSION%"=="" (
  echo Missing mission text.
  goto :done
)

call npm run packet -- "%DESTINATION%" "%MISSION%"

:done
echo.
echo Operator Assist Packet finished. Receipts are under:
echo %TOOL_DIR%\out\receipts
if not "%OPERATOR_ASSIST_NO_PAUSE%"=="1" pause
