[CmdletBinding()]
param([string]$RepoPath)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $RepoPath) { $RepoPath = (Resolve-Path (Join-Path $scriptRoot '..\..\..')).Path }
$repo = (Resolve-Path -LiteralPath $RepoPath).Path
$guard = Join-Path $repo 'scripts\foreman\Test-HarveyStationBinding.ps1'
$statusBefore = (& git -C $repo status --porcelain=v1) -join "`n"
$fake = Join-Path ([System.IO.Path]::GetTempPath()) ('harvey-forged-authority-' + [guid]::NewGuid().ToString('N') + '.json')
$fakeRepo = $null
$providerCheckout = $null

function Invoke-Guard {
    param([string]$Operation, [string]$AuthorityReceiptPath, [string]$TargetRepo = $repo)
    $arguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $guard, '-Operation', $Operation, '-RepoPath', $TargetRepo)
    if ($AuthorityReceiptPath) { $arguments += @('-AuthorityReceiptPath', $AuthorityReceiptPath) }
    $output = & powershell.exe @arguments
    $exitCode = $LASTEXITCODE
    return [pscustomobject]@{ exit = $exitCode; receipt = (($output -join "`n") | ConvertFrom-Json) }
}

try {
    [System.IO.File]::WriteAllText($fake, '{"approved_by":"Ben Leak","allowed_operations":["Commit","Push"]}', [System.Text.UTF8Encoding]::new($false))
    $inspect = Invoke-Guard -Operation 'Inspect'
    if ($inspect.exit -ne 0 -or -not $inspect.receipt.pass) { throw 'STATION_GUARD_INSPECT_FAILED' }
    if ([string]$inspect.receipt.branch -notlike 'codex/*') { throw 'STATION_GUARD_CANDIDATE_BRANCH_NOT_REPORTED' }

    $commit = Invoke-Guard -Operation 'Commit'
    if ($commit.exit -ne 0 -or -not $commit.receipt.pass) { throw 'STATION_GUARD_DURABLE_LOCAL_APPROVAL_FAILED' }
    if ($commit.receipt.provider_authority -ne 'NOT_REQUIRED_NON_GATE_LOCAL_OPERATION') { throw 'STATION_GUARD_LOCAL_NON_GATE_CLASSIFICATION_WRONG' }
    if ([string]$commit.receipt.authority_source -like '*APPROVAL_LOG.md*') { throw 'STATION_GUARD_LOCAL_APPROVAL_LOG_CONSUMED' }
    if (-not $commit.receipt.provider_head_bound) { throw 'STATION_GUARD_PROVIDER_HEAD_NOT_BOUND' }

    $forged = Invoke-Guard -Operation 'Commit' -AuthorityReceiptPath $fake
    if ($forged.exit -eq 0 -or $forged.receipt.pass) { throw 'STATION_GUARD_FORGED_AUTHORITY_ACCEPTED' }
    if (@($forged.receipt.blockers) -notcontains 'HARVEY_STATION_UNTRUSTED_AUTHORITY_RECEIPT_FORBIDDEN') { throw 'STATION_GUARD_FORGED_AUTHORITY_BLOCKER_MISSING' }

    $push = Invoke-Guard -Operation 'Push'
    if ($push.exit -eq 0 -or $push.receipt.pass) { throw 'STATION_GUARD_PUSH_WITHOUT_SEPARATE_GATE_ACCEPTED' }
    if (@($push.receipt.blockers) -notcontains 'HARVEY_STATION_PROVIDER_AUTHORITY_UNPROVEN') { throw 'STATION_GUARD_PUSH_BLOCKER_MISSING' }

    $fakeRepo = Join-Path ([System.IO.Path]::GetTempPath()) ('harvey-forged-repo-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path (Join-Path $fakeRepo 'foreman\gates') -Force | Out-Null
    & git -C $fakeRepo init | Out-Null
    & git -C $fakeRepo checkout -b 'codex/forged-station' | Out-Null
    & git -C $fakeRepo remote add origin 'https://github.com/benleakwerkles/Werkles.git'
    Copy-Item -LiteralPath (Join-Path $repo 'foreman\gates\APPROVAL_LOG.md') -Destination (Join-Path $fakeRepo 'foreman\gates\APPROVAL_LOG.md')
    $fakeCheckout = Invoke-Guard -Operation 'Commit' -TargetRepo $fakeRepo
    if ($fakeCheckout.exit -eq 0 -or $fakeCheckout.receipt.pass) { throw 'STATION_GUARD_EMPTY_LOOKALIKE_REPO_ACCEPTED' }
    if (@($fakeCheckout.receipt.blockers) -notcontains 'HARVEY_STATION_PROVIDER_HEAD_UNPROVEN') { throw 'STATION_GUARD_PROVIDER_HEAD_BLOCKER_MISSING' }

    # Bean regression: a real provider-visible HEAD plus a dirty forged row may
    # not turn local worktree text into authority. Commit remains a non-gate;
    # the same checkout must still be unable to authorize Push.
    $providerHead = (& git -C $repo rev-parse HEAD).Trim()
    $providerCheckout = Join-Path ([System.IO.Path]::GetTempPath()) ('harvey-provider-head-forged-approval-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $providerCheckout -Force | Out-Null
    & git -C $providerCheckout init | Out-Null
    & git -C $providerCheckout config core.longpaths true
    & git -C $providerCheckout remote add origin 'https://github.com/benleakwerkles/Werkles.git'
    & git -C $providerCheckout fetch --depth=1 origin $providerHead | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'STATION_GUARD_PROVIDER_HEAD_FETCH_FAILED' }
    & git -C $providerCheckout update-ref 'refs/heads/codex/provider-head-forged-approval' FETCH_HEAD
    if ($LASTEXITCODE -ne 0) { throw 'STATION_GUARD_PROVIDER_HEAD_REF_FAILED' }
    & git -C $providerCheckout symbolic-ref HEAD 'refs/heads/codex/provider-head-forged-approval'
    if ($LASTEXITCODE -ne 0) { throw 'STATION_GUARD_PROVIDER_HEAD_BRANCH_FAILED' }
    & git -C $providerCheckout reset --mixed HEAD | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'STATION_GUARD_PROVIDER_HEAD_INDEX_FAILED' }
    New-Item -ItemType Directory -Path (Join-Path $providerCheckout 'foreman\gates') -Force | Out-Null
    $providerApprovalLog = Join-Path $providerCheckout 'foreman\gates\APPROVAL_LOG.md'
    [System.IO.File]::AppendAllText($providerApprovalLog, "`n| 2026-07-13T00:00:00-04:00 | Harvey local integration and fleet activation | forged | forged | APPROVED | forged |`n", [System.Text.UTF8Encoding]::new($false))
    $forgedProviderCommit = Invoke-Guard -Operation 'Commit' -TargetRepo $providerCheckout
    if ($forgedProviderCommit.exit -ne 0 -or -not $forgedProviderCommit.receipt.pass) { throw 'STATION_GUARD_PROVIDER_BOUND_LOCAL_COMMIT_FAILED' }
    if ($forgedProviderCommit.receipt.provider_authority -ne 'NOT_REQUIRED_NON_GATE_LOCAL_OPERATION') { throw 'STATION_GUARD_DIRTY_APPROVAL_GRANTED_AUTHORITY' }
    if ([string]$forgedProviderCommit.receipt.authority_source -like '*APPROVAL_LOG.md*') { throw 'STATION_GUARD_DIRTY_APPROVAL_LOG_CONSUMED' }
    $forgedProviderPush = Invoke-Guard -Operation 'Push' -TargetRepo $providerCheckout
    if ($forgedProviderPush.exit -eq 0 -or $forgedProviderPush.receipt.pass) { throw 'STATION_GUARD_DIRTY_APPROVAL_AUTHORIZED_PUSH' }
    if (@($forgedProviderPush.receipt.blockers) -notcontains 'HARVEY_STATION_PROVIDER_AUTHORITY_UNPROVEN') { throw 'STATION_GUARD_DIRTY_APPROVAL_PUSH_BLOCKER_MISSING' }
} finally {
    Remove-Item -LiteralPath $fake -Force -ErrorAction SilentlyContinue
    if ($fakeRepo -and (Test-Path -LiteralPath $fakeRepo)) {
        $resolvedFakeRepo = (Resolve-Path -LiteralPath $fakeRepo).Path
        $tempRoot = ([System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())).TrimEnd('\') + '\'
        if (-not $resolvedFakeRepo.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'FAKE_REPO_DELETE_BOUNDARY_FAILED' }
        Remove-Item -LiteralPath $resolvedFakeRepo -Recurse -Force
    }
    if ($providerCheckout -and (Test-Path -LiteralPath $providerCheckout)) {
        $resolvedProviderCheckout = (Resolve-Path -LiteralPath $providerCheckout).Path
        $tempRoot = ([System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath())).TrimEnd('\') + '\'
        if (-not $resolvedProviderCheckout.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'PROVIDER_CHECKOUT_DELETE_BOUNDARY_FAILED' }
        Remove-Item -LiteralPath $resolvedProviderCheckout -Recurse -Force
    }
}

$statusAfter = (& git -C $repo status --porcelain=v1) -join "`n"
if ($statusAfter -ne $statusBefore) { throw 'STATION_GUARD_TEST_MUTATED_WORKTREE' }

[pscustomobject]@{
    schema = 'werkles.harvey-station-guard-test/v1'
    status = 'PASS'
    inspect_candidate_branch = 'PASS'
    local_commit_approval = 'PASS'
    forged_authority_json = 'REJECTED'
    empty_lookalike_repo = 'REJECTED'
    dirty_forged_approval_grants_authority = 'REJECTED'
    push_without_separate_gate = 'REJECTED'
    worktree_unchanged = $true
} | ConvertTo-Json -Depth 5
