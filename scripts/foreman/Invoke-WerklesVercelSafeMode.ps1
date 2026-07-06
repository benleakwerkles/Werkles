#requires -Version 5.1
<#
.SYNOPSIS
  Werkles Vercel/1Password safe-mode bootstrap and sync.

.DESCRIPTION
  Intended to run in one visible PowerShell session. Uses the regular 1Password
  account only to create/use a dedicated automation vault, copy the Werkles
  Vercel item without printing values, create a short-lived service account
  scoped to that vault, then optionally sync to Vercel with the service account
  token kept in process memory only.
#>
param(
  [string]$Account = "my.1password.com",
  [string]$SourceVault = "Private",
  [string]$AutomationVault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$ServiceAccountName = ("Werkles Vercel Safe Mode " + (Get-Date -Format "yyyyMMdd-HHmmss")),
  [string]$ServiceAccountExpiresIn = "24h",
  [ValidateSet("Preview", "Production", "Both")]
  [string]$Target = "Both",
  [ValidateSet("OpRefs", "Environment", "Auto")]
  [string]$SyncMode = "OpRefs",
  [switch]$ExecuteSync,
  [switch]$DryRunSync,
  [switch]$GenerateMissingCronSecret,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_SAFE_MODE_EXECUTION_20260704.json"
}

$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$env:Path = @($machinePath, $userPath) -join ";"
$OpExe = Get-WerklesOpBinary

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

$publicNames = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

$receipt = [ordered]@{
  receipt_id = "WERKLES_COM_SAFE_MODE_EXECUTION_20260704"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  repo_root = $RepoRoot.Path
  account = $Account
  source_vault = $SourceVault
  automation_vault = $AutomationVault
  item_title = $ItemTitle
  target = $Target
  sync_mode = $SyncMode
  execute_sync_requested = $ExecuteSync.IsPresent
  dry_run_sync = $DryRunSync.IsPresent
  generate_missing_cron_secret = $GenerateMissingCronSecret.IsPresent
  secret_values_printed = "NO"
  secret_values_written_to_repo = "NO"
  service_account_token_printed = "NO"
  service_account_token_written_to_repo = "NO"
  plaintext_env_file_created = "NO"
  visible_single_session_required = "YES"
  direct_desktop_auth_bootstrap = "PENDING"
  source_vault_write_attempted = "NO"
  allowed_fields = $allowedNames
  op_binary = $OpExe
  op_version = (& $OpExe --version)
}

function Join-ProcessArguments {
  param([string[]]$Arguments)

  $escaped = foreach ($arg in $Arguments) {
    $text = [string]$arg
    if ($text -notmatch '[\s"]') {
      $text
    } else {
      '"' + $text.Replace('"', '\"') + '"'
    }
  }
  return ($escaped -join " ")
}

function Invoke-OpRaw {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [string]$InputText,
    [hashtable]$ExtraEnvironment
  )

  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = $OpExe
  $psi.Arguments = Join-ProcessArguments -Arguments $Arguments
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $false
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true

  if ($ExtraEnvironment) {
    foreach ($key in $ExtraEnvironment.Keys) {
      $psi.Environment[$key] = [string]$ExtraEnvironment[$key]
    }
  }

  if (-not ($ExtraEnvironment -and $ExtraEnvironment.ContainsKey("OP_SERVICE_ACCOUNT_TOKEN")) -and -not [string]::IsNullOrWhiteSpace($Account)) {
    $psi.Environment["OP_ACCOUNT"] = $Account
  }

  $process = [System.Diagnostics.Process]::Start($psi)
  if ($null -ne $InputText) {
    $process.StandardInput.Write($InputText)
  }
  $process.StandardInput.Close()
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  [pscustomobject]@{
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
    [string]$Failure,
    [hashtable]$ExtraEnvironment
  )

  $result = Invoke-OpRaw -Arguments $Arguments -InputText $InputText -ExtraEnvironment $ExtraEnvironment
  if ($result.ExitCode -ne 0) {
    throw $Failure
  }
  if ([string]::IsNullOrWhiteSpace($result.Stdout)) {
    return $null
  }
  return ($result.Stdout | ConvertFrom-Json)
}

function Get-ItemsByTitle {
  param(
    [string]$Vault,
    [string]$Title,
    [hashtable]$ExtraEnvironment
  )

  $items = Invoke-OpJson `
    -Arguments @("item", "list", "--vault", $Vault, "--format", "json") `
    -Failure "op item list failed for vault $Vault" `
    -ExtraEnvironment $ExtraEnvironment
  return @($items | Where-Object { $_.title -eq $Title })
}

function Get-RevealedItem {
  param(
    [string]$Vault,
    [string]$Id,
    [hashtable]$ExtraEnvironment
  )

  Invoke-OpJson `
    -Arguments @("item", "get", $Id, "--vault", $Vault, "--format", "json", "--reveal") `
    -Failure "op item get failed for $Id in $Vault" `
    -ExtraEnvironment $ExtraEnvironment
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

function New-SecretItemTemplate {
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
    value = "Werkles Vercel tier-A secrets. Copied by safe-mode bootstrap without printing values."
  }

  foreach ($name in $allowedNames) {
    $fields += [ordered]@{
      id = $name
      type = "CONCEALED"
      label = $name
      value = if ($ValueMap.ContainsKey($name)) { [string]$ValueMap[$name] } else { "" }
    }
  }

  [ordered]@{
    title = $Title
    category = "SECURE_NOTE"
    fields = $fields
  }
}

function Merge-ItemsInVault {
  param(
    [string]$Vault,
    [string]$Title,
    [hashtable]$SeedMap,
    [hashtable]$ExtraEnvironment,
    [switch]$CreateIfMissing,
    [switch]$ReadOnly
  )

  $matches = @(Get-ItemsByTitle -Vault $Vault -Title $Title -ExtraEnvironment $ExtraEnvironment)
  $merged = @{}
  if ($SeedMap) {
    foreach ($key in $SeedMap.Keys) {
      $merged[$key] = $SeedMap[$key]
    }
  }

  $revealed = @()
  foreach ($match in $matches) {
    $item = Get-RevealedItem -Vault $Vault -Id $match.id -ExtraEnvironment $ExtraEnvironment
    $revealed += $item
    $fieldMap = Get-FieldValueMap -Item $item
    foreach ($name in $allowedNames) {
      if (-not $merged.ContainsKey($name) -and $fieldMap.ContainsKey($name)) {
        $merged[$name] = $fieldMap[$name]
      }
    }
  }

  if ($GenerateMissingCronSecret -and -not $merged.ContainsKey("CRON_SECRET")) {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    $merged["CRON_SECRET"] = [Convert]::ToBase64String($bytes).TrimEnd("=")
  }

  if ($ReadOnly) {
    return [pscustomobject]@{
      Vault = $Vault
      MatchCountBefore = $matches.Count
      MatchCountAfter = $matches.Count
      CanonicalItemIdPresent = ($matches.Count -gt 0)
      DuplicateItemsRenamedCount = 0
      NonemptyFieldNames = @($allowedNames | Where-Object { $merged.ContainsKey($_) })
      ValueMap = $merged
      Action = "READ_MERGED_SOURCE_ONLY"
    }
  }

  if ($matches.Count -eq 0 -and -not $CreateIfMissing) {
    return [pscustomobject]@{
      Vault = $Vault
      MatchCountBefore = 0
      MatchCountAfter = 0
      CanonicalItemIdPresent = $false
      DuplicateItemsRenamedCount = 0
      NonemptyFieldNames = @($allowedNames | Where-Object { $merged.ContainsKey($_) })
      ValueMap = $merged
      Action = "NO_MATCH"
    }
  }

  if ($matches.Count -eq 0) {
    $template = New-SecretItemTemplate -ValueMap $merged -Title $Title
    $created = Invoke-OpJson `
      -Arguments @("item", "create", "--vault", $Vault, "-", "--format", "json") `
      -InputText ($template | ConvertTo-Json -Depth 12) `
      -Failure "op item create failed in $Vault" `
      -ExtraEnvironment $ExtraEnvironment
    $canonicalId = $created.id
    $action = "CREATED_ITEM"
    $renamedCount = 0
  } else {
    $ranked = @($revealed | Sort-Object `
      @{ Expression = { (Get-FieldValueMap -Item $_).Count }; Descending = $true }, `
      @{ Expression = { $_.updated_at }; Descending = $true })
    $canonicalId = $ranked[0].id
    $template = New-SecretItemTemplate -ValueMap $merged -Title $Title
    $null = Invoke-OpJson `
      -Arguments @("item", "edit", $canonicalId, "--vault", $Vault, "--format", "json") `
      -InputText ($template | ConvertTo-Json -Depth 12) `
      -Failure "op item edit failed in $Vault" `
      -ExtraEnvironment $ExtraEnvironment

    $renamedCount = 0
    foreach ($match in @($matches | Where-Object { $_.id -ne $canonicalId })) {
      $suffix = $match.id.Substring(0, [Math]::Min(6, $match.id.Length))
      $newTitle = "$Title DUPLICATE RETIRED $suffix"
      $null = Invoke-OpJson `
        -Arguments @("item", "edit", $match.id, "--vault", $Vault, "--title", $newTitle, "--format", "json") `
        -Failure "op duplicate item rename failed in $Vault" `
        -ExtraEnvironment $ExtraEnvironment
      $renamedCount += 1
    }
    $action = if ($matches.Count -gt 1) { "MERGED_DUPLICATES_AND_UPDATED_CANONICAL" } else { "UPDATED_ITEM" }
  }

  $matchesAfter = @(Get-ItemsByTitle -Vault $Vault -Title $Title -ExtraEnvironment $ExtraEnvironment)
  [pscustomobject]@{
    Vault = $Vault
    MatchCountBefore = $matches.Count
    MatchCountAfter = $matchesAfter.Count
    CanonicalItemIdPresent = -not [string]::IsNullOrWhiteSpace([string]$canonicalId)
    DuplicateItemsRenamedCount = $renamedCount
    NonemptyFieldNames = @($allowedNames | Where-Object { $merged.ContainsKey($_) })
    ValueMap = $merged
    Action = $action
  }
}

function Invoke-SafeSync {
  param([string]$Token)

  $args = @(
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-File", (Join-Path $PSScriptRoot "Sync-WerklesVercelEnvFrom1Password.ps1"),
    "-Mode", $SyncMode,
    "-Target", $Target
  )
  if ($DryRunSync) { $args += "-DryRun" }

  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = "powershell"
  $psi.Arguments = Join-ProcessArguments -Arguments $args
  $psi.WorkingDirectory = $RepoRoot.Path
  $psi.UseShellExecute = $false
  $psi.CreateNoWindow = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.Environment["OP_SERVICE_ACCOUNT_TOKEN"] = $Token

  $process = [System.Diagnostics.Process]::Start($psi)
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  [pscustomobject]@{
    ExitCode = $process.ExitCode
    StdoutLines = @($stdout -split "`r?`n" | Where-Object { $_.Trim() })
    StderrFirstLine = (($stderr -split "`r?`n" | Where-Object { $_.Trim() } | Select-Object -First 1) -as [string])
  }
}

try {
  Write-Host "WERKLES SAFE MODE: visible single-session 1Password/Vercel run"
  Write-Host "Secret values and service-account token will not be printed."
  Write-Host "Authorize the first 1Password CLI prompt only. The rest of the run should stay in this session."

  $receipt.direct_desktop_auth_bootstrap = "STARTED"
  $receipt.direct_desktop_auth_command = "op vault list --account <account> --format json"
  & $OpExe vault list --account $Account --format json | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "direct visible op vault list authorization failed"
  }
  $receipt.direct_desktop_auth_bootstrap = "PASS"

  $vaults = Invoke-OpJson -Arguments @("vault", "list", "--format", "json") -Failure "op vault list failed"
  $receipt.vault_names_observed = @($vaults | ForEach-Object { $_.name })
  $automationExists = @($vaults | Where-Object { $_.name -eq $AutomationVault }).Count -gt 0
  $receipt.automation_vault_existed_before = $automationExists

  if (-not $automationExists) {
    $null = Invoke-OpJson `
      -Arguments @("vault", "create", $AutomationVault, "--icon", "vault-door", "--format", "json") `
      -Failure "op vault create failed"
    $receipt.automation_vault_action = "CREATED"
  } else {
    $receipt.automation_vault_action = "EXISTING"
  }

  $sourceResult = Merge-ItemsInVault -Vault $SourceVault -Title $ItemTitle -ReadOnly
  $receipt.source_item_action = $sourceResult.Action
  $receipt.source_matching_item_count_before = $sourceResult.MatchCountBefore
  $receipt.source_matching_item_count_after = $sourceResult.MatchCountAfter
  $receipt.source_duplicate_items_renamed_count = $sourceResult.DuplicateItemsRenamedCount
  $receipt.source_nonempty_field_names = $sourceResult.NonemptyFieldNames
  $receipt.source_nonempty_field_count = @($sourceResult.NonemptyFieldNames).Count

  if (@($sourceResult.NonemptyFieldNames).Count -eq 0) {
    throw "No nonempty Werkles fields found in source vault $SourceVault."
  }

  $automationResult = Merge-ItemsInVault -Vault $AutomationVault -Title $ItemTitle -SeedMap $sourceResult.ValueMap -CreateIfMissing
  $receipt.automation_item_action = $automationResult.Action
  $receipt.automation_matching_item_count_before = $automationResult.MatchCountBefore
  $receipt.automation_matching_item_count_after = $automationResult.MatchCountAfter
  $receipt.automation_duplicate_items_renamed_count = $automationResult.DuplicateItemsRenamedCount
  $receipt.automation_nonempty_field_names = $automationResult.NonemptyFieldNames
  $receipt.automation_nonempty_field_count = @($automationResult.NonemptyFieldNames).Count
  $receipt.automation_missing_field_names = @($allowedNames | Where-Object { $_ -notin $automationResult.NonemptyFieldNames })

  $saResult = Invoke-OpRaw -Arguments @(
    "service-account", "create", $ServiceAccountName,
    "--expires-in", $ServiceAccountExpiresIn,
    "--vault", "$AutomationVault`:read_items,write_items",
    "--raw"
  )
  if ($saResult.ExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($saResult.Stdout)) {
    throw "op service-account create failed"
  }

  $serviceToken = $saResult.Stdout.Trim()
  Set-WerklesOnePasswordServiceToken -Token $serviceToken -UserName $ServiceAccountName
  $receipt.service_account_created = "YES"
  $receipt.service_account_name = $ServiceAccountName
  $receipt.service_account_expires_in = $ServiceAccountExpiresIn
  $receipt.service_account_token_in_process_memory = "YES"
  $receipt.service_account_token_stored_in_windows_credential_manager = "YES"

  $saEnv = @{ OP_SERVICE_ACCOUNT_TOKEN = $serviceToken }
  $verifySa = Invoke-OpRaw -Arguments @("user", "get", "--me") -ExtraEnvironment $saEnv
  $receipt.service_account_verify_exit_code = $verifySa.ExitCode
  if ($verifySa.ExitCode -ne 0) {
    throw "service account verification failed"
  }

  $saItemCheck = Merge-ItemsInVault -Vault $AutomationVault -Title $ItemTitle -ExtraEnvironment $saEnv
  $receipt.service_account_item_check_action = $saItemCheck.Action
  $receipt.service_account_item_check_nonempty_field_names = $saItemCheck.NonemptyFieldNames
  $receipt.service_account_item_check_nonempty_field_count = @($saItemCheck.NonemptyFieldNames).Count

  if ($ExecuteSync) {
    $syncResult = Invoke-SafeSync -Token $serviceToken
    $receipt.sync_exit_code = $syncResult.ExitCode
    $receipt.sync_stdout_names_only = $syncResult.StdoutLines
    $receipt.sync_stderr_first_line = $syncResult.StderrFirstLine
    if ($syncResult.ExitCode -ne 0) {
      throw "Vercel sync failed"
    }
    $receipt.sync_status = if ($DryRunSync) { "DRY_RUN_PASS" } else { "EXECUTED" }
  } else {
    $receipt.sync_status = "SKIPPED_EXECUTE_SYNC_NOT_SET"
  }

  $receipt.status = if (@($automationResult.NonemptyFieldNames).Count -eq $allowedNames.Count) { "PASS_COMPLETE" } else { "PARTIAL_PASS_MISSING_FIELDS" }
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  Remove-Item Env:\OP_SERVICE_ACCOUNT_TOKEN -ErrorAction SilentlyContinue
  $receipt.service_account_token_removed_from_env = "YES"
  $receipt | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

[pscustomobject]@{
  status = $receipt.status
  automation_vault_action = $receipt.automation_vault_action
  source_item_action = $receipt.source_item_action
  automation_item_action = $receipt.automation_item_action
  automation_nonempty_field_count = $receipt.automation_nonempty_field_count
  automation_missing_field_names = $receipt.automation_missing_field_names
  service_account_created = $receipt.service_account_created
  service_account_token_stored_in_windows_credential_manager = $receipt.service_account_token_stored_in_windows_credential_manager
  sync_status = $receipt.sync_status
  sync_exit_code = $receipt.sync_exit_code
  secret_values_printed = $receipt.secret_values_printed
  service_account_token_printed = $receipt.service_account_token_printed
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5
