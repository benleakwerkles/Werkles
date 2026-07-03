import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const execFileAsync = promisify(execFile);

const POWERSHELL = "powershell.exe";
const POWERSHELL_ARGS = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command"] as const;

const COMMANDS = {
  PROBE_SWATTER: {
    label: "Probe Swatter",
    command: POWERSHELL,
    args: [
      ...POWERSHELL_ARGS,
      `
$ErrorActionPreference = 'Continue'
"SWATTER_PROBE"
"hostname=$env:COMPUTERNAME"
"timestamp=$((Get-Date).ToString("o"))"
"--- services ---"
Get-Service -Name RustDesk,GoogleDriveFS -ErrorAction SilentlyContinue |
  Select-Object Name,Status,DisplayName |
  Format-Table -AutoSize |
  Out-String
"--- known processes ---"
Get-CimInstance Win32_Process -Filter "name = 'cmd.exe' or name = 'conhost.exe' or name = 'WerFault.exe' or name = 'RustDesk.exe' or name = 'GoogleDriveFS.exe'" |
  Select-Object ProcessId,ParentProcessId,Name,CommandLine |
  Format-Table -Wrap |
  Out-String
"--- visible windows ---"
Get-Process |
  Where-Object { $_.MainWindowTitle } |
  Select-Object ProcessName,Id,Responding,MainWindowTitle |
  Format-Table -Wrap |
  Out-String
      `.trim(),
    ],
    destructive: false,
    safeguards: ["read-only probe", "no arbitrary shell input", "no process termination"],
  },
  SWAT_CMD_ERROR_DIALOG: {
    label: "Close cmd.exe Application Error",
    command: POWERSHELL,
    args: [
      ...POWERSHELL_ARGS,
      `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
$title = 'cmd.exe - Application Error'
$wshell = New-Object -ComObject WScript.Shell
$activated = $wshell.AppActivate($title)
Start-Sleep -Milliseconds 300
if ($activated) {
  [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
  "closed_dialog_title=$title"
  "action=send_enter"
} else {
  "dialog_not_found=$title"
}
      `.trim(),
    ],
    destructive: false,
    safeguards: ["exact dialog title only", "normal Enter/OK path", "no process termination"],
  },
  SWAT_UNRESPONSIVE_RUSTDESK_VIEWERS: {
    label: "Swat Unresponsive RustDesk Viewers",
    command: POWERSHELL,
    args: [
      ...POWERSHELL_ARGS,
      `
$ErrorActionPreference = 'Stop'
$servicePid = $null
$serviceText = & sc.exe queryex RustDesk 2>$null
foreach ($line in $serviceText) {
  if ($line -match 'PID\\s*:\\s*(\\d+)') {
    $servicePid = [int]$Matches[1]
  }
}
$targets = Get-Process -Name RustDesk -ErrorAction SilentlyContinue |
  Where-Object {
    $_.Id -ne $servicePid -and
    $_.MainWindowTitle -match 'Remote Desktop - RustDesk' -and
    -not $_.Responding
  }
if (-not $targets) {
  "no_matching_unresponsive_rustdesk_viewers"
  if ($servicePid) { "rustdesk_service_pid=$servicePid" }
  exit 0
}
foreach ($target in $targets) {
  $title = $target.MainWindowTitle
  Stop-Process -Id $target.Id -Force
  "killed_pid=$($target.Id)"
  "killed_title=$title"
}
if ($servicePid) { "rustdesk_service_pid_preserved=$servicePid" }
      `.trim(),
    ],
    destructive: true,
    safeguards: [
      "only RustDesk.exe processes",
      "only Remote Desktop window titles",
      "only unresponsive windows",
      "RustDesk service PID preserved",
      "no arbitrary PID input",
    ],
  },
} as const;

type CommandId = keyof typeof COMMANDS;
type Verdict = "SWAT" | "WATCH" | "STOP";

type SwatterReceipt = {
  verdict: Verdict;
  command_id: CommandId | "UNKNOWN";
  executed: boolean;
  machine: "SALLY";
  timestamp: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  destructive: boolean;
  safeguards: string[];
  error?: string;
};

function isCommandId(value: unknown): value is CommandId {
  return typeof value === "string" && value in COMMANDS;
}

function receipt(body: SwatterReceipt, status = 200) {
  return NextResponse.json(body, { status });
}

function rejectedReceipt(commandId: unknown): SwatterReceipt {
  return {
    verdict: "STOP",
    command_id: "UNKNOWN",
    executed: false,
    machine: "SALLY",
    timestamp: new Date().toISOString(),
    stdout: "",
    stderr: "",
    exit_code: 64,
    destructive: false,
    safeguards: ["command ID allowlist enforced", "unknown command blocked"],
    error: `unknown_command_id:${String(commandId)}`,
  };
}

async function runSwatterCommand(commandId: CommandId): Promise<SwatterReceipt> {
  const command = COMMANDS[commandId];
  try {
    const { stdout, stderr } = await execFileAsync(command.command, command.args, {
      encoding: "utf8",
      timeout: 10000,
      windowsHide: true,
      maxBuffer: 1024 * 1024,
    });

    return {
      verdict: "SWAT",
      command_id: commandId,
      executed: true,
      machine: "SALLY",
      timestamp: new Date().toISOString(),
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      exit_code: 0,
      destructive: command.destructive,
      safeguards: [...command.safeguards],
    };
  } catch (error) {
    const failed = error as Error & {
      stdout?: string;
      stderr?: string;
      code?: number | string;
    };
    return {
      verdict: "WATCH",
      command_id: commandId,
      executed: true,
      machine: "SALLY",
      timestamp: new Date().toISOString(),
      stdout: failed.stdout?.trim() || "",
      stderr: failed.stderr?.trim() || "",
      exit_code: typeof failed.code === "number" ? failed.code : 1,
      destructive: command.destructive,
      safeguards: [...command.safeguards],
      error: failed.message,
    };
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Swatter V0",
    machine: "SALLY",
    commands: Object.entries(COMMANDS).map(([command_id, command]) => ({
      command_id,
      label: command.label,
      destructive: command.destructive,
      safeguards: command.safeguards,
    })),
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { command_id?: unknown };
  if (!isCommandId(body.command_id)) {
    return receipt(rejectedReceipt(body.command_id), 400);
  }

  return receipt(await runSwatterCommand(body.command_id));
}
