#requires -Version 5.1
<#
.SYNOPSIS
  Install or verify the no-prompt 1Password CLI path for Werkles Cursor/Codex sessions.

.DESCRIPTION
  This is the one-script machine setup for Heimerdinker, Maker, Doozer, and any
  other Werkles Windows workstation. It uses the repo-local op wrapper, stores
  any newly supplied service-account token in Windows Credential Manager, and
  verifies that Cursor terminals can use 1Password CLI without desktop prompt
  loops. It never prints token or secret values.
#>
param(
  [switch]$FromClipboard,
  [switch]$PromptForToken,
  [switch]$VerifyOnly,
  [string]$Vault = "Werkles Automation",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $safeMachine = ($env:COMPUTERNAME -replace "[^A-Za-z0-9_-]", "_")
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_CURSOR_1PASSWORD_NO_PROMPT_INSTALL_${safeMachine}_20260704.json"
}

$opExe = Get-WerklesOpBinary
$wrapper = Join-Path $PSScriptRoot "bin\op.cmd"
$cursorSettings = Join-Path $RepoRoot ".vscode\settings.json"
$storeScript = Join-Path $PSScriptRoot "Store-WerklesOnePasswordAutomationToken.ps1"

$receipt = [ordered]@{
  schema = "WERKLES_CURSOR_1PASSWORD_NO_PROMPT_INSTALL_V1"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  repoRoot = $RepoRoot.Path
  opBinary = $opExe
  opVersion = (& $opExe --version)
  wrapperPath = $wrapper
  cursorSettingsPath = $cursorSettings
  credentialManagerTarget = $script:WerklesOnePasswordCredentialTarget
  tokenSource = if ($FromClipboard) { "CLIPBOARD" } elseif ($PromptForToken) { "HIDDEN_PROMPT" } else { "EXISTING_CREDENTIAL_MANAGER_ONLY" }
  tokenPrinted = "NO"
  tokenWrittenToRepo = "NO"
  secretValuesRead = "NO"
  secretValuesPrinted = "NO"
}

try {
  if (-not (Test-Path -LiteralPath $wrapper)) {
    throw "Missing repo-local op wrapper: $wrapper"
  }
  if (-not (Test-Path -LiteralPath $cursorSettings)) {
    throw "Missing Cursor workspace settings: $cursorSettings"
  }

  $storedToken = Get-WerklesOnePasswordServiceToken
  if ([string]::IsNullOrWhiteSpace($storedToken) -and -not $VerifyOnly) {
    if ($FromClipboard) {
      $storeReceipt = Join-Path $RepoRoot "foreman\receipts\WERKLES_CURSOR_1PASSWORD_TOKEN_STORE_$($env:COMPUTERNAME)_20260704.json"
      & $storeScript -FromClipboard -Vault $Vault -ReceiptPath $storeReceipt | Out-Null
      $receipt.tokenStoreReceipt = $storeReceipt
    } elseif ($PromptForToken) {
      $storeReceipt = Join-Path $RepoRoot "foreman\receipts\WERKLES_CURSOR_1PASSWORD_TOKEN_STORE_$($env:COMPUTERNAME)_20260704.json"
      & $storeScript -Vault $Vault -ReceiptPath $storeReceipt | Out-Null
      $receipt.tokenStoreReceipt = $storeReceipt
    }
    $storedToken = Get-WerklesOnePasswordServiceToken
  }

  $receipt.storedServiceAccountTokenPresent = -not [string]::IsNullOrWhiteSpace($storedToken)
  if (-not $receipt.storedServiceAccountTokenPresent) {
    $receipt.status = "BLOCKED_TOKEN_NOT_STORED"
    $receipt.error = "No token in Windows Credential Manager. Run with -PromptForToken or -FromClipboard once on this Windows user."
  } else {
    $verifyOutput = & $wrapper item list --vault $Vault --format json 2>&1
    $receipt.wrapperVerifyExitCode = $LASTEXITCODE
    if ($LASTEXITCODE -ne 0) {
      throw (($verifyOutput | Out-String).Trim() -split "`r?`n" | Select-Object -First 1)
    }

    $items = @($verifyOutput | ConvertFrom-Json)
    $settings = Get-Content -LiteralPath $cursorSettings -Raw | ConvertFrom-Json
    $receipt.wrapperVisibleItemCount = $items.Count
    $receipt.cursorDefaultProfile = $settings."terminal.integrated.defaultProfile.windows"
    $receipt.cursorBiometricUnlockEnabled = $settings."terminal.integrated.env.windows".OP_BIOMETRIC_UNLOCK_ENABLED
    $receipt.cursorPathShimConfigured = $settings."terminal.integrated.env.windows".PATH.Contains("scripts\foreman\bin")
    $receipt.status = "PASS"
  }
} catch {
  if ($receipt.status -eq "UNKNOWN") {
    $receipt.status = "BLOCKED_OR_FAILED"
  }
  $receipt.error = $_.Exception.Message
} finally {
  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

[pscustomobject]@{
  status = $receipt.status
  machine = $receipt.machine
  op_version = $receipt.opVersion
  stored_service_account_token_present = $receipt.storedServiceAccountTokenPresent
  wrapper_verify_exit_code = $receipt.wrapperVerifyExitCode
  cursor_default_profile = $receipt.cursorDefaultProfile
  cursor_biometric_unlock_enabled = $receipt.cursorBiometricUnlockEnabled
  token_printed = $receipt.tokenPrinted
  secret_values_printed = $receipt.secretValuesPrinted
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5
