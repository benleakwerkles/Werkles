#requires -Version 5.1
<#
.SYNOPSIS
  Store an existing 1Password service-account token in Windows Credential Manager.

.DESCRIPTION
  Fallback for Windows Hello/desktop integration failures. Reads a scoped
  1Password service-account token from the clipboard or a hidden prompt, stores
  it in Windows Credential Manager, verifies access to the Werkles Automation
  vault, and writes a names-only receipt. The token is never printed, passed as a
  command-line argument, or written to the repo.
#>
param(
  [switch]$FromClipboard,
  [string]$Vault = "Werkles Automation",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_1PASSWORD_TOKEN_STORE_20260704.json"
}

$OpExe = Get-WerklesOpBinary
$receipt = [ordered]@{
  receipt_id = "WERKLES_COM_1PASSWORD_TOKEN_STORE_20260704"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  repo_root = $RepoRoot.Path
  op_binary = $OpExe
  op_version = (& $OpExe --version)
  vault = $Vault
  credential_manager_target = $script:WerklesOnePasswordCredentialTarget
  token_source = if ($FromClipboard) { "CLIPBOARD" } else { "HIDDEN_PROMPT" }
  token_printed = "NO"
  token_written_to_repo = "NO"
  token_stored_in_user_env = "NO"
  token_stored_in_windows_credential_manager = "PENDING"
  secret_values_read = "NO"
  secret_values_printed = "NO"
  status = "UNKNOWN"
}

function ConvertFrom-SecureStringPlainText {
  param([securestring]$Secure)

  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    if ($ptr -ne [IntPtr]::Zero) {
      [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
  }
}

try {
  if ($FromClipboard) {
    Add-Type -AssemblyName System.Windows.Forms
    $token = [System.Windows.Forms.Clipboard]::GetText()
    $receipt.clipboard_text_present = -not [string]::IsNullOrWhiteSpace($token)
  } else {
    $secure = Read-Host "Paste 1Password service-account token" -AsSecureString
    $token = ConvertFrom-SecureStringPlainText -Secure $secure
  }

  $token = ([string]$token).Trim()
  if ([string]::IsNullOrWhiteSpace($token)) {
    throw "No token was provided."
  }

  Set-WerklesOnePasswordServiceToken -Token $token -UserName "Werkles Automation service account"
  $receipt.token_stored_in_windows_credential_manager = "YES"

  $storedToken = Get-WerklesOnePasswordServiceToken
  if ([string]::IsNullOrWhiteSpace($storedToken)) {
    throw "Credential Manager readback returned no token."
  }

  $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken
  $verify = & $OpExe item list --vault $Vault --format json 2>&1
  $receipt.verify_exit_code = $LASTEXITCODE
  if ($LASTEXITCODE -ne 0) {
    throw (($verify | Out-String).Trim() -split "`r?`n" | Select-Object -First 1)
  }

  $items = @($verify | ConvertFrom-Json)
  $receipt.visible_item_count = $items.Count
  $receipt.visible_item_titles = @($items | ForEach-Object { $_.title })
  $receipt.status = "PASS"
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  Remove-Item Env:\OP_SERVICE_ACCOUNT_TOKEN -ErrorAction SilentlyContinue
  $receipt.token_removed_from_process_env = "YES"
  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

[pscustomobject]@{
  status = $receipt.status
  token_source = $receipt.token_source
  token_printed = $receipt.token_printed
  token_written_to_repo = $receipt.token_written_to_repo
  token_stored_in_windows_credential_manager = $receipt.token_stored_in_windows_credential_manager
  verify_exit_code = $receipt.verify_exit_code
  visible_item_count = $receipt.visible_item_count
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5

