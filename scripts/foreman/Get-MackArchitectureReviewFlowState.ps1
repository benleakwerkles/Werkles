param(
  [string]$IntakePath,
  [string]$NextBuildPacketPath,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$CanonicalIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
$CanonicalNextBuildPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_NEXT_BUILD_PACKET_FROM_RETURN_20260706.md"

if (-not $IntakePath) {
  $IntakePath = $CanonicalIntakePath
}
if (-not $NextBuildPacketPath) {
  $NextBuildPacketPath = $CanonicalNextBuildPath
}
if (-not $ReceiptPath) {
  $ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_REVIEW_FLOW_STATE_RECEIPT_20260706.json"
}

$RequiredFields = @(
  "status",
  "strongest_objection",
  "simplest_viable_architecture",
  "highest_risk_fake_success_path",
  "first_momentum_build",
  "must_change_before_book",
  "optional_later",
  "score_0_to_10",
  "proof_surface_readback"
)

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

function Test-PlaceholderValue([string]$Value) {
  $normalized = ([string]$Value).Trim()
  return (
    $normalized.Length -eq 0 -or
    $normalized -eq "_____" -or
    $normalized -eq "YES | NO" -or
    $normalized -eq "ACCEPT | REVISE | REJECT" -or
    $normalized -eq "NEEDS_NORMALIZATION"
  )
}

function Get-MackReturnBlock([string]$Markdown) {
  $matches = [regex]::Matches($Markdown, '```(?:text)?\r?\n([\s\S]*?)```')
  $candidate = ""
  foreach ($match in $matches) {
    $block = $match.Groups[1].Value.Trim()
    if ($block.StartsWith("MACK REVIEW RETURN", [System.StringComparison]::Ordinal)) {
      $candidate = $block
    }
  }
  return $candidate
}

function Normalize-FieldName([string]$Value) {
  $normalized = $Value.Trim().ToLowerInvariant()
  foreach ($field in $RequiredFields) {
    if ($normalized -eq $field) {
      return $field
    }
  }
  if ($normalized -eq "bottom_line") {
    return "bottom_line"
  }
  return ""
}

function Parse-MackReturnFields([string]$Block) {
  $fields = [ordered]@{}
  $current = ""
  foreach ($rawLine in ($Block -split '\r?\n')) {
    $line = $rawLine.TrimEnd()
    if ($line.Trim() -eq "MACK REVIEW RETURN") {
      continue
    }

    $match = [regex]::Match($line, '^([a-zA-Z0-9_]+):\s*(.*)$')
    if ($match.Success) {
      $fieldName = Normalize-FieldName $match.Groups[1].Value
      if ($fieldName) {
        $current = $fieldName
        $fields[$current] = $match.Groups[2].Value.Trim()
        continue
      }
    }

    if ($current) {
      $previous = [string]$fields[$current]
      if ($previous) {
        $fields[$current] = ($previous + "`n" + $line).Trim()
      } else {
        $fields[$current] = $line.Trim()
      }
    }
  }
  return $fields
}

function Get-FieldCompleteness($Fields) {
  $entries = @()
  foreach ($field in $RequiredFields) {
    $present = $Fields.Contains($field)
    $value = if ($present) { [string]$Fields[$field] } else { "" }
    $entries += [ordered]@{
      field = $field
      present = $present
      filled = if ($present) { -not (Test-PlaceholderValue $value) } else { $false }
    }
  }
  return $entries
}

Assert-Pass (Test-Path -LiteralPath $IntakePath) "Intake path missing: $IntakePath"

$intakeMarkdown = Get-Content -Raw -LiteralPath $IntakePath
$returnBlock = Get-MackReturnBlock $intakeMarkdown
$fields = if ($returnBlock) { Parse-MackReturnFields $returnBlock } else { [ordered]@{} }
$completeness = Get-FieldCompleteness $fields
$missing = @($completeness | Where-Object { -not $_.present } | ForEach-Object { $_.field })
$empty = @($completeness | Where-Object { $_.present -and -not $_.filled } | ForEach-Object { $_.field })
$filledRequiredCount = @($completeness | Where-Object { $_.filled }).Count
$statusValue = if ($fields.Contains("status")) { ([string]$fields["status"]).Trim().ToUpperInvariant() } else { "" }
$statusValid = @("ACCEPT", "REVISE", "REJECT") -contains $statusValue
$waitingMarker = $intakeMarkdown -match 'Status:\s*WAITING_FOR_MACK_RETURN' -or $intakeMarkdown -match 'Mack review has not been received yet\.'
$nextBuildExists = Test-Path -LiteralPath $NextBuildPacketPath

$flowState = ""
$blockerCode = ""
$nextLegalCommand = ""
$benActionRequired = ""

if ($nextBuildExists) {
  $flowState = "NEXT_BUILD_PACKET_EXISTS"
  $blockerCode = ""
  $nextLegalCommand = "Inspect `"$NextBuildPacketPath`" before treating it as build input."
  $benActionRequired = "Review the generated next-build packet before any implementation work."
} elseif (($waitingMarker -and $filledRequiredCount -le 1) -or -not $returnBlock) {
  $flowState = "WAITING_FOR_MACK_RETURN"
  $blockerCode = "MACK_RETURN_NOT_RECEIVED"
  $nextLegalCommand = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Receive-MackArchitectureReturn.ps1"
  $benActionRequired = "Send manually only if ready, then run the receive wrapper dry-run after Mack returns text."
} elseif ($missing.Count -gt 0 -or $empty.Count -gt 0 -or -not $statusValid) {
  $flowState = "MACK_RETURN_INCOMPLETE"
  $blockerCode = if (-not $statusValid) { "MACK_RETURN_STATUS_INVALID" } else { "MACK_RETURN_INCOMPLETE" }
  $nextLegalCommand = "Ask Mack to complete the required MACK REVIEW RETURN fields, then rerun Receive-MackArchitectureReturn.ps1."
  $benActionRequired = "Do not accept or convert this return yet."
} else {
  $flowState = "MACK_RETURN_READY_FOR_BEN_REVIEW"
  $blockerCode = ""
  $nextLegalCommand = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Accept-MackArchitectureReturn.ps1"
  $benActionRequired = "Read Mack's return, then run acceptance dry-run before any -Commit -BenAccepted conversion."
}

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_REVIEW_FLOW_STATE_RECEIPT"
  status = "ARTIFACT"
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_REVIEW_FLOW_STATE_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Get-MackArchitectureReviewFlowState.ps1"
  intake_path = Convert-ToRepoRelative $IntakePath
  next_build_packet_path = Convert-ToRepoRelative $NextBuildPacketPath
  flow_state = $flowState
  blocker_code = $blockerCode
  next_legal_command = $nextLegalCommand
  ben_action_required = $benActionRequired
  classification = [ordered]@{
    return_block_found = [bool]$returnBlock
    waiting_marker_found = [bool]$waitingMarker
    required_fields_present = $missing.Count -eq 0
    required_fields_filled = $empty.Count -eq 0
    filled_required_count = $filledRequiredCount
    status_value = $statusValue
    status_valid = $statusValid
    missing = $missing
    empty = $empty
    canonical_next_build_exists = $nextBuildExists
  }
  validation = [ordered]@{
    read_only_state_check = $true
    no_clipboard_read = $true
    no_intake_write = $true
    no_next_build_packet_write = $true
    external_send_not_claimed = $true
    mack_return_not_claimed_unless_required_fields_complete = $flowState -ne "WAITING_FOR_MACK_RETURN"
    ben_acceptance_not_claimed = $true
    truth_boundary = "This state receipt reads local files and returns the next legal command. It does not send anything, read the clipboard, mutate intake, write a next-build packet, or claim Mack returned review while the intake is waiting."
  }
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Get-MackArchitectureReviewFlowState.ps1"
      sha256 = Get-Sha256FileOrEmpty $PSCommandPath
    },
    [ordered]@{
      path = Convert-ToRepoRelative $IntakePath
      sha256 = Get-Sha256FileOrEmpty $IntakePath
    },
    [ordered]@{
      path = Convert-ToRepoRelative $NextBuildPacketPath
      sha256 = Get-Sha256FileOrEmpty $NextBuildPacketPath
    }
  )
  stop_conditions_respected = @(
    "no deploy",
    "no push",
    "no secrets",
    "no production mutation",
    "no external send claim",
    "no clipboard read",
    "no intake mutation",
    "no next-build packet generated",
    "no Mack receipt claim",
    "no Ben acceptance claim"
  )
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReceiptPath) | Out-Null
$receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8

[ordered]@{
  ok = $true
  status = $receipt.status
  receipt_path = Convert-ToRepoRelative $ReceiptPath
  flow_state = $flowState
  blocker_code = $blockerCode
  next_legal_command = $nextLegalCommand
  ben_action_required = $benActionRequired
  return_block_found = [bool]$returnBlock
  filled_required_count = $filledRequiredCount
  canonical_next_build_exists = $nextBuildExists
} | ConvertTo-Json -Depth 8
