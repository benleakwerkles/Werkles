param(
  [ValidateSet("Install", "Serve")]
  [string]$Mode = "Install",
  [ValidateSet("Betsy", "Spanzee", "Medullina")]
  [string]$Machine = $env:COMPUTERNAME,
  [string]$ControllerIpv4 = "10.1.10.194",
  [int]$Port = 4877
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$runnerPath = Join-Path $repoRoot "tools\brainstation_workspace_runner.mjs"
$taskName = "Werkles Brainstation Workspace Listener"
$ruleName = "Werkles Brainstation Workspace Listener"

if (!(Test-Path -LiteralPath $runnerPath)) { throw "Workspace-only listener not found: $runnerPath" }
$nodePath = (Get-Command node -ErrorAction Stop).Source

if ($Mode -eq "Serve") {
  $env:BRAINSTATION_WORKSPACE_MACHINE = $Machine
  $env:BRAINSTATION_WORKSPACE_CONTROLLER_IPS = $ControllerIpv4
  & $nodePath $runnerPath serve --host 0.0.0.0 --port $Port
  exit $LASTEXITCODE
}

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
if (!$principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw "ADMIN_REQUIRED_FOR_WORKSPACE_LISTENER_FIREWALL_RULE"
}

$existingRule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue | Select-Object -First 1
if ($existingRule) {
  $existingRule | Set-NetFirewallRule -Enabled True -Direction Inbound -Action Allow -Profile Private | Out-Null
  $existingRule | Get-NetFirewallAddressFilter | Set-NetFirewallAddressFilter -RemoteAddress $ControllerIpv4 | Out-Null
  $existingRule | Get-NetFirewallPortFilter | Set-NetFirewallPortFilter -Protocol TCP -LocalPort $Port | Out-Null
} else {
  New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port -RemoteAddress $ControllerIpv4 -Profile Private | Out-Null
}

$powerShellPath = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$taskArguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$PSCommandPath`" -Mode Serve -Machine $Machine -ControllerIpv4 $ControllerIpv4 -Port $Port"
$taskAction = New-ScheduledTaskAction -Execute $powerShellPath -Argument $taskArguments -WorkingDirectory $repoRoot.Path
$taskTrigger = New-ScheduledTaskTrigger -AtLogOn -User $identity.Name
$taskPrincipal = New-ScheduledTaskPrincipal -UserId $identity.Name -LogonType Interactive -RunLevel Limited
$taskSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask -TaskName $taskName -Action $taskAction -Trigger $taskTrigger -Principal $taskPrincipal -Settings $taskSettings -Force | Out-Null
Start-ScheduledTask -TaskName $taskName

$health = $null
for ($attempt = 0; $attempt -lt 20; $attempt++) {
  try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:$Port/health" -TimeoutSec 1
    break
  } catch {
    Start-Sleep -Milliseconds 250
  }
}
if (!$health.ok) { throw "WORKSPACE_LISTENER_FAILED_LOCAL_HEALTH_CHECK" }

$receipt = [ordered]@{
  schema = "brainstation_workspace_listener_install_receipt_v1"
  status = "INSTALLED_AND_RUNNING"
  machine = $Machine
  hostname = $env:COMPUTERNAME
  controller_ipv4 = $ControllerIpv4
  listener_port = $Port
  task_name = $taskName
  firewall_rule = $ruleName
  routes = @("GET /health", "GET /workspaces", "POST /workspaces/launch")
  prohibited_routes = @("packets", "shell", "browser", "auto-send")
  timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
}
$receiptPath = Join-Path $repoRoot "foreman\receipts\BRAINSTATION_WORKSPACE_LISTENER_$($Machine.ToUpperInvariant())_CURRENT.json"
$utf8 = [Text.UTF8Encoding]::new($false)
[IO.File]::WriteAllText($receiptPath, (($receipt | ConvertTo-Json -Depth 10) + [Environment]::NewLine), $utf8)
$receipt | ConvertTo-Json -Depth 10
