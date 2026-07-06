#requires -Version 5.1
<#
.SYNOPSIS
  Store one approved Werkles secret field from the Windows clipboard.

.DESCRIPTION
  Reads the clipboard only inside this process, validates the expected value
  shape, pipes the value to Set-1PasswordFieldFromStdin.ps1, and clears the
  clipboard afterward. Secret values are never printed or written to the repo.
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID",
    "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID",
    "CRON_SECRET",
    "PLAID_CLIENT_ID",
    "PLAID_SECRET",
    "PLAID_ENV"
  )]
  [string]$FieldName,

  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$SourceLabel = "clipboard",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_1PASSWORD_CLIPBOARD_FIELD_SET_20260704.json"
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

function Get-JwtRole {
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
    $payload = $payloadJson | ConvertFrom-Json
    return [string]$payload.role
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
    return $null
  }

  return ([string]$field[0].value).TrimEnd("/")
}

function Test-SupabaseClientKeyForProject {
  param(
    [string]$Url,
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Url)) {
    return [pscustomobject]@{
      attempted = $false
      passed = $false
      statusCode = $null
      reason = "Missing NEXT_PUBLIC_SUPABASE_URL in 1Password."
    }
  }

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Method Get -Uri "$Url/rest/v1/" -Headers @{ apikey = $Value } -TimeoutSec 15
    return [pscustomobject]@{
      attempted = $true
      passed = ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
      statusCode = $response.StatusCode
      reason = $null
    }
  } catch {
    $statusCode = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }

    return [pscustomobject]@{
      attempted = $true
      passed = $false
      statusCode = $statusCode
      reason = "Supabase project validation failed."
    }
  }
}

function Test-FieldShape {
  param(
    [string]$Name,
    [string]$Value
  )

  switch ($Name) {
    "NEXT_PUBLIC_SUPABASE_URL" {
      return $Value -match "^https://[a-z0-9-]+\.supabase\.co/?$"
    }
    "NEXT_PUBLIC_SUPABASE_ANON_KEY" {
      return ($Value -match "^sb_publishable_") -or (($Value -match "^eyJ") -and ((Get-JwtRole -Token $Value) -eq "anon"))
    }
    "SUPABASE_SERVICE_ROLE_KEY" {
      return ($Value -match "^sb_secret_") -or (($Value -match "^eyJ") -and ((Get-JwtRole -Token $Value) -eq "service_role"))
    }
    "STRIPE_SECRET_KEY" {
      return $Value -match "^(sk|rk)_(test|live)_"
    }
    "STRIPE_WEBHOOK_SECRET" {
      return $Value -match "^whsec_"
    }
    "STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID" {
      return $Value -match "^price_"
    }
    "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID" {
      return $Value -match "^price_"
    }
    "CRON_SECRET" {
      return $Value.Length -ge 16
    }
    "PLAID_CLIENT_ID" {
      return $Value -match '^[A-Za-z0-9_-]{20,40}$'
    }
    "PLAID_SECRET" {
      return $Value -match '^[A-Za-z0-9_-]{20,80}$'
    }
    "PLAID_ENV" {
      return $Value -match "^(sandbox|development|production)$"
    }
    default {
      return $false
    }
  }
}

$receipt = [ordered]@{
  schema = "WERKLES_COM_1PASSWORD_CLIPBOARD_FIELD_SET_V1"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  fieldName = $FieldName
  vault = $Vault
  itemTitle = $ItemTitle
  source = $SourceLabel
  secretValuePrinted = "NO"
  secretValueWrittenToRepo = "NO"
  clipboardCleared = "NO"
}

$previousToken = $env:OP_SERVICE_ACCOUNT_TOKEN
$previousBiometric = $env:OP_BIOMETRIC_UNLOCK_ENABLED

try {
  $storedToken = Get-WerklesOnePasswordServiceToken
  if ([string]::IsNullOrWhiteSpace($storedToken) -and [string]::IsNullOrWhiteSpace($previousToken)) {
    throw "Stored Werkles service-account token is missing; refusing desktop 1Password CLI auth."
  }

  $env:OP_SERVICE_ACCOUNT_TOKEN = if ([string]::IsNullOrWhiteSpace($previousToken)) { $storedToken } else { $previousToken }
  $env:OP_BIOMETRIC_UNLOCK_ENABLED = "false"

  $value = ((Get-Clipboard -Format Text) -join "`n").Trim()
  $receipt.valuePresent = -not [string]::IsNullOrWhiteSpace($value)
  $receipt.valueLength = $value.Length
  $receipt.shapeValid = Test-FieldShape -Name $FieldName -Value $value
  $receipt.projectValidationAttempted = "NO"
  $receipt.projectValidationPassed = $null
  $receipt.projectValidationStatusCode = $null

  if (-not $receipt.valuePresent) {
    throw "Clipboard value was empty."
  }

  if (-not $receipt.shapeValid) {
    throw "Clipboard value failed shape validation for $FieldName."
  }

  if ($FieldName -eq "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
    $supabaseUrl = Get-CurrentSupabaseUrl -VaultName $Vault -Title $ItemTitle
    $projectCheck = Test-SupabaseClientKeyForProject -Url $supabaseUrl -Value $value
    $receipt.projectValidationAttempted = if ($projectCheck.attempted) { "YES" } else { "NO" }
    $receipt.projectValidationPassed = $projectCheck.passed
    $receipt.projectValidationStatusCode = $projectCheck.statusCode

    if (-not $projectCheck.passed) {
      throw $projectCheck.reason
    }
  }

  $setOutput = $value | powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Set-1PasswordFieldFromStdin.ps1") -FieldName $FieldName -Vault $Vault -ItemTitle $ItemTitle -SourceLabel $SourceLabel
  $setResult = $setOutput | ConvertFrom-Json
  $receipt.innerStatus = $setResult.status
  $receipt.verifiedFieldHasValue = $setResult.verified_field_has_value
  $receipt.status = if ($setResult.status -eq "PASS" -and $setResult.verified_field_has_value) { "PASS" } else { "BLOCKED_OR_FAILED" }
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  try {
    Set-Clipboard -Value " "
    $receipt.clipboardCleared = "YES"
  } catch {
    $receipt.clipboardCleared = "FAILED"
  }

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
  field_name = $receipt.fieldName
  value_length = $receipt.valueLength
  shape_valid = $receipt.shapeValid
  verified_field_has_value = $receipt.verifiedFieldHasValue
  secret_value_printed = $receipt.secretValuePrinted
  secret_value_written_to_repo = $receipt.secretValueWrittenToRepo
  clipboard_cleared = $receipt.clipboardCleared
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 4
