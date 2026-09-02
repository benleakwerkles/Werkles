$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$ImporterPath = Join-Path $Repo "scripts\foreman\Import-MackArchitectureReturnFromClipboard.ps1"
$CanonicalIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
$SmokeRoot = Join-Path $Repo "foreman\tmp\mack-return-clipboard-importer-smoke"
$ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_RETURN_CLIPBOARD_IMPORT_SMOKE_RECEIPT_20260706.json"

function Assert-Pass([bool]$Condition, [string]$Message) {
  if (-not $Condition) {
    throw $Message
  }
}

function Get-Sha256File([string]$PathValue) {
  return (Get-FileHash -LiteralPath $PathValue -Algorithm SHA256).Hash
}

function To-RepoRelative([string]$PathValue) {
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

function Invoke-ImporterScenario(
  [string]$Name,
  [string]$InputText,
  [switch]$Commit,
  [switch]$AllowFreeform
) {
  $scenarioDir = New-SmokePath $Name
  New-Item -ItemType Directory -Force -Path $scenarioDir | Out-Null
  $inputPath = Join-Path $scenarioDir "mack-return.txt"
  $intakePath = Join-Path $scenarioDir "intake.md"
  $receiptPath = Join-Path $scenarioDir "import-receipt.json"
  Copy-Item -LiteralPath $CanonicalIntakePath -Destination $intakePath
  Set-Content -LiteralPath $inputPath -Value $InputText -Encoding UTF8

  $args = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $ImporterPath,
    "-InputPath",
    $inputPath,
    "-IntakePath",
    $intakePath,
    "-ReceiptPath",
    $receiptPath
  )
  if ($Commit) { $args += "-Commit" }
  if ($AllowFreeform) { $args += "-AllowFreeform" }

  $stdout = & powershell.exe @args
  if ($LASTEXITCODE -ne 0) {
    throw "Importer scenario failed: $Name / $stdout"
  }
  Assert-Pass (Test-Path -LiteralPath $receiptPath) "Importer receipt missing for $Name"
  $result = $stdout | ConvertFrom-Json
  $receipt = Get-Content -Raw -LiteralPath $receiptPath | ConvertFrom-Json
  $validatorReceiptPath = [System.IO.Path]::ChangeExtension($receiptPath, ".validator.json")

  return [ordered]@{
    name = $Name
    status = $result.status
    blocker_code = $result.blocker_code
    structured_return_detected = $result.structured_return_detected
    import_committed = $result.import_committed
    receipt_path = To-RepoRelative $receiptPath
    receipt_hash = Get-Sha256File $receiptPath
    intake_hash = Get-Sha256File $intakePath
    validator_receipt_exists = Test-Path -LiteralPath $validatorReceiptPath
    validator_receipt_path = if (Test-Path -LiteralPath $validatorReceiptPath) { To-RepoRelative $validatorReceiptPath } else { $null }
    validator_status = if ($receipt.validator_readback) { $receipt.validator_readback.status } else { $null }
    validator_blocker_code = if ($receipt.validator_readback) { $receipt.validator_readback.blocker_code } else { $null }
  }
}

Assert-Pass (Test-Path -LiteralPath $ImporterPath) "Importer missing."
Assert-Pass (Test-Path -LiteralPath $CanonicalIntakePath) "Canonical intake missing."

$smokeRootFull = [System.IO.Path]::GetFullPath($SmokeRoot)
$allowedRoot = [System.IO.Path]::GetFullPath((Join-Path $Repo "foreman\tmp"))
Assert-Pass ($smokeRootFull.StartsWith($allowedRoot, [System.StringComparison]::OrdinalIgnoreCase)) "Smoke root outside foreman tmp."

if (Test-Path -LiteralPath $SmokeRoot) {
  Remove-Item -LiteralPath $SmokeRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $SmokeRoot | Out-Null

$canonicalBeforeHash = Get-Sha256File $CanonicalIntakePath

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
$readbacks += Invoke-ImporterScenario -Name "empty-dry-run" -InputText ""
$readbacks += Invoke-ImporterScenario -Name "unstructured-dry-run" -InputText "This is not the Mack template."
$readbacks += Invoke-ImporterScenario -Name "structured-dry-run" -InputText $structuredReturn
$readbacks += Invoke-ImporterScenario -Name "structured-commit" -InputText $structuredReturn -Commit

$canonicalAfterHash = Get-Sha256File $CanonicalIntakePath

Assert-Pass ($canonicalBeforeHash -eq $canonicalAfterHash) "Canonical intake changed during smoke."
Assert-Pass (($readbacks | Where-Object { $_.name -eq "empty-dry-run" }).blocker_code -eq "MACK_RETURN_INPUT_EMPTY") "Empty dry run blocker mismatch."
Assert-Pass (($readbacks | Where-Object { $_.name -eq "unstructured-dry-run" }).blocker_code -eq "MACK_RETURN_NOT_STRUCTURED") "Unstructured dry run blocker mismatch."
Assert-Pass (($readbacks | Where-Object { $_.name -eq "structured-dry-run" }).import_committed -eq $false) "Structured dry run committed unexpectedly."
Assert-Pass (($readbacks | Where-Object { $_.name -eq "structured-commit" }).import_committed -eq $true) "Structured commit did not commit fixture intake."
Assert-Pass (($readbacks | Where-Object { $_.name -eq "structured-commit" }).validator_status -eq "ARTIFACT") "Structured commit validator did not return ARTIFACT."

$sourceHash = Get-Sha256File $ImporterPath
$smokeHash = Get-Sha256File $PSCommandPath
$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_RETURN_CLIPBOARD_IMPORT_SMOKE_RECEIPT"
  status = "ARTIFACT"
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_RETURN_CLIPBOARD_IMPORT_SMOKE_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Test-MackArchitectureReturnClipboardImporter.ps1"
  validation = [ordered]@{
    empty_input_blocks = $true
    unstructured_input_blocks_without_allow_freeform = $true
    structured_dry_run_does_not_write = $true
    structured_commit_writes_fixture_and_validates = $true
    canonical_intake_not_mutated = $true
    truth_boundary = "This smoke uses fixture files only. It does not read the real clipboard and does not claim Mack has returned a review."
  }
  readbacks = $readbacks
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Import-MackArchitectureReturnFromClipboard.ps1"
      sha256 = $sourceHash
    },
    [ordered]@{
      path = "scripts/foreman/Test-MackArchitectureReturnClipboardImporter.ps1"
      sha256 = $smokeHash
    }
  )
  stop_conditions_respected = @(
    "no deploy",
    "no push",
    "no secrets",
    "no production mutation",
    "no external send claim",
    "no Mack receipt claim",
    "no canonical intake mutation"
  )
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReceiptPath) | Out-Null
$receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8

[ordered]@{
  ok = $true
  receipt_path = To-RepoRelative $ReceiptPath
  receipt_sha256 = Get-Sha256File $ReceiptPath
  canonical_intake_unchanged = $true
  scenarios = $readbacks | ForEach-Object {
    [ordered]@{
      name = $_.name
      status = $_.status
      blocker_code = $_.blocker_code
      import_committed = $_.import_committed
      validator_status = $_.validator_status
    }
  }
} | ConvertTo-Json -Depth 10
