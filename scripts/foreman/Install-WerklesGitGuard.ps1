[CmdletBinding()]
param(
  [string]$UserRoot = $env:USERPROFILE
)

$ErrorActionPreference = "Stop"

$CanonicalPath = Join-Path $UserRoot "github\Werkles"
$AssertScript = Join-Path $CanonicalPath "scripts\foreman\Assert-WerklesCanonical.ps1"
$HookPath = Join-Path $CanonicalPath ".git\hooks\pre-push"

if (-not (Test-Path -LiteralPath (Join-Path $CanonicalPath ".git"))) {
  throw "Canonical checkout is missing or is not git-backed: $CanonicalPath"
}

if (-not (Test-Path -LiteralPath $AssertScript)) {
  throw "Canonical guard script is missing: $AssertScript"
}

powershell -NoProfile -ExecutionPolicy Bypass -File $AssertScript -FailOnBlock
if ($LASTEXITCODE -ne 0) {
  throw "Canonical guard failed; refusing to install pre-push hook."
}

$hookContent = @'
#!/bin/sh
repo_root="$(git rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ]; then
  echo "Werkles canonical guard: unable to resolve repo root" >&2
  exit 1
fi

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$repo_root/scripts/foreman/Assert-WerklesCanonical.ps1" -FailOnBlock -NoWrite
status=$?
if [ "$status" -ne 0 ]; then
  echo "Werkles canonical guard: push blocked. Run scripts/foreman/Assert-WerklesCanonical.ps1 from the canonical checkout." >&2
fi
exit "$status"
'@

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($HookPath, ($hookContent -replace "`r`n", "`n"), $utf8NoBom)

Write-Output "GUARD_INSTALLED=$HookPath"
