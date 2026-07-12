param(
    [string]$Nickname = $env:COMPUTERNAME,
    [string]$ProjectRoot = $PSScriptRoot,
    [string]$OutputRoot = (Join-Path $PSScriptRoot 'Receipts')
)

$ErrorActionPreference = 'Continue'

function New-Directory {
    param([Parameter(Mandatory = $true)][string]$Path)
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
}

function Get-Sha256File {
    param([Parameter(Mandatory = $true)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash
}

function Stop-ProcessByIdSafe {
    param(
        [Parameter(Mandatory = $true)][int]$ProcessId,
        [Parameter(Mandatory = $true)][string]$Reason
    )

    try {
        Stop-Process -Id $ProcessId -Force -ErrorAction Stop
        return [pscustomobject]@{
            process_id = $ProcessId
            status = 'STOPPED'
            reason = $Reason
            error = $null
        }
    } catch {
        return [pscustomobject]@{
            process_id = $ProcessId
            status = 'STOP_FAILED'
            reason = $Reason
            error = $_.Exception.Message
        }
    }
}

New-Directory -Path $OutputRoot

$timestamp = Get-Date
$safeNickname = ($Nickname -replace '[^A-Za-z0-9_.-]', '_')
$receiptPath = Join-Path $OutputRoot ("onepassword-cli-prompt-storm-fix-{0}-{1}.json" -f $safeNickname, $timestamp.ToString('yyyyMMdd-HHmmss'))

$receipt = [ordered]@{
    timestamp = $timestamp.ToString('o')
    machine_nickname = $Nickname
    hostname = $env:COMPUTERNAME
    user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    project_root = $ProjectRoot
    mode = 'NO_SECRET_NO_OP_PROMPT_STORM_FIX'
    secret_boundary = 'does not call op; does not read passwords, OTP seeds, passkeys, recovery codes, Secret Keys, notes, banking numbers, card numbers, SSNs, or secret answers'
    status = 'STARTED'
    stopped_op_processes = @()
    stopped_worker_processes = @()
    guard_checks = @()
    harvey_heartbeat = $null
    blockers = @()
}

$opProcesses = @(Get-Process -Name op -ErrorAction SilentlyContinue)
foreach ($process in $opProcesses) {
    $receipt.stopped_op_processes += Stop-ProcessByIdSafe -ProcessId $process.Id -Reason 'op.exe prompt-storm brake'
}

$workerScriptNames = @(
    'Start-Harvey1PasswordWorker.ps1',
    'Invoke-Werkles1PasswordWorker.ps1',
    'Test-1PasswordDamageAudit.ps1',
    'Find-1PasswordPortalItems.ps1',
    'Test-Werkles1PasswordReadiness.ps1'
)

$workerPattern = ($workerScriptNames | ForEach-Object { [regex]::Escape($_) }) -join '|'
$workerProcesses = @(Get-CimInstance Win32_Process | Where-Object {
    $_.ProcessId -ne $PID -and
    $_.Name -match '^(powershell|pwsh)\.exe$' -and
    $_.CommandLine -match $workerPattern
})

foreach ($process in $workerProcesses) {
    $receipt.stopped_worker_processes += Stop-ProcessByIdSafe -ProcessId ([int]$process.ProcessId) -Reason 'known 1Password worker/audit script prompt-storm brake'
}

$guardedScripts = @(
    'Invoke-Werkles1PasswordWorker.ps1',
    'Start-Harvey1PasswordWorker.ps1',
    'Find-1PasswordPortalItems.ps1',
    'Test-Werkles1PasswordReadiness.ps1',
    'Test-1PasswordDamageAudit.ps1'
)

foreach ($scriptName in $guardedScripts) {
    $scriptPath = Join-Path $ProjectRoot $scriptName
    $check = [ordered]@{
        script = $scriptName
        path = $scriptPath
        exists = Test-Path -LiteralPath $scriptPath
        has_block_string = $false
        has_allow_switch = $false
        status = 'UNKNOWN'
    }

    if ($check.exists) {
        $text = Get-Content -Raw -LiteralPath $scriptPath
        $check.has_block_string = ($text -match '1PASSWORD_CLI_BLOCKED_BY_DEFAULT')
        $check.has_allow_switch = ($text -match 'Allow1PasswordCli')
        if ($check.has_block_string -and $check.has_allow_switch) {
            $check.status = 'GUARDED'
        } else {
            $check.status = 'MISSING_GUARD'
            $receipt.blockers += "MISSING_GUARD:$scriptName"
        }
    } else {
        $check.status = 'MISSING_SCRIPT'
        $receipt.blockers += "MISSING_SCRIPT:$scriptName"
    }

    $receipt.guard_checks += [pscustomobject]$check
}

$queueRoot = Join-Path $ProjectRoot '.harvey-1password'
$heartbeatPath = Join-Path $queueRoot 'heartbeat.json'
try {
    New-Directory -Path $queueRoot
    New-Directory -Path (Join-Path $queueRoot 'queue')
    New-Directory -Path (Join-Path $queueRoot 'done')
    New-Directory -Path (Join-Path $queueRoot 'failed')

    $heartbeat = [ordered]@{
        status = 'DISABLED_CLI_BLOCKED_BY_DEFAULT'
        account_uuid = $null
        pid = $PID
        updated_at = (Get-Date).ToString('o')
        queue_count = @(Get-ChildItem -Path (Join-Path $queueRoot 'queue') -Filter '*.json' -File -ErrorAction SilentlyContinue).Count
        secret_boundary = 'prompt-storm fix wrote this heartbeat without calling op'
    }
    $heartbeat | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $heartbeatPath -Encoding UTF8
    $receipt.harvey_heartbeat = [pscustomobject]@{
        path = $heartbeatPath
        status = 'DISABLED_CLI_BLOCKED_BY_DEFAULT'
    }
} catch {
    $receipt.blockers += ("HEARTBEAT_WRITE_FAILED:" + $_.Exception.Message)
}

if (@($receipt.blockers).Count -eq 0) {
    $receipt.status = 'COMPLETE'
} else {
    $receipt.status = 'BLOCKED'
}

$receipt | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
$sha = Get-Sha256File -Path $receiptPath

Write-Output 'ONE_PASSWORD_CLI_PROMPT_STORM_FIX_RESULT'
Write-Output ('machine_nickname: ' + $Nickname)
Write-Output ('hostname: ' + $env:COMPUTERNAME)
Write-Output ('status: ' + $receipt.status)
Write-Output ('op_processes_stopped: ' + @($receipt.stopped_op_processes | Where-Object { $_.status -eq 'STOPPED' }).Count)
Write-Output ('worker_processes_stopped: ' + @($receipt.stopped_worker_processes | Where-Object { $_.status -eq 'STOPPED' }).Count)
Write-Output ('guarded_scripts_status: ' + $(if (@($receipt.guard_checks | Where-Object { $_.status -ne 'GUARDED' }).Count -eq 0) { 'COMPLETE' } else { 'BLOCKED' }))
Write-Output ('receipt: ' + $receiptPath)
Write-Output ('receipt_sha256: ' + $sha)
Write-Output ('blockers: ' + (@($receipt.blockers) -join '; '))

if ($receipt.status -eq 'COMPLETE') { exit 0 }
exit 2
