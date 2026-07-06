#requires -Version 5.1
<#
  Sync Vercel from 1Password Environment via op environment read (beta CLI).
  Names-only output. Service account only — no desktop integration prompts.
#>
param(
  [ValidateSet("Preview", "Production", "Both")]
  [string]$Target = "Both"
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $RepoRoot

. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

$OpBin = Get-WerklesOpBinary
$storedToken = Get-WerklesOnePasswordServiceToken
if ([string]::IsNullOrWhiteSpace($env:OP_SERVICE_ACCOUNT_TOKEN)) {
  if (-not [string]::IsNullOrWhiteSpace($storedToken)) {
    $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken
  }
}
if ([string]::IsNullOrWhiteSpace($env:OP_SERVICE_ACCOUNT_TOKEN)) {
  throw "Refusing Environment sync without stored service account token. Desktop CLI auth is blocked — use Sync-WerklesVercelEnvFrom1Password.ps1 -Mode OpRefs instead."
}
Write-Output "AUTH: service account (no desktop prompts)"

$config = Get-Content (Join-Path $RepoRoot "foreman\gates\werkles-vercel-op.config.json") -Raw | ConvertFrom-Json
$varNames = @($config.tierAVariableNames)
$publicNames = [System.Collections.Generic.HashSet[string]]::new([string[]]@($config.publicVariableNames))
$innerScript = Join-Path $PSScriptRoot "Sync-WerklesVercelEnvFrom1Password.Inner.ps1"

function Import-EnvironmentVars {
  param([string]$EnvironmentId)
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $raw = & $OpBin environment read $EnvironmentId 2>&1
  $ErrorActionPreference = $prev
  if ($LASTEXITCODE -ne 0) {
    throw "op environment read failed for $EnvironmentId"
  }
  $map = @{}
  foreach ($line in $raw) {
    $text = [string]$line
    if ($text.Length -eq 0 -or $text.StartsWith('#')) { continue }
    $eq = $text.IndexOf('=')
    if ($eq -lt 1) { continue }
    $key = $text.Substring(0, $eq).Trim()
    $val = $text.Substring($eq + 1).Trim()
    if ($val.Length -ge 2 -and $val.StartsWith('"') -and $val.EndsWith('"')) {
      $val = $val.Substring(1, $val.Length - 2)
    }
    if ($key.Length -gt 0 -and -not [string]::IsNullOrWhiteSpace($val)) {
      $map[$key] = $val
    }
  }
  return $map
}

function Push-EnvironmentToVercel {
  param(
    [string]$EnvironmentId,
    [string]$VercelTarget
  )

  Write-Output "--- TARGET: $VercelTarget ---"
  $values = Import-EnvironmentVars -EnvironmentId $EnvironmentId

  foreach ($name in $varNames) {
    if (-not $values.ContainsKey($name) -or [string]::IsNullOrWhiteSpace($values[$name])) {
      Write-Output "MISSING_IN_ENV $name -> $VercelTarget"
      continue
    }

    [Environment]::SetEnvironmentVariable($name, $values[$name], "Process")

    $sensitiveFlag = if ($publicNames.Contains($name)) { "--no-sensitive" } else { "--sensitive" }
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "npx"
    $psi.Arguments = "vercel@latest env add $name $VercelTarget --force --yes $sensitiveFlag --value -"
    $psi.WorkingDirectory = $RepoRoot
    $psi.UseShellExecute = $false
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true

    $p = [System.Diagnostics.Process]::Start($psi)
    $p.StandardInput.Write($values[$name])
    $p.StandardInput.Close()
    $null = $p.StandardOutput.ReadToEnd()
    $stderr = $p.StandardError.ReadToEnd()
    $p.WaitForExit()

    [Environment]::SetEnvironmentVariable($name, $null, "Process")

    if ($p.ExitCode -eq 0) {
      Write-Output "ADDED $name -> $VercelTarget"
    } else {
      $line = ($stderr -split "`n" | Where-Object { $_.Trim() } | Select-Object -First 1)
      if (-not $line) { $line = "exit $($p.ExitCode)" }
      Write-Output "FAILED $name -> $VercelTarget :: $line"
    }
  }
}

Write-Output "OP_BIN: $OpBin"
Write-Output "SYNC_VIA: op environment read"

if ($Target -eq "Preview" -or $Target -eq "Both") {
  Push-EnvironmentToVercel -EnvironmentId $config.onePasswordEnvironments.preview.environmentId -VercelTarget "preview"
}
if ($Target -eq "Production" -or $Target -eq "Both") {
  Push-EnvironmentToVercel -EnvironmentId $config.onePasswordEnvironments.production.environmentId -VercelTarget "production"
}

Write-Output "ENVIRONMENT_SYNC_COMPLETE_NAMES_ONLY"
