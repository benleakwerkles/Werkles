#requires -Version 5.1
<#
  Matching shadow smoke — POST three discovery intakes to live or local site.
  Verifies shadow_run_id returned and operator shadow page loads.
#>
param(
  [string]$SiteOrigin = "https://werkles.com"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

$receiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_MATCHING_SHADOW_SMOKE_$(Get-Date -Format yyyyMMdd).json"
$innerScript = Join-Path $PSScriptRoot "test-matching-shadow-smoke.Inner.mjs"
$env:WERKLES_SITE_ORIGIN = $SiteOrigin

if (-not (Test-Path -LiteralPath $innerScript)) { throw "Missing: $innerScript" }

Write-Output "=== WERKLES MATCHING SHADOW SMOKE ==="
Write-Output "SITE_ORIGIN: $SiteOrigin"

$rawOut = & node $innerScript 2>&1
$text = ($rawOut | Out-String).Trim()
$json = $text | ConvertFrom-Json -ErrorAction SilentlyContinue

if (-not $json) {
  @{ ok = $false; parse_error = $true; raw = $text } | ConvertTo-Json -Depth 6 | Set-Content $receiptPath -Encoding UTF8
  Write-Output "OVERALL: FAIL (parse)"
  Write-Output $text
  exit 1
}

$json | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
Write-Output "OVERALL: $(if ($json.ok) { 'PASS' } else { 'FAIL' })"
Write-Output "RECEIPT: $receiptPath"
foreach ($c in $json.checks) {
  $mark = if ($c.pass) { "PASS" } else { "FAIL" }
  $label = if ($c.label) { $c.label } elseif ($c.detail) { $c.detail } else { "" }
  $scenario = if ($c.scenario) { $c.scenario } else { $c.name }
  $id = if ($c.shadow_run_id) { " shadow=$($c.shadow_run_id)" } else { "" }
  Write-Output "  [$mark] ${scenario}: ${label}${id}"
}
exit $(if ($json.ok) { 0 } else { 1 })
