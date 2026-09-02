#requires -Version 5.1
<#
  Mechanical Stripe test checkout + webhook smoke. Test mode only. No secrets printed.
#>
param(
  [string]$WebhookUrl = "https://werkles.com/api/webhooks/stripe",
  [string]$SiteOrigin = "https://werkles.com"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

$OpExe = Get-WerklesOpBinary
$storedToken = Get-WerklesOnePasswordServiceToken
if ($storedToken) { $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken }

$receiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_STRIPE_CHECKOUT_SMOKE_$(Get-Date -Format yyyyMMdd).json"
$tierARefs = Join-Path $RepoRoot "foreman\gates\werkles-vercel-tier-a.env.oprefs"
$innerScript = Join-Path $PSScriptRoot "test-stripe-checkout-smoke.Inner.mjs"

if (-not (Test-Path -LiteralPath $tierARefs)) { throw "Missing op refs file: $tierARefs" }
if (-not (Test-Path -LiteralPath $innerScript)) { throw "Missing inner script: $innerScript" }

$env:WERKLES_WEBHOOK_URL = $WebhookUrl
$env:WERKLES_SITE_ORIGIN = $SiteOrigin

Write-Output "=== STRIPE CHECKOUT SMOKE MULE ==="
Write-Output "WEBHOOK_URL: $WebhookUrl"
Write-Output "SITE_ORIGIN: $SiteOrigin"

$rawOut = & $OpExe run --env-file="$tierARefs" -- node $innerScript 2>&1
$text = ($rawOut | Out-String).Trim()
$json = $text | ConvertFrom-Json -ErrorAction SilentlyContinue

if (-not $json) {
  $fallback = [ordered]@{
    ok = $false
    schema = "WERKLES_STRIPE_CHECKOUT_SMOKE_V1"
    timestamp = (Get-Date).ToString("o")
    machine = $env:COMPUTERNAME
    secret_values_printed = "NO"
    parse_error = $true
    raw_output = $text
  }
  $fallback | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
  Write-Output "OVERALL: FAIL (parse)"
  Write-Output "RECEIPT: $receiptPath"
  Write-Output $text
  exit 1
}

$receipt = [ordered]@{
  schema = $json.schema
  timestamp = $json.timestamp
  machine = $env:COMPUTERNAME
  secret_values_printed = "NO"
  ok = [bool]$json.ok
  checks = $json.checks
  overall = if ($json.ok) { "PASS" } else { "FAIL" }
}

$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receiptPath -Encoding UTF8

Write-Output "OVERALL: $($receipt.overall)"
Write-Output "RECEIPT: $receiptPath"
foreach ($check in $json.checks) {
  $suffix = ""
  if ($check.PSObject.Properties.Name -contains "error") {
    $suffix = " - $($check.error)"
  } elseif ($check.PSObject.Properties.Name -contains "subscription_status") {
    $suffix = " - tier=$($check.membership_tier) status=$($check.subscription_status)"
  }
  Write-Output ("  {0}: {1}{2}" -f $check.name, $check.status, $suffix)
}

if (-not $json.ok) { exit 1 }
