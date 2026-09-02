param(
  [switch]$Once,
  [int]$PollSeconds = 5,
  [int]$MaxIterations = 0,
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
$CoordinatorPath = Join-Path $Repo "scripts\foreman\Invoke-MackArchitectureReviewLane.ps1"
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
  $ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_RETURN_DROP_WATCH_RECEIPT_20260706.json"
}

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

function Get-DropSnapshot([string]$PathValue) {
  New-Item -ItemType Directory -Force -Path $PathValue | Out-Null
  $files = @(
    Get-ChildItem -LiteralPath $PathValue -File -ErrorAction SilentlyContinue |
      Where-Object {
        ($_.Extension.ToLowerInvariant() -eq ".txt" -or $_.Extension.ToLowerInvariant() -eq ".md") -and
        $_.Name -ne "README.md"
      } |
      Sort-Object -Property FullName
  )

  $parts = @()
  foreach ($file in $files) {
    $parts += "$($file.Name)|$($file.LastWriteTimeUtc.ToString("o"))|$($file.Length)"
  }
  $text = $parts -join "`n"
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $hash = ([BitConverter]::ToString($sha.ComputeHash($bytes)) -replace "-", "").ToUpperInvariant()
  } finally {
    $sha.Dispose()
  }

  return [ordered]@{
    candidate_count = $files.Count
    fingerprint = $hash
    files = @($files | ForEach-Object {
      [ordered]@{
        path = Convert-ToRepoRelative $_.FullName
        bytes = $_.Length
        last_write_utc = $_.LastWriteTimeUtc.ToString("o")
      }
    })
  }
}

function Invoke-Coordinator([int]$Iteration) {
  $coordinatorReceiptPath = [System.IO.Path]::ChangeExtension($ReceiptPath, ".lane-$Iteration.json")
  $argumentList = @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $CoordinatorPath,
    "-DropDir",
    $DropDir,
    "-IntakePath",
    $IntakePath,
    "-NextBuildPacketPath",
    $NextBuildPacketPath,
    "-ReceiptPath",
    $coordinatorReceiptPath
  )
  if ($CommitReturn) { $argumentList += "-CommitReturn" }
  if ($CommitAcceptance) { $argumentList += "-CommitAcceptance" }
  if ($BenAccepted) { $argumentList += "-BenAccepted" }

  $output = & powershell.exe @argumentList 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Lane coordinator failed: $($output | Out-String)"
  }
  $readback = Convert-StdoutJson -Output $output -Label "Lane coordinator"
  return [ordered]@{
    iteration = $Iteration
    receipt_path = Convert-ToRepoRelative $coordinatorReceiptPath
    status = $readback.status
    lane_state = $readback.lane_state
    blocker_code = Get-OptionalString $readback "blocker_code"
    next_legal_command = Get-OptionalString $readback "next_legal_command"
    selected_drop_file = Get-OptionalString $readback "selected_drop_file"
    canonical_intake_changed = $readback.canonical_intake_changed
    canonical_next_build_exists = $readback.canonical_next_build_exists
  }
}

Assert-Pass (Test-Path -LiteralPath $CoordinatorPath) "Coordinator path missing: $CoordinatorPath"
Assert-Pass (Test-Path -LiteralPath $IntakePath) "Intake path missing: $IntakePath"
Assert-Pass ($PollSeconds -ge 1) "PollSeconds must be at least 1."
Assert-Pass ($MaxIterations -ge 0) "MaxIterations must be 0 or greater."

$intakeBeforeHash = Get-Sha256FileOrEmpty $IntakePath
$canonicalIntakeBeforeHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$nextBuildBeforeHash = Get-Sha256FileOrEmpty $NextBuildPacketPath
$canonicalNextBuildBeforeHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath
$canonicalNextBuildBeforeExists = Test-Path -LiteralPath $CanonicalNextBuildPath

$cycles = @()
$lastFingerprint = ""
$iteration = 0
$stopReason = ""

while ($true) {
  $iteration += 1
  $snapshot = Get-DropSnapshot $DropDir
  $changed = $snapshot.fingerprint -ne $lastFingerprint
  $shouldRun = $iteration -eq 1 -or $changed
  $coordinator = $null
  if ($shouldRun) {
    $coordinator = Invoke-Coordinator -Iteration $iteration
    $lastFingerprint = $snapshot.fingerprint
  }

  $cycles += [ordered]@{
    iteration = $iteration
    timestamp = (Get-Date).ToUniversalTime().ToString("o")
    changed = $changed
    coordinator_ran = [bool]$coordinator
    snapshot = $snapshot
    coordinator = $coordinator
  }

  if ($Once) {
    $stopReason = "ONCE"
    break
  }
  if ($MaxIterations -gt 0 -and $iteration -ge $MaxIterations) {
    $stopReason = "MAX_ITERATIONS"
    break
  }

  Start-Sleep -Seconds $PollSeconds
}

$intakeAfterHash = Get-Sha256FileOrEmpty $IntakePath
$canonicalIntakeAfterHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$nextBuildAfterHash = Get-Sha256FileOrEmpty $NextBuildPacketPath
$canonicalNextBuildAfterHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath
$canonicalNextBuildAfterExists = Test-Path -LiteralPath $CanonicalNextBuildPath

if (-not $CommitReturn) {
  Assert-Pass ($intakeBeforeHash -eq $intakeAfterHash) "Intake changed without -CommitReturn."
}
if (-not ($CommitAcceptance -and $BenAccepted)) {
  Assert-Pass ($nextBuildBeforeHash -eq $nextBuildAfterHash) "Next-build hash changed without -CommitAcceptance -BenAccepted."
}

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_RETURN_DROP_WATCH_RECEIPT"
  status = "ARTIFACT"
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_RETURN_DROP_WATCH_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Watch-MackArchitectureReturnDrop.ps1" + ($(if ($Once) { " -Once" } else { "" })) + ($(if ($CommitReturn) { " -CommitReturn" } else { "" })) + ($(if ($CommitAcceptance) { " -CommitAcceptance" } else { "" })) + ($(if ($BenAccepted) { " -BenAccepted" } else { "" }))
  drop_dir = Convert-ToRepoRelative $DropDir
  intake_path = Convert-ToRepoRelative $IntakePath
  next_build_packet_path = Convert-ToRepoRelative $NextBuildPacketPath
  once = [bool]$Once
  poll_seconds = $PollSeconds
  max_iterations = $MaxIterations
  stop_reason = $stopReason
  commit_return_requested = [bool]$CommitReturn
  commit_acceptance_requested = [bool]$CommitAcceptance
  ben_accepted = [bool]$BenAccepted
  cycles = $cycles
  validation = [ordered]@{
    once_mode_available = $true
    long_running_mode_available = -not $Once
    coordinator_ran_on_first_iteration = ($cycles.Count -gt 0 -and $cycles[0].coordinator_ran -eq $true)
    commit_return_requires_explicit_switch = $true
    commit_acceptance_requires_explicit_switch_and_ben_accepted = $true
    no_intake_write_without_commit_return = if ($CommitReturn) { $true } else { $intakeBeforeHash -eq $intakeAfterHash }
    no_next_build_write_without_commit_acceptance_and_ben_accepted = if ($CommitAcceptance -and $BenAccepted) { $true } else { $nextBuildBeforeHash -eq $nextBuildAfterHash }
    canonical_intake_not_mutated_unless_explicit_commit = if ($CommitReturn) { $true } else { $canonicalIntakeBeforeHash -eq $canonicalIntakeAfterHash }
    canonical_next_build_packet_absence_preserved = if ($CommitAcceptance -and $BenAccepted) { $true } else { ($canonicalNextBuildBeforeExists -eq $canonicalNextBuildAfterExists -and $canonicalNextBuildBeforeHash -eq $canonicalNextBuildAfterHash) }
    no_clipboard_read = $true
    external_send_not_claimed = $true
    no_raw_mack_text_in_watch_receipt = $true
    truth_boundary = "This watcher polls the local drop folder and runs the lane coordinator. It does not read the clipboard or send anything, and it does not mutate intake or next-build output unless explicit commit switches are provided."
  }
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Watch-MackArchitectureReturnDrop.ps1"
      sha256 = Get-Sha256FileOrEmpty $PSCommandPath
    },
    [ordered]@{
      path = "scripts/foreman/Invoke-MackArchitectureReviewLane.ps1"
      sha256 = Get-Sha256FileOrEmpty $CoordinatorPath
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

$lastCycle = if ($cycles.Count -gt 0) { $cycles[$cycles.Count - 1] } else { $null }
$lastCoordinator = if ($lastCycle) { $lastCycle.coordinator } else { $null }

[ordered]@{
  ok = $true
  status = $receipt.status
  receipt_path = Convert-ToRepoRelative $ReceiptPath
  stop_reason = $stopReason
  cycles = $cycles.Count
  last_candidate_count = if ($lastCycle) { $lastCycle.snapshot.candidate_count } else { 0 }
  last_lane_state = if ($lastCoordinator) { $lastCoordinator.lane_state } else { "" }
  last_blocker_code = if ($lastCoordinator) { $lastCoordinator.blocker_code } else { "" }
  last_next_legal_command = if ($lastCoordinator) { $lastCoordinator.next_legal_command } else { "" }
  canonical_intake_changed = $canonicalIntakeBeforeHash -ne $canonicalIntakeAfterHash
  canonical_next_build_exists = $canonicalNextBuildAfterExists
} | ConvertTo-Json -Depth 8
