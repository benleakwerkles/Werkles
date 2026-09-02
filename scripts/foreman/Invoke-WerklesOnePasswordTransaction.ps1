#requires -Version 5.1
<#
.SYNOPSIS
  Run Werkles 1Password item repair/import work in one CLI session.

.DESCRIPTION
  This script performs duplicate repair and optional field updates while
  keeping all secret values in memory only. It refuses to use 1Password desktop
  integration from hidden Codex shells; provide OP_SERVICE_ACCOUNT_TOKEN or
  OP_SESSION before running it.

  Stdin may contain a JSON object whose properties are approved field names and
  whose values are secret values. Example shape:
    {"CRON_SECRET":"...","STRIPE_SECRET_KEY":"..."}
#>
param(
  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$Account = "my.1password.com",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_1PASSWORD_SINGLE_TRANSACTION_20260704.json"
}

$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$env:Path = @($machinePath, $userPath) -join ";"
$OpExe = Get-WerklesOpBinary
if ([string]::IsNullOrWhiteSpace($env:OP_SERVICE_ACCOUNT_TOKEN) -and -not [string]::IsNullOrWhiteSpace($Account)) {
  $env:OP_ACCOUNT = $Account
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

$receipt = [ordered]@{
  receipt_id = "WERKLES_COM_1PASSWORD_SINGLE_TRANSACTION_20260704"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  account = $Account
  destination = "1Password $Vault / $ItemTitle"
  secret_values_printed = "NO"
  secret_values_written_to_repo = "NO"
  plaintext_template_file_created = "NO"
  webpages_created = "NO"
  separate_hidden_op_calls_used = "NO"
  signin_invoked = "NO"
  op_binary = $OpExe
  op_version = (& $OpExe --version)
  allowed_fields = $allowedNames
}

function Invoke-OpRaw {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [string]$InputText
  )

  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = $OpExe
  $escapedArgs = foreach ($arg in $Arguments) {
    $text = [string]$arg
    if ($text -notmatch '[\s"]') {
      $text
    } else {
      '"' + $text.Replace('"', '\"') + '"'
    }
  }
  $psi.Arguments = ($escapedArgs -join " ")
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $true
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true

  $process = [System.Diagnostics.Process]::Start($psi)
  if ($null -ne $InputText) {
    $process.StandardInput.Write($InputText)
  }
  $process.StandardInput.Close()
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  return [pscustomobject]@{
    ExitCode = $process.ExitCode
    Stdout = $stdout
    Stderr = $stderr
  }
}

function Invoke-OpJson {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [string]$InputText,
    [Parameter(Mandatory = $true)]
    [string]$Failure
  )

  $result = Invoke-OpRaw -Arguments $Arguments -InputText $InputText
  if ($result.ExitCode -ne 0) {
    throw $Failure
  }
  if ([string]::IsNullOrWhiteSpace($result.Stdout)) {
    return $null
  }
  return ($result.Stdout | ConvertFrom-Json)
}

function Get-OpItems {
  $parsed = Invoke-OpJson -Failure "op item list failed" -Arguments @("item", "list", "--vault", $Vault, "--format", "json")
  return @($parsed | ForEach-Object { $_ })
}

function Get-OpItemReveal {
  param([string]$Id)

  return Invoke-OpJson -Failure "op item get failed" -Arguments @("item", "get", $Id, "--vault", $Vault, "--format", "json", "--reveal")
}

function Get-FieldValueMap {
  param([object]$Item)

  $map = @{}
  foreach ($field in @($Item.fields)) {
    if ($field.label -in $allowedNames -and -not [string]::IsNullOrWhiteSpace([string]$field.value)) {
      $map[$field.label] = [string]$field.value
    }
  }
  return $map
}

function New-ItemTemplate {
  param(
    [hashtable]$ValueMap,
    [string]$Title
  )

  $fields = @()
  $fields += [ordered]@{
    id = "notesPlain"
    type = "STRING"
    purpose = "NOTES"
    label = "notesPlain"
    value = "Werkles Vercel tier-A secrets. Maintained by Codex single-transaction script without printing values."
  }

  foreach ($name in $allowedNames) {
    $fields += [ordered]@{
      id = $name
      type = "CONCEALED"
      label = $name
      value = if ($ValueMap.ContainsKey($name)) { [string]$ValueMap[$name] } else { "" }
    }
  }

  return [ordered]@{
    title = $Title
    category = "SECURE_NOTE"
    fields = $fields
  }
}

try {
  $stdin = [Console]::In.ReadToEnd()
  $incoming = @{}
  if (-not [string]::IsNullOrWhiteSpace($stdin)) {
    $parsedIncoming = $stdin | ConvertFrom-Json
    foreach ($prop in @($parsedIncoming.PSObject.Properties)) {
      if ($prop.Name -notin $allowedNames) {
        throw "stdin included unapproved field $($prop.Name)"
      }
      if (-not [string]::IsNullOrWhiteSpace([string]$prop.Value)) {
        $incoming[$prop.Name] = [string]$prop.Value
      }
    }
  }

  $receipt.stdin_field_names = @($incoming.Keys | Sort-Object)
  $receipt.stdin_field_count = $incoming.Count

  if (-not [string]::IsNullOrWhiteSpace($env:OP_SERVICE_ACCOUNT_TOKEN)) {
    $receipt.signin_session_env_set = "INHERITED_OP_SERVICE_ACCOUNT_TOKEN"
  } elseif (-not [string]::IsNullOrWhiteSpace($env:OP_SESSION)) {
    $receipt.signin_session_env_set = "INHERITED_OP_SESSION"
  } else {
    $storedToken = Get-WerklesOnePasswordServiceToken
    if ([string]::IsNullOrWhiteSpace($storedToken)) {
      throw "Refusing to call 1Password CLI without OP_SERVICE_ACCOUNT_TOKEN, OP_SESSION, or stored Werkles Windows Credential Manager token. Desktop integration prompts repeatedly under Codex hidden shells."
    }
    $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken
    $receipt.signin_session_env_set = "WINDOWS_CREDENTIAL_MANAGER"
  }

  $items = Get-OpItems
  $matches = @($items | Where-Object { $_.title -eq $ItemTitle })
  $receipt.matching_item_count_before = $matches.Count

  $merged = @{}
  $revealedItems = @()
  foreach ($match in $matches) {
    $item = Get-OpItemReveal -Id $match.id
    $revealedItems += $item
    $fieldMap = Get-FieldValueMap -Item $item
    foreach ($name in $allowedNames) {
      if (-not $merged.ContainsKey($name) -and $fieldMap.ContainsKey($name)) {
        $merged[$name] = $fieldMap[$name]
      }
    }
  }

  foreach ($name in $incoming.Keys) {
    $merged[$name] = $incoming[$name]
  }

  $canonicalId = $null
  $action = $null
  if ($matches.Count -eq 0) {
    $template = New-ItemTemplate -ValueMap $merged -Title $ItemTitle
    $createdObj = Invoke-OpJson `
      -Failure "op item create failed" `
      -Arguments @("item", "create", "--vault", $Vault, "-", "--format", "json") `
      -InputText ($template | ConvertTo-Json -Depth 12)
    $canonicalId = $createdObj.id
    $action = "CREATED_ITEM"
  } else {
    $ranked = @($revealedItems | Sort-Object `
      @{ Expression = { (Get-FieldValueMap -Item $_).Count }; Descending = $true }, `
      @{ Expression = { $_.updated_at }; Descending = $true })
    $canonicalId = $ranked[0].id
    $template = New-ItemTemplate -ValueMap $merged -Title $ItemTitle
    $null = Invoke-OpJson `
      -Failure "op item edit failed" `
      -Arguments @("item", "edit", $canonicalId, "--vault", $Vault, "--format", "json") `
      -InputText ($template | ConvertTo-Json -Depth 12)
    $action = if ($matches.Count -gt 1) { "MERGED_DUPLICATES_AND_UPDATED_CANONICAL" } else { "UPDATED_ITEM" }

    $duplicateIds = @($matches | Where-Object { $_.id -ne $canonicalId } | ForEach-Object { $_.id })
    $receipt.duplicate_item_count = $duplicateIds.Count
    $renamed = @()
    foreach ($dupId in $duplicateIds) {
      $suffix = $dupId.Substring(0, [Math]::Min(6, $dupId.Length))
      $newTitle = "$ItemTitle DUPLICATE RETIRED $suffix"
      $null = Invoke-OpJson `
        -Failure "op item duplicate rename failed" `
        -Arguments @("item", "edit", $dupId, "--vault", $Vault, "--title", $newTitle, "--format", "json")
      $renamed += $suffix
    }
    $receipt.duplicate_items_renamed_count = $renamed.Count
  }

  $verify = Get-OpItemReveal -Id $canonicalId
  $verifyMap = Get-FieldValueMap -Item $verify
  $receipt.onepassword_action = $action
  $receipt.canonical_item_id_present = -not [string]::IsNullOrWhiteSpace([string]$canonicalId)
  $receipt.verified_nonempty_field_names = @($allowedNames | Where-Object { $verifyMap.ContainsKey($_) })
  $receipt.verified_nonempty_field_count = $receipt.verified_nonempty_field_names.Count

  $itemsAfter = Get-OpItems
  $matchesAfter = @($itemsAfter | Where-Object { $_.title -eq $ItemTitle })
  $receipt.matching_item_count_after = $matchesAfter.Count
  $receipt.status = if ($matchesAfter.Count -eq 1 -and $receipt.canonical_item_id_present) { "PASS" } else { "BLOCKED_OR_FAILED" }
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

[pscustomobject]@{
  status = $receipt.status
  onepassword_action = $receipt.onepassword_action
  matching_item_count_before = $receipt.matching_item_count_before
  matching_item_count_after = $receipt.matching_item_count_after
  duplicate_items_renamed_count = $receipt.duplicate_items_renamed_count
  verified_nonempty_field_names = $receipt.verified_nonempty_field_names
  secret_values_printed = $receipt.secret_values_printed
  secret_values_written_to_repo = $receipt.secret_values_written_to_repo
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5
