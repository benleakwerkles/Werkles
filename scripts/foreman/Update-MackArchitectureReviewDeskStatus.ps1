param(
  [string]$DropDir,
  [string]$IntakePath,
  [string]$NextBuildPacketPath,
  [string]$StatusPath,
  [string]$ReceiptPath,
  [string]$FlowStateReceiptPath,
  [string]$WatchReceiptPath
)

$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$FlowStatePath = Join-Path $Repo "scripts\foreman\Get-MackArchitectureReviewFlowState.ps1"
$WatcherPath = Join-Path $Repo "scripts\foreman\Watch-MackArchitectureReturnDrop.ps1"
$CanonicalIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
$CanonicalNextBuildPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_NEXT_BUILD_PACKET_FROM_RETURN_20260706.md"
$DefaultDropDir = Join-Path $Repo "foreman\handoffs\inbox\mack-architecture-return-drop"

if (-not $DropDir) {
  $DropDir = $DefaultDropDir
}
if (-not $IntakePath) {
  $IntakePath = $CanonicalIntakePath
}
if (-not $NextBuildPacketPath) {
  $NextBuildPacketPath = $CanonicalNextBuildPath
}
if (-not $StatusPath) {
  $StatusPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_REVIEW_DESK_STATUS_20260706.md"
}
if (-not $ReceiptPath) {
  $ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_REVIEW_DESK_STATUS_REFRESH_RECEIPT_20260706.json"
}
if (-not $FlowStateReceiptPath) {
  $FlowStateReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_REVIEW_FLOW_STATE_RECEIPT_20260706.json"
}
if (-not $WatchReceiptPath) {
  $WatchReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_RETURN_DROP_WATCH_RECEIPT_20260706.json"
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

function Get-OptionalString($ObjectValue, [string]$PropertyName) {
  if ($null -eq $ObjectValue) { return "" }
  $property = $ObjectValue.PSObject.Properties[$PropertyName]
  if ($null -eq $property -or $null -eq $property.Value) { return "" }
  return [string]$property.Value
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

function Invoke-JsonCommand([string]$Label, [string[]]$Arguments) {
  $output = & powershell.exe @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed: $($output | Out-String)"
  }
  return Convert-StdoutJson -Output $output -Label $Label
}

Assert-Pass (Test-Path -LiteralPath $FlowStatePath) "Flow-state script missing: $FlowStatePath"
Assert-Pass (Test-Path -LiteralPath $WatcherPath) "Watcher script missing: $WatcherPath"
Assert-Pass (Test-Path -LiteralPath $IntakePath) "Intake path missing: $IntakePath"

$intakeBeforeHash = Get-Sha256FileOrEmpty $IntakePath
$canonicalIntakeBeforeHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$nextBuildBeforeHash = Get-Sha256FileOrEmpty $NextBuildPacketPath
$canonicalNextBuildBeforeHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath
$canonicalNextBuildBeforeExists = Test-Path -LiteralPath $CanonicalNextBuildPath

$flowReadback = Invoke-JsonCommand -Label "Flow-state readback" -Arguments @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $FlowStatePath,
  "-IntakePath",
  $IntakePath,
  "-NextBuildPacketPath",
  $NextBuildPacketPath,
  "-ReceiptPath",
  $FlowStateReceiptPath
)

$watchReadback = Invoke-JsonCommand -Label "Return-drop watcher" -Arguments @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $WatcherPath,
  "-Once",
  "-DropDir",
  $DropDir,
  "-IntakePath",
  $IntakePath,
  "-NextBuildPacketPath",
  $NextBuildPacketPath,
  "-ReceiptPath",
  $WatchReceiptPath
)

$intakeAfterHash = Get-Sha256FileOrEmpty $IntakePath
$canonicalIntakeAfterHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$nextBuildAfterHash = Get-Sha256FileOrEmpty $NextBuildPacketPath
$canonicalNextBuildAfterHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath
$canonicalNextBuildAfterExists = Test-Path -LiteralPath $CanonicalNextBuildPath

Assert-Pass ($intakeBeforeHash -eq $intakeAfterHash) "Status refresh changed intake."
Assert-Pass ($nextBuildBeforeHash -eq $nextBuildAfterHash) "Status refresh changed next-build packet."
Assert-Pass ($canonicalIntakeBeforeHash -eq $canonicalIntakeAfterHash) "Status refresh changed canonical intake."
Assert-Pass ($canonicalNextBuildBeforeExists -eq $canonicalNextBuildAfterExists) "Status refresh changed canonical next-build existence."
Assert-Pass ($canonicalNextBuildBeforeHash -eq $canonicalNextBuildAfterHash) "Status refresh changed canonical next-build hash."

$laneStatus = ""
$bottomLine = ""
$nextHumanAction = ""

if ($watchReadback.last_lane_state -eq "RETURN_DROP_READY_FOR_COMMIT") {
  $laneStatus = "RETURN_DROP_READY_FOR_COMMIT"
  $bottomLine = "A Mack return file is present in the drop folder and is ready for Ben to review before any commit."
  $nextHumanAction = "Run Invoke-MackArchitectureReviewLane.ps1 as a dry-run, then use -CommitReturn only if Ben accepts the returned block for canonical intake."
} elseif ($flowReadback.flow_state -eq "MACK_RETURN_READY_FOR_BEN_REVIEW") {
  $laneStatus = "MACK_RETURN_READY_FOR_BEN_REVIEW"
  $bottomLine = "Canonical intake has a complete Mack return and is ready for Ben review."
  $nextHumanAction = "Run Accept-MackArchitectureReturn.ps1 as a dry-run before any -Commit -BenAccepted conversion."
} elseif ($watchReadback.last_blocker_code -eq "MACK_RETURN_DROP_EMPTY") {
  $laneStatus = "WAITING_FOR_MACK_RETURN_DROP"
  $bottomLine = "Mack has not returned a file to the local drop folder yet."
  $nextHumanAction = "Put Mack's returned .txt or .md file in foreman/handoffs/inbox/mack-architecture-return-drop/, then rerun this status refresh."
} else {
  $laneStatus = "REVIEW_STATUS_NEEDS_ATTENTION"
  $bottomLine = "The local lane returned a state that needs human inspection before any commit."
  $nextHumanAction = "Inspect the flow-state and watcher receipts before running a commit command."
}

$updatedUtc = (Get-Date).ToUniversalTime().ToString("o")
$dropCandidateCount = if ($null -ne $watchReadback.last_candidate_count) { [int]$watchReadback.last_candidate_count } else { 0 }
$canonicalNextBuildExists = Test-Path -LiteralPath $CanonicalNextBuildPath
$flowReceiptRelative = Convert-ToRepoRelative $FlowStateReceiptPath
$watchReceiptRelative = Convert-ToRepoRelative $WatchReceiptPath
$statusReceiptRelative = Convert-ToRepoRelative $ReceiptPath
$dropDirRelative = Convert-ToRepoRelative $DropDir

$statusMarkdown = @"
# Mack Architecture Review Desk Status

Status: $laneStatus
Updated: $updatedUtc
Owner: Heimerdinker@Betsy
Packet: MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706

## Bottom Line

$bottomLine

## Current Readbacks

| Check | Result |
| --- | --- |
| Canonical Mack intake | $($flowReadback.flow_state) |
| Canonical Mack blocker | $($flowReadback.blocker_code) |
| Return drop watcher | $($watchReadback.last_lane_state) |
| Return drop blocker | $($watchReadback.last_blocker_code) |
| Drop candidates | $dropCandidateCount |
| Watcher stop reason | $($watchReadback.stop_reason) |
| Canonical next-build packet exists | $canonicalNextBuildExists |

## Next Legal Human Action

$nextHumanAction

## Proof Pointers

- Flow-state receipt: $flowReceiptRelative
- Watcher receipt: $watchReceiptRelative
- Status refresh receipt: $statusReceiptRelative
- Return drop folder: $dropDirRelative

## Truth Boundary

This status refresh ran local readbacks only. It did not read the clipboard, send anything to Mack, mutate canonical intake, write a canonical next-build packet, claim Mack returned a review while the drop is empty, or leave a watcher running.
"@

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $StatusPath) | Out-Null
Set-Content -LiteralPath $StatusPath -Value $statusMarkdown -Encoding UTF8

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_REVIEW_DESK_STATUS_REFRESH_RECEIPT"
  status = "ARTIFACT"
  timestamp = $updatedUtc
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_REVIEW_DESK_STATUS_REFRESH_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Update-MackArchitectureReviewDeskStatus.ps1"
  lane_status = $laneStatus
  bottom_line = $bottomLine
  next_human_action = $nextHumanAction
  status_path = Convert-ToRepoRelative $StatusPath
  flow_state_readback = [ordered]@{
    status = $flowReadback.status
    flow_state = $flowReadback.flow_state
    blocker_code = Get-OptionalString $flowReadback "blocker_code"
    next_legal_command = $flowReadback.next_legal_command
    canonical_next_build_exists = $flowReadback.canonical_next_build_exists
  }
  watcher_readback = [ordered]@{
    status = $watchReadback.status
    stop_reason = $watchReadback.stop_reason
    cycles = $watchReadback.cycles
    last_candidate_count = $watchReadback.last_candidate_count
    last_lane_state = $watchReadback.last_lane_state
    last_blocker_code = Get-OptionalString $watchReadback "last_blocker_code"
    last_next_legal_command = $watchReadback.last_next_legal_command
    canonical_intake_changed = $watchReadback.canonical_intake_changed
    canonical_next_build_exists = $watchReadback.canonical_next_build_exists
  }
  validation = [ordered]@{
    flow_state_read = $true
    watcher_once_run = $true
    watcher_once_exited = $watchReadback.stop_reason -eq "ONCE"
    status_markdown_written = Test-Path -LiteralPath $StatusPath
    no_clipboard_read = $true
    external_send_not_claimed = $true
    no_intake_write = $intakeBeforeHash -eq $intakeAfterHash
    no_next_build_packet_write = $nextBuildBeforeHash -eq $nextBuildAfterHash
    canonical_intake_not_mutated = $canonicalIntakeBeforeHash -eq $canonicalIntakeAfterHash
    canonical_next_build_packet_absence_preserved = -not $canonicalNextBuildAfterExists
    no_long_running_watcher_left = $true
    no_raw_mack_text_in_status = -not ($statusMarkdown -match "MACK REVIEW RETURN")
    truth_boundary = "This status refresh composes local flow-state and watcher readbacks. It does not send externally, read the clipboard, mutate intake, write a next-build packet, or claim a real Mack return while the drop is empty."
  }
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Update-MackArchitectureReviewDeskStatus.ps1"
      sha256 = Get-Sha256FileOrEmpty $PSCommandPath
    },
    [ordered]@{
      path = "scripts/foreman/Get-MackArchitectureReviewFlowState.ps1"
      sha256 = Get-Sha256FileOrEmpty $FlowStatePath
    },
    [ordered]@{
      path = "scripts/foreman/Watch-MackArchitectureReturnDrop.ps1"
      sha256 = Get-Sha256FileOrEmpty $WatcherPath
    },
    [ordered]@{
      path = Convert-ToRepoRelative $StatusPath
      sha256 = Get-Sha256FileOrEmpty $StatusPath
    },
    [ordered]@{
      path = Convert-ToRepoRelative $FlowStateReceiptPath
      sha256 = Get-Sha256FileOrEmpty $FlowStateReceiptPath
    },
    [ordered]@{
      path = Convert-ToRepoRelative $WatchReceiptPath
      sha256 = Get-Sha256FileOrEmpty $WatchReceiptPath
    },
    [ordered]@{
      path = Convert-ToRepoRelative $IntakePath
      sha256 = $intakeAfterHash
    }
  )
  stop_conditions_respected = @(
    "no deploy",
    "no push",
    "no secrets",
    "no production mutation",
    "no external send claim",
    "no clipboard read",
    "no intake mutation",
    "no next-build packet generated",
    "no Mack receipt claim while drop is empty",
    "no long-running watcher left"
  )
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReceiptPath) | Out-Null
$receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8

[ordered]@{
  ok = $true
  status = $receipt.status
  lane_status = $laneStatus
  status_path = Convert-ToRepoRelative $StatusPath
  receipt_path = Convert-ToRepoRelative $ReceiptPath
  flow_state = $flowReadback.flow_state
  flow_blocker_code = Get-OptionalString $flowReadback "blocker_code"
  return_drop_state = $watchReadback.last_lane_state
  return_drop_blocker_code = Get-OptionalString $watchReadback "last_blocker_code"
  drop_candidates = $dropCandidateCount
  canonical_next_build_exists = $canonicalNextBuildExists
  next_human_action = $nextHumanAction
} | ConvertTo-Json -Depth 8
