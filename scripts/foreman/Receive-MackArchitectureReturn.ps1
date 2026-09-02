param(
  [switch]$Commit,
  [switch]$AllowFreeform,
  [string]$InputPath,
  [string]$IntakePath,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$ImporterPath = Join-Path $Repo "scripts\foreman\Import-MackArchitectureReturnFromClipboard.ps1"
$ValidatorPath = Join-Path $Repo "scripts\foreman\mack-architecture-return-intake-validator.mjs"
$CanonicalIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
$CanonicalNextBuildPath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_NEXT_BUILD_PACKET_FROM_RETURN_20260706.md"

if (-not $IntakePath) {
  $IntakePath = $CanonicalIntakePath
}
if (-not $ReceiptPath) {
  $ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_RETURN_RECEIVE_RECEIPT_20260706.json"
}

$ImportReceiptPath = [System.IO.Path]::ChangeExtension($ReceiptPath, ".import.json")
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

foreach ($required in @($ImporterPath, $ValidatorPath, $IntakePath)) {
  Assert-Pass (Test-Path -LiteralPath $required) "Required path missing: $required"
}
if ($InputPath) {
  Assert-Pass (Test-Path -LiteralPath $InputPath) "Input path missing: $InputPath"
}

$intakeBeforeHash = Get-Sha256FileOrEmpty $IntakePath
$canonicalBeforeHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$nextBuildBeforeExists = Test-Path -LiteralPath $CanonicalNextBuildPath

$importArgs = @(
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  $ImporterPath,
  "-IntakePath",
  $IntakePath,
  "-ReceiptPath",
  $ImportReceiptPath
)
if ($InputPath) {
  $importArgs += @("-InputPath", $InputPath)
}
if ($Commit) {
  $importArgs += "-Commit"
}
if ($AllowFreeform) {
  $importArgs += "-AllowFreeform"
}

$oldLocation = Get-Location
try {
  Set-Location -LiteralPath $Repo
  $importOutput = & powershell.exe @importArgs 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Return importer failed: $($importOutput | Out-String)"
  }
  $importReadback = Convert-StdoutJson -Output $importOutput -Label "Return importer"

  Assert-Pass (Test-Path -LiteralPath $ImportReceiptPath) "Importer receipt missing: $ImportReceiptPath"
  $importReceipt = Read-JsonFile $ImportReceiptPath

  $oldValidatorIntake = $env:MACK_ARCHITECTURE_INTAKE_PATH
  $oldValidatorReceipt = $env:MACK_ARCHITECTURE_VALIDATOR_RECEIPT_PATH
  try {
    $env:MACK_ARCHITECTURE_INTAKE_PATH = $IntakePath
    $env:MACK_ARCHITECTURE_VALIDATOR_RECEIPT_PATH = $ValidatorReceiptPath
    $validatorOutput = & node $ValidatorPath 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "Return validator failed: $($validatorOutput | Out-String)"
    }
    $validatorReadback = Convert-StdoutJson -Output $validatorOutput -Label "Return validator"
  } finally {
    $env:MACK_ARCHITECTURE_INTAKE_PATH = $oldValidatorIntake
    $env:MACK_ARCHITECTURE_VALIDATOR_RECEIPT_PATH = $oldValidatorReceipt
  }
} finally {
  Set-Location -LiteralPath $oldLocation
}

Assert-Pass (Test-Path -LiteralPath $ValidatorReceiptPath) "Validator receipt missing: $ValidatorReceiptPath"
$validatorReceipt = Read-JsonFile $ValidatorReceiptPath

$intakeAfterHash = Get-Sha256FileOrEmpty $IntakePath
$canonicalAfterHash = Get-Sha256FileOrEmpty $CanonicalIntakePath
$nextBuildAfterExists = Test-Path -LiteralPath $CanonicalNextBuildPath
$intakeChanged = $intakeBeforeHash -ne $intakeAfterHash
$canonicalIntakeChanged = $canonicalBeforeHash -ne $canonicalAfterHash

if (-not $Commit) {
  Assert-Pass (-not $intakeChanged) "Intake changed during receive dry-run."
}
Assert-Pass ($nextBuildBeforeExists -eq $nextBuildAfterExists) "Next-build packet existence changed during receive."

$validatorBlocker = Get-OptionalString $validatorReadback "blocker_code"
$importBlocker = Get-OptionalString $importReadback "blocker_code"
$wrapperStatus = if ($importReadback.status -eq "BLOCKER") {
  "BLOCKER"
} elseif ($Commit -and $validatorReadback.status -ne "ARTIFACT") {
  "BLOCKER"
} else {
  "ARTIFACT"
}
$wrapperBlocker = if ($importBlocker) {
  $importBlocker
} elseif ($Commit -and $validatorBlocker) {
  $validatorBlocker
} else {
  ""
}

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_RETURN_RECEIVE_RECEIPT"
  status = $wrapperStatus
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_RETURN_RECEIVE_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Receive-MackArchitectureReturn.ps1" + ($(if ($Commit) { " -Commit" } else { "" })) + ($(if ($AllowFreeform) { " -AllowFreeform" } else { "" })) + ($(if ($InputPath) { " -InputPath `"$InputPath`"" } else { "" }))
  intake_path = Convert-ToRepoRelative $IntakePath
  input_source = if ($InputPath) { "file" } else { "clipboard" }
  commit_requested = [bool]$Commit
  allow_freeform = [bool]$AllowFreeform
  import_readback = [ordered]@{
    status = $importReadback.status
    blocker_code = $importBlocker
    receipt_path = Convert-ToRepoRelative $ImportReceiptPath
    structured_return_detected = [bool]$importReadback.structured_return_detected
    import_committed = [bool]$importReadback.import_committed
    candidate_sha256 = Get-OptionalString $importReceipt "candidate_sha256"
  }
  validator_readback = [ordered]@{
    status = $validatorReadback.status
    blocker_code = $validatorBlocker
    receipt_path = Convert-ToRepoRelative $ValidatorReceiptPath
    classification_status = Get-OptionalString $validatorReceipt.classification "status"
    filled_required_count = $validatorReceipt.classification.filledRequiredCount
    next_build_packet = $validatorReadback.next_build_packet
  }
  validation = [ordered]@{
    dry_run_default = -not $Commit
    commit_requires_explicit_switch = $true
    no_intake_write_without_commit = if ($Commit) { $true } else { -not $intakeChanged }
    importer_receipt_written = Test-Path -LiteralPath $ImportReceiptPath
    validator_receipt_written = Test-Path -LiteralPath $ValidatorReceiptPath
    wrapper_receipt_contains_no_raw_mack_text = $true
    external_send_not_claimed = $true
    mack_return_not_claimed_for_canonical_intake_unless_committed = -not ((-not $Commit) -and $canonicalIntakeChanged)
    canonical_next_build_packet_existence_preserved = $nextBuildBeforeExists -eq $nextBuildAfterExists
    truth_boundary = "This receiver wraps the local importer and validator. Dry-run does not write intake. Commit writes only when -Commit is provided. It does not send anything to Mack and does not claim Mack returned review unless supplied text is imported."
  }
  file_hashes = @(
    [ordered]@{
      path = "scripts/foreman/Receive-MackArchitectureReturn.ps1"
      sha256 = Get-Sha256FileOrEmpty $PSCommandPath
    },
    [ordered]@{
      path = "scripts/foreman/Import-MackArchitectureReturnFromClipboard.ps1"
      sha256 = Get-Sha256FileOrEmpty $ImporterPath
    },
    [ordered]@{
      path = "scripts/foreman/mack-architecture-return-intake-validator.mjs"
      sha256 = Get-Sha256FileOrEmpty $ValidatorPath
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
    "no clipboard mutation",
    "no intake mutation without -Commit",
    "no canonical next-build packet generated"
  )
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $ReceiptPath) | Out-Null
$receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8

[ordered]@{
  ok = $true
  status = $wrapperStatus
  blocker_code = $wrapperBlocker
  receipt_path = Convert-ToRepoRelative $ReceiptPath
  import_receipt_path = Convert-ToRepoRelative $ImportReceiptPath
  validator_receipt_path = Convert-ToRepoRelative $ValidatorReceiptPath
  intake_path = Convert-ToRepoRelative $IntakePath
  input_source = if ($InputPath) { "file" } else { "clipboard" }
  commit_requested = [bool]$Commit
  import_committed = [bool]$importReadback.import_committed
  validator_status = $validatorReadback.status
  validator_blocker_code = $validatorBlocker
  canonical_next_build_exists = $nextBuildAfterExists
} | ConvertTo-Json -Depth 8
