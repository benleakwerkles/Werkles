[CmdletBinding()]
param(
    [switch]$Strict
)

Set-StrictMode -Version 2.0

. (Join-Path $PSScriptRoot 'WerklesOnePasswordCredential.ps1')

$readiness = Get-WerklesOnePasswordAutomationReadiness
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$receiptDir = Join-Path (Get-WerklesRepositoryRoot) 'foreman\receipts'
New-Item -ItemType Directory -Path $receiptDir -Force | Out-Null

$receipt = [pscustomobject]@{
    GeneratedAt = (Get-Date).ToString('o')
    Ready = $readiness.Ready
    Reason = $readiness.Reason
    RepositoryRoot = $readiness.RepositoryRoot
    MachineName = $readiness.MachineName
    UserName = $readiness.UserName
    Credential = $readiness.Credential
    OnePasswordCli = $readiness.OnePasswordCli
    OnePasswordCliCandidates = $readiness.OnePasswordCliCandidates
    WindowsHello = $readiness.WindowsHello
    PromptGuard = [pscustomobject]@{
        Behavior = 'fail-fast'
        NoStoredTokenMessage = 'OP_AUTH_SOURCE: NONE'
        Notes = 'Automation must use OP_SERVICE_ACCOUNT_TOKEN or the Windows Credential Manager target. It will not call interactive 1Password sign-in.'
    }
}

$receiptPath = Join-Path $receiptDir ("WERKLES_COM_1PASSWORD_AUTOMATION_READINESS_{0}.json" -f $timestamp)
$latestPath = Join-Path $receiptDir 'WERKLES_COM_1PASSWORD_AUTOMATION_READINESS_latest.json'

$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $receiptPath -Encoding UTF8
$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $latestPath -Encoding UTF8

if ($readiness.OnePasswordCli) {
    Write-Host ('OP_CLI: {0}' -f $readiness.OnePasswordCli.Path)
    Write-Host ('OP_CLI_SIGNATURE: {0}' -f $readiness.OnePasswordCli.SignatureStatus)
} else {
    Write-Host 'OP_CLI: MISSING_OR_UNSIGNED'
}

Write-Host ('OP_AUTH_SOURCE: {0}' -f $readiness.Credential.AuthSource)
Write-Host ('WINDOWS_HELLO: NgcSet={0} PreReqResult={1} KeySignTest={2}' -f $readiness.WindowsHello.NgcSet, $readiness.WindowsHello.PreReqResult, $readiness.WindowsHello.KeySignTest)
Write-Host ('PROMPT_GUARD: {0}' -f $receipt.PromptGuard.Behavior)
Write-Host ('RECEIPT: {0}' -f $receiptPath)

if ($Strict -and -not $readiness.Ready) {
    exit 2
}
