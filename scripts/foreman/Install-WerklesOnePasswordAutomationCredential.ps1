[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [securestring]$ServiceAccountToken,
    [switch]$Remove,
    [switch]$Force
)

Set-StrictMode -Version 2.0

. (Join-Path $PSScriptRoot 'WerklesOnePasswordCredential.ps1')

if ($Remove) {
    Remove-WerklesOnePasswordAutomationSecret -WhatIf:$WhatIfPreference
    Write-Host ('Removed credential target: {0}' -f (Get-WerklesOnePasswordCredentialTarget))
    exit 0
}

if (-not $ServiceAccountToken) {
    if (-not [string]::IsNullOrWhiteSpace($env:OP_SERVICE_ACCOUNT_TOKEN)) {
        $ServiceAccountToken = ConvertTo-SecureString $env:OP_SERVICE_ACCOUNT_TOKEN -AsPlainText -Force
    } elseif ($Force) {
        $ServiceAccountToken = Read-Host 'Paste the 1Password service account token for Werkles automation' -AsSecureString
    } else {
        Write-Host 'OP_AUTH_SOURCE: NONE'
        Write-Host 'No token was provided. Re-run with -Force for a private prompt, or set OP_SERVICE_ACCOUNT_TOKEN for this process only.'
        exit 2
    }
}

Set-WerklesOnePasswordAutomationSecret -Secret $ServiceAccountToken -WhatIf:$WhatIfPreference
$status = Test-WerklesOnePasswordAutomationCredential

Write-Host ('OP_AUTH_SOURCE: {0}' -f $status.AuthSource)
Write-Host ('Credential target: {0}' -f $status.CredentialTarget)
Write-Host 'Stored for this Windows user. Token value was not printed.'
