[CmdletBinding()]
param(
  [string]$UserRoot = $env:USERPROFILE,
  [switch]$NoWrite
)

$ErrorActionPreference = "Stop"

function Test-GitRepo {
  param([string]$Path)
  return (Test-Path -LiteralPath (Join-Path $Path ".git"))
}

function Invoke-GitText {
  param(
    [string]$Path,
    [string[]]$GitArgs
  )

  if (-not (Test-GitRepo $Path)) {
    return $null
  }

  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $output = & git -C $Path @GitArgs 2>$null
    if ($LASTEXITCODE -ne 0) {
      return $null
    }
    return ($output -join "`n")
  } finally {
    $ErrorActionPreference = $previousPreference
  }
}

function Get-GitInfo {
  param([string]$Path)

  $isGit = Test-GitRepo $Path
  $status = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("status", "-sb") } else { $null }
  $porcelain = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("status", "--porcelain=v1") } else { $null }
  $untracked = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("ls-files", "--others", "--exclude-standard") } else { $null }

  [pscustomobject]@{
    path = $Path
    exists = Test-Path -LiteralPath $Path
    is_git = $isGit
    origin = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("remote", "get-url", "origin") } else { $null }
    branch = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("branch", "--show-current") } else { $null }
    head = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("rev-parse", "--short", "HEAD") } else { $null }
    status_short = $status
    dirty_or_untracked = [bool]($porcelain)
    untracked = $untracked
    ahead_behind_origin_main = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("rev-list", "--left-right", "--count", "origin/main...HEAD") } else { $null }
    commits_not_on_origin_main = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("log", "--oneline", "origin/main..HEAD") } else { $null }
  }
}

$candidatePaths = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

$knownCandidates = @(
  (Join-Path $UserRoot "github\Werkles"),
  (Join-Path $UserRoot "github\Werkles1"),
  (Join-Path $UserRoot "Desktop\github\Werkles"),
  (Join-Path $UserRoot "Desktop\github\Werkles1"),
  (Join-Path $UserRoot "Desktop\Werkles_DIRTY_BACKUP"),
  (Join-Path $UserRoot "Documents\Werkles"),
  "C:\Dev\Werkles",
  "C:\Dev\Werkles1"
)

foreach ($path in $knownCandidates) {
  [void]$candidatePaths.Add($path)
}

$scanRoots = @(
  (Join-Path $UserRoot "github"),
  (Join-Path $UserRoot "Desktop"),
  (Join-Path $UserRoot "Desktop\github"),
  (Join-Path $UserRoot "Documents"),
  "C:\Dev"
)

foreach ($root in $scanRoots) {
  if (Test-Path -LiteralPath $root) {
    Get-ChildItem -LiteralPath $root -Force -Directory -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -like "*Werkles*" -or $_.Name -like "*werkles*" } |
      ForEach-Object { [void]$candidatePaths.Add($_.FullName) }
  }
}

$paths = @($candidatePaths.GetEnumerator()) | Sort-Object
$pathReadbacks = foreach ($path in $paths) {
  Get-GitInfo -Path $path
}

$canonicalPath = Join-Path $UserRoot "github\Werkles"
$canonicalBranches = @()
if (Test-GitRepo $canonicalPath) {
  $branches = Invoke-GitText -Path $canonicalPath -GitArgs @("for-each-ref", "--format=%(refname:short)|%(objectname:short)|%(upstream:short)|%(subject)", "refs/heads")
  if ($branches) {
    $canonicalBranches = $branches -split "`n"
  }
}

$receipt = [pscustomobject]@{
  inventory_id = "WERKLES_LOCAL_SOURCE_INVENTORY"
  created_at = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  canonical_remote = "https://github.com/benleakwerkles/Werkles.git"
  canonical_path_target = $canonicalPath
  path_readbacks = $pathReadbacks
  canonical_local_branches = $canonicalBranches
  rule = "Exactly one active Werkles source folder may remain. Preserve dirty work and unique commits before retiring duplicates."
}

$json = $receipt | ConvertTo-Json -Depth 6
Write-Output $json

if (-not $NoWrite) {
  $outDir = Join-Path $UserRoot "github\Werkles-local-merge-receipts"
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $outFile = Join-Path $outDir "$($env:COMPUTERNAME)-werkles-local-source-inventory-$stamp.json"
  Set-Content -LiteralPath $outFile -Value $json -Encoding UTF8
  Write-Output "INVENTORY_RECEIPT=$outFile"
}
