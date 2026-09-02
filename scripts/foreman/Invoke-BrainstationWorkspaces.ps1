param(
  [ValidateSet("Status", "DryRun", "Launch", "LaunchAll")]
  [string]$Action = "Status",
  [string]$Machine = "",
  [string]$ConfigPath = "",
  [int]$RemoteTimeoutSeconds = 2
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
if (!$ConfigPath) {
  $ConfigPath = Join-Path $repoRoot "foreman\soledash\BRAINSTATION_WORKSPACES.json"
}
$runnerPath = Join-Path $repoRoot "tools\brainstation_workspace_runner.mjs"
$receiptDirectory = Join-Path $repoRoot "foreman\receipts"
$currentReceiptPath = Join-Path $receiptDirectory "BRAINSTATION_WORKSPACE_CONTROL_CURRENT.json"

function Normalize-Machine([string]$Value) {
  $text = $Value.Trim().ToLowerInvariant()
  if ($text -eq "betsy") { return "Betsy" }
  if ($text -eq "spanzee") { return "Spanzee" }
  if ($text -eq "medullina") { return "Medullina" }
  if (!$text) { return "UNKNOWN" }
  return $text.Substring(0, 1).ToUpperInvariant() + $text.Substring(1)
}

function Invoke-LocalRunner([string[]]$Arguments) {
  $output = & node $runnerPath @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "LOCAL_WORKSPACE_RUNNER_FAILED: $($output -join [Environment]::NewLine)"
  }
  return (($output -join [Environment]::NewLine) | ConvertFrom-Json)
}

function Get-MachineInventory($Target) {
  if ($Target.local) {
    return Invoke-LocalRunner @("inventory")
  }
  try {
    return Invoke-RestMethod -Method Get -Uri "$($Target.endpoint.TrimEnd('/'))/workspaces" -TimeoutSec $RemoteTimeoutSeconds
  } catch {
    return [pscustomobject]@{
      ok = $false
      machine = $Target.machine
      status = "NOT_CONNECTED"
      error = $_.Exception.Message
      workspaces = @()
    }
  }
}

function Resolve-ConfiguredWorkspace($Target, $Inventory) {
  if (!$Inventory.ok) { return $null }
  $workspaceId = [string]$Target.workspace_id
  $workspaceName = [string]$Target.workspace_name
  $match = @($Inventory.workspaces | Where-Object {
    ($workspaceId -and $_.id -eq $workspaceId) -or
    ($workspaceName -and $_.name -eq $workspaceName)
  } | Select-Object -First 1)
  if ($match.Count -eq 0) { return $null }
  return $match[0]
}

function Invoke-WorkspaceLaunch($Target, [bool]$DryRun) {
  $inventory = Get-MachineInventory $Target
  if (!$inventory.ok) {
    return [pscustomobject]@{
      machine = $Target.machine
      status = "NOT_CONNECTED"
      launched = $false
      detail = $inventory.error
    }
  }

  $workspace = Resolve-ConfiguredWorkspace $Target $inventory
  if ($null -eq $workspace) {
    return [pscustomobject]@{
      machine = $Target.machine
      status = "WORKSPACE_NOT_CONFIGURED"
      launched = $false
      detail = "Expected workspace id/name was not found on the machine."
    }
  }

  if ($Target.local) {
    $args = @(
      "launch",
      "--machine", $Target.machine,
      "--workspace-id", $workspace.id,
      "--workspace-name", $workspace.name,
      "--dry-run", $DryRun.ToString().ToLowerInvariant()
    )
    $result = Invoke-LocalRunner $args
  } else {
    $body = @{
      target_machine = $Target.machine
      workspace_id = $workspace.id
      workspace_name = $workspace.name
      dry_run = $DryRun
    } | ConvertTo-Json -Compress
    try {
      $result = Invoke-RestMethod -Method Post -Uri "$($Target.endpoint.TrimEnd('/'))/workspaces/launch" -ContentType "application/json" -Body $body -TimeoutSec 70
    } catch {
      return [pscustomobject]@{
        machine = $Target.machine
        status = "LAUNCH_FAILED"
        launched = $false
        detail = $_.Exception.Message
      }
    }
  }

  return [pscustomobject]@{
    machine = $Target.machine
    status = $result.status
    launched = [bool]$result.launcher_started
    workspace_id = $result.workspace_id
    workspace_name = $result.workspace_name
    monitor_indexes = @($result.monitor_indexes)
    detail = if ($DryRun) { "Workspace resolved; launch not started." } else { "Workspace launch command completed." }
  }
}

if (!(Test-Path -LiteralPath $ConfigPath)) { throw "Brainstation workspace config not found: $ConfigPath" }
if (!(Test-Path -LiteralPath $runnerPath)) { throw "Workspace runner not found: $runnerPath" }
$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$targets = @($config.machines)

if ($Action -eq "Launch" -and !$Machine) { throw "-Machine is required for Action Launch" }
if ($Machine) {
  $canonicalMachine = Normalize-Machine $Machine
  $targets = @($targets | Where-Object { (Normalize-Machine $_.machine) -eq $canonicalMachine })
  if ($targets.Count -eq 0) { throw "Machine not configured: $Machine" }
}

$results = [System.Collections.Generic.List[object]]::new()
if ($Action -eq "Status") {
  foreach ($target in $targets) {
    $inventory = Get-MachineInventory $target
    $workspace = Resolve-ConfiguredWorkspace $target $inventory
    $monitorIndexes = [object[]]@()
    $workspaceOptions = [object[]]@()
    if ($workspace) { $monitorIndexes = [object[]]@($workspace.monitor_indexes) }
    if ($inventory.ok) {
      $workspaceOptions = [object[]]@($inventory.workspaces | Select-Object id, name, application_count, monitor_indexes)
    }
    $results.Add([pscustomobject]@{
      machine = $target.machine
      connected = [bool]$inventory.ok
      status = if (!$inventory.ok) { "NOT_CONNECTED" } elseif ($null -eq $workspace) { "WORKSPACE_NOT_CONFIGURED" } else { "READY" }
      workspace_id = if ($workspace) { $workspace.id } else { $null }
      workspace_name = if ($workspace) { $workspace.name } else { $target.workspace_name }
      monitor_indexes = $monitorIndexes
      available_workspaces = @($inventory.workspaces).Count
      workspace_options = $workspaceOptions
      detail = if (!$inventory.ok) { $inventory.error } elseif ($null -eq $workspace) { "Expected workspace id/name was not found on the machine." } else { "Configured workspace is available." }
    }) | Out-Null
  }
} else {
  $dryRun = $Action -eq "DryRun"
  foreach ($target in $targets) {
    $results.Add((Invoke-WorkspaceLaunch $target $dryRun)) | Out-Null
  }
}

$receipt = [ordered]@{
  schema = "brainstation_workspace_control_receipt_v1"
  controller = "Heimerdinker@Betsy"
  action = $Action
  timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
  scope = "PowerToys Workspace status and launch only"
  results = @($results)
  all_ready = @($results | Where-Object { $_.status -notin @("READY", "DRY_RUN_PASS", "WORKSPACE_LAUNCH_COMPLETE") }).Count -eq 0
  guardrails = @(
    "No general remote commands.",
    "No browser control or auto-send.",
    "Each machine may launch only a workspace already present in its local PowerToys configuration."
  )
}

$receiptStamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$timestampedReceiptPath = Join-Path $receiptDirectory "BRAINSTATION_WORKSPACE_CONTROL_$receiptStamp.json"
$receipt["receipt_path"] = $timestampedReceiptPath.Substring($repoRoot.Path.Length + 1).Replace("\", "/")
$utf8 = [Text.UTF8Encoding]::new($false)
$receiptJson = ($receipt | ConvertTo-Json -Depth 20) + [Environment]::NewLine
[IO.File]::WriteAllText($timestampedReceiptPath, $receiptJson, $utf8)
[IO.File]::WriteAllText($currentReceiptPath, $receiptJson, $utf8)
$receipt | ConvertTo-Json -Depth 20
if (!$receipt.all_ready) { exit 2 }
