@echo off
setlocal

set "TOOL_DIR=C:\Users\Ben Leak\Desktop\github\Werkles\tools\operator_assist"
cd /d "%TOOL_DIR%" || (
  echo Operator Assist folder not found:
  echo %TOOL_DIR%
  goto :done
)

if not exist ".env" (
  copy ".env.example" ".env" >nul
)

if not "%OPERATOR_ASSIST_NO_PAUSE%"=="1" (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$envPath = Join-Path (Get-Location) '.env'; $readmePath = Join-Path (Get-Location) 'README.md'; $envText = Get-Content -LiteralPath $envPath -Raw -ErrorAction SilentlyContinue; $hasGemini = $envText -match '(?m)^\s*GEMINI_API_KEY\s*=\s*\S+'; $hasOpenAI = $envText -match '(?m)^\s*OPENAI_API_KEY\s*=\s*\S+'; if (-not ($hasGemini -or $hasOpenAI)) { Start-Process notepad.exe -ArgumentList $envPath; Start-Process notepad.exe -ArgumentList $readmePath }"
)

call npm run snapshot

:done
echo.
echo Operator Assist Snapshot finished. Receipts are under:
echo %TOOL_DIR%\out\receipts
if not "%OPERATOR_ASSIST_NO_PAUSE%"=="1" pause
