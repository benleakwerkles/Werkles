$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$CopyHelperPath = Join-Path $Repo "scripts\foreman\Copy-MackArchitecturePasteBlock.ps1"
$ImporterPath = Join-Path $Repo "scripts\foreman\Import-MackArchitectureReturnFromClipboard.ps1"
$ValidatorPath = Join-Path $Repo "scripts\foreman\mack-architecture-return-intake-validator.mjs"
$PastePacketPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.md"
$CanonicalIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
$CanonicalNextBuildPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_NEXT_BUILD_PACKET_FROM_RETURN_20260706.md"
$SmokeRoot = Join-Path $Repo "foreman\tmp\mack-send-return-roundtrip-smoke"
$ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_SEND_RETURN_ROUNDTRIP_SMOKE_RECEIPT_20260706.json"

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

foreach ($required in @($CopyHelperPath, $ImporterPath, $ValidatorPath, $PastePacketPath, $CanonicalIntakePath)) {
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

$copyReceiptPath = New-SmokePath "copy-helper-receipt.json"
$copyStdout = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $CopyHelperPath -SourcePath $PastePacketPath -ReceiptPath $copyReceiptPath 2>&1
if ($LASTEXITCODE -ne 0) {
  throw "Copy helper dry-run failed: $copyStdout"
}
$copyReadback = $copyStdout | ConvertFrom-Json
$copyReceipt = Get-Content -Raw -LiteralPath $copyReceiptPath | ConvertFrom-Json
Assert-Pass ($copyReadback.copy_committed -eq $false) "Copy helper dry-run committed unexpectedly."
Assert-Pass ($copyReceipt.validation.clipboard_write_requires_copy_switch -eq $true) "Copy helper receipt lost explicit copy switch."
Assert-Pass ($copyReceipt.block_line_count -ge 60) "Copy helper block line count unexpectedly low."

$fixtureReturnPath = New-SmokePath "mack-return.txt"
$fixtureIntakePath = New-SmokePath "intake.md"
$importReceiptPath = New-SmokePath "import-receipt.json"
Copy-Item -LiteralPath $CanonicalIntakePath -Destination $fixtureIntakePath

$fixtureReturn = @"
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
"@
Set-Content -LiteralPath $fixtureReturnPath -Value $fixtureReturn -Encoding UTF8

$importStdout = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $ImporterPath -InputPath $fixtureReturnPath -IntakePath $fixtureIntakePath -ReceiptPath $importReceiptPath -Commit 2>&1
if ($LASTEXITCODE -ne 0) {
  throw "Return importer fixture commit failed: $importStdout"
}
$importReadback = $importStdout | ConvertFrom-Json
$importReceipt = Get-Content -Raw -LiteralPath $importReceiptPath | ConvertFrom-Json
$validatorReceiptPath = [System.IO.Path]::ChangeExtension($importReceiptPath, ".validator.json")
Assert-Pass ($importReadback.status -eq "ARTIFACT") "Importer fixture status was not ARTIFACT."
Assert-Pass ($importReadback.import_committed -eq $true) "Importer fixture did not commit."
Assert-Pass ($importReadback.structured_return_detected -eq $true) "Importer fixture did not detect structured return."
Assert-Pass (Test-Path -LiteralPath $validatorReceiptPath) "Fixture validator receipt missing."
$validatorReceipt = Get-Content -Raw -LiteralPath $validatorReceiptPath | ConvertFrom-Json
Assert-Pass ($validatorReceipt.status -eq "ARTIFACT") "Fixture validator receipt was not ARTIFACT."
Assert-Pass ($validatorReceipt.classification.status -eq "ARTIFACT_READY") "Fixture validator classification was not ARTIFACT_READY."

$canonicalAfterHash = Get-Sha256File $CanonicalIntakePath
$nextBuildAfterExists = Test-Path -LiteralPath $CanonicalNextBuildPath
Assert-Pass ($canonicalBeforeHash -eq $canonicalAfterHash) "Canonical intake changed during send/return smoke."
Assert-Pass ($nextBuildBeforeExists -eq $nextBuildAfterExists) "Canonical next-build packet existence changed during smoke."

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_SEND_RETURN_ROUNDTRIP_SMOKE_RECEIPT"
  status = "ARTIFACT"
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_SEND_RETURN_ROUNDTRIP_SMOKE_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Test-MackArchitectureSendReturnRoundTrip.ps1"
  validation = [ordered]@{
    outbound_copy_helper_dry_run_passed = $true
    outbound_copy_helper_did_not_touch_clipboard = $true
    return_importer_fixture_commit_passed = $true
    return_validator_fixture_artifact_ready = $true
    canonical_intake_not_mutated = $true
    canonical_next_build_packet_absence_preserved = -not $nextBuildAfterExists
    external_send_not_claimed = $true
    mack_return_not_claimed_for_canonical_intake = $true
    truth_boundary = "This smoke proves the local send/return mechanics with fixture files only. It does not send anything to Mack, does not touch the real clipboard, does not mutate the canonical intake, and does not claim Mack returned review."
  }
  fixture_readback = [ordered]@{
    copy_helper_receipt = Convert-ToRepoRelative $copyReceiptPath
    copy_block_sha256 = $copyReceipt.block_sha256
    copy_block_line_count = $copyReceipt.block_line_count
    fixture_return_path = Convert-ToRepoRelative $fixtureReturnPath
    fixture_intake_path = Convert-ToRepoRelative $fixtureIntakePath
    import_receipt = Convert-ToRepoRelative $importReceiptPath
    validator_receipt = Convert-ToRepoRelative $validatorReceiptPath
    validator_status = $validatorReceipt.status
    validator_classification = $validatorReceipt.classification.status
  }
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Copy-MackArchitecturePasteBlock.ps1"
      sha256 = Get-Sha256File $CopyHelperPath
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
      path = "scripts/foreman/Test-MackArchitectureSendReturnRoundTrip.ps1"
      sha256 = Get-Sha256File $PSCommandPath
    },
    [ordered]@{
      path = "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.md"
      sha256 = Get-Sha256File $PastePacketPath
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
    "no real clipboard mutation",
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
  copy_block_line_count = $copyReceipt.block_line_count
  importer_status = $importReadback.status
  validator_status = $validatorReceipt.status
  validator_classification = $validatorReceipt.classification.status
  canonical_intake_unchanged = $true
  canonical_next_build_exists = $nextBuildAfterExists
} | ConvertTo-Json -Depth 8
