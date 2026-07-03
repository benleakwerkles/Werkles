param(
  [string]$WorkspaceId = "{27BB1F1B-BC9E-4DBE-9003-0DAB8576BC0B}",
  [int]$TimeoutSeconds = 30,
  [ValidateSet("Prompt", "RetryApp", "SkipApp", "ContinueWorkspace")]
  [string]$AutoAction = "Prompt",
  [switch]$NoRelaunch,
  [string]$LauncherPath = "$env:LOCALAPPDATA\PowerToys\PowerToys.WorkspacesLauncher.exe",
  [string]$WorkspaceFile = "$env:LOCALAPPDATA\Microsoft\PowerToys\Workspaces\workspaces.json"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$stateDir = Join-Path $repoRoot "foreman\soledash\workspaces-self-heal"
$statePath = Join-Path $stateDir "state.json"
$logPath = Join-Path $stateDir "workspaces_self_heal_log.jsonl"
$receiptPath = Join-Path $stateDir "latest_receipt.json"
$organismEventsPath = Join-Path $repoRoot "data\organism\events.jsonl"
$receiptPickupPath = Join-Path $repoRoot "data\organism\receipt_pickup.jsonl"
$tinkerdenReceiptDir = Join-Path $repoRoot "data\tinkerden\receipts"
$workspacesRoot = Join-Path $env:LOCALAPPDATA "Microsoft\PowerToys\Workspaces"
$logDate = Get-Date -Format "yyyy-MM-dd"
$launcherLog = Join-Path $workspacesRoot "WorkspacesLauncher\Logs\v0.100.0\log_$logDate.log"
$arrangerLog = Join-Path $workspacesRoot "WorkspacesWindowArranger\Logs\v0.100.0\log_$logDate.log"

function Read-JsonFile($path, $fallback) {
  if (Test-Path -LiteralPath $path) {
    return Get-Content -Raw -LiteralPath $path | ConvertFrom-Json
  }
  return $fallback
}

function Write-Utf8Json($path, $value) {
  $json = $value | ConvertTo-Json -Depth 100
  $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
  [System.IO.File]::WriteAllText($path, $json + [Environment]::NewLine, $utf8NoBom)
}

function New-Stamp {
  return (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
}

function Write-JsonlLine($path, $record) {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $path) | Out-Null
  $line = ($record | ConvertTo-Json -Depth 40 -Compress) + [Environment]::NewLine
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($line)
  for ($attempt = 0; $attempt -lt 10; $attempt += 1) {
    try {
      $stream = [System.IO.File]::Open($path, [System.IO.FileMode]::OpenOrCreate, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::ReadWrite)
      try {
        $stream.Seek(0, [System.IO.SeekOrigin]::End) | Out-Null
        $stream.Write($bytes, 0, $bytes.Length)
        return
      } finally {
        $stream.Dispose()
      }
    } catch {
      if ($attempt -eq 9) { throw }
      Start-Sleep -Milliseconds 150
    }
  }
}

function Write-Event($event) {
  New-Item -ItemType Directory -Force -Path $stateDir | Out-Null
  $event | Add-Member -NotePropertyName timestamp -NotePropertyValue (New-Stamp) -Force
  Write-JsonlLine $logPath $event
  Write-JsonlLine $organismEventsPath $event
}

function Stop-WorkspaceLauncherProcesses {
  $names = @(
    "PowerToys.WorkspacesLauncher",
    "PowerToys.WorkspacesLauncherUI",
    "PowerToys.WorkspacesWindowArranger"
  )
  foreach ($name in $names) {
    Get-Process -Name $name -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
  }
}

function Get-WorkspaceData {
  if (!(Test-Path -LiteralPath $WorkspaceFile)) {
    throw "PowerToys workspace file not found: $WorkspaceFile"
  }
  $data = Get-Content -Raw -LiteralPath $WorkspaceFile | ConvertFrom-Json
  if ($null -eq $data.workspaces) {
    throw "PowerToys workspace file is missing top-level workspaces array: $WorkspaceFile"
  }
  return $data
}

function Get-Workspace($data, $id) {
  $workspace = @($data.workspaces | Where-Object { $_.id -eq $id } | Select-Object -First 1)
  if ($workspace.Count -eq 0) {
    throw "Workspace id not found: $id"
  }
  return $workspace[0]
}

function Get-WorkspaceFingerprint($workspace) {
  $canonical = [ordered]@{
    id = $workspace.id
    name = $workspace.name
    move_existing_windows = $workspace.'move-existing-windows'
    monitor_configuration = $workspace.'monitor-configuration'
    applications = @($workspace.applications | ForEach-Object {
      [ordered]@{
        id = $_.id
        application = $_.application
        application_path = $_.'application-path'
        title = $_.title
        package_full_name = $_.'package-full-name'
        app_user_model_id = $_.'app-user-model-id'
        pwa_app_id = $_.'pwa-app-id'
        command_line_arguments = $_.'command-line-arguments'
        is_elevated = $_.'is-elevated'
      }
    })
  }
  $bytes = [System.Text.Encoding]::UTF8.GetBytes(($canonical | ConvertTo-Json -Depth 100 -Compress))
  $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
  return ([BitConverter]::ToString($hash)).Replace("-", "").ToLowerInvariant()
}

function Read-State {
  $fallback = [pscustomobject]@{
    schema = "powertoys_workspaces_self_heal_state_v1"
    workspaces = [pscustomobject]@{}
  }
  return Read-JsonFile $statePath $fallback
}

function Save-State($state) {
  New-Item -ItemType Directory -Force -Path $stateDir | Out-Null
  Write-Utf8Json $statePath $state
}

function Get-WorkspaceState($state, $workspaceId, $fingerprint) {
  if ($null -eq $state.workspaces) {
    $state | Add-Member -NotePropertyName workspaces -NotePropertyValue ([pscustomobject]@{}) -Force
  }

  $existing = $state.workspaces.PSObject.Properties[$workspaceId]
  if ($null -eq $existing -or $existing.Value.fingerprint -ne $fingerprint) {
    $fresh = [pscustomobject]@{
      fingerprint = $fingerprint
      skipped_apps = @()
    }
    $state.workspaces | Add-Member -NotePropertyName $workspaceId -NotePropertyValue $fresh -Force
    return $fresh
  }

  if ($null -eq $existing.Value.skipped_apps) {
    $existing.Value | Add-Member -NotePropertyName skipped_apps -NotePropertyValue @() -Force
  }
  return $existing.Value
}

function Get-AppName($app) {
  if ($app.application) { return [string]$app.application }
  if ($app.title) { return [string]$app.title }
  return [string]$app.'application-path'
}

function Is-SkippedApp($app, $skippedApps) {
  foreach ($skip in @($skippedApps)) {
    if ($skip.application -and $app.application -eq $skip.application) { return $true }
    if ($skip.application_path -and $app.'application-path' -eq $skip.application_path) { return $true }
    if ($skip.title -and $app.title -eq $skip.title) { return $true }
  }
  return $false
}

function Add-SkippedApp($workspaceState, $app, $reason) {
  $name = Get-AppName $app
  $existing = @($workspaceState.skipped_apps | Where-Object {
    ($_.application -and $_.application -eq $app.application) -or
    ($_.application_path -and $_.application_path -eq $app.'application-path')
  } | Select-Object -First 1)

  if ($existing.Count -gt 0) {
    $existing[0].last_seen_at = New-Stamp
    $existing[0].reason = $reason
    return $existing[0]
  }

  $record = [pscustomobject]@{
    application = [string]$app.application
    application_path = [string]$app.'application-path'
    title = [string]$app.title
    reason = $reason
    first_seen_at = New-Stamp
    last_seen_at = New-Stamp
  }
  $workspaceState.skipped_apps = @($workspaceState.skipped_apps) + $record
  return $record
}

function Get-LogMarker($path) {
  if (Test-Path -LiteralPath $path) {
    return (Get-Item -LiteralPath $path).Length
  }
  return 0
}

function Read-LogSince($path, $marker) {
  if (!(Test-Path -LiteralPath $path)) { return "" }
  $stream = [System.IO.File]::Open($path, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
  try {
    if ($marker -gt 0 -and $marker -lt $stream.Length) {
      $stream.Seek($marker, [System.IO.SeekOrigin]::Begin) | Out-Null
    }
    $reader = [System.IO.StreamReader]::new($stream)
    return $reader.ReadToEnd()
  } finally {
    $stream.Dispose()
  }
}

function Find-WaitingApplication($workspace, $logText) {
  $matches = [regex]::Matches($logText, "Waiting time for launching next (.+?) instance expired")
  if ($matches.Count -gt 0) {
    $name = $matches[$matches.Count - 1].Groups[1].Value.Trim()
    $app = @($workspace.applications | Where-Object { $_.application -eq $name } | Select-Object -First 1)
    if ($app.Count -gt 0) { return $app[0] }
  }

  $matches = [regex]::Matches($logText, "Error updating state: app (.+?) is not tracked in the project")
  if ($matches.Count -gt 0) {
    $name = $matches[$matches.Count - 1].Groups[1].Value.Trim()
    $app = @($workspace.applications | Where-Object { $_.application -eq $name } | Select-Object -First 1)
    if ($app.Count -gt 0) { return $app[0] }
  }

  $matches = [regex]::Matches($logText, "Launching (.+?) at ")
  if ($matches.Count -gt 0) {
    $name = $matches[$matches.Count - 1].Groups[1].Value.Trim()
    $app = @($workspace.applications | Where-Object { $_.application -eq $name } | Select-Object -First 1)
    if ($app.Count -gt 0) { return $app[0] }
  }

  return $null
}

function Get-AppExecutableName($app) {
  $appPath = [string]$app.'application-path'
  if ($appPath) { return [System.IO.Path]::GetFileName($appPath) }
  return ""
}

function Get-AppProofName($app) {
  $exe = Get-AppExecutableName $app
  if ($app.application -and $exe) { return "$($app.application) / $exe" }
  if ($app.application) { return [string]$app.application }
  if ($exe) { return $exe }
  if ($app.title) { return [string]$app.title }
  return "UNKNOWN"
}

function Get-LogLineTime($line) {
  $match = [regex]::Match($line, "^\[(?<ts>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{6})\]")
  if (!$match.Success) { return $null }
  try {
    return [datetime]::ParseExact(
      $match.Groups["ts"].Value,
      "yyyy-MM-dd HH:mm:ss.ffffff",
      [System.Globalization.CultureInfo]::InvariantCulture
    )
  } catch {
    return $null
  }
}

function Convert-LogTimeToIso($time) {
  if ($null -eq $time) { return $null }
  return ([datetime]$time).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
}

function Get-ElapsedMs($start, $end) {
  if ($null -eq $start -or $null -eq $end) { return $null }
  return [int][math]::Max(0, ([datetime]$end - [datetime]$start).TotalMilliseconds)
}

function Add-AppProofRecord($records, $workspaceId, $launchWorkspaceId, $appName, $appPath, $title, $start, $end, $result, $detail) {
  $records.Add([pscustomobject]@{
    workspace_id = $workspaceId
    launch_workspace_id = $launchWorkspaceId
    app_name = $appName
    app_path = $appPath
    title = $title
    launch_start = Convert-LogTimeToIso $start
    launch_end = Convert-LogTimeToIso $end
    result = $result
    elapsed_ms = Get-ElapsedMs $start $end
    detail = $detail
  }) | Out-Null
}

function Normalize-ComparablePath($value) {
  if (!$value) { return "" }
  try {
    return ([System.IO.Path]::GetFullPath([string]$value)).ToLowerInvariant()
  } catch {
    return ([string]$value).ToLowerInvariant()
  }
}

function Get-RunningProcessPathSet {
  $set = @{}
  Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.ExecutablePath) {
      $set[(Normalize-ComparablePath $_.ExecutablePath)] = $true
    }
  }
  return $set
}

function AppAlreadyHasProof($records, $app) {
  $appPath = Normalize-ComparablePath $app.'application-path'
  $appName = [string]$app.application
  $matches = @($records | Where-Object {
    ($appPath -and (Normalize-ComparablePath $_.app_path) -eq $appPath) -or
    ($appName -and $_.app_name -like "$appName*")
  })
  return $matches.Count -gt 0
}

function Convert-PowerToysLogsToAppProof($workspaceId, $launchWorkspace, $logText, $skippedApps) {
  $records = [System.Collections.ArrayList]::new()
  $pending = [System.Collections.ArrayList]::new()
  $lines = $logText -split "`r?`n"

  foreach ($line in $lines) {
    $lineTime = Get-LogLineTime $line
    $launchMatch = [regex]::Match($line, "Launching (?<app>.+?) at (?<path>.+)$")
    if ($launchMatch.Success) {
      $pending.Add([pscustomobject]@{
        app_name = $launchMatch.Groups["app"].Value.Trim()
        app_path = $launchMatch.Groups["path"].Value.Trim()
        start = $lineTime
      }) | Out-Null
      Write-Event ([pscustomobject]@{
        event_type = "workspace_app_starting"
        workspace_id = $workspaceId
        launch_workspace_id = $launchWorkspace.id
        app_name = $launchMatch.Groups["app"].Value.Trim()
        app_path = $launchMatch.Groups["path"].Value.Trim()
        result = "STARTING"
      })
      continue
    }

    $launchedMatch = [regex]::Match($line, "(?<app>.+?) launched at (?<path>.+)$")
    if ($launchedMatch.Success) {
      $appName = $launchedMatch.Groups["app"].Value.Trim()
      $appPath = $launchedMatch.Groups["path"].Value.Trim()
      $matchedIndex = -1
      for ($i = $pending.Count - 1; $i -ge 0; $i -= 1) {
        if ($pending[$i].app_name -eq $appName -and $pending[$i].app_path -eq $appPath) {
          $matchedIndex = $i
          break
        }
      }
      $start = if ($matchedIndex -ge 0) { $pending[$matchedIndex].start } else { $null }
      if ($matchedIndex -ge 0) { $pending.RemoveAt($matchedIndex) }
      Add-AppProofRecord $records $workspaceId $launchWorkspace.id $appName $appPath "" $start $lineTime "RUNNING" "PowerToys logged app launch complete."
      continue
    }

    $waitingMatch = [regex]::Match($line, "Waiting time for launching next (?<app>.+?) instance expired")
    if ($waitingMatch.Success) {
      $appName = $waitingMatch.Groups["app"].Value.Trim()
      Add-AppProofRecord $records $workspaceId $launchWorkspace.id $appName "" "" $lineTime $lineTime "WAITING" "PowerToys exceeded wait time for the next app instance."
      continue
    }

    $errorMatch = [regex]::Match($line, "Error updating state: app (?<app>.+?) is not tracked in the project")
    if ($errorMatch.Success) {
      $appName = $errorMatch.Groups["app"].Value.Trim()
      Add-AppProofRecord $records $workspaceId $launchWorkspace.id $appName "" "" $lineTime $lineTime "FAILED" "PowerToys could not track this app in the workspace project."
      continue
    }
  }

  foreach ($item in $pending) {
    Add-AppProofRecord $records $workspaceId $launchWorkspace.id $item.app_name $item.app_path "" $item.start $null "FAILED" "PowerToys logged app start but did not log completion."
  }

  foreach ($skip in @($skippedApps)) {
    Add-AppProofRecord $records $workspaceId $launchWorkspace.id "$($skip.application) / $([System.IO.Path]::GetFileName([string]$skip.application_path))" $skip.application_path $skip.title $null $null "SKIPPED" $skip.reason
  }

  $runningPaths = Get-RunningProcessPathSet
  foreach ($app in @($launchWorkspace.applications)) {
    if (Is-SkippedApp $app $skippedApps) { continue }
    if (AppAlreadyHasProof $records $app) { continue }

    $appPath = [string]$app.'application-path'
    $comparablePath = Normalize-ComparablePath $appPath
    $appName = Get-AppProofName $app
    if ($appPath -and $runningPaths.ContainsKey($comparablePath)) {
      Add-AppProofRecord $records $workspaceId $launchWorkspace.id $appName $appPath $app.title $null $null "RUNNING" "Process was already running or became visible after workspace launch."
      continue
    }

    if ($appPath -and !(Test-Path -LiteralPath $appPath)) {
      Add-AppProofRecord $records $workspaceId $launchWorkspace.id $appName $appPath $app.title $null $null "FAILED" "Executable path missing."
      continue
    }

    Add-AppProofRecord $records $workspaceId $launchWorkspace.id $appName $appPath $app.title $null $null "FAILED" "No matching process was observed after workspace launch."
  }

  return @($records)
}

function To-RepoRelativePath($absolutePath) {
  $root = [System.IO.Path]::GetFullPath([string]$repoRoot)
  $full = [System.IO.Path]::GetFullPath([string]$absolutePath)
  if ($full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $full.Substring($root.Length).TrimStart("\").Replace("\", "/")
  }
  return $full
}

function New-ReceiptId {
  return "workspace_launch_complete_{0}" -f ((Get-Date).ToUniversalTime().ToString("yyyyMMddHHmmssfff"))
}

function Write-WorkspaceLaunchReceipt($params) {
  New-Item -ItemType Directory -Force -Path $tinkerdenReceiptDir | Out-Null

  $receiptId = New-ReceiptId
  $receiptFile = Join-Path $tinkerdenReceiptDir "$receiptId.json"
  $proofReference = To-RepoRelativePath $receiptFile
  $timestamp = New-Stamp
  $receipt = [pscustomobject]@{
    schema = "powertoys_workspaces_proof_loop_receipt_v1"
    receipt_id = $receiptId
    mission = "WORKSPACES_PROOF_LOOP_V1"
    producer = "Dink@Betsy"
    status_guess = $params.status_guess
    timestamp = $timestamp
    proof_reference = $proofReference
    linked_packet_id = "WORKSPACES_PROOF_LOOP_V1"
    event_type = "workspace_launch_complete"
    workspace_id = $params.workspace_id
    workspace_name = $params.workspace_name
    launch_workspace_id = $params.launch_workspace_id
    launch_workspace_name = $params.launch_workspace_name
    blocking_application = $params.blocking_application
    action = $params.action
    result = $params.result
    detail = $params.detail
    app_results = $params.app_results
  }

  Write-Utf8Json $receiptFile $receipt
  Write-Utf8Json $receiptPath $receipt

  $pickup = [pscustomobject]@{
    receipt_id = $receiptId
    mission = "WORKSPACES_PROOF_LOOP_V1"
    producer = "Dink@Betsy"
    status_guess = $params.status_guess
    timestamp = $timestamp
    path = $proofReference
    proof_reference = $proofReference
    linked_packet_id = "WORKSPACES_PROOF_LOOP_V1"
  }
  Write-JsonlLine $receiptPickupPath $pickup
  Write-Event ([pscustomobject]@{
    event_type = "workspace_launch_complete"
    receipt_id = $receiptId
    workspace_id = $params.workspace_id
    launch_workspace_id = $params.launch_workspace_id
    blocking_application = $params.blocking_application
    action = $params.action
    status = $params.status_guess
    proof_reference = $proofReference
  })

  return $receipt
}

function Show-RecoveryDialog($appName, $detail) {
  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing

  $form = New-Object System.Windows.Forms.Form
  $form.Text = "PowerToys Workspaces is waiting"
  $form.Size = New-Object System.Drawing.Size(540, 220)
  $form.StartPosition = "CenterScreen"
  $form.TopMost = $true

  $label = New-Object System.Windows.Forms.Label
  $label.Location = New-Object System.Drawing.Point(18, 18)
  $label.Size = New-Object System.Drawing.Size(490, 82)
  $label.Text = "Waiting on:`r`n`r`n$appName`r`n`r`n$detail"
  $form.Controls.Add($label)

  $retry = New-Object System.Windows.Forms.Button
  $retry.Text = "Retry App"
  $retry.Location = New-Object System.Drawing.Point(20, 120)
  $retry.Size = New-Object System.Drawing.Size(145, 34)
  $retry.Add_Click({ $form.Tag = "RetryApp"; $form.Close() })
  $form.Controls.Add($retry)

  $skip = New-Object System.Windows.Forms.Button
  $skip.Text = "Skip App"
  $skip.Location = New-Object System.Drawing.Point(185, 120)
  $skip.Size = New-Object System.Drawing.Size(145, 34)
  $skip.Add_Click({ $form.Tag = "SkipApp"; $form.Close() })
  $form.Controls.Add($skip)

  $continue = New-Object System.Windows.Forms.Button
  $continue.Text = "Continue Workspace"
  $continue.Location = New-Object System.Drawing.Point(350, 120)
  $continue.Size = New-Object System.Drawing.Size(155, 34)
  $continue.Add_Click({ $form.Tag = "ContinueWorkspace"; $form.Close() })
  $form.Controls.Add($continue)

  $form.AcceptButton = $skip
  $form.ShowDialog() | Out-Null
  if ($form.Tag) { return [string]$form.Tag }
  return "ContinueWorkspace"
}

function Invoke-AppRetry($app) {
  $path = [string]$app.'application-path'
  if (!$path -or !(Test-Path -LiteralPath $path)) {
    throw "Cannot retry app; executable is missing: $path"
  }

  $args = [string]$app.'command-line-arguments'
  if ($args) {
    Start-Process -FilePath $path -ArgumentList $args | Out-Null
  } else {
    Start-Process -FilePath $path | Out-Null
  }
}

function New-TemporaryWorkspace($data, $workspace, $workspaceState) {
  $tempName = "$($workspace.name) [Self-Heal]"
  $remaining = @($data.workspaces | Where-Object { $_.id -eq $workspace.id -or $_.name -ne $tempName })
  $clone = ($workspace | ConvertTo-Json -Depth 100 | ConvertFrom-Json)
  $clone.id = "{0}" -f ([guid]::NewGuid().ToString("B").ToUpperInvariant())
  $clone.name = $tempName
  $clone.'is-shortcut-needed' = $false
  $clone.applications = @($workspace.applications | Where-Object { !(Is-SkippedApp $_ $workspaceState.skipped_apps) })
  $data.workspaces = @($remaining) + $clone
  Write-Utf8Json $WorkspaceFile $data
  return $clone
}

function Start-WorkspaceAndWait($id, $timeoutSeconds) {
  if (!(Test-Path -LiteralPath $LauncherPath)) {
    throw "PowerToys Workspaces launcher not found: $LauncherPath"
  }

  $launcherMarker = Get-LogMarker $launcherLog
  $arrangerMarker = Get-LogMarker $arrangerLog
  $process = Start-Process -FilePath $LauncherPath -ArgumentList @($id) -PassThru
  $finished = $process.WaitForExit($timeoutSeconds * 1000)
  $logText = (Read-LogSince $launcherLog $launcherMarker) + "`n" + (Read-LogSince $arrangerLog $arrangerMarker)

  return [pscustomobject]@{
    process_id = $process.Id
    finished = $finished
    exit_code = if ($finished) { $process.ExitCode } else { $null }
    log_text = $logText
  }
}

New-Item -ItemType Directory -Force -Path $stateDir | Out-Null

$data = Get-WorkspaceData
$workspace = Get-Workspace $data $WorkspaceId
$fingerprint = Get-WorkspaceFingerprint $workspace
$state = Read-State
$workspaceState = Get-WorkspaceState $state $WorkspaceId $fingerprint
Save-State $state

$launchWorkspace = $workspace
if (@($workspaceState.skipped_apps).Count -gt 0) {
  $launchWorkspace = New-TemporaryWorkspace $data $workspace $workspaceState
}

Write-Event ([pscustomobject]@{
  event_type = "workspaces_self_heal_launch_started"
  workspace_id = $WorkspaceId
  launch_workspace_id = $launchWorkspace.id
  skipped_apps = @($workspaceState.skipped_apps | ForEach-Object { $_.application })
})

$result = Start-WorkspaceAndWait $launchWorkspace.id $TimeoutSeconds
$appResults = @(Convert-PowerToysLogsToAppProof $WorkspaceId $launchWorkspace $result.log_text $workspaceState.skipped_apps)
$waitingApp = Find-WaitingApplication $workspace $result.log_text
$blockingName = if ($waitingApp) { Get-AppProofName $waitingApp } else { "UNKNOWN" }

if ($result.finished) {
  Write-Event ([pscustomobject]@{
    event_type = "workspaces_self_heal_launch_completed"
    workspace_id = $WorkspaceId
    launch_workspace_id = $launchWorkspace.id
    blocking_application = $blockingName
    action = "None"
    status = "PASS"
  })
  $receipt = Write-WorkspaceLaunchReceipt ([pscustomobject]@{
    workspace_id = $WorkspaceId
    workspace_name = $workspace.name
    launch_workspace_id = $launchWorkspace.id
    launch_workspace_name = $launchWorkspace.name
    blocking_application = $blockingName
    action = "None"
    result = "Running"
    detail = "Workspace launcher exited before timeout."
    status_guess = "WORKSPACE_LAUNCH_COMPLETE"
    app_results = $appResults
  })
  $receipt | ConvertTo-Json -Depth 20
  exit 0
}

$detail = "Launch exceeded $TimeoutSeconds seconds."
$choice = if ($AutoAction -eq "Prompt") { Show-RecoveryDialog $blockingName $detail } else { $AutoAction }

Write-Event ([pscustomobject]@{
  event_type = "workspaces_self_heal_timeout"
  workspace_id = $WorkspaceId
  launch_workspace_id = $launchWorkspace.id
  blocking_application = $blockingName
  action = $choice
  detail = $detail
})

if ($choice -eq "RetryApp") {
  if ($waitingApp) { Invoke-AppRetry $waitingApp }
  Stop-WorkspaceLauncherProcesses
  if (!$NoRelaunch) {
    $result = Start-WorkspaceAndWait $WorkspaceId $TimeoutSeconds
    $retryProof = @(Convert-PowerToysLogsToAppProof $WorkspaceId $workspace $result.log_text $workspaceState.skipped_apps)
    $appResults = @($appResults) + @($retryProof)
  }
} elseif ($choice -eq "SkipApp") {
  if ($waitingApp) {
    Add-SkippedApp $workspaceState $waitingApp "launch_timeout" | Out-Null
    Save-State $state
  }
  Stop-WorkspaceLauncherProcesses
  if (!$NoRelaunch) {
    $data = Get-WorkspaceData
    $tempWorkspace = New-TemporaryWorkspace $data $workspace $workspaceState
    $result = Start-WorkspaceAndWait $tempWorkspace.id $TimeoutSeconds
    $skipProof = @(Convert-PowerToysLogsToAppProof $WorkspaceId $tempWorkspace $result.log_text $workspaceState.skipped_apps)
    $appResults = @($appResults) + @($skipProof)
    $launchWorkspace = $tempWorkspace
  }
} elseif ($choice -eq "ContinueWorkspace") {
  Stop-WorkspaceLauncherProcesses
}

$finalRunning = @(Get-Process -Name "PowerToys.WorkspacesLauncher", "PowerToys.WorkspacesLauncherUI", "PowerToys.WorkspacesWindowArranger" -ErrorAction SilentlyContinue)
$statusGuess = if ($finalRunning.Count -eq 0) { "WORKSPACE_LAUNCH_COMPLETE" } else { "WORKSPACE_LAUNCH_PARTIAL" }
$receipt = Write-WorkspaceLaunchReceipt ([pscustomobject]@{
  workspace_id = $WorkspaceId
  workspace_name = $workspace.name
  launch_workspace_id = $launchWorkspace.id
  launch_workspace_name = $launchWorkspace.name
  blocking_application = $blockingName
  action = $choice
  result = if ($finalRunning.Count -eq 0) { "Running" } else { "Partial" }
  detail = $detail
  status_guess = $statusGuess
  app_results = $appResults
})
Write-Event ([pscustomobject]@{
  event_type = "workspaces_self_heal_recovery_finished"
  workspace_id = $WorkspaceId
  launch_workspace_id = $launchWorkspace.id
  blocking_application = $blockingName
  action = $choice
  status = $statusGuess
})

$receipt | ConvertTo-Json -Depth 20
