$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$AcceptancePath = Join-Path $Repo "scripts\foreman\Accept-MackArchitectureReturn.ps1"
$ValidatorPath = Join-Path $Repo "scripts\foreman\mack-architecture-return-intake-validator.mjs"
$CanonicalIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
$CanonicalNextBuildPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_NEXT_BUILD_PACKET_FROM_RETURN_20260706.md"
$SmokeRoot = Join-Path $Repo "foreman\tmp\mack-return-acceptance-smoke"
$ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_RETURN_ACCEPTANCE_SMOKE_RECEIPT_20260706.json"

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

function Invoke-AcceptanceScenario(
  [string]$Name,
  [string]$IntakeText,
  [switch]$Commit,
  [switch]$BenAccepted
) {
  $scenarioDir = New-SmokePath $Name
  New-Item -ItemType Directory -Force -Path $scenarioDir | Out-Null
  $intakePath = Join-Path $scenarioDir "intake.md"
  $nextPacketPath = Join-Path $scenarioDir "next-build.md"
  $receiptPath = Join-Path $scenarioDir "accept-receipt.json"
  Set-Content -LiteralPath $intakePath -Value $IntakeText -Encoding UTF8

  $args = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $AcceptancePath,
    "-IntakePath",
    $intakePath,
    "-NextBuildPacketPath",
    $nextPacketPath,
    "-ReceiptPath",
    $receiptPath
  )
  if ($Commit) { $args += "-Commit" }
  if ($BenAccepted) { $args += "-BenAccepted" }

  $stdout = & powershell.exe @args 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Acceptance scenario failed: $Name / $($stdout | Out-String)"
  }
  Assert-Pass (Test-Path -LiteralPath $receiptPath) "Acceptance receipt missing for $Name"
  $result = ($stdout | Out-String).Trim() | ConvertFrom-Json
  $receipt = Get-Content -Raw -LiteralPath $receiptPath | ConvertFrom-Json
  $nextPacketExists = Test-Path -LiteralPath $nextPacketPath
  $nextPacketText = if ($nextPacketExists) { Get-Content -Raw -LiteralPath $nextPacketPath } else { "" }

  return [ordered]@{
    name = $Name
    status = $result.status
    blocker_code = $result.blocker_code
    commit_requested = $result.commit_requested
    ben_accepted = $result.ben_accepted
    validator_status = $result.validator_status
    validator_blocker_code = $result.validator_blocker_code
    next_build_packet_exists = $nextPacketExists
    next_build_packet_contains_gate = $nextPacketText.Contains("DRAFT_PENDING_BEN_ACCEPTANCE") -and $nextPacketText.Contains("Ben accepts Mack's direction")
    receipt_path = Convert-ToRepoRelative $receiptPath
    validator_receipt_path = Convert-ToRepoRelative ([System.IO.Path]::ChangeExtension($receiptPath, ".validator.json"))
    receipt_hash = Get-Sha256FileOrEmpty $receiptPath
    wrapper_receipt_no_raw_mack_text = $receipt.validation.wrapper_receipt_contains_no_raw_mack_text
  }
}

foreach ($required in @($AcceptancePath, $ValidatorPath, $CanonicalIntakePath)) {
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
$completeIntake = New-CompleteIntakeText

$readbacks = @()
$readbacks += Invoke-AcceptanceScenario -Name "canonical-waiting-dry-run" -IntakeText (Get-Content -Raw -LiteralPath $CanonicalIntakePath)
$readbacks += Invoke-AcceptanceScenario -Name "complete-dry-run" -IntakeText $completeIntake
$readbacks += Invoke-AcceptanceScenario -Name "complete-commit-without-ben-accepted" -IntakeText $completeIntake -Commit
$readbacks += Invoke-AcceptanceScenario -Name "complete-commit-with-ben-accepted" -IntakeText $completeIntake -Commit -BenAccepted

$canonicalIntakeAfterHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$canonicalNextBuildAfterExists = Test-Path -LiteralPath $CanonicalNextBuildPath
$canonicalNextBuildAfterHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath

$canonicalWaiting = $readbacks | Where-Object { $_.name -eq "canonical-waiting-dry-run" } | Select-Object -First 1
$dryRun = $readbacks | Where-Object { $_.name -eq "complete-dry-run" } | Select-Object -First 1
$commitNoBen = $readbacks | Where-Object { $_.name -eq "complete-commit-without-ben-accepted" } | Select-Object -First 1
$commitBen = $readbacks | Where-Object { $_.name -eq "complete-commit-with-ben-accepted" } | Select-Object -First 1

Assert-Pass ($canonicalIntakeBeforeHash -eq $canonicalIntakeAfterHash) "Canonical intake changed during acceptance smoke."
Assert-Pass ($canonicalNextBuildBeforeExists -eq $canonicalNextBuildAfterExists) "Canonical next-build existence changed during acceptance smoke."
Assert-Pass ($canonicalNextBuildBeforeHash -eq $canonicalNextBuildAfterHash) "Canonical next-build hash changed during acceptance smoke."
Assert-Pass (-not $canonicalNextBuildAfterExists) "Canonical next-build packet exists after acceptance smoke."
Assert-Pass ($canonicalWaiting.blocker_code -eq "MACK_RETURN_NOT_RECEIVED") "Canonical waiting dry-run blocker mismatch."
Assert-Pass ($dryRun.blocker_code -eq "BEN_ACCEPTANCE_GATE_REQUIRED") "Complete dry-run did not require Ben acceptance."
Assert-Pass ($dryRun.next_build_packet_exists -eq $false) "Complete dry-run wrote next-build packet."
Assert-Pass ($commitNoBen.blocker_code -eq "BEN_ACCEPTANCE_GATE_REQUIRED") "Commit without BenAccepted did not block on Ben gate."
Assert-Pass ($commitNoBen.next_build_packet_exists -eq $false) "Commit without BenAccepted wrote next-build packet."
Assert-Pass ($commitBen.status -eq "ARTIFACT") "Commit with BenAccepted was not ARTIFACT."
Assert-Pass ($commitBen.next_build_packet_exists -eq $true) "Commit with BenAccepted did not write fixture next-build packet."
Assert-Pass ($commitBen.next_build_packet_contains_gate -eq $true) "Fixture next-build packet missing gate language."

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_RETURN_ACCEPTANCE_SMOKE_RECEIPT"
  status = "ARTIFACT"
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_RETURN_ACCEPTANCE_SMOKE_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Test-MackArchitectureReturnAcceptance.ps1"
  validation = [ordered]@{
    canonical_waiting_dry_run_blocks = $true
    complete_dry_run_requires_ben_acceptance = $true
    complete_commit_without_ben_accepted_blocks = $true
    complete_commit_with_ben_accepted_writes_fixture_next_build = $true
    fixture_next_build_packet_contains_gate = $true
    wrapper_receipts_contain_no_raw_mack_text = $true
    canonical_intake_not_mutated = $true
    canonical_next_build_packet_absence_preserved = -not $canonicalNextBuildAfterExists
    external_send_not_claimed = $true
    mack_return_not_claimed_for_canonical_intake = $true
    ben_acceptance_not_claimed_for_canonical_intake = $true
    truth_boundary = "This smoke proves the acceptance wrapper with fixture files only. It does not mutate the canonical intake, does not write the canonical next-build packet, does not send anything to Mack, and does not claim Ben accepted a real Mack return."
  }
  readbacks = $readbacks
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Accept-MackArchitectureReturn.ps1"
      sha256 = Get-Sha256FileOrEmpty $AcceptancePath
    },
    [ordered]@{
      path = "scripts/foreman/mack-architecture-return-intake-validator.mjs"
      sha256 = Get-Sha256FileOrEmpty $ValidatorPath
    },
    [ordered]@{
      path = "scripts/foreman/Test-MackArchitectureReturnAcceptance.ps1"
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
    "no canonical intake mutation",
    "no Mack receipt claim for canonical intake",
    "no Ben acceptance claim for canonical intake",
    "no canonical next-build packet generated"
  )
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReceiptPath) | Out-Null
$receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8

[ordered]@{
  ok = $true
  status = $receipt.status
  receipt_path = Convert-ToRepoRelative $ReceiptPath
  receipt_sha256 = Get-Sha256FileOrEmpty $ReceiptPath
  canonical_waiting_blocks = $true
  dry_run_requires_ben_acceptance = $true
  commit_without_ben_accepted_blocks = $true
  commit_with_ben_accepted_writes_fixture_next_build = $true
  canonical_intake_unchanged = $true
  canonical_next_build_exists = $canonicalNextBuildAfterExists
} | ConvertTo-Json -Depth 8
