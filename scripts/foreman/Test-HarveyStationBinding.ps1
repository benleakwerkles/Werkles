[CmdletBinding()]
param(
  [ValidateSet("Inspect", "LocalEdit", "Stage", "Commit", "Push", "PullRequest", "Upload", "CreateProject")]
  [string]$Operation = "Inspect",
  [string]$RepoPath,
  # Deprecated and deliberately untrusted. Kept only so old callers fail closed with a receipt.
  [string]$AuthorityReceiptPath
)

$ErrorActionPreference = "Stop"

$ExpectedProjectNamespace = "WERKLES_HARVEY_ODDLY_GODLY"
$ExpectedRepoFullName = "benleakwerkles/Werkles"
$ExpectedRepoId = 1242158598
$ExpectedRemote = "https://github.com/benleakwerkles/Werkles.git"
$ExpectedProviderOwner = "benleakwerkles"
$GuardedOperations = @("Stage", "Commit", "Push", "PullRequest", "Upload", "CreateProject")
$LocalNonGateOperations = @("Stage", "Commit")
$SeparateHumanGateOperations = @("Push", "PullRequest", "Upload", "CreateProject")

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
$providerHeadBound = $false

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
    if (-not $head -or $head -notmatch '^[a-f0-9]{40}$') {
      Add-Blocker "HARVEY_STATION_PROVIDER_HEAD_UNPROVEN"
    }
    $branchAllowed = if ($Operation -in @("LocalEdit", "Stage", "Commit")) {
      $branch -like "codex/*"
    } else {
      $branch -eq "main" -or $branch -like "codex/*"
    }
    if (-not $branchAllowed) {
      Add-Blocker "HARVEY_STATION_BRANCH_NOT_ALLOWED"
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
  if ($head -and $head -match '^[a-f0-9]{40}$') {
    $providerCommit = Invoke-RestMethod -Method Get -Uri "https://api.github.com/repos/$ExpectedRepoFullName/commits/$head" -Headers $headers -TimeoutSec 15
    $providerHeadBound = ([string]$providerCommit.sha -eq $head)
  }
  if (-not $providerHeadBound) { Add-Blocker "HARVEY_STATION_PROVIDER_HEAD_UNPROVEN" }
} catch {
  Add-Blocker "HARVEY_STATION_PROVIDER_HEAD_UNPROVEN"
}

if ($GuardedOperations -contains $Operation) {
  if ($AuthorityReceiptPath) {
    Add-Blocker "HARVEY_STATION_UNTRUSTED_AUTHORITY_RECEIPT_FORBIDDEN"
  }

  # Stage and Commit are local, reversible, non-production operations under
  # foreman/HUMAN_GATES.md. They require a provider-bound station, but they do
  # not acquire or claim human authority from writable worktree text.
  if ($providerHeadBound -and $LocalNonGateOperations -contains $Operation) {
    $providerAuthority = "NOT_REQUIRED_NON_GATE_LOCAL_OPERATION"
  }

  # Push, PR, upload, and project creation remain separate human gates. This
  # guard deliberately has no unsigned local-file path that can unlock them.
  if ($SeparateHumanGateOperations -contains $Operation) {
    Add-Blocker "HARVEY_STATION_PROVIDER_AUTHORITY_UNPROVEN"
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
  branch_policy = "main for canonical truth; codex/* for approved local candidate work"
  head = $head
  provider_head_bound = $providerHeadBound
  dirty_entries = $dirtyCount
  staged_entries = $stagedCount
  provider_authority = $providerAuthority
  authority_source = if ($providerAuthority -eq "NOT_REQUIRED_NON_GATE_LOCAL_OPERATION") { "foreman/HUMAN_GATES.md non-gate local operation; no approval-log authority consumed" } else { "NONE" }
  adjacent_projects_touched = @()
  mutations_performed = $false
  pass = $pass
  blockers = @($blockers)
  warnings = @($warnings)
}

$receipt | ConvertTo-Json -Depth 8
if (-not $pass) { exit 1 }
