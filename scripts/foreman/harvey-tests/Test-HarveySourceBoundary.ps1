[CmdletBinding()]
param(
    [string]$Manifest,
    [string]$RepoPath
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $Manifest) { $Manifest = Join-Path $scriptRoot 'HARVEY_SLICE_MANIFEST.json' }
if (-not $RepoPath) { $RepoPath = (Resolve-Path (Join-Path $scriptRoot '..\..\..')).Path }
$repo = (Resolve-Path -LiteralPath $RepoPath).Path
$manifestPath = (Resolve-Path -LiteralPath $Manifest).Path
$contract = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$prefixes = @($contract.allowed_prefixes | ForEach-Object { ([string]$_).Replace('\', '/') })
$exact = @($contract.allowed_exact_paths | ForEach-Object { ([string]$_).Replace('\', '/') })
$violations = [System.Collections.Generic.List[string]]::new()

function Test-HarveyAllowedPath {
    param([string]$RelativePath)
    $normalized = $RelativePath.Replace('\', '/')
    if ($exact -contains $normalized) { return $true }
    foreach ($prefix in $prefixes) {
        if ($normalized.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) { return $true }
    }
    return $false
}

foreach ($relative in @($contract.overlay_paths)) {
    $normalized = ([string]$relative).Replace('\', '/')
    $allowed = Test-HarveyAllowedPath -RelativePath ($normalized.TrimEnd('/') + $(if ((Test-Path -LiteralPath (Join-Path $repo $relative) -PathType Container)) { '/' } else { '' }))
    if (-not $allowed) { [void]$violations.Add("MANIFEST_PATH_OUTSIDE_BOUNDARY: $normalized") }
    if (-not (Test-Path -LiteralPath (Join-Path $repo $relative))) { [void]$violations.Add("MANIFEST_PATH_MISSING: $normalized") }
}

$staged = @(& git -C $repo diff --cached --name-only)
if ($LASTEXITCODE -ne 0) { throw 'GIT_STAGED_READ_FAILED' }
foreach ($path in $staged) {
    if (-not (Test-HarveyAllowedPath -RelativePath $path)) { [void]$violations.Add("UNRELATED_STAGED_PATH: $path") }
}

$dirty = @(& git -C $repo status --porcelain=v1)
if ($LASTEXITCODE -ne 0) { throw 'GIT_STATUS_READ_FAILED' }
$branch = (& git -C $repo branch --show-current)
if ($branch -ne [string]$contract.branch) { [void]$violations.Add("BRANCH_MISMATCH: expected=$($contract.branch); actual=$branch") }
$result = [ordered]@{
    schema = 'werkles.harvey-source-boundary-receipt/v1'
    slice_id = $contract.slice_id
    repo = $repo
    branch = $branch
    head = (& git -C $repo rev-parse HEAD)
    dirty_entries = $dirty.Count
    staged_entries = $staged.Count
    unrelated_staged_entries = @($violations | Where-Object { $_ -like 'UNRELATED_STAGED_PATH:*' }).Count
    manifest_paths = @($contract.overlay_paths).Count
    status = if ($violations.Count -eq 0) { 'PASS' } else { 'FAIL' }
    violations = @($violations)
}
$result | ConvertTo-Json -Depth 8
if ($violations.Count -gt 0) { exit 1 }
