#requires -Version 5.1
<#
  Signup smoke: homepage beta API + /signup page + Supabase signUp probe.
  No secrets printed.
#>
param(
  [string]$SiteOrigin = "https://werkles.com"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

$OpExe = Get-WerklesOpBinary
$storedToken = Get-WerklesOnePasswordServiceToken
if ($storedToken) { $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken }

$receiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_SIGNUP_SMOKE_$(Get-Date -Format yyyyMMdd).json"
$tierARefs = Join-Path $RepoRoot "foreman\gates\werkles-vercel-tier-a.env.oprefs"
$innerScript = Join-Path $PSScriptRoot "test-signup-smoke.Inner.mjs"

if (-not (Test-Path -LiteralPath $innerScript)) { throw "Missing inner script: $innerScript" }

$env:WERKLES_SITE_ORIGIN = $SiteOrigin

Write-Output "=== WERKLES SIGNUP SMOKE ==="
Write-Output "SITE_ORIGIN: $SiteOrigin"

if (Test-Path -LiteralPath $tierARefs) {
  $rawOut = & $OpExe run --env-file="$tierARefs" -- node $innerScript 2>&1
} else {
  Write-Output "WARN: tier-a oprefs missing - running beta/page probes only"
  $rawOut = & node $innerScript 2>&1
}

$text = ($rawOut | Out-String).Trim()
$json = $text | ConvertFrom-Json -ErrorAction SilentlyContinue

if (-not $json) {
  $fallback = [ordered]@{
    ok = $false
    schema = "WERKLES_SIGNUP_SMOKE_V1"
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
  site_origin = $json.site_origin
  test_email = $json.test_email
  checks = $json.checks
  notes = $json.notes
}
$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receiptPath -Encoding UTF8

Write-Output "OVERALL: $(if ($json.ok) { 'PASS' } else { 'FAIL' })"
Write-Output "RECEIPT: $receiptPath"
foreach ($c in $json.checks) {
  $mark = if ($c.pass) { "PASS" } else { "FAIL" }
  Write-Output "  [$mark] $($c.name): $($c.detail)"
}
if ($json.notes) {
  foreach ($n in $json.notes) { Write-Output "NOTE: $n" }
}
exit $(if ($json.ok) { 0 } else { 1 })
