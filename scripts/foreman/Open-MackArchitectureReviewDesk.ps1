param(
  [switch]$OpenAllProof,
  [switch]$RefreshStatus,
  [switch]$CopyMackBlock,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$IndexPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\BOOK_ARCHITECTURE_REVIEW_PACKET_INDEX_20260706.md"
$StatusPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_REVIEW_DESK_STATUS_20260706.md"
$ReadoutPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.html"
$ConnectionMapPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.html"
$AttackScorecardPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.html"
$PastePacketPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.html"
$PacketPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\BOOK_ARCHITECTURE_REVIEW_PACKET_FOR_BEN_AND_MACK_20260706.html"
$HandoffPath = Join-Path $Repo "foreman\handoffs\outbox\TO_MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706.md"
$IntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
$ScorecardIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_ATTACK_SCORECARD_RETURN_INTAKE_20260706.md"
$ValidatorReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_RETURN_INTAKE_VALIDATOR_RECEIPT_20260706.json"
$ScorecardValidatorReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_RECEIPT_20260706.json"
$StatusRefreshPath = Join-Path $Repo "scripts\foreman\Update-MackArchitectureReviewDeskStatus.ps1"
$CopyHelperPath = Join-Path $Repo "scripts\foreman\Copy-MackArchitecturePasteBlock.ps1"
$CopyHelperReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_PASTE_BLOCK_CLIPBOARD_RECEIPT_20260706.json"

$RequiredPaths = @(
  $IndexPath,
  $StatusPath,
  $ReadoutPath,
  $ConnectionMapPath,
  $AttackScorecardPath,
  $PastePacketPath,
  $PacketPath,
  $HandoffPath,
  $IntakePath,
  $ScorecardIntakePath,
  $ValidatorReceiptPath,
  $ScorecardValidatorReceiptPath,
  $StatusRefreshPath,
  $CopyHelperPath
)

foreach ($Path in $RequiredPaths) {
  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Required review desk path missing: $Path"
  }
}

$ProofLinks = @(
  "http://127.0.0.1:3000/tinkerden?handoff_provenance=operator",
  "http://127.0.0.1:3000/tinkerden/receipts?handoff_provenance=operator"
)

if ($OpenAllProof) {
  $ProofLinks += @(
    "http://127.0.0.1:3000/tinkerden",
    "http://127.0.0.1:3000/tinkerden/receipts"
  )
}

$Desk = [ordered]@{
  status = "READY_TO_OPEN"
  dry_run = [bool]$DryRun
  truth_boundary = "This launcher opens local review artifacts and proof links. It refreshes local status only when -RefreshStatus is explicit, and it does not send anything to Mack or claim Mack returned a review."
  open_order = @(
    $StatusPath,
    $ReadoutPath,
    $ConnectionMapPath,
    $AttackScorecardPath,
    $PastePacketPath,
    $PacketPath,
    $IndexPath,
    $HandoffPath,
    $IntakePath,
    $ScorecardIntakePath
  )
  index = $IndexPath
  status_markdown = $StatusPath
  readout_html = $ReadoutPath
  connection_map_html = $ConnectionMapPath
  attack_scorecard_html = $AttackScorecardPath
  paste_packet_html = $PastePacketPath
  packet_html = $PacketPath
  handoff_packet = $HandoffPath
  intake = $IntakePath
  scorecard_intake = $ScorecardIntakePath
  validator_receipt = $ValidatorReceiptPath
  scorecard_validator_receipt = $ScorecardValidatorReceiptPath
  status_refresh = $StatusRefreshPath
  refresh_status_requested = [bool]$RefreshStatus
  refresh_status_committed = $false
  copy_helper = $CopyHelperPath
  copy_helper_receipt = $CopyHelperReceiptPath
  copy_mack_block_requested = [bool]$CopyMackBlock
  copy_mack_block_committed = $false
  proof_links = $ProofLinks
}

if (-not $DryRun) {
  if ($RefreshStatus) {
    $statusReadback = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $StatusRefreshPath
    if ($LASTEXITCODE -ne 0) {
      throw "Status refresh failed: $statusReadback"
    }
    $Desk.refresh_status_committed = $true
    $Desk.status_refresh_readback = $statusReadback | ConvertFrom-Json
  }

  Start-Process -FilePath $StatusPath
  Start-Process -FilePath $ReadoutPath
  Start-Process -FilePath $ConnectionMapPath
  Start-Process -FilePath $AttackScorecardPath
  Start-Process -FilePath $PastePacketPath
  Start-Process -FilePath $PacketPath
  Start-Process -FilePath $IndexPath
  Start-Process -FilePath $HandoffPath
  Start-Process -FilePath $IntakePath
  Start-Process -FilePath $ScorecardIntakePath

  foreach ($Link in $ProofLinks) {
    Start-Process -FilePath $Link
  }

  if ($CopyMackBlock) {
    $copyReadback = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $CopyHelperPath -Copy
    if ($LASTEXITCODE -ne 0) {
      throw "Copy helper failed: $copyReadback"
    }
    $Desk.copy_mack_block_committed = $true
    $Desk.copy_helper_readback = $copyReadback | ConvertFrom-Json
  }
}

$Desk | ConvertTo-Json -Depth 5
