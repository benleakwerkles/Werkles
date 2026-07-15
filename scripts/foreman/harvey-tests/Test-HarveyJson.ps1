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
$contract = Get-Content -LiteralPath $Manifest -Raw | ConvertFrom-Json
$results = foreach ($relative in @($contract.json_paths)) {
    $path = Join-Path $repo $relative
    try {
        Get-Content -LiteralPath $path -Raw | ConvertFrom-Json | Out-Null
        [pscustomobject]@{ path = $relative; status = 'PASS' }
    } catch {
        [pscustomobject]@{ path = $relative; status = 'FAIL'; error = $_.Exception.Message }
    }
}
$failed = @($results | Where-Object { $_.status -ne 'PASS' })
[pscustomobject]@{ schema='werkles.harvey-json-test/v1'; status=$(if($failed.Count -eq 0){'PASS'}else{'FAIL'}); files=$results } | ConvertTo-Json -Depth 8
if ($failed.Count -gt 0) { exit 1 }
