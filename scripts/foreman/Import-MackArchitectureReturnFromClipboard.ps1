param(
  [switch]$Commit,
  [switch]$AllowFreeform,
  [string]$InputPath,
  [string]$IntakePath,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"

$Repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
if (-not $IntakePath) {
  $IntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
}
if (-not $ReceiptPath) {
  $ReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_RETURN_CLIPBOARD_IMPORT_RECEIPT_20260706.json"
}
$ValidatorPath = Join-Path $Repo "scripts\foreman\mack-architecture-return-intake-validator.mjs"
$DefaultIntakePath = Join-Path $Repo "foreman\source_material\manuscript_workbench\tinkularity\architecture\MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md"
$DefaultValidatorReceiptPath = Join-Path $Repo "foreman\receipts\MACK_ARCHITECTURE_RETURN_INTAKE_VALIDATOR_RECEIPT_20260706.json"

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

function Get-Sha256([string]$Text) {
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  try {
    $hash = $sha.ComputeHash($bytes)
    return ([BitConverter]::ToString($hash) -replace "-", "").ToUpperInvariant()
  } finally {
    $sha.Dispose()
  }
}

function Get-InputText {
  if ($InputPath) {
    if (-not (Test-Path -LiteralPath $InputPath)) {
      throw "Input path missing: $InputPath"
    }
    return Get-Content -Raw -LiteralPath $InputPath
  }
  return Get-Clipboard -Raw
}

function New-StructuredIntakeText([string]$Existing, [string]$ReturnText, [bool]$Freeform) {
  $normalized = ($ReturnText -replace "`r`n", "`n").Trim()
  if ($Freeform) {
    $normalized = @"
FREEFORM MACK RETURN
status: NEEDS_NORMALIZATION

raw_return:
$normalized
"@.Trim()
  }

  $fence = '```'
  $block = "## Paste Mack Return Below`n`n" + $fence + "text`n" + $normalized + "`n" + $fence + "`n`n"

  $updated = $Existing -replace "Status:\s*WAITING_FOR_MACK_RETURN", "Status: MACK_RETURN_CAPTURED"
  $updated = $updated -replace "Mack review has not been received yet\.", "Mack review has been pasted into this intake. Run the validator before converting anything into a build packet."
  $pattern = '(?s)## Paste Mack Return Below\s+```text.*?```\s+(?=## Intake Rules)'
  if ($updated -notmatch $pattern) {
    throw "Intake file does not contain the expected paste block."
  }
  return [regex]::Replace($updated, $pattern, $block)
}

if (-not (Test-Path -LiteralPath $IntakePath)) {
  throw "Intake path missing: $IntakePath"
}
if (-not (Test-Path -LiteralPath $ValidatorPath)) {
  throw "Validator path missing: $ValidatorPath"
}

$existingIntake = Get-Content -Raw -LiteralPath $IntakePath
$inputText = Get-InputText
$normalizedInput = ($inputText -replace "`r`n", "`n").Trim()
$hasInput = $normalizedInput.Length -gt 0
$structured = $normalizedInput -match "(?m)^\s*MACK REVIEW RETURN\s*$"
$blocked = $false
$blockerCode = ""
$importCommitted = $false
$validatorReadback = $null
$candidateHash = ""

if (-not $hasInput) {
  $blocked = $true
  $blockerCode = "MACK_RETURN_INPUT_EMPTY"
} elseif (-not $structured -and -not $AllowFreeform) {
  $blocked = $true
  $blockerCode = "MACK_RETURN_NOT_STRUCTURED"
}

if ($hasInput) {
  $candidateHash = Get-Sha256 $normalizedInput
}

if (-not $blocked -and $Commit) {
  $candidateIntake = New-StructuredIntakeText -Existing $existingIntake -ReturnText $normalizedInput -Freeform:(-not $structured)
  Set-Content -LiteralPath $IntakePath -Value $candidateIntake -Encoding UTF8
  $importCommitted = $true

  $oldValidatorIntake = $env:MACK_ARCHITECTURE_INTAKE_PATH
  $oldValidatorReceipt = $env:MACK_ARCHITECTURE_VALIDATOR_RECEIPT_PATH
  try {
    $env:MACK_ARCHITECTURE_INTAKE_PATH = $IntakePath
    if ((Resolve-Path -LiteralPath $IntakePath).Path -ne (Resolve-Path -LiteralPath $DefaultIntakePath).Path) {
      $env:MACK_ARCHITECTURE_VALIDATOR_RECEIPT_PATH = [System.IO.Path]::ChangeExtension($ReceiptPath, ".validator.json")
    } else {
      $env:MACK_ARCHITECTURE_VALIDATOR_RECEIPT_PATH = $DefaultValidatorReceiptPath
    }

    $validator = & node $ValidatorPath 2>&1
    if ($LASTEXITCODE -ne 0) {
      throw "Validator failed after import: $validator"
    }
    $validatorReadback = $validator | ConvertFrom-Json
  } finally {
    $env:MACK_ARCHITECTURE_INTAKE_PATH = $oldValidatorIntake
    $env:MACK_ARCHITECTURE_VALIDATOR_RECEIPT_PATH = $oldValidatorReceipt
  }
}

$receipt = [ordered]@{
  schema = "MACK_ARCHITECTURE_RETURN_CLIPBOARD_IMPORT_RECEIPT"
  status = if ($blocked) { "BLOCKER" } else { "ARTIFACT" }
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
  machine = $env:COMPUTERNAME
  agent = "Heimerdinker@Betsy"
  packet_id = "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706"
  receipt_id = "MACK_ARCHITECTURE_RETURN_CLIPBOARD_IMPORT_RECEIPT_20260706"
  repo = $Repo
  command = "powershell -NoProfile -ExecutionPolicy Bypass -File scripts\foreman\Import-MackArchitectureReturnFromClipboard.ps1" + ($(if ($Commit) { " -Commit" } else { "" })) + ($(if ($AllowFreeform) { " -AllowFreeform" } else { "" })) + ($(if ($InputPath) { " -InputPath `"$InputPath`"" } else { "" }))
  intake_path = Convert-ToRepoRelative $IntakePath
  input_source = if ($InputPath) { "file" } else { "clipboard" }
  input_present = $hasInput
  structured_return_detected = $structured
  allow_freeform = [bool]$AllowFreeform
  import_committed = $importCommitted
  blocker_code = $blockerCode
  candidate_sha256 = $candidateHash
  validator_readback = $validatorReadback
  validation = [ordered]@{
    dry_run_default = -not $Commit
    commit_requires_explicit_switch = $true
    unstructured_input_blocks_without_allow_freeform = $true
    no_fake_mack_receipt_claim = $true
    truth_boundary = "This importer only captures Mack text into the local intake when -Commit is provided. A dry run or blocked run does not modify the intake and does not claim Mack returned a review."
  }
  stop_conditions_respected = @(
    "no deploy",
    "no push",
    "no secrets",
    "no production mutation",
    "no external send claim",
    "no Mack receipt claim unless committed input is provided"
  )
}

$receiptDir = Split-Path -Parent $ReceiptPath
New-Item -ItemType Directory -Force -Path $receiptDir | Out-Null
$receiptJson = $receipt | ConvertTo-Json -Depth 10
Set-Content -LiteralPath $ReceiptPath -Value $receiptJson -Encoding UTF8

$receiptOut = [ordered]@{
  ok = $true
  status = $receipt.status
  blocker_code = $blockerCode
  receipt_path = Convert-ToRepoRelative $ReceiptPath
  intake_path = Convert-ToRepoRelative $IntakePath
  structured_return_detected = $structured
  import_committed = $importCommitted
}

$receiptOut | ConvertTo-Json -Depth 6
