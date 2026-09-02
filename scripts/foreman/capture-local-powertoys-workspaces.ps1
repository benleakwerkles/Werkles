param(
  [string]$WorkspaceFile = "$env:LOCALAPPDATA\Microsoft\PowerToys\Workspaces\workspaces.json",
  [string]$MachineName = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($MachineName)) {
  $MachineName = $env:COMPUTERNAME
}

if (!(Test-Path -LiteralPath $WorkspaceFile)) {
  throw "PowerToys workspaces file not found: $WorkspaceFile"
}

$data = Get-Content -Raw -LiteralPath $WorkspaceFile | ConvertFrom-Json
$rows = @()
foreach ($ws in @($data.workspaces)) {
  $apps = @($ws.applications | ForEach-Object { $_.application }) | Select-Object -Unique
  $rows += [ordered]@{
    machine = $MachineName
    hostname = $env:COMPUTERNAME
    powertoys_name = $ws.name
    workspace_id = $ws.id
    app_count = @($ws.applications).Count
    apps = ($apps -join ", ")
  }
}

Write-Host "=== Paste into FLEET_WORKSPACES_REGISTRY.json ==="
$rows | ConvertTo-Json -Depth 5
Write-Host ""
Write-Host "Return block for Operator / Maker:"
Write-Host "MACHINE=$MachineName"
Write-Host "HOSTNAME=$env:COMPUTERNAME"
foreach ($r in $rows) {
  Write-Host ("PACK_NAME={0}`nWORKSPACE_ID={1}`nAPPS={2}" -f $r.powertoys_name, $r.workspace_id, $r.apps)
  Write-Host "---"
}
