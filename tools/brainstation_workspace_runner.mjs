#!/usr/bin/env node

import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const MACHINE = normalizeMachine(process.env.BRAINSTATION_WORKSPACE_MACHINE || os.hostname());
const DEFAULT_HOST = process.env.BRAINSTATION_WORKSPACE_HOST || "127.0.0.1";
const DEFAULT_PORT = Number(process.env.BRAINSTATION_WORKSPACE_PORT || 4877);
const WORKSPACE_FILE =
  process.env.POWERTOYS_WORKSPACE_FILE ||
  path.join(process.env.LOCALAPPDATA || "", "Microsoft", "PowerToys", "Workspaces", "workspaces.json");
const WORKSPACE_LAUNCHER =
  process.env.POWERTOYS_WORKSPACE_LAUNCHER ||
  path.join(process.env.LOCALAPPDATA || "", "PowerToys", "PowerToys.WorkspacesLauncher.exe");
const CONTROLLER_IPS = new Set(
  String(process.env.BRAINSTATION_WORKSPACE_CONTROLLER_IPS || "")
    .split(",")
    .map((value) => value.trim().replace(/^::ffff:/, ""))
    .filter(Boolean),
);

function normalizeMachine(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "betsy") return "Betsy";
  if (text === "spanzee") return "Spanzee";
  if (text === "medullina") return "Medullina";
  return text ? text[0].toUpperCase() + text.slice(1) : "UNKNOWN";
}

function parseArgs(argv) {
  const command = argv[0] || "help";
  const args = {};
  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    args[key] = next && !next.startsWith("--") ? argv[++index] : true;
  }
  return { command, args };
}

async function fileExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function readWorkspaces() {
  if (!(await fileExists(WORKSPACE_FILE))) throw new Error(`POWERTOYS_WORKSPACE_FILE_NOT_FOUND:${WORKSPACE_FILE}`);
  const parsed = JSON.parse(await fs.readFile(WORKSPACE_FILE, "utf8"));
  if (!Array.isArray(parsed.workspaces)) throw new Error("POWERTOYS_WORKSPACES_ARRAY_MISSING");
  return parsed.workspaces;
}

function monitorIndexes(workspace) {
  return [...new Set((workspace.applications || []).map((app) => Number(app.monitor)).filter(Number.isFinite))].sort();
}

async function inventory() {
  const workspaces = await readWorkspaces();
  return {
    ok: true,
    schema: "brainstation_workspace_inventory_v1",
    machine: MACHINE,
    hostname: os.hostname(),
    workspace_file: WORKSPACE_FILE,
    launcher_available: await fileExists(WORKSPACE_LAUNCHER),
    workspaces: workspaces.map((workspace) => ({
      id: String(workspace.id || ""),
      name: String(workspace.name || "Unnamed workspace"),
      application_count: Array.isArray(workspace.applications) ? workspace.applications.length : 0,
      monitor_indexes: monitorIndexes(workspace),
    })),
  };
}

async function runLauncher(workspaceId) {
  return new Promise((resolve, reject) => {
    const child = spawn(WORKSPACE_LAUNCHER, [String(workspaceId)], { windowsHide: false });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("POWERTOYS_WORKSPACE_LAUNCH_TIMEOUT"));
    }, 60000);
    child.stdout?.on("data", (chunk) => (stdout += chunk.toString()));
    child.stderr?.on("data", (chunk) => (stderr += chunk.toString()));
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`POWERTOYS_WORKSPACE_LAUNCH_EXIT_${code}:${stderr.slice(0, 500)}`));
      else resolve({ stdout, stderr });
    });
  });
}

async function launchWorkspace(request) {
  const targetMachine = normalizeMachine(request.target_machine || MACHINE);
  if (targetMachine !== MACHINE) throw new Error(`WORKSPACE_TARGET_MISMATCH:${targetMachine}:local:${MACHINE}`);
  if (!(await fileExists(WORKSPACE_LAUNCHER))) throw new Error(`POWERTOYS_WORKSPACE_LAUNCHER_NOT_FOUND:${WORKSPACE_LAUNCHER}`);

  const requestedId = String(request.workspace_id || "").trim();
  const requestedName = String(request.workspace_name || "").trim();
  if (!requestedId && !requestedName) throw new Error("WORKSPACE_ID_OR_NAME_REQUIRED");

  const workspace = (await readWorkspaces()).find(
    (candidate) =>
      (requestedId && String(candidate.id).toLowerCase() === requestedId.toLowerCase()) ||
      (requestedName && String(candidate.name).toLowerCase() === requestedName.toLowerCase()),
  );
  if (!workspace) throw new Error(`CONFIGURED_WORKSPACE_NOT_FOUND:${requestedId || requestedName}`);
  if (requestedId && requestedName && String(workspace.name).toLowerCase() !== requestedName.toLowerCase()) {
    throw new Error(`WORKSPACE_ID_NAME_MISMATCH:${requestedId}:${requestedName}`);
  }

  if (request.dry_run === true) {
    return launchReceipt(workspace, "DRY_RUN_PASS", false);
  }
  const result = await runLauncher(workspace.id);
  return { ...launchReceipt(workspace, "WORKSPACE_LAUNCH_COMPLETE", true), launcher_stdout: result.stdout.slice(0, 1000), launcher_stderr: result.stderr.slice(0, 1000) };
}

function launchReceipt(workspace, status, launcherStarted) {
  return {
    ok: true,
    schema: "brainstation_workspace_launch_receipt_v1",
    status,
    machine: MACHINE,
    hostname: os.hostname(),
    workspace_id: workspace.id,
    workspace_name: workspace.name,
    monitor_indexes: monitorIndexes(workspace),
    launcher_started: launcherStarted,
    timestamp: new Date().toISOString(),
  };
}

function controllerAllowed(remoteAddress) {
  const address = String(remoteAddress || "").replace(/^::ffff:/, "");
  return address === "127.0.0.1" || address === "::1" || CONTROLLER_IPS.has(address);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, statusCode, value) {
  const body = JSON.stringify(value, null, 2);
  res.writeHead(statusCode, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(body) });
  res.end(body);
}

function serve(port, host) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
      if (req.method === "GET" && url.pathname === "/health") {
        sendJson(res, 200, { ok: true, schema: "brainstation_workspace_health_v1", machine: MACHINE });
        return;
      }
      if (!controllerAllowed(req.socket.remoteAddress)) {
        sendJson(res, 403, { ok: false, error: "WORKSPACE_CONTROLLER_NOT_ALLOWLISTED" });
        return;
      }
      if (req.method === "GET" && url.pathname === "/workspaces") {
        sendJson(res, 200, await inventory());
        return;
      }
      if (req.method === "POST" && url.pathname === "/workspaces/launch") {
        sendJson(res, 200, await launchWorkspace(await readBody(req)));
        return;
      }
      sendJson(res, 404, { ok: false, error: "NOT_FOUND" });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error.message });
    }
  });
  server.listen(port, host, () => {
    console.log(JSON.stringify({ ok: true, event: "brainstation_workspace_listener_ready", machine: MACHINE, host, port }));
  });
}

async function main() {
  const { command, args } = parseArgs(process.argv.slice(2));
  if (command === "inventory") {
    console.log(JSON.stringify(await inventory(), null, 2));
    return;
  }
  if (command === "launch") {
    console.log(
      JSON.stringify(
        await launchWorkspace({
          target_machine: args.machine || MACHINE,
          workspace_id: args["workspace-id"] || "",
          workspace_name: args["workspace-name"] || "",
          dry_run: args["dry-run"] === "true",
        }),
        null,
        2,
      ),
    );
    return;
  }
  if (command === "serve") {
    serve(Number(args.port || DEFAULT_PORT), String(args.host || DEFAULT_HOST));
    return;
  }
  console.log("Usage: node tools/brainstation_workspace_runner.mjs inventory | launch --machine <name> --workspace-name <name> [--workspace-id <id>] [--dry-run true] | serve [--host 0.0.0.0] [--port 4877]");
  if (command !== "help") process.exitCode = 2;
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});
