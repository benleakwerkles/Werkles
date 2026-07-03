[CmdletBinding()]
param(
  [string]$UserRoot = $env:USERPROFILE,
  [string]$RepoPath = (Join-Path $env:USERPROFILE "github\Werkles"),
  [string]$CanonicalRemote = "https://github.com/benleakwerkles/Werkles.git",
  [string]$CanonicalRepositoryFullName = "benleakwerkles/Werkles",
  [string]$ExpectedGitHubRepositoryId = "1242158598",
  [int]$ScanDepth = 4,
  [ValidateSet("UNKNOWN", "VERIFIED", "NOT_VISIBLE", "BLOCKED")]
  [string]$CodexProjectBindingStatus = "UNKNOWN",
  [string]$CodexProjectBindingEvidence = "",
  [string]$DirtyRootDispositionEvidence = "",
  [switch]$NoWrite
)

$ErrorActionPreference = "Stop"

$checks = [System.Collections.Generic.List[object]]::new()
$blockers = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()

function Add-Check {
  param(
    [string]$Name,
    [bool]$Pass,
    [object]$Details = $null,
    [string]$Blocker = $null,
    [string]$Warning = $null
  )

  [void]$checks.Add([pscustomobject]@{
    name = $Name
    pass = $Pass
    details = $Details
  })

  if (-not $Pass -and $Blocker) {
    [void]$blockers.Add($Blocker)
  }
  if ($Warning -and -not $Pass) {
    [void]$warnings.Add($Warning)
  }
}

function Test-GitRepo {
  param([string]$Path)
  return (Test-Path -LiteralPath (Join-Path $Path ".git"))
}

function Invoke-GitText {
  param(
    [string]$Path,
    [string[]]$GitArgs
  )

  if (-not (Test-GitRepo -Path $Path)) {
    return $null
  }

  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $output = & git -C $Path @GitArgs 2>&1
    $exitCode = $LASTEXITCODE
    if ($exitCode -ne 0) {
      return [pscustomobject]@{
        ok = $false
        exit_code = $exitCode
        text = ($output -join "`n")
      }
    }
    return [pscustomobject]@{
      ok = $true
      exit_code = 0
      text = ($output -join "`n")
    }
  } finally {
    $ErrorActionPreference = $previousPreference
  }
}

function Invoke-RepoScriptJson {
  param(
    [string]$ScriptPath,
    [string[]]$Arguments = @()
  )

  $output = & powershell -NoProfile -ExecutionPolicy Bypass -File $ScriptPath @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "Script failed: $ScriptPath"
  }
  $text = ($output -join "`n")
  return $text | ConvertFrom-Json
}

$canonicalFullPath = [System.IO.Path]::GetFullPath($RepoPath)
$repoExists = Test-Path -LiteralPath $RepoPath
$repoIsGit = $repoExists -and (Test-GitRepo -Path $RepoPath)

Add-Check -Name "canonical_path_exists" -Pass $repoExists -Details $canonicalFullPath -Blocker "Canonical path is missing: $canonicalFullPath"
Add-Check -Name "canonical_path_is_git" -Pass $repoIsGit -Details $canonicalFullPath -Blocker "Canonical path is not a git checkout: $canonicalFullPath"

$origin = $null
$branch = $null
$head = $null
$worktreeStatus = $null
$remoteMain = $null

if ($repoIsGit) {
  $originResult = Invoke-GitText -Path $RepoPath -GitArgs @("remote", "get-url", "origin")
  $origin = if ($originResult.ok) { $originResult.text.Trim() } else { $originResult.text }
  Add-Check -Name "canonical_origin" -Pass ($origin -eq $CanonicalRemote) -Details $origin -Blocker "Canonical origin is not $CanonicalRemote; got $origin"

  $branchResult = Invoke-GitText -Path $RepoPath -GitArgs @("branch", "--show-current")
  $branch = if ($branchResult.ok) { $branchResult.text.Trim() } else { $branchResult.text }
  Add-Check -Name "canonical_branch_main" -Pass ($branch -eq "main") -Details $branch -Blocker "Canonical checkout is not on main; got $branch"

  $headResult = Invoke-GitText -Path $RepoPath -GitArgs @("rev-parse", "--short", "HEAD")
  $head = if ($headResult.ok) { $headResult.text.Trim() } else { $headResult.text }

  $statusResult = Invoke-GitText -Path $RepoPath -GitArgs @("status", "--porcelain=v1")
  $worktreeStatus = if ($statusResult.ok) { $statusResult.text } else { $statusResult.text }
  Add-Check -Name "canonical_worktree_clean" -Pass ([string]::IsNullOrWhiteSpace($worktreeStatus)) -Details $worktreeStatus -Warning "Canonical checkout has uncommitted work; finish or commit before ground-zero COMPLETE."

  $remoteMainResult = Invoke-GitText -Path $RepoPath -GitArgs @("ls-remote", "--heads", "origin", "main")
  $remoteMain = if ($remoteMainResult.ok) { $remoteMainResult.text.Trim() } else { $remoteMainResult.text }
  Add-Check -Name "github_origin_main_readable" -Pass ($remoteMain -match "refs/heads/main") -Details $remoteMain -Blocker "Could not read origin/main from GitHub remote."
}

$githubApiReadback = $null
try {
  $githubApiUrl = "https://api.github.com/repos/$CanonicalRepositoryFullName"
  $githubApiReadback = Invoke-RestMethod -Uri $githubApiUrl -Headers @{ "User-Agent" = "WerklesGroundZero" }
  Add-Check -Name "github_api_repo_full_name" -Pass ($githubApiReadback.full_name -eq $CanonicalRepositoryFullName) -Details $githubApiReadback.full_name -Blocker "GitHub API full_name mismatch."
  Add-Check -Name "github_api_repo_id" -Pass ([string]$githubApiReadback.id -eq $ExpectedGitHubRepositoryId) -Details $githubApiReadback.id -Blocker "GitHub API repo id mismatch. Codex may be pointed at the old renamed repo object."
  Add-Check -Name "github_api_default_branch" -Pass ($githubApiReadback.default_branch -eq "main") -Details $githubApiReadback.default_branch -Blocker "GitHub API default branch is not main."
  Add-Check -Name "github_api_not_archived" -Pass (-not [bool]$githubApiReadback.archived) -Details $githubApiReadback.archived -Blocker "GitHub API says canonical repo is archived."
} catch {
  Add-Check -Name "github_api_readback" -Pass $false -Details $_.Exception.Message -Blocker "Could not read GitHub API repo metadata for $CanonicalRepositoryFullName."
}

$guardReadback = $null
try {
  $guardScript = Join-Path $RepoPath "scripts\foreman\Assert-WerklesCanonical.ps1"
  $guardReadback = Invoke-RepoScriptJson -ScriptPath $guardScript -Arguments @("-UserRoot", $UserRoot, "-NoWrite")
  Add-Check -Name "werkles_canonical_guard" -Pass ([bool]$guardReadback.pass) -Details $guardReadback -Blocker "Assert-WerklesCanonical.ps1 reported blockers."
  if ($guardReadback.warnings -and $guardReadback.warnings.Count -gt 0) {
    foreach ($warning in $guardReadback.warnings) {
      [void]$warnings.Add("Guard warning: $warning")
    }
  }
} catch {
  Add-Check -Name "werkles_canonical_guard" -Pass $false -Details $_.Exception.Message -Blocker "Could not run Assert-WerklesCanonical.ps1."
}

$inventoryReadback = $null
$dirtyRootsFound = @()
try {
  $inventoryScript = Join-Path $RepoPath "scripts\foreman\Inventory-WerklesLocalSources.ps1"
  $inventoryReadback = Invoke-RepoScriptJson -ScriptPath $inventoryScript -Arguments @("-UserRoot", $UserRoot, "-ScanDepth", [string]$ScanDepth, "-NoWrite")

  $dirtyRootsFound = @(
    $inventoryReadback.path_readbacks |
      Where-Object {
        $_.exists -and $_.is_git -and (
          $_.dirty_or_untracked -or
          ($_.commits_not_on_origin_main_count -gt 0) -or
          ($_.origin -and $_.origin -ne $CanonicalRemote)
        )
      } |
      Select-Object path, origin, branch, head, dirty_or_untracked, untracked_count, commits_not_on_origin_main_count, candidate_reasons
  )

  $forbiddenGitRoots = @(
    $inventoryReadback.path_readbacks |
      Where-Object {
        $_.exists -and $_.is_git -and (
          $_.path -match "\\github\\Werkles1$" -or
          $_.path -match "\\Desktop\\github\\Werkles$" -or
          $_.path -match "\\Desktop\\github\\Werkles1$" -or
          $_.path -match "^C:\\Dev\\Werkles1?$"
        )
      } |
      Select-Object path, origin, branch, head, dirty_or_untracked
  )

  Add-Check -Name "dirty_root_inventory_ran" -Pass $true -Details @{
    scan_depth = $inventoryReadback.scan_depth
    candidate_count = @($inventoryReadback.path_readbacks).Count
    search_roots = $inventoryReadback.search_roots
  }
  Add-Check -Name "no_forbidden_active_werkles_git_roots" -Pass (@($forbiddenGitRoots).Count -eq 0) -Details $forbiddenGitRoots -Blocker "Forbidden active Werkles git roots still exist."
} catch {
  Add-Check -Name "dirty_root_inventory_ran" -Pass $false -Details $_.Exception.Message -Blocker "Could not run Inventory-WerklesLocalSources.ps1."
}

Add-Check -Name "dirty_roots_classified" -Pass ((@($dirtyRootsFound).Count -eq 0) -or (-not [string]::IsNullOrWhiteSpace($DirtyRootDispositionEvidence))) -Details @{
  dirty_root_count = @($dirtyRootsFound).Count
  disposition_evidence = $DirtyRootDispositionEvidence
  required_readback = "Every dirty root must be classified as canonical work, retired archive, adjacent runtime root, salvage branch created, patch receipt created, or blocked for human review."
} -Blocker "Dirty roots were found but no disposition evidence was supplied. Do not call ground zero complete."

Add-Check -Name "codex_project_binding" -Pass ($CodexProjectBindingStatus -eq "VERIFIED") -Details @{
  status = $CodexProjectBindingStatus
  evidence = $CodexProjectBindingEvidence
  required_readback = "codex_app.list_projects must show a Werkles project bound to benleakwerkles/Werkles main, or the receiving Codex thread must state it is intentionally projectless and operating from the canonical local checkout."
} -Blocker "Codex saved-project binding is not verified. Do not call the machine ground-zero clean."

$localChecksPass = -not ($checks | Where-Object { -not $_.pass -and $_.name -ne "codex_project_binding" })
$overallPass = -not ($checks | Where-Object { -not $_.pass })

$receipt = [pscustomobject]@{
  receipt_id = "WERKLES_GROUND_ZERO_READBACK"
  created_at = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  canonical_repository_full_name = $CanonicalRepositoryFullName
  expected_github_repository_id = $ExpectedGitHubRepositoryId
  canonical_remote = $CanonicalRemote
  canonical_path = $canonicalFullPath
  branch = $branch
  head = $head
  remote_main = $remoteMain
  local_repo_and_github_pass = $localChecksPass
  codex_project_binding_status = $CodexProjectBindingStatus
  dirty_root_disposition_evidence = $DirtyRootDispositionEvidence
  overall_ground_zero_complete = $overallPass
  blockers = @($blockers)
  warnings = @($warnings)
  checks = @($checks)
  dirty_roots_found = @($dirtyRootsFound)
  rule = "Ground zero is not complete until local canonical repo, GitHub repo identity, origin/main, dirty-root inventory, guard status, and Codex project binding are all verified. Local GitHub success alone is not enough."
}

$json = $receipt | ConvertTo-Json -Depth 10
Write-Output $json

if (-not $NoWrite) {
  $outDir = Join-Path $UserRoot "github\Werkles-local-merge-receipts"
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $outFile = Join-Path $outDir "$($env:COMPUTERNAME)-werkles-ground-zero-readback-$stamp.json"
  Set-Content -LiteralPath $outFile -Value $json -Encoding UTF8
  Write-Output "GROUND_ZERO_RECEIPT=$outFile"
}

if (-not $overallPass) {
  exit 1
}
