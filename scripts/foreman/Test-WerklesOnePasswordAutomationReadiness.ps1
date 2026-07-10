#requires -Version 5.1
<#
.SYNOPSIS
  Names-only readiness audit for the Werkles 1Password automation path.

.DESCRIPTION
  Checks whether Codex can use a stored scoped service-account token without
  invoking 1Password desktop authorization. It also records Windows Hello/NGC
  health signals that explain why desktop integration may fall back to account
  password prompts.
#>
param(
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_1PASSWORD_AUTOMATION_READINESS_20260704.json"
}

$OpExe = Get-WerklesOpBinary
$storedToken = Get-WerklesOnePasswordServiceToken
$dsreg = (& dsregcmd /status 2>$null) -join "`n"

function Get-DsregValue {
  param(
    [string]$Text,
    [string]$Name
  )

  $match = [regex]::Match($Text, "(?m)^\s*$([regex]::Escape($Name))\s*:\s*(.+?)\s*$")
  if ($match.Success) { return $match.Groups[1].Value.Trim() }
  return $null
}

$helloSignals = [ordered]@{
  NgcSet = Get-DsregValue -Text $dsreg -Name "NgcSet"
  PolicyEnabled = Get-DsregValue -Text $dsreg -Name "PolicyEnabled"
  PostLogonEnabled = Get-DsregValue -Text $dsreg -Name "PostLogonEnabled"
  DeviceEligible = Get-DsregValue -Text $dsreg -Name "DeviceEligible"
  SessionIsNotRemote = Get-DsregValue -Text $dsreg -Name "SessionIsNotRemote"
  PreReqResult = Get-DsregValue -Text $dsreg -Name "PreReqResult"
}

$logEvidence = @()
$logPath = Join-Path $env:LOCALAPPDATA "1Password\logs\1Password_r00001.log"
if (Test-Path -LiteralPath $logPath) {
  $logEvidence = @(Select-String -LiteralPath $logPath -Pattern "Windows Hello reported no support for key generation|System unlock is enabled: false|Sys auth status Disabled|authorization timeout|invoked auth prompt unlock" -CaseSensitive:$false |
    Select-Object -Last 12 |
    ForEach-Object { $_.Line })
}

$receipt = [ordered]@{
  receipt_id = "WERKLES_COM_1PASSWORD_AUTOMATION_READINESS_20260704"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  repo_root = $RepoRoot.Path
  op_binary = $OpExe
  op_version = (& $OpExe --version)
  op_bin_user_env = [Environment]::GetEnvironmentVariable("OP_BIN", "User")
  op_biometric_unlock_enabled_user_env = [Environment]::GetEnvironmentVariable("OP_BIOMETRIC_UNLOCK_ENABLED", "User")
  windows_credential_manager_target = $script:WerklesOnePasswordCredentialTarget
  stored_service_account_token_present = -not [string]::IsNullOrWhiteSpace($storedToken)
  windows_hello_signals = $helloSignals
  onepassword_log_evidence_names_only = $logEvidence
  secret_values_read = "NO"
  secret_values_printed = "NO"
  service_account_token_printed = "NO"
  status = "UNKNOWN"
}

if ($receipt.stored_service_account_token_present) {
  $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken
  try {
    $verify = & $OpExe item list --vault "Werkles Automation" --format json 2>&1
    $receipt.stored_service_account_verify_exit_code = $LASTEXITCODE
    if ($LASTEXITCODE -eq 0) {
      $items = @($verify | ConvertFrom-Json)
      $receipt.stored_service_account_visible_item_count = $items.Count
      $receipt.status = "PASS_STORED_SERVICE_ACCOUNT_READY"
    } else {
      $receipt.status = "BLOCKED_STORED_SERVICE_ACCOUNT_FAILED"
      $receipt.error = (($verify | Out-String).Trim() -split "`r?`n" | Select-Object -First 1)
    }
  } finally {
    Remove-Item Env:\OP_SERVICE_ACCOUNT_TOKEN -ErrorAction SilentlyContinue
  }
} elseif ($helloSignals.NgcSet -eq "NO" -or $helloSignals.PreReqResult -eq "WillNotProvision") {
  $receipt.status = "BLOCKED_WINDOWS_HELLO_NOT_PROVISIONED"
  $receipt.error = "No stored service-account token and Windows Hello/NGC is not provisioned for this user/session."
} else {
  $receipt.status = "BLOCKED_NO_STORED_SERVICE_ACCOUNT_TOKEN"
  $receipt.error = "No stored service-account token is available."
}

$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8

[pscustomobject]@{
  status = $receipt.status
  op_binary = $receipt.op_binary
  stored_service_account_token_present = $receipt.stored_service_account_token_present
  NgcSet = $receipt.windows_hello_signals.NgcSet
  PreReqResult = $receipt.windows_hello_signals.PreReqResult
  token_printed = $receipt.service_account_token_printed
  secret_values_printed = $receipt.secret_values_printed
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5

