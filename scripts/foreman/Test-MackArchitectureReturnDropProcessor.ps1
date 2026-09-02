$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$ProcessorPath = Join-Path $Repo "scripts\foreman\Process-MackArchitectureReturnDrop.ps1"
$ReceivePath = Join-Path $Repo "scripts\foreman\Receive-MackArchitectureReturn.ps1"
$CanonicalIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
$CanonicalNextBuildPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_NEXT_BUILD_PACKET_FROM_RETURN_20260706.md"
$DropReadmePath = Join-Path $Repo "foreman\handoffs\inbox\mack-architecture-return-drop\README.md"
$SmokeRoot = Join-Path $Repo "foreman\tmp\mack-return-drop-processor-smoke"
$ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_RETURN_DROP_PROCESSOR_SMOKE_RECEIPT_20260706.json"

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

function Invoke-DropScenario(
  [string]$Name,
  [switch]$Commit,
  [switch]$PopulateDrop,
  [switch]$IncludeOlderDistractor
) {
  $scenarioDir = New-SmokePath $Name
  $dropDir = Join-Path $scenarioDir "drop"
  $intakePath = Join-Path $scenarioDir "intake.md"
  $receiptPath = Join-Path $scenarioDir "drop-receipt.json"
  New-Item -ItemType Directory -Force -Path $dropDir | Out-Null
  Copy-Item -LiteralPath $CanonicalIntakePath -Destination $intakePath

  if ($IncludeOlderDistractor) {
    $oldPath = Join-Path $dropDir "older-unstructured.txt"
    Set-Content -LiteralPath $oldPath -Value "This is older and not structured." -Encoding UTF8
    (Get-Item -LiteralPath $oldPath).LastWriteTimeUtc = (Get-Date).ToUniversalTime().AddMinutes(-20)
  }
  if ($PopulateDrop) {
    $returnPath = Join-Path $dropDir "mack-return-latest.md"
    Set-Content -LiteralPath $returnPath -Value (New-StructuredReturnText) -Encoding UTF8
    (Get-Item -LiteralPath $returnPath).LastWriteTimeUtc = (Get-Date).ToUniversalTime()
  }

  $beforeHash = Get-Sha256FileOrEmpty $intakePath
  $args = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $ProcessorPath,
    "-DropDir",
    $dropDir,
    "-IntakePath",
    $intakePath,
    "-ReceiptPath",
    $receiptPath
  )
  if ($Commit) { $args += "-Commit" }

  $stdout = & powershell.exe @args 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Drop processor scenario failed: $Name / $($stdout | Out-String)"
  }
  Assert-Pass (Test-Path -LiteralPath $receiptPath) "Drop processor receipt missing for $Name"
  $result = ($stdout | Out-String).Trim() | ConvertFrom-Json
  $receipt = Get-Content -Raw -LiteralPath $receiptPath | ConvertFrom-Json
  $afterHash = Get-Sha256FileOrEmpty $intakePath

  return [ordered]@{
    name = $Name
    status = $result.status
    blocker_code = $result.blocker_code
    candidates_seen = $result.candidates_seen
    selected_drop_file = $result.selected_drop_file
    commit_requested = $result.commit_requested
    receive_status = $result.receive_status
    receive_receipt_path = $result.receive_receipt_path
    canonical_next_build_exists = $result.canonical_next_build_exists
    intake_changed = $beforeHash -ne $afterHash
    import_committed = if ($receipt.receive_readback) { $receipt.receive_readback.import_committed } else { $false }
    validator_status = if ($receipt.receive_readback) { $receipt.receive_readback.validator_status } else { "" }
    no_clipboard_read = $receipt.validation.no_clipboard_read
    newest_txt_or_md_selected = $receipt.validation.newest_txt_or_md_selected
    receipt_path = Convert-ToRepoRelative $receiptPath
    receipt_hash = Get-Sha256FileOrEmpty $receiptPath
  }
}

foreach ($required in @($ProcessorPath, $ReceivePath, $CanonicalIntakePath, $DropReadmePath)) {
  Assert-Pass (Test-Path -LiteralPath $required) "Required path missing: $required"
}

$smokeRootFull = [System.IO.Path]::GetFullPath($SmokeRoot)
$allowedRoot = [System.IO.Path]::GetFullPath((Join-Path $Repo "foreman\tmp"))
Assert-Pass ($smokeRootFull.StartsWith($allowedRoot, [System.StringComparison]::OrdinalIgnoreCase)) "Smoke root outside foreman tmp."

if (Test-Path -LiteralPath $SmokeRoot) {
  Remove-Item -LiteralPath $SmokeRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $SmokeRoot | Out-Null

$canonicalBeforeHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$nextBuildBeforeExists = Test-Path -LiteralPath $CanonicalNextBuildPath
$nextBuildBeforeHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath

$readbacks = @()
$readbacks += Invoke-DropScenario -Name "empty-drop"
$readbacks += Invoke-DropScenario -Name "structured-dry-run" -PopulateDrop -IncludeOlderDistractor
$readbacks += Invoke-DropScenario -Name "structured-commit" -PopulateDrop -Commit

$empty = $readbacks | Where-Object { $_.name -eq "empty-drop" } | Select-Object -First 1
$dryRun = $readbacks | Where-Object { $_.name -eq "structured-dry-run" } | Select-Object -First 1
$commit = $readbacks | Where-Object { $_.name -eq "structured-commit" } | Select-Object -First 1

Assert-Pass ($empty.status -eq "BLOCKER") "Empty drop did not block."
Assert-Pass ($empty.blocker_code -eq "MACK_RETURN_DROP_EMPTY") "Empty drop blocker mismatch."
Assert-Pass ($dryRun.status -eq "ARTIFACT") "Structured dry-run was not ARTIFACT."
Assert-Pass ($dryRun.intake_changed -eq $false) "Structured dry-run changed fixture intake."
Assert-Pass ($dryRun.selected_drop_file -like "*mack-return-latest.md") "Structured dry-run did not select newest drop file."
Assert-Pass ($dryRun.no_clipboard_read -eq $true) "Structured dry-run read clipboard."
Assert-Pass ($commit.status -eq "ARTIFACT") "Structured commit was not ARTIFACT."
Assert-Pass ($commit.import_committed -eq $true) "Structured commit did not import."
Assert-Pass ($commit.validator_status -eq "ARTIFACT") "Structured commit validator was not ARTIFACT."
Assert-Pass ($commit.intake_changed -eq $true) "Structured commit did not change fixture intake."

$canonicalAfterHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$nextBuildAfterExists = Test-Path -LiteralPath $CanonicalNextBuildPath
$nextBuildAfterHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath
Assert-Pass ($canonicalBeforeHash -eq $canonicalAfterHash) "Canonical intake changed during drop processor smoke."
Assert-Pass ($nextBuildBeforeExists -eq $nextBuildAfterExists) "Canonical next-build existence changed during drop processor smoke."
Assert-Pass ($nextBuildBeforeHash -eq $nextBuildAfterHash) "Canonical next-build hash changed during drop processor smoke."
Assert-Pass (-not $nextBuildAfterExists) "Canonical next-build packet exists after drop processor smoke."

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_RETURN_DROP_PROCESSOR_SMOKE_RECEIPT"
  status = "ARTIFACT"
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_RETURN_DROP_PROCESSOR_SMOKE_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Test-MackArchitectureReturnDropProcessor.ps1"
  validation = [ordered]@{
    empty_drop_blocks = $true
    structured_dry_run_selects_newest_and_does_not_write = $true
    structured_commit_writes_fixture_and_validates = $true
    real_clipboard_not_read = $true
    canonical_intake_not_mutated = $true
    canonical_next_build_packet_absence_preserved = -not $nextBuildAfterExists
    external_send_not_claimed = $true
    mack_return_not_claimed_for_canonical_intake = $true
    truth_boundary = "This smoke proves the local return drop processor with fixture drop files only. It does not read the real clipboard, does not mutate the canonical intake, does not write the canonical next-build packet, and does not claim Mack returned review."
  }
  readbacks = $readbacks
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Process-MackArchitectureReturnDrop.ps1"
      sha256 = Get-Sha256FileOrEmpty $ProcessorPath
    },
    [ordered]@{
      path = "scripts/foreman/Receive-MackArchitectureReturn.ps1"
      sha256 = Get-Sha256FileOrEmpty $ReceivePath
    },
    [ordered]@{
      path = "scripts/foreman/Test-MackArchitectureReturnDropProcessor.ps1"
      sha256 = Get-Sha256FileOrEmpty $PSCommandPath
    },
    [ordered]@{
      path = "foreman/handoffs/inbox/mack-architecture-return-drop/README.md"
      sha256 = Get-Sha256FileOrEmpty $DropReadmePath
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
  receipt_sha256 = Get-Sha256FileOrEmpty $ReceiptPath
  empty_drop_blocks = $true
  structured_dry_run_selects_newest_and_does_not_write = $true
  structured_commit_validates = $true
  canonical_intake_unchanged = $true
  canonical_next_build_exists = $nextBuildAfterExists
} | ConvertTo-Json -Depth 8
