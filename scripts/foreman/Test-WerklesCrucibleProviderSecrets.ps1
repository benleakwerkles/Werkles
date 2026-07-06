#requires -Version 5.1
<#
  Names-only validator for Plaid Crucible provider fields in 1Password.
#>
param(
  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_CRUCIBLE_PROVIDER_SECRETS_VALIDATION_20260705.json"
}

$OpExe = Get-WerklesOpBinary
$storedToken = Get-WerklesOnePasswordServiceToken
if ($storedToken) { $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken }

$fieldRules = [ordered]@{
  PLAID_CLIENT_ID = "^[A-Za-z0-9_-]{20,40}$"
  PLAID_SECRET = "^[A-Za-z0-9_-]{20,80}$"
  PLAID_ENV = "^(sandbox|development|production)$"
}

$receipt = [ordered]@{
  schema = "WERKLES_CRUCIBLE_PROVIDER_SECRETS_VALIDATION_V1"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  secretValuesPrinted = "NO"
  fields = @()
}

try {
  $item = & $OpExe item get $ItemTitle --vault $Vault --format json --reveal | ConvertFrom-Json

  foreach ($name in $fieldRules.Keys) {
    $matches = @($item.fields | Where-Object { $_.label -eq $name })
    $value = if ($matches.Count -eq 1) { [string]$matches[0].value } else { "" }
    $hasValue = -not [string]::IsNullOrWhiteSpace($value)
    $shapeValid = $matches.Count -eq 1 -and $hasValue -and ($value -match $fieldRules[$name])

    $receipt.fields += [ordered]@{
      name = $name
      fieldCount = $matches.Count
      hasValue = $hasValue
      shapeValid = $shapeValid
      emptyOrMissing = -not $hasValue
    }
  }

  $valid = @($receipt.fields | Where-Object { $_.shapeValid } | ForEach-Object { $_.name })
  $missing = @($receipt.fields | Where-Object { $_.emptyOrMissing -or -not $_.shapeValid } | ForEach-Object { $_.name })
  $receipt.validFields = $valid
  $receipt.missingFields = $missing
  $receipt.validFieldCount = $valid.Count
  $receipt.status = if ($missing.Count -eq 0) { "PASS_ALL_PLAID_FIELDS_VALID" } else { "BLOCKED_MISSING_PLAID_FIELDS" }
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  $receipt | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

@{
  status = $receipt.status
  valid_field_count = $receipt.validFieldCount
  missing_fields = $receipt.missingFields
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 4
