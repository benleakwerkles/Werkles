[CmdletBinding()]
param(
    [string]$CloudUrl = 'https://werkles.com',
    [string]$LocalCockpitUrl = 'http://127.0.0.1:3000',
    [ValidateRange(1, 30)]
    [int]$PollSeconds = 2,
    [ValidateRange(30, 900)]
    [int]$TaskTimeoutSeconds = 840,
    [switch]$Once
)

$ErrorActionPreference = 'Stop'
$MachineName = 'Doss'
$ExpectedHostname = 'DOSS'
$ActualHostname = [string]$env:COMPUTERNAME
$AgentId = 'handeye-doss-doss'
$BindingId = 'shakespeare-doss'

if (-not $ActualHostname.Equals($ExpectedHostname, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw ('HARVEY_CLOUD_COURIER_HOSTNAME_MISMATCH: expected={0}; actual={1}' -f $ExpectedHostname, $ActualHostname)
}
if ([string]::IsNullOrWhiteSpace($env:HARVEY_AGENT_SECRET)) { throw 'HARVEY_AGENT_SECRET_NOT_AVAILABLE' }
if ([string]::IsNullOrWhiteSpace($env:HARVEY_OPERATOR_TOKEN)) { throw 'HARVEY_OPERATOR_TOKEN_NOT_AVAILABLE' }

$CloudBase = $CloudUrl.TrimEnd('/')
$LocalBase = $LocalCockpitUrl.TrimEnd('/')
$CloudUri = [uri]$CloudBase
$LocalUri = [uri]$LocalBase
$testMode = $env:HARVEY_CLOUD_COURIER_TEST_MODE -eq '1'
if ($testMode) {
    if ($CloudUri.Scheme -ne 'http' -or $CloudUri.Host -ne '127.0.0.1') { throw 'HARVEY_CLOUD_COURIER_TEST_AUDIENCE_INVALID' }
} elseif ($CloudUri.AbsoluteUri.TrimEnd('/') -ne 'https://werkles.com') {
    throw 'HARVEY_CLOUD_COURIER_AUDIENCE_INVALID'
}
if ($LocalUri.Scheme -ne 'http' -or @('127.0.0.1', 'localhost') -notcontains $LocalUri.Host) { throw 'HARVEY_LOCAL_COCKPIT_URL_INVALID' }
$CloudAudience = $CloudUri.GetLeftPart([System.UriPartial]::Authority).TrimEnd('/')

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
    $bodyHash = Get-HarveySha256Hex -Bytes ([System.Text.Encoding]::UTF8.GetBytes($Body))
    $canonical = @($Method.ToUpperInvariant(), $Path, $MachineName, $AgentId, $timestamp, $nonce, $bodyHash, $CloudAudience) -join "`n"
    $hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($env:HARVEY_AGENT_SECRET))
    try { $signature = ([System.BitConverter]::ToString($hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($canonical)))).Replace('-', '').ToLowerInvariant() }
    finally { $hmac.Dispose() }
    return @{
        'x-harvey-machine' = $MachineName
        'x-harvey-agent-id' = $AgentId
        'x-harvey-timestamp' = $timestamp
        'x-harvey-nonce' = $nonce
        'x-harvey-signature' = $signature
        'x-harvey-audience' = $CloudAudience
    }
}

function Invoke-HarveyCloudPost {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)]$BodyObject
    )
    $body = $BodyObject | ConvertTo-Json -Depth 8 -Compress
    $headers = New-HarveySignedHeaders -Method 'POST' -Path $Path -Body $body
    return Invoke-RestMethod -Method Post -Uri ($CloudBase + $Path) -Headers $headers -ContentType 'application/json' -Body $body
}

function Send-HarveyCloudReceipt {
    param(
        [Parameter(Mandatory = $true)]$Delivery,
        [Parameter(Mandatory = $true)][ValidateSet('WORKING', 'REPLIED', 'COMPLETED', 'BLOCKED')][string]$State,
        [Parameter(Mandatory = $true)][string]$Detail,
        [AllowNull()][string]$Reply,
        [hashtable]$Metadata = @{}
    )
    $body = [ordered]@{
        delivery_id = [string]$Delivery.delivery_id
        claim_token = [string]$Delivery.claim_token
        state = $State
        detail = $Detail
        reply = $Reply
        metadata = $Metadata
    }
    Invoke-HarveyCloudPost -Path '/api/harvey/relay/receipt' -BodyObject $body | Out-Null
}

function Invoke-HarveyLocalTask {
    param([Parameter(Mandatory = $true)]$Delivery)

    if ([string]$Delivery.recipient_id -ne $BindingId) { throw ('HARVEY_COURIER_RECIPIENT_NOT_ALLOWLISTED: {0}' -f $Delivery.recipient_id) }
    $taskBody = @(
        'HARVEY PRIVATE COMMAND'
        ('VPG VERB: {0}' -f [string]$Delivery.verb)
        ('TARGET: {0}' -f [string]$Delivery.target)
        ('CLOUD COMMAND ID: {0}' -f [string]$Delivery.command_id)
        ''
        [string]$Delivery.instruction
        ''
        'Reply directly to Ben in plain language. State what you understood, what you verified or did, and the next truthful state. Do not claim RECEIVED, COMPLETED, or BLOCKED without evidence.'
    ) -join "`n"
    if ($taskBody.Length -gt 4096) { throw 'HARVEY_COURIER_TASK_BODY_TOO_LARGE' }

    $submissionId = (Get-HarveySha256Hex -Bytes ([System.Text.Encoding]::UTF8.GetBytes([string]$Delivery.delivery_id))).Substring(0, 32)
    $requestBody = @{ submission_id = $submissionId; binding_id = $BindingId; body = $taskBody } | ConvertTo-Json -Compress
    $headers = @{ authorization = ('Bearer {0}' -f $env:HARVEY_OPERATOR_TOKEN) }
    $accepted = Invoke-RestMethod -Method Post -Uri ($LocalBase + '/api/harvey/task-bridge') -Headers $headers -ContentType 'application/json' -Body $requestBody
    if (-not $accepted.ok -or [string]::IsNullOrWhiteSpace([string]$accepted.dispatch.dispatch_id)) { throw 'HARVEY_LOCAL_TASK_DISPATCH_NOT_ACCEPTED' }
    $dispatchId = [string]$accepted.dispatch.dispatch_id

    Send-HarveyCloudReceipt -Delivery $Delivery -State 'WORKING' -Detail ('Exact Codex task {0} accepted the Doss courier dispatch.' -f [string]$accepted.dispatch.thread_id) -Reply $null -Metadata @{ dispatch_id = $dispatchId; binding_id = $BindingId }

    $deadline = [DateTimeOffset]::UtcNow.AddSeconds($TaskTimeoutSeconds)
    $replyReturned = $false
    while ([DateTimeOffset]::UtcNow -lt $deadline) {
        $projection = Invoke-RestMethod -Method Get -Uri ($LocalBase + '/api/harvey/task-bridge') -Headers $headers
        $dispatch = @($projection.bridge.dispatches | Where-Object { [string]$_.dispatch_id -eq $dispatchId }) | Select-Object -First 1
        if ($null -eq $dispatch) { throw 'HARVEY_LOCAL_TASK_DISPATCH_DISAPPEARED' }

        $reply = if ($null -eq $dispatch.reply) { '' } else { [string]$dispatch.reply }
        if (-not $replyReturned -and -not [string]::IsNullOrWhiteSpace($reply)) {
            # Leave room for the signed receipt envelope inside the 16 KiB
            # Harvey write-body cap; never truncate a model reply silently.
            if ([System.Text.Encoding]::UTF8.GetByteCount($reply) -gt 12000) { throw 'HARVEY_LOCAL_TASK_REPLY_TOO_LARGE' }
            Send-HarveyCloudReceipt -Delivery $Delivery -State 'REPLIED' -Detail 'The exact bound Codex task returned a reply to Harvey.' -Reply $reply -Metadata @{ dispatch_id = $dispatchId; binding_id = $BindingId }
            $replyReturned = $true
        }

        if ([string]$dispatch.state -eq 'COMPLETED') {
            if (-not $replyReturned) { throw 'HARVEY_LOCAL_TASK_COMPLETED_WITHOUT_REPLY' }
            Send-HarveyCloudReceipt -Delivery $Delivery -State 'COMPLETED' -Detail 'The exact bound Codex task completed after returning its reply.' -Reply $null -Metadata @{ dispatch_id = $dispatchId; binding_id = $BindingId }
            return
        }
        if ([string]$dispatch.state -eq 'BLOCKER') {
            throw ('HARVEY_LOCAL_TASK_BLOCKER: {0}' -f [string]$dispatch.error)
        }
        Start-Sleep -Seconds $PollSeconds
    }
    throw 'HARVEY_LOCAL_TASK_TIMEOUT'
}

do {
    $claimResponse = Invoke-HarveyCloudPost -Path '/api/harvey/relay/claim' -BodyObject @{ limit = 1 }
    $deliveries = @($claimResponse.claim.deliveries)
    foreach ($delivery in $deliveries) {
        try { Invoke-HarveyLocalTask -Delivery $delivery }
        catch {
            Send-HarveyCloudReceipt -Delivery $delivery -State 'BLOCKED' -Detail ([string]$_.Exception.Message) -Reply $null -Metadata @{ error_code = 'DOSS_TASK_COURIER_BLOCKED'; binding_id = $BindingId }
        }
    }
    if (-not $Once) { Start-Sleep -Seconds $PollSeconds }
} while (-not $Once)

[pscustomobject]@{
    schema = 'werkles.harvey-cloud-task-courier/v1'
    status = 'POLL_COMPLETE'
    machine = $MachineName
    hostname = $ActualHostname
    receiver_id = $AgentId
    binding_id = $BindingId
    deliveries_claimed = $deliveries.Count
    secrets_printed = $false
} | ConvertTo-Json -Compress
