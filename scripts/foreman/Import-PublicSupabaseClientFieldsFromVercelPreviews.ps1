#requires -Version 5.1
<#
.SYNOPSIS
  Scan production plus current ready Vercel preview deployments for public Supabase client fields.
#>
param(
  [int]$PreviewLimit = 4,
  [string[]]$PagePaths = @("/", "/login", "/signup"),
  [int]$RequestTimeoutSec = 8,
  [int]$MaxAssetCount = 160,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_PUBLIC_SUPABASE_CLIENT_IMPORT_PREVIEW_SWEEP_20260704.json"
}

$NpxExe = (Get-Command npx.cmd -ErrorAction Stop).Source
$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
  $json = & $NpxExe vercel@latest list --environment=preview --status READY --format=json 2>$null
  $vercelExit = $LASTEXITCODE
} finally {
  $ErrorActionPreference = $previousErrorActionPreference
}
if ($vercelExit -ne 0) {
  throw "vercel list failed"
}

$parsed = $json | ConvertFrom-Json
$deployments = @($parsed.deployments)
if (-not $deployments -and $parsed -is [array]) {
  $deployments = @($parsed)
}

$urls = @("https://werkles.com") + @(
  $deployments |
    Select-Object -First $PreviewLimit |
    Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_.url) } |
    ForEach-Object { "https://$($_.url)" }
)

$importer = Join-Path $PSScriptRoot "Import-PublicSupabaseClientFieldsTo1Password.ps1"
& $importer -BaseUrls $urls -PagePaths $PagePaths -RequestTimeoutSec $RequestTimeoutSec -MaxAssetCount $MaxAssetCount -ReceiptPath $ReceiptPath
