[CmdletBinding()]
param(
  [string]$UserRoot = $env:USERPROFILE,
  [switch]$FailOnBlock,
  [switch]$FailOnWarning,
  [switch]$NoWrite
)

$ErrorActionPreference = "Stop"

$CanonicalUrl = "https://github.com/benleakwerkles/Werkles.git"
$CanonicalPath = Join-Path $UserRoot "github\Werkles"
$ReceiptRoot = Join-Path $UserRoot "github\Werkles-local-merge-receipts"

$blockers = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()

function Add-Blocker {
  param([string]$Message)
  [void]$blockers.Add($Message)
}

function Add-Warning {
  param([string]$Message)
  [void]$warnings.Add($Message)
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

function Get-GitRoot {
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $output = & git rev-parse --show-toplevel 2>$null
    if ($LASTEXITCODE -ne 0) {
      return $null
    }
    return [string]$output
  } finally {
    $ErrorActionPreference = $previousPreference
  }
}

function Resolve-FullPathIfExists {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    return [System.IO.Path]::GetFullPath($Path)
  }
  return (Resolve-Path -LiteralPath $Path).Path
}

function Test-HasHead {
  param([string]$Path)
  if (-not (Test-GitRepo $Path)) {
    return $false
  }
  $head = Invoke-GitText -Path $Path -GitArgs @("rev-parse", "--verify", "HEAD")
  return [bool]$head
}

$canonicalFull = Resolve-FullPathIfExists -Path $CanonicalPath
$currentGitRoot = Get-GitRoot
$currentGitRootFull = if ($currentGitRoot) { Resolve-FullPathIfExists -Path $currentGitRoot } else { $null }

if (-not (Test-Path -LiteralPath $CanonicalPath)) {
  Add-Blocker "Canonical path is missing: $CanonicalPath"
} elseif (-not (Test-GitRepo $CanonicalPath)) {
  Add-Blocker "Canonical path exists but is not a git checkout: $CanonicalPath"
} else {
  $origin = Invoke-GitText -Path $CanonicalPath -GitArgs @("remote", "get-url", "origin")
  $pushOrigin = Invoke-GitText -Path $CanonicalPath -GitArgs @("remote", "get-url", "--push", "origin")
  $remotes = Invoke-GitText -Path $CanonicalPath -GitArgs @("remote")

  if ($origin -ne $CanonicalUrl) {
    Add-Blocker "Canonical checkout origin is not canonical: $origin"
  }
  if ($pushOrigin -ne $CanonicalUrl) {
    Add-Blocker "Canonical checkout push origin is not canonical: $pushOrigin"
  }
  if ($remotes) {
    foreach ($remote in ($remotes -split "`n")) {
      if ($remote -and $remote -ne "origin") {
        Add-Blocker "Canonical checkout has extra remote '$remote'; remove temporary salvage remotes before continuing."
      }
    }
  }

  $status = Invoke-GitText -Path $CanonicalPath -GitArgs @("status", "--porcelain=v1")
  if ($status) {
    Add-Warning "Canonical checkout has uncommitted work; allowed for normal work, but cleanup readback is not clean."
  }

  $aheadBehind = Invoke-GitText -Path $CanonicalPath -GitArgs @("rev-list", "--left-right", "--count", "HEAD...origin/main")
  if ($aheadBehind) {
    $parts = $aheadBehind -split "\s+"
    if ($parts.Count -ge 2) {
      $ahead = [int]$parts[0]
      $behind = [int]$parts[1]
      if ($behind -gt 0) {
        Add-Blocker "Canonical checkout is behind origin/main by $behind commit(s); pull latest before continuing."
      }
      if ($ahead -gt 0) {
        Add-Warning "Canonical checkout is ahead of origin/main by $ahead commit(s); push or keep as intentional local work."
      }
    }
  }
}

if ($currentGitRootFull -and ($currentGitRootFull -ne $canonicalFull)) {
  $currentOrigin = Invoke-GitText -Path $currentGitRootFull -GitArgs @("remote", "get-url", "origin")
  if ($currentOrigin -and ($currentOrigin -like "*benleakwerkles/Werkles*")) {
    Add-Blocker "Current git repo is a Werkles checkout outside canonical path: $currentGitRootFull"
  }
}

$forbiddenActivePaths = @(
  (Join-Path $UserRoot "github\Werkles1"),
  (Join-Path $UserRoot "Desktop\github\Werkles"),
  (Join-Path $UserRoot "Desktop\github\Werkles1"),
  "C:\Dev\Werkles",
  "C:\Dev\Werkles1"
)

foreach ($path in $forbiddenActivePaths) {
  if (Test-Path -LiteralPath $path) {
    if ((Test-GitRepo $path) -and (Test-HasHead $path)) {
      Add-Blocker "Forbidden active Werkles checkout exists: $path"
    } else {
      Add-Warning "Forbidden active path exists but is not a normal committed git checkout; classify or retire it: $path"
    }
  }
}

$activePointerFiles = @(
  "DISPATCH_GO.cmd",
  "foreman-control.cmd",
  "gimpdash.cmd",
  "open-aeye-crew.cmd",
  "foreman\crew-dispatch-console\DISPATCH_GO.cmd",
  "foreman\crew-dispatch-console\LATEST_DISPATCH.md",
  "foreman\handoffs\outbox\OPEN_THIS_PACKET.md"
)

$legacyPointerPattern = "Desktop[\\/]+github[\\/]+Werkles|Desktop\\github\\Werkles|github[\\/\\]+Werkles1|Werkles1\.git|Werkles-retired-delete-me"
foreach ($relativePath in $activePointerFiles) {
  $filePath = Join-Path $CanonicalPath $relativePath
  if (Test-Path -LiteralPath $filePath) {
    $matches = Select-String -LiteralPath $filePath -Pattern $legacyPointerPattern -ErrorAction SilentlyContinue
    foreach ($match in $matches) {
      Add-Blocker "Active launcher or prompt points at retired Werkles destination: $relativePath line $($match.LineNumber)"
    }
  }
}

$nextRequiredServerFiles = Join-Path $CanonicalPath ".next\required-server-files.json"
if (Test-Path -LiteralPath $nextRequiredServerFiles) {
  $nextMatches = Select-String -LiteralPath $nextRequiredServerFiles -Pattern $legacyPointerPattern -ErrorAction SilentlyContinue
  if ($nextMatches) {
    Add-Warning "Generated .next metadata contains retired paths; run npm.cmd run build from the canonical checkout."
  }
}

$pass = ($blockers.Count -eq 0)
$receipt = [pscustomobject]@{
  guard_id = "WERKLES_CANONICAL_GUARD"
  created_at = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
  canonical_path = $CanonicalPath
  canonical_remote = $CanonicalUrl
  current_git_root = $currentGitRootFull
  pass = $pass
  blockers = @($blockers)
  warnings = @($warnings)
}

$json = $receipt | ConvertTo-Json -Depth 6
Write-Output $json

if (-not $NoWrite) {
  New-Item -ItemType Directory -Force -Path $ReceiptRoot | Out-Null
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $receiptPath = Join-Path $ReceiptRoot "$($env:COMPUTERNAME)-werkles-canonical-guard-$stamp.json"
  Set-Content -LiteralPath $receiptPath -Value $json -Encoding UTF8
  Write-Output "GUARD_RECEIPT=$receiptPath"
}

if (($blockers.Count -gt 0 -and $FailOnBlock) -or (($blockers.Count -gt 0 -or $warnings.Count -gt 0) -and $FailOnWarning)) {
  exit 1
}
