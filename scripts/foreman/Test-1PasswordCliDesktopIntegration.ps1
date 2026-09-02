#requires -Version 5.1
<#
.SYNOPSIS
  Visible 1Password CLI desktop-integration smoke test.

.DESCRIPTION
  Runs `op vault list` to trigger 1Password desktop authorization and writes
  a names-only receipt. It does not read items, fields, secret references, or
  password values.
#>
param(
  [string]$Account = "my.1password.com",
  [switch]$Pause,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\OP_DESKTOP_INTEGRATION_TEST_20260704.json"
}

$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$env:Path = @($machinePath, $userPath) -join ";"
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

function Resolve-OpBinary {
  return Get-WerklesOpBinary
}

$op = Resolve-OpBinary
$receipt = [ordered]@{
  receipt_id = "OP_DESKTOP_INTEGRATION_TEST_20260704"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  repo_root = $RepoRoot.Path
  account = $Account
  op_binary = $op
  op_version = (& $op --version)
  command = "op vault list --account <account> --format json"
  secret_values_read = "NO"
  vault_items_read = "NO"
  secret_refs_expanded = "NO"
  status = "UNKNOWN"
}

Write-Host "1Password CLI desktop integration test"
Write-Host "Account: $Account"
Write-Host "Command: op vault list --account <account>"
Write-Host ""
Write-Host "If 1Password prompts for authorization, approve it with Windows Hello."
Write-Host "No vault items or secret values will be read."
Write-Host ""

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
  $output = & $op vault list --account $Account --format json 2>&1
  $exitCode = $LASTEXITCODE
} finally {
  $ErrorActionPreference = $previousErrorActionPreference
}

if ($exitCode -eq 0) {
  try {
    $vaults = @($output | ConvertFrom-Json)
    $receipt.status = "PASS"
    $receipt.vault_count = $vaults.Count
    $receipt.vault_names = @($vaults | ForEach-Object { $_.name })
    Write-Host "PASS: 1Password CLI desktop integration authorized."
    Write-Host "Vault count: $($vaults.Count)"
  } catch {
    $receipt.status = "FAIL"
    $receipt.error = "CLI succeeded but vault JSON could not be parsed."
    $receipt.parse_error = $_.Exception.Message
    Write-Host "FAIL: CLI succeeded but output parse failed."
  }
} else {
  $receipt.status = "FAIL"
  $receipt.exit_code = $exitCode
  $receipt.error = (($output | Out-String).Trim())
  Write-Host "FAIL: 1Password CLI did not authorize."
  Write-Host $receipt.error
}

$receiptDir = Split-Path -Parent $ReceiptPath
if (-not (Test-Path -LiteralPath $receiptDir)) {
  New-Item -ItemType Directory -Path $receiptDir | Out-Null
}

$receipt | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
Write-Host ""
Write-Host "Receipt: $ReceiptPath"
Write-Host ""
if ($Pause) {
  Read-Host "Press Enter to close this test window"
}
