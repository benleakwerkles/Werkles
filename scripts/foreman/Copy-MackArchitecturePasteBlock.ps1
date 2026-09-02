param(
  [switch]$Copy,
  [string]$SourcePath,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
if (-not $SourcePath) {
  $SourcePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_PASTE_PACKET_20260706.md"
}
if (-not $ReceiptPath) {
  $ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_PASTE_BLOCK_CLIPBOARD_RECEIPT_20260706.json"
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

function Get-Sha256Text([string]$Text) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $hash = $sha.ComputeHash($bytes)
    return ([BitConverter]::ToString($hash) -replace "-", "").ToUpperInvariant()
  } finally {
    $sha.Dispose()
  }
}

function Get-Sha256File([string]$PathValue) {
  return (Get-FileHash -LiteralPath $PathValue -Algorithm SHA256).Hash
}

function Get-PasteBlock([string]$Markdown) {
  $pattern = '(?s)## Copy/Paste Block For Mack\s+```text\s+(.*?)\s+```\s+## After Mack Returns'
  $match = [regex]::Match($Markdown, $pattern)
  if (-not $match.Success) {
    throw "Paste packet does not contain the expected Mack copy/paste block."
  }
  return ($match.Groups[1].Value -replace "`r`n", "`n").Trim()
}

if (-not (Test-Path -LiteralPath $SourcePath)) {
  throw "Paste packet source path missing: $SourcePath"
}

$sourceMarkdown = Get-Content -Raw -LiteralPath $SourcePath
$pasteBlock = Get-PasteBlock $sourceMarkdown
$blockHash = Get-Sha256Text $pasteBlock
$sourceHash = Get-Sha256File $SourcePath
$scriptHash = Get-Sha256File $PSCommandPath
$markersPresent = (
  $pasteBlock.Contains("Mack, tear this architecture apart.") -and
  $pasteBlock.Contains("Read the Mack review desk readout first") -and
  $pasteBlock.Contains("BOOK_ARCHITECTURE_CONNECTION_MAP_20260706.md") -and
  $pasteBlock.Contains("MACK_ARCHITECTURE_ATTACK_SCORECARD_20260706.md") -and
  $pasteBlock.Contains("MACK REVIEW RETURN") -and
  $pasteBlock.Contains("MACK SCORECARD RETURN") -and
  $pasteBlock.Contains("Do not claim universal receiver proof")
)

if (-not $markersPresent) {
  throw "Paste block is missing one or more required Mack mission markers."
}

$copyCommitted = $false
if ($Copy) {
  Set-Clipboard -Value $pasteBlock
  $copyCommitted = $true
}

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_PASTE_BLOCK_CLIPBOARD_RECEIPT"
  status = "ARTIFACT"
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_PASTE_BLOCK_CLIPBOARD_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Copy-MackArchitecturePasteBlock.ps1" + ($(if ($Copy) { " -Copy" } else { "" }))
  source_path = Convert-ToRepoRelative $SourcePath
  block_sha256 = $blockHash
  block_bytes = [System.Text.Encoding]::UTF8.GetByteCount($pasteBlock)
  block_line_count = (($pasteBlock -split "`n").Count)
  first_line = (($pasteBlock -split "`n") | Select-Object -First 1)
  copy_committed = $copyCommitted
  validation = [ordered]@{
    source_paste_packet_found = $true
    source_block_markers_present = $markersPresent
    scorecard_return_block_present = $pasteBlock.Contains("MACK SCORECARD RETURN")
    clipboard_write_requires_copy_switch = $true
    dry_run_default = -not $Copy
    external_send_not_claimed = $true
    mack_return_not_claimed = $true
    truth_boundary = "This helper extracts the Mack paste block and only writes it to the local clipboard when -Copy is provided. It never sends the block to Mack and never claims Mack returned a review."
  }
  file_hashes = @(
    [ordered]@{
      path = Convert-ToRepoRelative $SourcePath
      sha256 = $sourceHash
    },
    [ordered]@{
      path = "scripts/foreman/Copy-MackArchitecturePasteBlock.ps1"
      sha256 = $scriptHash
    }
  )
  stop_conditions_respected = @(
    "no deploy",
    "no push",
    "no secrets",
    "no production mutation",
    "no external send claim",
    "no Mack receipt claim"
  )
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReceiptPath) | Out-Null
$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8

[ordered]@{
  ok = $true
  status = $receipt.status
  copy_committed = $copyCommitted
  receipt_path = Convert-ToRepoRelative $ReceiptPath
  source_path = Convert-ToRepoRelative $SourcePath
  block_sha256 = $blockHash
  block_line_count = $receipt.block_line_count
  first_line = $receipt.first_line
  truth_boundary = $receipt.validation.truth_boundary
} | ConvertTo-Json -Depth 5
