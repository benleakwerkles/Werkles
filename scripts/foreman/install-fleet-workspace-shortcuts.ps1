param(
  [string]$RegistryPath = "",
  [string]$ShortcutDir = [Environment]::GetFolderPath("Desktop"),
  [string]$LauncherPath = "$env:LOCALAPPDATA\PowerToys\PowerToys.WorkspacesLauncher.exe",
  [string]$OnlyMachine = ""
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
if ([string]::IsNullOrWhiteSpace($RegistryPath)) {
  $RegistryPath = Join-Path $repoRoot "foreman\soledash\FLEET_WORKSPACES_REGISTRY.json"
}

$registry = Get-Content -Raw -LiteralPath $RegistryPath | ConvertFrom-Json
$launchScript = Join-Path $repoRoot "scripts\foreman\launch-fleet-workspace.ps1"
$wsh = New-Object -ComObject WScript.Shell
$created = @()

foreach ($prop in $registry.packs.PSObject.Properties) {
  $key = $prop.Name
  $pack = $prop.Value
  if ($OnlyMachine -and $pack.machine -ne $OnlyMachine) { continue }
  if ($pack.status -ne "ready" -or [string]::IsNullOrWhiteSpace([string]$pack.workspace_id)) { continue }

  $name = "Werkles - $($pack.label).lnk"
  $path = Join-Path $ShortcutDir $name
  $sc = $wsh.CreateShortcut($path)
  $sc.TargetPath = "powershell.exe"
  $sc.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$launchScript`" -Pack $key"
  $sc.WorkingDirectory = $repoRoot
  $sc.WindowStyle = 7
  $sc.Description = "Launch PowerToys pack $key ($($pack.workspace_id))"
  $sc.IconLocation = "$LauncherPath,0"
  $sc.Save()
  $created += $path
}

if ($created.Count -eq 0) {
  Write-Host "No ready packs to shortcut (machine filter='$OnlyMachine')."
} else {
  Write-Host "Created $($created.Count) shortcut(s):"
  $created | ForEach-Object { Write-Host "  $_" }
}
