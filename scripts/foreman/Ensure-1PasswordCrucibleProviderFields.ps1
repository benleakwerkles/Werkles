#requires -Version 5.1
<#
  Ensures PLAID_* field labels exist on the Werkles Vercel Secrets item.
  Does not read or print secret values.
#>
param(
  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

$OpExe = Get-WerklesOpBinary
$storedToken = Get-WerklesOnePasswordServiceToken
if ($storedToken) { $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken }

$required = @("PLAID_CLIENT_ID", "PLAID_SECRET", "PLAID_ENV")
$item = & $OpExe item get $ItemTitle --vault $Vault --format json | ConvertFrom-Json
$labels = @($item.fields | ForEach-Object { [string]$_.label })
$added = @()

foreach ($name in $required) {
  if ($labels -contains $name) { continue }
  $newField = [pscustomobject]@{
    id = $name
    type = if ($name -eq "PLAID_ENV") { "STRING" } else { "CONCEALED" }
    label = $name
    value = if ($name -eq "PLAID_ENV") { "sandbox" } else { "" }
  }
  $item.fields = @($item.fields) + $newField
  $added += $name
}

if ($added.Count -gt 0) {
  $null = ($item | ConvertTo-Json -Depth 12) | & $OpExe item edit $item.id --vault $Vault --format json 2>$null
  if ($LASTEXITCODE -ne 0) {
    throw "op item edit failed while adding Plaid field labels."
  }
}

@{
  status = if ($added.Count -gt 0) { "FIELDS_ADDED" } else { "FIELDS_ALREADY_PRESENT" }
  fields_added = $added
  field_labels_present = $required
  secret_values_printed = "NO"
} | ConvertTo-Json -Depth 4
