[CmdletBinding()]
param(
    [string]$RepoPath,
    [ValidateRange(3000, 3099)][int]$WebPort = 3000,
    [ValidateRange(3002, 3099)][int]$BridgePort = 3002,
    [ValidateRange(5, 60)][int]$PollSeconds = 5,
    [switch]$CloudTaskCourier,
    [string]$CloudUrl = 'https://werkles.com'
)

$ErrorActionPreference = 'Stop'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $RepoPath) { $RepoPath = (Resolve-Path (Join-Path $scriptRoot '..\..')).Path }
$repo = (Resolve-Path -LiteralPath $RepoPath).Path
if (-not $env:COMPUTERNAME.Equals('DOSS', [System.StringComparison]::OrdinalIgnoreCase)) { throw 'HARVEY_DOSS_HOST_REQUIRED' }

$guardOutput = & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $repo 'scripts\foreman\Test-HarveyStationBinding.ps1') -Operation Inspect -RepoPath $repo
if ($LASTEXITCODE -ne 0) { throw 'HARVEY_STATION_BINDING_FAILED' }
$guard = ($guardOutput -join "`n") | ConvertFrom-Json
if (-not $guard.pass) { throw 'HARVEY_STATION_BINDING_FAILED' }
if ([int]$guard.dirty_entries -gt 0 -or [int]$guard.staged_entries -gt 0) { throw 'HARVEY_RUNTIME_REQUIRES_CLEAN_PROVIDER_BOUND_CHECKOUT' }

function New-HarveyEphemeralSecret {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
}

function Stop-VerifiedHarveyWebTree {
    param([int]$Port)
    $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $listener) { return }
    $ids = [System.Collections.Generic.List[int]]::new()
    $current = [int]$listener.OwningProcess
    for ($depth = 0; $depth -lt 5 -and $current -gt 0; $depth++) {
        $process = Get-CimInstance Win32_Process -Filter ("ProcessId={0}" -f $current) -ErrorAction SilentlyContinue
        if (-not $process) { break }
        $commandLine = [string]$process.CommandLine
        $isHarveyWeb = $commandLine -like ('*' + $repo + '*') -and ($commandLine -match 'next|start-server|npm-cli')
        $isNextCmd = $commandLine -match 'cmd\.exe.*next dev'
        if (-not $isHarveyWeb -and -not $isNextCmd) { break }
        [void]$ids.Add([int]$process.ProcessId)
        $current = [int]$process.ParentProcessId
    }
    if ($ids.Count -lt 1) { throw 'WEB_PORT_OWNERSHIP_UNPROVEN' }
    foreach ($processId in $ids) { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue }
    $deadline = (Get-Date).AddSeconds(10)
    while ((Get-Date) -lt $deadline -and (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)) { Start-Sleep -Milliseconds 200 }
    if (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue) { throw 'HARVEY_WEB_PORT_DID_NOT_STOP' }
}

if (Get-NetTCPConnection -State Listen -LocalPort $BridgePort -ErrorAction SilentlyContinue) {
    $bridgeHealth = $false
    try { $bridgeHealth = (Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/health" -f $BridgePort) -TimeoutSec 2).StatusCode -eq 200 } catch {}
    if (-not $bridgeHealth) { throw 'HARVEY_BRIDGE_PORT_IN_USE_BY_UNKNOWN_PROCESS' }
    $bridgeListener = Get-NetTCPConnection -State Listen -LocalPort $BridgePort | Select-Object -First 1
    Stop-Process -Id $bridgeListener.OwningProcess -Force
}

Stop-VerifiedHarveyWebTree -Port $WebPort

$operatorToken = New-HarveyEphemeralSecret
$dossAgentSecret = if ($CloudTaskCourier) { [string]$env:HARVEY_CLOUD_DOSS_SECRET } else { New-HarveyEphemeralSecret }
if ($CloudTaskCourier -and [string]::IsNullOrWhiteSpace($dossAgentSecret)) { throw 'HARVEY_CLOUD_DOSS_SECRET_NOT_AVAILABLE' }
$agentSecrets = @{}
if (-not [string]::IsNullOrWhiteSpace($env:HARVEY_AGENT_SECRETS_JSON)) {
    try {
        $existingSecrets = $env:HARVEY_AGENT_SECRETS_JSON | ConvertFrom-Json
        foreach ($machine in @('Doss','Betsy','Spanzee','Medullina','Sally')) {
            $property = $existingSecrets.PSObject.Properties[$machine]
            if ($property -and $property.Value -is [string] -and -not [string]::IsNullOrWhiteSpace([string]$property.Value)) {
                $agentSecrets[$machine] = [string]$property.Value
            }
        }
    } catch {
        throw 'HARVEY_EXISTING_AGENT_SECRET_REGISTRY_INVALID'
    }
}
$agentSecrets['Doss'] = $dossAgentSecret
$manifestHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $repo 'foreman\harvey\HARVEY_COCKPIT_ARTIFACT_MANIFEST_20260713.json')).Hash.ToLowerInvariant()
$runtimeRoot = Join-Path ([System.IO.Path]::GetTempPath()) 'Werkles-Harvey-Live'
if (-not (Test-Path -LiteralPath $runtimeRoot)) { New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$webOut = Join-Path $runtimeRoot ("web-{0}.out.log" -f $stamp)
$webErr = Join-Path $runtimeRoot ("web-{0}.err.log" -f $stamp)
$bridgeOut = Join-Path $runtimeRoot ("bridge-{0}.out.log" -f $stamp)
$bridgeErr = Join-Path $runtimeRoot ("bridge-{0}.err.log" -f $stamp)
$handeyeOut = Join-Path $runtimeRoot ("handeye-{0}.out.log" -f $stamp)
$handeyeErr = Join-Path $runtimeRoot ("handeye-{0}.err.log" -f $stamp)
$courierOut = Join-Path $runtimeRoot ("cloud-courier-{0}.out.log" -f $stamp)
$courierErr = Join-Path $runtimeRoot ("cloud-courier-{0}.err.log" -f $stamp)

$env:HARVEY_OPERATOR_TOKEN = $operatorToken
$env:HARVEY_AGENT_SECRETS_JSON = ($agentSecrets | ConvertTo-Json -Compress)
$env:HARVEY_WITNESS_EVIDENCE_SCOPE = 'LIVE_CONTROL_PLANE'
$env:HARVEY_COCKPIT_URL = ("http://127.0.0.1:{0}" -f $WebPort)
$env:HARVEY_OPERATOR_BRIDGE_PORT = [string]$BridgePort
$web = Start-Process -FilePath 'C:\Program Files\nodejs\npm.cmd' -ArgumentList @('run','dev','--','--hostname','127.0.0.1','-p',[string]$WebPort) -WorkingDirectory $repo -RedirectStandardOutput $webOut -RedirectStandardError $webErr -WindowStyle Hidden -PassThru
$bridge = Start-Process -FilePath 'C:\Program Files\nodejs\node.exe' -ArgumentList @((Join-Path $repo 'scripts\foreman\harvey-operator-bridge.mjs')) -WorkingDirectory $repo -RedirectStandardOutput $bridgeOut -RedirectStandardError $bridgeErr -WindowStyle Hidden -PassThru

$webReady = $false
$bridgeReady = $false
for ($attempt = 0; $attempt -lt 60; $attempt++) {
    try { $webReady = (Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/harvey" -f $WebPort) -TimeoutSec 2).StatusCode -eq 200 } catch {}
    try { $bridgeReady = (Invoke-WebRequest -UseBasicParsing -Uri ("http://127.0.0.1:{0}/health" -f $BridgePort) -TimeoutSec 2).StatusCode -eq 200 } catch {}
    if ($webReady -and $bridgeReady) { break }
    Start-Sleep -Milliseconds 500
}
if (-not $webReady -or -not $bridgeReady) {
    Stop-Process -Id $web.Id,$bridge.Id -Force -ErrorAction SilentlyContinue
    throw 'HARVEY_LOCAL_CONTROL_PLANE_START_FAILED'
}

$env:HARVEY_AGENT_SECRET = $dossAgentSecret
$env:HARVEY_COCKPIT_MANIFEST_SHA256 = $manifestHash
$handeye = Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',(Join-Path $repo 'scripts\foreman\Invoke-HarveyHandeye.ps1'),'-MachineName','Doss','-CockpitUrl',("http://127.0.0.1:{0}" -f $WebPort),'-PollSeconds',[string]$PollSeconds) -WorkingDirectory $repo -RedirectStandardOutput $handeyeOut -RedirectStandardError $handeyeErr -WindowStyle Hidden -PassThru

$handeyeReady = $false
for ($attempt = 0; $attempt -lt 30; $attempt++) {
    try {
        $machines = Invoke-RestMethod -Method Get -Uri ("http://127.0.0.1:{0}/api/harvey/machines" -f $WebPort) -TimeoutSec 2
        $doss = @($machines.machines | Where-Object { $_.machine -eq 'Doss' }) | Select-Object -First 1
        $handeyeReady = $doss.live -eq $true -and $doss.hostname -eq 'DOSS'
    } catch {}
    if ($handeyeReady) { break }
    Start-Sleep -Milliseconds 500
}
if (-not $handeyeReady) {
    Stop-Process -Id $handeye.Id,$bridge.Id,$web.Id -Force -ErrorAction SilentlyContinue
    throw 'HARVEY_DOSS_HANDEYE_START_FAILED'
}

$courier = $null
if ($CloudTaskCourier) {
    $courier = Start-Process -FilePath 'powershell.exe' -ArgumentList @(
        '-NoProfile','-ExecutionPolicy','Bypass','-File',(Join-Path $repo 'scripts\foreman\Invoke-HarveyCloudTaskCourier.ps1'),
        '-CloudUrl',$CloudUrl,
        '-LocalCockpitUrl',("http://127.0.0.1:{0}" -f $WebPort),
        '-PollSeconds',[string]([Math]::Max(1, [Math]::Min(30, $PollSeconds)))
    ) -WorkingDirectory $repo -RedirectStandardOutput $courierOut -RedirectStandardError $courierErr -WindowStyle Hidden -PassThru
    Start-Sleep -Milliseconds 750
    if ($courier.HasExited) {
        Stop-Process -Id $handeye.Id,$bridge.Id,$web.Id -Force -ErrorAction SilentlyContinue
        throw 'HARVEY_DOSS_CLOUD_TASK_COURIER_START_FAILED'
    }
}

$webListener = Get-NetTCPConnection -State Listen -LocalPort $WebPort | Select-Object -First 1
$bridgeListener = Get-NetTCPConnection -State Listen -LocalPort $BridgePort | Select-Object -First 1
[pscustomobject]@{
    schema = 'werkles.harvey-local-control-plane/v1'
    status = 'READY'
    execution_context = 'CODEX_LOCAL'
    machine = 'Doss'
    hostname = $env:COMPUTERNAME
    repo = $repo
    branch = (& git -C $repo branch --show-current).Trim()
    head = (& git -C $repo rev-parse HEAD).Trim()
    web_url = ("http://127.0.0.1:{0}/harvey" -f $WebPort)
    web_bind_address = '127.0.0.1'
    lan_url = $null
    operator_bridge = ("http://127.0.0.1:{0}" -f $BridgePort)
    web_listener_pid = $webListener.OwningProcess
    bridge_listener_pid = $bridgeListener.OwningProcess
    handeye_pid = $handeye.Id
    cloud_task_courier_pid = if ($courier) { $courier.Id } else { $null }
    cloud_task_courier_enabled = [bool]$CloudTaskCourier
    secrets_printed_or_stored = $false
    web_log = $webOut
    bridge_log = $bridgeOut
    handeye_log = $handeyeOut
    cloud_task_courier_log = if ($courier) { $courierOut } else { $null }
} | ConvertTo-Json -Depth 5
