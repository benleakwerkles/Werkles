#requires -Version 5.1
<#
.SYNOPSIS
  Import the Werkles Supabase public client key using Chrome dashboard session state.

.DESCRIPTION
  Reads Supabase dashboard bearer-token candidates from Chrome local storage in
  memory, calls Supabase Management API key endpoints, validates public client
  key candidates against the Werkles Supabase project, and stores exactly one
  validated candidate in 1Password through the stored Werkles service account.

  Secret/session/key values are never printed and never written to the repo.
#>
param(
  [string[]]$ChromeProfiles = @("Default", "Profile 1"),
  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_SUPABASE_DASHBOARD_API_KEY_IMPORT_20260705.json"
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

function Get-CurrentSupabaseUrl {
  param(
    [string]$VaultName,
    [string]$Title
  )

  $op = Get-WerklesOpBinary
  $item = & $op item get $Title --vault $VaultName --format json --reveal | ConvertFrom-Json
  $field = @($item.fields | Where-Object { $_.label -eq "NEXT_PUBLIC_SUPABASE_URL" })
  if ($field.Count -ne 1 -or [string]::IsNullOrWhiteSpace([string]$field[0].value)) {
    throw "NEXT_PUBLIC_SUPABASE_URL is missing from 1Password."
  }

  return ([string]$field[0].value).TrimEnd("/")
}

function Get-SupabaseRefFromUrl {
  param([string]$Url)

  if ($Url -match "^https://([a-z0-9-]+)\.supabase\.co/?$") {
    return $Matches[1]
  }

  return $null
}

function Get-ChromeLocalStorageText {
  param([string[]]$Profiles)

  $chromeRoot = Join-Path $env:LOCALAPPDATA "Google\Chrome\User Data"
  foreach ($profileName in $Profiles) {
    $levelDb = Join-Path $chromeRoot "$profileName\Local Storage\leveldb"
    if (-not (Test-Path -LiteralPath $levelDb)) {
      continue
    }

    foreach ($file in Get-ChildItem -LiteralPath $levelDb -File -ErrorAction SilentlyContinue) {
      if ($file.Length -gt 20MB) {
        continue
      }

      try {
        [Text.Encoding]::UTF8.GetString([IO.File]::ReadAllBytes($file.FullName))
      } catch {
      }
    }
  }
}

function Get-BearerTokenCandidates {
  param([string[]]$Profiles)

  $tokens = New-Object System.Collections.Generic.HashSet[string]
  foreach ($text in (Get-ChromeLocalStorageText -Profiles $Profiles)) {
    foreach ($match in [regex]::Matches($text, "eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}")) {
      $token = [string]$match.Value
      $payload = Get-JwtPayload -Token $token
      if ($null -eq $payload) {
        continue
      }

      [void]$tokens.Add($token)
    }
  }

  return @($tokens)
}

function Invoke-SupabaseManagementApi {
  param(
    [string]$Uri,
    [string]$BearerToken
  )

  try {
    $headers = @{
      Authorization = "Bearer $BearerToken"
      Accept = "application/json"
    }
    return [pscustomobject]@{
      ok = $true
      statusCode = 200
      body = (Invoke-RestMethod -Method Get -Uri $Uri -Headers $headers -TimeoutSec 20)
    }
  } catch {
    $statusCode = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }

    return [pscustomobject]@{
      ok = $false
      statusCode = $statusCode
      body = $null
    }
  }
}

function Get-StringValuesRecursive {
  param($Value)

  if ($null -eq $Value) {
    return
  }

  if ($Value -is [string]) {
    $Value
    return
  }

  if ($Value -is [System.Collections.IDictionary]) {
    foreach ($key in $Value.Keys) {
      Get-StringValuesRecursive -Value $Value[$key]
    }
    return
  }

  if ($Value -is [System.Collections.IEnumerable] -and -not ($Value -is [string])) {
    foreach ($item in $Value) {
      Get-StringValuesRecursive -Value $item
    }
    return
  }

  foreach ($property in $Value.PSObject.Properties) {
    Get-StringValuesRecursive -Value $property.Value
  }
}

function Get-ClientKeyCandidatesFromBody {
  param($Body)

  $values = Get-StringValuesRecursive -Value $Body
  $candidates = New-Object System.Collections.Generic.HashSet[string]
  foreach ($value in $values) {
    foreach ($match in [regex]::Matches([string]$value, "sb_publishable_[A-Za-z0-9_-]+")) {
      [void]$candidates.Add([string]$match.Value)
    }
    foreach ($match in [regex]::Matches([string]$value, "eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}")) {
      [void]$candidates.Add([string]$match.Value)
    }
  }

  return @($candidates)
}

function Test-SupabaseClientKeyForProject {
  param(
    [string]$Url,
    [string]$Value
  )

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Method Get -Uri "$Url/auth/v1/settings" -Headers @{ apikey = $Value } -TimeoutSec 15
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
  } catch {
    return $false
  }
}

function Test-ClientCandidate {
  param(
    [string]$Value,
    [string]$SupabaseUrl,
    [string]$ExpectedRef
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $false
  }

  if ($Value -match "^sb_publishable_[A-Za-z0-9_-]+$") {
    return (Test-SupabaseClientKeyForProject -Url $SupabaseUrl -Value $Value)
  }

  if ($Value -notmatch "^eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$") {
    return $false
  }

  $payload = Get-JwtPayload -Token $Value
  if ($null -eq $payload) {
    return $false
  }

  return ([string]$payload.role -eq "anon" -and [string]$payload.ref -eq $ExpectedRef)
}

function Invoke-StdinSetter {
  param([string]$Value)

  $setter = Join-Path $PSScriptRoot "Set-1PasswordFieldFromStdin.ps1"
  $receipt = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_1PASSWORD_FIELD_SET_SUPABASE_DASHBOARD_API_20260705.json"
  $output = $Value | powershell -NoProfile -ExecutionPolicy Bypass -File $setter -FieldName "NEXT_PUBLIC_SUPABASE_ANON_KEY" -Vault $Vault -ItemTitle $ItemTitle -SourceLabel "SupabaseDashboardApi" -ReceiptPath $receipt
  $result = $output | ConvertFrom-Json
  if ($result.status -ne "PASS" -or -not $result.verified_field_has_value) {
    throw "1Password setter did not verify the imported field."
  }

  return $result
}

$previousToken = $env:OP_SERVICE_ACCOUNT_TOKEN
$previousBiometric = $env:OP_BIOMETRIC_UNLOCK_ENABLED

$receipt = [ordered]@{
  schema = "WERKLES_COM_SUPABASE_DASHBOARD_API_KEY_IMPORT_V1"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  chromeProfiles = $ChromeProfiles
  vault = $Vault
  itemTitle = $ItemTitle
  secretValuesPrinted = "NO"
  secretValuesWrittenToRepo = "NO"
  chromeSessionValuesWrittenToRepo = "NO"
  desktopOnePasswordPromptTriggered = "NO"
  bearerTokenCandidateCount = 0
  endpointAttempts = @()
  keyCandidateCount = 0
  validCandidateCount = 0
  fieldUpdated = "NO"
}

try {
  $storedToken = Get-WerklesOnePasswordServiceToken
  if ([string]::IsNullOrWhiteSpace($storedToken) -and [string]::IsNullOrWhiteSpace($previousToken)) {
    throw "Stored Werkles service-account token is missing; refusing desktop 1Password CLI auth."
  }

  $env:OP_SERVICE_ACCOUNT_TOKEN = if ([string]::IsNullOrWhiteSpace($previousToken)) { $storedToken } else { $previousToken }
  $env:OP_BIOMETRIC_UNLOCK_ENABLED = "false"

  $supabaseUrl = Get-CurrentSupabaseUrl -VaultName $Vault -Title $ItemTitle
  $expectedRef = Get-SupabaseRefFromUrl -Url $supabaseUrl
  if ([string]::IsNullOrWhiteSpace($expectedRef)) {
    throw "Could not derive Supabase project ref from URL."
  }
  $receipt.projectRef = $expectedRef

  $bearerTokens = @(Get-BearerTokenCandidates -Profiles $ChromeProfiles | Select-Object -Unique)
  $receipt.bearerTokenCandidateCount = $bearerTokens.Count
  if ($bearerTokens.Count -lt 1) {
    throw "No Supabase dashboard bearer-token candidates found in Chrome storage."
  }

  $endpoints = @(
    "https://api.supabase.com/v1/projects/$expectedRef/api-keys",
    "https://api.supabase.com/v1/projects/$expectedRef/api-keys/legacy"
  )

  $keyCandidates = New-Object System.Collections.Generic.HashSet[string]
  foreach ($endpoint in $endpoints) {
    foreach ($token in $bearerTokens) {
      $response = Invoke-SupabaseManagementApi -Uri $endpoint -BearerToken $token
      $receipt.endpointAttempts += [ordered]@{
        endpoint = ($endpoint -replace [regex]::Escape($expectedRef), "{projectRef}")
        ok = $response.ok
        statusCode = $response.statusCode
      }

      if (-not $response.ok) {
        continue
      }

      foreach ($candidate in Get-ClientKeyCandidatesFromBody -Body $response.body) {
        [void]$keyCandidates.Add($candidate)
      }
    }
  }

  $candidates = @($keyCandidates | Select-Object -Unique)
  $receipt.keyCandidateCount = $candidates.Count
  $receipt.publishableCandidateCount = @($candidates | Where-Object { $_ -like "sb_publishable_*" }).Count
  $receipt.jwtCandidateCount = @($candidates | Where-Object { $_ -like "eyJ*" }).Count

  $validCandidates = @($candidates | Where-Object { Test-ClientCandidate -Value $_ -SupabaseUrl $supabaseUrl -ExpectedRef $expectedRef } | Select-Object -Unique)
  $receipt.validCandidateCount = $validCandidates.Count

  if ($validCandidates.Count -ne 1) {
    throw "Expected exactly one valid Supabase public client key candidate; found $($validCandidates.Count)."
  }

  $setterResult = Invoke-StdinSetter -Value $validCandidates[0]
  $receipt.fieldUpdated = "YES"
  $receipt.setterStatus = $setterResult.status
  $receipt.setterVerifiedFieldHasValue = $setterResult.verified_field_has_value

  $validation = powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Test-WerklesVercelSecretItem.ps1") -Vault $Vault -ItemTitle $ItemTitle | ConvertFrom-Json
  $receipt.validationStatus = $validation.status
  $receipt.validFieldCount = $validation.valid_field_count
  $receipt.emptyOrMissingFieldCount = $validation.empty_or_missing_field_count
  $receipt.dirtyFieldCount = $validation.dirty_field_count

  $receipt.status = if ($validation.status -eq "PASS_ALL_FIELDS_VALID" -and $validation.valid_field_count -eq 8) { "PASS" } else { "BLOCKED_OR_FAILED" }
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
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

  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

[pscustomobject]@{
  status = $receipt.status
  bearer_token_candidate_count = $receipt.bearerTokenCandidateCount
  key_candidate_count = $receipt.keyCandidateCount
  valid_candidate_count = $receipt.validCandidateCount
  field_updated = $receipt.fieldUpdated
  validation_status = $receipt.validationStatus
  valid_field_count = $receipt.validFieldCount
  secret_values_printed = $receipt.secretValuesPrinted
  secret_values_written_to_repo = $receipt.secretValuesWrittenToRepo
  desktop_1password_prompt_triggered = $receipt.desktopOnePasswordPromptTriggered
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 4
