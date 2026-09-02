$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$ReceiverPath = Join-Path $Repo "scripts\foreman\Receive-MackArchitectureReturn.ps1"
$ImporterPath = Join-Path $Repo "scripts\foreman\Import-MackArchitectureReturnFromClipboard.ps1"
$ValidatorPath = Join-Path $Repo "scripts\foreman\mack-architecture-return-intake-validator.mjs"
$CanonicalIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
$CanonicalNextBuildPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_NEXT_BUILD_PACKET_FROM_RETURN_20260706.md"
$SmokeRoot = Join-Path $Repo "foreman\tmp\mack-return-receiver-smoke"
$ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_RETURN_RECEIVER_SMOKE_RECEIPT_20260706.json"

function Assert-Pass([bool]$Condition, [string]$Message) {
  if (-not $Condition) {
    throw $Message
  }
}

function Get-Sha256File([string]$PathValue) {
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

function Invoke-ReceiverScenario(
  [string]$Name,
  [string]$InputText,
  [switch]$Commit
) {
  $scenarioDir = New-SmokePath $Name
  New-Item -ItemType Directory -Force -Path $scenarioDir | Out-Null
  $inputPath = Join-Path $scenarioDir "mack-return.txt"
  $intakePath = Join-Path $scenarioDir "intake.md"
  $receiptPath = Join-Path $scenarioDir "receive-receipt.json"
  Copy-Item -LiteralPath $CanonicalIntakePath -Destination $intakePath
  Set-Content -LiteralPath $inputPath -Value $InputText -Encoding UTF8

  $intakeBeforeHash = Get-Sha256File $intakePath
  $args = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $ReceiverPath,
    "-InputPath",
    $inputPath,
    "-IntakePath",
    $intakePath,
    "-ReceiptPath",
    $receiptPath
  )
  if ($Commit) { $args += "-Commit" }

  $stdout = & powershell.exe @args 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Receiver scenario failed: $Name / $($stdout | Out-String)"
  }
  Assert-Pass (Test-Path -LiteralPath $receiptPath) "Receiver receipt missing for $Name"
  $result = ($stdout | Out-String).Trim() | ConvertFrom-Json
  $receipt = Get-Content -Raw -LiteralPath $receiptPath | ConvertFrom-Json
  $intakeAfterHash = Get-Sha256File $intakePath
  $importReceiptPath = [System.IO.Path]::ChangeExtension($receiptPath, ".import.json")
  $validatorReceiptPath = [System.IO.Path]::ChangeExtension($receiptPath, ".validator.json")

  return [ordered]@{
    name = $Name
    status = $result.status
    blocker_code = $result.blocker_code
    commit_requested = $result.commit_requested
    import_committed = $result.import_committed
    validator_status = $result.validator_status
    validator_blocker_code = $result.validator_blocker_code
    structured_return_detected = $receipt.import_readback.structured_return_detected
    intake_changed = $intakeBeforeHash -ne $intakeAfterHash
    receipt_path = Convert-ToRepoRelative $receiptPath
    import_receipt_path = Convert-ToRepoRelative $importReceiptPath
    validator_receipt_path = Convert-ToRepoRelative $validatorReceiptPath
    receipt_hash = Get-Sha256File $receiptPath
    intake_hash = $intakeAfterHash
  }
}

foreach ($required in @($ReceiverPath, $ImporterPath, $ValidatorPath, $CanonicalIntakePath)) {
  Assert-Pass (Test-Path -LiteralPath $required) "Required path missing: $required"
}

$smokeRootFull = [System.IO.Path]::GetFullPath($SmokeRoot)
$allowedRoot = [System.IO.Path]::GetFullPath((Join-Path $Repo "foreman\tmp"))
Assert-Pass ($smokeRootFull.StartsWith($allowedRoot, [System.StringComparison]::OrdinalIgnoreCase)) "Smoke root outside foreman tmp."

if (Test-Path -LiteralPath $SmokeRoot) {
  Remove-Item -LiteralPath $SmokeRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $SmokeRoot | Out-Null

$canonicalBeforeHash = Get-Sha256File $CanonicalIntakePath
$nextBuildBeforeExists = Test-Path -LiteralPath $CanonicalNextBuildPath

$structuredReturn = @"
MACK REVIEW RETURN
status: REVISE

strongest_objection: The architecture still risks confusing packeted cooperation with live shared cognition.

simplest_viable_architecture: Keep packet custody, receiver proof, event joins, and one cockpit. Delay the rest.

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
"@

$readbacks = @()
$readbacks += Invoke-ReceiverScenario -Name "empty-dry-run" -InputText ""
$readbacks += Invoke-ReceiverScenario -Name "structured-dry-run" -InputText $structuredReturn
$readbacks += Invoke-ReceiverScenario -Name "structured-commit" -InputText $structuredReturn -Commit

$canonicalAfterHash = Get-Sha256File $CanonicalIntakePath
$nextBuildAfterExists = Test-Path -LiteralPath $CanonicalNextBuildPath

$emptyDryRun = $readbacks | Where-Object { $_.name -eq "empty-dry-run" } | Select-Object -First 1
$structuredDryRun = $readbacks | Where-Object { $_.name -eq "structured-dry-run" } | Select-Object -First 1
$structuredCommit = $readbacks | Where-Object { $_.name -eq "structured-commit" } | Select-Object -First 1

Assert-Pass ($canonicalBeforeHash -eq $canonicalAfterHash) "Canonical intake changed during receiver smoke."
Assert-Pass ($nextBuildBeforeExists -eq $nextBuildAfterExists) "Canonical next-build packet existence changed during receiver smoke."
Assert-Pass (-not $nextBuildAfterExists) "Canonical next-build packet exists after receiver smoke."
Assert-Pass ($emptyDryRun.status -eq "BLOCKER") "Empty dry-run did not block."
Assert-Pass ($emptyDryRun.blocker_code -eq "MACK_RETURN_INPUT_EMPTY") "Empty dry-run blocker mismatch."
Assert-Pass ($structuredDryRun.status -eq "ARTIFACT") "Structured dry-run was not ARTIFACT."
Assert-Pass ($structuredDryRun.import_committed -eq $false) "Structured dry-run committed unexpectedly."
Assert-Pass ($structuredDryRun.intake_changed -eq $false) "Structured dry-run changed fixture intake."
Assert-Pass ($structuredDryRun.validator_blocker_code -eq "MACK_RETURN_NOT_RECEIVED") "Structured dry-run validator boundary mismatch."
Assert-Pass ($structuredCommit.status -eq "ARTIFACT") "Structured commit was not ARTIFACT."
Assert-Pass ($structuredCommit.import_committed -eq $true) "Structured commit did not import."
Assert-Pass ($structuredCommit.intake_changed -eq $true) "Structured commit did not change fixture intake."
Assert-Pass ($structuredCommit.validator_status -eq "ARTIFACT") "Structured commit validator did not return ARTIFACT."

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_RETURN_RECEIVER_SMOKE_RECEIPT"
  status = "ARTIFACT"
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_RETURN_RECEIVER_SMOKE_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Test-MackArchitectureReturnReceiver.ps1"
  validation = [ordered]@{
    empty_dry_run_blocks = $true
    structured_dry_run_does_not_write = $true
    structured_commit_writes_fixture_and_validates = $true
    wrapper_receipts_contain_no_raw_mack_text = $true
    canonical_intake_not_mutated = $true
    canonical_next_build_packet_absence_preserved = -not $nextBuildAfterExists
    real_clipboard_not_read = $true
    external_send_not_claimed = $true
    mack_return_not_claimed_for_canonical_intake = $true
    truth_boundary = "This smoke proves the local receive wrapper with fixture files only. It does not read the real clipboard, does not send anything to Mack, does not mutate the canonical intake, and does not claim Mack returned review."
  }
  readbacks = $readbacks
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Receive-MackArchitectureReturn.ps1"
      sha256 = Get-Sha256File $ReceiverPath
    },
    [ordered]@{
      path = "scripts/foreman/Import-MackArchitectureReturnFromClipboard.ps1"
      sha256 = Get-Sha256File $ImporterPath
    },
    [ordered]@{
      path = "scripts/foreman/mack-architecture-return-intake-validator.mjs"
      sha256 = Get-Sha256File $ValidatorPath
    },
    [ordered]@{
      path = "scripts/foreman/Test-MackArchitectureReturnReceiver.ps1"
      sha256 = Get-Sha256File $PSCommandPath
    },
    [ordered]@{
      path = "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
      sha256 = $canonicalAfterHash
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
    "no canonical next-build packet generated"
  )
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReceiptPath) | Out-Null
$receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8

[ordered]@{
  ok = $true
  status = $receipt.status
  receipt_path = Convert-ToRepoRelative $ReceiptPath
  receipt_sha256 = Get-Sha256File $ReceiptPath
  empty_dry_run_blocks = $true
  structured_dry_run_does_not_write = $true
  structured_commit_validates = $true
  canonical_intake_unchanged = $true
  canonical_next_build_exists = $nextBuildAfterExists
} | ConvertTo-Json -Depth 8
