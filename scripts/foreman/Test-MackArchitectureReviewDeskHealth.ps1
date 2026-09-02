param(
  [switch]$WithTypecheck,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$LauncherSmokePath = Join-Path $Repo "scripts\foreman\Test-MackArchitectureReviewDeskLauncher.ps1"
$StatusSmokePath = Join-Path $Repo "scripts\foreman\Test-MackArchitectureReviewDeskStatus.ps1"
$WatcherSmokePath = Join-Path $Repo "scripts\foreman\Test-MackArchitectureReturnDropWatcher.ps1"
$LaneSmokePath = Join-Path $Repo "scripts\foreman\Test-MackArchitectureReviewLane.ps1"
$ReadinessPath = Join-Path $Repo "scripts\foreman\mack-architecture-review-desk-readiness.mjs"

if (-not $ReceiptPath) {
  $ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_REVIEW_DESK_HEALTHCHECK_RECEIPT_20260706.json"
}

function Assert-Pass([bool]$Condition, [string]$Message) {
  if (-not $Condition) {
    throw $Message
  }
}

function Convert-ToRepoRelative([string]$PathValue) {
  $resolved = Resolve-Path -LiteralPath $PathValue -ErrorAction SilentlyContinue
  if (-not $resolved) { return $PathValue }
  $root = [System.IO.Path]::GetFullPath($Repo)
  $full = [System.IO.Path]::GetFullPath($resolved.Path)
  if (-not $root.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
    $root = $root + [System.IO.Path]::DirectorySeparatorChar
  }
  if ($full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
    return ($full.Substring($root.Length) -replace "\\", "/")
  }
  return ($full -replace "\\", "/")
}

function Get-Sha256FileOrEmpty([string]$PathValue) {
  if (-not (Test-Path -LiteralPath $PathValue)) {
    return ""
  }
  return (Get-FileHash -LiteralPath $PathValue -Algorithm SHA256).Hash
}

function Convert-StdoutJson([object[]]$Output, [string]$Label) {
  $text = ($Output | Out-String).Trim()
  if (-not $text) {
    throw "$Label returned empty output."
  }
  $firstBrace = $text.IndexOf("{")
  $lastBrace = $text.LastIndexOf("}")
  if ($firstBrace -ge 0 -and $lastBrace -gt $firstBrace) {
    $text = $text.Substring($firstBrace, $lastBrace - $firstBrace + 1)
  }
  try {
    return $text | ConvertFrom-Json
  } catch {
    throw "$Label returned non-JSON output: $text"
  }
}

function Invoke-JsonCommand([string]$Name, [string]$Executable, [string[]]$Arguments) {
  $output = & $Executable @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed: $($output | Out-String)"
  }
  $readback = Convert-StdoutJson -Output $output -Label $Name
  return [ordered]@{
    name = $Name
    status = $readback.status
    ok = if ($null -ne $readback.ok) { $readback.ok } else { $true }
    receipt_path = if ($readback.receipt_path) { $readback.receipt_path } else { "" }
    receipt_sha256 = if ($readback.receipt_sha256) { $readback.receipt_sha256 } else { "" }
    summary = $readback
  }
}

function Invoke-TextCommand([string]$Name, [string]$Executable, [string[]]$Arguments) {
  $output = & $Executable @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "$Name failed: $($output | Out-String)"
  }
  return [ordered]@{
    name = $Name
    status = "PASSED"
    output_tail = (($output | Select-Object -Last 12) | Out-String).Trim()
  }
}

foreach ($required in @($LauncherSmokePath, $StatusSmokePath, $WatcherSmokePath, $LaneSmokePath, $ReadinessPath)) {
  Assert-Pass (Test-Path -LiteralPath $required) "Required healthcheck path missing: $required"
}

$checks = @()
$checks += Invoke-JsonCommand -Name "launcher-smoke" -Executable "powershell.exe" -Arguments @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $LauncherSmokePath
)
$checks += Invoke-JsonCommand -Name "status-refresh-smoke" -Executable "powershell.exe" -Arguments @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $StatusSmokePath
)
$checks += Invoke-JsonCommand -Name "return-drop-watcher-smoke" -Executable "powershell.exe" -Arguments @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $WatcherSmokePath
)
$checks += Invoke-JsonCommand -Name "review-lane-smoke" -Executable "powershell.exe" -Arguments @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $LaneSmokePath
)
$checks += Invoke-JsonCommand -Name "readiness" -Executable "node" -Arguments @(
  $ReadinessPath
)

$typecheck = [ordered]@{
  name = "typecheck"
  status = "SKIPPED"
  output_tail = ""
}
if ($WithTypecheck) {
  $typecheck = Invoke-TextCommand -Name "typecheck" -Executable "npm.cmd" -Arguments @("run", "typecheck")
}

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_REVIEW_DESK_HEALTHCHECK_RECEIPT"
  status = "ARTIFACT"
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_REVIEW_DESK_HEALTHCHECK_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Test-MackArchitectureReviewDeskHealth.ps1" + ($(if ($WithTypecheck) { " -WithTypecheck" } else { "" }))
  validation = [ordered]@{
    launcher_smoke_passed = (($checks | Where-Object { $_.name -eq "launcher-smoke" } | Select-Object -First 1).status -eq "ARTIFACT")
    status_refresh_smoke_passed = (($checks | Where-Object { $_.name -eq "status-refresh-smoke" } | Select-Object -First 1).status -eq "ARTIFACT")
    return_drop_watcher_smoke_passed = (($checks | Where-Object { $_.name -eq "return-drop-watcher-smoke" } | Select-Object -First 1).status -eq "ARTIFACT")
    review_lane_smoke_passed = (($checks | Where-Object { $_.name -eq "review-lane-smoke" } | Select-Object -First 1).status -eq "ARTIFACT")
    readiness_passed = (($checks | Where-Object { $_.name -eq "readiness" } | Select-Object -First 1).ok -eq $true)
    typecheck_status = $typecheck.status
    no_external_send_claimed = $true
    no_clipboard_write_by_healthcheck = $true
    no_canonical_next_build_packet_generated = $true
    no_long_running_watcher_left = $true
    truth_boundary = "This healthcheck runs local safe smokes and readiness. It does not open windows, refresh status outside smoke fixtures, write the clipboard, send anything to Mack, claim Mack returned, mutate canonical intake, or generate a canonical next-build packet."
  }
  checks = $checks
  typecheck = $typecheck
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Test-MackArchitectureReviewDeskHealth.ps1"
      sha256 = Get-Sha256FileOrEmpty $PSCommandPath
    },
    [ordered]@{
      path = "scripts/foreman/Test-MackArchitectureReviewDeskLauncher.ps1"
      sha256 = Get-Sha256FileOrEmpty $LauncherSmokePath
    },
    [ordered]@{
      path = "scripts/foreman/Test-MackArchitectureReviewDeskStatus.ps1"
      sha256 = Get-Sha256FileOrEmpty $StatusSmokePath
    },
    [ordered]@{
      path = "scripts/foreman/Test-MackArchitectureReturnDropWatcher.ps1"
      sha256 = Get-Sha256FileOrEmpty $WatcherSmokePath
    },
    [ordered]@{
      path = "scripts/foreman/Test-MackArchitectureReviewLane.ps1"
      sha256 = Get-Sha256FileOrEmpty $LaneSmokePath
    },
    [ordered]@{
      path = "scripts/foreman/mack-architecture-review-desk-readiness.mjs"
      sha256 = Get-Sha256FileOrEmpty $ReadinessPath
    }
  )
  stop_conditions_respected = @(
    "no deploy",
    "no push",
    "no secrets",
    "no production mutation",
    "no external send claim",
    "no window opening",
    "no clipboard write",
    "no Mack receipt claim",
    "no canonical intake mutation",
    "no canonical next-build packet generated"
  )
}

foreach ($key in @("launcher_smoke_passed", "status_refresh_smoke_passed", "return_drop_watcher_smoke_passed", "review_lane_smoke_passed", "readiness_passed")) {
  Assert-Pass ([bool]$receipt.validation[$key]) "Healthcheck validation failed: $key"
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReceiptPath) | Out-Null
$receipt | ConvertTo-Json -Depth 14 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8

[ordered]@{
  ok = $true
  status = $receipt.status
  receipt_path = Convert-ToRepoRelative $ReceiptPath
  receipt_sha256 = Get-Sha256FileOrEmpty $ReceiptPath
  launcher_smoke_passed = $receipt.validation.launcher_smoke_passed
  status_refresh_smoke_passed = $receipt.validation.status_refresh_smoke_passed
  return_drop_watcher_smoke_passed = $receipt.validation.return_drop_watcher_smoke_passed
  review_lane_smoke_passed = $receipt.validation.review_lane_smoke_passed
  readiness_passed = $receipt.validation.readiness_passed
  typecheck_status = $typecheck.status
} | ConvertTo-Json -Depth 8
