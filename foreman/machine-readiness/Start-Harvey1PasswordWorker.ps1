param(
    [string]$Account = 'N7N3YHAZQNFY3HT7P4XG45DWIE',
    [string]$QueueRoot = '.\.harvey-1password',
    [string]$OutputRoot = '.\outputs',
    [int]$PollSeconds = 5,
    [int]$KeepAliveSeconds = 0,
    [int]$MaxHours = 12,
    [switch]$Once,
    [switch]$Allow1PasswordCli
)

$ErrorActionPreference = 'Stop'
$script:OnePasswordCliAllowed = $Allow1PasswordCli -or ($env:WERKLES_ALLOW_1PASSWORD_CLI -eq 'YES')

function New-Directory {
    param([Parameter(Mandatory = $true)][string]$Path)
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
}

function Write-JsonFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][object]$Value
    )

    $Value | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $Path -Encoding UTF8
}

function Read-JsonFile {
    param([Parameter(Mandatory = $true)][string]$Path)
    return Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
}

function Get-JobMode {
    param([Parameter(Mandatory = $true)][string]$RequestedMode)

    switch ($RequestedMode) {
        'ReceiptOnly' { return 'ReceiptOnly' }
        'BusinessInventory' { return 'BusinessVaultsAndInventory' }
        'BusinessVaultsAndInventory' { return 'BusinessVaultsAndInventory' }
        'FamilyVaults' { return 'FamilyVaults' }
        'Tier1GitHubItemCheck' { return 'Tier1GitHubItemCheck' }
        default { throw "Unsupported Harvey 1Password job mode: $RequestedMode" }
    }
}

function Invoke-HarveyJob {
    param(
        [Parameter(Mandatory = $true)][string]$JobPath
    )

    $job = Read-JsonFile -Path $JobPath
    $jobId = if ($job.id) { [string]$job.id } else { [IO.Path]::GetFileNameWithoutExtension($JobPath) }
    $mode = Get-JobMode -RequestedMode ([string]$job.mode)
    $jobAccount = if ($job.account) { [string]$job.account } else { $Account }
    $safeName = $jobId -replace '[^A-Za-z0-9_.-]', '_'
    $receiptPath = Join-Path $OutputRoot "$safeName.receipt.json"
    $summaryPath = Join-Path $DoneDir "$safeName.summary.json"

    $started = Get-Date
    $summary = [ordered]@{
        id = $jobId
        requested_mode = $job.mode
        worker_mode = $mode
        account_uuid = $jobAccount
        status = 'STARTED'
        secret_boundary = 'metadata-only worker; no passwords, OTP seeds, passkeys, recovery codes, Secret Keys, or notes'
        started_at = $started.ToString('o')
        completed_at = $null
        receipt_path = $receiptPath
        error = $null
    }
    Write-JsonFile -Path $summaryPath -Value $summary

    try {
        & (Join-Path $PSScriptRoot 'Invoke-Werkles1PasswordWorker.ps1') `
            -Mode $mode `
            -Account $jobAccount `
            -OutputPath $receiptPath `
            -Allow1PasswordCli

        if ($LASTEXITCODE -ne 0) {
            throw "Invoke-Werkles1PasswordWorker.ps1 exited with code $LASTEXITCODE"
        }

        $summary.status = 'COMPLETE'
    } catch {
        $summary.status = 'FAILED'
        $summary.error = $_.Exception.Message
    } finally {
        $summary.completed_at = (Get-Date).ToString('o')
        Write-JsonFile -Path $summaryPath -Value $summary
    }

    if ($summary.status -eq 'COMPLETE') {
        Move-Item -LiteralPath $JobPath -Destination (Join-Path $DoneDir ([IO.Path]::GetFileName($JobPath))) -Force
    } else {
        Move-Item -LiteralPath $JobPath -Destination (Join-Path $FailedDir ([IO.Path]::GetFileName($JobPath))) -Force
    }
}

$QueueRoot = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($QueueRoot)
$OutputRoot = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputRoot)
$InboxDir = Join-Path $QueueRoot 'queue'
$DoneDir = Join-Path $QueueRoot 'done'
$FailedDir = Join-Path $QueueRoot 'failed'
$HeartbeatPath = Join-Path $QueueRoot 'heartbeat.json'

New-Directory -Path $QueueRoot
New-Directory -Path $OutputRoot
New-Directory -Path $InboxDir
New-Directory -Path $DoneDir
New-Directory -Path $FailedDir

if (-not $script:OnePasswordCliAllowed) {
    Write-JsonFile -Path $HeartbeatPath -Value ([ordered]@{
        status = 'DISABLED_CLI_BLOCKED_BY_DEFAULT'
        account_uuid = $Account
        pid = $PID
        updated_at = (Get-Date).ToString('o')
        queue_count = @(Get-ChildItem -Path $InboxDir -Filter '*.json' -File -ErrorAction SilentlyContinue).Count
        secret_boundary = 'no op calls made; launch with -Allow1PasswordCli or WERKLES_ALLOW_1PASSWORD_CLI=YES for one deliberate worker session'
    })
    Write-Output '1PASSWORD_CLI_BLOCKED_BY_DEFAULT: worker refused to start without explicit -Allow1PasswordCli or WERKLES_ALLOW_1PASSWORD_CLI=YES.'
    exit 3
}

$startedAt = Get-Date
$lastKeepAlive = [datetime]::MinValue
$stopAt = $startedAt.AddHours($MaxHours)

while ($true) {
    $now = Get-Date
    Write-JsonFile -Path $HeartbeatPath -Value ([ordered]@{
        status = 'RUNNING'
        account_uuid = $Account
        pid = $PID
        started_at = $startedAt.ToString('o')
        updated_at = $now.ToString('o')
        queue_count = @(Get-ChildItem -Path $InboxDir -Filter '*.json' -File -ErrorAction SilentlyContinue).Count
        keepalive_seconds = $KeepAliveSeconds
        keepalive_enabled = ($KeepAliveSeconds -gt 0)
        max_hours = $MaxHours
        secret_boundary = 'does not store or enter Windows Hello PIN; relies on one user-approved 1Password CLI session'
    })

    $jobFile = Get-ChildItem -Path $InboxDir -Filter '*.json' -File -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime |
        Select-Object -First 1

    if ($jobFile) {
        Invoke-HarveyJob -JobPath $jobFile.FullName
    } elseif ($Once) {
        break
    }

    if ($KeepAliveSeconds -gt 0 -and ($now - $lastKeepAlive).TotalSeconds -ge $KeepAliveSeconds) {
        try {
            & op whoami --account $Account --format json *> $null
            $lastKeepAlive = $now
        } catch {
            $lastKeepAlive = $now
        }
    }

    if ((Get-Date) -ge $stopAt) {
        break
    }

    Start-Sleep -Seconds $PollSeconds
}

Write-JsonFile -Path $HeartbeatPath -Value ([ordered]@{
    status = 'STOPPED'
    account_uuid = $Account
    pid = $PID
    started_at = $startedAt.ToString('o')
    stopped_at = (Get-Date).ToString('o')
    secret_boundary = 'does not store or enter Windows Hello PIN'
})
