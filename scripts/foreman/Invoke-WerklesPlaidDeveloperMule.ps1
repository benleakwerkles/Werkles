#requires -Version 5.1
<#
  Full Plaid developer mule for Werkles Crucible:
  1. Open signup/keys (Ben: password only if prompted)
  2. Poll Chrome/UI import until sandbox keys land in 1Password
  3. Validate, sync Vercel, run Crucible provider mule
#>
param(
  [int]$PollSeconds = 15,
  [int]$MaxAttempts = 40
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

$signupUrl = "https://dashboard.plaid.com/signup"
$keysUrl = "https://dashboard.plaid.com/developers/keys"
$importScript = Join-Path $PSScriptRoot "Import-PlaidSandboxKeysFromChromeTo1Password.ps1"
$muleScript = Join-Path $PSScriptRoot "Test-WerklesCrucibleProviderMule.ps1"
$receiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_PLAID_DEVELOPER_MULE_20260705.json"

$receipt = [ordered]@{
  schema = "WERKLES_PLAID_DEVELOPER_MULE_V1"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  operator_email = "ben.leak@kindsir.com"
  company = "Werkles, Inc"
  country = "US"
  secret_values_printed = "NO"
  steps = @()
}

function Add-Step($name, $status, $detail) {
  $receipt.steps += [ordered]@{
    step = $name
    status = $status
    detail = $detail
  }
}

Write-Output "=== WERKLES PLAID DEVELOPER MULE ==="
Write-Output "OPERATOR: Ben Leak | ben.leak@kindsir.com | Werkles, Inc | US"
Write-Output "BEN_HANDS: If Plaid signup/login appears, use ben.leak@kindsir.com and set your password. 1Password may prompt - approve it."
Write-Output "OPEN: signup + keys pages"

Start-Process $signupUrl | Out-Null
Start-Sleep -Seconds 1
Start-Process $keysUrl | Out-Null
Add-Step "open_plaid_dashboard" "EXECUTED" "signup_and_keys"

$importStatus = "PENDING"
for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
  Write-Output "POLL: attempt $attempt/$MaxAttempts (import from Chrome/UI)"
  try {
    $out = powershell -NoProfile -ExecutionPolicy Bypass -File $importScript 2>&1 | Out-String
    $json = $out.Trim() | ConvertFrom-Json -ErrorAction SilentlyContinue
    if ($json -and $json.status -eq "PASS") {
      $importStatus = "PASS"
      Add-Step "import_plaid_keys" "PASS" ("fields=" + ($json.fields_updated -join ","))
      break
    }
    $detail = if ($json) { $json.status } else { "parse_failed" }
    Write-Output "  import_status: $detail"
  } catch {
    Write-Output "  import_error: $($_.Exception.Message)"
  }

  if ($attempt -lt $MaxAttempts) {
    Start-Sleep -Seconds $PollSeconds
  }
}

if ($importStatus -ne "PASS") {
  Add-Step "import_plaid_keys" "BLOCKED" "no_valid_pair_after_polling"
  $receipt.overall = "NEEDS_OPERATOR_AT_PLAID_KEYS"
  $receipt | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
  Write-Output "RECEIPT: $receiptPath"
  Write-Output "OVERALL: NEEDS_OPERATOR_AT_PLAID_KEYS"
  Write-Output "BEN: finish signup/login, open Developers > Keys (sandbox secret visible), leave Chrome on that tab - mule will pick up on re-run."
  exit 1
}

Write-Output "STEP: validate_plaid_secrets"
$validate = powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Test-WerklesCrucibleProviderSecrets.ps1") | ConvertFrom-Json
Add-Step "validate_plaid_secrets" $validate.status ($validate.missing_fields -join ",")

Write-Output "STEP: vercel_sync_plaid"
$syncOut = powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Sync-WerklesCrucibleProviderEnvFrom1Password.ps1") -Target Both 2>&1
Add-Step "vercel_sync_plaid" "EXECUTED" (($syncOut | Out-String).Trim() -replace "`r?`n", " | ")

Write-Output "STEP: crucible_provider_mule"
$muleOut = powershell -NoProfile -ExecutionPolicy Bypass -File $muleScript 2>&1 | Out-String
Add-Step "crucible_provider_mule" "EXECUTED" ($muleOut -replace "`r?`n", " | ")

$receipt.overall = "PASS_OR_PARTIAL"
$receipt | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
Write-Output "RECEIPT: $receiptPath"
Write-Output "OVERALL: PASS_OR_PARTIAL"
