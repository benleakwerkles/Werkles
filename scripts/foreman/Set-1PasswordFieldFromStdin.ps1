#requires -Version 5.1
<#
.SYNOPSIS
  Set one approved Werkles Vercel secret field in 1Password from stdin.

.DESCRIPTION
  Reads the secret value from stdin, updates or creates the Secure Note item,
  and writes a names-only receipt. The value is never passed as a command-line
  argument and is never written to a repo file.
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID",
    "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID",
    "CRON_SECRET",
    "PLAID_CLIENT_ID",
    "PLAID_SECRET",
    "PLAID_ENV"
  )]
  [string]$FieldName,

  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$SourceLabel = "stdin",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_1PASSWORD_FIELD_SET_20260704.json"
}

$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$env:Path = @($machinePath, $userPath) -join ";"

. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

$previousToken = $env:OP_SERVICE_ACCOUNT_TOKEN
$previousBiometric = $env:OP_BIOMETRIC_UNLOCK_ENABLED

if ([string]::IsNullOrWhiteSpace($env:OP_SERVICE_ACCOUNT_TOKEN) -and [string]::IsNullOrWhiteSpace($env:OP_SESSION)) {
  $storedToken = Get-WerklesOnePasswordServiceToken
  if ([string]::IsNullOrWhiteSpace($storedToken)) {
    throw "Refusing to call 1Password CLI without OP_SERVICE_ACCOUNT_TOKEN, OP_SESSION, or stored Werkles service-account token."
  }

  $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken
  $env:OP_BIOMETRIC_UNLOCK_ENABLED = "false"
}

$allowedNames = @(
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
  if ($LASTEXITCODE -ne 0) {
    throw "op item list failed"
  }
  $parsed = $json | ConvertFrom-Json
  return @($parsed | ForEach-Object { $_ })
}

$receipt = [ordered]@{
  receipt_id = "WERKLES_COM_1PASSWORD_FIELD_SET_20260704"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  source = $SourceLabel
  destination = "1Password $Vault / $ItemTitle"
  field_name = $FieldName
  allowed_fields = $allowedNames
  secret_value_printed = "NO"
  secret_value_written_to_repo = "NO"
  plaintext_template_file_created = "NO"
  webpages_created = "NO"
}

try {
  $incoming = [Console]::In.ReadToEnd()
  $value = $incoming.Trim("`r", "`n")
  $receipt.stdin_character_count = $incoming.Length
  $receipt.value_present = -not [string]::IsNullOrWhiteSpace($value)

  if ([string]::IsNullOrWhiteSpace($value)) {
    throw "stdin value was empty"
  }

  $items = Get-OnePasswordItems -VaultName $Vault
  $matches = @($items | Where-Object { $_.title -eq $ItemTitle })
  $receipt.existing_1password_item_matches = $matches.Count
  if ($matches.Count -gt 1) {
    throw "Multiple 1Password items titled $ItemTitle found in $Vault."
  }

  if ($matches.Count -eq 0) {
    $fields = @()
    $fields += [ordered]@{
      id = "notesPlain"
      type = "STRING"
      purpose = "NOTES"
      label = "notesPlain"
      value = "Werkles Vercel tier-A secrets. Field values are imported one at a time by Codex without printing values."
    }

    foreach ($name in $allowedNames) {
      $fields += [ordered]@{
        id = $name
        type = "CONCEALED"
        label = $name
        value = if ($name -eq $FieldName) { $value } else { "" }
      }
    }

    $template = [ordered]@{
      title = $ItemTitle
      category = "SECURE_NOTE"
      fields = $fields
    }

    $created = ($template | ConvertTo-Json -Depth 8) | op item create --vault $Vault - --format json 2>$null
    if ($LASTEXITCODE -ne 0) { throw "op item create failed" }
    $createdObj = $created | ConvertFrom-Json
    $receipt.onepassword_action = "CREATED_ITEM"
    $receipt.onepassword_item_id = $createdObj.id
  } else {
    $id = $matches[0].id
    $item = & op item get $id --vault $Vault --format json | ConvertFrom-Json
    $field = @($item.fields | Where-Object { $_.label -eq $FieldName })

    if ($field.Count -gt 1) {
      throw "Multiple fields labelled $FieldName found in $ItemTitle."
    }

    if ($field.Count -eq 0) {
      $newField = [pscustomobject]@{
        id = $FieldName
        type = "CONCEALED"
        label = $FieldName
        value = $value
      }
      $item.fields = @($item.fields) + $newField
    } else {
      $field[0].type = "CONCEALED"
      $field[0] | Add-Member -NotePropertyName "value" -NotePropertyValue $value -Force
    }

    $edited = ($item | ConvertTo-Json -Depth 12) | op item edit $id --vault $Vault --format json 2>$null
    if ($LASTEXITCODE -ne 0) { throw "op item edit failed" }
    $editedObj = $edited | ConvertFrom-Json
    $receipt.onepassword_action = "UPDATED_ITEM"
    $receipt.onepassword_item_id = $editedObj.id
  }

  $verifyItem = & op item get $ItemTitle --vault $Vault --format json | ConvertFrom-Json
  $verified = @($verifyItem.fields | Where-Object { $_.label -eq $FieldName })
  $receipt.verified_field_label_present = ($verified.Count -eq 1)
  $receipt.verified_field_has_value = (($verified.Count -eq 1) -and -not [string]::IsNullOrWhiteSpace([string]$verified[0].value))
  $receipt.status = if ($receipt.verified_field_label_present -and $receipt.verified_field_has_value) { "PASS" } else { "BLOCKED_OR_FAILED" }
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  if ($null -eq $previousToken) {
    Remove-Item Env:\OP_SERVICE_ACCOUNT_TOKEN -ErrorAction SilentlyContinue
  } else {
    $env:OP_SERVICE_ACCOUNT_TOKEN = $previousToken
  }

  if ($null -eq $previousBiometric) {
    Remove-Item Env:\OP_BIOMETRIC_UNLOCK_ENABLED -ErrorAction SilentlyContinue
  } else {
    $env:OP_BIOMETRIC_UNLOCK_ENABLED = $previousBiometric
  }

  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

[pscustomobject]@{
  status = $receipt.status
  field_name = $receipt.field_name
  onepassword_action = $receipt.onepassword_action
  onepassword_item_id_present = -not [string]::IsNullOrWhiteSpace([string]$receipt.onepassword_item_id)
  verified_field_label_present = $receipt.verified_field_label_present
  verified_field_has_value = $receipt.verified_field_has_value
  secret_value_printed = $receipt.secret_value_printed
  secret_value_written_to_repo = $receipt.secret_value_written_to_repo
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5
