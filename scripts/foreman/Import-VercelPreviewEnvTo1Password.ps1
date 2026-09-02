#requires -Version 5.1
<#
.SYNOPSIS
  Import Werkles Vercel Preview env values into 1Password without printing secrets.

.DESCRIPTION
  Pulls Vercel Preview environment variables to a temporary local .env file,
  copies only the configured tier-A variables into a 1Password Secure Note,
  then deletes all temporary secret-bearing files. Output and receipt are
  names-only.
#>
param(
  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$VercelEnvironment = "preview",
  [string]$SourceEnvFile,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_VERCEL_TO_1PASSWORD_IMPORT_20260704.json"
}

$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$env:Path = @($machinePath, $userPath) -join ";"
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")
$OpExe = Get-WerklesOpBinary
$NpxExe = (Get-Command npx.cmd -ErrorAction Stop).Source

if ([string]::IsNullOrWhiteSpace($env:OP_SERVICE_ACCOUNT_TOKEN) -and [string]::IsNullOrWhiteSpace($env:OP_SESSION)) {
  $storedToken = Get-WerklesOnePasswordServiceToken
  if ([string]::IsNullOrWhiteSpace($storedToken)) {
    throw "Refusing to call 1Password CLI without OP_SERVICE_ACCOUNT_TOKEN, OP_SESSION, or stored Werkles Windows Credential Manager token. Desktop integration prompts repeatedly under Codex hidden shells."
  }
  $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken
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

$nameSet = @{}
foreach ($name in $names) {
  $nameSet[$name] = $true
}

function Get-OnePasswordItems {
  param([string]$VaultName)

  $json = & $OpExe item list --vault $VaultName --format json
  $parsed = $json | ConvertFrom-Json
  return @($parsed | ForEach-Object { $_ })
}

function Convert-DotEnvValue {
  param([string]$Value)

  $val = $Value
  if ($val.Length -ge 2 -and (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'")))) {
    $quote = $val.Substring(0, 1)
    $val = $val.Substring(1, $val.Length - 2)
    if ($quote -eq '"') {
      $val = $val -replace "\\n", "`n"
      $val = $val -replace "\\r", "`r"
      $val = $val -replace "\\t", "`t"
      $val = $val -replace "\\`"", '"'
      $val = $val -replace "\\\\", "\"
    }
  }

  return $val
}

$tempRoot = Join-Path $env:TEMP ("werkles-vercel-to-1p-" + (Get-Date -Format "yyyyMMdd-HHmmss") + "-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempRoot | Out-Null
$envFile = Join-Path $tempRoot "vercel-$VercelEnvironment.env"
$templateFile = Join-Path $tempRoot "werkles-vercel-secrets.item.json"

$receipt = [ordered]@{
  receipt_id = "WERKLES_COM_VERCEL_TO_1PASSWORD_IMPORT_20260704"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  source = if ([string]::IsNullOrWhiteSpace($SourceEnvFile)) { "Vercel $VercelEnvironment env pull" } else { "Local env file" }
  source_env_file = if ([string]::IsNullOrWhiteSpace($SourceEnvFile)) { $null } else { (Resolve-Path -LiteralPath $SourceEnvFile).Path }
  destination = "1Password $Vault / $ItemTitle"
  op_binary = $OpExe
  op_version = (& $OpExe --version)
  secret_values_printed = "NO"
  secret_values_written_to_repo = "NO"
  raw_temp_file_deleted = "PENDING"
  template_file_deleted = "PENDING"
  live_logins_attempted = "NO"
  webpages_created = "NO"
  variables_requested = $names
}

try {
  if ([string]::IsNullOrWhiteSpace($SourceEnvFile)) {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
      $null = & $NpxExe vercel@latest env pull $envFile --environment=$VercelEnvironment --yes --non-interactive 2>$null
      $vercelExit = $LASTEXITCODE
    } finally {
      $ErrorActionPreference = $previousErrorActionPreference
    }

    $receipt.vercel_pull_exit_code = $vercelExit
    $receipt.vercel_pull_file_created = (Test-Path -LiteralPath $envFile)
    if ($vercelExit -ne 0 -or -not (Test-Path -LiteralPath $envFile)) {
      throw "vercel env pull failed or did not create a file"
    }
  } else {
    $envFile = (Resolve-Path -LiteralPath $SourceEnvFile).Path
    $receipt.vercel_pull_exit_code = $null
    $receipt.vercel_pull_file_created = $false
  }

  $envMap = @{}
  $seen = @()
  foreach ($raw in Get-Content -LiteralPath $envFile -Encoding UTF8) {
    $line = $raw.Trim()
    if (-not $line -or $line.StartsWith("#")) { continue }
    if ($line -match "^export\s+") { $line = $line -replace "^export\s+", "" }

    $idx = $line.IndexOf("=")
    if ($idx -lt 1) { continue }

    $key = $line.Substring(0, $idx).Trim()
    if (-not $nameSet.ContainsKey($key)) { continue }

    $rawValue = $line.Substring($idx + 1)
    $envMap[$key] = Convert-DotEnvValue -Value $rawValue
    $seen += $key
  }

  $present = @($names | Where-Object { $envMap.ContainsKey($_) -and -not [string]::IsNullOrWhiteSpace([string]$envMap[$_]) })
  $missing = @($names | Where-Object { -not ($envMap.ContainsKey($_) -and -not [string]::IsNullOrWhiteSpace([string]$envMap[$_])) })

  $receipt.variables_seen_in_pull = $seen
  $receipt.variables_imported = $present
  $receipt.variables_missing_from_vercel_pull = $missing
  $receipt.variables_imported_count = $present.Count
  $receipt.variables_missing_count = $missing.Count

  if ($present.Count -eq 0) {
    throw "No requested variables were present in Vercel pull."
  }

  $items = Get-OnePasswordItems -VaultName $Vault
  $matches = @($items | Where-Object { $_.title -eq $ItemTitle })
  $receipt.existing_1password_item_matches = $matches.Count
  if ($matches.Count -gt 1) {
    throw "Multiple 1Password items titled $ItemTitle found in $Vault."
  }

  $existingMap = @{}
  if ($matches.Count -eq 1) {
    $existingItem = & $OpExe item get $matches[0].id --vault $Vault --format json --reveal | ConvertFrom-Json
    foreach ($field in @($existingItem.fields)) {
      if ($field.label -in $names -and -not [string]::IsNullOrWhiteSpace([string]$field.value)) {
        $existingMap[$field.label] = [string]$field.value
      }
    }
  }

  $mergedMap = @{}
  foreach ($key in $existingMap.Keys) {
    $mergedMap[$key] = $existingMap[$key]
  }
  foreach ($key in $envMap.Keys) {
    if (-not [string]::IsNullOrWhiteSpace([string]$envMap[$key])) {
      $mergedMap[$key] = [string]$envMap[$key]
    }
  }

  $mergedPresent = @($names | Where-Object { $mergedMap.ContainsKey($_) -and -not [string]::IsNullOrWhiteSpace([string]$mergedMap[$_]) })
  $mergedMissing = @($names | Where-Object { -not ($mergedMap.ContainsKey($_) -and -not [string]::IsNullOrWhiteSpace([string]$mergedMap[$_])) })
  $receipt.variables_preserved_from_existing_1password = @($names | Where-Object { $existingMap.ContainsKey($_) -and -not $envMap.ContainsKey($_) })
  $receipt.variables_present_after_merge = $mergedPresent
  $receipt.variables_missing_after_merge = $mergedMissing
  $receipt.variables_present_after_merge_count = $mergedPresent.Count
  $receipt.variables_missing_after_merge_count = $mergedMissing.Count

  $fields = @()
  $fields += [ordered]@{
    id = "notesPlain"
    type = "STRING"
    purpose = "NOTES"
    label = "notesPlain"
    value = "Werkles Vercel tier-A secrets. Imported from Vercel Preview by Codex without printing values. Missing fields must be filled or rotated separately."
  }

  foreach ($name in $names) {
    $value = if ($mergedMap.ContainsKey($name)) { [string]$mergedMap[$name] } else { "" }
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
  $template | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $templateFile -Encoding UTF8

  if ($matches.Count -eq 0) {
    $created = & $OpExe item create --vault $Vault --template $templateFile --format json 2>$null
    if ($LASTEXITCODE -ne 0) { throw "op item create failed" }
    $createdObj = $created | ConvertFrom-Json
    $receipt.onepassword_action = "CREATED_ITEM"
    $receipt.onepassword_item_id = $createdObj.id
  } else {
    $id = $matches[0].id
    $edited = & $OpExe item edit $id --vault $Vault --template $templateFile --format json 2>$null
    if ($LASTEXITCODE -ne 0) { throw "op item edit failed" }
    $editedObj = $edited | ConvertFrom-Json
    $receipt.onepassword_action = "UPDATED_ITEM"
    $receipt.onepassword_item_id = $editedObj.id
  }

  $verifyItem = & $OpExe item get $ItemTitle --vault $Vault --format json | ConvertFrom-Json
  $labels = @($verifyItem.fields | Where-Object { $_.label -in $names } | ForEach-Object { $_.label })
  $receipt.verified_field_labels = $labels
  $receipt.verified_field_label_count = $labels.Count
  $receipt.status = if ($mergedMissing.Count -eq 0 -and $labels.Count -eq $names.Count) { "PASS_COMPLETE" } else { "PARTIAL_IMPORTED_WITH_MISSING_FIELDS" }
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  if ([string]::IsNullOrWhiteSpace($SourceEnvFile) -and (Test-Path -LiteralPath $envFile)) {
    Remove-Item -LiteralPath $envFile -Force -ErrorAction SilentlyContinue
  }
  if (Test-Path -LiteralPath $templateFile) {
    Remove-Item -LiteralPath $templateFile -Force -ErrorAction SilentlyContinue
  }

  $remaining = @(Get-ChildItem -LiteralPath $tempRoot -Force -ErrorAction SilentlyContinue)
  if ($remaining.Count -eq 0) {
    Remove-Item -LiteralPath $tempRoot -Force -ErrorAction SilentlyContinue
  }

  $receipt.raw_temp_file_deleted = if (-not [string]::IsNullOrWhiteSpace($SourceEnvFile)) { "NOT_CREATED_SOURCE_LEFT_IN_PLACE" } elseif (Test-Path -LiteralPath $envFile) { "NO" } else { "YES" }
  $receipt.template_file_deleted = if (Test-Path -LiteralPath $templateFile) { "NO" } else { "YES" }
  $receipt.temp_directory_deleted = if (Test-Path -LiteralPath $tempRoot) { "NO" } else { "YES" }
  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
  Remove-Item Env:\OP_SERVICE_ACCOUNT_TOKEN -ErrorAction SilentlyContinue
}

[pscustomobject]@{
  status = $receipt.status
  variables_imported_count = $receipt.variables_imported_count
  variables_imported = $receipt.variables_imported
  variables_missing_count = $receipt.variables_missing_count
  variables_missing_from_vercel_pull = $receipt.variables_missing_from_vercel_pull
  variables_present_after_merge_count = $receipt.variables_present_after_merge_count
  variables_present_after_merge = $receipt.variables_present_after_merge
  variables_missing_after_merge_count = $receipt.variables_missing_after_merge_count
  variables_missing_after_merge = $receipt.variables_missing_after_merge
  onepassword_action = $receipt.onepassword_action
  onepassword_item_id_present = -not [string]::IsNullOrWhiteSpace([string]$receipt.onepassword_item_id)
  raw_temp_file_deleted = $receipt.raw_temp_file_deleted
  template_file_deleted = $receipt.template_file_deleted
  temp_directory_deleted = $receipt.temp_directory_deleted
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5
