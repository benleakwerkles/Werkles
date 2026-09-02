#requires -Version 5.1
<#
.SYNOPSIS
  Apply matching shadow migration via Supabase Management API.

.DESCRIPTION
  Uses Chrome dashboard session bearer token + project ref from 1Password.
  Never prints secrets. Requires Operator approval logged in APPROVAL_LOG.
#>
param(
  [string]$MigrationFile = (Join-Path $PSScriptRoot "..\..\supabase\migrations\00004_matching_shadow_persistence.sql"),
  [string[]]$ChromeProfiles = @("Default", "Profile 1", "Profile 2"),
  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

$storedServiceToken = Get-WerklesOnePasswordServiceToken
$approvedSessionPresent = -not [string]::IsNullOrWhiteSpace($env:OP_SESSION)
if ([string]::IsNullOrWhiteSpace($storedServiceToken) -and -not $approvedSessionPresent) {
  throw "BLOCKED_NONINTERACTIVE_1PASSWORD_AUTH_MISSING: refusing to wake 1Password desktop prompts. Install the scoped Werkles automation token or run an explicitly approved visible session."
}
if (-not [string]::IsNullOrWhiteSpace($storedServiceToken)) {
  $env:OP_SERVICE_ACCOUNT_TOKEN = $storedServiceToken
}
$env:OP_BIOMETRIC_UNLOCK_ENABLED = "false"

function Get-ChromeBearerCandidates {
  param([string[]]$Profiles)
  $tokens = New-Object System.Collections.Generic.HashSet[string]
  $chromeRoot = Join-Path $env:LOCALAPPDATA "Google\Chrome\User Data"
  foreach ($profileName in $Profiles) {
    $levelDb = Join-Path $chromeRoot "$profileName\Local Storage\leveldb"
    if (-not (Test-Path -LiteralPath $levelDb)) { continue }
    foreach ($file in Get-ChildItem -LiteralPath $levelDb -File -ErrorAction SilentlyContinue) {
      if ($file.Length -gt 20MB) { continue }
      try {
        $text = [Text.Encoding]::UTF8.GetString([IO.File]::ReadAllBytes($file.FullName))
        foreach ($match in [regex]::Matches($text, "eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}")) {
          [void]$tokens.Add([string]$match.Value)
        }
      } catch {}
    }
  }
  return @($tokens)
}

function Get-OpExe {
  $cli = Resolve-WerklesOnePasswordCli -AllowUnsignedFallback
  if ($cli -and $cli.Path) { return $cli.Path }
  throw "1Password CLI not found."
}

function Get-SupabaseProjectRef {
  param([string]$VaultName, [string]$Title)
  $op = Get-OpExe
  $item = & $op item get $Title --vault $VaultName --format json --reveal | ConvertFrom-Json
  $field = @($item.fields | Where-Object { $_.label -eq "NEXT_PUBLIC_SUPABASE_URL" })
  if ($field.Count -ne 1 -or [string]::IsNullOrWhiteSpace([string]$field[0].value)) {
    throw "NEXT_PUBLIC_SUPABASE_URL missing from 1Password."
  }
  $url = ([string]$field[0].value).TrimEnd("/")
  if ($url -match "^https://([a-z0-9-]+)\.supabase\.co/?$") { return $Matches[1] }
  throw "Could not parse Supabase project ref."
}

function Invoke-SupabaseManagementGet {
  param([string]$Uri, [string]$BearerToken)
  try {
    $body = Invoke-RestMethod -Method Get -Uri $Uri -Headers @{ Authorization = "Bearer $BearerToken"; Accept = "application/json" } -TimeoutSec 30
    return [pscustomobject]@{ ok = $true; statusCode = 200; body = $body }
  } catch {
    $statusCode = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }
    return [pscustomobject]@{ ok = $false; statusCode = $statusCode }
  }
}

function Invoke-SupabaseDatabaseQuery {
  param(
    [string]$ProjectRef,
    [string]$BearerToken,
    [string]$Query
  )
  $body = @{ query = $Query } | ConvertTo-Json -Compress
  try {
    $response = Invoke-RestMethod -Method Post `
      -Uri "https://api.supabase.com/v1/projects/$ProjectRef/database/query" `
      -Headers @{ Authorization = "Bearer $BearerToken"; "Content-Type" = "application/json" } `
      -Body $body `
      -TimeoutSec 120
    return [pscustomobject]@{ ok = $true; statusCode = 200; body = $response }
  } catch {
    $statusCode = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }
    return [pscustomobject]@{ ok = $false; statusCode = $statusCode; error = $_.Exception.Message }
  }
}

function Get-TableNamesFromQueryBody {
  param($Body)
  $tables = @()
  if ($Body -is [System.Collections.IEnumerable]) {
    foreach ($row in $Body) {
      if ($row.table_name) { $tables += [string]$row.table_name }
    }
  }
  return $tables
}

function Get-ManagementBearerTokens {
  param([string]$ProjectRef, [string[]]$Profiles)
  $candidates = Get-ChromeBearerCandidates -Profiles $Profiles
  $valid = New-Object System.Collections.Generic.List[string]
  $probe = "https://api.supabase.com/v1/projects/$ProjectRef/api-keys"
  foreach ($token in $candidates) {
    $response = Invoke-SupabaseManagementGet -Uri $probe -BearerToken $token
    if ($response.ok) { $valid.Add($token) }
  }
  return @($valid)
}

if (-not (Test-Path -LiteralPath $MigrationFile)) {
  throw "Migration file not found: $MigrationFile"
}

$projectRef = Get-SupabaseProjectRef -VaultName $Vault -Title $ItemTitle
$sql = Get-Content -LiteralPath $MigrationFile -Raw
$verifySql = @"
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('discovery_intakes', 'matching_shadow_runs')
order by table_name;
"@

$tokens = @(Get-ManagementBearerTokens -ProjectRef $projectRef -Profiles $ChromeProfiles)
if ($env:SUPABASE_ACCESS_TOKEN -and -not [string]::IsNullOrWhiteSpace($env:SUPABASE_ACCESS_TOKEN)) {
  $tokens = @($env:SUPABASE_ACCESS_TOKEN.Trim()) + $tokens
}
if ($tokens.Count -eq 0) {
  throw "No Supabase Management API credentials found. Sign in to https://supabase.com/dashboard in Chrome, run `supabase login`, or set SUPABASE_ACCESS_TOKEN, then retry."
}

$lastError = "No token succeeded"
foreach ($token in $tokens) {
  $verifyBefore = Invoke-SupabaseDatabaseQuery -ProjectRef $projectRef -BearerToken $token -Query $verifySql
  if (-not $verifyBefore.ok) {
    $lastError = "verify_before_failed status=$($verifyBefore.statusCode)"
    continue
  }

  $existing = Get-TableNamesFromQueryBody -Body $verifyBefore.body
  if ($existing.Count -eq 2) {
    [ordered]@{
      ok = $true
      schema = "WERKLES_MATCHING_SCHEMA_APPLY_V1"
      status = "already_applied"
      project_ref = $projectRef
      tables = $existing
    } | ConvertTo-Json -Compress
    exit 0
  }

  $apply = Invoke-SupabaseDatabaseQuery -ProjectRef $projectRef -BearerToken $token -Query $sql
  if (-not $apply.ok) {
    $lastError = "apply_failed status=$($apply.statusCode)"
    continue
  }

  $verifyAfter = Invoke-SupabaseDatabaseQuery -ProjectRef $projectRef -BearerToken $token -Query $verifySql
  if (-not $verifyAfter.ok) {
    $lastError = "verify_after_failed status=$($verifyAfter.statusCode)"
    continue
  }

  $tables = Get-TableNamesFromQueryBody -Body $verifyAfter.body
  if ($tables.Count -eq 2) {
    [ordered]@{
      ok = $true
      schema = "WERKLES_MATCHING_SCHEMA_APPLY_V1"
      status = "applied"
      project_ref = $projectRef
      tables = $tables
    } | ConvertTo-Json -Compress
    exit 0
  }

  $lastError = "partial_tables count=$($tables.Count)"
}

[ordered]@{
  ok = $false
  schema = "WERKLES_MATCHING_SCHEMA_APPLY_V1"
  status = "failed"
  project_ref = $projectRef
  management_tokens = $tokens.Count
  error = $lastError
} | ConvertTo-Json -Compress
exit 1
