#requires -Version 5.1
<#
.SYNOPSIS
  Blind sync: 1Password Environment or op:// refs -> Vercel env (names-only output).
#>
param(
  [ValidateSet("Preview", "Production", "Both")]
  [string]$Target = "Both",
  [switch]$DryRun,
  [ValidateSet("Environment", "OpRefs", "Auto")]
  [string]$Mode = "Auto"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $RepoRoot

. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

$OpBin = Get-WerklesOpBinary
$OpAuthSource = "NONE"
if (-not [string]::IsNullOrWhiteSpace($env:OP_SERVICE_ACCOUNT_TOKEN)) {
  $OpAuthSource = "OP_SERVICE_ACCOUNT_TOKEN_ENV"
} elseif (-not [string]::IsNullOrWhiteSpace($env:OP_SESSION)) {
  $OpAuthSource = "OP_SESSION_ENV"
} else {
  $storedToken = Get-WerklesOnePasswordServiceToken
  if (-not [string]::IsNullOrWhiteSpace($storedToken)) {
    $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken
    $OpAuthSource = "WINDOWS_CREDENTIAL_MANAGER"
  }
}
$HasNonInteractiveOpAuth = -not [string]::IsNullOrWhiteSpace($env:OP_SERVICE_ACCOUNT_TOKEN) -or -not [string]::IsNullOrWhiteSpace($env:OP_SESSION)

$configPath = Join-Path $RepoRoot "foreman\gates\werkles-vercel-op.config.json"
if (-not (Test-Path -LiteralPath $configPath)) {
  throw "Missing config: $configPath"
}

$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$varNames = @($config.tierAVariableNames)
$innerScript = Join-Path $PSScriptRoot "Sync-WerklesVercelEnvFrom1Password.Inner.ps1"

function Test-OpEnvironmentCommand {
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $null = & $OpBin environment read --help 2>$null
    return ($LASTEXITCODE -eq 0)
  } catch {
    return $false
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
}

function Get-TargetMap {
  param([string]$TargetChoice)
  $map = @()
  if ($TargetChoice -eq "Preview" -or $TargetChoice -eq "Both") {
    $map += [pscustomobject]@{
      Id = $config.onePasswordEnvironments.preview.environmentId
      Vercel = "preview"
    }
  }
  if ($TargetChoice -eq "Production" -or $TargetChoice -eq "Both") {
    $map += [pscustomobject]@{
      Id = $config.onePasswordEnvironments.production.environmentId
      Vercel = "production"
    }
  }
  return $map
}

function Invoke-BlindSync {
  param(
    [string]$VercelTarget,
    [string]$EnvironmentId,
    [string]$EffectiveMode,
    [System.Collections.Generic.HashSet[string]]$OpRefNamesToInject,
    [switch]$DryRunFlag
  )

  $innerArgs = @(
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-File", $innerScript,
    "-VercelTarget", $VercelTarget
  )
  if ($DryRunFlag) { $innerArgs += "-DryRun" }

  if ($DryRunFlag -and $EffectiveMode -eq "Environment") {
    Write-Output "DRY_RUN op run --environment $EnvironmentId -> $VercelTarget"
    foreach ($n in $varNames) { Write-Output "  WOULD_SYNC $n -> $VercelTarget" }
    return
  }

  if ($DryRunFlag -and $EffectiveMode -eq "OpRefs") {
    $refsFile = Join-Path $RepoRoot ($config.opRefsEnvFile -replace "/", "\")
    Write-Output "DRY_RUN op run --env-file $refsFile -> $VercelTarget"
    foreach ($n in $varNames) { Write-Output "  WOULD_SYNC $n -> $VercelTarget" }
    return
  }

  if ($EffectiveMode -eq "Environment") {
    if ([string]::IsNullOrWhiteSpace($EnvironmentId)) {
      throw "Environment ID missing in werkles-vercel-op.config.json for $VercelTarget"
    }
    & $OpBin run --environment $EnvironmentId -- powershell @innerArgs
  } else {
    $refsFile = Join-Path $RepoRoot ($config.opRefsEnvFile -replace "/", "\")
    if (-not (Test-Path -LiteralPath $refsFile)) {
      throw "Missing op refs file: $refsFile"
    }

    $effectiveRefsFile = $refsFile
    $tempRefsFile = $null
    if ($null -ne $OpRefNamesToInject) {
      $tempRefsFile = New-FilteredOpRefsFile -RefsFile $refsFile -NamesToInject $OpRefNamesToInject
      $effectiveRefsFile = $tempRefsFile
    }

    try {
      & $OpBin run --env-file="$effectiveRefsFile" -- powershell @innerArgs
    } finally {
      if ($tempRefsFile -and (Test-Path -LiteralPath $tempRefsFile)) {
        Remove-Item -LiteralPath $tempRefsFile -Force
      }
    }
  }

  if ($LASTEXITCODE -ne 0) {
    throw "op run failed for $VercelTarget with exit code $LASTEXITCODE"
  }
}

function Get-ValidOpRefNameSet {
  $validator = Join-Path $PSScriptRoot "Test-WerklesVercelSecretItem.ps1"
  $validationJson = & powershell -NoProfile -ExecutionPolicy Bypass -File $validator
  if ($LASTEXITCODE -ne 0) {
    throw "1Password item validation failed before OpRefs sync."
  }

  $validation = $validationJson | ConvertFrom-Json
  if ($validation.status -eq "BLOCKED_OR_FAILED") {
    throw "1Password item validation blocked before OpRefs sync."
  }
  if ($validation.dirty_field_count -gt 0) {
    throw "Dirty 1Password field values present; refusing Vercel sync."
  }

  $names = [System.Collections.Generic.HashSet[string]]::new([string[]]@($validation.valid_fields))
  if ($names.Count -eq 0) {
    throw "No valid 1Password fields available for OpRefs sync."
  }

  $missing = @($validation.empty_or_missing_fields)
  return [pscustomobject]@{
    Names = $names
    Missing = $missing
    ValidFieldCount = $validation.valid_field_count
  }
}

function New-FilteredOpRefsFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$RefsFile,
    [Parameter(Mandatory = $true)]
    [System.Collections.Generic.HashSet[string]]$NamesToInject
  )

  $tempPath = Join-Path ([IO.Path]::GetTempPath()) ("werkles-vercel-tier-a." + [guid]::NewGuid().ToString("N") + ".env.oprefs")
  $filtered = foreach ($line in (Get-Content -LiteralPath $RefsFile)) {
    $trimmed = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) {
      $line
      continue
    }

    $equals = $line.IndexOf("=")
    if ($equals -lt 1) {
      continue
    }

    $name = $line.Substring(0, $equals).Trim()
    if ($NamesToInject.Contains($name)) {
      $line
    }
  }

  $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
  [System.IO.File]::WriteAllLines($tempPath, [string[]]$filtered, $utf8NoBom)
  return $tempPath
}

if (-not (Get-Command $OpBin -ErrorAction SilentlyContinue) -and -not (Test-Path -LiteralPath $OpBin)) {
  throw "1Password CLI (op) not found. Install: winget install 1password-cli"
}

Write-Output "OP_BIN: $OpBin"
Write-Output "OP_AUTH_SOURCE: $OpAuthSource"

if (-not $DryRun -and -not $HasNonInteractiveOpAuth) {
  throw "Refusing real 1Password sync without OP_SERVICE_ACCOUNT_TOKEN, OP_SESSION, or stored Werkles Windows Credential Manager token. Desktop integration prompts repeatedly under Codex hidden shells."
}

$hasEnvCmd = if ($HasNonInteractiveOpAuth -and $Mode -eq "Environment") { Test-OpEnvironmentCommand } else { $false }
$effectiveMode = if ($Mode -eq "Auto") {
  # Service accounts cannot read 1Password Environments; OpRefs avoids desktop prompts.
  if ($HasNonInteractiveOpAuth) { "OpRefs" }
  elseif ($hasEnvCmd) { "Environment" }
  else { "OpRefs" }
} else { $Mode }

Write-Output "SYNC_MODE: $effectiveMode"
Write-Output "DRY_RUN: $($DryRun.IsPresent)"
Write-Output "VERCEL_PROJECT: $($config.vercelProject)"

if ($effectiveMode -eq "Environment" -and -not $hasEnvCmd) {
  Write-Output "NOTE: op environment not available on stable CLI - install 1Password CLI beta or use -Mode OpRefs"
}

$opRefNamesToInject = $null
if ($effectiveMode -eq "OpRefs" -and -not $DryRun) {
  $opRefValidation = Get-ValidOpRefNameSet
  $opRefNamesToInject = $opRefValidation.Names
  Write-Output "OPREFS_VALID_FIELD_COUNT: $($opRefValidation.ValidFieldCount)"
  if ($opRefValidation.Missing.Count -gt 0) {
    Write-Output "OPREFS_SKIPPED_MISSING_FIELDS: $($opRefValidation.Missing -join ', ')"
  } else {
    Write-Output "OPREFS_SKIPPED_MISSING_FIELDS: NONE"
  }
}

foreach ($t in (Get-TargetMap -TargetChoice $Target)) {
  Write-Output "--- TARGET: $($t.Vercel) ---"
  Invoke-BlindSync -VercelTarget $t.Vercel -EnvironmentId $t.Id -EffectiveMode $effectiveMode -OpRefNamesToInject $opRefNamesToInject -DryRunFlag:$DryRun
}

Write-Output "SYNC_COMPLETE_NAMES_ONLY"
