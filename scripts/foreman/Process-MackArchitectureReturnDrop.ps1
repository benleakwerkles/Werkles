param(
  [switch]$Commit,
  [switch]$AllowFreeform,
  [string]$DropDir,
  [string]$IntakePath,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$ReceivePath = Join-Path $Repo "scripts\foreman\Receive-MackArchitectureReturn.ps1"
$CanonicalIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
$CanonicalNextBuildPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_NEXT_BUILD_PACKET_FROM_RETURN_20260706.md"

if (-not $DropDir) {
  $DropDir = Join-Path $Repo "foreman\handoffs\inbox\mack-architecture-return-drop"
}
if (-not $IntakePath) {
  $IntakePath = $CanonicalIntakePath
}
if (-not $ReceiptPath) {
  $ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_RETURN_DROP_PROCESS_RECEIPT_20260706.json"
}

$ReceiveReceiptPath = [System.IO.Path]::ChangeExtension($ReceiptPath, ".receive.json")

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

function Read-JsonFile([string]$PathValue) {
  return Get-Content -Raw -LiteralPath $PathValue | ConvertFrom-Json
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
  try {
    return $text | ConvertFrom-Json
  } catch {
    throw "$Label returned non-JSON output: $text"
  }
}

Assert-Pass (Test-Path -LiteralPath $ReceivePath) "Receive wrapper missing: $ReceivePath"
Assert-Pass (Test-Path -LiteralPath $IntakePath) "Intake path missing: $IntakePath"

New-Item -ItemType Directory -Force -Path $DropDir | Out-Null

$intakeBeforeHash = Get-Sha256FileOrEmpty $IntakePath
$canonicalBeforeHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$nextBuildBeforeExists = Test-Path -LiteralPath $CanonicalNextBuildPath
$nextBuildBeforeHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath

$candidates = @(
  Get-ChildItem -LiteralPath $DropDir -File -ErrorAction SilentlyContinue |
    Where-Object {
      ($_.Extension.ToLowerInvariant() -eq ".txt" -or $_.Extension.ToLowerInvariant() -eq ".md") -and
      $_.Name -ne "README.md"
    } |
    Sort-Object -Property LastWriteTimeUtc, Name -Descending
)

$selected = $null
if ($candidates.Count -gt 0) {
  $selected = $candidates[0]
}

$receiveReadback = $null
$receiveReceipt = $null
$blockerCode = ""
$status = "ARTIFACT"

if (-not $selected) {
  $status = "BLOCKER"
  $blockerCode = "MACK_RETURN_DROP_EMPTY"
} else {
  $receiveArgs = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $ReceivePath,
    "-InputPath",
    $selected.FullName,
    "-IntakePath",
    $IntakePath,
    "-ReceiptPath",
    $ReceiveReceiptPath
  )
  if ($Commit) { $receiveArgs += "-Commit" }
  if ($AllowFreeform) { $receiveArgs += "-AllowFreeform" }

  $receiveOutput = & powershell.exe @receiveArgs 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Receive wrapper failed from drop file: $($receiveOutput | Out-String)"
  }
  $receiveReadback = Convert-StdoutJson -Output $receiveOutput -Label "Receive wrapper"
  Assert-Pass (Test-Path -LiteralPath $ReceiveReceiptPath) "Receive wrapper receipt missing: $ReceiveReceiptPath"
  $receiveReceipt = Read-JsonFile $ReceiveReceiptPath
  $status = $receiveReadback.status
  $blockerCode = Get-OptionalString $receiveReadback "blocker_code"
}

$intakeAfterHash = Get-Sha256FileOrEmpty $IntakePath
$canonicalAfterHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$nextBuildAfterExists = Test-Path -LiteralPath $CanonicalNextBuildPath
$nextBuildAfterHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath

if (-not $Commit) {
  Assert-Pass ($intakeBeforeHash -eq $intakeAfterHash) "Intake changed during drop dry-run."
}
Assert-Pass ($nextBuildBeforeExists -eq $nextBuildAfterExists) "Canonical next-build existence changed during drop processing."
Assert-Pass ($nextBuildBeforeHash -eq $nextBuildAfterHash) "Canonical next-build hash changed during drop processing."

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_RETURN_DROP_PROCESS_RECEIPT"
  status = $status
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_RETURN_DROP_PROCESS_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Process-MackArchitectureReturnDrop.ps1" + ($(if ($Commit) { " -Commit" } else { "" })) + ($(if ($AllowFreeform) { " -AllowFreeform" } else { "" }))
  drop_dir = Convert-ToRepoRelative $DropDir
  intake_path = Convert-ToRepoRelative $IntakePath
  candidates_seen = $candidates.Count
  selected_drop_file = if ($selected) { Convert-ToRepoRelative $selected.FullName } else { "" }
  selected_drop_file_sha256 = if ($selected) { Get-Sha256FileOrEmpty $selected.FullName } else { "" }
  selected_drop_file_last_write_utc = if ($selected) { $selected.LastWriteTimeUtc.ToString("o") } else { "" }
  commit_requested = [bool]$Commit
  allow_freeform = [bool]$AllowFreeform
  blocker_code = $blockerCode
  receive_readback = if ($receiveReadback) {
    [ordered]@{
      status = $receiveReadback.status
      blocker_code = Get-OptionalString $receiveReadback "blocker_code"
      receipt_path = Convert-ToRepoRelative $ReceiveReceiptPath
      import_committed = [bool]$receiveReadback.import_committed
      validator_status = Get-OptionalString $receiveReadback "validator_status"
      validator_blocker_code = Get-OptionalString $receiveReadback "validator_blocker_code"
    }
  } else {
    $null
  }
  validation = [ordered]@{
    dry_run_default = -not $Commit
    commit_requires_explicit_switch = $true
    newest_txt_or_md_selected = [bool]$selected
    no_clipboard_read = $true
    no_intake_write_without_commit = if ($Commit) { $true } else { $intakeBeforeHash -eq $intakeAfterHash }
    wrapper_receipt_contains_no_raw_mack_text = $true
    external_send_not_claimed = $true
    mack_return_not_claimed_when_drop_empty = if ($selected) { $true } else { $blockerCode -eq "MACK_RETURN_DROP_EMPTY" }
    canonical_intake_not_mutated_unless_commit = if ($Commit) { $true } else { $canonicalBeforeHash -eq $canonicalAfterHash }
    canonical_next_build_packet_absence_preserved = -not $nextBuildAfterExists
    truth_boundary = "This drop processor reads the newest local .txt or .md return file and delegates to the receive wrapper. It is dry-run by default, does not read the clipboard, does not send anything to Mack, and does not write canonical intake unless -Commit is explicit."
  }
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Process-MackArchitectureReturnDrop.ps1"
      sha256 = Get-Sha256FileOrEmpty $PSCommandPath
    },
    [ordered]@{
      path = "scripts/foreman/Receive-MackArchitectureReturn.ps1"
      sha256 = Get-Sha256FileOrEmpty $ReceivePath
    },
    [ordered]@{
      path = "foreman/handoffs/inbox/mack-architecture-return-drop/README.md"
      sha256 = Get-Sha256FileOrEmpty (Join-Path $Repo "foreman\handoffs\inbox\mack-architecture-return-drop\README.md")
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
    "no intake mutation without -Commit",
    "no Mack receipt claim when drop is empty",
    "no canonical next-build packet generated"
  )
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReceiptPath) | Out-Null
$receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8

[ordered]@{
  ok = $true
  status = $status
  blocker_code = $blockerCode
  receipt_path = Convert-ToRepoRelative $ReceiptPath
  drop_dir = Convert-ToRepoRelative $DropDir
  candidates_seen = $candidates.Count
  selected_drop_file = if ($selected) { Convert-ToRepoRelative $selected.FullName } else { "" }
  commit_requested = [bool]$Commit
  receive_status = if ($receiveReadback) { $receiveReadback.status } else { "" }
  receive_receipt_path = if ($receiveReadback) { Convert-ToRepoRelative $ReceiveReceiptPath } else { "" }
  canonical_intake_changed = $canonicalBeforeHash -ne $canonicalAfterHash
  canonical_next_build_exists = $nextBuildAfterExists
} | ConvertTo-Json -Depth 8
