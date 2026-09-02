param(
  [switch]$Commit,
  [switch]$BenAccepted,
  [string]$IntakePath,
  [string]$NextBuildPacketPath,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$ValidatorPath = Join-Path $Repo "scripts\foreman\mack-architecture-return-intake-validator.mjs"
$CanonicalIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
$CanonicalNextBuildPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_NEXT_BUILD_PACKET_FROM_RETURN_20260706.md"

if (-not $IntakePath) {
  $IntakePath = $CanonicalIntakePath
}
if (-not $NextBuildPacketPath) {
  $NextBuildPacketPath = $CanonicalNextBuildPath
}
if (-not $ReceiptPath) {
  $ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_RETURN_ACCEPTANCE_RECEIPT_20260706.json"
}

$ValidatorReceiptPath = [System.IO.Path]::ChangeExtension($ReceiptPath, ".validator.json")

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

Assert-Pass (Test-Path -LiteralPath $ValidatorPath) "Validator path missing: $ValidatorPath"
Assert-Pass (Test-Path -LiteralPath $IntakePath) "Intake path missing: $IntakePath"

$nextBuildBeforeExists = Test-Path -LiteralPath $NextBuildPacketPath
$nextBuildBeforeHash = Get-Sha256FileOrEmpty $NextBuildPacketPath
$canonicalNextBuildBeforeExists = Test-Path -LiteralPath $CanonicalNextBuildPath
$canonicalNextBuildBeforeHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath

$validatorArgs = @($ValidatorPath, "--convert")
if ($Commit -and $BenAccepted) {
  $validatorArgs += "--ben-accepted"
}

$oldLocation = Get-Location
$oldValidatorIntake = $env:MACK_ARCHITECTURE_INTAKE_PATH
$oldValidatorReceipt = $env:MACK_ARCHITECTURE_VALIDATOR_RECEIPT_PATH
$oldNextBuild = $env:MACK_ARCHITECTURE_NEXT_BUILD_PACKET_PATH
try {
  Set-Location -LiteralPath $Repo
  $env:MACK_ARCHITECTURE_INTAKE_PATH = $IntakePath
  $env:MACK_ARCHITECTURE_VALIDATOR_RECEIPT_PATH = $ValidatorReceiptPath
  $env:MACK_ARCHITECTURE_NEXT_BUILD_PACKET_PATH = $NextBuildPacketPath

  $validatorOutput = & node @validatorArgs 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Return acceptance validator failed: $($validatorOutput | Out-String)"
  }
  $validatorReadback = Convert-StdoutJson -Output $validatorOutput -Label "Return acceptance validator"
} finally {
  Set-Location -LiteralPath $oldLocation
  $env:MACK_ARCHITECTURE_INTAKE_PATH = $oldValidatorIntake
  $env:MACK_ARCHITECTURE_VALIDATOR_RECEIPT_PATH = $oldValidatorReceipt
  $env:MACK_ARCHITECTURE_NEXT_BUILD_PACKET_PATH = $oldNextBuild
}

Assert-Pass (Test-Path -LiteralPath $ValidatorReceiptPath) "Validator receipt missing: $ValidatorReceiptPath"
$validatorReceipt = Read-JsonFile $ValidatorReceiptPath

$nextBuildAfterExists = Test-Path -LiteralPath $NextBuildPacketPath
$nextBuildAfterHash = Get-Sha256FileOrEmpty $NextBuildPacketPath
$canonicalNextBuildAfterExists = Test-Path -LiteralPath $CanonicalNextBuildPath
$canonicalNextBuildAfterHash = Get-Sha256FileOrEmpty $CanonicalNextBuildPath
$validatorBlocker = Get-OptionalString $validatorReadback "blocker_code"

if (-not ($Commit -and $BenAccepted)) {
  Assert-Pass ($nextBuildBeforeExists -eq $nextBuildAfterExists) "Next-build packet existence changed without explicit Commit and BenAccepted."
  Assert-Pass ($nextBuildBeforeHash -eq $nextBuildAfterHash) "Next-build packet hash changed without explicit Commit and BenAccepted."
}

$isCanonicalNextBuildTarget = [System.IO.Path]::GetFullPath($NextBuildPacketPath).Equals(
  [System.IO.Path]::GetFullPath($CanonicalNextBuildPath),
  [System.StringComparison]::OrdinalIgnoreCase
)
if (-not ($Commit -and $BenAccepted -and $isCanonicalNextBuildTarget)) {
  Assert-Pass ($canonicalNextBuildBeforeExists -eq $canonicalNextBuildAfterExists) "Canonical next-build existence changed without explicit canonical Commit and BenAccepted."
  Assert-Pass ($canonicalNextBuildBeforeHash -eq $canonicalNextBuildAfterHash) "Canonical next-build hash changed without explicit canonical Commit and BenAccepted."
}

$wrapperStatus = if ($Commit -and $BenAccepted -and $validatorReadback.status -eq "ARTIFACT" -and $nextBuildAfterExists) {
  "ARTIFACT"
} else {
  "BLOCKER"
}
$wrapperBlocker = if ($wrapperStatus -eq "ARTIFACT") {
  ""
} elseif ($validatorBlocker) {
  $validatorBlocker
} elseif (-not $Commit) {
  "DRY_RUN_ACCEPTANCE_NOT_COMMITTED"
} elseif (-not $BenAccepted) {
  "BEN_ACCEPTANCE_FLAG_REQUIRED"
} else {
  "NEXT_BUILD_PACKET_NOT_WRITTEN"
}

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_RETURN_ACCEPTANCE_RECEIPT"
  status = $wrapperStatus
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_RETURN_ACCEPTANCE_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Accept-MackArchitectureReturn.ps1" + ($(if ($Commit) { " -Commit" } else { "" })) + ($(if ($BenAccepted) { " -BenAccepted" } else { "" }))
  intake_path = Convert-ToRepoRelative $IntakePath
  next_build_packet_path = Convert-ToRepoRelative $NextBuildPacketPath
  commit_requested = [bool]$Commit
  ben_accepted = [bool]$BenAccepted
  validator_readback = [ordered]@{
    status = $validatorReadback.status
    blocker_code = $validatorBlocker
    receipt_path = Convert-ToRepoRelative $ValidatorReceiptPath
    classification_status = Get-OptionalString $validatorReceipt.classification "status"
    next_build_packet = $validatorReadback.next_build_packet
  }
  next_build_packet = [ordered]@{
    existed_before = $nextBuildBeforeExists
    exists_after = $nextBuildAfterExists
    sha256_after = $nextBuildAfterHash
  }
  validation = [ordered]@{
    dry_run_default_blocks_write = -not $Commit
    commit_requires_explicit_switch = $true
    ben_acceptance_requires_explicit_switch = $true
    no_next_build_write_without_commit_and_ben_accepted = if ($Commit -and $BenAccepted) { $true } else { ($nextBuildBeforeExists -eq $nextBuildAfterExists -and $nextBuildBeforeHash -eq $nextBuildAfterHash) }
    canonical_next_build_packet_existence_preserved_unless_canonical_commit_and_ben_accepted = if ($Commit -and $BenAccepted -and $isCanonicalNextBuildTarget) { $true } else { ($canonicalNextBuildBeforeExists -eq $canonicalNextBuildAfterExists -and $canonicalNextBuildBeforeHash -eq $canonicalNextBuildAfterHash) }
    wrapper_receipt_contains_no_raw_mack_text = $true
    external_send_not_claimed = $true
    truth_boundary = "This acceptance wrapper validates a Mack return and writes a next-build packet only when both -Commit and -BenAccepted are provided. It does not send anything to Mack and does not claim Ben accepted the return unless the explicit flags are present."
  }
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Accept-MackArchitectureReturn.ps1"
      sha256 = Get-Sha256FileOrEmpty $PSCommandPath
    },
    [ordered]@{
      path = "scripts/foreman/mack-architecture-return-intake-validator.mjs"
      sha256 = Get-Sha256FileOrEmpty $ValidatorPath
    },
    [ordered]@{
      path = Convert-ToRepoRelative $IntakePath
      sha256 = Get-Sha256FileOrEmpty $IntakePath
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
    "no Mack receipt claim",
    "no Ben acceptance claim without -BenAccepted",
    "no next-build packet generated without -Commit and -BenAccepted"
  )
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReceiptPath) | Out-Null
$receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8

[ordered]@{
  ok = $true
  status = $wrapperStatus
  blocker_code = $wrapperBlocker
  receipt_path = Convert-ToRepoRelative $ReceiptPath
  validator_receipt_path = Convert-ToRepoRelative $ValidatorReceiptPath
  intake_path = Convert-ToRepoRelative $IntakePath
  next_build_packet_path = Convert-ToRepoRelative $NextBuildPacketPath
  commit_requested = [bool]$Commit
  ben_accepted = [bool]$BenAccepted
  validator_status = $validatorReadback.status
  validator_blocker_code = $validatorBlocker
  next_build_packet_exists = $nextBuildAfterExists
  canonical_next_build_exists = $canonicalNextBuildAfterExists
} | ConvertTo-Json -Depth 8
