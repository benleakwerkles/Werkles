#requires -Version 5.1
<#
.SYNOPSIS
  Import selected process environment variables into 1Password without printing secrets.

.DESCRIPTION
  Intended to run under `vercel env run -e preview -- ...`, so Vercel provides
  the values in this process environment. The script writes only names/counts to
  stdout and a receipt. It does not create a plaintext .env file.
#>
param(
  [string]$Vault = "Private",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$SourceLabel = "process environment",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_PROCESS_ENV_TO_1PASSWORD_IMPORT_20260704.json"
}

$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$env:Path = @($machinePath, $userPath) -join ";"

if ([string]::IsNullOrWhiteSpace($env:OP_SERVICE_ACCOUNT_TOKEN) -and [string]::IsNullOrWhiteSpace($env:OP_SESSION)) {
  throw "Refusing to call 1Password CLI without OP_SERVICE_ACCOUNT_TOKEN or OP_SESSION. Desktop integration prompts repeatedly under Codex hidden shells."
}

$names = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID",
  "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID",
  "CRON_SECRET"
)

function Get-OnePasswordItems {
  param([string]$VaultName)

  $json = & op item list --vault $VaultName --format json
  $parsed = $json | ConvertFrom-Json
  return @($parsed | ForEach-Object { $_ })
}

$receipt = [ordered]@{
  receipt_id = "WERKLES_COM_PROCESS_ENV_TO_1PASSWORD_IMPORT_20260704"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  source = $SourceLabel
  destination = "1Password $Vault / $ItemTitle"
  secret_values_printed = "NO"
  secret_values_written_to_repo = "NO"
  plaintext_env_file_created = "NO"
  live_logins_attempted = "NO"
  webpages_created = "NO"
  variables_requested = $names
}

try {
  $envMap = @{}
  foreach ($name in $names) {
    $value = [Environment]::GetEnvironmentVariable($name, "Process")
    if (-not [string]::IsNullOrWhiteSpace($value)) {
      $envMap[$name] = $value
    }
  }

  $present = @($names | Where-Object { $envMap.ContainsKey($_) })
  $missing = @($names | Where-Object { -not $envMap.ContainsKey($_) })

  $receipt.variables_imported = $present
  $receipt.variables_missing_from_process_env = $missing
  $receipt.variables_imported_count = $present.Count
  $receipt.variables_missing_count = $missing.Count

  if ($present.Count -eq 0) {
    throw "No requested variables were present in the process environment."
  }

  $items = Get-OnePasswordItems -VaultName $Vault
  $matches = @($items | Where-Object { $_.title -eq $ItemTitle })
  $receipt.existing_1password_item_matches = $matches.Count
  if ($matches.Count -gt 1) {
    throw "Multiple 1Password items titled $ItemTitle found in $Vault."
  }

  $fields = @()
  $fields += [ordered]@{
    id = "notesPlain"
    type = "STRING"
    purpose = "NOTES"
    label = "notesPlain"
    value = "Werkles Vercel tier-A secrets. Imported from Vercel process env by Codex without printing values. Missing fields must be filled or rotated separately."
  }

  foreach ($name in $names) {
    $value = if ($envMap.ContainsKey($name)) { [string]$envMap[$name] } else { "" }
    $fields += [ordered]@{
      id = $name
      type = "CONCEALED"
      label = $name
      value = $value
    }
  }

  $template = [ordered]@{
    title = $ItemTitle
    category = "SECURE_NOTE"
    fields = $fields
  }

  $templateJson = $template | ConvertTo-Json -Depth 8

  if ($matches.Count -eq 0) {
    $created = $templateJson | & op item create --vault $Vault - --format json 2>$null
    if ($LASTEXITCODE -ne 0) { throw "op item create failed" }
    $createdObj = $created | ConvertFrom-Json
    $receipt.onepassword_action = "CREATED_ITEM"
    $receipt.onepassword_item_id = $createdObj.id
  } else {
    $id = $matches[0].id
    $edited = $templateJson | & op item edit $id --vault $Vault --format json 2>$null
    if ($LASTEXITCODE -ne 0) { throw "op item edit failed" }
    $editedObj = $edited | ConvertFrom-Json
    $receipt.onepassword_action = "UPDATED_ITEM"
    $receipt.onepassword_item_id = $editedObj.id
  }

  $verifyItem = & op item get $ItemTitle --vault $Vault --format json | ConvertFrom-Json
  $labels = @($verifyItem.fields | Where-Object { $_.label -in $names } | ForEach-Object { $_.label })
  $receipt.verified_field_labels = $labels
  $receipt.verified_field_label_count = $labels.Count
  $receipt.status = if ($missing.Count -eq 0 -and $labels.Count -eq $names.Count) { "PASS_COMPLETE" } else { "PARTIAL_IMPORTED_WITH_MISSING_FIELDS" }
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

[pscustomobject]@{
  status = $receipt.status
  variables_imported_count = $receipt.variables_imported_count
  variables_imported = $receipt.variables_imported
  variables_missing_count = $receipt.variables_missing_count
  variables_missing_from_process_env = $receipt.variables_missing_from_process_env
  onepassword_action = $receipt.onepassword_action
  onepassword_item_id_present = -not [string]::IsNullOrWhiteSpace([string]$receipt.onepassword_item_id)
  plaintext_env_file_created = $receipt.plaintext_env_file_created
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5
