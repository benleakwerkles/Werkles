#requires -Version 5.1
<#
.SYNOPSIS
  Import one field from deployment-specific Vercel env pull into 1Password.

.DESCRIPTION
  Uses `vercel inspect` to resolve recent ready Preview deployment IDs and then
  tries `vercel env pull --id <deployment>`. Secret-bearing temp env files are
  parsed in memory, then deleted. Values are never printed.
#>
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("NEXT_PUBLIC_SUPABASE_ANON_KEY")]
  [string]$FieldName,
  [int]$DeploymentLimit = 12,
  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_VERCEL_DEPLOYMENT_ENV_FIELD_IMPORT_20260704.json"
}

$NpxExe = (Get-Command npx.cmd -ErrorAction Stop).Source

function Invoke-CapturedProcess {
  param(
    [string]$FileName,
    [string[]]$Arguments
  )

  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = $FileName
  $psi.Arguments = ($Arguments | ForEach-Object {
    $text = [string]$_
    if ($text -notmatch '[\s"]') { $text } else { '"' + $text.Replace('"', '\"') + '"' }
  }) -join " "
  $psi.WorkingDirectory = $RepoRoot.Path
  $psi.UseShellExecute = $false
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true

  $process = [System.Diagnostics.Process]::Start($psi)
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  return [pscustomobject]@{
    ExitCode = $process.ExitCode
    Stdout = $stdout
    Stderr = $stderr
  }
}

function Convert-DotEnvValue {
  param([string]$Value)

  $val = $Value
  if ($val.Length -ge 2 -and (($val.StartsWith('"') -and $val.EndsWith('"')) -or ($val.StartsWith("'") -and $val.EndsWith("'")))) {
    $quote = $val.Substring(0, 1)
    $val = $val.Substring(1, $val.Length - 2)
    if ($quote -eq '"') {
      $val = $val -replace "\\n", "`n"
      $val = $val -replace "\\r", "`r"
      $val = $val -replace "\\t", "`t"
      $val = $val -replace "\\`"", '"'
      $val = $val -replace "\\\\", "\"
    }
  }
  return $val
}

function Test-ClientKeyShape {
  param([string]$Value)

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $false
  }
  if ($Value -match "^sb_publishable_[A-Za-z0-9_-]+$") {
    return $true
  }
  return ($Value -match "^eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$")
}

function Invoke-StdinSetter {
  param([string]$Value)

  $setter = Join-Path $PSScriptRoot "Set-1PasswordFieldFromStdin.ps1"
  $args = @(
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-File", $setter,
    "-FieldName", $FieldName,
    "-Vault", $Vault,
    "-ItemTitle", $ItemTitle,
    "-SourceLabel", "VercelDeploymentEnvPull",
    "-ReceiptPath", (Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_1PASSWORD_FIELD_SET_VERCEL_DEPLOYMENT_ENV_20260704.json")
  )

  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = "powershell.exe"
  $psi.Arguments = ($args | ForEach-Object {
    $text = [string]$_
    if ($text -notmatch '[\s"]') { $text } else { '"' + $text.Replace('"', '\"') + '"' }
  }) -join " "
  $psi.WorkingDirectory = $RepoRoot.Path
  $psi.UseShellExecute = $false
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true

  $process = [System.Diagnostics.Process]::Start($psi)
  $process.StandardInput.Write($Value)
  $process.StandardInput.Close()
  $null = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()
  if ($process.ExitCode -ne 0) {
    $line = ($stderr -split "`r?`n" | Where-Object { $_.Trim() } | Select-Object -First 1)
    if (-not $line) { $line = "exit $($process.ExitCode)" }
    throw "stdin setter failed: $line"
  }
}

$receipt = [ordered]@{
  schema = "WERKLES_COM_VERCEL_DEPLOYMENT_ENV_FIELD_IMPORT_V1"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  fieldName = $FieldName
  deploymentLimit = $DeploymentLimit
  secretValuesPrinted = "NO"
  secretValuesWrittenToRepo = "NO"
  tempSecretFilesDeleted = "PENDING"
  attempts = @()
}

$tempRoot = Join-Path $env:TEMP ("werkles-vercel-deployment-env-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $tempRoot | Out-Null

try {
  $list = Invoke-CapturedProcess -FileName $NpxExe -Arguments @("vercel@latest", "list", "--environment=preview", "--status", "READY", "--format=json")
  if ($list.ExitCode -ne 0) {
    throw "vercel list failed"
  }
  $parsed = $list.Stdout | ConvertFrom-Json
  $deployments = @($parsed.deployments)
  if (-not $deployments -and $parsed -is [array]) {
    $deployments = @($parsed)
  }

  $candidate = $null
  foreach ($deployment in @($deployments | Select-Object -First $DeploymentLimit)) {
    $url = [string]$deployment.url
    if ([string]::IsNullOrWhiteSpace($url)) {
      continue
    }

    $inspect = Invoke-CapturedProcess -FileName $NpxExe -Arguments @("vercel@latest", "inspect", $url, "--format=json")
    $deploymentId = $null
    if ($inspect.ExitCode -eq 0) {
      try {
        $inspectJson = $inspect.Stdout | ConvertFrom-Json
        $deploymentId = [string]$inspectJson.id
        if ([string]::IsNullOrWhiteSpace($deploymentId)) {
          $deploymentId = [string]$inspectJson.uid
        }
      } catch {
        $deploymentId = $null
      }
    }

    $envFile = Join-Path $tempRoot (($url -replace '[^A-Za-z0-9_.-]', '_') + ".env")
    $pullArgs = @("vercel@latest", "env", "pull", $envFile, "--yes")
    if (-not [string]::IsNullOrWhiteSpace($deploymentId)) {
      $pullArgs += @("--id", $deploymentId)
    } else {
      $pullArgs += @("--id", $url)
    }

    $pull = Invoke-CapturedProcess -FileName $NpxExe -Arguments $pullArgs
    $hasFile = Test-Path -LiteralPath $envFile
    $hasField = $false
    $shapeValid = $false
    if ($hasFile) {
      foreach ($raw in Get-Content -LiteralPath $envFile -Encoding UTF8) {
        $line = $raw.Trim()
        if (-not $line -or $line.StartsWith("#")) { continue }
        $idx = $line.IndexOf("=")
        if ($idx -lt 1) { continue }
        $name = $line.Substring(0, $idx).Trim()
        if ($name -ne $FieldName) { continue }
        $value = Convert-DotEnvValue -Value $line.Substring($idx + 1)
        $hasField = -not [string]::IsNullOrWhiteSpace($value)
        $shapeValid = Test-ClientKeyShape -Value $value
        if ($shapeValid) {
          $candidate = $value
        }
        break
      }
    }

    $receipt.attempts += [ordered]@{
      deploymentUrl = $url
      deploymentIdPresent = -not [string]::IsNullOrWhiteSpace($deploymentId)
      pullExitCode = $pull.ExitCode
      envFileCreated = $hasFile
      fieldPresent = $hasField
      fieldShapeValid = $shapeValid
    }

    if ($candidate) {
      $receipt.importedFromDeploymentUrl = $url
      $receipt.importedFromDeploymentIdPresent = -not [string]::IsNullOrWhiteSpace($deploymentId)
      break
    }
  }

  if ($candidate) {
    Invoke-StdinSetter -Value $candidate
    $receipt.status = "PASS_IMPORTED_FIELD"
  } else {
    $receipt.status = "BLOCKED_FIELD_NOT_AVAILABLE_FROM_DEPLOYMENT_ENV_PULL"
  }
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
  $receipt.tempSecretFilesDeleted = if (Test-Path -LiteralPath $tempRoot) { "NO" } else { "YES" }
  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

[pscustomobject]@{
  status = $receipt.status
  attempts_count = @($receipt.attempts).Count
  imported_from_deployment_url = $receipt.importedFromDeploymentUrl
  secret_values_printed = $receipt.secretValuesPrinted
  secret_values_written_to_repo = $receipt.secretValuesWrittenToRepo
  temp_secret_files_deleted = $receipt.tempSecretFilesDeleted
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5
