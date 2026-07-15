[CmdletBinding()]
param(
    [string]$RepoPath,
    [string]$Workspace,
    [ValidateRange(3101, 3199)][int]$TestPort = 3101,
    [ValidateRange(3102, 3199)][int]$SecondaryTestPort = 3102,
    [string]$ReceiptPath,
    [string[]]$TestFiles = @(
        'scripts/foreman/harvey-tests/command-lifecycle.test.mjs',
        'scripts/foreman/harvey-tests/command-race.test.mjs',
        'scripts/foreman/harvey-tests/handeye-duplicate-poll.test.mjs',
        'scripts/foreman/harvey-tests/fleet-command-lifecycle.test.mjs',
        'scripts/foreman/harvey-tests/operator-bridge.test.mjs',
        'scripts/foreman/harvey-tests/crew-bridge.test.mjs',
        'scripts/foreman/harvey-tests/crew-bridge-ui.e2e.mjs',
        'scripts/foreman/harvey-tests/transport-security.test.mjs',
        'scripts/foreman/harvey-tests/machine-identity-map.test.mjs',
        'scripts/foreman/harvey-tests/artifact-authenticity.test.mjs',
        'scripts/foreman/harvey-tests/command-retention.test.mjs',
        'scripts/foreman/harvey-tests/snapshot-contract.test.mjs',
        'scripts/foreman/harvey-tests/snapshot-truth-precedence.test.mjs',
        'scripts/foreman/harvey-tests/snapshot-api.test.mjs',
        'scripts/foreman/harvey-tests/sally-witness.test.mjs',
        'scripts/foreman/harvey-tests/snapshot-live-update.e2e.mjs'
    )
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $RepoPath) { $RepoPath = (Resolve-Path (Join-Path $scriptRoot '..\..\..')).Path }
$repo = (Resolve-Path -LiteralPath $RepoPath).Path
if (-not $ReceiptPath) { $ReceiptPath = Join-Path $repo 'outputs\harvey-tests\HARVEY_SLICE_1_ISOLATED_API_RECEIPT.json' }
$buildReceiptPath = Join-Path $repo 'outputs\harvey-tests\HARVEY_SLICE_0_ISOLATED_BUILD_RECEIPT.json'
$buildReceiptSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $buildReceiptPath).Hash.ToLowerInvariant()
$buildReceipt = Get-Content -LiteralPath $buildReceiptPath -Raw | ConvertFrom-Json
if (-not $Workspace) { $Workspace = [string]$buildReceipt.isolated_workspace }
$workspacePath = (Resolve-Path -LiteralPath $Workspace).Path
if ($workspacePath.StartsWith($repo, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'API_TEST_WORKSPACE_MUST_BE_ISOLATED' }
if (-not $workspacePath.Equals([string]$buildReceipt.isolated_workspace, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'API_TEST_WORKSPACE_BUILD_RECEIPT_MISMATCH' }
. (Join-Path $scriptRoot 'Get-HarveyOverlayFingerprint.ps1')
$canonicalManifest = Join-Path $scriptRoot 'HARVEY_SLICE_MANIFEST.json'
$canonicalContract = Get-Content -LiteralPath $canonicalManifest -Raw | ConvertFrom-Json
$workspaceManifest = Join-Path $workspacePath 'scripts\foreman\harvey-tests\HARVEY_SLICE_MANIFEST.json'
$workspaceContract = Get-Content -LiteralPath $workspaceManifest -Raw | ConvertFrom-Json
$canonicalManifestSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $canonicalManifest).Hash.ToLowerInvariant()
$workspaceManifestSha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $workspaceManifest).Hash.ToLowerInvariant()
$canonicalOverlayBefore = Get-HarveyOverlayFingerprint -Root $repo -Contract $canonicalContract
$workspaceOverlayBefore = Get-HarveyOverlayFingerprint -Root $workspacePath -Contract $workspaceContract
if ($buildReceipt.status -ne 'PASS' -or [string]$buildReceipt.source_overlay_sha256 -ne $canonicalOverlayBefore.sha256 -or [string]$buildReceipt.isolated_overlay_sha256 -ne $workspaceOverlayBefore.sha256 -or [string]$buildReceipt.manifest_sha256 -ne $canonicalManifestSha256 -or $workspaceManifestSha256 -ne $canonicalManifestSha256) {
    throw 'API_TEST_BUILD_OVERLAY_FINGERPRINT_MISMATCH'
}
if (Get-NetTCPConnection -State Listen -LocalPort $TestPort -ErrorAction SilentlyContinue) { throw "TEST_PORT_ALREADY_IN_USE: $TestPort" }
if (Get-NetTCPConnection -State Listen -LocalPort $SecondaryTestPort -ErrorAction SilentlyContinue) { throw "TEST_PORT_ALREADY_IN_USE: $SecondaryTestPort" }
$isolatedControlData = Join-Path $workspacePath 'data\harvey\machine-control'
if (Test-Path -LiteralPath $isolatedControlData) {
    $resolvedControlData = (Resolve-Path -LiteralPath $isolatedControlData).Path
    if (-not $resolvedControlData.StartsWith(($workspacePath + [System.IO.Path]::DirectorySeparatorChar), [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'ISOLATED_CONTROL_DATA_BOUNDARY_FAILED'
    }
    Remove-Item -LiteralPath $resolvedControlData -Recurse -Force
}

function Get-HarveyDataHash {
    param([string]$Root)
    $data = Join-Path $Root 'data\harvey'
    $liveRuntime = (Join-Path $data 'machine-control').TrimEnd('\') + '\'
    $rows = Get-ChildItem -LiteralPath $data -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
        -not $_.FullName.StartsWith($liveRuntime, [System.StringComparison]::OrdinalIgnoreCase)
    } | Sort-Object FullName | ForEach-Object {
        $relative = $_.FullName.Substring($data.Length).TrimStart('\').Replace('\','/')
        "$relative`:$( (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant() )"
    }
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { return ([System.BitConverter]::ToString($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes(($rows -join "`n"))))).Replace('-','').ToLowerInvariant() }
    finally { $sha.Dispose() }
}

$repoDataBefore = Get-HarveyDataHash -Root $repo
$testFileRows = @($TestFiles | Sort-Object | ForEach-Object {
    $testPath = Join-Path $workspacePath $_
    if (-not (Test-Path -LiteralPath $testPath -PathType Leaf)) { throw "API_TEST_FILE_MISSING: $_" }
    "$($_.Replace('\','/')):$((Get-FileHash -Algorithm SHA256 -LiteralPath $testPath).Hash.ToLowerInvariant())"
})
$testFileHasher = [System.Security.Cryptography.SHA256]::Create()
try { $testFilesSha256 = ([System.BitConverter]::ToString($testFileHasher.ComputeHash([System.Text.Encoding]::UTF8.GetBytes(($testFileRows -join "`n"))))).Replace('-','').ToLowerInvariant() }
finally { $testFileHasher.Dispose() }
$stdout = Join-Path $workspacePath 'security-server.out.log'
$stderr = Join-Path $workspacePath 'security-server.err.log'
$secondaryStdout = Join-Path $workspacePath 'security-server-secondary.out.log'
$secondaryStderr = Join-Path $workspacePath 'security-server-secondary.err.log'
$savedOperator = $env:HARVEY_OPERATOR_TOKEN
$savedAgents = $env:HARVEY_AGENT_SECRETS_JSON
$savedBase = $env:HARVEY_TEST_BASE_URL
$savedSecondaryBase = $env:HARVEY_TEST_BASE_URL_SECONDARY
$savedWorkspace = $env:HARVEY_TEST_WORKSPACE
$server = $null
$secondaryServer = $null
$testExit = 1
$handeyeExit = 1
$manifestPinNegative = $false
$manifestPinPositive = $false
$savedHandeyeSecret = $env:HARVEY_AGENT_SECRET
$savedManifestPin = $env:HARVEY_COCKPIT_MANIFEST_SHA256
$savedCommandLease = $env:HARVEY_COMMAND_LEASE_MS
$savedWitnessScope = $env:HARVEY_WITNESS_EVIDENCE_SCOPE
try {
    $env:HARVEY_OPERATOR_TOKEN = 'harvey-test-operator-token'
    $env:HARVEY_AGENT_SECRETS_JSON = '{"Doss":"harvey-test-doss-secret","Betsy":"harvey-test-betsy-secret","Spanzee":"harvey-test-spanzee-secret","Medullina":"harvey-test-medullina-secret","Sally":"harvey-test-sally-secret"}'
    $env:HARVEY_COMMAND_LEASE_MS = '90000'
    $env:HARVEY_WITNESS_EVIDENCE_SCOPE = 'FIXTURE_ONLY'
    $env:HARVEY_TEST_BASE_URL = "http://127.0.0.1:$TestPort"
    $env:HARVEY_TEST_BASE_URL_SECONDARY = "http://127.0.0.1:$SecondaryTestPort"
    $env:HARVEY_TEST_WORKSPACE = $workspacePath
    $server = Start-Process -FilePath 'C:\Program Files\nodejs\npm.cmd' -ArgumentList @('run','start','--','--hostname','127.0.0.1','-p',[string]$TestPort) -WorkingDirectory $workspacePath -RedirectStandardOutput $stdout -RedirectStandardError $stderr -WindowStyle Hidden -PassThru
    $secondaryServer = Start-Process -FilePath 'C:\Program Files\nodejs\npm.cmd' -ArgumentList @('run','start','--','--hostname','127.0.0.1','-p',[string]$SecondaryTestPort) -WorkingDirectory $workspacePath -RedirectStandardOutput $secondaryStdout -RedirectStandardError $secondaryStderr -WindowStyle Hidden -PassThru
    $ready = $false
    for ($attempt=1; $attempt -le 30; $attempt++) {
        try { if ((Invoke-WebRequest -UseBasicParsing -Uri ($env:HARVEY_TEST_BASE_URL + '/api/harvey/machines') -TimeoutSec 3).StatusCode -eq 200) { $ready = $true; break } } catch {}
        Start-Sleep -Milliseconds 500
    }
    if (-not $ready) { throw ('ISOLATED_API_SERVER_FAILED: ' + ((Get-Content -LiteralPath $stderr -Tail 30 -ErrorAction SilentlyContinue) -join ' | ')) }
    $secondaryReady = $false
    for ($attempt=1; $attempt -le 30; $attempt++) {
        try { if ((Invoke-WebRequest -UseBasicParsing -Uri ($env:HARVEY_TEST_BASE_URL_SECONDARY + '/api/harvey/machines') -TimeoutSec 3).StatusCode -eq 200) { $secondaryReady = $true; break } } catch {}
        Start-Sleep -Milliseconds 500
    }
    if (-not $secondaryReady) { throw ('ISOLATED_SECONDARY_API_SERVER_FAILED: ' + ((Get-Content -LiteralPath $secondaryStderr -Tail 30 -ErrorAction SilentlyContinue) -join ' | ')) }
    $operatorHeaders = @{ Authorization = 'Bearer harvey-test-operator-token' }
    $knockBody = @{ machine = 'Doss'; action = 'KNOCK'; payload = @{} } | ConvertTo-Json -Depth 4
    $negativeCommand = Invoke-RestMethod -Method Post -Uri ($env:HARVEY_TEST_BASE_URL + '/api/harvey/commands') -Headers $operatorHeaders -ContentType 'application/json' -Body $knockBody
    $env:HARVEY_AGENT_SECRET = 'harvey-test-doss-secret'
    $env:HARVEY_COCKPIT_MANIFEST_SHA256 = ('0' * 64)
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo 'scripts\foreman\Invoke-HarveyHandeye.ps1') -MachineName 'doss' -CockpitUrl $env:HARVEY_TEST_BASE_URL -Once | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'ACTUAL_HANDEYE_NEGATIVE_PIN_RUN_FAILED' }
    $negativeReadback = Invoke-RestMethod -Method Get -Uri ($env:HARVEY_TEST_BASE_URL + '/api/harvey/commands?machine=Doss')
    $negativeResult = @($negativeReadback.commands | Where-Object { $_.command_id -eq $negativeCommand.command.command_id }) | Select-Object -First 1
    $manifestPinNegative = ($negativeResult.status -eq 'BLOCKER' -and $negativeResult.receipt.evidence -eq 'CURRENT_COCKPIT_MANIFEST_HASH_MISMATCH')
    if (-not $manifestPinNegative) { throw 'ACTUAL_HANDEYE_MANIFEST_PIN_NEGATIVE_FAILED' }

    $positiveCommand = Invoke-RestMethod -Method Post -Uri ($env:HARVEY_TEST_BASE_URL + '/api/harvey/commands') -Headers $operatorHeaders -ContentType 'application/json' -Body $knockBody
    $env:HARVEY_COCKPIT_MANIFEST_SHA256 = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $repo 'foreman\harvey\HARVEY_COCKPIT_ARTIFACT_MANIFEST_20260713.json')).Hash.ToLowerInvariant()
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo 'scripts\foreman\Invoke-HarveyHandeye.ps1') -MachineName 'doss' -CockpitUrl $env:HARVEY_TEST_BASE_URL -Once | Out-Null
    $handeyeExit = $LASTEXITCODE
    $positiveReadback = Invoke-RestMethod -Method Get -Uri ($env:HARVEY_TEST_BASE_URL + '/api/harvey/commands?machine=Doss')
    $positiveResult = @($positiveReadback.commands | Where-Object { $_.command_id -eq $positiveCommand.command.command_id }) | Select-Object -First 1
    $manifestPinPositive = ($positiveResult.status -eq 'COMPLETED')
    if (-not $manifestPinPositive) { throw 'ACTUAL_HANDEYE_MANIFEST_PIN_POSITIVE_FAILED' }
    & node --test --test-concurrency=1 @TestFiles
    $testExit = $LASTEXITCODE
} finally {
    $listener = Get-NetTCPConnection -State Listen -LocalPort $TestPort -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($listener) { Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue }
    $secondaryListener = Get-NetTCPConnection -State Listen -LocalPort $SecondaryTestPort -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($secondaryListener) { Stop-Process -Id $secondaryListener.OwningProcess -Force -ErrorAction SilentlyContinue }
    if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue }
    if ($secondaryServer -and -not $secondaryServer.HasExited) { Stop-Process -Id $secondaryServer.Id -Force -ErrorAction SilentlyContinue }
    $env:HARVEY_OPERATOR_TOKEN = $savedOperator
    $env:HARVEY_AGENT_SECRETS_JSON = $savedAgents
    $env:HARVEY_TEST_BASE_URL = $savedBase
    $env:HARVEY_TEST_BASE_URL_SECONDARY = $savedSecondaryBase
    $env:HARVEY_TEST_WORKSPACE = $savedWorkspace
    $env:HARVEY_AGENT_SECRET = $savedHandeyeSecret
    $env:HARVEY_COCKPIT_MANIFEST_SHA256 = $savedManifestPin
    $env:HARVEY_COMMAND_LEASE_MS = $savedCommandLease
    $env:HARVEY_WITNESS_EVIDENCE_SCOPE = $savedWitnessScope
}
$repoDataAfter = Get-HarveyDataHash -Root $repo
$canonicalOverlayAfter = Get-HarveyOverlayFingerprint -Root $repo -Contract $canonicalContract
$workspaceOverlayAfter = Get-HarveyOverlayFingerprint -Root $workspacePath -Contract $workspaceContract
$receipt = [ordered]@{
    schema = 'werkles.harvey-isolated-api-test-receipt/v1'
    generated_at = (Get-Date).ToUniversalTime().ToString('o')
    status = if ($handeyeExit -eq 0 -and $manifestPinNegative -and $manifestPinPositive -and $testExit -eq 0 -and $repoDataBefore -eq $repoDataAfter -and $canonicalOverlayAfter.sha256 -eq $canonicalOverlayBefore.sha256 -and $workspaceOverlayAfter.sha256 -eq $workspaceOverlayBefore.sha256) { 'PASS' } else { 'FAIL' }
    workspace = $workspacePath
    build_receipt_sha256 = $buildReceiptSha256
    manifest_sha256 = $canonicalManifestSha256
    source_overlay_sha256 = $canonicalOverlayBefore.sha256
    source_overlay_sha256_after = $canonicalOverlayAfter.sha256
    workspace_overlay_sha256 = $workspaceOverlayBefore.sha256
    workspace_overlay_sha256_after = $workspaceOverlayAfter.sha256
    test_files_sha256 = $testFilesSha256
    test_file_hashes = $testFileRows
    test_port = $TestPort
    secondary_test_port = $SecondaryTestPort
    tests = $TestFiles
    actual_powershell_handeye_exit = $handeyeExit
    actual_handeye_manifest_pin_negative = $manifestPinNegative
    actual_handeye_manifest_pin_positive = $manifestPinPositive
    test_exit = $testExit
    repo_data_hash_before = $repoDataBefore
    repo_data_hash_after = $repoDataAfter
    repo_data_unchanged = ($repoDataBefore -eq $repoDataAfter)
    repo_data_hash_excludes = @('data/harvey/machine-control/** (ephemeral live runtime)')
}
$receiptJson = $receipt | ConvertTo-Json -Depth 8
$receiptDirectory = Split-Path -Parent $ReceiptPath
if (-not (Test-Path -LiteralPath $receiptDirectory)) { New-Item -ItemType Directory -Path $receiptDirectory -Force | Out-Null }
[System.IO.File]::WriteAllText($ReceiptPath, ($receiptJson + "`n"), [System.Text.UTF8Encoding]::new($false))
$receiptJson
if ($receipt.status -ne 'PASS') { exit 1 }
