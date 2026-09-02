#requires -Version 5.1
<#
.SYNOPSIS
  Import one decrypted Vercel env var value into 1Password without printing it.

.DESCRIPTION
  Uses the local Vercel CLI auth token and the official Vercel REST API
  decrypted-env endpoint. The decrypted value is validated in memory, piped to
  Set-1PasswordFieldFromStdin.ps1, and never printed or written to a repo file.
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("NEXT_PUBLIC_SUPABASE_ANON_KEY")]
  [string]$FieldName,
  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_VERCEL_DECRYPTED_ENV_TO_1PASSWORD_20260705.json"
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
    [string]$Token
  )

  $headers = @{
    Authorization = "Bearer $Token"
    "Content-Type" = "application/json"
  }
  return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers -TimeoutSec 30
}

function ConvertFrom-Base64Url {
  param([string]$Value)

  $padded = $Value.Replace("-", "+").Replace("_", "/")
  switch ($padded.Length % 4) {
    2 { $padded += "==" }
    3 { $padded += "=" }
    1 { return $null }
  }

  try {
    return [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($padded))
  } catch {
    return $null
  }
}

function Get-JwtPayload {
  param([string]$Token)

  $parts = $Token -split "\."
  if ($parts.Count -ne 3) {
    return $null
  }

  $payloadJson = ConvertFrom-Base64Url -Value $parts[1]
  if ([string]::IsNullOrWhiteSpace($payloadJson)) {
    return $null
  }

  try {
    return $payloadJson | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Test-ClientKeyShape {
  param(
    [string]$Value,
    [string]$ExpectedProjectRef
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $false
  }

  if ($Value -match "^sb_publishable_[A-Za-z0-9_-]+$") {
    return $true
  }

  if ($Value -notmatch "^eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$") {
    return $false
  }

  $payload = Get-JwtPayload -Token $Value
  if ($null -eq $payload) {
    return $false
  }

  return ([string]$payload.role -eq "anon" -and [string]$payload.ref -eq $ExpectedProjectRef)
}

function Invoke-StdinSetter {
  param([string]$Value)

  $setter = Join-Path $PSScriptRoot "Set-1PasswordFieldFromStdin.ps1"
  $args = @(
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-File", $setter,
    "-FieldName", $FieldName,
    "-Vault", $Vault,
    "-ItemTitle", $ItemTitle,
    "-SourceLabel", "VercelDecryptedEnvApi",
    "-ReceiptPath", (Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_1PASSWORD_FIELD_SET_VERCEL_DECRYPTED_ENV_20260705.json")
  )

  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = "powershell.exe"
  $psi.Arguments = ($args | ForEach-Object {
    $text = [string]$_
    if ($text -notmatch '[\s"]') { $text } else { '"' + $text.Replace('"', '\"') + '"' }
  }) -join " "
  $psi.WorkingDirectory = $RepoRoot.Path
  $psi.UseShellExecute = $false
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true

  $process = [System.Diagnostics.Process]::Start($psi)
  $process.StandardInput.Write($Value)
  $process.StandardInput.Close()
  $null = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  if ($process.ExitCode -ne 0) {
    $line = ($stderr -split "`r?`n" | Where-Object { $_.Trim() } | Select-Object -First 1)
    if (-not $line) { $line = "exit $($process.ExitCode)" }
    throw "1Password stdin setter failed: $line"
  }
}

$receipt = [ordered]@{
  schema = "WERKLES_COM_VERCEL_DECRYPTED_ENV_TO_1PASSWORD_V1"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  fieldName = $FieldName
  vault = $Vault
  itemTitle = $ItemTitle
  secretValuesPrinted = "NO"
  secretValuesWrittenToRepo = "NO"
  tempSecretFilesWritten = "NO"
  decryptedValueRequested = "YES"
  decryptedValuePrinted = "NO"
  decryptedValueWrittenToRepo = "NO"
  matchingEnvCount = 0
  selectedEnvIdPresent = $false
  decryptedValuePresent = $false
  decryptedValueLength = 0
  decryptedValueShapeValid = $false
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

  . (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")
  $op = Get-WerklesOpBinary
  $previousToken = $env:OP_SERVICE_ACCOUNT_TOKEN
  $previousBiometric = $env:OP_BIOMETRIC_UNLOCK_ENABLED
  $storedToken = Get-WerklesOnePasswordServiceToken
  try {
    if ([string]::IsNullOrWhiteSpace($previousToken)) {
      if ([string]::IsNullOrWhiteSpace($storedToken)) {
        throw "Stored Werkles service-account token is missing."
      }
      $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken
    }
    $env:OP_BIOMETRIC_UNLOCK_ENABLED = "false"
    $item = & $op item get $ItemTitle --vault $Vault --format json --reveal | ConvertFrom-Json
    $urlField = @($item.fields | Where-Object { $_.label -eq "NEXT_PUBLIC_SUPABASE_URL" } | Select-Object -First 1)
    $supabaseUrl = [string]$urlField.value
  } finally {
    if ($null -eq $previousToken) {
      Remove-Item Env:\OP_SERVICE_ACCOUNT_TOKEN -ErrorAction SilentlyContinue
    } else {
      $env:OP_SERVICE_ACCOUNT_TOKEN = $previousToken
    }

    if ($null -eq $previousBiometric) {
      Remove-Item Env:\OP_BIOMETRIC_UNLOCK_ENABLED -ErrorAction SilentlyContinue
    } else {
      $env:OP_BIOMETRIC_UNLOCK_ENABLED = $previousBiometric
    }
  }

  if ($supabaseUrl -notmatch "^https://([a-z0-9-]+)\.supabase\.co/?$") {
    throw "Werkles Supabase URL is missing or invalid."
  }
  $projectRef = $Matches[1]
  $receipt.supabaseProjectRefPresent = $true

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
  $eligible = @($matches | Where-Object {
    $targets = @(Get-ArrayValue $_.target | ForEach-Object { [string]$_ })
    ($targets -contains "preview") -and ($targets -contains "production") -and [string]::IsNullOrWhiteSpace([string]$_.gitBranch)
  })
  $receipt.eligibleEnvCount = $eligible.Count

  if ($eligible.Count -ne 1) {
    throw "Expected exactly one Preview+Production non-branch env var for $FieldName; found $($eligible.Count)."
  }

  $selected = $eligible[0]
  $selectedId = [string]$selected.id
  if ([string]::IsNullOrWhiteSpace($selectedId)) {
    throw "Selected Vercel env var has no id."
  }
  $receipt.selectedEnvIdPresent = $true
  $receipt.selectedTargets = @(Get-ArrayValue $selected.target | ForEach-Object { [string]$_ })

  $decryptUri = "https://api.vercel.com/v1/projects/$projectId/env/$selectedId$query"
  $decrypted = Invoke-VercelApi -Method "GET" -Uri $decryptUri -Token $token
  $value = [string]$decrypted.value
  $receipt.decryptedResponseKey = [string]$decrypted.key
  $receipt.decryptedResponseType = [string]$decrypted.type
  $receipt.decryptedResponseFlag = [string]$decrypted.decrypted
  $receipt.decryptedValuePresent = -not [string]::IsNullOrWhiteSpace($value)
  $receipt.decryptedValueLength = $value.Length
  $receipt.decryptedValueShapeValid = Test-ClientKeyShape -Value $value -ExpectedProjectRef $projectRef

  if (-not $receipt.decryptedValuePresent) {
    throw "Vercel decrypted-env endpoint returned no value."
  }
  if (-not $receipt.decryptedValueShapeValid) {
    throw "Vercel decrypted-env value did not match the expected Supabase public client key shape."
  }

  Invoke-StdinSetter -Value $value
  $receipt.onePasswordSetterReceipt = "C:\\Users\\Ben Leak\\github\\Werkles\\foreman\\receipts\\WERKLES_COM_1PASSWORD_FIELD_SET_VERCEL_DECRYPTED_ENV_20260705.json"
  $receipt.status = "PASS_IMPORTED_DECRYPTED_ENV_FIELD_TO_1PASSWORD"
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

[pscustomobject]@{
  status = $receipt.status
  field_name = $receipt.fieldName
  matching_env_count = $receipt.matchingEnvCount
  eligible_env_count = $receipt.eligibleEnvCount
  selected_env_id_present = $receipt.selectedEnvIdPresent
  decrypted_value_present = $receipt.decryptedValuePresent
  decrypted_value_length = $receipt.decryptedValueLength
  decrypted_value_shape_valid = $receipt.decryptedValueShapeValid
  secret_values_printed = $receipt.secretValuesPrinted
  secret_values_written_to_repo = $receipt.secretValuesWrittenToRepo
  temp_secret_files_written = $receipt.tempSecretFilesWritten
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5

