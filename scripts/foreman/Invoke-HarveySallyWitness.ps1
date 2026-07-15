[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^sally_[a-f0-9]{32}$')]
    [string]$ChallengeId,

    [string]$CockpitUrl = 'http://10.1.10.8:3000'
)

$ErrorActionPreference = 'Stop'
$MachineName = 'Sally'
$ExpectedHostname = 'SALLY'
$ActualHostname = [Environment]::MachineName
$AgentId = 'handeye-sally-sally'

if (-not $ActualHostname.Equals($ExpectedHostname, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw ('HOSTNAME_MISMATCH: expected={0}; actual={1}' -f $ExpectedHostname, $ActualHostname)
}

function Get-Sha256Hex {
    param([Parameter(Mandatory = $true)][byte[]]$Bytes)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try { return ([System.BitConverter]::ToString($sha.ComputeHash($Bytes))).Replace('-', '').ToLowerInvariant() }
    finally { $sha.Dispose() }
}

function ConvertTo-Base64Url {
    param([Parameter(Mandatory = $true)][byte[]]$Bytes)
    return [Convert]::ToBase64String($Bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function New-SignedHeaders {
    param([string]$Method, [string]$Path, [string]$Body)
    $timestamp = [System.DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString([System.Globalization.CultureInfo]::InvariantCulture)
    $nonce = [guid]::NewGuid().ToString('N').ToLowerInvariant()
    $bodyHash = Get-Sha256Hex -Bytes ([System.Text.Encoding]::UTF8.GetBytes($Body))
    $canonical = @($Method.ToUpperInvariant(), $Path, $MachineName, $AgentId, $timestamp, $nonce, $bodyHash) -join "`n"
    $hmac = [System.Security.Cryptography.HMACSHA256]::new([System.Text.Encoding]::UTF8.GetBytes($env:HARVEY_AGENT_SECRET))
    try { $signature = ([System.BitConverter]::ToString($hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($canonical)))).Replace('-', '').ToLowerInvariant() }
    finally { $hmac.Dispose() }
    return @{
        'x-harvey-machine' = $MachineName
        'x-harvey-agent-id' = $AgentId
        'x-harvey-timestamp' = $timestamp
        'x-harvey-nonce' = $nonce
        'x-harvey-signature' = $signature
    }
}

$base = $CockpitUrl.TrimEnd('/')
$capabilityBytes = [byte[]]::new(32)
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
try { $rng.GetBytes($capabilityBytes) }
finally { $rng.Dispose() }
$capability = ([System.BitConverter]::ToString($capabilityBytes)).Replace('-', '').ToLowerInvariant()
$capabilityHash = Get-Sha256Hex -Bytes ([System.Text.Encoding]::UTF8.GetBytes($capability))
$ready = $null
$proofKind = $null
$pairingRequestId = $null

if (-not [string]::IsNullOrWhiteSpace($env:HARVEY_AGENT_SECRET)) {
    for ($attempt = 1; $attempt -le 4; $attempt++) {
        $snapshot = Invoke-RestMethod -Method Get -Uri ($base + '/api/harvey/snapshot')
        $body = @{
            phase = 'HOST_READY'
            challenge_id = $ChallengeId
            initial_revision = [string]$snapshot.revision
            capability_sha256 = $capabilityHash
        } | ConvertTo-Json -Compress
        $headers = New-SignedHeaders -Method 'POST' -Path '/api/harvey/witness' -Body $body
        try {
            $ready = Invoke-RestMethod -Method Post -Uri ($base + '/api/harvey/witness') -Headers $headers -ContentType 'application/json' -Body $body
            break
        } catch {
            if ($attempt -eq 4) { throw }
            Start-Sleep -Milliseconds (150 * $attempt)
        }
    }
    $proofKind = 'SIGNED_LOCAL_SHELL_HOSTNAME'
} else {
    $csp = New-Object System.Security.Cryptography.CspParameters
    $csp.Flags = [System.Security.Cryptography.CspProviderFlags]::CreateEphemeralKey
    $rsa = New-Object System.Security.Cryptography.RSACryptoServiceProvider 2048, $csp
    $rsa.PersistKeyInCsp = $false
    try {
        $public = $rsa.ExportParameters($false)
        $publicJwk = @{
            kty = 'RSA'
            n = ConvertTo-Base64Url -Bytes $public.Modulus
            e = ConvertTo-Base64Url -Bytes $public.Exponent
        }
        $publicKeyFingerprint = Get-Sha256Hex -Bytes ([System.Text.Encoding]::UTF8.GetBytes(@('RSA', $publicJwk.n, $publicJwk.e) -join "`n"))
        $pairingCodeSource = Get-Sha256Hex -Bytes ([System.Text.Encoding]::UTF8.GetBytes(@('werkles.harvey-sally-pairing/v1', $ChallengeId, $publicKeyFingerprint, $capabilityHash) -join "`n"))
        $expectedPairingCode = ('{0}-{1}-{2}' -f $pairingCodeSource.Substring(0, 4), $pairingCodeSource.Substring(4, 4), $pairingCodeSource.Substring(8, 4)).ToUpperInvariant()
        $pairing = $null
        for ($attempt = 1; $attempt -le 4; $attempt++) {
            $snapshot = Invoke-RestMethod -Method Get -Uri ($base + '/api/harvey/snapshot')
            $body = @{
                phase = 'PAIRING_REQUEST'
                challenge_id = $ChallengeId
                machine = $MachineName
                hostname = $ExpectedHostname
                agent_id = $AgentId
                initial_revision = [string]$snapshot.revision
                capability_sha256 = $capabilityHash
                public_key_jwk = $publicJwk
            } | ConvertTo-Json -Compress
            try {
                $pairing = Invoke-RestMethod -Method Post -Uri ($base + '/api/harvey/witness') -ContentType 'application/json' -Body $body
                break
            } catch {
                if ($attempt -eq 4) { throw }
                Start-Sleep -Milliseconds (150 * $attempt)
            }
        }
        if (-not $pairing) { throw 'SALLY_PAIRING_REQUEST_FAILED' }
        $pairingRequestId = [string]$pairing.pairing.request_id
        if (-not $publicKeyFingerprint.Equals([string]$pairing.pairing.public_key_sha256, [System.StringComparison]::Ordinal)) { throw 'SALLY_PAIRING_PUBLIC_KEY_FINGERPRINT_MISMATCH' }
        if (-not $expectedPairingCode.Equals([string]$pairing.pairing.pairing_code, [System.StringComparison]::Ordinal)) { throw 'SALLY_PAIRING_CODE_MISMATCH' }
        Write-Host ('HARVEY SALLY PAIRING CODE: {0}' -f $expectedPairingCode)
        Write-Host 'Confirm the identical code on Doss Harvey. Do not type or copy a credential.'

        $approved = $false
        for ($poll = 1; $poll -le 300; $poll++) {
            $statusBody = @{ phase = 'PAIRING_STATUS'; challenge_id = $ChallengeId; request_id = $pairingRequestId } | ConvertTo-Json -Compress
            $status = Invoke-RestMethod -Method Post -Uri ($base + '/api/harvey/witness') -ContentType 'application/json' -Body $statusBody
            if ([string]$status.pairing.status -eq 'APPROVED') { $approved = $true; break }
            if ([string]$status.pairing.status -in @('REJECTED', 'REDEEMED')) { throw ('SALLY_PAIRING_TERMINAL: {0}' -f [string]$status.pairing.status) }
            Start-Sleep -Seconds 1
        }
        if (-not $approved) { throw 'SALLY_PAIRING_APPROVAL_TIMEOUT' }

        for ($attempt = 1; $attempt -le 4; $attempt++) {
            $snapshot = Invoke-RestMethod -Method Get -Uri ($base + '/api/harvey/snapshot')
            $initialRevision = [string]$snapshot.revision
            $transcript = @($ChallengeId, $pairingRequestId, $initialRevision, $capabilityHash, $ExpectedHostname, $AgentId) -join "`n"
            $signatureBytes = $rsa.SignData([System.Text.Encoding]::UTF8.GetBytes($transcript), 'SHA256')
            $redeemBody = @{
                phase = 'PAIRING_REDEEM'
                challenge_id = $ChallengeId
                request_id = $pairingRequestId
                initial_revision = $initialRevision
                capability_sha256 = $capabilityHash
                signature = ConvertTo-Base64Url -Bytes $signatureBytes
            } | ConvertTo-Json -Compress
            try {
                $ready = Invoke-RestMethod -Method Post -Uri ($base + '/api/harvey/witness') -ContentType 'application/json' -Body $redeemBody
                break
            } catch {
                try {
                    $readback = Invoke-RestMethod -Method Get -Uri ($base + '/api/harvey/witness')
                    $hostProof = $readback.witness.host_ready
                    if (
                        [string]$readback.witness.challenge_id -eq $ChallengeId -and
                        [string]$hostProof.pairing_request_id -eq $pairingRequestId -and
                        [string]$hostProof.initial_revision -eq $initialRevision -and
                        [string]$hostProof.proof_kind -eq 'OPERATOR_APPROVED_EPHEMERAL_PAIRING'
                    ) {
                        $ready = $readback
                        break
                    }
                } catch {}
                if ($attempt -eq 4) { throw }
                Start-Sleep -Milliseconds (150 * $attempt)
            }
        }
        $proofKind = 'OPERATOR_APPROVED_EPHEMERAL_PAIRING'
    } finally {
        $rsa.PersistKeyInCsp = $false
        $rsa.Clear()
        $rsa.Dispose()
    }
}

if (-not $ready) { throw 'SALLY_WITNESS_HOST_READY_FAILED' }
$witnessUrl = $base + '/harvey?sally_acceptance=' + [uri]::EscapeDataString($ChallengeId) + '#witness=' + $capability
Start-Process $witnessUrl

[pscustomobject]@{
    status = 'HOST_READY'
    challenge_id = $ChallengeId
    hostname = $ActualHostname
    receipt_id = $ready.witness.host_ready.receipt_id
    proof_kind = $proofKind
    pairing_request_id = $pairingRequestId
    browser_opened = $true
    heartbeat_sent = $false
    persistent_process_created = $false
    secret_printed = $false
} | ConvertTo-Json -Compress
