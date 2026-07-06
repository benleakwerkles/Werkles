#requires -Version 5.1
<#
.SYNOPSIS
  Run 1Password CLI for Werkles automation without waking desktop prompts.

.DESCRIPTION
  Reads the scoped Werkles 1Password service-account token from Windows
  Credential Manager, sets it only for this child process, disables desktop app
  integration for this command, and invokes the real 1Password CLI. The token is
  never printed or passed on the command line.
#>
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

$OpArgs = @($args)

function Restore-EnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [AllowNull()]
    [string]$Value
  )

  if ($null -eq $Value) {
    Remove-Item -LiteralPath "Env:\$Name" -ErrorAction SilentlyContinue
  } else {
    Set-Item -LiteralPath "Env:\$Name" -Value $Value
  }
}

$previousToken = $env:OP_SERVICE_ACCOUNT_TOKEN
$previousBiometric = $env:OP_BIOMETRIC_UNLOCK_ENABLED

try {
  $token = Get-WerklesOnePasswordServiceToken
  if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Error "Werkles 1Password automation token is not stored in Windows Credential Manager. Refusing to wake 1Password desktop prompts."
    exit 88
  }

  $opExe = Get-WerklesOpBinary
  $env:OP_SERVICE_ACCOUNT_TOKEN = $token
  $env:OP_BIOMETRIC_UNLOCK_ENABLED = "false"

  & $opExe @OpArgs
  exit $LASTEXITCODE
} finally {
  Restore-EnvValue -Name "OP_SERVICE_ACCOUNT_TOKEN" -Value $previousToken
  Restore-EnvValue -Name "OP_BIOMETRIC_UNLOCK_ENABLED" -Value $previousBiometric
}
