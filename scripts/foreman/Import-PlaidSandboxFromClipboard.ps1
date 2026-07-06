#requires -Version 5.1
<#
  Import Plaid sandbox credentials from clipboard into 1Password (two paste steps).
  Names-only output. No secrets printed.
#>
param(
  [ValidateSet("client_id", "secret", "both")]
  [string]$Step = "both"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

$steps = switch ($Step) {
  "client_id" { @("PLAID_CLIENT_ID") }
  "secret" { @("PLAID_SECRET") }
  default { @("PLAID_CLIENT_ID", "PLAID_SECRET") }
}

$results = @()
foreach ($field in $steps) {
  Write-Output "PASTE_STEP: copy $field from Plaid dashboard, then press Enter in terminal if prompted."
  $out = powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Set-1PasswordFieldFromClipboard.ps1") -FieldName $field
  $results += ($out | ConvertFrom-Json)
}

@{
  status = if (($results | Where-Object { $_.status -ne "PASS" }).Count -eq 0) { "PASS" } else { "BLOCKED_OR_FAILED" }
  fields = $results
  secret_values_printed = "NO"
} | ConvertTo-Json -Depth 6
