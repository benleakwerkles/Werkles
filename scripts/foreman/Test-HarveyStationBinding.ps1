[CmdletBinding()]
param(
  [ValidateSet("Inspect", "LocalEdit", "Stage", "Commit", "Push", "PullRequest", "Upload", "CreateProject")]
  [string]$Operation = "Inspect",
  [string]$RepoPath,
  [string]$AuthorityReceiptPath
)

$ErrorActionPreference = "Stop"

$ExpectedProjectNamespace = "WERKLES_HARVEY_ODDLY_GODLY"
$ExpectedRepoFullName = "benleakwerkles/Werkles"
$ExpectedRepoId = 1242158598
$ExpectedRemote = "https://github.com/benleakwerkles/Werkles.git"
$ExpectedBranch = "main"
$ExpectedProviderOwner = "benleakwerkles"
$GuardedOperations = @("Stage", "Commit", "Push", "PullRequest", "Upload", "CreateProject")

if (-not $RepoPath) {
  $RepoPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
}

$blockers = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()

function Add-Blocker {
  param([string]$Code)
  if (-not $blockers.Contains($Code)) { [void]$blockers.Add($Code) }
}

function Add-Warning {
  param([string]$Message)
  if (-not $warnings.Contains($Message)) { [void]$warnings.Add($Message) }
}

function Invoke-GitText {
  param([string[]]$GitArgs)
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $output = & git -C $RepoPath @GitArgs 2>$null
    if ($LASTEXITCODE -ne 0) { return $null }
    return (($output | ForEach-Object { [string]$_ }) -join "`n").Trim()
  } finally {
    $ErrorActionPreference = $previousPreference
  }
}

$resolvedRepoPath = $null
$gitRoot = $null
$origin = $null
$pushOrigin = $null
$branch = $null
$head = $null
$dirtyCount = $null
$stagedCount = $null
$observedRepoFullName = $null
$observedRepoId = $null
$providerAuthority = "UNPROVEN_CURRENT"

if (-not (Test-Path -LiteralPath $RepoPath)) {
  Add-Blocker "HARVEY_STATION_REPO_BINDING_UNPROVEN"
} else {
  $resolvedRepoPath = (Resolve-Path -LiteralPath $RepoPath).Path
  $gitRoot = Invoke-GitText -GitArgs @("rev-parse", "--show-toplevel")
  if (-not $gitRoot) {
    Add-Blocker "HARVEY_STATION_REPO_BINDING_UNPROVEN"
  } else {
    $gitRoot = (Resolve-Path -LiteralPath $gitRoot).Path
    $origin = Invoke-GitText -GitArgs @("remote", "get-url", "origin")
    $pushOrigin = Invoke-GitText -GitArgs @("remote", "get-url", "--push", "origin")
    $branch = Invoke-GitText -GitArgs @("branch", "--show-current")
    $head = Invoke-GitText -GitArgs @("rev-parse", "HEAD")
    $dirtyText = Invoke-GitText -GitArgs @("status", "--porcelain=v1")
    $stagedText = Invoke-GitText -GitArgs @("diff", "--cached", "--name-only")
    $dirtyCount = if ($dirtyText) { @($dirtyText -split "`n").Count } else { 0 }
    $stagedCount = if ($stagedText) { @($stagedText -split "`n").Count } else { 0 }

    if ($origin -eq $ExpectedRemote -and $pushOrigin -eq $ExpectedRemote) {
      $observedRepoFullName = $ExpectedRepoFullName
    } else {
      Add-Blocker "HARVEY_STATION_REPO_BINDING_MISMATCH"
    }
    if ($branch -ne $ExpectedBranch) {
      Add-Blocker "HARVEY_STATION_REPO_BINDING_MISMATCH"
    }
    if ($dirtyCount -gt 0) { Add-Warning "WORKING_TREE_DIRTY_PRESERVE_UNRELATED_WORK" }
    if ($stagedCount -gt 0) { Add-Warning "INDEX_ALREADY_CONTAINS_STAGED_WORK" }
  }
}

try {
  $headers = @{ "User-Agent" = "Werkles-Harvey-Station-Guard"; "Accept" = "application/vnd.github+json" }
  $metadata = Invoke-RestMethod -Method Get -Uri "https://api.github.com/repos/$ExpectedRepoFullName" -Headers $headers -TimeoutSec 15
  $observedRepoId = [int64]$metadata.id
  if ([string]$metadata.full_name -ne $ExpectedRepoFullName -or $observedRepoId -ne $ExpectedRepoId) {
    Add-Blocker "HARVEY_STATION_REPO_BINDING_MISMATCH"
  }
} catch {
  Add-Blocker "HARVEY_STATION_REPO_BINDING_UNPROVEN"
}

if ($GuardedOperations -contains $Operation) {
  $authority = $null
  if ($AuthorityReceiptPath -and (Test-Path -LiteralPath $AuthorityReceiptPath)) {
    try { $authority = Get-Content -LiteralPath $AuthorityReceiptPath -Raw | ConvertFrom-Json } catch { $authority = $null }
  }
  if (-not $authority) {
    Add-Blocker "HARVEY_STATION_PROVIDER_AUTHORITY_UNPROVEN"
  } else {
    $allowedOperations = @($authority.allowed_operations)
    if (
      $authority.project_namespace -ne $ExpectedProjectNamespace -or
      $authority.repo_full_name -ne $ExpectedRepoFullName -or
      [int64]$authority.repo_id -ne $ExpectedRepoId -or
      $authority.provider_owner -ne $ExpectedProviderOwner -or
      $allowedOperations -notcontains $Operation -or
      $authority.approved_by -ne "Ben Leak"
    ) {
      Add-Blocker "HARVEY_STATION_PROVIDER_AUTHORITY_UNPROVEN"
    } else {
      $providerAuthority = "PROVEN_BY_EXPLICIT_AUTHORITY_RECEIPT"
    }
  }
}

$pass = ($blockers.Count -eq 0)
$receipt = [ordered]@{
  schema = "werkles.harvey-station-binding-receipt/v1"
  guard_id = "HARVEY_STATION_IDENTITY_BOUNDARY_20260713"
  checked_at = (Get-Date).ToString("o")
  operation = $Operation
  execution_context = "CODEX_LOCAL"
  machine = $env:COMPUTERNAME
  hostname = $env:COMPUTERNAME
  os_user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  expected_project_namespace = $ExpectedProjectNamespace
  expected_repo_full_name = $ExpectedRepoFullName
  expected_repo_id = $ExpectedRepoId
  observed_repo_full_name = if ($observedRepoFullName) { $observedRepoFullName } else { "UNAVAILABLE" }
  observed_repo_id = if ($null -ne $observedRepoId) { $observedRepoId } else { "UNAVAILABLE" }
  repo_path = if ($gitRoot) { $gitRoot } else { $resolvedRepoPath }
  origin = $origin
  push_origin = $pushOrigin
  branch = $branch
  head = $head
  dirty_entries = $dirtyCount
  staged_entries = $stagedCount
  provider_authority = $providerAuthority
  adjacent_projects_touched = @()
  mutations_performed = $false
  pass = $pass
  blockers = @($blockers)
  warnings = @($warnings)
}

$receipt | ConvertTo-Json -Depth 8
if (-not $pass) { exit 1 }
