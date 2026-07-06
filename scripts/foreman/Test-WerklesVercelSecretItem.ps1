#requires -Version 5.1
<#
.SYNOPSIS
  Names-only validator for the Werkles Vercel 1Password item.

.DESCRIPTION
  Verifies that each tier-A field exists, has a value when expected, and matches
  the required value shape. It can optionally clear dirty values: values that
  are present but do not match the expected shape. Values are never printed.
#>
param(
  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [switch]$ClearDirtyValues,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_VERCEL_SECRET_ITEM_VALIDATION_20260704.json"
}

$OpExe = Get-WerklesOpBinary
$previousToken = $env:OP_SERVICE_ACCOUNT_TOKEN
$previousBiometric = $env:OP_BIOMETRIC_UNLOCK_ENABLED

$storedToken = Get-WerklesOnePasswordServiceToken
if ([string]::IsNullOrWhiteSpace($previousToken) -and [string]::IsNullOrWhiteSpace($storedToken)) {
  throw "Stored Werkles service-account token is missing; refusing desktop 1Password CLI auth."
}

$env:OP_SERVICE_ACCOUNT_TOKEN = if ([string]::IsNullOrWhiteSpace($previousToken)) { $storedToken } else { $previousToken }
$env:OP_BIOMETRIC_UNLOCK_ENABLED = "false"

$fieldRules = [ordered]@{
  NEXT_PUBLIC_SUPABASE_URL = "^https://(?!your-project\.supabase\.co/?$)[a-z0-9-]+\.supabase\.co/?$"
  NEXT_PUBLIC_SUPABASE_ANON_KEY = "^(eyJ|sb_publishable_)"
  SUPABASE_SERVICE_ROLE_KEY = "^(eyJ|sb_secret_)"
  STRIPE_SECRET_KEY = "^(sk|rk)_(test|live)_"
  STRIPE_WEBHOOK_SECRET = "^whsec_"
  STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID = "^price_"
  STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID = "^price_"
  CRON_SECRET = ".{16,}"
}

$receipt = [ordered]@{
  schema = "WERKLES_COM_VERCEL_SECRET_ITEM_VALIDATION_V1"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  vault = $Vault
  itemTitle = $ItemTitle
  clearDirtyValues = $ClearDirtyValues.IsPresent
  secretValuesPrinted = "NO"
  secretValuesWrittenToRepo = "NO"
  desktopPromptTriggered = "NO"
  fields = @()
  dirtyFieldsCleared = @()
}

try {
  $item = & $OpExe item get $ItemTitle --vault $Vault --format json --reveal | ConvertFrom-Json
  $dirtyLabels = New-Object System.Collections.Generic.HashSet[string]

  foreach ($name in $fieldRules.Keys) {
    $matches = @($item.fields | Where-Object { $_.label -eq $name })
    $value = if ($matches.Count -eq 1) { [string]$matches[0].value } else { "" }
    $hasValue = -not [string]::IsNullOrWhiteSpace($value)
    $shapeValid = $matches.Count -eq 1 -and $hasValue -and ($value -match $fieldRules[$name])
    $dirty = $matches.Count -eq 1 -and $hasValue -and -not $shapeValid

    if ($dirty) {
      [void]$dirtyLabels.Add($name)
    }

    $receipt.fields += [ordered]@{
      name = $name
      fieldCount = $matches.Count
      hasValue = $hasValue
      valueLength = $value.Length
      shapeValid = $shapeValid
      dirty = $dirty
      emptyOrMissing = -not $hasValue
    }
  }

  if ($ClearDirtyValues -and $dirtyLabels.Count -gt 0) {
    foreach ($field in @($item.fields)) {
      if ($dirtyLabels.Contains([string]$field.label)) {
        $field.value = ""
        $receipt.dirtyFieldsCleared += [string]$field.label
      }
    }

    $null = ($item | ConvertTo-Json -Depth 12) | & $OpExe item edit $item.id --vault $Vault --format json 2>$null
    if ($LASTEXITCODE -ne 0) {
      throw "op item edit failed while clearing dirty values."
    }
  }

  $receipt.validFields = @($receipt.fields | Where-Object { $_.shapeValid } | ForEach-Object { $_.name })
  $receipt.dirtyFields = @($receipt.fields | Where-Object { $_.dirty } | ForEach-Object { $_.name })
  $receipt.emptyOrMissingFields = @($receipt.fields | Where-Object { $_.emptyOrMissing } | ForEach-Object { $_.name })
  $receipt.validFieldCount = $receipt.validFields.Count
  $receipt.dirtyFieldCount = $receipt.dirtyFields.Count
  $receipt.emptyOrMissingFieldCount = $receipt.emptyOrMissingFields.Count

  if ($receipt.dirtyFieldCount -gt 0) {
    $receipt.status = if ($ClearDirtyValues) { "PASS_DIRTY_VALUES_CLEARED" } else { "DIRTY_VALUES_PRESENT" }
  } elseif ($receipt.emptyOrMissingFieldCount -gt 0) {
    $receipt.status = "PARTIAL_VALID_WITH_MISSING_FIELDS"
  } else {
    $receipt.status = "PASS_ALL_FIELDS_VALID"
  }
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
  valid_field_count = $receipt.validFieldCount
  dirty_field_count = $receipt.dirtyFieldCount
  empty_or_missing_field_count = $receipt.emptyOrMissingFieldCount
  valid_fields = $receipt.validFields
  dirty_fields = $receipt.dirtyFields
  empty_or_missing_fields = $receipt.emptyOrMissingFields
  dirty_fields_cleared = $receipt.dirtyFieldsCleared
  secret_values_printed = $receipt.secretValuesPrinted
  secret_values_written_to_repo = $receipt.secretValuesWrittenToRepo
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5
