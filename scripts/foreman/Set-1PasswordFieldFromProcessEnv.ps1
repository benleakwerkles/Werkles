#requires -Version 5.1
<#
.SYNOPSIS
  Store one process environment variable into a matching 1Password field.

.DESCRIPTION
  Intended for use under `vercel env run`, where Vercel injects secret values
  into the child process environment without writing them to disk. The value is
  passed to Set-1PasswordFieldFromStdin.ps1 over stdin and is never printed.
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
  [string]$SourceLabel = "process environment",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

$value = [Environment]::GetEnvironmentVariable($FieldName, "Process")
if ([string]::IsNullOrWhiteSpace($value)) {
  throw "Process environment variable is empty or missing: $FieldName"
}

$setter = Join-Path $PSScriptRoot "Set-1PasswordFieldFromStdin.ps1"
$args = @(
  "-NoProfile", "-ExecutionPolicy", "Bypass",
  "-File", $setter,
  "-FieldName", $FieldName,
  "-Vault", $Vault,
  "-ItemTitle", $ItemTitle,
  "-SourceLabel", $SourceLabel
)
if (-not [string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $args += @("-ReceiptPath", $ReceiptPath)
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

$psi = [System.Diagnostics.ProcessStartInfo]::new()
$psi.FileName = "powershell.exe"
$psi.Arguments = Join-ProcessArguments -Arguments $args
$psi.WorkingDirectory = $RepoRoot.Path
$psi.UseShellExecute = $false
$psi.RedirectStandardInput = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true

$process = [System.Diagnostics.Process]::Start($psi)
$process.StandardInput.Write($value)
$process.StandardInput.Close()
$stdout = $process.StandardOutput.ReadToEnd()
$stderr = $process.StandardError.ReadToEnd()
$process.WaitForExit()

if ($process.ExitCode -ne 0) {
  $line = ($stderr -split "`r?`n" | Where-Object { $_.Trim() } | Select-Object -First 1)
  if (-not $line) { $line = "exit $($process.ExitCode)" }
  throw "1Password process-env field set failed for $FieldName`: $line"
}

if (-not [string]::IsNullOrWhiteSpace($stdout)) {
  Write-Output $stdout
}
