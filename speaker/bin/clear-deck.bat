@echo off
setlocal EnableExtensions

set "SPEAKER_ROOT=C:\speaker"
set "STAGED_DIR=%SPEAKER_ROOT%\receipts\staged"
set "INCOMING_DIR=%SPEAKER_ROOT%\bootloader\incoming"
set "LOG_DIR=%SPEAKER_ROOT%\logs"
set "LOG_PATH=%LOG_DIR%\clear-deck.log"
set "OWNER=%USERDOMAIN%\%USERNAME%"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%" >nul 2>nul
if not exist "%INCOMING_DIR%" mkdir "%INCOMING_DIR%" >nul 2>nul

echo [%DATE% %TIME%] CLEAR_DECK_START owner=%OWNER% root=%SPEAKER_ROOT%>>"%LOG_PATH%"

attrib -R -H -S "%SPEAKER_ROOT%\*" /S /D >>"%LOG_PATH%" 2>>&1
icacls "%SPEAKER_ROOT%\*" /grant "%OWNER%:(OI)(CI)F" /T /C /Q >>"%LOG_PATH%" 2>>&1

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference='Stop';" ^
  "$staged='%STAGED_DIR%';" ^
  "$incoming='%INCOMING_DIR%';" ^
  "$log='%LOG_PATH%';" ^
  "New-Item -ItemType Directory -Force -Path $incoming | Out-Null;" ^
  "if (Test-Path -LiteralPath $staged) {" ^
  "  $latest = Get-ChildItem -LiteralPath $staged -File | Where-Object { $_.Name -in @('THUFIR_ATLAS_SCRIPT_VERDICT.md','BEAN_WERKLES_DIVERGENCE_REPORT.json') } | Sort-Object LastWriteTime -Descending | Select-Object -First 1;" ^
  "  if ($latest) {" ^
  "    Copy-Item -LiteralPath $latest.FullName -Destination (Join-Path $incoming $latest.Name) -Force;" ^
  "    Add-Content -LiteralPath $log -Value ('[' + (Get-Date).ToString('s') + '] CLEAR_DECK_REPORT_COPIED source=' + $latest.FullName + ' destination=' + (Join-Path $incoming $latest.Name));" ^
  "  } else {" ^
  "    Add-Content -LiteralPath $log -Value ('[' + (Get-Date).ToString('s') + '] CLEAR_DECK_REPORT_AWAITING_FIELD_DATA staged=' + $staged);" ^
  "  }" ^
  "} else {" ^
  "  Add-Content -LiteralPath $log -Value ('[' + (Get-Date).ToString('s') + '] CLEAR_DECK_STAGED_DIR_MISSING staged=' + $staged);" ^
  "}" >>"%LOG_PATH%" 2>>&1

echo [%DATE% %TIME%] CLEAR_DECK_COMPLETE>>"%LOG_PATH%"

endlocal
exit /b 0
