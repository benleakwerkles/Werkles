param(
  [switch]$CommitReturn,
  [switch]$CommitAcceptance,
  [switch]$BenAccepted,
  [string]$DropDir,
  [string]$IntakePath,
  [string]$NextBuildPacketPath,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$StatePath = Join-Path $Repo "scripts\foreman\Get-MackArchitectureReviewFlowState.ps1"
$DropProcessorPath = Join-Path $Repo "scripts\foreman\Process-MackArchitectureReturnDrop.ps1"
$AcceptancePath = Join-Path $Repo "scripts\foreman\Accept-MackArchitectureReturn.ps1"
$CanonicalIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
$CanonicalNextBuildPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_NEXT_BUILD_PACKET_FROM_RETURN_20260706.md"
$DefaultDropDir = Join-Path $Repo "foreman\handoffs\inbox\mack-architecture-return-drop"

if (-not $DropDir) {
  $DropDir = $DefaultDropDir
}
if (-not $IntakePath) {
  $IntakePath = $CanonicalIntakePath
}
if (-not $NextBuildPacketPath) {
  $NextBuildPacketPath = $CanonicalNextBuildPath
}
if (-not $ReceiptPath) {
  $ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_REVIEW_LANE_COORDINATOR_RECEIPT_20260706.json"
}

$StateBeforeReceiptPath = [System.IO.Path]::ChangeExtension($ReceiptPath, ".state-before.json")
$DropReceiptPath = [System.IO.Path]::ChangeExtension($ReceiptPath, ".drop.json")
$StateAfterDropReceiptPath = [System.IO.Path]::ChangeExtension($ReceiptPath, ".state-after-drop.json")
$AcceptanceReceiptPath = [System.IO.Path]::ChangeExtension($ReceiptPath, ".acceptance.json")
$StateFinalReceiptPath = [System.IO.Path]::ChangeExtension($ReceiptPath, ".state-final.json")

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
  $firstBrace = $text.IndexOf("{")
  $lastBrace = $text.LastIndexOf("}")
  if ($firstBrace -ge 0 -and $lastBrace -gt $firstBrace) {
    $text = $text.Substring($firstBrace, $lastBrace - $firstBrace + 1)
  }
  try {
    return $text | ConvertFrom-Json
  } catch {
    throw "$Label returned non-JSON output: $text"
  }
}

function Invoke-JsonPowerShell([string]$Label, [string[]]$ArgumentList) {
  $output = & powershell.exe @ArgumentList 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "$Label failed: $($output | Out-String)"
  }
  return Convert-StdoutJson -Output $output -Label $Label
}

foreach ($required in @($StatePath, $DropProcessorPath, $AcceptancePath, $IntakePath)) {
  Assert-Pass (Test-Path -LiteralPath $required) "Required path missing: $required"
}

New-Item -ItemType Directory -Force -Path $DropDir | Out-Null

$intakeBeforeHash = Get-Sha256FileOrEmpty $IntakePath
$canonicalIntakeBeforeHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$nextBuildBeforeExists = Test-Path -LiteralPath $NextBuildPacketPath
$nextBuildBeforeHash = Get-Sha256FileOrEmpty $NextBuildPacketPath
$canonicalNextBuildBeforeExists = Test-Path -LiteralPath $CanonicalNextBuildPath
$canonicalNextBuildBeforeHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath

$stateBefore = Invoke-JsonPowerShell -Label "Flow state before" -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $StatePath,
  "-IntakePath",
  $IntakePath,
  "-NextBuildPacketPath",
  $NextBuildPacketPath,
  "-ReceiptPath",
  $StateBeforeReceiptPath
)

$dropArgs = @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $DropProcessorPath,
  "-DropDir",
  $DropDir,
  "-IntakePath",
  $IntakePath,
  "-ReceiptPath",
  $DropReceiptPath
)
if ($CommitReturn) { $dropArgs += "-Commit" }

$dropReadback = Invoke-JsonPowerShell -Label "Return drop processor" -ArgumentList $dropArgs
$dropReceipt = Read-JsonFile $DropReceiptPath

$stateAfterDrop = Invoke-JsonPowerShell -Label "Flow state after drop" -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $StatePath,
  "-IntakePath",
  $IntakePath,
  "-NextBuildPacketPath",
  $NextBuildPacketPath,
  "-ReceiptPath",
  $StateAfterDropReceiptPath
)

$acceptanceReadback = $null
$acceptanceReceipt = $null
$shouldRunAcceptance = $CommitAcceptance -or $BenAccepted -or $stateAfterDrop.flow_state -eq "MACK_RETURN_READY_FOR_BEN_REVIEW"
if ($shouldRunAcceptance) {
  $acceptanceArgs = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $AcceptancePath,
    "-IntakePath",
    $IntakePath,
    "-NextBuildPacketPath",
    $NextBuildPacketPath,
    "-ReceiptPath",
    $AcceptanceReceiptPath
  )
  if ($CommitAcceptance) { $acceptanceArgs += "-Commit" }
  if ($BenAccepted) { $acceptanceArgs += "-BenAccepted" }

  $acceptanceReadback = Invoke-JsonPowerShell -Label "Return acceptance" -ArgumentList $acceptanceArgs
  $acceptanceReceipt = Read-JsonFile $AcceptanceReceiptPath
}

$stateFinal = Invoke-JsonPowerShell -Label "Flow state final" -ArgumentList @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $StatePath,
  "-IntakePath",
  $IntakePath,
  "-NextBuildPacketPath",
  $NextBuildPacketPath,
  "-ReceiptPath",
  $StateFinalReceiptPath
)

$intakeAfterHash = Get-Sha256FileOrEmpty $IntakePath
$canonicalIntakeAfterHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$nextBuildAfterExists = Test-Path -LiteralPath $NextBuildPacketPath
$nextBuildAfterHash = Get-Sha256FileOrEmpty $NextBuildPacketPath
$canonicalNextBuildAfterExists = Test-Path -LiteralPath $CanonicalNextBuildPath
$canonicalNextBuildAfterHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath

if (-not $CommitReturn) {
  Assert-Pass ($intakeBeforeHash -eq $intakeAfterHash) "Intake changed without -CommitReturn."
}
if (-not ($CommitAcceptance -and $BenAccepted)) {
  Assert-Pass ($nextBuildBeforeExists -eq $nextBuildAfterExists) "Next-build existence changed without -CommitAcceptance -BenAccepted."
  Assert-Pass ($nextBuildBeforeHash -eq $nextBuildAfterHash) "Next-build hash changed without -CommitAcceptance -BenAccepted."
}

$isCanonicalIntake = [System.IO.Path]::GetFullPath($IntakePath).Equals(
  [System.IO.Path]::GetFullPath($CanonicalIntakePath),
  [System.StringComparison]::OrdinalIgnoreCase
)
$isCanonicalNextBuild = [System.IO.Path]::GetFullPath($NextBuildPacketPath).Equals(
  [System.IO.Path]::GetFullPath($CanonicalNextBuildPath),
  [System.StringComparison]::OrdinalIgnoreCase
)
if (-not ($CommitReturn -and $isCanonicalIntake)) {
  Assert-Pass ($canonicalIntakeBeforeHash -eq $canonicalIntakeAfterHash) "Canonical intake changed outside explicit canonical return commit."
}
if (-not ($CommitAcceptance -and $BenAccepted -and $isCanonicalNextBuild)) {
  Assert-Pass ($canonicalNextBuildBeforeExists -eq $canonicalNextBuildAfterExists) "Canonical next-build existence changed outside explicit canonical acceptance commit."
  Assert-Pass ($canonicalNextBuildBeforeHash -eq $canonicalNextBuildAfterHash) "Canonical next-build hash changed outside explicit canonical acceptance commit."
}

$laneState = $stateFinal.flow_state
$laneBlocker = Get-OptionalString $stateFinal "blocker_code"
$nextLegalCommand = Get-OptionalString $stateFinal "next_legal_command"

if ($dropReadback.blocker_code -eq "MACK_RETURN_DROP_EMPTY") {
  $laneState = "WAITING_FOR_MACK_RETURN_DROP"
  $laneBlocker = "MACK_RETURN_DROP_EMPTY"
  $nextLegalCommand = "Put Mack's returned .txt or .md file in foreman/handoffs/inbox/mack-architecture-return-drop/, then rerun Invoke-MackArchitectureReviewLane.ps1."
} elseif ($dropReadback.status -eq "ARTIFACT" -and -not $CommitReturn) {
  $laneState = "RETURN_DROP_READY_FOR_COMMIT"
  $laneBlocker = ""
  $nextLegalCommand = "After Ben accepts the dropped return for canonical intake, rerun Invoke-MackArchitectureReviewLane.ps1 -CommitReturn."
} elseif ($stateFinal.flow_state -eq "MACK_RETURN_READY_FOR_BEN_REVIEW" -and -not ($CommitAcceptance -and $BenAccepted)) {
  $laneState = "MACK_RETURN_READY_FOR_BEN_REVIEW"
  $laneBlocker = ""
  $nextLegalCommand = "After Ben accepts Mack's direction, rerun Invoke-MackArchitectureReviewLane.ps1 -CommitAcceptance -BenAccepted."
} elseif ($stateFinal.flow_state -eq "NEXT_BUILD_PACKET_EXISTS") {
  $laneState = "NEXT_BUILD_PACKET_EXISTS"
  $laneBlocker = ""
  $nextLegalCommand = "Inspect the next-build packet before implementation."
}

$coordinatorStatus = if ($laneState -eq "NEXT_BUILD_PACKET_EXISTS" -or $laneState -eq "RETURN_DROP_READY_FOR_COMMIT" -or $laneState -eq "MACK_RETURN_READY_FOR_BEN_REVIEW") {
  "ARTIFACT"
} else {
  "ARTIFACT_WITH_BLOCKERS"
}

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_REVIEW_LANE_COORDINATOR_RECEIPT"
  status = $coordinatorStatus
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_REVIEW_LANE_COORDINATOR_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Invoke-MackArchitectureReviewLane.ps1" + ($(if ($CommitReturn) { " -CommitReturn" } else { "" })) + ($(if ($CommitAcceptance) { " -CommitAcceptance" } else { "" })) + ($(if ($BenAccepted) { " -BenAccepted" } else { "" }))
  drop_dir = Convert-ToRepoRelative $DropDir
  intake_path = Convert-ToRepoRelative $IntakePath
  next_build_packet_path = Convert-ToRepoRelative $NextBuildPacketPath
  lane_state = $laneState
  blocker_code = $laneBlocker
  next_legal_command = $nextLegalCommand
  commit_return_requested = [bool]$CommitReturn
  commit_acceptance_requested = [bool]$CommitAcceptance
  ben_accepted = [bool]$BenAccepted
  readbacks = [ordered]@{
    state_before = [ordered]@{
      flow_state = $stateBefore.flow_state
      blocker_code = Get-OptionalString $stateBefore "blocker_code"
      receipt_path = Convert-ToRepoRelative $StateBeforeReceiptPath
    }
    drop_processor = [ordered]@{
      status = $dropReadback.status
      blocker_code = Get-OptionalString $dropReadback "blocker_code"
      candidates_seen = $dropReadback.candidates_seen
      selected_drop_file = Get-OptionalString $dropReadback "selected_drop_file"
      receipt_path = Convert-ToRepoRelative $DropReceiptPath
    }
    state_after_drop = [ordered]@{
      flow_state = $stateAfterDrop.flow_state
      blocker_code = Get-OptionalString $stateAfterDrop "blocker_code"
      receipt_path = Convert-ToRepoRelative $StateAfterDropReceiptPath
    }
    acceptance = if ($acceptanceReadback) {
      [ordered]@{
        status = $acceptanceReadback.status
        blocker_code = Get-OptionalString $acceptanceReadback "blocker_code"
        next_build_packet_exists = $acceptanceReadback.next_build_packet_exists
        receipt_path = Convert-ToRepoRelative $AcceptanceReceiptPath
      }
    } else {
      $null
    }
    state_final = [ordered]@{
      flow_state = $stateFinal.flow_state
      blocker_code = Get-OptionalString $stateFinal "blocker_code"
      receipt_path = Convert-ToRepoRelative $StateFinalReceiptPath
    }
  }
  validation = [ordered]@{
    coordinator_default_is_non_mutating = -not ($CommitReturn -or ($CommitAcceptance -and $BenAccepted))
    commit_return_requires_explicit_switch = $true
    commit_acceptance_requires_explicit_switch_and_ben_accepted = $true
    no_intake_write_without_commit_return = if ($CommitReturn) { $true } else { $intakeBeforeHash -eq $intakeAfterHash }
    no_next_build_write_without_commit_acceptance_and_ben_accepted = if ($CommitAcceptance -and $BenAccepted) { $true } else { ($nextBuildBeforeExists -eq $nextBuildAfterExists -and $nextBuildBeforeHash -eq $nextBuildAfterHash) }
    canonical_intake_not_mutated_unless_explicit_canonical_return_commit = if ($CommitReturn -and $isCanonicalIntake) { $true } else { $canonicalIntakeBeforeHash -eq $canonicalIntakeAfterHash }
    canonical_next_build_not_mutated_unless_explicit_canonical_acceptance_commit = if ($CommitAcceptance -and $BenAccepted -and $isCanonicalNextBuild) { $true } else { ($canonicalNextBuildBeforeExists -eq $canonicalNextBuildAfterExists -and $canonicalNextBuildBeforeHash -eq $canonicalNextBuildAfterHash) }
    no_clipboard_read = $true
    external_send_not_claimed = $true
    no_raw_mack_text_in_coordinator_receipt = $true
    truth_boundary = "This coordinator runs the local Mack review lane and reports the next legal command. It is non-mutating by default, does not read the clipboard, does not send anything to Mack, and only mutates intake or next-build packet behind explicit commit switches."
  }
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Invoke-MackArchitectureReviewLane.ps1"
      sha256 = Get-Sha256FileOrEmpty $PSCommandPath
    },
    [ordered]@{
      path = "scripts/foreman/Get-MackArchitectureReviewFlowState.ps1"
      sha256 = Get-Sha256FileOrEmpty $StatePath
    },
    [ordered]@{
      path = "scripts/foreman/Process-MackArchitectureReturnDrop.ps1"
      sha256 = Get-Sha256FileOrEmpty $DropProcessorPath
    },
    [ordered]@{
      path = "scripts/foreman/Accept-MackArchitectureReturn.ps1"
      sha256 = Get-Sha256FileOrEmpty $AcceptancePath
    },
    [ordered]@{
      path = Convert-ToRepoRelative $IntakePath
      sha256 = $intakeAfterHash
    },
    [ordered]@{
      path = Convert-ToRepoRelative $NextBuildPacketPath
      sha256 = $nextBuildAfterHash
    }
  )
  stop_conditions_respected = @(
    "no deploy",
    "no push",
    "no secrets",
    "no production mutation",
    "no external send claim",
    "no clipboard read",
    "no intake mutation without -CommitReturn",
    "no next-build packet generated without -CommitAcceptance -BenAccepted"
  )
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReceiptPath) | Out-Null
$receipt | ConvertTo-Json -Depth 14 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8

[ordered]@{
  ok = $true
  status = $coordinatorStatus
  lane_state = $laneState
  blocker_code = $laneBlocker
  next_legal_command = $nextLegalCommand
  receipt_path = Convert-ToRepoRelative $ReceiptPath
  commit_return_requested = [bool]$CommitReturn
  commit_acceptance_requested = [bool]$CommitAcceptance
  ben_accepted = [bool]$BenAccepted
  selected_drop_file = Get-OptionalString $dropReadback "selected_drop_file"
  final_flow_state = $stateFinal.flow_state
  canonical_intake_changed = $canonicalIntakeBeforeHash -ne $canonicalIntakeAfterHash
  canonical_next_build_exists = $canonicalNextBuildAfterExists
} | ConvertTo-Json -Depth 8
