#requires -Version 5.1
<#
  Import Plaid client_id + sandbox secret from clipboard (two Copy clicks on Keys page).
  Run after Ben copies Client ID, then Sandbox secret.
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
  if ($field -eq "PLAID_SECRET" -and $steps.Count -gt 1) {
    Write-Output "WAIT: copy Sandbox secret on Plaid Keys page, then press Enter..."
    Read-Host | Out-Null
  }
  $out = powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Set-1PasswordFieldFromClipboard.ps1") -FieldName $field
  $results += ($out | ConvertFrom-Json)
}

if ($steps -contains "PLAID_SECRET") {
  "sandbox" | powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Set-1PasswordFieldFromStdin.ps1") -FieldName PLAID_ENV -SourceLabel "PlaidClipboardMule" | Out-Null
}

@{
  status = if (($results | Where-Object { $_.status -ne "PASS" }).Count -eq 0) { "PASS" } else { "BLOCKED" }
  fields = $results
  secret_values_printed = "NO"
} | ConvertTo-Json -Depth 4
