#requires -Version 5.1
<#
.SYNOPSIS
  Create a scoped 1Password service-account token and store it in Windows Credential Manager.

.DESCRIPTION
  This is the low-mule path for Codex on Betsy. It uses the regular 1Password
  app/CLI once to create a service account scoped only to the Werkles Automation
  vault, then stores the returned token in Windows Credential Manager. The token
  is never printed, passed as a command-line argument, or written to the repo.
#>
param(
  [string]$Account = "my.1password.com",
  [string]$AutomationVault = "Werkles Automation",
  [string]$ServiceAccountName = ("Werkles Codex Automation " + (Get-Date -Format "yyyyMMdd-HHmmss")),
  [string]$ServiceAccountExpiresIn = "12w",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_1PASSWORD_AUTOMATION_CREDENTIAL_20260704.json"
}

$OpExe = Get-WerklesOpBinary
[Environment]::SetEnvironmentVariable("OP_BIN", $OpExe, "User")
$env:OP_BIN = $OpExe

$receipt = [ordered]@{
  receipt_id = "WERKLES_COM_1PASSWORD_AUTOMATION_CREDENTIAL_20260704"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  repo_root = $RepoRoot.Path
  account = $Account
  op_binary = $OpExe
  op_version = (& $OpExe --version)
  automation_vault = $AutomationVault
  service_account_name = $ServiceAccountName
  service_account_expires_in = $ServiceAccountExpiresIn
  service_account_scope = "$AutomationVault`:read_items,write_items"
  credential_manager_target = $script:WerklesOnePasswordCredentialTarget
  token_printed = "NO"
  token_written_to_repo = "NO"
  token_stored_in_user_env = "NO"
  token_stored_in_windows_credential_manager = "PENDING"
  op_bin_user_env_set = "YES"
  secret_values_read = "NO"
  secret_values_printed = "NO"
  status = "UNKNOWN"
}

function Get-FirstLine {
  param([string]$Text)

  $line = ($Text -split "`r?`n" | Where-Object { $_.Trim() } | Select-Object -First 1)
  if ($line) { return [string]$line }
  return $null
}

try {
  Write-Host "Werkles 1Password automation credential setup"
  Write-Host "Using signed CLI: $OpExe"
  Write-Host "This should need one 1Password authorization. No secrets or tokens will be printed."

  $vaultOutput = & $OpExe vault list --account $Account --format json 2>&1
  $vaultExit = $LASTEXITCODE
  $receipt.initial_vault_list_exit_code = $vaultExit
  if ($vaultExit -ne 0) {
    throw "initial 1Password authorization failed: $(Get-FirstLine -Text (($vaultOutput | Out-String).Trim()))"
  }

  $vaults = @($vaultOutput | ConvertFrom-Json)
  $receipt.vault_names_observed = @($vaults | ForEach-Object { $_.name })
  $exists = @($vaults | Where-Object { $_.name -eq $AutomationVault }).Count -gt 0
  $receipt.automation_vault_existed_before = $exists

  if (-not $exists) {
    $createdVault = & $OpExe vault create $AutomationVault --icon vault-door --format json 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "automation vault create failed: $(Get-FirstLine -Text (($createdVault | Out-String).Trim()))"
    }
    $receipt.automation_vault_action = "CREATED"
  } else {
    $receipt.automation_vault_action = "EXISTING"
  }

  $tokenOutput = & $OpExe service-account create $ServiceAccountName --expires-in $ServiceAccountExpiresIn --vault "${AutomationVault}:read_items,write_items" --raw 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "service account create failed: $(Get-FirstLine -Text (($tokenOutput | Out-String).Trim()))"
  }

  $token = (($tokenOutput | Out-String).Trim())
  if ([string]::IsNullOrWhiteSpace($token)) {
    throw "service account create returned no token"
  }

  Set-WerklesOnePasswordServiceToken -Token $token -UserName $ServiceAccountName
  $receipt.token_stored_in_windows_credential_manager = "YES"

  $storedToken = Get-WerklesOnePasswordServiceToken
  if ([string]::IsNullOrWhiteSpace($storedToken)) {
    throw "credential manager readback returned no token"
  }

  $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken
  $verifyUser = & $OpExe user get --me 2>&1
  $receipt.service_account_user_get_exit_code = $LASTEXITCODE
  if ($LASTEXITCODE -ne 0) {
    throw "stored service account token failed user verification: $(Get-FirstLine -Text (($verifyUser | Out-String).Trim()))"
  }

  $verifyItems = & $OpExe item list --vault $AutomationVault --format json 2>&1
  $receipt.service_account_item_list_exit_code = $LASTEXITCODE
  if ($LASTEXITCODE -ne 0) {
    throw "stored service account token failed vault item-list verification: $(Get-FirstLine -Text (($verifyItems | Out-String).Trim()))"
  }

  $items = @($verifyItems | ConvertFrom-Json)
  $receipt.service_account_visible_item_count = $items.Count
  $receipt.service_account_visible_item_titles = @($items | ForEach-Object { $_.title })
  $receipt.status = "PASS"
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  Remove-Item Env:\OP_SERVICE_ACCOUNT_TOKEN -ErrorAction SilentlyContinue
  $receipt.service_account_token_removed_from_process_env = "YES"
  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

[pscustomobject]@{
  status = $receipt.status
  op_binary = $receipt.op_binary
  op_version = $receipt.op_version
  automation_vault_action = $receipt.automation_vault_action
  service_account_scope = $receipt.service_account_scope
  service_account_expires_in = $receipt.service_account_expires_in
  token_printed = $receipt.token_printed
  token_written_to_repo = $receipt.token_written_to_repo
  token_stored_in_user_env = $receipt.token_stored_in_user_env
  token_stored_in_windows_credential_manager = $receipt.token_stored_in_windows_credential_manager
  service_account_item_list_exit_code = $receipt.service_account_item_list_exit_code
  service_account_visible_item_count = $receipt.service_account_visible_item_count
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5

