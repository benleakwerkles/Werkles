#requires -Version 5.1
<#
.SYNOPSIS
  Bootstrap a Cursor/PowerShell terminal for no-prompt Werkles 1Password CLI use.

.DESCRIPTION
  Makes this terminal prefer the repo-local op wrapper, disables desktop
  biometric integration for automation commands, and defines a PowerShell
  function named op that routes through the wrapper. This keeps secret values
  inside 1Password and the scoped service-account token inside Windows
  Credential Manager.
#>
param(
  [switch]$Quiet,
  [switch]$Verify
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

$wrapperDir = Join-Path $PSScriptRoot "bin"
$wrapperScript = Join-Path $PSScriptRoot "Invoke-WerklesOp.ps1"
$wrapperCommand = Join-Path $wrapperDir "op.cmd"
$separator = [IO.Path]::PathSeparator
$pathParts = @($env:PATH -split [regex]::Escape([string]$separator) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
if ($pathParts -notcontains $wrapperDir) {
  $env:PATH = ($wrapperDir + $separator + $env:PATH)
}

$env:OP_BIOMETRIC_UNLOCK_ENABLED = "false"
$env:OP_BIN = Get-WerklesOpBinary
$tokenPresent = -not [string]::IsNullOrWhiteSpace((Get-WerklesOnePasswordServiceToken))
$env:WERKLES_OP_AUTH_SOURCE = if ($tokenPresent) { "WINDOWS_CREDENTIAL_MANAGER" } else { "NONE" }
$env:WERKLES_REPO_ROOT = $RepoRoot.Path
$global:WerklesOpWrapperScript = $wrapperScript
$global:WerklesOpWrapperCommand = $wrapperCommand

function global:op {
  & $global:WerklesOpWrapperCommand @args
}

if ($Verify -and $tokenPresent) {
  $verifyOutput = & $wrapperCommand item list --vault "Werkles Automation" --format json 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw (($verifyOutput | Out-String).Trim() -split "`r?`n" | Select-Object -First 1)
  }
}

if (-not $Quiet) {
  if ($tokenPresent) {
    Write-Host "Werkles 1Password automation ready: Credential Manager token present; desktop CLI prompts disabled for this terminal."
  } else {
    Write-Warning "Werkles 1Password automation token missing; op wrapper will fail fast instead of waking 1Password desktop prompts."
  }
}
