#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const DEFAULT_CONFIG_PATH = path.join(ROOT, "foreman", "soledash", "POWERToys_AUTOPASTE_HELPER_CONFIG.json");
const EVENTS_PATH = path.join(ROOT, "data", "organism", "events.jsonl");

function usage() {
  return [
    "Usage:",
    "  node scripts/foreman/powertoys-autopaste-helper.mjs --packet-id <id> --target-aeye <aeye> --target-machine <machine> --packet-text <text> [--workspace-target <name>]",
    "",
    "Optional:",
    "  --packet-file <path>          Read packet text from file instead of --packet-text.",
    "  --workspace-target <name>     Open/focus a configured workspace target. Defaults to config default.",
    "  --config <path>               Override config path.",
  ].join("\n");
}

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);

    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) throw new Error(`Missing value for --${key}`);
    args[key] = next;
    i += 1;
  }

  return {
    packetId: args["packet-id"]?.trim(),
    targetAeye: args["target-aeye"]?.trim(),
    targetMachine: args["target-machine"]?.trim(),
    packetText: args["packet-text"],
    packetFile: args["packet-file"]?.trim(),
    workspaceTarget: args["workspace-target"]?.trim(),
    configPath: args.config ? path.resolve(ROOT, args.config) : DEFAULT_CONFIG_PATH,
  };
}

function assertRequired(input) {
  const missing = [];
  if (!input.packetId) missing.push("--packet-id");
  if (!input.targetAeye) missing.push("--target-aeye");
  if (!input.targetMachine) missing.push("--target-machine");
  if (!input.packetText && !input.packetFile) missing.push("--packet-text or --packet-file");
  if (input.packetText && input.packetFile) missing.push("choose only one of --packet-text or --packet-file");

  if (missing.length > 0) {
    throw new Error(`Missing/invalid arguments: ${missing.join(", ")}\n\n${usage()}`);
  }
}

function run(command, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${command} exited ${code}: ${stderr || stdout}`.trim()));
    });

    if (input) child.stdin.end(input);
    else child.stdin.end();
  });
}

async function readPacketText(input) {
  if (input.packetFile) {
    return fs.readFile(path.resolve(ROOT, input.packetFile), "utf8");
  }

  return input.packetText;
}

async function setClipboard(packetText) {
  // Clipboard only. This does not type into a chat box, click Send, or automate a browser/session.
  try {
    await run(
      "powershell.exe",
      [
        "-Sta",
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        [
          "$text = [Console]::In.ReadToEnd();",
          "for ($i = 0; $i -lt 5; $i++) {",
          "  try { Set-Clipboard -Value $text; exit 0 }",
          "  catch { Start-Sleep -Milliseconds 200 }",
          "}",
          "exit 1",
        ].join(" "),
      ],
      packetText,
    );
    return;
  } catch {
    await run("cmd.exe", ["/d", "/c", "clip"], packetText);
  }
}

function normalizeClipboardText(value) {
  return String(value ?? "").replace(/\r\n/g, "\n").replace(/\n+$/g, "");
}

async function getClipboard() {
  const result = await run(
    "powershell.exe",
    [
      "-Sta",
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      "Get-Clipboard -Raw",
    ],
  );
  return result.stdout;
}

async function verifyClipboard(packetText) {
  const clipboardText = await getClipboard();
  if (normalizeClipboardText(clipboardText) !== normalizeClipboardText(packetText)) {
    throw new Error("Clipboard verification failed after write.");
  }
}

async function readConfig(configPath) {
  try {
    const raw = await fs.readFile(configPath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return {
        schema: "powertoys_autopaste_helper_config_v0",
        default_workspace_target: "none",
        workspace_targets: {
          none: { mode: "none", label: "Clipboard only" },
        },
      };
    }

    throw error;
  }
}

function spawnDetached(command, args) {
  const child = spawn(command, args, {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
    windowsHide: false,
  });
  child.unref();
}

async function activateWindow(title) {
  const script = [
    "Add-Type -AssemblyName Microsoft.VisualBasic;",
    "$title = [Console]::In.ReadToEnd();",
    "if ([Microsoft.VisualBasic.Interaction]::AppActivate($title.Trim())) { exit 0 }",
    "exit 3",
  ].join(" ");

  await run("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script], title);
}

async function openWorkspaceTarget(config, targetName) {
  const workspaceTarget = targetName || config.default_workspace_target || "none";
  const target = config.workspace_targets?.[workspaceTarget];

  if (!target) {
    throw new Error(`Workspace target not configured: ${workspaceTarget}`);
  }

  if (target.mode === "none") {
    return { workspace: workspaceTarget, workspace_action: "none", focus_attempted: false };
  }

  if (target.enabled === false) {
    return { workspace: workspaceTarget, workspace_action: "disabled", focus_attempted: false };
  }

  if (target.mode === "process") {
    if (!target.command) throw new Error(`Workspace target ${workspaceTarget} is missing command`);
    if (path.basename(target.command).toLowerCase() === "powertoys.workspaceslauncher.exe" && (!Array.isArray(target.args) || target.args.length === 0)) {
      return {
        workspace: workspaceTarget,
        workspace_action: "missing_workspace_id",
        focus_attempted: false,
      };
    }
    spawnDetached(target.command, Array.isArray(target.args) ? target.args.map(String) : []);
    return { workspace: workspaceTarget, workspace_action: "process_started", focus_attempted: true };
  }

  if (target.mode === "window_title") {
    if (!target.window_title) throw new Error(`Workspace target ${workspaceTarget} is missing window_title`);
    await activateWindow(String(target.window_title));
    return { workspace: workspaceTarget, workspace_action: "window_focused", focus_attempted: true };
  }

  throw new Error(`Unsupported workspace target mode for ${workspaceTarget}: ${target.mode}`);
}

async function appendAutopasteEvent(params) {
  const event = {
    event_type: "autopaste_ready",
    packet_id: params.packetId,
    target_aeye: params.targetAeye,
    target_machine: params.targetMachine,
    workspace: params.workspace,
    timestamp: new Date().toISOString(),
    clipboard_set: true,
    focus_attempted: params.focusAttempted,
  };

  await fs.mkdir(path.dirname(EVENTS_PATH), { recursive: true });
  await fs.appendFile(EVENTS_PATH, `${JSON.stringify(event)}\n`, "utf8");
  return event;
}

async function main() {
  try {
    const input = parseArgs(process.argv.slice(2));
    assertRequired(input);

    const packetText = await readPacketText(input);
    const config = await readConfig(input.configPath);
    await setClipboard(packetText);
    await verifyClipboard(packetText);
    const workspace = await openWorkspaceTarget(config, input.workspaceTarget);
    const event = await appendAutopasteEvent({
      packetId: input.packetId,
      targetAeye: input.targetAeye,
      targetMachine: input.targetMachine,
      workspace: workspace.workspace,
      focusAttempted: workspace.focus_attempted,
    });

    console.log(JSON.stringify({ ok: true, event_path: path.relative(ROOT, EVENTS_PATH).replace(/\\/g, "/"), event }, null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
    process.exitCode = 1;
  }
}

await main();
