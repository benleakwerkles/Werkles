#requires -Version 5.1
<#
.SYNOPSIS
  Add Production target to an existing Vercel Preview env var without reading its value.

.DESCRIPTION
  Uses the Vercel CLI auth token from the local Vercel config and the official
  Vercel REST API. It finds a project environment variable by key, verifies it
  is currently available to Preview, and PATCHes only its target list to include
  Production. The secret value is never requested, printed, or written.
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("NEXT_PUBLIC_SUPABASE_ANON_KEY")]
  [string]$FieldName,
  [switch]$DryRun,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_VERCEL_PREVIEW_ENV_TARGET_PROMOTION_20260704.json"
}

function Get-VercelAuthToken {
  $authPath = Join-Path $env:APPDATA "xdg.data\com.vercel.cli\auth.json"
  if (-not (Test-Path -LiteralPath $authPath)) {
    throw "Missing Vercel CLI auth file: $authPath"
  }
  $auth = Get-Content -Raw -LiteralPath $authPath | ConvertFrom-Json
  if ([string]::IsNullOrWhiteSpace([string]$auth.token)) {
    throw "Vercel CLI auth token is missing."
  }
  return [string]$auth.token
}

function Get-ArrayValue {
  param($Value)
  if ($null -eq $Value) {
    return @()
  }
  if ($Value -is [array]) {
    return @($Value)
  }
  return @($Value)
}

function Invoke-VercelApi {
  param(
    [string]$Method,
    [string]$Uri,
    [object]$Body,
    [string]$Token
  )

  $headers = @{
    Authorization = "Bearer $Token"
    "Content-Type" = "application/json"
  }
  $args = @{
    Method = $Method
    Uri = $Uri
    Headers = $headers
    TimeoutSec = 30
  }
  if ($null -ne $Body) {
    $args.Body = ($Body | ConvertTo-Json -Depth 8)
  }
  return Invoke-RestMethod @args
}

$receipt = [ordered]@{
  schema = "WERKLES_COM_VERCEL_PREVIEW_ENV_TARGET_PROMOTION_V1"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  fieldName = $FieldName
  dryRun = $DryRun.IsPresent
  secretValuesPrinted = "NO"
  secretValuesWrittenToRepo = "NO"
  decryptedValueRequested = "NO"
  valuePatched = "NO"
  targetOnlyPatch = "YES"
  projectId = $null
  teamIdPresent = $false
  matchingEnvCount = 0
  selectedEnvIdPresent = $false
}

try {
  $repoConfigPath = Join-Path $RepoRoot ".vercel\repo.json"
  if (-not (Test-Path -LiteralPath $repoConfigPath)) {
    throw "Missing Vercel repo config: $repoConfigPath"
  }
  $repoConfig = Get-Content -Raw -LiteralPath $repoConfigPath | ConvertFrom-Json
  $project = @($repoConfig.projects | Where-Object { $_.name -eq "werkles1" } | Select-Object -First 1)
  if (-not $project) {
    throw "Werkles Vercel project config not found."
  }
  $projectId = [string]$project.id
  $teamId = [string]$project.orgId
  if ([string]::IsNullOrWhiteSpace($projectId)) {
    throw "Vercel project id missing from repo config."
  }

  $receipt.projectId = $projectId
  $receipt.teamIdPresent = -not [string]::IsNullOrWhiteSpace($teamId)

  $token = Get-VercelAuthToken
  $query = if ([string]::IsNullOrWhiteSpace($teamId)) { "" } else { "?teamId=$teamId" }
  $envListUri = "https://api.vercel.com/v10/projects/$projectId/env$query"
  $envList = Invoke-VercelApi -Method "GET" -Uri $envListUri -Token $token
  $envs = @()
  if ($envList.envs) {
    $envs = @($envList.envs)
  } elseif ($envList -is [array]) {
    $envs = @($envList)
  } elseif ($envList.key) {
    $envs = @($envList)
  }

  $matches = @($envs | Where-Object { [string]$_.key -eq $FieldName })
  $receipt.matchingEnvCount = $matches.Count
  $receipt.matchingEnvSummaries = @($matches | ForEach-Object {
    $targets = @(Get-ArrayValue $_.target | ForEach-Object { [string]$_ })
    [ordered]@{
      idPresent = -not [string]::IsNullOrWhiteSpace([string]$_.id)
      target = $targets
      gitBranchPresent = -not [string]::IsNullOrWhiteSpace([string]$_.gitBranch)
      type = [string]$_.type
      decrypted = [string]$_.decrypted
      valueLengthPresent = if ($null -ne $_.value) { ([string]$_.value).Length -gt 0 } else { $false }
    }
  })

  $eligible = @($matches | Where-Object {
    $targets = @(Get-ArrayValue $_.target | ForEach-Object { [string]$_ })
    $targets -contains "preview" -and
    -not ($targets -contains "production") -and
    [string]::IsNullOrWhiteSpace([string]$_.gitBranch)
  })
  if ($eligible.Count -ne 1) {
    $receipt.eligibleEnvCount = $eligible.Count
    throw "Expected exactly one non-branch Preview env var eligible for target promotion; found $($eligible.Count)."
  }

  $selected = $eligible[0]
  $selectedId = [string]$selected.id
  if ([string]::IsNullOrWhiteSpace($selectedId)) {
    throw "Selected Vercel env var has no id."
  }
  $receipt.selectedEnvIdPresent = $true
  $oldTargets = @(Get-ArrayValue $selected.target | ForEach-Object { [string]$_ })
  $newTargets = @($oldTargets + "production" | Sort-Object -Unique)
  $receipt.oldTargets = $oldTargets
  $receipt.newTargets = $newTargets

  if ($DryRun) {
    $receipt.status = "DRY_RUN_WOULD_PROMOTE_TARGET"
  } else {
    $patchUri = "https://api.vercel.com/v9/projects/$projectId/env/$selectedId$query"
    $body = [ordered]@{
      target = $newTargets
    }
    $patched = Invoke-VercelApi -Method "PATCH" -Uri $patchUri -Body $body -Token $token
    $receipt.patchReturnedKey = [string]$patched.key
    $receipt.patchReturnedTarget = @(Get-ArrayValue $patched.target | ForEach-Object { [string]$_ })
    $receipt.status = "PASS_PROMOTED_PREVIEW_ENV_TARGET_TO_PRODUCTION"
  }
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

[pscustomobject]@{
  status = $receipt.status
  field_name = $receipt.fieldName
  dry_run = $receipt.dryRun
  matching_env_count = $receipt.matchingEnvCount
  selected_env_id_present = $receipt.selectedEnvIdPresent
  old_targets = $receipt.oldTargets
  new_targets = $receipt.newTargets
  decrypted_value_requested = $receipt.decryptedValueRequested
  value_patched = $receipt.valuePatched
  target_only_patch = $receipt.targetOnlyPatch
  secret_values_printed = $receipt.secretValuesPrinted
  secret_values_written_to_repo = $receipt.secretValuesWrittenToRepo
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5

