# DORMANT — documentation stub only. Do not treat as live activation.
# Requires Operator UAC consent via supported Windows elevation.
# No password typing. No UAC bypass. No service/task install.

param(
  [Parameter(Mandatory = $true)]
  [string]$WorkerExecutable,

  [Parameter(Mandatory = $true)]
  [string]$MachineId,

  [Parameter(Mandatory = $true)]
  [string]$ReceiverId,

  [Parameter(Mandatory = $true)]
  [string]$HandoffId,

  [switch]$WhatIf
)

$ErrorActionPreference = "Stop"

Write-Host "POOKA Elevated Session Preparation (DORMANT DOCUMENTATION STUB)"
Write-Host "MachineId=$MachineId ReceiverId=$ReceiverId HandoffId=$HandoffId"
Write-Host "WorkerExecutable=$WorkerExecutable"

if ($WhatIf) {
  Write-Host "WhatIf: would prompt Operator to elevate worker via Start-Process -Verb RunAs"
  Write-Host "WhatIf: would NOT install service/scheduled task/watcher"
  exit 0
}

Write-Error @"
REFUSED: Live elevation is disabled in this prototype package.
Open an Operator activation packet on the target Windows machine before any RunAs launch.
This stub exists to document the supported elevation entry — it does not activate the worker.
"@
