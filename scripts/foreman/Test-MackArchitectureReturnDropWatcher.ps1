$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$WatcherPath = Join-Path $Repo "scripts\foreman\Watch-MackArchitectureReturnDrop.ps1"
$CoordinatorPath = Join-Path $Repo "scripts\foreman\Invoke-MackArchitectureReviewLane.ps1"
$CanonicalIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
$CanonicalNextBuildPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_NEXT_BUILD_PACKET_FROM_RETURN_20260706.md"
$SmokeRoot = Join-Path $Repo "foreman\tmp\mack-return-drop-watcher-smoke"
$ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_RETURN_DROP_WATCH_SMOKE_RECEIPT_20260706.json"

function Assert-Pass([bool]$Condition, [string]$Message) {
  if (-not $Condition) {
    throw $Message
  }
}

function Get-Sha256FileOrEmpty([string]$PathValue) {
  if (-not (Test-Path -LiteralPath $PathValue)) {
    return ""
  }
  return (Get-FileHash -LiteralPath $PathValue -Algorithm SHA256).Hash
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

function New-SmokePath([string]$Name) {
  $target = [System.IO.Path]::GetFullPath((Join-Path $SmokeRoot $Name))
  $rootFull = [System.IO.Path]::GetFullPath($SmokeRoot)
  Assert-Pass ($target.StartsWith($rootFull, [System.StringComparison]::OrdinalIgnoreCase)) "Smoke path escaped root: $target"
  return $target
}

function New-StructuredReturnText {
  return @'
MACK REVIEW RETURN
status: REVISE

strongest_objection: The architecture still risks confusing coordinated packet custody with live shared cognition.

simplest_viable_architecture: Keep the readout, paste packet, validator, event joins, and receipt gates. Delay anything that cannot prove sender, receiver, and cockpit readback by id.

highest_risk_fake_success_path: A sender-side file or transport acknowledgement is counted as receiver work completion before a returned receipt exists.

first_momentum_build: Build the receipt join row that links outbound Mack block, returned Mack block, validator classification, and Ben acceptance gate.

must_change_before_book: Stop saying seamless unless the proof chain can show packet, event, receipt, and cockpit state joined by id.

optional_later: Add database indexing after the local file proof is boring and repeatable.

score_0_to_10: 7

proof_surface_readback:
- bridge_operator_scope_seen: YES
- receipts_operator_scope_seen: YES
- all_synthetic_scope_needed: NO
- notes: fixture review can validate the return lane but does not prove Mack saw local browser links.

bottom_line: If you build only one thing next, build the receipt join row because it turns the review flow into falsifiable proof.
'@
}

function Invoke-WatcherScenario(
  [string]$Name,
  [switch]$PopulateDrop
) {
  $scenarioDir = New-SmokePath $Name
  $dropDir = Join-Path $scenarioDir "drop"
  $intakePath = Join-Path $scenarioDir "intake.md"
  $nextBuildPath = Join-Path $scenarioDir "next-build.md"
  $receiptPath = Join-Path $scenarioDir "watch-receipt.json"
  New-Item -ItemType Directory -Force -Path $dropDir | Out-Null
  Copy-Item -LiteralPath $CanonicalIntakePath -Destination $intakePath

  if ($PopulateDrop) {
    Set-Content -LiteralPath (Join-Path $dropDir "mack-return.md") -Value (New-StructuredReturnText) -Encoding UTF8
  }

  $intakeBeforeHash = Get-Sha256FileOrEmpty $intakePath
  $args = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $WatcherPath,
    "-Once",
    "-DropDir",
    $dropDir,
    "-IntakePath",
    $intakePath,
    "-NextBuildPacketPath",
    $nextBuildPath,
    "-ReceiptPath",
    $receiptPath
  )

  $stdout = & powershell.exe @args 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Watcher scenario failed: $Name / $($stdout | Out-String)"
  }
  Assert-Pass (Test-Path -LiteralPath $receiptPath) "Watcher receipt missing for $Name"
  $result = ($stdout | Out-String).Trim() | ConvertFrom-Json
  $receipt = Get-Content -Raw -LiteralPath $receiptPath | ConvertFrom-Json
  $intakeAfterHash = Get-Sha256FileOrEmpty $intakePath

  return [ordered]@{
    name = $Name
    status = $result.status
    stop_reason = $result.stop_reason
    cycles = $result.cycles
    last_candidate_count = $result.last_candidate_count
    last_lane_state = $result.last_lane_state
    last_blocker_code = $result.last_blocker_code
    intake_changed = $intakeBeforeHash -ne $intakeAfterHash
    coordinator_ran_on_first_iteration = $receipt.validation.coordinator_ran_on_first_iteration
    no_clipboard_read = $receipt.validation.no_clipboard_read
    no_raw_mack_text_in_watch_receipt = $receipt.validation.no_raw_mack_text_in_watch_receipt
    receipt_path = Convert-ToRepoRelative $receiptPath
    receipt_hash = Get-Sha256FileOrEmpty $receiptPath
  }
}

foreach ($required in @($WatcherPath, $CoordinatorPath, $CanonicalIntakePath)) {
  Assert-Pass (Test-Path -LiteralPath $required) "Required path missing: $required"
}

$smokeRootFull = [System.IO.Path]::GetFullPath($SmokeRoot)
$allowedRoot = [System.IO.Path]::GetFullPath((Join-Path $Repo "foreman\tmp"))
Assert-Pass ($smokeRootFull.StartsWith($allowedRoot, [System.StringComparison]::OrdinalIgnoreCase)) "Smoke root outside foreman tmp."

if (Test-Path -LiteralPath $SmokeRoot) {
  Remove-Item -LiteralPath $SmokeRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $SmokeRoot | Out-Null

$canonicalIntakeBeforeHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$canonicalNextBuildBeforeExists = Test-Path -LiteralPath $CanonicalNextBuildPath
$canonicalNextBuildBeforeHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath

$readbacks = @()
$readbacks += Invoke-WatcherScenario -Name "empty-once"
$readbacks += Invoke-WatcherScenario -Name "drop-once" -PopulateDrop

$empty = $readbacks | Where-Object { $_.name -eq "empty-once" } | Select-Object -First 1
$drop = $readbacks | Where-Object { $_.name -eq "drop-once" } | Select-Object -First 1

Assert-Pass ($empty.stop_reason -eq "ONCE") "Empty watcher did not stop in once mode."
Assert-Pass ($empty.last_lane_state -eq "WAITING_FOR_MACK_RETURN_DROP") "Empty watcher lane state mismatch."
Assert-Pass ($empty.last_blocker_code -eq "MACK_RETURN_DROP_EMPTY") "Empty watcher blocker mismatch."
Assert-Pass ($drop.last_candidate_count -eq 1) "Drop watcher did not see fixture return."
Assert-Pass ($drop.last_lane_state -eq "RETURN_DROP_READY_FOR_COMMIT") "Drop watcher lane state mismatch."
Assert-Pass ($drop.intake_changed -eq $false) "Drop watcher changed fixture intake in dry-run."
foreach ($readback in $readbacks) {
  Assert-Pass ($readback.cycles -eq 1) "Watcher scenario did not run exactly one cycle: $($readback.name)"
  Assert-Pass ($readback.coordinator_ran_on_first_iteration -eq $true) "Watcher did not run coordinator first: $($readback.name)"
  Assert-Pass ($readback.no_clipboard_read -eq $true) "Watcher read clipboard: $($readback.name)"
  Assert-Pass ($readback.no_raw_mack_text_in_watch_receipt -eq $true) "Watcher receipt contains raw Mack text: $($readback.name)"
}

$canonicalIntakeAfterHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$canonicalNextBuildAfterExists = Test-Path -LiteralPath $CanonicalNextBuildPath
$canonicalNextBuildAfterHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath

Assert-Pass ($canonicalIntakeBeforeHash -eq $canonicalIntakeAfterHash) "Canonical intake changed during watcher smoke."
Assert-Pass ($canonicalNextBuildBeforeExists -eq $canonicalNextBuildAfterExists) "Canonical next-build existence changed during watcher smoke."
Assert-Pass ($canonicalNextBuildBeforeHash -eq $canonicalNextBuildAfterHash) "Canonical next-build hash changed during watcher smoke."
Assert-Pass (-not $canonicalNextBuildAfterExists) "Canonical next-build packet exists after watcher smoke."

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_RETURN_DROP_WATCH_SMOKE_RECEIPT"
  status = "ARTIFACT"
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_RETURN_DROP_WATCH_SMOKE_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Test-MackArchitectureReturnDropWatcher.ps1"
  validation = [ordered]@{
    empty_once_reports_drop_empty = $true
    drop_once_reports_ready_for_commit_without_writing = $true
    once_mode_exits = $true
    coordinator_runs_on_first_iteration = $true
    real_clipboard_not_read = $true
    watcher_receipts_contain_no_raw_mack_text = $true
    canonical_intake_not_mutated = $true
    canonical_next_build_packet_absence_preserved = -not $canonicalNextBuildAfterExists
    external_send_not_claimed = $true
    truth_boundary = "This smoke proves the return-drop watcher in -Once mode with fixture files. It does not leave a watcher running, read the real clipboard, mutate canonical intake, write the canonical next-build packet, send anything to Mack, or claim a real Mack return."
  }
  readbacks = $readbacks
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Watch-MackArchitectureReturnDrop.ps1"
      sha256 = Get-Sha256FileOrEmpty $WatcherPath
    },
    [ordered]@{
      path = "scripts/foreman/Invoke-MackArchitectureReviewLane.ps1"
      sha256 = Get-Sha256FileOrEmpty $CoordinatorPath
    },
    [ordered]@{
      path = "scripts/foreman/Test-MackArchitectureReturnDropWatcher.ps1"
      sha256 = Get-Sha256FileOrEmpty $PSCommandPath
    },
    [ordered]@{
      path = "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
      sha256 = $canonicalIntakeAfterHash
    }
  )
  stop_conditions_respected = @(
    "no deploy",
    "no push",
    "no secrets",
    "no production mutation",
    "no external send claim",
    "no real clipboard read",
    "no canonical intake mutation",
    "no Mack receipt claim for canonical intake",
    "no canonical next-build packet generated",
    "no long-running process left by smoke"
  )
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReceiptPath) | Out-Null
$receipt | ConvertTo-Json -Depth 14 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8

[ordered]@{
  ok = $true
  status = $receipt.status
  receipt_path = Convert-ToRepoRelative $ReceiptPath
  receipt_sha256 = Get-Sha256FileOrEmpty $ReceiptPath
  empty_once_reports_drop_empty = $true
  drop_once_reports_ready_for_commit_without_writing = $true
  once_mode_exits = $true
  canonical_intake_unchanged = $true
  canonical_next_build_exists = $canonicalNextBuildAfterExists
} | ConvertTo-Json -Depth 8
