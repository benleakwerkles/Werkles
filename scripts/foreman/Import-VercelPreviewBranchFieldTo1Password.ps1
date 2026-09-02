#requires -Version 5.1
<#
.SYNOPSIS
  Import one Vercel Preview branch-scoped environment variable into 1Password.

.DESCRIPTION
  Uses `vercel env run` with recent Preview deployment branches so encrypted
  values are exposed only to the child process environment. Values are not
  printed and are not written to disk.
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
    "CRON_SECRET"
  )]
  [string]$FieldName,
  [int]$DeploymentLimit = 20,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_VERCEL_PREVIEW_BRANCH_FIELD_IMPORT_20260704.json"
}

$NpxExe = (Get-Command npx.cmd -ErrorAction Stop).Source
$setter = Join-Path $PSScriptRoot "Set-1PasswordFieldFromProcessEnv.ps1"

function Invoke-CapturedProcess {
  param(
    [string]$FileName,
    [string[]]$Arguments
  )

  function Join-ProcessArguments {
    param([string[]]$ArgumentsToJoin)

    $escaped = foreach ($arg in $ArgumentsToJoin) {
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
  $psi.FileName = $FileName
  $psi.Arguments = Join-ProcessArguments -ArgumentsToJoin $Arguments
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

$receipt = [ordered]@{
  schema = "WERKLES_COM_VERCEL_PREVIEW_BRANCH_FIELD_IMPORT_V1"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  fieldName = $FieldName
  deploymentLimit = $DeploymentLimit
  secretValuesPrinted = "NO"
  secretValuesWrittenToRepo = "NO"
  tempSecretFilesWritten = "NO"
  attempts = @()
}

try {
  $list = Invoke-CapturedProcess -FileName $NpxExe -Arguments @(
    "vercel@latest", "list",
    "--environment=preview",
    "--status", "READY",
    "--format=json"
  )
  if ($list.ExitCode -ne 0) {
    throw "vercel list failed"
  }

  $parsed = $list.Stdout | ConvertFrom-Json
  $deployments = @($parsed.deployments)
  if (-not $deployments -and $parsed -is [array]) {
    $deployments = @($parsed)
  }

  $branches = [System.Collections.Generic.List[string]]::new()
  $currentBranchRaw = & git branch --show-current 2>$null
  $currentBranch = if ($null -eq $currentBranchRaw) { "" } else { ([string]$currentBranchRaw).Trim() }
  if (-not [string]::IsNullOrWhiteSpace($currentBranch)) {
    [void]$branches.Add($currentBranch)
  }

  foreach ($deployment in @($deployments | Select-Object -First $DeploymentLimit)) {
    $branch = [string]$deployment.meta.githubCommitRef
    if (-not [string]::IsNullOrWhiteSpace($branch) -and -not $branches.Contains($branch)) {
      [void]$branches.Add($branch)
    }
  }

  $receipt.branchCount = $branches.Count
  $imported = $false

  foreach ($branch in $branches) {
    $result = Invoke-CapturedProcess -FileName $NpxExe -Arguments @(
      "vercel@latest", "env", "run",
      "-e", "preview",
      "--git-branch", $branch,
      "--",
      "powershell",
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      $setter,
      "-FieldName",
      $FieldName,
      "-SourceLabel",
      "VercelPreviewBranchEnvRun",
      "-ReceiptPath",
      (Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_1PASSWORD_FIELD_SET_VERCEL_BRANCH_ENV_RUN_20260704.json")
    )

    $missing = ($result.Stdout + "`n" + $result.Stderr) -match "Process environment variable is empty or missing"
    $attempt = [ordered]@{
      branch = $branch
      exitCode = $result.ExitCode
      missingFromInjectedEnvironment = $missing
      imported = ($result.ExitCode -eq 0)
    }
    $receipt.attempts += $attempt

    if ($result.ExitCode -eq 0) {
      $imported = $true
      $receipt.importedFromBranch = $branch
      break
    }
  }

  $receipt.status = if ($imported) { "PASS_IMPORTED_FIELD" } else { "BLOCKED_FIELD_NOT_INJECTED_BY_VERCEL_ENV_RUN" }
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

[pscustomobject]@{
  status = $receipt.status
  field_name = $FieldName
  branch_count = $receipt.branchCount
  imported_from_branch = $receipt.importedFromBranch
  attempts_count = @($receipt.attempts).Count
  secret_values_printed = $receipt.secretValuesPrinted
  secret_values_written_to_repo = $receipt.secretValuesWrittenToRepo
  temp_secret_files_written = $receipt.tempSecretFilesWritten
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5
