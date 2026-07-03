#Requires -Version 5.1
<#
.SYNOPSIS
  Install per-user Cursor permission swatter layer for Aeye Windows machines.
.DESCRIPTION
  Writes ~/.cursor/permissions.json with Werkles swatter block/allow steering.
  Refuses unknown hostnames. Does not touch rescue clone.
#>
param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$AEYE_HOSTS = @(
  'DESKTOP-SJSJMNK'  # Sally
  'DESKTOP-KTBH0LA'  # Betsy (Operator prior readback)
)

$hostName = [System.Environment]::MachineName
if ($hostName -notin $AEYE_HOSTS -and -not $Force) {
  Write-Error "Permission swatter install refused: hostname '$hostName' is not a registered Aeye machine. Use -Force only if Operator explicitly approves."
}

$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
if (-not (Test-Path (Join-Path $repoRoot 'foreman\PERMISSION_SWATTER_V1.md'))) {
  Write-Error "Run from Werkles repo scripts/foreman. Could not resolve repo root from $PSScriptRoot"
}

$cursorDir = Join-Path $env:USERPROFILE '.cursor'
$dest = Join-Path $cursorDir 'permissions.json'
$repoPerms = Join-Path $repoRoot '.cursor\permissions.json'

if (-not (Test-Path $repoPerms)) {
  Write-Error "Missing repo permissions file: $repoPerms"
}

New-Item -ItemType Directory -Force -Path $cursorDir | Out-Null

$userPayload = @{
  '//_note' = 'Werkles Aeye user permission swatter v1 — merged with per-repo .cursor/permissions.json by Cursor'
  autoRun   = @{
    allow_instructions = @(
      "On Aeye machine $hostName, auto-approve routine Werkles sub-steps only when foreman/gates/APPROVED_PROJECT_REGISTRY.json shows approved_total for the active repo path and branch.",
      "Snapshot surface C:\Dev\Werkles is the default Sally forge path for swatter-eligible work."
    )
    block_instructions = @(
      "Never auto-approve git push, merge, deploy, SQL, billing, secrets, npm publish, or rescue clone work at Desktop\github\Werkles.",
      "Never auto-approve destructive filesystem commands or anything that could cause irreversible system or data loss."
    )
  }
}

$json = ($userPayload | ConvertTo-Json -Depth 6)
# ConvertTo-Json does not support comments; prepend JSONC header manually
$header = @"
{
  "_werkles_swatter": "user-layer v1 installed $(Get-Date -Format 'yyyy-MM-dd') on $hostName",
"@

$body = $json.TrimStart('{').TrimEnd('}')
$out = $header + $body + "`n}`n"
Set-Content -Path $dest -Value $out -Encoding UTF8

Write-Host "Installed user permission swatter: $dest"
Write-Host "Repo permissions (committed): $repoPerms"
Write-Host ""
Write-Host "Next: Cursor Settings -> Agents -> Run Mode -> Run Everything (or Auto-review)"
Write-Host "Verify: .\scripts\foreman\permission-swatter-status.ps1"
