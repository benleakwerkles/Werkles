[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Doss', 'Betsy', 'Spanzee', 'Medullina', 'Sally')]
    [string]$MachineName,

    [string]$CockpitUrl = 'http://10.1.10.8:3000',

    [ValidateRange(5, 300)]
    [int]$PollSeconds = 15,

    [switch]$Once
)

$ErrorActionPreference = 'Stop'
$AgentVersion = '0.2.0'
$CanonicalMachineNames = @{
    doss = 'Doss'
    betsy = 'Betsy'
    spanzee = 'Spanzee'
    medullina = 'Medullina'
    sally = 'Sally'
}
$MachineName = $CanonicalMachineNames[$MachineName.ToLowerInvariant()]
$ActualHostname = $env:COMPUTERNAME
$AgentId = ('handeye-{0}-{1}' -f $MachineName.ToLowerInvariant(), $ActualHostname.ToLowerInvariant())
$CanonicalHostnames = @{
    Doss = 'DOSS'
    Betsy = 'BETSY'
    Spanzee = 'SPANZEE'
    Medullina = 'COURTNEY'
    Sally = 'SALLY'
}
$ExpectedHostname = $CanonicalHostnames[$MachineName]

if ([string]::IsNullOrWhiteSpace($ActualHostname)) {
    throw 'HOSTNAME_NOT_AVAILABLE'
}

if (-not $ActualHostname.Equals($ExpectedHostname, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw ('HOSTNAME_MISMATCH: machine={0}; expected={1}; actual={2}' -f $MachineName, $ExpectedHostname, $ActualHostname)
}

if ([string]::IsNullOrWhiteSpace($env:HARVEY_AGENT_SECRET)) {
    throw 'HARVEY_AGENT_SECRET_NOT_AVAILABLE'
}

function Get-HarveySha256Hex {
    param([Parameter(Mandatory = $true)][byte[]]$Bytes)

    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { return ([System.BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}

function New-HarveySignedHeaders {
    param(
        [Parameter(Mandatory = $true)][string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][AllowEmptyString()][string]$Body
    )

    $timestamp = [System.DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString([System.Globalization.CultureInfo]::InvariantCulture)
    $nonce = [guid]::NewGuid().ToString('N').ToLowerInvariant()
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
    $bodyHash = Get-HarveySha256Hex -Bytes $bodyBytes
    $canonical = @($Method.ToUpperInvariant(), $Path, $MachineName, $AgentId, $timestamp, $nonce, $bodyHash) -join "`n"
    $hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($env:HARVEY_AGENT_SECRET))
    try {
        $signature = ([System.BitConverter]::ToString($hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($canonical)))).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $hmac.Dispose()
    }
    return @{
        'x-harvey-machine' = $MachineName
        'x-harvey-agent-id' = $AgentId
        'x-harvey-timestamp' = $timestamp
        'x-harvey-nonce' = $nonce
        'x-harvey-signature' = $signature
    }
}

$BaseUrl = $CockpitUrl.TrimEnd('/')

function Send-HarveyHeartbeat {
    $body = @{
        machine = $MachineName
        hostname = $ActualHostname
        agent_id = $AgentId
        agent_version = $AgentVersion
        capabilities = @('HEARTBEAT', 'PING', 'OPEN_URL', 'KNOCK', 'KNOCK_COCKPIT_V1')
    } | ConvertTo-Json -Depth 4

    $path = '/api/harvey/machines'
    $headers = New-HarveySignedHeaders -Method 'POST' -Path $path -Body $body
    Invoke-RestMethod -Method Post -Uri ($BaseUrl + $path) -Headers $headers -ContentType 'application/json' -Body $body | Out-Null
}

function Update-HarveyCommand {
    param(
        [Parameter(Mandatory = $true)][string]$CommandId,
        [Parameter(Mandatory = $true)][ValidateSet('RECEIVED', 'COMPLETED', 'BLOCKER')][string]$Status,
        [Parameter(Mandatory = $true)][string]$Evidence,
        [string]$ClaimId,
        [switch]$ReclaimExpired
    )

    $body = @{
        command_id = $CommandId
        status = $Status
        evidence = $Evidence
    } | ConvertTo-Json -Depth 4

    $bodyObject = @{
        command_id = $CommandId
        status = $Status
        evidence = $Evidence
    }
    if (-not [string]::IsNullOrWhiteSpace($ClaimId)) { $bodyObject.claim_id = $ClaimId }
    if ($ReclaimExpired) { $bodyObject.reclaim_expired = $true }
    $body = $bodyObject | ConvertTo-Json -Depth 4

    $path = '/api/harvey/commands'
    $headers = New-HarveySignedHeaders -Method 'PATCH' -Path $path -Body $body
    return Invoke-RestMethod -Method Patch -Uri ($BaseUrl + $path) -Headers $headers -ContentType 'application/json' -Body $body
}

function Test-HarveyClaimConflict {
    param([Parameter(Mandatory = $true)]$ErrorRecord)
    $statusCode = 0
    try { $statusCode = [int]$ErrorRecord.Exception.Response.StatusCode } catch {}
    # A 409 from the signed RECEIVED claim call means another poller already
    # owns or completed that exact command. It is a normal exactly-once skip.
    return $statusCode -eq 409
}

function Invoke-HarveyCommand {
    param([Parameter(Mandatory = $true)]$Command)

    try {
        $claimResponse = Update-HarveyCommand -CommandId $Command.command_id -Status 'RECEIVED' -Evidence ('Handeye accepted command on {0}' -f $ActualHostname) -ReclaimExpired:([bool]$Command.claim_reclaimable)
    }
    catch {
        if (Test-HarveyClaimConflict -ErrorRecord $_) { return 'SKIPPED_CLAIM_CONFLICT' }
        throw
    }
    $ClaimId = [string]$claimResponse.command.claim.claim_id
    if ([string]::IsNullOrWhiteSpace($ClaimId)) { throw 'COMMAND_CLAIM_ID_NOT_RETURNED' }

    try {
        switch ($Command.action) {
            'PING' {
                Update-HarveyCommand -CommandId $Command.command_id -Status 'COMPLETED' -ClaimId $ClaimId -Evidence ('Ping answered by {0}' -f $ActualHostname) | Out-Null
            }
            'KNOCK' {
                if ([string]::IsNullOrWhiteSpace($env:HARVEY_COCKPIT_MANIFEST_SHA256)) {
                    throw 'HARVEY_COCKPIT_MANIFEST_SHA256_NOT_AVAILABLE'
                }
                $knock = Invoke-RestMethod -Method Get -Uri ($BaseUrl + '/api/harvey/knock?machine=' + [uri]::EscapeDataString($MachineName))
                if (-not $knock.ok -or [int]$knock.count -lt 1) {
                    throw 'NO_ADDRESSED_KNOCK_PACKETS'
                }
                $wrongTarget = @($knock.packets | Where-Object { $_.target_machine -ne $MachineName })
                if ($wrongTarget.Count -gt 0) {
                    throw 'KNOCK_TARGET_MISMATCH'
                }
                if (-not $knock.current_cockpit -or [string]::IsNullOrWhiteSpace([string]$knock.current_cockpit.packet_id)) {
                    throw 'CURRENT_COCKPIT_NOT_RETURNED'
                }
                $manifestEnvelope = $knock.current_cockpit.manifest
                if (-not $manifestEnvelope -or [string]$manifestEnvelope.encoding -ne 'base64' -or [string]::IsNullOrWhiteSpace([string]$manifestEnvelope.content_base64)) {
                    throw 'CURRENT_COCKPIT_MANIFEST_INVALID'
                }
                $manifestBytes = [System.Convert]::FromBase64String([string]$manifestEnvelope.content_base64)
                $manifestHash = Get-HarveySha256Hex -Bytes $manifestBytes
                if (-not $manifestHash.Equals([string]$manifestEnvelope.sha256, [System.StringComparison]::OrdinalIgnoreCase) -or
                    -not $manifestHash.Equals($env:HARVEY_COCKPIT_MANIFEST_SHA256, [System.StringComparison]::OrdinalIgnoreCase)) {
                    throw 'CURRENT_COCKPIT_MANIFEST_HASH_MISMATCH'
                }
                $manifest = [System.Text.Encoding]::UTF8.GetString($manifestBytes) | ConvertFrom-Json
                if ([string]$manifest.packet_id -ne [string]$knock.current_cockpit.packet_id) {
                    throw 'CURRENT_COCKPIT_MANIFEST_PACKET_MISMATCH'
                }
                $artifacts = @($knock.current_cockpit.artifacts)
                $manifestArtifacts = @($manifest.artifacts)
                if ($artifacts.Count -lt 1 -or $artifacts.Count -ne $manifestArtifacts.Count) {
                    throw 'CURRENT_COCKPIT_ARTIFACTS_EMPTY'
                }
                foreach ($artifact in $artifacts) {
                    if ([string]::IsNullOrWhiteSpace([string]$artifact.path) -or
                        [string]::IsNullOrWhiteSpace([string]$artifact.sha256) -or
                        [string]$artifact.encoding -ne 'base64' -or
                        [string]::IsNullOrWhiteSpace([string]$artifact.content_base64)) {
                        throw 'CURRENT_COCKPIT_ARTIFACT_INVALID'
                    }
                    $artifactBytes = [System.Convert]::FromBase64String([string]$artifact.content_base64)
                    $actualHash = Get-HarveySha256Hex -Bytes $artifactBytes
                    $manifestEntry = @($manifestArtifacts | Where-Object { [string]$_.path -eq [string]$artifact.path })
                    if ($manifestEntry.Count -ne 1 -or
                        -not $actualHash.Equals([string]$artifact.sha256, [System.StringComparison]::OrdinalIgnoreCase) -or
                        -not $actualHash.Equals([string]$manifestEntry[0].sha256, [System.StringComparison]::OrdinalIgnoreCase) -or
                        [int64]$artifactBytes.Length -ne [int64]$manifestEntry[0].bytes) {
                        throw ('CURRENT_COCKPIT_HASH_MISMATCH: {0}' -f $artifact.path)
                    }
                }
                Update-HarveyCommand -CommandId $Command.command_id -Status 'COMPLETED' -ClaimId $ClaimId -Evidence ('Retrieved {0} addressed KNOCK packets and verified cockpit {1} with {2} artifacts on {3}' -f $knock.count, $knock.current_cockpit.packet_id, $artifacts.Count, $ActualHostname) | Out-Null
            }
            'OPEN_URL' {
                $url = [uri]$Command.payload.url
                $allowedHosts = @('10.1.10.8:3000', '127.0.0.1:3000', 'localhost:3000')
                if ($url.Scheme -ne 'http' -or $allowedHosts -notcontains $url.Authority -or $url.AbsolutePath -ne '/harvey') {
                    throw ('URL_NOT_ALLOWLISTED: {0}' -f $url.AbsoluteUri)
                }
                Start-Process -FilePath $url.AbsoluteUri
                Update-HarveyCommand -CommandId $Command.command_id -Status 'COMPLETED' -ClaimId $ClaimId -Evidence ('Opened {0} on {1}' -f $url.AbsoluteUri, $ActualHostname) | Out-Null
            }
            default {
                throw ('ACTION_NOT_ALLOWLISTED: {0}' -f $Command.action)
            }
        }
    }
    catch {
        Update-HarveyCommand -CommandId $Command.command_id -Status 'BLOCKER' -ClaimId $ClaimId -Evidence $_.Exception.Message | Out-Null
    }
    return 'EXECUTED'
}

$claimedCount = 0
$skippedCount = 0
$executedCount = 0
do {
    Send-HarveyHeartbeat
    $response = Invoke-RestMethod -Method Get -Uri ($BaseUrl + '/api/harvey/commands?machine=' + [uri]::EscapeDataString($MachineName))
    $queued = @($response.commands | Where-Object { $_.status -eq 'QUEUED' -or ($_.status -eq 'RECEIVED' -and $_.claim_reclaimable) } | Sort-Object created_at)
    foreach ($command in $queued) {
        $result = Invoke-HarveyCommand -Command $command
        if ($result -eq 'SKIPPED_CLAIM_CONFLICT') { $skippedCount += 1 }
        if ($result -eq 'EXECUTED') { $claimedCount += 1; $executedCount += 1 }
    }

    if (-not $Once) {
        Start-Sleep -Seconds $PollSeconds
    }
} while (-not $Once)

[pscustomobject]@{
    status = 'HANDYEYE_CYCLE_COMPLETE'
    machine = $MachineName
    hostname = $ActualHostname
    agent_id = $AgentId
    cockpit = $BaseUrl
    claimed = $claimedCount
    skipped = $skippedCount
    executed = $executedCount
} | ConvertTo-Json -Depth 5
