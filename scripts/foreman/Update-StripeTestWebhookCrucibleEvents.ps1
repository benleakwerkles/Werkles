#requires -Version 5.1
<#
  Adds Crucible identity webhook events to the active Stripe test webhook for werkles.com.
  Names-only output; uses STRIPE_SECRET_KEY from 1Password via op run.
#>
param(
  [string]$WebhookUrl = "https://werkles.com/api/webhooks/stripe"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

$OpExe = Get-WerklesOpBinary
$storedToken = Get-WerklesOnePasswordServiceToken
if ($storedToken) { $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken }

$refsFile = Join-Path $RepoRoot "foreman\gates\werkles-vercel-tier-a.env.oprefs"
$innerScript = Join-Path $PSScriptRoot "Update-StripeTestWebhookCrucibleEvents.Inner.ps1"

$env:WERKLES_STRIPE_WEBHOOK_URL = $WebhookUrl
& $OpExe run --env-file="$refsFile" -- powershell -NoProfile -ExecutionPolicy Bypass -File $innerScript
Remove-Item Env:\WERKLES_STRIPE_WEBHOOK_URL -ErrorAction SilentlyContinue
exit $LASTEXITCODE
