[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$OpArguments
)

Set-StrictMode -Version 2.0

. (Join-Path $PSScriptRoot 'WerklesOnePasswordCredential.ps1')

$cli = Resolve-WerklesOnePasswordCli
if (-not $cli) {
    Write-Host 'OP_CLI: MISSING_OR_UNSIGNED'
    Write-Host 'Prompt guard stopped before calling 1Password.'
    exit 3
}

$credential = Test-WerklesOnePasswordAutomationCredential
if ($credential.AuthSource -eq 'NONE') {
    Write-Host 'OP_AUTH_SOURCE: NONE'
    Write-Host ('Missing stored credential target: {0}' -f $credential.CredentialTarget)
    Write-Host 'Prompt guard stopped before calling 1Password.'
    exit 2
}

if (-not $OpArguments -or $OpArguments.Count -eq 0) {
    $OpArguments = @('--version')
}

if ($OpArguments.Count -gt 0 -and $OpArguments[0] -eq '--') {
    if ($OpArguments.Count -eq 1) {
        $OpArguments = @('--version')
    } else {
        $OpArguments = @($OpArguments | Select-Object -Skip 1)
    }
}

$oldToken = $env:OP_SERVICE_ACCOUNT_TOKEN
$storedSecret = $null

try {
    if ($credential.AuthSource -eq 'WINDOWS_CREDENTIAL_MANAGER') {
        $storedSecret = Get-WerklesOnePasswordAutomationSecret -TargetName $credential.CredentialTarget
        $env:OP_SERVICE_ACCOUNT_TOKEN = $storedSecret
    }

    Write-Host ('OP_AUTH_SOURCE: {0}' -f $credential.AuthSource)
    & $cli.Path @OpArguments
    exit $LASTEXITCODE
} finally {
    if ($null -ne $oldToken) {
        $env:OP_SERVICE_ACCOUNT_TOKEN = $oldToken
    } else {
        Remove-Item Env:\OP_SERVICE_ACCOUNT_TOKEN -ErrorAction SilentlyContinue
    }

    $storedSecret = $null
}
