#requires -Version 5.1
<#
  Mechanical Crucible smoke mule — provider APIs + production verification routes.
  Test/sandbox only. No secrets printed.
#>
param(
  [string]$SiteOrigin = "https://werkles.com",
  [string]$WebhookUrl = "https://werkles.com/api/webhooks/stripe",
  [switch]$SkipProviderMule
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

$OpExe = Get-WerklesOpBinary
$storedToken = Get-WerklesOnePasswordServiceToken
if ($storedToken) { $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken }

$dateTag = Get-Date -Format yyyyMMdd
$receiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_CRUCIBLE_SMOKE_${dateTag}.json"
$tierARefs = Join-Path $RepoRoot "foreman\gates\werkles-vercel-tier-a.env.oprefs"
$plaidRefs = Join-Path $RepoRoot "foreman\gates\werkles-crucible-provider.env.oprefs"
$innerScript = Join-Path $PSScriptRoot "test-crucible-smoke.Inner.mjs"
$refsCombined = Join-Path $env:TEMP "werkles-crucible-smoke-combined.oprefs"

$steps = @()

function Add-Step($name, $status, $detail) {
  $script:steps += [ordered]@{
    step = $name
    status = $status
    detail = $detail
  }
}

Write-Output "=== CRUCIBLE SMOKE MULE ==="
Write-Output "SITE_ORIGIN: $SiteOrigin"

if (-not $SkipProviderMule) {
  Write-Output "STEP: provider_mule"
  $providerOut = powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Test-WerklesCrucibleProviderMule.ps1") -SkipVercelSync 2>&1
  $providerText = ($providerOut | Out-String).Trim()
  if ($providerText -match "OVERALL:\s+(PASS_OR_PARTIAL|NEEDS_OPERATOR)") {
    $providerOverall = $Matches[1]
    Add-Step "provider_mule" $(if ($providerOverall -eq "PASS_OR_PARTIAL") { "PASS" } else { "PARTIAL" }) $providerOverall
  } else {
    Add-Step "provider_mule" "EXECUTED" "see WERKLES_CRUCIBLE_PROVIDER_MULE receipt"
  }
}

if (-not (Test-Path -LiteralPath $tierARefs)) { throw "Missing op refs file: $tierARefs" }
if (-not (Test-Path -LiteralPath $plaidRefs)) { throw "Missing op refs file: $plaidRefs" }
if (-not (Test-Path -LiteralPath $innerScript)) { throw "Missing inner script: $innerScript" }

$tierA = Get-Content $tierARefs -Raw
$plaid = Get-Content $plaidRefs -Raw
[System.IO.File]::WriteAllText($refsCombined, ($tierA.TrimEnd() + "`n" + $plaid.TrimStart()), (New-Object System.Text.UTF8Encoding $false))

$env:WERKLES_SITE_ORIGIN = $SiteOrigin
$env:WERKLES_WEBHOOK_URL = $WebhookUrl

Write-Output "STEP: production_crucible_smoke"
$rawOut = & $OpExe run --env-file="$refsCombined" -- node $innerScript 2>&1
$text = ($rawOut | Out-String).Trim()
$json = $text | ConvertFrom-Json -ErrorAction SilentlyContinue

if (-not $json) {
  Add-Step "production_crucible_smoke" "FAIL" "parse_error"
  $overall = "FAIL"
} else {
  Add-Step "production_crucible_smoke" $(if ($json.ok) { "PASS" } else { "FAIL" }) ($json.checks | ForEach-Object { "$($_.name)=$($_.status)" }) -join ","
  $overall = if ($json.ok) { "PASS" } else { "FAIL" }
}

$receipt = [ordered]@{
  schema = "WERKLES_CRUCIBLE_SMOKE_MULE_V1"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  secret_values_printed = "NO"
  overall = $overall
  steps = $steps
  checks = if ($json) { $json.checks } else { @() }
}

$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receiptPath -Encoding UTF8

Write-Output "OVERALL: $overall"
Write-Output "RECEIPT: $receiptPath"
if ($json) {
  foreach ($check in $json.checks) {
    $suffix = if ($check.PSObject.Properties.Name -contains "error") { " - $($check.error)" }
      elseif ($check.PSObject.Properties.Name -contains "mode") { " - mode=$($check.mode)" }
      elseif ($check.PSObject.Properties.Name -contains "id_status") { " - id=$($check.id_status) funds=$($check.funds_status)" }
      else { "" }
    Write-Output ("  {0}: {1}{2}" -f $check.name, $check.status, $suffix)
  }
}

Remove-Item -LiteralPath $refsCombined -ErrorAction SilentlyContinue
if ($overall -ne "PASS") { exit 1 }
