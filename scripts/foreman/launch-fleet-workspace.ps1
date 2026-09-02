param(
  [Parameter(Mandatory = $true)]
  [string]$Pack,
  [string]$RegistryPath = "",
  [string]$LauncherPath = "$env:LOCALAPPDATA\PowerToys\PowerToys.WorkspacesLauncher.exe",
  [switch]$List
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
if ([string]::IsNullOrWhiteSpace($RegistryPath)) {
  $RegistryPath = Join-Path $repoRoot "foreman\soledash\FLEET_WORKSPACES_REGISTRY.json"
}

if (!(Test-Path -LiteralPath $RegistryPath)) {
  throw "Fleet registry not found: $RegistryPath"
}
if (!(Test-Path -LiteralPath $LauncherPath)) {
  throw "PowerToys Workspaces launcher not found: $LauncherPath"
}

$registry = Get-Content -Raw -LiteralPath $RegistryPath | ConvertFrom-Json
$packs = $registry.packs

if ($List -or $Pack -eq "list") {
  $packs.PSObject.Properties | ForEach-Object {
    $p = $_.Value
    [PSCustomObject]@{
      key = $_.Name
      machine = $p.machine
      label = $p.label
      status = $p.status
      workspace_id = $p.workspace_id
    }
  } | Format-Table -AutoSize
  return
}

$entry = $packs.$Pack
if ($null -eq $entry) {
  $keys = @($packs.PSObject.Properties.Name) -join ", "
  throw "Unknown pack '$Pack'. Known packs: $keys"
}

if ($entry.status -ne "ready" -or [string]::IsNullOrWhiteSpace([string]$entry.workspace_id)) {
  throw "Pack '$Pack' is not launchable yet (status=$($entry.status), workspace_id missing). Capture on $($entry.machine) first."
}

$id = [string]$entry.workspace_id
Write-Host "Launching pack=$Pack label=$($entry.label) id=$id"
Start-Process -FilePath $LauncherPath -ArgumentList @($id)
