#requires -Version 5.1
<#
.SYNOPSIS
  Import one variable from a 1Password Environment into the Werkles vault item.

.DESCRIPTION
  Uses the 1Password beta CLI environment support and pipes the variable into
  the existing process-env setter. This script is safe to run in a visible shell
  when desktop authorization is required. Values are never printed.
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$EnvironmentId,

  [Parameter(Mandatory = $true)]
  [ValidateSet("NEXT_PUBLIC_SUPABASE_ANON_KEY")]
  [string]$FieldName,

  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$SourceLabel = "OnePasswordEnvironment",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_1PASSWORD_ENVIRONMENT_FIELD_IMPORT_20260705.json"
}

$betaOp = Join-Path $env:LOCALAPPDATA "1PasswordCLI-beta\op.exe"
if (-not (Test-Path -LiteralPath $betaOp)) {
  throw "1Password beta CLI not found: $betaOp"
}

$fieldReceipt = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_1PASSWORD_FIELD_SET_OP_ENVIRONMENT_20260705.json"
$validator = Join-Path $PSScriptRoot "Test-WerklesVercelSecretItem.ps1"
$setter = Join-Path $PSScriptRoot "Set-1PasswordFieldFromProcessEnv.ps1"

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

function Get-FirstErrorLine {
  param([string]$Text)

  $line = ($Text -split "`r?`n" | Where-Object { $_.Trim() } | Select-Object -First 1)
  if ($line) { return [string]$line }
  return $null
}

$receipt = [ordered]@{
  schema = "WERKLES_COM_1PASSWORD_ENVIRONMENT_FIELD_IMPORT_V1"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  environmentIdPresent = -not [string]::IsNullOrWhiteSpace($EnvironmentId)
  fieldName = $FieldName
  vault = $Vault
  itemTitle = $ItemTitle
  betaCli = $betaOp
  secretValuesPrinted = "NO"
  secretValuesWrittenToRepo = "NO"
  tempSecretFilesWritten = "NO"
  desktopAuthorizationMayBeRequired = "YES"
}

try {
  $arguments = @(
    "run",
    "--environment",
    $EnvironmentId,
    "--",
    "powershell",
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $setter,
    "-FieldName",
    $FieldName,
    "-Vault",
    $Vault,
    "-ItemTitle",
    $ItemTitle,
    "-SourceLabel",
    $SourceLabel,
    "-ReceiptPath",
    $fieldReceipt
  )

  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = $betaOp
  $psi.Arguments = Join-ProcessArguments -Arguments $arguments
  $psi.WorkingDirectory = $RepoRoot.Path
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $false

  $process = [System.Diagnostics.Process]::Start($psi)
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  $receipt.opRunExitCode = $process.ExitCode
  $receipt.opRunFirstErrorLine = Get-FirstErrorLine -Text $stderr
  $receipt.fieldSetterReceipt = $fieldReceipt
  $receipt.fieldSetterReceiptExists = Test-Path -LiteralPath $fieldReceipt

  $validationJson = & powershell -NoProfile -ExecutionPolicy Bypass -File $validator
  $validation = $validationJson | ConvertFrom-Json
  $receipt.validationStatus = [string]$validation.status
  $receipt.validFieldCount = [int]$validation.valid_field_count
  $receipt.missingFields = @($validation.empty_or_missing_fields)
  $receipt.dirtyFieldCount = [int]$validation.dirty_field_count

  if ($validation.status -eq "PASS_ALL_FIELDS_VALID") {
    $receipt.status = "PASS_IMPORTED_FIELD_AND_VALIDATED_8_OF_8"
  } elseif ($process.ExitCode -ne 0) {
    $receipt.status = "BLOCKED_OP_ENVIRONMENT_RUN_FAILED"
  } else {
    $receipt.status = "BLOCKED_FIELD_STILL_NOT_VALID_AFTER_IMPORT"
  }
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

[pscustomobject]@{
  status = $receipt.status
  op_run_exit_code = $receipt.opRunExitCode
  validation_status = $receipt.validationStatus
  valid_field_count = $receipt.validFieldCount
  missing_fields = $receipt.missingFields
  secret_values_printed = $receipt.secretValuesPrinted
  secret_values_written_to_repo = $receipt.secretValuesWrittenToRepo
  temp_secret_files_written = $receipt.tempSecretFilesWritten
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5

