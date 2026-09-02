$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$LauncherPath = Join-Path $Repo "scripts\foreman\Open-MackArchitectureReviewDesk.ps1"
$StatusRefreshPath = Join-Path $Repo "scripts\foreman\Update-MackArchitectureReviewDeskStatus.ps1"
$StatusPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_REVIEW_DESK_STATUS_20260706.md"
$ConnectionMapPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.html"
$AttackScorecardPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.html"
$ScorecardIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_ATTACK_SCORECARD_RETURN_INTAKE_20260706.md"
$StatusReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_REVIEW_DESK_STATUS_REFRESH_RECEIPT_20260706.json"
$ScorecardValidatorReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_RECEIPT_20260706.json"
$CopyHelperReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_PASTE_BLOCK_CLIPBOARD_RECEIPT_20260706.json"
$ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_REVIEW_DESK_LAUNCHER_SMOKE_RECEIPT_20260706.json"

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

function Invoke-LauncherDryRun([string]$Name, [string[]]$ExtraArgs) {
  $args = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $LauncherPath,
    "-DryRun"
  ) + $ExtraArgs

  $stdout = & powershell.exe @args 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Launcher dry-run failed: $Name / $($stdout | Out-String)"
  }
  $readback = ($stdout | Out-String).Trim() | ConvertFrom-Json
  return [ordered]@{
    name = $Name
    status = $readback.status
    dry_run = $readback.dry_run
    proof_link_count = @($readback.proof_links).Count
    open_order = @($readback.open_order | ForEach-Object { Convert-ToRepoRelative ([string]$_) })
    connection_map_html = Convert-ToRepoRelative ([string]$readback.connection_map_html)
    attack_scorecard_html = Convert-ToRepoRelative ([string]$readback.attack_scorecard_html)
    scorecard_intake = Convert-ToRepoRelative ([string]$readback.scorecard_intake)
    scorecard_validator_receipt = Convert-ToRepoRelative ([string]$readback.scorecard_validator_receipt)
    refresh_status_requested = $readback.refresh_status_requested
    refresh_status_committed = $readback.refresh_status_committed
    copy_mack_block_requested = $readback.copy_mack_block_requested
    copy_mack_block_committed = $readback.copy_mack_block_committed
    truth_boundary = $readback.truth_boundary
  }
}

foreach ($required in @($LauncherPath, $StatusRefreshPath, $StatusPath, $ConnectionMapPath, $AttackScorecardPath, $ScorecardIntakePath, $StatusReceiptPath, $ScorecardValidatorReceiptPath, $CopyHelperReceiptPath)) {
  Assert-Pass (Test-Path -LiteralPath $required) "Required path missing: $required"
}

$statusBeforeHash = Get-Sha256FileOrEmpty $StatusPath
$statusReceiptBeforeHash = Get-Sha256FileOrEmpty $StatusReceiptPath
$copyReceiptBeforeHash = Get-Sha256FileOrEmpty $CopyHelperReceiptPath

$readbacks = @()
$readbacks += Invoke-LauncherDryRun -Name "default-dry-run" -ExtraArgs @()
$readbacks += Invoke-LauncherDryRun -Name "refresh-status-dry-run" -ExtraArgs @("-RefreshStatus")
$readbacks += Invoke-LauncherDryRun -Name "copy-mack-block-dry-run" -ExtraArgs @("-CopyMackBlock")
$readbacks += Invoke-LauncherDryRun -Name "open-all-proof-dry-run" -ExtraArgs @("-OpenAllProof")

$default = $readbacks | Where-Object { $_.name -eq "default-dry-run" } | Select-Object -First 1
$refresh = $readbacks | Where-Object { $_.name -eq "refresh-status-dry-run" } | Select-Object -First 1
$copy = $readbacks | Where-Object { $_.name -eq "copy-mack-block-dry-run" } | Select-Object -First 1
$openAll = $readbacks | Where-Object { $_.name -eq "open-all-proof-dry-run" } | Select-Object -First 1

Assert-Pass ($default.status -eq "READY_TO_OPEN") "Default launcher dry-run not ready."
Assert-Pass ($default.dry_run -eq $true) "Default launcher dry-run flag missing."
Assert-Pass ($default.open_order[0] -like "*MACK_ARCHITECTURE_REVIEW_DESK_STATUS_20260706.md") "Default launcher does not open status note first."
Assert-Pass ($default.open_order[1] -like "*MACK_ARCHITECTURE_REVIEW_DESK_READOUT_20260706.html") "Default launcher does not open readout second."
Assert-Pass ($default.open_order[2] -like "*BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.html") "Default launcher does not open connection map third."
Assert-Pass ($default.open_order[3] -like "*MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.html") "Default launcher does not open attack scorecard fourth."
Assert-Pass ($default.open_order[4] -like "*MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.html") "Default launcher does not open paste packet fifth."
Assert-Pass ($default.open_order.Count -eq 10) "Default launcher open order count is not 10."
Assert-Pass ($default.refresh_status_requested -eq $false) "Default launcher requested status refresh."
Assert-Pass ($default.refresh_status_committed -eq $false) "Default launcher committed status refresh."
Assert-Pass ($default.copy_mack_block_requested -eq $false) "Default launcher requested copy."
Assert-Pass ($default.copy_mack_block_committed -eq $false) "Default launcher copied Mack block."

Assert-Pass ($refresh.refresh_status_requested -eq $true) "Refresh dry-run did not request status refresh."
Assert-Pass ($refresh.refresh_status_committed -eq $false) "Refresh dry-run committed status refresh."
Assert-Pass ($copy.copy_mack_block_requested -eq $true) "Copy dry-run did not request copy."
Assert-Pass ($copy.copy_mack_block_committed -eq $false) "Copy dry-run committed copy."
Assert-Pass ($openAll.proof_link_count -eq 4) "OpenAllProof dry-run did not expose all proof links."

$statusAfterHash = Get-Sha256FileOrEmpty $StatusPath
$statusReceiptAfterHash = Get-Sha256FileOrEmpty $StatusReceiptPath
$copyReceiptAfterHash = Get-Sha256FileOrEmpty $CopyHelperReceiptPath

Assert-Pass ($statusBeforeHash -eq $statusAfterHash) "Launcher dry-runs changed status note."
Assert-Pass ($statusReceiptBeforeHash -eq $statusReceiptAfterHash) "Launcher dry-runs changed status receipt."
Assert-Pass ($copyReceiptBeforeHash -eq $copyReceiptAfterHash) "Launcher dry-runs changed copy helper receipt."

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_REVIEW_DESK_LAUNCHER_SMOKE_RECEIPT"
  status = "ARTIFACT"
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_REVIEW_DESK_LAUNCHER_SMOKE_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Test-MackArchitectureReviewDeskLauncher.ps1"
  validation = [ordered]@{
    default_dry_run_ready = $true
    status_note_opens_first = $true
    readout_opens_second = $true
    connection_map_opens_third = $true
    attack_scorecard_opens_fourth = $true
    paste_packet_opens_fifth = $true
    refresh_status_requires_explicit_switch = $true
    refresh_status_dry_run_does_not_refresh = $true
    copy_mack_block_requires_explicit_switch = $true
    copy_mack_block_dry_run_does_not_copy = $true
    open_all_proof_dry_run_exposes_four_links = $true
    status_note_not_mutated = $true
    status_receipt_not_mutated = $true
    copy_helper_receipt_not_mutated = $true
    no_external_send_claimed = $true
    no_clipboard_write_by_smoke = $true
    truth_boundary = "This smoke runs launcher dry-runs only. It does not open windows, refresh status, write the clipboard, send anything to Mack, claim Mack returned, mutate intake, or write a next-build packet."
  }
  readbacks = $readbacks
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Open-MackArchitectureReviewDesk.ps1"
      sha256 = Get-Sha256FileOrEmpty $LauncherPath
    },
    [ordered]@{
      path = "scripts/foreman/Update-MackArchitectureReviewDeskStatus.ps1"
      sha256 = Get-Sha256FileOrEmpty $StatusRefreshPath
    },
    [ordered]@{
      path = "scripts/foreman/Test-MackArchitectureReviewDeskLauncher.ps1"
      sha256 = Get-Sha256FileOrEmpty $PSCommandPath
    },
    [ordered]@{
      path = "foreman/source_material/manuscript_workbench/tinkularity/architecture/BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.html"
      sha256 = Get-Sha256FileOrEmpty $ConnectionMapPath
    },
    [ordered]@{
      path = "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.html"
      sha256 = Get-Sha256FileOrEmpty $AttackScorecardPath
    },
    [ordered]@{
      path = "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_ATTACK_SCORECARD_RETURN_INTAKE_20260706.md"
      sha256 = Get-Sha256FileOrEmpty $ScorecardIntakePath
    },
    [ordered]@{
      path = "foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_REVIEW_DESK_STATUS_20260706.md"
      sha256 = $statusAfterHash
    },
    [ordered]@{
      path = "foreman/receipts/MACK_ARCHITECTURE_REVIEW_DESK_STATUS_REFRESH_RECEIPT_20260706.json"
      sha256 = $statusReceiptAfterHash
    },
    [ordered]@{
      path = "foreman/receipts/MACK_ARCHITECTURE_PASTE_BLOCK_CLIPBOARD_RECEIPT_20260706.json"
      sha256 = $copyReceiptAfterHash
    },
    [ordered]@{
      path = "foreman/receipts/MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_RECEIPT_20260706.json"
      sha256 = Get-Sha256FileOrEmpty $ScorecardValidatorReceiptPath
    }
  )
  stop_conditions_respected = @(
    "no deploy",
    "no push",
    "no secrets",
    "no production mutation",
    "no external send claim",
    "no status refresh mutation",
    "no clipboard write",
    "no Mack receipt claim",
    "no canonical intake mutation",
    "no canonical next-build packet generated"
  )
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReceiptPath) | Out-Null
$receipt | ConvertTo-Json -Depth 14 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8

[ordered]@{
  ok = $true
  status = $receipt.status
  receipt_path = Convert-ToRepoRelative $ReceiptPath
  receipt_sha256 = Get-Sha256FileOrEmpty $ReceiptPath
  default_dry_run_ready = $true
  refresh_status_dry_run_does_not_refresh = $true
  copy_mack_block_dry_run_does_not_copy = $true
  open_all_proof_dry_run_exposes_four_links = $true
  status_note_unchanged = $true
} | ConvertTo-Json -Depth 8
