[CmdletBinding()]
param(
  [string]$UserRoot = $env:USERPROFILE,
  [switch]$Apply
)

$ErrorActionPreference = "Stop"

$CanonicalUrl = "https://github.com/benleakwerkles/Werkles.git"
$LegacyUrlPatterns = @(
  "https://github.com/benleakwerkles/Werkles1.git",
  "https://github.com/benleakwerkles/Werkles-retired-delete-me-20260702.git",
  "https://github.com/benleakwerkles/Werkles.git"
)
$Stamp = Get-Date -Format "yyyyMMdd-HHmmss"

function Write-Action {
  param([string]$Message)
  if ($Apply) {
    Write-Host "APPLY $Message"
  } else {
    Write-Host "DRYRUN $Message"
  }
}

function Test-GitRepo {
  param([string]$Path)
  return (Test-Path -LiteralPath (Join-Path $Path ".git"))
}

function Get-OriginUrl {
  param([string]$Path)
  if (-not (Test-GitRepo $Path)) {
    return $null
  }

  $output = & git -C $Path remote get-url origin 2>$null
  if ($LASTEXITCODE -ne 0) {
    return $null
  }

  return [string]$output
}

function Test-HasHead {
  param([string]$Path)
  if (-not (Test-GitRepo $Path)) {
    return $false
  }

  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & git -C $Path rev-parse --verify HEAD > $null 2> $null
    return ($LASTEXITCODE -eq 0)
  } finally {
    $ErrorActionPreference = $previousPreference
  }
}

function Test-EmptyStubRepo {
  param([string]$Path)
  if (-not (Test-GitRepo $Path)) {
    return $false
  }

  if (Test-HasHead $Path) {
    return $false
  }

  $entries = Get-ChildItem -LiteralPath $Path -Force | Where-Object { $_.Name -ne ".git" }
  return (($entries | Measure-Object).Count -eq 0)
}

function Assert-UnderRoot {
  param(
    [string]$Path,
    [string]$Root
  )

  $resolvedRoot = [System.IO.Path]::GetFullPath($Root)
  $resolvedPath = [System.IO.Path]::GetFullPath($Path)
  if (-not $resolvedPath.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to move path outside expected root: $resolvedPath"
  }
}

function Move-LocalPath {
  param(
    [string]$From,
    [string]$To,
    [string]$Root
  )

  Assert-UnderRoot -Path $From -Root $Root
  Assert-UnderRoot -Path $To -Root $Root

  if (-not (Test-Path -LiteralPath $From)) {
    return
  }
  if (Test-Path -LiteralPath $To) {
    if (-not $Apply) {
      Write-Action "target exists now; planned prior moves may clear it: `"$To`""
      return
    }
    throw "Refusing to overwrite existing path: $To"
  }

  Write-Action "move `"$From`" -> `"$To`""
  if ($Apply) {
    Move-Item -LiteralPath $From -Destination $To
  }
}

function Set-CanonicalRemote {
  param([string]$Path)
  if (-not (Test-GitRepo $Path)) {
    return
  }

  $origin = Get-OriginUrl $Path
  if (-not $origin) {
    return
  }

  $needsUpdate = $false
  foreach ($pattern in $LegacyUrlPatterns) {
    if ($origin -eq $pattern -or $origin.Contains("/Werkles1") -or $origin.Contains("Werkles-retired-delete-me")) {
      $needsUpdate = $true
      break
    }
  }

  if ($needsUpdate -and $origin -ne $CanonicalUrl) {
    Write-Action "set origin for `"$Path`" from `"$origin`" to `"$CanonicalUrl`""
    if ($Apply) {
      & git -C $Path remote set-url origin $CanonicalUrl
    }
  } else {
    Write-Host "OK origin for `"$Path`" = `"$origin`""
  }
}

$githubRoot = Join-Path $UserRoot "github"
$desktopGithubRoot = Join-Path (Join-Path $UserRoot "Desktop") "github"
$devRoot = "C:\Dev"
$canonicalPath = Join-Path $githubRoot "Werkles"
$legacyPath = Join-Path $githubRoot "Werkles1"

Write-Host "Canonical remote: $CanonicalUrl"
Write-Host "Preferred local path: $canonicalPath"
if (-not $Apply) {
  Write-Host "Dry run only. Re-run with -Apply to move folders or update remotes."
}

$candidatePaths = @(
  $canonicalPath,
  $legacyPath,
  (Join-Path $desktopGithubRoot "Werkles"),
  (Join-Path $desktopGithubRoot "Werkles1"),
  (Join-Path $devRoot "Werkles"),
  (Join-Path $devRoot "Werkles1")
)

foreach ($path in $candidatePaths) {
  if (Test-Path -LiteralPath $path) {
    Set-CanonicalRemote -Path $path
  }
}

if (Test-Path -LiteralPath $legacyPath) {
  if (-not (Test-Path -LiteralPath $canonicalPath)) {
    Move-LocalPath -From $legacyPath -To $canonicalPath -Root $githubRoot
  } elseif (Test-EmptyStubRepo $canonicalPath) {
    $retiredStub = Join-Path $githubRoot "Werkles-retired-local-stub-$Stamp"
    Move-LocalPath -From $canonicalPath -To $retiredStub -Root $githubRoot
    Move-LocalPath -From $legacyPath -To $canonicalPath -Root $githubRoot
  } else {
    Write-Host "MANUAL_REVIEW canonical path already exists and is not an empty stub: $canonicalPath"
  }
}

foreach ($desktopName in @("Werkles", "Werkles1")) {
  $desktopPath = Join-Path $desktopGithubRoot $desktopName
  if (Test-Path -LiteralPath $desktopPath) {
    if ((Test-GitRepo $desktopPath) -and (Test-HasHead $desktopPath)) {
      Write-Host "MANUAL_REVIEW desktop path is a real git checkout; run the MaSheen local-folder merge packet before archiving: $desktopPath"
      continue
    }
    $retiredDesktop = Join-Path $desktopGithubRoot "$desktopName-retired-local-$Stamp"
    Move-LocalPath -From $desktopPath -To $retiredDesktop -Root $desktopGithubRoot
  }
}

foreach ($devName in @("Werkles", "Werkles1")) {
  $devPath = Join-Path $devRoot $devName
  if (Test-Path -LiteralPath $devPath) {
    if ((Test-GitRepo $devPath) -and (Test-HasHead $devPath)) {
      Write-Host "MANUAL_REVIEW dev path is a real git checkout; run the MaSheen local-folder merge packet before archiving: $devPath"
      continue
    }
    Write-Host "MANUAL_REVIEW dev path exists and needs human classification before moving or archiving: $devPath"
  }
}

if (Test-Path -LiteralPath $canonicalPath) {
  Write-Host "READBACK path=$canonicalPath"
  if (Test-GitRepo $canonicalPath) {
    & git -C $canonicalPath remote -v
    & git -C $canonicalPath status -sb
    if (Test-HasHead $canonicalPath) {
      & git -C $canonicalPath rev-parse --short HEAD
    } else {
      Write-Host "READBACK head=NO_HEAD"
    }
  }
}
