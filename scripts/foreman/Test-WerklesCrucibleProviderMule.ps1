#requires -Version 5.1
<#
  Mechanical Crucible provider mule: Plaid fields, Stripe webhooks, API smoke, Vercel sync.
  Names-only output. No secrets printed.
#>
param(
  [switch]$SkipVercelSync
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

$OpExe = Get-WerklesOpBinary
$storedToken = Get-WerklesOnePasswordServiceToken
if ($storedToken) { $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken }

$receiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_CRUCIBLE_PROVIDER_MULE_20260705.json"
$receipt = [ordered]@{
  schema = "WERKLES_CRUCIBLE_PROVIDER_MULE_V1"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
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

Write-Output "=== CRUCIBLE PROVIDER MULE ==="

Write-Output "STEP: ensure_plaid_fields"
$ensure = powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Ensure-1PasswordCrucibleProviderFields.ps1") | ConvertFrom-Json
Add-Step "ensure_plaid_fields" $ensure.status ($ensure.fields_added -join ",")

Write-Output "STEP: validate_plaid_secrets"
$validate = powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Test-WerklesCrucibleProviderSecrets.ps1") | ConvertFrom-Json
Add-Step "validate_plaid_secrets" $validate.status ($validate.missing_fields -join ",")

Write-Output "STEP: stripe_webhook_identity_events"
$tierARefs = Join-Path $RepoRoot "foreman\gates\werkles-vercel-tier-a.env.oprefs"
$webhookScript = Join-Path $PSScriptRoot "Update-StripeTestWebhookCrucibleEvents.Inner.ps1"
if (-not (Test-Path -LiteralPath $tierARefs)) { throw "Missing op refs file: $tierARefs" }
$webhookOut = & $OpExe run --env-file="$tierARefs" -- powershell -NoProfile -ExecutionPolicy Bypass -File $webhookScript 2>&1
$webhookJson = ($webhookOut | Out-String).Trim() | ConvertFrom-Json -ErrorAction SilentlyContinue
if ($webhookJson -and $webhookJson.ok) {
  Add-Step "stripe_webhook_identity_events" "PASS" "event_count=$($webhookJson.enabled_event_count)"
} else {
  Add-Step "stripe_webhook_identity_events" "FAIL" (($webhookOut | Out-String).Trim())
}

$refsCombined = Join-Path $env:TEMP "werkles-crucible-mule-combined.oprefs"
$tierA = Get-Content (Join-Path $RepoRoot "foreman\gates\werkles-vercel-tier-a.env.oprefs") -Raw
$plaidRefs = Get-Content (Join-Path $RepoRoot "foreman\gates\werkles-crucible-provider.env.oprefs") -Raw
$combinedText = ($tierA.TrimEnd() + "`n" + $plaidRefs.TrimStart())
[System.IO.File]::WriteAllText($refsCombined, $combinedText, (New-Object System.Text.UTF8Encoding $false))

Write-Output "STEP: provider_api_smoke"
$smokeScript = Join-Path $PSScriptRoot "test-crucible-providers.Inner.ps1"
$smokeOut = & $OpExe run --env-file="$refsCombined" -- powershell -NoProfile -ExecutionPolicy Bypass -File $smokeScript 2>&1
$smokeJson = ($smokeOut | Out-String).Trim() | ConvertFrom-Json -ErrorAction SilentlyContinue
if ($smokeJson -and $smokeJson.ok) {
  Add-Step "provider_api_smoke" "PASS" (($smokeJson.checks | ForEach-Object { $_.name }) -join ",")
} else {
  $failed = if ($smokeJson) { ($smokeJson.checks | Where-Object { $_.status -eq "FAIL" } | ForEach-Object { $_.name }) -join "," } else { "parse_failed" }
  Add-Step "provider_api_smoke" "PARTIAL_OR_FAIL" $failed
}

if (-not $SkipVercelSync -and $validate.status -eq "PASS_ALL_PLAID_FIELDS_VALID") {
  Write-Output "STEP: vercel_sync_plaid"
  $syncOut = powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Sync-WerklesCrucibleProviderEnvFrom1Password.ps1") -Target Both 2>&1
  Add-Step "vercel_sync_plaid" "EXECUTED" (($syncOut | Out-String).Trim() -replace "`r?`n", " | ")
} else {
  Add-Step "vercel_sync_plaid" "SKIPPED" "plaid_secrets_not_valid"
}

$receipt.overall = if (($receipt.steps | Where-Object { $_.status -match "FAIL" }).Count -eq 0) { "PASS_OR_PARTIAL" } else { "NEEDS_OPERATOR" }
$receipt | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $receiptPath -Encoding UTF8

Write-Output "RECEIPT: $receiptPath"
Write-Output "OVERALL: $($receipt.overall)"
$receipt.steps | ForEach-Object { Write-Output ("  {0}: {1}" -f $_.step, $_.status) }

Remove-Item -LiteralPath $refsCombined -ErrorAction SilentlyContinue
