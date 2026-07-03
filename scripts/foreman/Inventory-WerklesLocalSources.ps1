[CmdletBinding()]
param(
  [string]$UserRoot = $env:USERPROFILE,
  [int]$ScanDepth = 4,
  [int]$MaxInlineLines = 120,
  [switch]$SkipBroadScan,
  [switch]$NoWrite
)

$ErrorActionPreference = "Stop"

function Test-GitRepo {
  param([string]$Path)
  return (Test-PathSafe -Path (Join-Path $Path ".git"))
}

function Test-PathSafe {
  param([string]$Path)
  try {
    return (Test-Path -LiteralPath $Path -ErrorAction Stop)
  } catch {
    return $false
  }
}

function Resolve-PathSafe {
  param([string]$Path)
  try {
    if (Test-PathSafe -Path $Path) {
      return (Resolve-Path -LiteralPath $Path -ErrorAction Stop).Path
    }
  } catch {
  }
  return (Get-FullCandidatePath -Path $Path)
}

function Get-LineCount {
  param([string]$Text)
  if ([string]::IsNullOrEmpty($Text)) {
    return 0
  }
  return (($Text -split "`n") | Measure-Object).Count
}

function Limit-Lines {
  param(
    [string]$Text,
    [int]$MaxLines
  )

  if ([string]::IsNullOrEmpty($Text)) {
    return $Text
  }

  $lines = $Text -split "`n"
  if ($lines.Count -le $MaxLines) {
    return $Text
  }

  $head = $lines | Select-Object -First $MaxLines
  return (($head + "[TRUNCATED: $($lines.Count) total lines; create patch/untracked receipts before retiring this root]") -join "`n")
}

$candidatePaths = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
$candidateReasons = @{}

function Get-FullCandidatePath {
  param([string]$Path)
  if ([string]::IsNullOrWhiteSpace($Path)) {
    return $null
  }
  return [System.IO.Path]::GetFullPath($Path)
}

function Add-CandidatePath {
  param(
    [string]$Path,
    [string]$Reason
  )

  $fullPath = Get-FullCandidatePath -Path $Path
  if (-not $fullPath) {
    return
  }

  [void]$candidatePaths.Add($fullPath)
  if (-not $candidateReasons.ContainsKey($fullPath)) {
    $candidateReasons[$fullPath] = [System.Collections.Generic.List[string]]::new()
  }
  if ($Reason -and -not $candidateReasons[$fullPath].Contains($Reason)) {
    [void]$candidateReasons[$fullPath].Add($Reason)
  }
}

function Add-ProfileWerklesCandidates {
  param(
    [string]$ProfileRoot,
    [string]$Reason
  )

  if ([string]::IsNullOrWhiteSpace($ProfileRoot)) {
    return
  }

  Add-CandidatePath -Path (Join-Path $ProfileRoot "github\Werkles") -Reason "$Reason; canonical or prior moved checkout"
  Add-CandidatePath -Path (Join-Path $ProfileRoot "github\Werkles1") -Reason "$Reason; old Werkles1 active checkout suspect"
  Add-CandidatePath -Path (Join-Path $ProfileRoot "Desktop\github\Werkles") -Reason "$Reason; historical Desktop-path Werkles root suspect"
  Add-CandidatePath -Path (Join-Path $ProfileRoot "Desktop\github\Werkles1") -Reason "$Reason; historical Desktop-path Werkles1 mirror suspect"
  Add-CandidatePath -Path (Join-Path $ProfileRoot "Desktop\Werkles_DIRTY_BACKUP") -Reason "$Reason; known dirty backup snapshot name"
  Add-CandidatePath -Path (Join-Path $ProfileRoot "Documents\Werkles") -Reason "$Reason; stale partial copy suspect"
  Add-CandidatePath -Path (Join-Path $ProfileRoot "Documents\GitHub\Werkles") -Reason "$Reason; GitHub Desktop default-location suspect"
  Add-CandidatePath -Path (Join-Path $ProfileRoot "Source\Werkles") -Reason "$Reason; developer source folder suspect"
  Add-CandidatePath -Path (Join-Path $ProfileRoot "repos\Werkles") -Reason "$Reason; developer repo folder suspect"
  Add-CandidatePath -Path (Join-Path $ProfileRoot "dev\Werkles") -Reason "$Reason; developer dev folder suspect"
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

  $fullPath = Get-FullCandidatePath -Path $Path
  $isGit = Test-GitRepo $Path
  $statusRaw = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("status", "-sb") } else { $null }
  $porcelain = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("status", "--porcelain=v1") } else { $null }
  $untrackedRaw = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("ls-files", "--others", "--exclude-standard") } else { $null }
  $commitsRaw = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("log", "--oneline", "origin/main..HEAD") } else { $null }
  $head = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("rev-parse", "--short", "HEAD") } else { $null }

  [pscustomobject]@{
    path = $fullPath
    candidate_reasons = if ($candidateReasons.ContainsKey($fullPath)) { @($candidateReasons[$fullPath]) } else { @() }
    exists = Test-PathSafe -Path $Path
    is_git = $isGit
    origin = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("remote", "get-url", "origin") } else { $null }
    branch = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("branch", "--show-current") } else { $null }
    head = $head
    status_line_count = Get-LineCount -Text $statusRaw
    status_short = Limit-Lines -Text $statusRaw -MaxLines $MaxInlineLines
    dirty_or_untracked = [bool]($porcelain)
    untracked_count = Get-LineCount -Text $untrackedRaw
    untracked = Limit-Lines -Text $untrackedRaw -MaxLines $MaxInlineLines
    ahead_behind_origin_main = if ($isGit) { Invoke-GitText -Path $Path -GitArgs @("rev-list", "--left-right", "--count", "origin/main...HEAD") } else { $null }
    commits_not_on_origin_main_count = Get-LineCount -Text $commitsRaw
    commits_not_on_origin_main = Limit-Lines -Text $commitsRaw -MaxLines $MaxInlineLines
  }
}

$profileRoots = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($profilePath in @($UserRoot, $env:USERPROFILE, "C:\Users\BenLeak", "C:\Users\benle", "C:\Users\Ben Leak")) {
  $fullPath = Get-FullCandidatePath -Path $profilePath
  if ($fullPath) {
    [void]$profileRoots.Add($fullPath)
  }
}

if (Test-PathSafe -Path "C:\Users") {
  Get-ChildItem -LiteralPath "C:\Users" -Force -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notin @("All Users", "Default", "Default User", "Public", "desktop.ini") } |
    ForEach-Object { [void]$profileRoots.Add($_.FullName) }
}

foreach ($profileRoot in $profileRoots) {
  Add-ProfileWerklesCandidates -ProfileRoot $profileRoot -Reason "profile root candidate $profileRoot"
}

foreach ($path in @(
  "C:\Dev\Werkles",
  "C:\Dev\Werkles1",
  "C:\wt\Werkles",
  "C:\wt\stbook",
  "C:\speaker",
  "C:\tinkarden",
  "C:\TinkerDen"
)) {
  Add-CandidatePath -Path $path -Reason "known adjacent dirty/source-truth root suspect"
}

$scanRoots = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($profileRoot in $profileRoots) {
  foreach ($relativeRoot in @("github", "Desktop", "Desktop\github", "Documents", "Documents\GitHub", "Source", "repos", "dev", "Downloads")) {
    $scanRoot = Join-Path $profileRoot $relativeRoot
    if (Test-PathSafe -Path $scanRoot) {
      [void]$scanRoots.Add((Resolve-PathSafe -Path $scanRoot))
    }
  }
}
foreach ($root in @("C:\Dev", "C:\wt")) {
  if (Test-PathSafe -Path $root) {
    [void]$scanRoots.Add((Resolve-PathSafe -Path $root))
  }
}

if (-not $SkipBroadScan) {
  foreach ($root in $scanRoots) {
    Get-ChildItem -LiteralPath $root -Force -Directory -Recurse -Depth $ScanDepth -ErrorAction SilentlyContinue |
      Where-Object {
        $isWerklesNamed = (
          $_.Name -like "*Werkles*" -or
          $_.Name -like "*werkles*" -or
          $_.Name -like "*Werkles1*"
        )
        $isAdjacentRootName = (
          $_.Name -like "*TinkerDen*" -or
          $_.Name -like "*tinkarden*" -or
          $_.Name -eq "speaker" -or
          $_.Name -eq "stbook"
        )
        $isDirectChildOfSearchRoot = ((Get-FullCandidatePath -Path $_.Parent.FullName) -eq (Get-FullCandidatePath -Path $root))
        $isReceiptFolder = ($_.Name -like "*Werkles-local-merge-receipts*")

        (-not $isReceiptFolder) -and ($isWerklesNamed -or ($isAdjacentRootName -and $isDirectChildOfSearchRoot))
      } |
      ForEach-Object {
        Add-CandidatePath -Path $_.FullName -Reason "shallow recursive dirty-root scan under $root"
      }
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
  scan_depth = if ($SkipBroadScan) { 0 } else { $ScanDepth }
  max_inline_lines = $MaxInlineLines
  search_roots = @($scanRoots.GetEnumerator() | Sort-Object)
  path_readbacks = $pathReadbacks
  canonical_local_branches = $canonicalBranches
  rule = "Exactly one active Werkles source folder may remain. Preserve dirty work and unique commits before retiring duplicates. Known dirty-root suspects must be inventoried before cleanup is declared complete."
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
