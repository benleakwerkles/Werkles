[CmdletBinding()]
param(
    [string]$RepoPath,
    [string]$Manifest,
    [ValidateRange(3100, 3199)][int]$TestPort = 3100,
    [string]$ReceiptPath
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $RepoPath) { $RepoPath = (Resolve-Path (Join-Path $scriptRoot '..\..\..')).Path }
if (-not $Manifest) { $Manifest = Join-Path $scriptRoot 'HARVEY_SLICE_MANIFEST.json' }
if (-not $ReceiptPath) { $ReceiptPath = Join-Path $RepoPath 'outputs\harvey-tests\HARVEY_SLICE_0_ISOLATED_BUILD_RECEIPT.json' }
$repo = (Resolve-Path -LiteralPath $RepoPath).Path
$contract = Get-Content -LiteralPath $Manifest -Raw | ConvertFrom-Json
. (Join-Path $scriptRoot 'Get-HarveyOverlayFingerprint.ps1')
$manifestSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $Manifest).Hash.ToLowerInvariant()
$sourceOverlay = Get-HarveyOverlayFingerprint -Root $repo -Contract $contract
$runId = Get-Date -Format 'yyyyMMdd-HHmmssfff'
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ('Werkles-Harvey-Tests\build-' + $runId)
$source = Join-Path $testRoot 'source'
$archive = Join-Path $testRoot 'head.tar'
$stdout = Join-Path $testRoot 'server.out.log'
$stderr = Join-Path $testRoot 'server.err.log'
$server = $null

function Get-HarveyDataHash {
    param([string]$Root)
    $data = Join-Path $Root 'data\harvey'
    if (-not (Test-Path -LiteralPath $data)) { return 'ABSENT' }
    $liveRuntime = (Join-Path $data 'machine-control').TrimEnd('\') + '\'
    $rows = Get-ChildItem -LiteralPath $data -Recurse -File | Where-Object {
        -not $_.FullName.StartsWith($liveRuntime, [System.StringComparison]::OrdinalIgnoreCase)
    } | Sort-Object FullName | ForEach-Object {
        $relative = $_.FullName.Substring($data.Length).TrimStart('\').Replace('\','/')
        $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
        "$relative`:$hash"
    }
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { return ([System.BitConverter]::ToString($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes(($rows -join "`n"))))).Replace('-','').ToLowerInvariant() }
    finally { $sha.Dispose() }
}

function Test-HarveyHttp200 {
    param([string]$Uri)
    try { return ((Invoke-WebRequest -UseBasicParsing -Uri $Uri -TimeoutSec 10).StatusCode -eq 200) } catch { return $false }
}

if (Get-NetTCPConnection -State Listen -LocalPort $TestPort -ErrorAction SilentlyContinue) { throw "TEST_PORT_ALREADY_IN_USE: $TestPort" }
$liveBefore = Test-HarveyHttp200 -Uri 'http://127.0.0.1:3000/harvey'
if (-not $liveBefore) { throw 'LIVE_HARVEY_NOT_HEALTHY_BEFORE_ISOLATED_BUILD' }
$dataBefore = Get-HarveyDataHash -Root $repo

New-Item -ItemType Directory -Path $source -Force | Out-Null
& git -C $repo archive --format=tar HEAD -o $archive
if ($LASTEXITCODE -ne 0) { throw 'GIT_ARCHIVE_FAILED' }
& tar.exe -xf $archive -C $source
if ($LASTEXITCODE -ne 0) { throw 'GIT_ARCHIVE_EXTRACT_FAILED' }
$liveRuntimeSource = (Join-Path $repo 'data\harvey\machine-control').TrimEnd('\') + '\'

foreach ($relative in @($contract.overlay_paths)) {
    $from = Join-Path $repo $relative
    if (-not (Test-Path -LiteralPath $from)) { throw "OVERLAY_PATH_MISSING: $relative" }
    if (Test-Path -LiteralPath $from -PathType Container) {
        foreach ($file in Get-ChildItem -LiteralPath $from -Recurse -File) {
            if ($file.FullName.StartsWith($liveRuntimeSource, [System.StringComparison]::OrdinalIgnoreCase)) { continue }
            $fileRelative = $file.FullName.Substring($repo.Length).TrimStart('\')
            $destination = Join-Path $source $fileRelative
            New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
            Copy-Item -LiteralPath $file.FullName -Destination $destination -Force
        }
    } else {
        $destination = Join-Path $source $relative
        New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
        Copy-Item -LiteralPath $from -Destination $destination -Force
    }
}

$isolatedManifest = Join-Path $source 'scripts\foreman\harvey-tests\HARVEY_SLICE_MANIFEST.json'
$isolatedContract = Get-Content -LiteralPath $isolatedManifest -Raw | ConvertFrom-Json
$isolatedManifestSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $isolatedManifest).Hash.ToLowerInvariant()
$isolatedOverlay = Get-HarveyOverlayFingerprint -Root $source -Contract $isolatedContract
if ($isolatedOverlay.sha256 -ne $sourceOverlay.sha256 -or $isolatedManifestSha256 -ne $manifestSha256) { throw 'ISOLATED_OVERLAY_FINGERPRINT_MISMATCH' }

$nodeModules = Join-Path $repo 'node_modules'
if (-not (Test-Path -LiteralPath $nodeModules -PathType Container)) { throw 'CANONICAL_NODE_MODULES_MISSING' }
New-Item -ItemType Junction -Path (Join-Path $source 'node_modules') -Target $nodeModules | Out-Null

Push-Location $source
try {
    & npm.cmd run typecheck
    if ($LASTEXITCODE -ne 0) { throw 'ISOLATED_TYPECHECK_FAILED' }
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'ISOLATED_BUILD_FAILED' }
    $server = Start-Process -FilePath 'C:\Program Files\nodejs\npm.cmd' -ArgumentList @('run','start','--','--hostname','127.0.0.1','-p',[string]$TestPort) -WorkingDirectory $source -RedirectStandardOutput $stdout -RedirectStandardError $stderr -WindowStyle Hidden -PassThru
    $ready = $false
    for ($attempt=1; $attempt -le 30; $attempt++) {
        if (Test-HarveyHttp200 -Uri ("http://127.0.0.1:$TestPort/harvey")) { $ready = $true; break }
        Start-Sleep -Milliseconds 500
    }
    if (-not $ready) { throw ('ISOLATED_ROUTE_FAILED: ' + ((Get-Content -LiteralPath $stderr -Tail 30 -ErrorAction SilentlyContinue) -join ' | ')) }
} finally {
    Pop-Location
    $listener = Get-NetTCPConnection -State Listen -LocalPort $TestPort -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($listener) { Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue }
    if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue }
}

$liveAfter = Test-HarveyHttp200 -Uri 'http://127.0.0.1:3000/harvey'
$dataAfter = Get-HarveyDataHash -Root $repo
$sourceOverlayAfter = Get-HarveyOverlayFingerprint -Root $repo -Contract $contract
$isolatedOverlayAfter = Get-HarveyOverlayFingerprint -Root $source -Contract $isolatedContract
$receipt = [ordered]@{
    schema = 'werkles.harvey-isolated-build-receipt/v1'
    generated_at = (Get-Date).ToUniversalTime().ToString('o')
    slice_id = $contract.slice_id
    status = if ($liveAfter -and $dataAfter -eq $dataBefore -and $sourceOverlayAfter.sha256 -eq $sourceOverlay.sha256 -and $isolatedOverlayAfter.sha256 -eq $sourceOverlay.sha256) { 'PASS' } else { 'FAIL' }
    source_repo = $repo
    source_head = (& git -C $repo rev-parse HEAD)
    manifest_sha256 = $manifestSha256
    source_overlay_sha256 = $sourceOverlay.sha256
    source_overlay_file_count = $sourceOverlay.file_count
    source_overlay_files = $sourceOverlay.files
    source_overlay_excludes = $sourceOverlay.excludes
    source_overlay_sha256_after = $sourceOverlayAfter.sha256
    isolated_workspace = $source
    isolated_manifest_sha256 = $isolatedManifestSha256
    isolated_overlay_sha256 = $isolatedOverlay.sha256
    isolated_overlay_sha256_after = $isolatedOverlayAfter.sha256
    test_port = $TestPort
    live_port_3000_before = $liveBefore
    live_port_3000_after = $liveAfter
    repo_data_hash_before = $dataBefore
    repo_data_hash_after = $dataAfter
    repo_data_unchanged = ($dataAfter -eq $dataBefore)
    repo_data_hash_excludes = @('data/harvey/machine-control/** (ephemeral live runtime)')
    stdout = $stdout
    stderr = $stderr
}
$receiptJson = $receipt | ConvertTo-Json -Depth 8
$receiptDirectory = Split-Path -Parent $ReceiptPath
if (-not (Test-Path -LiteralPath $receiptDirectory)) { New-Item -ItemType Directory -Path $receiptDirectory -Force | Out-Null }
[System.IO.File]::WriteAllText($ReceiptPath, ($receiptJson + "`n"), [System.Text.UTF8Encoding]::new($false))
$receiptJson
if ($receipt.status -ne 'PASS') { exit 1 }
