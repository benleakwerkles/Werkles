#requires -Version 5.1
$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

$OpExe = Get-WerklesOpBinary
$storedToken = Get-WerklesOnePasswordServiceToken
if ($storedToken) { $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken }

$refsFile = Join-Path $RepoRoot "foreman\gates\werkles-vercel-tier-a.env.oprefs"
$inner = Join-Path $PSScriptRoot "Test-OpRunEnvInjection.ps1"
& $OpExe run --env-file="$refsFile" -- powershell -NoProfile -ExecutionPolicy Bypass -File $inner
exit $LASTEXITCODE
