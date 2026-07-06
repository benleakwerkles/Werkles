#requires -Version 5.1
<#
.SYNOPSIS
  Promote Vercel Preview env vars to Production without printing values.
#>
param(
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $RepoRoot

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

$pullFile = Join-Path $env:TEMP ("werkles-vercel-preview-pull-" + [guid]::NewGuid().ToString("N") + ".env")

try {
  if (-not $DryRun) {
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $null = & $NpxExe vercel@latest env pull $pullFile --environment=preview -y 2>&1
    $ErrorActionPreference = $prevEap
  }

  if (-not $DryRun -and -not (Test-Path -LiteralPath $pullFile)) {
    throw "Pull file missing after vercel env pull: $pullFile"
  }

  $values = @{}
  if (-not $DryRun) {
    Get-Content -LiteralPath $pullFile -Encoding UTF8 | ForEach-Object {
      $line = $_.Trim()
      if ($line.Length -eq 0 -or $line.StartsWith('#')) { return }
      $eq = $line.IndexOf('=')
      if ($eq -lt 1) { return }
      $key = $line.Substring(0, $eq).Trim().Trim([char]0xFEFF)
      $val = $line.Substring($eq + 1).Trim()
      if ($val.Length -ge 2 -and $val.StartsWith('"') -and $val.EndsWith('"')) {
        $val = $val.Substring(1, $val.Length - 2)
      }
      if ($key.Length -gt 0) { $values[$key] = $val }
    }
    Write-Output "PULL_FILE_EXISTS: True"
    Write-Output "PARSED_KEY_COUNT: $($values.Count)"
  }

  foreach ($name in $varNames) {
    if ($DryRun) {
      Write-Output "DRY_RUN_WOULD_PROMOTE $name -> production"
      continue
    }

    if (-not $values.ContainsKey($name) -or [string]::IsNullOrWhiteSpace($values[$name])) {
      Write-Output "MISSING_IN_PREVIEW_PULL $name"
      continue
    }

    $sensitiveFlag = if ($publicNames.Contains($name)) { "--no-sensitive" } else { "--sensitive" }
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $NpxExe
    $psi.Arguments = Join-ProcessArguments -Arguments @("vercel@latest", "env", "add", $name, "production", "--force", "--yes", $sensitiveFlag, "--value", "-")
    $psi.WorkingDirectory = $RepoRoot
    $psi.UseShellExecute = $false
    $psi.RedirectStandardInput = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.CreateNoWindow = $true

    $p = [System.Diagnostics.Process]::Start($psi)
    $p.StandardInput.Write($values[$name])
    $p.StandardInput.Close()
    $null = $p.StandardOutput.ReadToEnd()
    $stderr = $p.StandardError.ReadToEnd()
    $p.WaitForExit()

    if ($p.ExitCode -eq 0) {
      Write-Output "ADDED $name -> production"
    } else {
      $line = Get-FirstErrorLine -Text $stderr
      if (-not $line) { $line = "exit $($p.ExitCode)" }
      Write-Output "FAILED $name -> production :: $line"
    }
  }
} finally {
  if (Test-Path -LiteralPath $pullFile) {
    Remove-Item -LiteralPath $pullFile -Force -ErrorAction SilentlyContinue
    Write-Output "CLEANED_PULL_FILE"
  }
}

Write-Output "PROMOTE_COMPLETE_NAMES_ONLY"
