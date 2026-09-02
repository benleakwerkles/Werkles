$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$StatePath = Join-Path $Repo "scripts\foreman\Get-MackArchitectureReviewFlowState.ps1"
$CanonicalIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
$CanonicalNextBuildPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_NEXT_BUILD_PACKET_FROM_RETURN_20260706.md"
$SmokeRoot = Join-Path $Repo "foreman\tmp\mack-review-flow-state-smoke"
$ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_REVIEW_FLOW_STATE_SMOKE_RECEIPT_20260706.json"

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

function New-WaitingIntakeText {
  return @'
# Mack Architecture Tear-Apart Return Intake

Status: WAITING_FOR_MACK_RETURN

## Current Status

Mack review has not been received yet.

## Paste Mack Return Below

```text
MACK REVIEW RETURN
status:

strongest_objection:

simplest_viable_architecture:

highest_risk_fake_success_path:

first_momentum_build:

must_change_before_book:

optional_later:

score_0_to_10:

proof_surface_readback:
- bridge_operator_scope_seen:
- receipts_operator_scope_seen:
- all_synthetic_scope_needed:
- notes:

bottom_line:
```
'@
}

function New-IncompleteIntakeText {
  return @'
# Mack Architecture Tear-Apart Return Intake

Status: RETURN_PASTED

```text
MACK REVIEW RETURN
status: REVISE

strongest_objection: The architecture still risks renaming packet passing as cooperation.

simplest_viable_architecture:

highest_risk_fake_success_path:

first_momentum_build:

must_change_before_book:

optional_later:

score_0_to_10:

proof_surface_readback:
- bridge_operator_scope_seen: YES
- receipts_operator_scope_seen: YES
- all_synthetic_scope_needed: NO
- notes: operator scope seen

bottom_line:
```
'@
}

function New-CompleteIntakeText {
  return @'
# Mack Architecture Tear-Apart Return Intake

Status: RETURN_PASTED

```text
MACK REVIEW RETURN
status: REVISE

strongest_objection: The architecture still risks pretending packeted cooperation is the same as shared live cognition.

simplest_viable_architecture: Keep packet custody, receiver proof, event joins, and one cockpit. Delay everything else.

highest_risk_fake_success_path: Sender-side file custody gets counted as delivery before receiver proof lands.

first_momentum_build: Build the event join spine that shows packet to event to receipt to cockpit readback in one row.

must_change_before_book: Stop saying seamless until the proof chain joins by id.

optional_later: Add durable SQL indexing after the local file proof works.

score_0_to_10: 7

proof_surface_readback:
- bridge_operator_scope_seen: YES
- receipts_operator_scope_seen: YES
- all_synthetic_scope_needed: NO
- notes: operator view is enough for review

bottom_line: If you build only one thing next, build the event join spine because it turns the claim into falsifiable proof.
```
'@
}

function Invoke-StateScenario(
  [string]$Name,
  [string]$IntakeText,
  [switch]$WriteNextBuild
) {
  $scenarioDir = New-SmokePath $Name
  New-Item -ItemType Directory -Force -Path $scenarioDir | Out-Null
  $intakePath = Join-Path $scenarioDir "intake.md"
  $nextBuildPath = Join-Path $scenarioDir "next-build.md"
  $receiptPath = Join-Path $scenarioDir "state-receipt.json"
  Set-Content -LiteralPath $intakePath -Value $IntakeText -Encoding UTF8
  if ($WriteNextBuild) {
    Set-Content -LiteralPath $nextBuildPath -Value "# Fixture next-build packet`n" -Encoding UTF8
  }

  $beforeHash = Get-Sha256FileOrEmpty $intakePath
  $args = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $StatePath,
    "-IntakePath",
    $intakePath,
    "-NextBuildPacketPath",
    $nextBuildPath,
    "-ReceiptPath",
    $receiptPath
  )
  $stdout = & powershell.exe @args 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "State scenario failed: $Name / $($stdout | Out-String)"
  }
  Assert-Pass (Test-Path -LiteralPath $receiptPath) "State receipt missing for $Name"
  $result = ($stdout | Out-String).Trim() | ConvertFrom-Json
  $afterHash = Get-Sha256FileOrEmpty $intakePath
  $receipt = Get-Content -Raw -LiteralPath $receiptPath | ConvertFrom-Json

  return [ordered]@{
    name = $Name
    flow_state = $result.flow_state
    blocker_code = $result.blocker_code
    next_legal_command = $result.next_legal_command
    return_block_found = $result.return_block_found
    filled_required_count = $result.filled_required_count
    next_build_exists = $result.canonical_next_build_exists
    intake_changed = $beforeHash -ne $afterHash
    receipt_path = Convert-ToRepoRelative $receiptPath
    receipt_hash = Get-Sha256FileOrEmpty $receiptPath
    read_only_state_check = $receipt.validation.read_only_state_check
    no_clipboard_read = $receipt.validation.no_clipboard_read
  }
}

foreach ($required in @($StatePath, $CanonicalIntakePath)) {
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
$readbacks += Invoke-StateScenario -Name "waiting" -IntakeText (New-WaitingIntakeText)
$readbacks += Invoke-StateScenario -Name "incomplete" -IntakeText (New-IncompleteIntakeText)
$readbacks += Invoke-StateScenario -Name "complete" -IntakeText (New-CompleteIntakeText)
$readbacks += Invoke-StateScenario -Name "next-build-exists" -IntakeText (New-CompleteIntakeText) -WriteNextBuild

$waiting = $readbacks | Where-Object { $_.name -eq "waiting" } | Select-Object -First 1
$incomplete = $readbacks | Where-Object { $_.name -eq "incomplete" } | Select-Object -First 1
$complete = $readbacks | Where-Object { $_.name -eq "complete" } | Select-Object -First 1
$nextBuild = $readbacks | Where-Object { $_.name -eq "next-build-exists" } | Select-Object -First 1

Assert-Pass ($waiting.flow_state -eq "WAITING_FOR_MACK_RETURN") "Waiting scenario state mismatch."
Assert-Pass ($waiting.blocker_code -eq "MACK_RETURN_NOT_RECEIVED") "Waiting scenario blocker mismatch."
Assert-Pass ($incomplete.flow_state -eq "MACK_RETURN_INCOMPLETE") "Incomplete scenario state mismatch."
Assert-Pass ($complete.flow_state -eq "MACK_RETURN_READY_FOR_BEN_REVIEW") "Complete scenario state mismatch."
Assert-Pass ($complete.next_legal_command -like "*Accept-MackArchitectureReturn.ps1*") "Complete scenario next command mismatch."
Assert-Pass ($nextBuild.flow_state -eq "NEXT_BUILD_PACKET_EXISTS") "Next-build scenario state mismatch."
foreach ($readback in $readbacks) {
  Assert-Pass ($readback.intake_changed -eq $false) "State scenario mutated intake: $($readback.name)"
  Assert-Pass ($readback.read_only_state_check -eq $true) "State scenario lost read-only proof: $($readback.name)"
  Assert-Pass ($readback.no_clipboard_read -eq $true) "State scenario read clipboard: $($readback.name)"
}

$canonicalIntakeAfterHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$canonicalNextBuildAfterExists = Test-Path -LiteralPath $CanonicalNextBuildPath
$canonicalNextBuildAfterHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath

Assert-Pass ($canonicalIntakeBeforeHash -eq $canonicalIntakeAfterHash) "Canonical intake changed during state smoke."
Assert-Pass ($canonicalNextBuildBeforeExists -eq $canonicalNextBuildAfterExists) "Canonical next-build existence changed during state smoke."
Assert-Pass ($canonicalNextBuildBeforeHash -eq $canonicalNextBuildAfterHash) "Canonical next-build hash changed during state smoke."

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_REVIEW_FLOW_STATE_SMOKE_RECEIPT"
  status = "ARTIFACT"
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_REVIEW_FLOW_STATE_SMOKE_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Test-MackArchitectureReviewFlowState.ps1"
  validation = [ordered]@{
    waiting_state_blocks = $true
    incomplete_state_blocks = $true
    complete_state_points_to_acceptance_dry_run = $true
    next_build_state_detects_existing_packet = $true
    state_check_is_read_only = $true
    real_clipboard_not_read = $true
    canonical_intake_not_mutated = $true
    canonical_next_build_packet_absence_preserved = -not $canonicalNextBuildAfterExists
    external_send_not_claimed = $true
    mack_return_not_claimed_for_canonical_intake = $true
    ben_acceptance_not_claimed_for_canonical_intake = $true
    truth_boundary = "This smoke proves the local flow-state readback with fixture files only. It does not read the real clipboard, mutate canonical intake, write a canonical next-build packet, send anything to Mack, or claim a real Mack return."
  }
  readbacks = $readbacks
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Get-MackArchitectureReviewFlowState.ps1"
      sha256 = Get-Sha256FileOrEmpty $StatePath
    },
    [ordered]@{
      path = "scripts/foreman/Test-MackArchitectureReviewFlowState.ps1"
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
    "no canonical next-build packet generated",
    "no Mack receipt claim for canonical intake",
    "no Ben acceptance claim for canonical intake"
  )
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReceiptPath) | Out-Null
$receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8

[ordered]@{
  ok = $true
  status = $receipt.status
  receipt_path = Convert-ToRepoRelative $ReceiptPath
  receipt_sha256 = Get-Sha256FileOrEmpty $ReceiptPath
  waiting_state_blocks = $true
  incomplete_state_blocks = $true
  complete_state_points_to_acceptance_dry_run = $true
  next_build_state_detects_existing_packet = $true
  canonical_intake_unchanged = $true
  canonical_next_build_exists = $canonicalNextBuildAfterExists
} | ConvertTo-Json -Depth 8
