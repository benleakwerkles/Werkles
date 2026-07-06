#requires -Version 5.1
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("preview", "production")]
  [string]$VercelTarget,
  [Parameter(Mandatory = $true)]
  [string]$VariableNames
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$varNames = $VariableNames -split ","
$NpxExe = (Get-Command npx.cmd -ErrorAction Stop).Source

function Join-ProcessArguments {
  param([string[]]$Arguments)
  $escaped = foreach ($arg in $Arguments) {
    $text = [string]$arg
    if ($text -notmatch '[\s"]') { $text } else { '"' + $text.Replace('"', '\"') + '"' }
  }
  return ($escaped -join " ")
}

foreach ($name in $varNames) {
  $value = [Environment]::GetEnvironmentVariable($name, "Process")
  if ([string]::IsNullOrWhiteSpace($value)) {
    Write-Output "MISSING_IN_OP $name -> $VercelTarget"
    continue
  }

  $sensitiveFlag = if ($name -eq "PLAID_ENV") { "--no-sensitive" } else { "--sensitive" }
  $psi = New-Object System.Diagnostics.ProcessStartInfo
  $psi.FileName = $NpxExe
  $psi.Arguments = Join-ProcessArguments -Arguments @("vercel@latest", "env", "add", $name, $VercelTarget, "--force", "--yes", $sensitiveFlag, "--value", "-")
  $psi.WorkingDirectory = $RepoRoot.Path
  $psi.UseShellExecute = $false
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true

  $p = [System.Diagnostics.Process]::Start($psi)
  $p.StandardInput.Write($value)
  $p.StandardInput.Close()
  $null = $p.StandardOutput.ReadToEnd()
  $stderr = $p.StandardError.ReadToEnd()
  $p.WaitForExit()

  if ($p.ExitCode -eq 0) {
    Write-Output "ADDED $name -> $VercelTarget"
  } else {
    $line = ($stderr -split "`n" | Where-Object { $_.Trim() } | Select-Object -First 1)
    if (-not $line) { $line = "exit $($p.ExitCode)" }
    Write-Output "FAILED $name -> $VercelTarget :: $line"
  }
}
