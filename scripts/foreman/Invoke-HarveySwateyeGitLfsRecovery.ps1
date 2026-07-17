[CmdletBinding(DefaultParameterSetName = 'Inspect')]
param(
    [Parameter(Mandatory = $true, ParameterSetName = 'Execute')]
    [switch]$Execute,

    [Parameter(Mandatory = $true, ParameterSetName = 'SelfTest')]
    [switch]$SelfTest
)

$ErrorActionPreference = 'Stop'
$PolicyId = 'SWATEYE_SPANZEE_GIT_LFS_ORPHAN_RECOVERY_V1'
$ExpectedHostname = 'SPANZEE'
$MinimumAge = [timespan]::FromMinutes(10)
$MaximumCpuDeltaMs = 5.0
$SampleMilliseconds = 1250

function Test-SwateyeCandidate {
    param(
        [Parameter(Mandatory = $true)]$Observation,
        [Parameter(Mandatory = $true)][string[]]$ApprovedExecutablePaths,
        [Parameter(Mandatory = $true)][datetime]$NowUtc
    )

    $reasons = New-Object System.Collections.Generic.List[string]
    if (-not ([string]$Observation.Name).Equals('git-lfs.exe', [System.StringComparison]::OrdinalIgnoreCase)) {
        $reasons.Add('IMAGE_NAME_NOT_GIT_LFS')
    }
    $pathApproved = $false
    foreach ($approvedPath in $ApprovedExecutablePaths) {
        if ([string]$Observation.ExecutablePath -and ([string]$Observation.ExecutablePath).Equals($approvedPath, [System.StringComparison]::OrdinalIgnoreCase)) {
            $pathApproved = $true
            break
        }
    }
    if (-not $pathApproved) { $reasons.Add('EXECUTABLE_PATH_NOT_APPROVED') }
    if ($null -eq $Observation.CreationTimeUtc) {
        $reasons.Add('CREATION_TIME_UNPROVEN')
    }
    elseif (($NowUtc - [datetime]$Observation.CreationTimeUtc) -lt $MinimumAge) {
        $reasons.Add('PROCESS_TOO_RECENT')
    }
    if ([string]$Observation.ParentState -notin @('ABSENT', 'PID_REUSED')) { $reasons.Add('PARENT_STILL_LIVE') }
    if ($null -eq $Observation.CpuDeltaMs) {
        $reasons.Add('CPU_IDLE_STATE_UNPROVEN')
    }
    elseif ([double]$Observation.CpuDeltaMs -gt $MaximumCpuDeltaMs) {
        $reasons.Add('CPU_ACTIVE')
    }
    if ($null -eq $Observation.HasTcpConnection) {
        $reasons.Add('TCP_STATE_UNPROVEN')
    }
    elseif ([bool]$Observation.HasTcpConnection) {
        $reasons.Add('TCP_CONNECTION_ACTIVE')
    }
    if ($null -eq $Observation.HasChildProcess) {
        $reasons.Add('CHILD_STATE_UNPROVEN')
    }
    elseif ([bool]$Observation.HasChildProcess) {
        $reasons.Add('CHILD_PROCESS_ACTIVE')
    }

    return [pscustomobject]@{
        eligible = $reasons.Count -eq 0
        reasons = @($reasons)
    }
}

function Invoke-SwateyePolicySelfTest {
    $approved = 'C:\Program Files\Git\mingw64\bin\git-lfs.exe'
    $now = [datetime]'2026-07-17T20:00:00Z'
    $base = [ordered]@{
        Name = 'git-lfs.exe'
        ExecutablePath = $approved
        CreationTimeUtc = $now.AddMinutes(-20)
        ParentState = 'ABSENT'
        CpuDeltaMs = 0.0
        HasTcpConnection = $false
        HasChildProcess = $false
    }
    function New-TestObservation {
        param([hashtable]$Overrides = @{})
        $copy = [ordered]@{}
        foreach ($key in $base.Keys) { $copy[$key] = $base[$key] }
        foreach ($key in $Overrides.Keys) { $copy[$key] = $Overrides[$key] }
        return [pscustomobject]$copy
    }
    $cases = @(
        @{ name = 'proven_orphan'; expected = $true; observation = (New-TestObservation) },
        @{ name = 'live_parent'; expected = $false; observation = (New-TestObservation @{ ParentState = 'LIVE' }) },
        @{ name = 'recent'; expected = $false; observation = (New-TestObservation @{ CreationTimeUtc = $now.AddMinutes(-2) }) },
        @{ name = 'wrong_image'; expected = $false; observation = (New-TestObservation @{ Name = 'node.exe' }) },
        @{ name = 'wrong_path'; expected = $false; observation = (New-TestObservation @{ ExecutablePath = 'C:\Temp\git-lfs.exe' }) },
        @{ name = 'cpu_active'; expected = $false; observation = (New-TestObservation @{ CpuDeltaMs = 12.0 }) },
        @{ name = 'tcp_active'; expected = $false; observation = (New-TestObservation @{ HasTcpConnection = $true }) },
        @{ name = 'child_active'; expected = $false; observation = (New-TestObservation @{ HasChildProcess = $true }) },
        @{ name = 'probe_ambiguous'; expected = $false; observation = (New-TestObservation @{ CpuDeltaMs = $null; HasTcpConnection = $null }) }
    )
    $results = foreach ($case in $cases) {
        $result = Test-SwateyeCandidate -Observation $case.observation -ApprovedExecutablePaths @($approved) -NowUtc $now
        [pscustomobject]@{
            name = $case.name
            status = if ($result.eligible -eq $case.expected) { 'PASS' } else { 'FAIL' }
            eligible = $result.eligible
            reasons = $result.reasons
        }
    }
    $failed = @($results | Where-Object { $_.status -ne 'PASS' })
    return [ordered]@{
        schema = 'werkles.harvey-swateye-self-test/v1'
        policy_id = $PolicyId
        status = if ($failed.Count -eq 0) { 'PASS' } else { 'FAIL' }
        cases = @($results)
    }
}

function Get-ApprovedGitLfsPaths {
    $paths = New-Object System.Collections.Generic.List[string]
    foreach ($command in @(Get-Command git-lfs.exe -All -ErrorAction SilentlyContinue)) {
        $candidate = if ($command.Source) { [string]$command.Source } else { [string]$command.Path }
        if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            $paths.Add([System.IO.Path]::GetFullPath($candidate))
        }
    }
    foreach ($candidate in @(
        (Join-Path $env:ProgramFiles 'Git\mingw64\bin\git-lfs.exe'),
        (Join-Path $env:ProgramFiles 'Git\cmd\git-lfs.exe')
    )) {
        if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            $paths.Add([System.IO.Path]::GetFullPath($candidate))
        }
    }
    return @($paths | Sort-Object -Unique)
}

function ConvertTo-UtcDateTime {
    param($Value)
    if ($null -eq $Value) { return $null }
    try { return ([datetime]$Value).ToUniversalTime() }
    catch { return $null }
}

function Get-SwateyeProcessMap {
    $processes = @(Get-CimInstance Win32_Process -ErrorAction Stop)
    $byPid = @{}
    foreach ($process in $processes) { $byPid[[int]$process.ProcessId] = $process }
    return [pscustomobject]@{ all = $processes; by_pid = $byPid }
}

function Get-ParentState {
    param(
        [Parameter(Mandatory = $true)]$Process,
        [Parameter(Mandatory = $true)]$ProcessMap,
        [Parameter(Mandatory = $true)][datetime]$ChildCreationTimeUtc
    )
    $parentId = [int]$Process.ParentProcessId
    if ($parentId -le 0 -or -not $ProcessMap.by_pid.ContainsKey($parentId)) { return 'ABSENT' }
    $parentCreationTime = ConvertTo-UtcDateTime $ProcessMap.by_pid[$parentId].CreationDate
    if ($null -eq $parentCreationTime) { return 'UNPROVEN' }
    if ($parentCreationTime -gt $ChildCreationTimeUtc) { return 'PID_REUSED' }
    return 'LIVE'
}

function Get-SwateyeTcpOwnerSet {
    $owners = @{}
    foreach ($connection in @(Get-NetTCPConnection -ErrorAction Stop)) {
        if ([int]$connection.OwningProcess -gt 0) { $owners[[int]$connection.OwningProcess] = $true }
    }
    return $owners
}

function Invoke-HarveySwateyeGitLfsRecovery {
    $actualHostname = [System.Environment]::MachineName.ToUpperInvariant()
    $mode = if ($Execute) { 'EXECUTE' } else { 'INSPECT' }
    if ($Execute -and $actualHostname -ne $ExpectedHostname) {
        return [ordered]@{
            schema = 'werkles.harvey-swateye-receipt/v1'
            policy_id = $PolicyId
            mode = $mode
            machine = 'Spanzee'
            hostname = $actualHostname
            status = 'BLOCKER'
            blockers = @('SPANZEE_HOSTNAME_REQUIRED')
            inspected_count = 0
            eligible_count = 0
            stopped_count = 0
            blanket_name_kill_used = $false
            secrets_read_or_printed = $false
        }
    }

    $approvedPaths = @(Get-ApprovedGitLfsPaths)
    if ($approvedPaths.Count -eq 0) {
        return [ordered]@{
            schema = 'werkles.harvey-swateye-receipt/v1'
            policy_id = $PolicyId
            mode = $mode
            machine = 'Spanzee'
            hostname = $actualHostname
            status = 'BLOCKER'
            blockers = @('APPROVED_GIT_LFS_EXECUTABLE_NOT_FOUND')
            inspected_count = 0
            eligible_count = 0
            stopped_count = 0
            blanket_name_kill_used = $false
            secrets_read_or_printed = $false
        }
    }

    $mutex = New-Object System.Threading.Mutex($false, 'Local\WerklesHarveySwateyeGitLfsRecovery')
    $mutexHeld = $false
    try {
        try { $mutexHeld = $mutex.WaitOne(0) }
        catch [System.Threading.AbandonedMutexException] { $mutexHeld = $true }
        if (-not $mutexHeld) {
            return [ordered]@{
                schema = 'werkles.harvey-swateye-receipt/v1'
                policy_id = $PolicyId
                mode = $mode
                machine = 'Spanzee'
                hostname = $actualHostname
                status = 'BLOCKER'
                blockers = @('SWATEYE_RECOVERY_ALREADY_RUNNING')
                inspected_count = 0
                eligible_count = 0
                stopped_count = 0
                blanket_name_kill_used = $false
                secrets_read_or_printed = $false
            }
        }

        $processMap = Get-SwateyeProcessMap
        $targets = @($processMap.all | Where-Object { ([string]$_.Name).Equals('git-lfs.exe', [System.StringComparison]::OrdinalIgnoreCase) })
        $tcpOwners = Get-SwateyeTcpOwnerSet
        $cpuStart = @{}
        foreach ($target in $targets) {
            try { $cpuStart[[int]$target.ProcessId] = (Get-Process -Id ([int]$target.ProcessId) -ErrorAction Stop).TotalProcessorTime.TotalMilliseconds }
            catch { $cpuStart[[int]$target.ProcessId] = $null }
        }
        if ($targets.Count -gt 0) { Start-Sleep -Milliseconds $SampleMilliseconds }

        $observations = foreach ($target in $targets) {
            $pidValue = [int]$target.ProcessId
            $creationTime = ConvertTo-UtcDateTime $target.CreationDate
            $cpuDelta = $null
            try {
                $startCpu = $cpuStart[$pidValue]
                if ($null -ne $startCpu) {
                    $endCpu = (Get-Process -Id $pidValue -ErrorAction Stop).TotalProcessorTime.TotalMilliseconds
                    $cpuDelta = [Math]::Max(0.0, [double]$endCpu - [double]$startCpu)
                }
            }
            catch {}
            $parentState = if ($null -eq $creationTime) { 'UNPROVEN' } else { Get-ParentState -Process $target -ProcessMap $processMap -ChildCreationTimeUtc $creationTime }
            [pscustomobject]@{
                ProcessId = $pidValue
                Name = [string]$target.Name
                ExecutablePath = [string]$target.ExecutablePath
                CreationTimeUtc = $creationTime
                ParentState = $parentState
                CpuDeltaMs = $cpuDelta
                HasTcpConnection = $tcpOwners.ContainsKey($pidValue)
                HasChildProcess = @($processMap.all | Where-Object { [int]$_.ParentProcessId -eq $pidValue }).Count -gt 0
            }
        }

        $nowUtc = [datetime]::UtcNow
        $evaluated = foreach ($observation in $observations) {
            $decision = Test-SwateyeCandidate -Observation $observation -ApprovedExecutablePaths $approvedPaths -NowUtc $nowUtc
            [pscustomobject]@{
                pid = $observation.ProcessId
                eligible = $decision.eligible
                reasons = $decision.reasons
                creation_time_utc = if ($observation.CreationTimeUtc) { ([datetime]$observation.CreationTimeUtc).ToString('o') } else { $null }
                executable_path = $observation.ExecutablePath
            }
        }
        $eligible = @($evaluated | Where-Object { $_.eligible })
        $stopped = New-Object System.Collections.Generic.List[int]
        $revalidationBlockers = New-Object System.Collections.Generic.List[string]

        if ($Execute) {
            foreach ($candidate in $eligible) {
                $freshMap = Get-SwateyeProcessMap
                if (-not $freshMap.by_pid.ContainsKey([int]$candidate.pid)) {
                    $revalidationBlockers.Add(('PID_{0}_DISAPPEARED_BEFORE_STOP' -f $candidate.pid))
                    continue
                }
                $fresh = $freshMap.by_pid[[int]$candidate.pid]
                $freshCreation = ConvertTo-UtcDateTime $fresh.CreationDate
                $freshTcpOwners = Get-SwateyeTcpOwnerSet
                $freshObservation = [pscustomobject]@{
                    Name = [string]$fresh.Name
                    ExecutablePath = [string]$fresh.ExecutablePath
                    CreationTimeUtc = $freshCreation
                    ParentState = if ($null -eq $freshCreation) { 'UNPROVEN' } else { Get-ParentState -Process $fresh -ProcessMap $freshMap -ChildCreationTimeUtc $freshCreation }
                    CpuDeltaMs = 0.0
                    HasTcpConnection = $freshTcpOwners.ContainsKey([int]$candidate.pid)
                    HasChildProcess = @($freshMap.all | Where-Object { [int]$_.ParentProcessId -eq [int]$candidate.pid }).Count -gt 0
                }
                $sameCreation = $freshCreation -and $candidate.creation_time_utc -and $freshCreation.ToString('o') -eq [string]$candidate.creation_time_utc
                $freshDecision = Test-SwateyeCandidate -Observation $freshObservation -ApprovedExecutablePaths $approvedPaths -NowUtc ([datetime]::UtcNow)
                if (-not $sameCreation -or -not $freshDecision.eligible) {
                    $revalidationBlockers.Add(('PID_{0}_REVALIDATION_REFUSED' -f $candidate.pid))
                    continue
                }
                $processHandle = $null
                try {
                    $processHandle = Get-Process -Id ([int]$candidate.pid) -ErrorAction Stop
                    $handleCreation = $processHandle.StartTime.ToUniversalTime().ToString('o')
                    if ($handleCreation -ne [string]$candidate.creation_time_utc) {
                        $revalidationBlockers.Add(('PID_{0}_HANDLE_IDENTITY_REFUSED' -f $candidate.pid))
                        continue
                    }
                    $processHandle.Kill()
                    [void]$processHandle.WaitForExit(5000)
                }
                finally {
                    if ($null -ne $processHandle) { $processHandle.Dispose() }
                }
                if (Get-Process -Id ([int]$candidate.pid) -ErrorAction SilentlyContinue) {
                    $revalidationBlockers.Add(('PID_{0}_STOP_NOT_CONFIRMED' -f $candidate.pid))
                    continue
                }
                $stopped.Add([int]$candidate.pid)
            }
        }

        $skipped = @($evaluated | Where-Object { -not $_.eligible } | ForEach-Object {
            [ordered]@{ pid = $_.pid; reason_codes = @($_.reasons) }
        })
        $status = if ($revalidationBlockers.Count -gt 0) { 'BLOCKER' } elseif ($Execute) { 'COMPLETED' } else { 'INSPECTED' }
        return [ordered]@{
            schema = 'werkles.harvey-swateye-receipt/v1'
            policy_id = $PolicyId
            mode = $mode
            machine = 'Spanzee'
            hostname = $actualHostname
            status = $status
            blockers = @($revalidationBlockers)
            inspected_count = $evaluated.Count
            eligible_count = $eligible.Count
            stopped_count = $stopped.Count
            stopped_pids = @($stopped)
            skipped = $skipped
            minimum_age_minutes = [int]$MinimumAge.TotalMinutes
            blanket_name_kill_used = $false
            secrets_read_or_printed = $false
        }
    }
    catch {
        return [ordered]@{
            schema = 'werkles.harvey-swateye-receipt/v1'
            policy_id = $PolicyId
            mode = $mode
            machine = 'Spanzee'
            hostname = $actualHostname
            status = 'BLOCKER'
            blockers = @('SWATEYE_PROBE_OR_EXECUTION_FAILED')
            error_type = $_.Exception.GetType().FullName
            inspected_count = 0
            eligible_count = 0
            stopped_count = 0
            blanket_name_kill_used = $false
            secrets_read_or_printed = $false
        }
    }
    finally {
        if ($mutexHeld) { $mutex.ReleaseMutex() }
        $mutex.Dispose()
    }
}

$result = if ($SelfTest) { Invoke-SwateyePolicySelfTest } else { Invoke-HarveySwateyeGitLfsRecovery }
$result | ConvertTo-Json -Depth 10
