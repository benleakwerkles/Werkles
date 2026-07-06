#requires -Version 5.1
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("preview", "production")]
  [string]$VercelTarget,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$configPath = Join-Path $RepoRoot "foreman\gates\werkles-vercel-op.config.json"
$config = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$varNames = @($config.tierAVariableNames)
$publicNames = [System.Collections.Generic.HashSet[string]]::new([string[]]@($config.publicVariableNames))
$NpxExe = (Get-Command npx.cmd -ErrorAction Stop).Source

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

$preflight = New-Object System.Diagnostics.ProcessStartInfo
$preflight.FileName = $NpxExe
$preflight.Arguments = "vercel@latest --version"
$preflight.WorkingDirectory = $RepoRoot.Path
$preflight.UseShellExecute = $false
$preflight.RedirectStandardOutput = $true
$preflight.RedirectStandardError = $true
$preflight.CreateNoWindow = $true
$preflightProcess = [System.Diagnostics.Process]::Start($preflight)
$null = $preflightProcess.StandardOutput.ReadToEnd()
$preflightErr = $preflightProcess.StandardError.ReadToEnd()
$preflightProcess.WaitForExit()
if ($preflightProcess.ExitCode -ne 0) {
  $preflightLine = Get-FirstErrorLine -Text $preflightErr
  if (-not $preflightLine) { $preflightLine = "exit $($preflightProcess.ExitCode)" }
  throw "Vercel CLI preflight failed: $preflightLine"
}

foreach ($name in $varNames) {
  $value = [Environment]::GetEnvironmentVariable($name, "Process")
  if ([string]::IsNullOrWhiteSpace($value)) {
    Write-Output "MISSING_IN_OP $name -> $VercelTarget"
    continue
  }

  if ($DryRun) {
    Write-Output "DRY_RUN_WOULD_ADD $name -> $VercelTarget"
    continue
  }

  $sensitiveFlag = if ($publicNames.Contains($name)) { "--no-sensitive" } else { "--sensitive" }

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
    $line = Get-FirstErrorLine -Text $stderr
    if (-not $line) { $line = "exit $($p.ExitCode)" }
    Write-Output "FAILED $name -> $VercelTarget :: $line"
  }
}
