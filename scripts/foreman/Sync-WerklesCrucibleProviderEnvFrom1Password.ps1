#requires -Version 5.1
param(
  [ValidateSet("Preview", "Production", "Both")]
  [string]$Target = "Both"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

$OpBin = Get-WerklesOpBinary
$storedToken = Get-WerklesOnePasswordServiceToken
if ($storedToken) { $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken }

$config = Get-Content (Join-Path $RepoRoot "foreman\gates\werkles-vercel-op.config.json") -Raw | ConvertFrom-Json
$varNames = @($config.crucibleProviderVariableNames)
$refsFile = Join-Path $RepoRoot ($config.crucibleProviderOpRefsEnvFile -replace "/", "\")
$innerScript = Join-Path $PSScriptRoot "Sync-WerklesCrucibleProviderEnv.Inner.ps1"

if (-not (Test-Path -LiteralPath $refsFile)) {
  throw "Missing op refs file: $refsFile"
}

$targets = @()
if ($Target -eq "Preview" -or $Target -eq "Both") { $targets += "preview" }
if ($Target -eq "Production" -or $Target -eq "Both") { $targets += "production" }

Write-Output "SYNC_CRUCIBLE_PROVIDER: op run -> Vercel"
foreach ($t in $targets) {
  Write-Output "--- TARGET: $t ---"
  & $OpBin run --env-file="$refsFile" -- powershell -NoProfile -ExecutionPolicy Bypass -File $innerScript -VercelTarget $t -VariableNames ($varNames -join ",")
  if ($LASTEXITCODE -ne 0) {
    throw "Crucible provider sync failed for $t with exit code $LASTEXITCODE"
  }
}

Write-Output "CRUCIBLE_PROVIDER_SYNC_COMPLETE_NAMES_ONLY"
