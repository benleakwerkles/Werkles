#!/usr/bin/env node
/**
 * Foreman Control Panel — local operator dashboard (127.0.0.1:4317)
 * Bean hardening: PID-safe port, local POST token, Drop Zone validation, server-confirmed UI.
 * Doctrine: safe local actions only. Stops before Send.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { verifyAllRelayTabDestinations } from "./relay-courier-lib.mjs";
import { classifyGdCommand, formatGdCommandVerdict } from "../../foreman/gd-intent-router/gd-command-governor.mjs";
import { buildSpeakerStatus, draftSpeakerEntry } from "../../foreman/speaker/speaker-lib.mjs";

const REPO_ROOT = "C:\\Users\\benle\\Desktop\\github\\Werkles";
const PORT = 4317;
const HOST = "127.0.0.1";
const CONTROL_PANEL_DIR = path.join(REPO_ROOT, "foreman", "control-panel");
const PID_FILE = path.join(CONTROL_PANEL_DIR, "foreman-control.pid");
const TOKEN_FILE = path.join(CONTROL_PANEL_DIR, ".local_token");
const DROP_ZONE_MAX_BYTES = 100 * 1024;
const FOREMAN_SCRIPT_MARKER = "foreman-control-server.mjs";

const DISPATCH_PS1 = path.join(REPO_ROOT, "scripts", "foreman", "crew-dispatch-console.ps1");
const DISPATCH_CONFIG = path.join(REPO_ROOT, "foreman", "crew-dispatch-console", "dispatch-config.json");
const PACKET_TEMPLATE = path.join(REPO_ROOT, "foreman", "crew-dispatch-console", "templates", "packet.template.md");
const PASTE_TEMPLATE = path.join(REPO_ROOT, "foreman", "crew-dispatch-console", "templates", "paste-block.template.txt");
const DESIGN_TOKENS_TS = path.join(REPO_ROOT, "lib", "design-tokens.ts");
const GLOBALS_CSS = path.join(REPO_ROOT, "app", "globals.css");

const PATHS = {
  outbox: path.join(REPO_ROOT, "foreman", "handoffs", "outbox"),
  inbox: path.join(REPO_ROOT, "foreman", "handoffs", "inbox"),
  reviews: path.join(REPO_ROOT, "foreman", "reviews"),
  nextAction: path.join(REPO_ROOT, "foreman", "NEXT_ACTION.md"),
  currentState: path.join(REPO_ROOT, "foreman", "CURRENT_STATE.md"),
  operatorDashboard: path.join(REPO_ROOT, "foreman", "OPERATOR_DASHBOARD.md"),
  activeAgent: path.join(REPO_ROOT, "foreman", "ACTIVE_AGENT.md"),
  budget: path.join(REPO_ROOT, "foreman", "BUDGET.md"),
  dispatchDashboardJson: path.join(REPO_ROOT, "foreman", "crew-dispatch-console", "DISPATCH_DASHBOARD.json"),
  latestDispatchJson: path.join(REPO_ROOT, "foreman", "crew-dispatch-console", "LATEST_DISPATCH.json"),
};

const CREW_TABS_CONFIG = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-tabs.config.json");
const EDGE_AEYE_PROFILE = path.join(REPO_ROOT, "foreman", ".edge-aeye-crew-profile");
const OPEN_AEYE_CREW_CMD = path.join(REPO_ROOT, "open-aeye-crew.cmd");
const CREW_DISPATCH_BAT = path.join(REPO_ROOT, "crew-dispatch.bat");
const FINANCE_DASHBOARD_JSON = path.join(REPO_ROOT, "foreman", "finance", "finance-dashboard.json");
const FINANCE_COMMAND_MJS = path.join(REPO_ROOT, "scripts", "foreman", "finance-command.mjs");
const CREW_RELAY_INTAKE = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-response-intake.mjs");
const CREW_RELAY_GENERATOR = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-packet-generator.mjs");
const CREW_RELAY_LIB = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-relay-lib.mjs");
const CREW_RELAY_NETWORK_CMD = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-relay-network-command.mjs");
const CREW_EDGE_COURIER_MJS = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-edge-courier.mjs");
const CREW_EDGE_COURIER_PS1 = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-edge-courier.ps1");
const CREW_RELAY_RUNNER = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-relay-runner.mjs");
const LATEST_NETWORK_COMMAND_JSON = path.join(REPO_ROOT, "foreman", "crew-dispatch", "LATEST_NETWORK_COMMAND.json");
const RELAY_COURIER_MJS = path.join(REPO_ROOT, "scripts", "foreman", "relay-courier.mjs");
const RELAY_LOCK_JSON = path.join(REPO_ROOT, "foreman", "crew-dispatch", "RELAY_LOCK.json");
const CONTEXT_HEALTH_JSON = path.join(REPO_ROOT, "foreman", "crew-dispatch", "context-health.json");
const BUILD_BOOT_PACKET_MJS = path.join(REPO_ROOT, "foreman", "crew-dispatch", "build-boot-packet.mjs");
const IMAGERY_DIRECTION = path.join(REPO_ROOT, "foreman", "IMAGERY_DIRECTION.md");
const IMAGERY_PROMPT_TEMPLATE = path.join(REPO_ROOT, "foreman", "ghost-forge", "IMAGERY_PROMPT_TEMPLATE.md");
const ENDER_IMAGERY_WIRE_PACKET = path.join(REPO_ROOT, "foreman", "handoffs", "outbox", "TO_ENDER_IMAGERY_DIRECTION_WIRE_v0.1.md");
const CREW_PACKET_GENERATOR = path.join(REPO_ROOT, "foreman", "crew-dispatch", "crew-packet-generator.mjs");
const GD_ROUTER_MJS = path.join(REPO_ROOT, "foreman", "gd-intent-router", "gd-intent-router.mjs");
const THREAD_REFRESH_PACKET = path.join(REPO_ROOT, "foreman", "handoffs", "outbox", "THREAD_REFRESH_PACKET.md");
const GD_MISSION_CLASSES = path.join(REPO_ROOT, "foreman", "gd-intent-router", "mission-classes.json");
const GD_RUNS_DIR = path.join(REPO_ROOT, "foreman", "gd-intent-router", "runs");

const COUSIN_BY_ROLE = {
  petra: "PETRA",
  skybro: "SKYBRO",
  ender: "ENDER",
  bean: "BEAN",
  computer: "COMPUTER",
};

const FINANCE_BLOCKED_ACTIONS = [
  { id: "finance-create-bank", label: "Create bank account" },
  { id: "finance-virtual-card", label: "Create virtual card" },
  { id: "finance-change-billing", label: "Change billing method" },
  { id: "finance-pay-vendor", label: "Pay vendor" },
  { id: "finance-transfer", label: "Transfer funds" },
  { id: "finance-submit-reimbursement", label: "Submit reimbursement" },
  { id: "finance-connect-bank", label: "Connect financial account" },
  { id: "finance-import-bank", label: "Import bank data (new source)" },
];

const CREW_COUSIN_IDS = {
  petra: "PETRA",
  skybro: "SKYBRO",
  ender: "ENDER",
  bean: "BEAN",
  computer: "COMPUTER",
};

const ROLES = {
  petra: {
    id: "petra",
    label: "Petra",
    title: "ChatGPT Comptroller",
    platform: "ChatGPT / Cockpit / Ayes",
    packetPrefix: "TO_PETRA",
    pasteBlockSuffix: "PETRA_PASTE_BLOCK.txt",
    ps1Role: "petra",
  },
  skybro: {
    id: "skybro",
    label: "Skybro",
    title: "Gemini architecture / product exploration",
    platform: "Gemini Gem",
    packetPrefix: "TO_SKYBRO",
    pasteBlockSuffix: "SKYBRO_PASTE_BLOCK.txt",
    ps1Role: null,
  },
  ender: {
    id: "ender",
    label: "Ender",
    title: "Claude UX / brand",
    platform: "Claude",
    packetPrefix: "TO_CLAUDE",
    pasteBlockSuffix: "ENDER_PASTE_BLOCK.txt",
    ps1Role: "ender",
  },
  bean: {
    id: "bean",
    label: "Bean",
    title: "DeepSeek trust audit",
    platform: "DeepSeek",
    packetPrefix: "TO_BEAN",
    pasteBlockSuffix: "BEAN_PASTE_BLOCK.txt",
    ps1Role: "bean",
  },
  computer: {
    id: "computer",
    label: "Computer",
    title: "Perplexity research / current-world checks",
    platform: "Perplexity Computer",
    packetPrefix: "TO_COMPUTER",
    pasteBlockSuffix: "COMPUTER_PASTE_BLOCK.txt",
    ps1Role: null,
  },
};

const BLOCKED_ACTIONS = [
  { id: "deploy", label: "Deploy to production" },
  { id: "push", label: "Git push / merge" },
  { id: "sql", label: "Apply SQL / schema" },
  { id: "ghost-forge", label: "Run Ghost Forge batch" },
  { id: "education-forge", label: "Run Education Forge" },
  { id: "send-packet", label: "Send packet to external AI" },
  { id: "stripe", label: "Create live Stripe products" },
  { id: "oauth", label: "OAuth / billing / provider setup" },
  { id: "secrets", label: "Read / print / store secrets" },
];

const GATE_REVIEW_MAP = {
  AUTOMATION_AUTHORITY: path.join(REPO_ROOT, "foreman", "reviews", "AUTOMATION_AUTHORITY_REVIEW.html"),
  AUTOMATION_AUTHORITY_DOCTRINE_REVIEW: path.join(
    REPO_ROOT,
    "foreman",
    "reviews",
    "AUTOMATION_AUTHORITY_REVIEW.html"
  ),
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readText(filePath, maxLines = null) {
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: `Missing: ${rel(filePath)}`, text: "" };
  }
  const raw = fs.readFileSync(filePath, "utf8");
  if (!maxLines) return { ok: true, text: raw };
  return { ok: true, text: raw.split(/\r?\n/).slice(0, maxLines).join("\n") };
}

function rel(absPath) {
  return path.relative(REPO_ROOT, absPath).replace(/\\/g, "/");
}

function parseEffectiveGate(markdown) {
  const m = markdown.match(/\*\*Effective gate:\*\*\s*`([^`]+)`/);
  if (m) return m[1].trim();
  const m2 = markdown.match(/^\[ACTIVE:[^\]]+\]/m);
  if (m2) return m2[0].trim();
  return "(gate not found)";
}

function parseStateSummary(markdown) {
  const lines = [];
  let inSection = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (line.startsWith("## Morale deploy")) inSection = true;
    if (inSection && line.startsWith("## ") && !line.includes("Morale deploy")) break;
    if (inSection && line.trim()) lines.push(line);
  }
  if (lines.length) return lines.slice(0, 8).join("\n");
  return readText(PATHS.currentState, 14).text;
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    let raw = fs.readFileSync(filePath, "utf8");
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadDispatchConfig() {
  return loadJson(DISPATCH_CONFIG) || { cockpitSources: [], missions: {} };
}

function pickCssVar(css, name) {
  const m = css.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  return m?.[1] || null;
}

function pickTsColor(ts, name) {
  const m = ts.match(new RegExp(`${name}:\\s*"([^"]+)"`));
  return m?.[1] || null;
}

/** Inline CSS vars synced from lib/design-tokens.ts + app/globals.css — not independent palette law. */
function loadPanelTheme() {
  const ts = fs.existsSync(DESIGN_TOKENS_TS) ? fs.readFileSync(DESIGN_TOKENS_TS, "utf8") : "";
  const css = fs.existsSync(GLOBALS_CSS) ? fs.readFileSync(GLOBALS_CSS, "utf8") : "";
  return {
    paper: pickCssVar(css, "--werkles-workshop-paper-elevated") || pickCssVar(css, "--werkles-workshop-paper") || "#fffaf2",
    paperSoft: pickCssVar(css, "--werkles-workshop-paper") || "#f6efe5",
    ink: pickCssVar(css, "--werkles-ink-on-paper") || pickTsColor(ts, "smoke") || "#2c231d",
    inkMuted: pickCssVar(css, "--werkles-ink-muted-on-paper") || pickTsColor(ts, "textMuted") || "#5c4a3a",
    copper: pickTsColor(ts, "copper") || "#9F6633",
    ok: pickTsColor(ts, "owlEyeGreen") || "#5FD178",
    wait: pickTsColor(ts, "forgeOrange") || "#F6AD55",
    stop: pickTsColor(ts, "violetDeep") || "#2A0E8C",
    panelBorder: "rgba(159, 102, 51, 0.25)",
    gateBg: pickCssVar(css, "--werkles-workshop-paper") || "#fff3d6",
  };
}

function ensureControlPanelDir() {
  fs.mkdirSync(CONTROL_PANEL_DIR, { recursive: true });
}

function ensureLocalToken() {
  ensureControlPanelDir();
  if (fs.existsSync(TOKEN_FILE)) {
    return fs.readFileSync(TOKEN_FILE, "utf8").trim();
  }
  const token = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(TOKEN_FILE, token, "utf8");
  return token;
}

function loadPidRecord() {
  if (!fs.existsSync(PID_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(PID_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writePidRecord() {
  ensureControlPanelDir();
  const record = {
    pid: process.pid,
    port: PORT,
    host: HOST,
    startedAt: new Date().toISOString(),
    script: FOREMAN_SCRIPT_MARKER,
    commandLine: process.argv.join(" "),
  };
  fs.writeFileSync(PID_FILE, JSON.stringify(record, null, 2), "utf8");
}

function removePidRecord() {
  if (fs.existsSync(PID_FILE)) {
    try {
      fs.unlinkSync(PID_FILE);
    } catch {
      /* ignore */
    }
  }
}

function runCommand(exe, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { windowsHide: true, cwd: options.cwd || undefined });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(stderr.trim() || stdout.trim() || `${exe} exit ${code}`));
      else resolve(stdout.trim());
    });
  });
}

function runNodeScript(scriptPath, args = []) {
  return runCommand("node", [scriptPath, ...args], { cwd: REPO_ROOT });
}

function runNodeScriptAllowFail(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [scriptPath, ...args], { cwd: REPO_ROOT, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr?.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

async function stampRelayMetadata(packetFile, roleKey) {
  const cousin = COUSIN_BY_ROLE[roleKey];
  if (!cousin || !packetFile || !fs.existsSync(packetFile)) return null;
  const mod = await import(pathToFileURL(CREW_RELAY_LIB).href);
  const packetId = path.basename(packetFile, ".md");
  return mod.stampOutgoingPacket(packetFile, cousin, packetId);
}

async function runCrewRelay(action, extraArgs = []) {
  const result = await runNodeScriptAllowFail(CREW_RELAY_INTAKE, [action, ...extraArgs]);
  return result;
}

async function getListeningPid(port) {
  const out = await runCommand("netstat", ["-ano"]);
  const lines = out.split(/\r?\n/);
  for (const line of lines) {
    if (!line.includes("LISTENING")) continue;
    if (!line.includes(`127.0.0.1:${port}`) && !line.includes(`[::1]:${port}`)) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parseInt(parts[parts.length - 1], 10);
    if (!Number.isNaN(pid)) return pid;
  }
  return null;
}

async function runCommandWithTimeout(exe, args, timeoutMs = 8000, options = {}) {
  return Promise.race([
    runCommand(exe, args, options),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${exe} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

async function getProcessCommandLine(pid) {
  try {
    const tasklistOut = await runCommandWithTimeout(
      "tasklist",
      ["/FI", `PID eq ${pid}`, "/FO", "LIST", "/V"],
      4000
    );
    const m = tasklistOut.match(/Command Line:\s*(.+)/i);
    if (m?.[1]) return m[1].trim();
  } catch {
    /* fall through */
  }

  try {
    const out = await runCommandWithTimeout(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}" -ErrorAction SilentlyContinue).CommandLine`,
      ],
      5000
    );
    return out.trim();
  } catch {
    return "";
  }
}

function isForemanControlProcess(commandLine) {
  return commandLine.includes(FOREMAN_SCRIPT_MARKER);
}

async function killProcess(pid, timeoutMs = 8000) {
  await runCommandWithTimeout("taskkill", ["/PID", String(pid), "/F"], timeoutMs);
}

function probeForemanHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://${HOST}:${PORT}/api/status`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function probeGimpDashRoute() {
  return new Promise((resolve) => {
    const req = http.get(`http://${HOST}:${PORT}/`, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        const integrated =
          res.statusCode === 200 &&
          body.includes('id="gimpdash"') &&
          body.includes('id="gd-intent-input"') &&
          body.includes('id="gd-route-btn"');
        resolve(integrated);
      });
    });
    req.on("error", () => resolve(false));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/** @returns {"free"|"already_running"|"cleared"} */
async function ensurePortAvailable() {
  let listenerPid = await getListeningPid(PORT);
  if (!listenerPid) return "free";

  const healthy = await probeForemanHealth();
  if (healthy) {
    console.log(
      `Foreman Control Panel already running on http://${HOST}:${PORT} (PID ${listenerPid}). Opening browser.`
    );
    return "already_running";
  }

  const pidRecord = loadPidRecord();
  const pidMatchesRecord = pidRecord && pidRecord.pid === listenerPid;
  const commandLine = pidMatchesRecord ? "" : await getProcessCommandLine(listenerPid);
  const isForeman = pidMatchesRecord || isForemanControlProcess(commandLine);

  if (isForeman) {
    console.log(`Clearing unhealthy Foreman Control Panel PID ${listenerPid}.`);
    try {
      await killProcess(listenerPid);
    } catch (err) {
      throw new Error(
        `HUMAN GATE REQUIRED: could not stop stale Foreman PID ${listenerPid} (${err.message}). Close it manually, then retry.`
      );
    }
    await sleep(600);
    listenerPid = await getListeningPid(PORT);
    if (listenerPid) {
      throw new Error(
        `HUMAN GATE REQUIRED: port ${PORT} still occupied after clearing stale Foreman PID. Close the process manually.`
      );
    }
    return "cleared";
  }

  throw new Error(
    `HUMAN GATE REQUIRED: port ${PORT} is occupied by unknown process PID ${listenerPid}. ` +
      `This panel will not kill arbitrary processes. Close the occupant manually, then retry.`
  );
}

function verifyLocalToken(req) {
  const header = req.headers["x-foreman-local-token"];
  const token = ensureLocalToken();
  return typeof header === "string" && header === token;
}

function timestampSlug() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "-" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds())
  );
}

function sanitizeSlug(input) {
  if (input == null || input === "") return "drop";
  const raw = String(input);
  if (/[\\/]|\.\./.test(raw) || raw.includes("\0")) {
    throw new Error("Invalid slug: path separators or traversal rejected");
  }
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  if (!slug) throw new Error("Invalid slug after sanitization");
  return slug;
}

function validateDropContent(content) {
  if (typeof content !== "string") throw new Error("Content must be text");
  if (content.includes("\0")) throw new Error("Invalid content");
  const bytes = Buffer.byteLength(content, "utf8");
  if (bytes === 0) throw new Error("Empty content");
  if (bytes > DROP_ZONE_MAX_BYTES) throw new Error("Input exceeds 100KB limit");
  return content;
}

function buildInboxFilename(slugHint) {
  const slug = sanitizeSlug(slugHint);
  const filename = `${timestampSlug()}-${slug}.md`;
  if (!filename.endsWith(".md")) throw new Error("Only .md files allowed");
  if (/[\\/]|\.\./.test(filename)) throw new Error("Generated filename rejected");
  return filename;
}

function resolveInboxFile(filename) {
  if (!filename.endsWith(".md")) throw new Error("Only .md files allowed");
  if (/[\\/]|\.\./.test(filename) || path.basename(filename) !== filename) {
    throw new Error("Path traversal rejected");
  }
  const resolved = path.resolve(PATHS.inbox, filename);
  const inboxResolved = path.resolve(PATHS.inbox);
  if (!resolved.startsWith(inboxResolved + path.sep)) {
    throw new Error("Path traversal rejected");
  }
  return resolved;
}

function listInboxMarkdownFiles() {
  if (!fs.existsSync(PATHS.inbox)) return [];
  return fs
    .readdirSync(PATHS.inbox)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({
      name: f,
      path: rel(path.join(PATHS.inbox, f)),
      updatedAt: fs.statSync(path.join(PATHS.inbox, f)).mtime.toISOString(),
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function listOutboxUnsent() {
  if (!fs.existsSync(PATHS.outbox)) return [];
  return fs
    .readdirSync(PATHS.outbox)
    .filter((f) => /^TO_[A-Z]+_.*\.md$/i.test(f))
    .map((f) => ({
      name: f,
      path: rel(path.join(PATHS.outbox, f)),
      updatedAt: fs.statSync(path.join(PATHS.outbox, f)).mtime.toISOString(),
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 12);
}

async function saveDropZone(content, slugHint) {
  const validated = validateDropContent(content);
  const filename = buildInboxFilename(slugHint);
  const target = resolveInboxFile(filename);
  fs.mkdirSync(PATHS.inbox, { recursive: true });
  fs.writeFileSync(target, validated, "utf8");
  return { filename, path: rel(target), bytes: Buffer.byteLength(validated, "utf8") };
}

function expandTemplate(template, tokens) {
  let out = template;
  for (const [key, value] of Object.entries(tokens)) {
    out = out.split(`{{${key}}}`).join(String(value ?? ""));
  }
  return out;
}

function getNextActionHeadline() {
  const { text } = readText(PATHS.nextAction);
  return parseEffectiveGate(text);
}

function getActiveWriterSnippet() {
  return readText(PATHS.activeAgent, 8).text;
}

function roleActionText(roleId) {
  switch (roleId) {
    case "petra":
      return `Reply using the VERDICT block format:
- SLICE, GATE_05, UI_COMMIT, CODEX, MAKER
- CONDITIONS + DOWNSTREAM_HANDOFFS + NEXT_HUMAN_GATE`;
    case "skybro":
      return `Architecture and product exploration only.
Return options, systems, and matching logic. Do not claim implementation.`;
    case "ender":
      return `UX/brand review only. Return recommendations; do not claim implementation.`;
    case "bean":
      return `Trust/compliance audit only. Flag forbidden claims and gate risks.`;
    case "computer":
      return `Research and current-world checks only.
Cite sources; flag policy/pricing risks; no spend.`;
    default:
      return "Follow the attached packet. Stop before any Send action.";
  }
}

function roleResponseFormat(roleId) {
  switch (roleId) {
    case "petra":
      return [
        "VERDICT: GO | NO-GO | GO_WITH_CONDITIONS",
        "SLICE: ...",
        "GATE_05: RESUME | PAUSE | STOP",
        "UI_COMMIT: ...",
        "CODEX: ...",
        "MAKER: ...",
      ].join("\n");
    default:
      return "Structured review with explicit GO/NO-GO if applicable.";
  }
}

function generatePacketNode(roleKey, missionId = "crew-checkin") {
  const role = ROLES[roleKey];
  if (!role) throw new Error(`Unknown role: ${roleKey}`);

  const config = loadDispatchConfig();
  const mission = config.missions?.[missionId];
  if (!mission) throw new Error(`Unknown mission: ${missionId}`);

  const packetId = `${role.packetPrefix}_${missionId.toUpperCase().replace(/-/g, "_")}_v2_${timestampSlug().slice(0, 13)}`;
  const packetFile = path.join(PATHS.outbox, `${packetId}.md`);
  const pasteFile = path.join(PATHS.outbox, role.pasteBlockSuffix);

  const cockpitFiles = [...(config.cockpitSources || [])];
  if (mission.cockpitExtras) {
    for (const extra of mission.cockpitExtras) {
      if (!cockpitFiles.includes(extra)) cockpitFiles.push(extra);
    }
  }

  const cockpitTable = cockpitFiles.map((f) => `| \`${f}\` | cockpit source |`).join("\n");
  const cockpitList = cockpitFiles.map((f) => `   ${f}`).join("\n");
  const statusSnippet = [getNextActionHeadline(), "", getActiveWriterSnippet()].join("\n");
  const generatedAt = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");

  const tokens = {
    ROLE_LABEL: role.label,
    ROLE_TITLE: role.title,
    ROLE_UPPER: role.label.toUpperCase(),
    ROLE_ID: role.id,
    ROLE_PLATFORM: role.platform,
    MISSION_ID: missionId,
    MISSION_LABEL: mission.label,
    MISSION_DESCRIPTION: mission.description,
    DISPATCH_STATUS: "READY FOR OPERATOR PREPARE",
    GENERATED_AT: generatedAt,
    PACKET_ID: packetId,
    PACKET_ABSPATH: packetFile,
    COCKPIT_TABLE: cockpitTable,
    COCKPIT_LIST: cockpitList,
    STATUS_SNIPPET: statusSnippet,
    ACTIVE_WRITER_SNIPPET: getActiveWriterSnippet(),
    NEXT_ACTION_HEADLINE: getNextActionHeadline(),
    ROLE_ACTION: roleActionText(role.id),
    ROLE_RESPONSE_FORMAT: roleResponseFormat(role.id),
  };

  const packetTemplate = fs.readFileSync(PACKET_TEMPLATE, "utf8");
  const pasteTemplate = fs.readFileSync(PASTE_TEMPLATE, "utf8");

  fs.mkdirSync(PATHS.outbox, { recursive: true });
  fs.writeFileSync(packetFile, expandTemplate(packetTemplate, tokens), "utf8");
  fs.writeFileSync(pasteFile, expandTemplate(pasteTemplate, tokens), "utf8");

  return { packetId, packetFile, pasteFile, role: roleKey, mission: missionId };
}

function runPs1(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", DISPATCH_PS1, ...args],
      { cwd: REPO_ROOT, windowsHide: true }
    );
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(stderr.trim() || stdout.trim() || `PowerShell exit ${code}`));
      else resolve(stdout.trim());
    });
  });
}

function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-Command", "Set-Clipboard -Value $input"], {
      cwd: REPO_ROOT,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (d) => {
      stderr += d.toString();
    });
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(stderr.trim() || `Clipboard exit ${code}`));
      else resolve(true);
    });
    child.stdin.write(text);
    child.stdin.end();
  });
}

function openPath(targetPath) {
  return new Promise((resolve, reject) => {
    const child = spawn("cmd.exe", ["/c", "start", "", targetPath], {
      cwd: REPO_ROOT,
      windowsHide: true,
      shell: false,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) reject(new Error(`Open failed: ${targetPath}`));
      else resolve(true);
    });
  });
}

function openFolder(folderPath) {
  return new Promise((resolve, reject) => {
    const child = spawn("explorer.exe", [folderPath], { windowsHide: true });
    child.on("error", reject);
    child.on("close", () => resolve(true));
  });
}

function loadCrewTabsConfig() {
  if (!fs.existsSync(CREW_TABS_CONFIG)) {
    throw new Error("Missing crew-tabs.config.json");
  }
  return JSON.parse(fs.readFileSync(CREW_TABS_CONFIG, "utf8"));
}

function findEdgeExecutable() {
  const candidates = [
    path.join(process.env["ProgramFiles(x86)"] || "", "Microsoft", "Edge", "Application", "msedge.exe"),
    path.join(process.env.ProgramFiles || "", "Microsoft", "Edge", "Application", "msedge.exe"),
  ];
  for (const exe of candidates) {
    if (exe && fs.existsSync(exe)) return exe;
  }
  throw new Error("Microsoft Edge not found");
}

function getCrewTab(cousinKey) {
  const config = loadCrewTabsConfig();
  const cousinId = CREW_COUSIN_IDS[cousinKey];
  if (!cousinId) throw new Error(`Unknown cousin: ${cousinKey}`);
  const tab = config.tabs.find((t) => t.id === cousinId);
  if (!tab) throw new Error(`No tab configured for ${cousinId}`);
  return tab;
}

function verifyPasteBlockFresh(cousinKey) {
  const tab = getCrewTab(cousinKey);
  const pasteRel = tab.pasteBlock;
  if (!pasteRel) return { ok: true, warning: null };
  const pastePath = path.join(REPO_ROOT, pasteRel.replace(/\//g, path.sep));
  if (!fs.existsSync(pastePath)) {
    throw new Error(`${path.basename(pastePath)} missing — generate packet first`);
  }
  const latest = loadJson(PATHS.latestDispatchJson);
  const stale = loadJson(PATHS.dispatchDashboardJson)?.staleWarning;
  let warning = null;
  if (latest?.role && latest.role !== cousinKey) {
    warning = `Latest dispatch was for ${latest.role}, not ${cousinKey}`;
  }
  if (stale?.petraPacketsBeforeSync?.includes("STALE") && cousinKey === "petra") {
    warning = (warning ? warning + ". " : "") + "Check LATEST_DISPATCH — stale packets flagged in cockpit";
  }
  return { ok: true, warning, pastePath, tab };
}

async function openAeyeCrewBay() {
  const config = loadCrewTabsConfig();
  const edge = findEdgeExecutable();
  const urls = [...config.tabs].sort((a, b) => a.tabIndex - b.tabIndex).map((t) => t.url);
  if (!urls.length) throw new Error("No crew tab URLs configured");

  const args = ["--new-window", `--user-data-dir=${EDGE_AEYE_PROFILE}`, ...urls];
  spawn(edge, args, { cwd: REPO_ROOT, detached: true, stdio: "ignore", windowsHide: true }).unref();

  return {
    success: true,
    message: `Aeye Crew Bay opened (${urls.length} tabs). STOP BEFORE SEND — paste manually.`,
    successLabel: "Bay open",
    tabCount: urls.length,
    humanGate: "No messages sent",
  };
}

async function loadCousinPacket(cousinKey, openBay = false) {
  const { warning, pastePath, tab } = verifyPasteBlockFresh(cousinKey);
  const text = fs.readFileSync(pastePath, "utf8");
  await copyToClipboard(text);
  if (openBay) {
    await openAeyeCrewBay();
  }
  const msg = `Loaded ${tab.name} — tab ${tab.tabIndex}. Clipboard ready. Ctrl+V then Send is YOUR gate.`;
  return {
    success: true,
    ok: true,
    message: warning ? `${msg} Warning: ${warning}` : msg,
    successLabel: "Loaded",
    cousin: tab.id,
    tabIndex: tab.tabIndex,
    tabName: tab.name,
    pasteFile: rel(pastePath),
    humanGate: "STOP BEFORE SEND",
  };
}

async function preparePetraDispatch() {
  await runPs1(["-Action", "Go", "-Mission", "crew-checkin", "-Role", "petra"]);
  return {
    success: true,
    message: "Petra packet fresh — clipboard loaded. Open crew bay or switch to Petra tab. STOP BEFORE SEND.",
    successLabel: "Ready",
  };
}

async function pinDesktopShortcuts() {
  const desktop = path.join(process.env.USERPROFILE || "", "Desktop");
  if (!fs.existsSync(desktop)) throw new Error("Desktop folder not found");

  const foremanShortcut = path.join(desktop, "Werkles - Foreman Dashboard.cmd");
  const bayShortcut = path.join(desktop, "Werkles - Aeye Crew Bay.cmd");
  const soledashShortcut = path.join(desktop, "Werkles - SoleDash.cmd");

  const foremanBody = `@echo off\r\ntitle Werkles Foreman Dashboard\r\ncall "${path.join(REPO_ROOT, "foreman-control.cmd")}"\r\n`;
  const bayBody = `@echo off\r\ntitle Werkles Aeye Crew Bay\r\ncall "${OPEN_AEYE_CREW_CMD}"\r\n`;
  const soledashBody = `@echo off\r\ntitle Werkles SoleDash\r\ncall "${path.join(REPO_ROOT, "soledash.cmd")}"\r\n`;

  fs.writeFileSync(foremanShortcut, foremanBody, "utf8");
  fs.writeFileSync(bayShortcut, bayBody, "utf8");
  fs.writeFileSync(soledashShortcut, soledashBody, "utf8");

  return {
    success: true,
    message: "Desktop shortcuts created — Foreman Dashboard, Aeye Crew Bay, SoleDash",
    successLabel: "Pinned",
    shortcuts: [foremanShortcut, bayShortcut, soledashShortcut],
  };
}

function findGateReviewPath() {
  const gate = getNextActionHeadline();
  for (const [key, reviewPath] of Object.entries(GATE_REVIEW_MAP)) {
    if (gate.includes(key) && fs.existsSync(reviewPath)) return reviewPath;
  }
  if (!fs.existsSync(PATHS.reviews)) return null;
  const gateFiles = fs
    .readdirSync(PATHS.reviews)
    .filter((f) => /^GATE-.*\.html$/i.test(f))
    .map((f) => ({ f, m: fs.statSync(path.join(PATHS.reviews, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  if (gateFiles.length) return path.join(PATHS.reviews, gateFiles[0].f);
  const fallback = path.join(PATHS.reviews, "AUTOMATION_AUTHORITY_REVIEW.html");
  return fs.existsSync(fallback) ? fallback : null;
}

function loadFinanceDashboard() {
  return loadJson(FINANCE_DASHBOARD_JSON);
}

async function refreshFinanceDashboard() {
  await runCommand("node", [FINANCE_COMMAND_MJS, "dashboard-json"]);
  const dash = loadFinanceDashboard();
  if (!dash) throw new Error("Finance dashboard JSON missing after refresh");
  return {
    success: true,
    message: `Finance dashboard refreshed (${dash.month})`,
    successLabel: "Refreshed",
    finance: dash,
  };
}

function formatFinanceCard(finance) {
  if (!finance) {
    return `<p class="muted">No finance dashboard yet — click <strong>Refresh Finance Dashboard</strong>.</p>`;
  }
  const entityRows = (finance.month_to_date_by_entity || [])
    .map((r) => `<li>${esc(r.entity_name)}: <strong>$${esc(String(r.amount_usd))}</strong></li>`)
    .join("");
  const warnRows = (finance.mismatch_warnings || [])
    .slice(0, 5)
    .map((w) => `<li><span class="muted">[${esc(w.severity)}]</span> ${esc(w.message)}</li>`)
    .join("");
  const financeBlocked = FINANCE_BLOCKED_ACTIONS.map(
    (b) => `<button type="button" class="btn blocked" data-action="${esc(b.id)}">${esc(b.label)}</button>`
  ).join("\n");

  return `
    <div class="banner ok-banner" style="margin-bottom:12px;font-weight:600">
      Local Operator Cockpit module only — not bank · not accounting · not moving money · not creating cards · no secrets
    </div>
    <p class="muted">Month <strong>${esc(finance.month)}</strong> · generated ${esc(finance.generated_at || "")}</p>
    <p><strong>AI/API this month:</strong> $${esc(String(finance.ai_api_spend_this_month_usd ?? 0))}</p>
    <p><strong>Unclassified:</strong> ${esc(String(finance.unclassified_count ?? 0))} ·
       <strong>Mismatches:</strong> ${esc(String(finance.mismatch_warning_count ?? 0))} ·
       <strong>Reimbursement queue:</strong> ${esc(String(finance.reimbursement_queue_count ?? 0))} ·
       <strong>SaaS review:</strong> ${esc(String(finance.recurring_saas_review_count ?? 0))}</p>
    <p class="muted">Month-to-date by entity:</p>
    <ul>${entityRows || "<li>(none this month)</li>"}</ul>
    <p class="muted">Mismatch warnings:</p>
    <ul>${warnRows || "<li>(none)</li>"}</ul>
    <div class="actions" style="margin-top:10px">
      <button type="button" class="btn primary" data-action="refresh-finance-dashboard">Refresh Finance Dashboard</button>
    </div>
    <p class="muted" style="margin-top:12px">Finance human gates — does not move money:</p>
    <div class="actions">${financeBlocked}</div>
  `;
}

function loadRelayStatusSync() {
  try {
    const sessionPath = path.join(REPO_ROOT, "foreman", "crew-dispatch", ".relay-session.json");
    const manifestPath = path.join(REPO_ROOT, "foreman", "crew-dispatch", "LATEST_NETWORK_COMMAND.json");
    let session = { state: "idle", cousins: [], steps: [], currentIndex: -1 };
    if (fs.existsSync(sessionPath)) {
      session = { ...session, ...JSON.parse(fs.readFileSync(sessionPath, "utf8")) };
    }
    let manifest = null;
    if (fs.existsSync(manifestPath)) {
      const m = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      manifest = {
        command: m.command,
        version: m.version,
        issued_at: m.issued_at,
        cousinCount: m.cousins?.length ?? 0,
        stale: false,
      };
    }
    const relayLock = loadJson(RELAY_LOCK_JSON) || { status: "IDLE" };
    const contextHealth = loadJson(CONTEXT_HEALTH_JSON);
    return { session, manifest, relayLock, contextHealth };
  } catch {
    return {
      session: { state: "idle", cousins: [], steps: [] },
      manifest: null,
      relayLock: { status: "IDLE" },
      contextHealth: null,
    };
  }
}

function formatContextHealthCard(contextHealth) {
  if (!contextHealth?.cousins) {
    return `<p class="muted">No context health file — see CONTEXT_HEALTH_PROTOCOL.md</p>`;
  }
  const rows = Object.entries(contextHealth.cousins)
    .map(([id, c]) => {
      const flag = c.resetRecommended ? " · <strong>RESET</strong>" : "";
      return `<li><code>${esc(id)}</code> load ${esc(c.contextLoad)} status ${esc(c.status || "OK")}${flag}</li>`;
    })
    .join("");
  return `
    <p class="muted">Expected gate: <code>${esc(contextHealth.expectedGate || "?")}</code></p>
    <ul>${rows}</ul>
    <div class="actions" style="margin-top:8px">
      <button type="button" class="btn" data-action="build-boot-petra">Boot Petra</button>
      <button type="button" class="btn" data-action="build-boot-bean">Boot Bean</button>
    </div>
  `;
}

function formatCourierLockBanner(relayLock) {
  if (!relayLock || relayLock.status !== "RUNNING") return "";
  return `<div class="banner" style="margin-bottom:16px;font-size:1.05rem">
    COURIER RUNNING — DO NOT CLICK EDGE · ${esc(relayLock.message || "")}
  </div>`;
}

const AEYE_RELAY_IDS = ["PETRA", "SKYBRO", "ENDER", "BEAN", "COMPUTER"];

function loadEdgeBayStatus(relay = null) {
  try {
    const config = loadCrewTabsConfig();
    const profileDir = path.join(REPO_ROOT, "foreman", ".edge-aeye-crew-profile");
    const session = relay?.session || { steps: [], state: "idle", currentIndex: -1, cousins: [] };
    const stepMap = Object.fromEntries((session.steps || []).map((s) => [s.cousinId, s]));
    const currentCousin = session.cousins?.[session.currentIndex ?? -1]?.cousinId;

    const tabs = config.tabs
      .filter((t) => AEYE_RELAY_IDS.includes(t.id))
      .sort((a, b) => a.tabIndex - b.tabIndex)
      .map((t) => {
        const step = stepMap[t.id];
        let relayStatus = "idle";
        if (step?.sentAt) relayStatus = "sent";
        else if (step?.deliveredAt) relayStatus = "pasted";
        else if (session.state === "awaiting_send" && currentCousin === t.id) relayStatus = "awaiting_send";
        else if (session.state === "delivering" && currentCousin === t.id) relayStatus = "delivering";
        return {
          id: t.id,
          name: t.name,
          tabIndex: t.tabIndex,
          url: t.url,
          relayStatus,
        };
      });

    const tabMapping = verifyAllRelayTabDestinations({ checkManifest: true });

    return {
      mode: config.mode || "edge-dispatch-bay",
      profileExists: fs.existsSync(profileDir),
      profileDir: "foreman/.edge-aeye-crew-profile",
      tabs,
      tabMapping,
      doctrine: "EDGE_EMBED_DOCTRINE.md",
    };
  } catch (e) {
    return { error: e.message };
  }
}

function formatEdgeDispatchBayCard(edgeBay) {
  if (edgeBay?.error) {
    return `<p class="muted">Edge bay status unavailable: ${esc(edgeBay.error)}</p>`;
  }

  const mappingOk = edgeBay.tabMapping?.ok !== false;
  const mappingBanner = mappingOk
    ? `<div class="banner ok-banner" style="margin-bottom:10px;font-size:.92rem">Tab mapping OK — config matches network manifest</div>`
    : `<div class="banner warn-banner" style="margin-bottom:10px">Tab mapping errors — run Verify Tab Mapping before relay</div>`;

  const relayLabel = (s) => {
    if (s === "sent") return "SENT";
    if (s === "pasted") return "PASTED";
    if (s === "awaiting_send") return "AWAITING SEND";
    if (s === "delivering") return "DELIVERING";
    return "idle";
  };

  const rows = (edgeBay.tabs || [])
    .map((t) => {
      const status = relayLabel(t.relayStatus);
      const active =
        t.relayStatus === "awaiting_send" || t.relayStatus === "delivering"
          ? " · <strong>active</strong>"
          : "";
      return `<tr><td>${esc(String(t.tabIndex))}</td><td><code>${esc(t.id)}</code></td><td>${esc(t.name)}</td><td>${esc(status)}${active}</td></tr>`;
    })
    .join("");

  const mappingErrors = (edgeBay.tabMapping?.errors || [])
    .slice(0, 5)
    .map((e) => `<li>${esc(e)}</li>`)
    .join("");

  return `
    <div class="banner ok-banner" style="margin-bottom:10px;font-size:.92rem">
      <strong>Separate Edge window</strong> — Robot Zone · <strong>no iframe</strong> of vendor AI chats in this dashboard
    </div>
    <p class="muted">Profile: <code>${esc(edgeBay.profileDir)}</code> ${edgeBay.profileExists ? "✓" : "(open bay once)"} · See <code>foreman/crew-dispatch/${esc(edgeBay.doctrine)}</code></p>
    ${mappingBanner}
    <table style="width:100%;border-collapse:collapse;font-size:.9rem;margin:10px 0">
      <thead><tr><th align="left">#</th><th align="left">Seat</th><th align="left">Name</th><th align="left">Relay</th></tr></thead>
      <tbody>${rows || "<tr><td colspan=\"4\">No tabs configured</td></tr>"}</tbody>
    </table>
    ${mappingErrors ? `<ul class="muted">${mappingErrors}</ul>` : ""}
    <div class="actions" style="margin-top:10px">
      <button type="button" class="btn primary" data-action="open-aeye-crew-bay">Open Aeye Crew Bay</button>
      <button type="button" class="btn" data-action="verify-aeye-tab-mapping">Verify Tab Mapping</button>
      <button type="button" class="btn" data-action="relay-courier-status">Courier Status</button>
    </div>
    <p class="muted" style="margin-top:8px">Focus tab only (no paste):</p>
    <div class="actions">
      <button type="button" class="btn" data-action="crew-courier-focus-petra">Focus Petra</button>
      <button type="button" class="btn" data-action="crew-courier-focus-skybro">Focus Skybro</button>
      <button type="button" class="btn" data-action="crew-courier-focus-ender">Focus Ender</button>
      <button type="button" class="btn" data-action="crew-courier-focus-bean">Focus Bean</button>
      <button type="button" class="btn" data-action="crew-courier-focus-computer">Focus Computer</button>
    </div>
  `;
}

function formatImageryDoctrineCard() {
  const doctrineExists = fs.existsSync(IMAGERY_DIRECTION);
  const ghostTemplateExists = fs.existsSync(IMAGERY_PROMPT_TEMPLATE);
  const wirePacketExists = fs.existsSync(ENDER_IMAGERY_WIRE_PACKET);
  return `
    <div class="banner ok-banner" style="margin-bottom:10px;font-size:.92rem">
      Viable with restrained grammar · transformation via cards, props, formation — <strong>not</strong> magical morphing
    </div>
    <p><strong>Doctrine:</strong> <code>foreman/IMAGERY_DIRECTION.md</code> ${doctrineExists ? "✓" : "(missing)"}</p>
    <p><strong>Ghost Forge prompts:</strong> <code>foreman/ghost-forge/IMAGERY_PROMPT_TEMPLATE.md</code> ${ghostTemplateExists ? "✓" : "(missing)"}</p>
    <p><strong>Gate 05:</strong> <code>PAUSE</code> · <strong>Product gate:</strong> APP_INFRA-01 · <strong>UI_COMMIT:</strong> HOLD</p>
    <p class="muted">No new assets from dashboard. Ender packet for placement/motion review only.</p>
    <div class="actions" style="margin-top:10px">
      <button type="button" class="btn primary" data-action="open-imagery-direction">Open Imagery Doctrine</button>
      <button type="button" class="btn" data-action="open-ender-imagery-packet">Open Ender Wire Packet</button>
      <button type="button" class="btn" data-action="generate-ender-imagery-packet">Generate Fresh Ender Packet</button>
    </div>
    <p class="muted" style="margin-top:8px">Wire packet: ${wirePacketExists ? "TO_ENDER_IMAGERY_DIRECTION_WIRE_v0.1.md" : "(generate fresh)"}</p>
  `;
}

function buildStatus() {
  const nextAction = readText(PATHS.nextAction);
  const currentState = readText(PATHS.currentState);
  const operator = readText(PATHS.operatorDashboard, 20);
  const dispatch = loadJson(PATHS.dispatchDashboardJson);
  const latest = loadJson(PATHS.latestDispatchJson);

  const pasteStatus = {};
  for (const [key, role] of Object.entries(ROLES)) {
    const pastePath = path.join(PATHS.outbox, role.pasteBlockSuffix);
    pasteStatus[key] = {
      file: role.pasteBlockSuffix,
      exists: fs.existsSync(pastePath),
      updatedAt: fs.existsSync(pastePath) ? fs.statSync(pastePath).mtime.toISOString() : null,
    };
  }

  const relay = loadRelayStatusSync();

  return {
    ok: true,
    repoRoot: REPO_ROOT,
    port: PORT,
    host: HOST,
    generatedAt: new Date().toISOString(),
    gate: parseEffectiveGate(nextAction.text),
    stateSummary: parseStateSummary(currentState.text),
    operatorSnippet: operator.text.split(/\r?\n/).slice(0, 12).join("\n"),
    dispatch: dispatch
      ? {
          generatedAt: dispatch.dashboardGeneratedAt || dispatch.generatedAt,
          mainHead: dispatch.cockpit?.mainHead,
          staleWarning: dispatch.staleWarning,
          latestDispatch: dispatch.latestDispatch,
        }
      : { missing: true },
    latestDispatch: latest,
    pasteStatus,
    gateReview: findGateReviewPath() ? rel(findGateReviewPath()) : null,
    inboxMarkdown: listInboxMarkdownFiles().slice(0, 8),
    outboxUnsent: listOutboxUnsent(),
    finance: loadFinanceDashboard(),
    relay,
    edgeBay: loadEdgeBayStatus(relay),
    activeAgentSnippet: readText(PATHS.activeAgent, 10).text,
    budgetSnippet: readText(PATHS.budget, 10).text,
    gd: buildGdStatus(),
    speaker: buildSpeakerStatus(REPO_ROOT),
  };
}

async function generatePacket(roleKey) {
  const role = ROLES[roleKey];
  if (!role) throw new Error(`Unknown role: ${roleKey}`);

  let result;
  if (role.ps1Role) {
    await runPs1(["-Action", "Generate", "-Mission", "crew-checkin", "-Role", role.ps1Role]);
    const packets = fs
      .readdirSync(PATHS.outbox)
      .filter((f) => f.startsWith(role.packetPrefix) && f.endsWith(".md"))
      .map((f) => ({ f, m: fs.statSync(path.join(PATHS.outbox, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    const packetFile = packets.length ? path.join(PATHS.outbox, packets[0].f) : null;
    result = {
      packetId: packets[0]?.f?.replace(/\.md$/, "") || null,
      packetFile,
      pasteFile: path.join(PATHS.outbox, role.pasteBlockSuffix),
      role: roleKey,
      mission: "crew-checkin",
    };
    await runPs1(["-Action", "Refresh"]);
  } else {
    result = generatePacketNode(roleKey, "crew-checkin");
    try {
      await runPs1(["-Action", "Refresh"]);
    } catch {
      /* optional */
    }
  }

  if (result.packetFile && fs.existsSync(result.packetFile)) {
    try {
      await stampRelayMetadata(result.packetFile, roleKey);
    } catch (e) {
      result.relayStampWarning = e.message;
    }
    await openPath(result.packetFile);
  }
  return {
    ...result,
    success: true,
    message: `${role.label} packet generated${result.relayStampWarning ? " (relay stamp warning: " + result.relayStampWarning + ")" : " + relay hashes"}`,
    successLabel: "Generated",
  };
}

async function copyPasteBlock(roleKey) {
  const role = ROLES[roleKey];
  if (!role) throw new Error(`Unknown role: ${roleKey}`);
  const pasteFile = path.join(PATHS.outbox, role.pasteBlockSuffix);
  if (!fs.existsSync(pasteFile)) {
    throw new Error(`${role.pasteBlockSuffix} not found — generate packet first`);
  }
  const text = fs.readFileSync(pasteFile, "utf8");
  await copyToClipboard(text);
  return {
    success: true,
    ok: true,
    file: role.pasteBlockSuffix,
    chars: text.length,
    message: `Copied ${role.pasteBlockSuffix} to clipboard`,
    successLabel: "Copied",
    humanGate: "STOP BEFORE SEND — paste manually",
  };
}

const NETWORK_COUSIN_IDS = {
  petra: "PETRA",
  skybro: "SKYBRO",
  ender: "ENDER",
  bean: "BEAN",
  computer: "COMPUTER",
};

function loadLatestNetworkManifest() {
  if (!fs.existsSync(LATEST_NETWORK_COMMAND_JSON)) {
    throw new Error("No network command issued — run Issue Role Awareness Sync first");
  }
  return JSON.parse(fs.readFileSync(LATEST_NETWORK_COMMAND_JSON, "utf8"));
}

async function issueNetworkRoleSync() {
  await runNodeScript(CREW_RELAY_NETWORK_CMD, ["issue"]);
  const manifest = loadLatestNetworkManifest();
  const masterAbs = path.join(REPO_ROOT, ...manifest.masterCommandFile.split("/"));
  if (fs.existsSync(masterAbs)) {
    await openPath(masterAbs);
  }
  const summary = manifest.cousins
    .map((c) => `Tab ${c.edgeTabIndex} ${c.name}: ${c.packetFile}`)
    .join("\n");
  return {
    success: true,
    ok: true,
    title: "AEYE Network — ROLE_AWARENESS_SYNC issued",
    content: `${manifest.command} ${manifest.version}\nIssued: ${manifest.issued_at}\n\n${summary}\n\nSee ${manifest.masterCommandFile}`,
    message: "First network command issued — master walkthrough opened",
    successLabel: "Issued",
    humanGate: "Load each cousin network paste → Edge tab → Ben Send",
  };
}

async function copyNetworkPaste(cousinKey) {
  const cousinId = NETWORK_COUSIN_IDS[cousinKey];
  if (!cousinId) throw new Error(`Unknown network cousin: ${cousinKey}`);
  const manifest = loadLatestNetworkManifest();
  const cousin = manifest.cousins.find((c) => c.cousinId === cousinId);
  if (!cousin) throw new Error(`${cousinId} not in latest network manifest`);
  const pasteFile = path.join(PATHS.outbox, cousin.pasteBlockSuffix);
  if (!fs.existsSync(pasteFile)) {
    throw new Error(`${cousin.pasteBlockSuffix} missing — re-issue network sync`);
  }
  const text = fs.readFileSync(pasteFile, "utf8");
  await copyToClipboard(text);
  return {
    success: true,
    ok: true,
    file: cousin.pasteBlockSuffix,
    chars: text.length,
    title: `Network paste — ${cousin.name}`,
    content: text,
    message: `Copied ${cousin.pasteBlockSuffix} (Edge tab ${cousin.edgeTabIndex})`,
    successLabel: "Copied",
    humanGate: "STOP BEFORE SEND — paste into Edge tab manually",
  };
}

async function deliverNetworkCourier(cousinKey, options = {}) {
  const cousinId = NETWORK_COUSIN_IDS[cousinKey];
  if (!cousinId) throw new Error(`Unknown network cousin: ${cousinKey}`);
  loadLatestNetworkManifest();
  const args = ["deliver", "--cousin", cousinId, "--kind", "network"];
  if (options.ensureEdge) args.push("--ensure-edge");
  if (options.tabOnly) args.push("--tab-only");
  const out = await runNodeScriptAllowFail(RELAY_COURIER_MJS, args);
  if (out.code !== 0) {
    let parsed = null;
    try {
      parsed = JSON.parse(out.stdout || out.stderr);
    } catch {
      /* ignore */
    }
    if (parsed?.status === "MANUAL_LOAD_REQUIRED" || parsed?.loadFailed) {
      return {
        ok: false,
        success: false,
        loadFailed: true,
        title: `Courier — MANUAL LOAD REQUIRED`,
        content: parsed?.error || out.stderr || out.stdout,
        message: "MANUAL LOAD REQUIRED — not AWAITING SEND",
        successLabel: "Manual load",
        humanGate: "MANUAL LOAD REQUIRED",
      };
    }
    if (parsed?.blocked) {
      return {
        ok: false,
        success: false,
        blocked: true,
        title: "Courier blocked",
        content: (parsed.errors || []).join("\n"),
        message: "HUMAN GATE REQUIRED — packet blocked",
        successLabel: "Blocked",
      };
    }
    throw new Error(out.stderr.trim() || out.stdout.trim() || "Relay courier failed");
  }
  const result = JSON.parse(out.stdout);
  if (!result.ok) {
    return {
      ok: false,
      success: false,
      loadFailed: Boolean(result.loadFailed),
      title: result.status === "MANUAL_LOAD_REQUIRED" ? "MANUAL LOAD REQUIRED" : "Courier failed",
      content: result.error || JSON.stringify(result, null, 2),
      message: result.humanGate || result.message || "Courier failed",
      successLabel: result.loadFailed ? "Manual load" : "Failed",
      humanGate: result.humanGate,
    };
  }
  return {
    success: true,
    ok: true,
    title: `Relay Courier — ${result.name}`,
    content: `Tab ${result.tabIndex}\nClass: ${result.dispatchClass}\n\n${result.humanGate}`,
    message: `Tab ${result.tabIndex} ${result.name} — loaded. ${result.humanGate}`,
    successLabel: "Loaded",
    tabIndex: result.tabIndex,
    cousin: cousinId,
    humanGate: result.humanGate,
  };
}

async function loadRelayModule() {
  return import(pathToFileURL(CREW_RELAY_RUNNER).href);
}

function formatRelayPanel(session, manifestMeta, relayLock = null) {
  const state = session?.state || "idle";
  const idx = session?.currentIndex ?? -1;
  const cousin = session?.cousins?.[idx];
  const steps = session?.steps || [];
  const done = steps.filter((s) => s.sentAt).length;
  const total = session?.cousins?.length || 5;

  let stateLabel = state.replace(/_/g, " ").toUpperCase();
  let progress = `${done}/${total} sent`;
  if (state === "awaiting_send" && cousin) {
    progress = `Tab ${cousin.edgeTabIndex} ${cousin.name} — paste delivered, waiting for Send`;
  }
  if (state === "complete") progress = "All tabs delivered";

  const stepRows = steps
    .map((s) => {
      const mark = s.sentAt ? "SENT" : s.deliveredAt ? "PASTED" : "pending";
      return `<li><code>${esc(s.cousinId)}</code> tab ${s.edgeTabIndex} — ${esc(mark)}</li>`;
    })
    .join("");

  const staleNote =
    manifestMeta?.stale === true
      ? `<p class="banner warn-banner">Manifest may be stale — Run Relay will auto reissue fresh packets.</p>`
      : "";

  const canStart = ["idle", "complete", "cancelled", "error"].includes(state);
  const canSent = state === "awaiting_send";
  const canCancel = ["awaiting_send", "delivering", "preparing"].includes(state);
  const canReset = !["idle"].includes(state) || (relayLock?.status === "RUNNING");

  return `
    ${staleNote}
    <div class="relay-status" id="relay-status-box">
      <p><strong>State:</strong> <code id="relay-state">${esc(stateLabel)}</code></p>
      <p id="relay-progress">${esc(progress)}</p>
      <p class="muted" id="relay-message">${esc(session?.message || "Ready. One button runs the full mechanical relay.")}</p>
      <p class="banner ok-banner" id="relay-gate" style="${session?.humanGate ? "" : "display:none"}">${esc(session?.humanGate || "")}</p>
      <ul id="relay-steps">${stepRows || "<li>No active relay</li>"}</ul>
    </div>
    <div class="actions" style="margin-top:12px">
      <button type="button" class="btn primary" id="relay-start" ${canStart ? "" : "disabled"}>Run Network Sync Relay</button>
      <button type="button" class="btn hero" id="relay-sent" ${canSent ? "" : "disabled"}>I Sent - Next Cousin</button>
      <button type="button" class="btn" id="relay-cancel" ${canCancel ? "" : "disabled"}>Cancel Relay</button>
      <button type="button" class="btn" id="relay-reset" ${canReset ? "" : "disabled"}>Reset Stuck Relay</button>
    </div>
    <p class="muted" style="margin-top:10px">Mechanical steps are automated. You only click <strong>Send</strong> in Edge and <strong>I Sent</strong> here. See <code>CREW_RELAY_AUTOMATION.md</code>.</p>
  `;
}

async function relayApiStart(reissue = false) {
  const mod = await loadRelayModule();
  const result = await mod.startNetworkRelay({ reissue });
  return {
    ok: true,
    success: true,
    session: result.session,
    message: result.session.message,
    humanGate: result.session.humanGate,
    successLabel: "Relay started",
  };
}

async function relayApiSent() {
  const mod = await loadRelayModule();
  const result = await mod.confirmRelaySent();
  return {
    ok: true,
    success: true,
    session: result.session,
    complete: result.complete,
    message: result.session.message,
    humanGate: result.session.humanGate,
    successLabel: result.complete ? "Complete" : "Next tab",
  };
}

async function relayApiCancel() {
  const mod = await loadRelayModule();
  const result = mod.cancelRelay();
  return { ok: true, success: true, ...result, message: "Relay cancelled", successLabel: "Cancelled" };
}

async function relayApiReset() {
  const mod = await loadRelayModule();
  const result = mod.resetRelay();
  return { ok: true, success: true, ...result, message: "Relay reset", successLabel: "Reset" };
}

function startNetworkCourierWalk(options = {}) {
  try {
    loadLatestNetworkManifest();
  } catch (e) {
    throw new Error(e.message);
  }
  const psArgs = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", CREW_EDGE_COURIER_PS1, "-RepoRoot", REPO_ROOT, "-WalkNetworkSync"];
  if (options.ensureEdge) psArgs.push("-EnsureEdge");
  spawn("powershell.exe", psArgs, { cwd: REPO_ROOT, detached: true, stdio: "ignore", windowsHide: false }).unref();
  return {
    success: true,
    ok: true,
    title: "Network courier walk",
    content: "PowerShell courier walk started.\n\nFor each tab: review paste → Send manually → Enter for next cousin.\n\nAfter all five: save FROM_* to inbox → Validate → Process.",
    message: "Courier walk opened — Send stays your gate between tabs",
    successLabel: "Walk started",
    humanGate: "STOP BEFORE SEND on each tab",
  };
}

function loadGdMissionClasses() {
  if (!fs.existsSync(GD_MISSION_CLASSES)) return [];
  try {
    const registry = JSON.parse(fs.readFileSync(GD_MISSION_CLASSES, "utf8"));
    return Object.entries(registry.missionClasses || {}).map(([id, def]) => ({
      id,
      label: def.label,
      generationMode: def.generationMode || null,
      recipients: def.recipients || [],
    }));
  } catch {
    return [];
  }
}

function listGdRunsBrief() {
  if (!fs.existsSync(GD_RUNS_DIR)) return [];
  return fs
    .readdirSync(GD_RUNS_DIR)
    .filter((name) => fs.existsSync(path.join(GD_RUNS_DIR, name, "run-manifest.json")))
    .sort()
    .reverse()
    .slice(0, 12)
    .map((runId) => {
      try {
        const m = JSON.parse(fs.readFileSync(path.join(GD_RUNS_DIR, runId, "run-manifest.json"), "utf8"));
        return { runId, missionClass: m.missionClass, status: m.status };
      } catch {
        return { runId, missionClass: "?", status: "?" };
      }
    });
}

function loadThreadRefreshPreview() {
  if (!fs.existsSync(THREAD_REFRESH_PACKET)) {
    return { exists: false };
  }
  const stat = fs.statSync(THREAD_REFRESH_PACKET);
  const text = fs.readFileSync(THREAD_REFRESH_PACKET, "utf8");
  let runId = null;
  const m = text.match(/\*\*Run:\*\* `(GD_RUN_[^`]+)`/);
  if (m) runId = m[1];
  return {
    exists: true,
    chars: text.length,
    modifiedAt: stat.mtime.toISOString(),
    runId,
    preview: text.slice(0, 2400) + (text.length > 2400 ? "\n\n… (truncated — open file for full packet)" : ""),
    path: rel(THREAD_REFRESH_PACKET),
  };
}

function buildGdStatus() {
  return {
    ok: true,
    missionClasses: loadGdMissionClasses(),
    runs: listGdRunsBrief(),
    threadRefresh: loadThreadRefreshPreview(),
    homeAnchor: `http://${HOST}:${PORT}/#gimpdash`,
  };
}

function speakerStatusBadge(status) {
  if (status === "RATIFIED") return `<span class="gd-ready">RATIFIED</span>`;
  if (status === "SUPERSEDED") return `<span class="muted">SUPERSEDED</span>`;
  return `<span class="warn-pill">DRAFT</span>`;
}

function formatSpeakerPanelCard(speaker) {
  const counts = speaker?.counts || { draft: 0, ratified: 0, superseded: 0 };
  const entryRows =
    (speaker?.entries || [])
      .slice(0, 16)
      .map(
        (e) =>
          `<tr><td>${speakerStatusBadge(e.status)}</td><td><code>${esc(e.id)}</code></td><td>${esc(e.title)}</td><td>${esc((e.tags || []).slice(0, 3).join(", "))}</td></tr>`
      )
      .join("") || '<tr><td colspan="4" class="muted">No entries yet</td></tr>';

  const warningRows =
    (speaker?.warnings || [])
      .slice(0, 10)
      .map(
        (e) =>
          `<li><strong>${esc(e.title)}</strong> <span class="muted">(${esc(e.status)})</span> — ${esc((e.warning_triggers || []).slice(0, 2).join("; ") || "—")}</li>`
      )
      .join("") || '<li class="muted">No warnings indexed</li>';

  const roleChips = (speaker?.roleRegistry?.roles || [])
    .slice(0, 14)
    .map((r) => `<span class="warn-pill" style="margin:2px 4px 2px 0;display:inline-block">${esc(r)}</span>`)
    .join("") || '<span class="muted">Registry not loaded</span>';

  return `
  <div class="plow" id="gd-speaker" style="margin-top:16px">
    <h2>Speaker</h2>
    <p class="lead">Independent constitutional office · <strong>why we believe this</strong> · causal memory · no executive hands</p>
    <p class="muted">GD consults Speaker. GD does not own Speaker. Only Ben ratifies. Not a summarizer — causal memory.</p>

    <div class="banner ok-banner" style="margin-bottom:10px;font-size:.92rem">
      ${counts.draft} draft · ${counts.ratified} ratified · ${counts.superseded} superseded
      · integration <code>foreman/speaker/GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md</code>
    </div>

    <details open>
      <summary><strong>Aeye role registry</strong> <span class="muted">· cultural memory Speaker monitors</span></summary>
      <div style="margin-top:10px;line-height:1.8">${roleChips}</div>
      <div class="actions" style="margin-top:8px">
        <button type="button" class="btn" data-action="open-speaker-role-registry">Open Role Registry</button>
        <button type="button" class="btn" data-action="open-speaker-integration">Open Integration V0</button>
      </div>
    </details>

    <details open style="margin-top:10px">
      <summary><strong>Causal ledger</strong> <span class="muted">· ${counts.draft + counts.ratified + counts.superseded} entries</span></summary>
      <table class="gd-table" id="speaker-entries-table" style="margin-top:10px">
        <thead><tr><th>Status</th><th>ID</th><th>Title</th><th>Tags</th></tr></thead>
        <tbody>${entryRows}</tbody>
      </table>
    </details>

    <details open style="margin-top:10px">
      <summary><strong>Warnings &amp; lessons</strong> <span class="muted">· interrupt signatures</span></summary>
      <ul id="speaker-warnings-list" style="margin:10px 0 0 1rem;font-size:.92rem">${warningRows}</ul>
    </details>

    <details style="margin-top:10px">
      <summary><strong>Draft new entry</strong> <span class="muted">· DRAFT only — ten-field template</span></summary>
      <div class="gd-governor" style="margin-top:10px">
        <input id="speaker-draft-title" type="text" placeholder="Title (required)" style="width:100%;margin-bottom:8px;padding:8px" />
        <textarea id="speaker-draft-event" rows="2" placeholder="Event — what happened?" style="width:100%;margin-bottom:8px;padding:8px"></textarea>
        <textarea id="speaker-draft-context" rows="2" placeholder="Context — what was around it?" style="width:100%;margin-bottom:8px;padding:8px"></textarea>
        <textarea id="speaker-draft-lesson" rows="4" placeholder="Lesson learned (required)" style="width:100%;margin-bottom:8px;padding:8px"></textarea>
        <textarea id="speaker-draft-why" rows="2" placeholder="Why it happened — preserve cause, not slogans" style="width:100%;margin-bottom:8px;padding:8px"></textarea>
        <input id="speaker-draft-triggers" type="text" placeholder="Future warning triggers (comma-separated)" style="width:100%;margin-bottom:8px;padding:8px" />
        <div class="actions" style="margin-top:10px">
          <button type="button" class="btn primary" id="speaker-draft-btn">Save DRAFT entry</button>
          <button type="button" class="btn" data-action="open-speaker-charter">Open Charter</button>
          <button type="button" class="btn" data-action="open-speaker-ledger">Open Ledger</button>
          <button type="button" class="btn" data-action="open-speaker-template">Open Template</button>
        </div>
        <p class="muted" id="speaker-draft-meta" style="margin-top:8px">Writes <code>foreman/speaker/entries/DRAFT_*.md</code> · Ben ratifies · never auto-send</p>
      </div>
    </details>

    <p class="muted" style="margin-top:12px;margin-bottom:0">
      Route <code>/gd/speaker</code> → this panel · No SQL · No secrets · No canonicalize without Ben
    </p>
  </div>`;
}

function formatGimpDashHomeCard(gd) {
  const tr = gd?.threadRefresh || {};
  const meta = tr.exists
    ? `<span class="gd-ready">Ready</span> · ${tr.chars} chars · ${esc(tr.modifiedAt || "")}` +
      (tr.runId ? ` · run <code>${esc(tr.runId)}</code>` : "")
    : "No packet yet — click Generate Thread Refresh Packet.";

  const missionRows =
    (gd?.missionClasses || [])
      .map((m) => {
        const mode =
          m.generationMode === "COCKPIT_DIRECT"
            ? "cockpit direct"
            : m.recipients?.length
              ? m.recipients.join(", ")
              : "—";
        return `<tr><td><code>${esc(m.id)}</code></td><td>${esc(m.label)}</td><td>${esc(mode)}</td></tr>`;
      })
      .join("") || '<tr><td colspan="3" class="muted">None</td></tr>';

  const runRows =
    (gd?.runs || [])
      .slice(0, 8)
      .map(
        (r) =>
          `<tr><td><code>${esc(r.runId)}</code></td><td>${esc(r.missionClass)}</td><td>${esc(r.status)}</td></tr>`
      )
      .join("") || '<tr><td colspan="3" class="muted">No runs yet</td></tr>';

  return `
  <div class="plow" id="gimpdash" style="margin-top:16px">
    <h2>GimpDash</h2>
    <p class="lead">One console · state what you want · GD governs topic and crew routing by role · <code>HUMAN_CONSUMABLE_OUTPUT_RULE_V1</code></p>

    <div class="gd-governor gd-hero">
      <h3>What do you want to do?</h3>
      <p class="muted">Plain language only. No crew picking. Governor routes Aeyes by seat — not Gmail In / Gmail Out.</p>
      <textarea id="gd-intent-input" rows="7" placeholder="State your intent in plain language.

Examples:
• Review homepage visual narrative — four beats, no deploy
• Thread refresh for a new Cursor session
• Import rent roll and check capital allocation posture
• Wire documentary nav icons locally, typecheck only"></textarea>
      <div class="actions" style="margin-top:10px">
        <button type="button" class="btn hero primary" id="gd-route-btn">Route intent</button>
        <button type="button" class="btn" id="gd-copy-governor-brief" disabled>Copy governor brief</button>
      </div>
      <div id="gd-governor-output" class="gd-governor-output hidden"></div>
    </div>

    <details style="margin-top:14px">
      <summary><strong>Thread refresh artifact</strong> <span class="muted">· cockpit-direct when governor routes thread refresh</span></summary>
      <p class="muted" style="margin-top:10px">Generate <code>THREAD_REFRESH_PACKET.md</code> from repo truth — paste into a fresh ChatGPT thread.</p>
      <div class="actions">
        <button type="button" class="btn primary" data-action="gd-thread-refresh">Generate Thread Refresh Packet</button>
        <button type="button" class="btn" data-action="copy-thread-refresh-packet">Copy to Clipboard</button>
        <button type="button" class="btn" data-action="open-thread-refresh-packet">Open Output File</button>
      </div>
      <p class="muted" style="margin-top:12px" id="gd-output-meta">${meta}</p>
      <pre id="gd-packet-preview" class="gd-preview"${tr.exists ? "" : " hidden"}>${tr.exists ? esc(tr.preview) : ""}</pre>
    </details>

    <details open style="margin-top:14px">
      <summary><strong>Mission classes</strong> <span class="muted">· cousin-routed: <code>npm run gd:generate</code></span></summary>
      <table class="gd-table" id="gd-mission-table" style="margin-top:10px">
        <thead><tr><th>Class</th><th>Label</th><th>Mode</th></tr></thead>
        <tbody>${missionRows}</tbody>
      </table>
    </details>

    <details open style="margin-top:10px">
      <summary><strong>Recent GD runs</strong></summary>
      <table class="gd-table" id="gd-runs-table" style="margin-top:10px">
        <thead><tr><th>Run</th><th>Mission</th><th>Status</th></tr></thead>
        <tbody>${runRows}</tbody>
      </table>
    </details>

    <p class="muted" style="margin-top:12px;margin-bottom:0">
      Output: <code>foreman/handoffs/outbox/THREAD_REFRESH_PACKET.md</code> · CLI: <code>npm run gd:thread-refresh</code>
      · <a href="#gd-speaker">Speaker window</a> (separate office)
    </p>
  </div>`;
}

async function generateThreadRefreshPacketAction() {
  const stdout = await runNodeScript(GD_ROUTER_MJS, ["thread-refresh"]);
  let parsed = {};
  try {
    parsed = JSON.parse(stdout);
  } catch {
    parsed = { runId: "unknown" };
  }
  if (!fs.existsSync(THREAD_REFRESH_PACKET)) {
    throw new Error("THREAD_REFRESH_PACKET.md not written — check gd-intent-router");
  }
  const text = fs.readFileSync(THREAD_REFRESH_PACKET, "utf8");
  await copyToClipboard(text);
  await openPath(THREAD_REFRESH_PACKET);
  return {
    success: true,
    ok: true,
    message: `Thread refresh packet generated (${text.length} chars) — copied to clipboard. Paste into a fresh ChatGPT thread.`,
    successLabel: "Generated",
    file: rel(THREAD_REFRESH_PACKET),
    runId: parsed.runId,
    chars: text.length,
  };
}

async function handleAction(action) {
  switch (action) {
    case "refresh-crew-dispatch": {
      const out = await runPs1(["-Action", "Refresh"]);
      return {
        success: true,
        message: "Crew dispatch dashboard refreshed",
        successLabel: "Refreshed",
        detail: out,
      };
    }
    case "generate-petra":
      return generatePacket("petra");
    case "generate-skybro":
      return generatePacket("skybro");
    case "generate-ender":
      return generatePacket("ender");
    case "generate-bean":
      return generatePacket("bean");
    case "generate-computer":
      return generatePacket("computer");
    case "gd-thread-refresh":
      return generateThreadRefreshPacketAction();
    case "open-gimpdash":
      await openPath(`http://${HOST}:${PORT}/#gimpdash`);
      return {
        success: true,
        message: "GimpDash section opened on Foreman home",
        successLabel: "Opened",
        url: `http://${HOST}:${PORT}/#gimpdash`,
      };
    case "open-speaker-panel":
      await openPath(`http://${HOST}:${PORT}/#gd-speaker`);
      return {
        success: true,
        message: "Speaker panel opened on Foreman home",
        successLabel: "Opened",
        url: `http://${HOST}:${PORT}/#gd-speaker`,
      };
    case "open-speaker-charter": {
      const charter = path.join(REPO_ROOT, "foreman", "speaker", "SPEAKER_CHARTER.md");
      await openPath(charter);
      return { success: true, message: "Speaker charter opened", successLabel: "Opened", file: rel(charter) };
    }
    case "open-speaker-role-registry": {
      const registry = path.join(REPO_ROOT, "foreman", "speaker", "AEYE_ROLE_REGISTRY.md");
      await openPath(registry);
      return { ok: true, message: "Opened role registry", path: registry };
    }
    case "open-speaker-integration": {
      const integration = path.join(REPO_ROOT, "foreman", "speaker", "GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md");
      await openPath(integration);
      return { ok: true, message: "Opened integration V0", path: integration };
    }
    case "open-speaker-template": {
      const template = path.join(REPO_ROOT, "foreman", "speaker", "SPEAKER_PACKET_TEMPLATE.md");
      await openPath(template);
      return { ok: true, message: "Opened packet template", path: template };
    }
    case "open-speaker-ledger": {
      const ledger = path.join(REPO_ROOT, "foreman", "speaker", "CAUSAL_LEDGER.md");
      await openPath(ledger);
      return { success: true, message: "Causal ledger opened", successLabel: "Opened", file: rel(ledger) };
    }
    case "open-thread-refresh-packet":
      if (!fs.existsSync(THREAD_REFRESH_PACKET)) {
        throw new Error("No thread refresh packet yet — click Generate Thread Refresh Packet first");
      }
      await openPath(THREAD_REFRESH_PACKET);
      return {
        success: true,
        message: "Thread refresh packet opened",
        successLabel: "Opened",
        file: rel(THREAD_REFRESH_PACKET),
      };
    case "copy-thread-refresh-packet":
      if (!fs.existsSync(THREAD_REFRESH_PACKET)) {
        throw new Error("No thread refresh packet yet — click Generate Thread Refresh Packet first");
      }
      await copyToClipboard(fs.readFileSync(THREAD_REFRESH_PACKET, "utf8"));
      return {
        success: true,
        message: "THREAD_REFRESH_PACKET.md copied to clipboard",
        successLabel: "Copied",
        file: rel(THREAD_REFRESH_PACKET),
      };
    case "open-outbox":
      await openFolder(PATHS.outbox);
      return { success: true, message: "Outbox opened", successLabel: "Opened", folder: rel(PATHS.outbox) };
    case "open-inbox":
      await openFolder(PATHS.inbox);
      return { success: true, message: "Inbox opened", successLabel: "Opened", folder: rel(PATHS.inbox) };
    case "open-reviews":
      await openFolder(PATHS.reviews);
      return { success: true, message: "Reviews opened", successLabel: "Opened", folder: rel(PATHS.reviews) };
    case "open-gate-review": {
      const review = findGateReviewPath();
      if (!review) throw new Error("No gate review HTML mapped for current gate");
      await openPath(review);
      return { success: true, message: "Gate review opened", successLabel: "Opened", file: rel(review) };
    }
    case "copy-petra-paste":
      return copyPasteBlock("petra");
    case "copy-skybro-paste":
      return copyPasteBlock("skybro");
    case "copy-ender-paste":
      return copyPasteBlock("ender");
    case "copy-bean-paste":
      return copyPasteBlock("bean");
    case "copy-computer-paste":
      return copyPasteBlock("computer");
    case "show-current-gate":
      return {
        success: true,
        title: "Current gate",
        content: readText(PATHS.nextAction, 35).text,
        message: "Current gate loaded",
        successLabel: "Shown",
      };
    case "show-active-agent":
      return {
        success: true,
        title: "Active Agent",
        content: readText(PATHS.activeAgent).text,
        message: "Active agent loaded",
        successLabel: "Shown",
      };
    case "show-budget-status":
      return {
        success: true,
        title: "Budget Status",
        content: readText(PATHS.budget, 60).text,
        message: "Budget status loaded",
        successLabel: "Shown",
      };
    case "open-aeye-crew-bay":
      return openAeyeCrewBay();
    case "prepare-petra":
      return preparePetraDispatch();
    case "pin-desktop-shortcuts":
      return pinDesktopShortcuts();
    case "load-petra-packet":
      return loadCousinPacket("petra", false);
    case "load-skybro-packet":
      return loadCousinPacket("skybro", false);
    case "load-ender-packet":
      return loadCousinPacket("ender", false);
    case "load-bean-packet":
      return loadCousinPacket("bean", false);
    case "load-computer-packet":
      return loadCousinPacket("computer", false);
    case "load-petra-and-bay":
      return loadCousinPacket("petra", true);
    case "refresh-finance-dashboard":
      return refreshFinanceDashboard();
    case "crew-relay-validate": {
      const result = await runCrewRelay("validate");
      const detail = result.stdout || result.stderr;
      const pass = result.code === 0;
      return {
        success: pass,
        ok: pass,
        title: "Crew Relay — Validate Inbox",
        content: detail,
        message: pass ? "Inbox validation passed" : "Inbox validation failed — see report",
        successLabel: pass ? "Valid" : "Failed",
      };
    }
    case "crew-relay-process-dry-run": {
      const result = await runCrewRelay("process", ["--dry-run"]);
      const detail = result.stdout || result.stderr;
      return {
        success: result.code === 0,
        ok: result.code === 0,
        title: "Crew Relay — Dry Run",
        content: detail,
        message: "Dry-run complete — nothing moved",
        successLabel: result.code === 0 ? "Dry-run OK" : "Failed",
      };
    }
    case "crew-relay-process": {
      const result = await runCrewRelay("process");
      const detail = result.stdout || result.stderr;
      const pass = result.code === 0;
      return {
        success: pass,
        ok: pass,
        title: pass ? "Crew Relay — Processed" : "Crew Relay — Process Halted",
        content: detail,
        message: pass
          ? "Responses processed to inbox/processed/"
          : "Process halted — validation failed; nothing moved",
        successLabel: pass ? "Processed" : "Halted",
      };
    }
    case "crew-relay-self-test": {
      const gen = await runNodeScript(CREW_RELAY_GENERATOR, ["--self-test"]);
      const intake = await runNodeScript(CREW_RELAY_INTAKE, ["--self-test"]);
      return {
        success: true,
        ok: true,
        title: "Crew Relay Hash Self-Test",
        content: `Generator:\n${gen}\n\nIntake:\n${intake}`,
        message: "Hash self-test passed",
        successLabel: "PASS",
      };
    }
    case "crew-relay-run-fixtures": {
      const result = await runNodeScriptAllowFail(CREW_RELAY_INTAKE, ["run-fixtures"]);
      const detail = result.stdout || result.stderr;
      const pass = result.code === 0;
      return {
        success: pass,
        ok: pass,
        title: "Crew Relay Fixtures",
        content: detail,
        message: pass ? "All fixture tests passed" : "Fixture tests failed",
        successLabel: pass ? "PASS" : "FAIL",
      };
    }
    case "crew-relay-list-sent": {
      const detail = await runNodeScript(CREW_RELAY_INTAKE, ["list-outbox", "--sent"]);
      return {
        success: true,
        ok: true,
        title: "Sent Outbox Packets",
        content: detail,
        message: "Sent packet list loaded",
        successLabel: "Listed",
      };
    }
    case "crew-relay-archive-sent": {
      const detail = await runNodeScript(CREW_RELAY_INTAKE, ["archive-sent"]);
      return {
        success: true,
        ok: true,
        title: "Archive Old Sent Packets",
        content: detail,
        message: "Archive sweep complete",
        successLabel: "Archived",
      };
    }
    case "crew-relay-issue-network-sync":
      return issueNetworkRoleSync();
    case "crew-relay-network-paste-petra":
      return copyNetworkPaste("petra");
    case "crew-relay-network-paste-skybro":
      return copyNetworkPaste("skybro");
    case "crew-relay-network-paste-ender":
      return copyNetworkPaste("ender");
    case "crew-relay-network-paste-bean":
      return copyNetworkPaste("bean");
    case "crew-relay-network-paste-computer":
      return copyNetworkPaste("computer");
    case "crew-courier-deliver-petra":
      return deliverNetworkCourier("petra", { ensureEdge: true });
    case "crew-courier-deliver-skybro":
      return deliverNetworkCourier("skybro");
    case "crew-courier-deliver-ender":
      return deliverNetworkCourier("ender");
    case "crew-courier-deliver-bean":
      return deliverNetworkCourier("bean");
    case "crew-courier-deliver-computer":
      return deliverNetworkCourier("computer");
    case "crew-courier-focus-petra":
      return deliverNetworkCourier("petra", { ensureEdge: true, tabOnly: true });
    case "crew-courier-focus-skybro":
      return deliverNetworkCourier("skybro", { tabOnly: true });
    case "crew-courier-focus-ender":
      return deliverNetworkCourier("ender", { tabOnly: true });
    case "crew-courier-focus-bean":
      return deliverNetworkCourier("bean", { tabOnly: true });
    case "crew-courier-focus-computer":
      return deliverNetworkCourier("computer", { tabOnly: true });
    case "crew-courier-walk-network-sync":
      return startNetworkCourierWalk({ ensureEdge: true });
    case "build-boot-petra": {
      const out = await runNodeScript(BUILD_BOOT_PACKET_MJS, ["--cousin", "PETRA"]);
      return {
        success: true,
        ok: true,
        title: "Boot packet — Petra",
        content: out,
        message: "BOOT packet generated — CLASS B load, human Send",
        successLabel: "Boot ready",
        humanGate: "STOP BEFORE SEND",
      };
    }
    case "build-boot-bean": {
      const out = await runNodeScript(BUILD_BOOT_PACKET_MJS, ["--cousin", "BEAN"]);
      return {
        success: true,
        ok: true,
        title: "Boot packet — Bean",
        content: out,
        message: "BOOT packet generated — CLASS B load, human Send",
        successLabel: "Boot ready",
        humanGate: "STOP BEFORE SEND",
      };
    }
    case "relay-courier-status": {
      const out = await runNodeScript(RELAY_COURIER_MJS, ["status"]);
      return {
        success: true,
        ok: true,
        title: "Relay Courier status",
        content: out,
        message: "Courier status loaded",
        successLabel: "Status",
      };
    }
    case "verify-aeye-tab-mapping": {
      const out = await runNodeScriptAllowFail(RELAY_COURIER_MJS, ["verify-tabs"]);
      let parsed = null;
      try {
        parsed = JSON.parse(out.stdout || out.stderr);
      } catch {
        parsed = { raw: out.stdout || out.stderr };
      }
      const ok = out.code === 0 && parsed?.ok !== false;
      return {
        success: ok,
        ok,
        title: ok ? "Tab mapping OK" : "Tab mapping errors",
        content: out.stdout || out.stderr || JSON.stringify(parsed, null, 2),
        message: ok
          ? "All five Aeye tabs match config + manifest"
          : "Fix tab mapping before relay — see EDGE_EMBED_DOCTRINE.md",
        successLabel: ok ? "Verified" : "Fix mapping",
        humanGate: ok ? null : "MANUAL LOAD REQUIRED if indices wrong",
      };
    }
    case "open-imagery-direction": {
      if (!fs.existsSync(IMAGERY_DIRECTION)) throw new Error("IMAGERY_DIRECTION.md missing");
      await openPath(IMAGERY_DIRECTION);
      return {
        success: true,
        ok: true,
        title: "Imagery doctrine",
        content: readText(IMAGERY_DIRECTION, 40).text,
        message: "Opened foreman/IMAGERY_DIRECTION.md",
        successLabel: "Opened",
      };
    }
    case "open-ender-imagery-packet": {
      const target = fs.existsSync(ENDER_IMAGERY_WIRE_PACKET)
        ? ENDER_IMAGERY_WIRE_PACKET
        : null;
      if (!target) throw new Error("TO_ENDER_IMAGERY_DIRECTION_WIRE_v0.1.md missing — Generate Fresh Ender Packet");
      await openPath(target);
      return {
        success: true,
        ok: true,
        title: "Ender imagery wire packet",
        content: readText(target, 35).text,
        message: "Opened Ender wire packet — STOP BEFORE SEND",
        successLabel: "Opened",
        humanGate: "STOP BEFORE SEND",
      };
    }
    case "generate-ender-imagery-packet": {
      const out = await runNodeScript(CREW_PACKET_GENERATOR, [
        "--cousin",
        "ENDER",
        "--mission",
        "ender-imagery-direction",
      ]);
      let parsed = null;
      try {
        parsed = JSON.parse(out);
      } catch {
        parsed = { raw: out };
      }
      const packetFile = parsed?.packetFile;
      if (packetFile && fs.existsSync(packetFile)) {
        await stampRelayMetadata(packetFile, "ender");
        await openPath(packetFile);
      }
      return {
        success: true,
        ok: true,
        title: "Ender imagery packet generated",
        content: out,
        message: "Fresh Ender imagery packet in outbox — STOP BEFORE SEND",
        successLabel: "Generated",
        humanGate: "STOP BEFORE SEND",
      };
    }
    default:
      if (BLOCKED_ACTIONS.some((b) => b.id === action) || FINANCE_BLOCKED_ACTIONS.some((b) => b.id === action)) {
        return { blocked: true, ok: false, success: false, message: "HUMAN GATE REQUIRED", action };
      }
      throw new Error(`Unknown action: ${action}`);
  }
}

function renderPage(status, localToken, theme) {
  const stale = status.dispatch?.staleWarning;
  const staleFiles = (stale?.stalePacketFiles || []).map((f) => `<li><code>${esc(f)}</code></li>`).join("");
  const blockedButtons = BLOCKED_ACTIONS.map(
    (b) =>
      `<button type="button" class="btn blocked" data-action="${esc(b.id)}">${esc(b.label)}</button>`
  ).join("\n");
  const inboxList = (status.inboxMarkdown || [])
    .map((f) => `<li><code>${esc(f.name)}</code></li>`)
    .join("");
  const outboxUnsentList = (status.outboxUnsent || [])
    .map((f) => `<li><code>${esc(f.name)}</code></li>`)
    .join("");

  const relayLock = status.relay?.relayLock;
  const courierLockBanner = formatCourierLockBanner(relayLock);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Foreman Control Panel</title>
  <style>
    /* Synced from lib/design-tokens.ts + app/globals.css — see foreman/control-panel/TOKENS_SYNC.md */
    :root {
      --paper: ${theme.paper};
      --paper-soft: ${theme.paperSoft};
      --ink: ${theme.ink};
      --ink-muted: ${theme.inkMuted};
      --copper: ${theme.copper};
      --ok: ${theme.ok};
      --wait: ${theme.wait};
      --stop: ${theme.stop};
      --panel-border: ${theme.panelBorder};
      --gate-bg: ${theme.gateBg};
    }
    * { box-sizing: border-box; }
    body { font-family: "Segoe UI", sans-serif; background: var(--paper-soft); color: var(--ink); margin: 0; padding: 24px; }
    h1 { margin: 0 0 4px; font-size: 1.6rem; }
    .sub { color: var(--ink-muted); margin-bottom: 20px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .card { background: var(--paper); border: 1px solid var(--panel-border); border-radius: 12px; padding: 16px; }
    .card h2 { margin: 0 0 10px; font-size: 1rem; color: var(--copper); text-transform: uppercase; letter-spacing: .06em; }
    .gate { background: var(--gate-bg); border: 2px solid var(--copper); border-radius: 12px; padding: 16px 18px; margin-bottom: 16px; }
    .gate code { font-size: 1rem; }
    pre, .mono { font-family: Consolas, monospace; font-size: .85rem; white-space: pre-wrap; background: color-mix(in srgb, var(--ink) 5%, transparent); padding: 10px; border-radius: 8px; max-height: 220px; overflow: auto; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .btn { border: 1px solid color-mix(in srgb, var(--copper) 45%, transparent); background: var(--paper); color: var(--ink); padding: 8px 12px; border-radius: 8px; cursor: pointer; font-size: .9rem; }
    .btn:hover:not(:disabled) { background: var(--gate-bg); }
    .btn:disabled { opacity: .65; cursor: wait; }
    .btn.primary { background: color-mix(in srgb, var(--copper) 15%, var(--paper)); font-weight: 600; }
    .btn.blocked { border-color: color-mix(in srgb, var(--stop) 35%, transparent); color: var(--stop); }
    .btn-pending { border-color: var(--wait); }
    .btn-success { border-color: var(--ok); color: color-mix(in srgb, var(--ok) 70%, var(--ink)); }
    .btn-failed { border-color: var(--stop); color: var(--stop); }
    .banner { background: color-mix(in srgb, var(--stop) 8%, var(--paper)); border: 1px solid color-mix(in srgb, var(--stop) 25%, transparent); color: var(--stop); padding: 10px 12px; border-radius: 8px; margin-bottom: 16px; font-weight: 600; }
    .ok-banner { background: color-mix(in srgb, var(--ok) 8%, var(--paper)); border-color: color-mix(in srgb, var(--ok) 25%, transparent); color: color-mix(in srgb, var(--ok) 70%, var(--ink)); }
    .warn-banner { background: color-mix(in srgb, var(--warn, #c9a227) 12%, var(--paper)); border-color: color-mix(in srgb, #c9a227 30%, transparent); }
    .relay-status { margin-top: 8px; }
    #toast { position: fixed; bottom: 20px; right: 20px; max-width: 420px; padding: 12px 14px; border-radius: 10px; background: var(--ink); color: var(--paper); display: none; z-index: 9; }
    #toast.error { background: var(--stop); color: var(--paper); }
    #modal { position: fixed; inset: 0; background: color-mix(in srgb, var(--ink) 18%, transparent); display: none; align-items: flex-start; justify-content: center; padding: 72px 20px 20px; z-index: 8; pointer-events: none; }
    #modal.open { pointer-events: auto; }
    #modal .panel { background: var(--paper); max-width: 900px; width: 100%; max-height: 78vh; overflow: auto; border-radius: 12px; padding: 18px; border: 1px solid color-mix(in srgb, var(--copper) 28%, transparent); box-shadow: 0 12px 40px rgba(44,35,29,.12); pointer-events: auto; }
    #modal .panel .modal-hint { margin: 0 0 10px; font-size: .82rem; color: var(--muted); }
    ul { margin: 8px 0 0 18px; }
    .muted { color: var(--ink-muted); font-size: .88rem; }
    textarea { width: 100%; min-height: 120px; padding: 10px; border-radius: 8px; border: 1px solid var(--panel-border); background: var(--paper); color: var(--ink); font-family: Consolas, monospace; font-size: .85rem; }
    input[type=text] { width: 100%; max-width: 320px; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--panel-border); background: var(--paper); color: var(--ink); }
    .plow { background: var(--gate-bg); border: 3px solid var(--copper); border-radius: 16px; padding: 22px 24px; margin-bottom: 18px; }
    .plow h2 { margin: 0 0 6px; font-size: 1.25rem; color: var(--ink); text-transform: none; letter-spacing: 0; }
    .plow .lead { margin: 0 0 16px; font-size: 1rem; color: var(--ink-muted); }
    .btn.hero { font-size: 1.05rem; padding: 14px 20px; font-weight: 700; }
    .btn.hero.primary { background: color-mix(in srgb, var(--copper) 22%, var(--paper)); border-width: 2px; }
    .load-row .btn { min-width: 118px; }
    .gd-hero { background: color-mix(in srgb, var(--copper) 6%, var(--paper)); border: 1px solid color-mix(in srgb, var(--copper) 35%, transparent); border-radius: 12px; padding: 14px 16px; margin-top: 12px; }
    .gd-hero h3 { margin: 0 0 8px; font-size: 1rem; text-transform: uppercase; letter-spacing: .05em; color: var(--ink-muted); }
    .gd-preview { background: rgba(44,35,29,.05); border-radius: 8px; padding: 12px; overflow: auto; max-height: 280px; font-size: .82rem; line-height: 1.45; white-space: pre-wrap; margin-top: 10px; }
    .gd-preview.hidden { display: none; }
    .gd-table { width: 100%; border-collapse: collapse; font-size: .88rem; }
    .gd-table th, .gd-table td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--panel-border); vertical-align: top; }
    .gd-table th { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; color: var(--ink-muted); }
    .gd-ready { color: var(--ok); font-weight: 600; }
    .gd-governor textarea { min-height: 140px; font-family: inherit; font-size: .95rem; line-height: 1.45; margin-top: 8px; }
    .gd-governor-output { margin-top: 14px; padding-top: 14px; border-top: 1px solid color-mix(in srgb, var(--copper) 25%, transparent); }
    .gd-governor-output.hidden { display: none; }
    .gd-governor-output h4 { margin: 14px 0 6px; font-size: .78rem; text-transform: uppercase; letter-spacing: .05em; color: var(--ink-muted); }
    .gd-verdict-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin: 12px 0; }
    .gd-verdict-card { background: var(--paper); border: 1px solid var(--panel-border); border-radius: 10px; padding: 10px 12px; }
    .gd-verdict-card .gd-k { display: block; font-size: .68rem; text-transform: uppercase; letter-spacing: .06em; color: var(--ink-muted); margin-bottom: 4px; }
    .gd-verdict-card .gd-v { display: block; font-weight: 700; font-size: .92rem; }
    .gd-verdict-no-go { border-color: color-mix(in srgb, var(--danger, #b42318) 45%, transparent); background: color-mix(in srgb, var(--danger, #b42318) 6%, var(--paper)); }
    .gd-verdict-review { border-color: color-mix(in srgb, var(--copper) 55%, transparent); }
    .gd-verdict-draft { border-color: color-mix(in srgb, var(--ok) 35%, transparent); }
    .gd-crew-list { margin: 6px 0 0 18px; padding: 0; }
    .gd-crew-list li { margin-bottom: 6px; }
  </style>
</head>
<body>
  <h1>Foreman Control Panel</h1>
  <p class="sub">Ben's operator dashboard · ${esc(status.generatedAt)} · <strong>Stops before Send</strong></p>
  <div class="banner ok-banner" style="margin-bottom:16px">
    <strong>This panel:</strong> <code>http://${HOST}:${PORT}</code> &nbsp;|&nbsp;
    <strong>Not this:</strong> <code>http://localhost:3000</code> (Werkles app preview — run <code>npm run dev</code> separately)
  </div>

  ${courierLockBanner}

  <div class="plow">
    <h2>START HERE — Network sync relay</h2>
    <p class="lead">1) <strong>Open Aeye Crew Bay</strong> (Robot Zone) · 2) <strong>Run Network Sync Relay</strong> below · 3) Click <strong>Send</strong> in Edge · 4) <strong>I Sent — Next Cousin</strong></p>
    <div class="actions">
      <button type="button" class="btn hero primary" data-action="open-aeye-crew-bay">Open Aeye Crew Bay</button>
      <button type="button" class="btn hero" id="relay-start-plow">Run Network Sync Relay</button>
      <button type="button" class="btn hero" id="relay-sent-plow" disabled>I Sent — Next Cousin</button>
    </div>
    <p class="muted" style="margin-top:14px">Daily packets: Refresh Crew Dispatch → Generate packet → courier loads tab · Send stays your gate.</p>
    <div class="actions load-row" style="margin-top:10px">
      <button type="button" class="btn" data-action="prepare-petra">Prepare Petra</button>
      <button type="button" class="btn" data-action="pin-desktop-shortcuts">Pin to Desktop</button>
    </div>
  </div>

  <div class="banner ok-banner">You are on the dashboard. Repo-root .cmd files are fallback only for emergencies.</div>

  <div class="gate">
    <div class="muted">Current gate</div>
    <code>${esc(status.gate)}</code>
  </div>

  ${formatGimpDashHomeCard(status.gd)}

  ${formatSpeakerPanelCard(status.speaker)}

  <div class="grid">
    <div class="card">
      <h2>Current state</h2>
      <pre>${esc(status.stateSummary || "(no summary)")}</pre>
    </div>
    <div class="card">
      <h2>Operator dashboard</h2>
      <pre>${esc(status.operatorSnippet || "(missing)")}</pre>
    </div>
    <div class="card">
      <h2>Active agent</h2>
      <pre>${esc(status.activeAgentSnippet || "(missing ACTIVE_AGENT.md)")}</pre>
    </div>
    <div class="card">
      <h2>Budget status</h2>
      <pre>${esc(status.budgetSnippet || "(missing BUDGET.md)")}</pre>
    </div>
    <div class="card">
      <h2>Context health</h2>
      ${formatContextHealthCard(status.relay?.contextHealth)}
    </div>
    <div class="card">
      <h2>Robot Zone lock</h2>
      <p><strong>Status:</strong> <code>${esc(relayLock?.status || "IDLE")}</code></p>
      <p class="muted">${esc(relayLock?.message || "Courier idle")}</p>
    </div>
    <div class="card">
      <h2>Crew dispatch status</h2>
      <pre>${esc(formatDispatch(status))}</pre>
    </div>
    <div class="card">
      <h2>Stale packet warnings</h2>
      <p class="muted">${esc(stale?.petraPacketsBeforeSync || "Check dispatch dashboard")}</p>
      <ul>${staleFiles || "<li>None listed</li>"}</ul>
      <p class="muted">Gate 05: ${esc(stale?.gate05 || "see cockpit")}</p>
    </div>
  </div>

  <div class="card" style="margin-top:16px" id="imagery-doctrine">
    <h2>Imagery doctrine</h2>
    ${formatImageryDoctrineCard()}
  </div>

  <div class="card" style="margin-top:16px" id="finance-command">
    <h2>Finance Command v0.1</h2>
    <p class="muted">Operator Cockpit spend tracker — classification &amp; flags only</p>
    ${formatFinanceCard(status.finance)}
  </div>

  <div class="card" style="margin-top:16px">
    <h2>Drop Zone (inbox .md only)</h2>
    <p class="muted">Max 100KB · server-generated filename · saved to foreman/handoffs/inbox/</p>
    <textarea id="drop-content" placeholder="Paste markdown for inbox..."></textarea>
    <p style="margin:8px 0"><label class="muted">Optional slug hint (sanitized server-side): </label>
    <input type="text" id="drop-slug" placeholder="crew-verdict-notes"></p>
    <div class="actions" style="margin-top:8px">
      <button type="button" class="btn primary" id="drop-save">Save to Inbox</button>
    </div>
    <p class="muted" style="margin-top:10px">Inbox markdown files:</p>
    <ul>${inboxList || "<li>None yet</li>"}</ul>
  </div>

  <div class="card" style="margin-top:16px" id="edge-dispatch-bay">
    <h2>Edge Dispatch Bay (Robot Zone)</h2>
    ${formatEdgeDispatchBayCard(status.edgeBay)}
  </div>

  <div class="card" style="margin-top:16px" id="crew-relay">
    <h2>AEYE Network Relay (automated)</h2>
    ${formatRelayPanel(status.relay?.session, status.relay?.manifest, status.relay?.relayLock)}
    <details style="margin-top:14px">
      <summary class="muted">Advanced / intake / fallback</summary>
      <div class="actions" style="margin-top:8px">
        <button type="button" class="btn" data-action="crew-relay-validate">Validate Inbox</button>
        <button type="button" class="btn" data-action="crew-relay-process">Process Responses</button>
        <button type="button" class="btn" data-action="crew-relay-issue-network-sync">Re-issue Network Sync</button>
        <button type="button" class="btn" data-action="crew-relay-self-test">Hash Self-Test</button>
      </div>
      <p class="muted" style="margin-top:8px">Emergency clipboard only (misconfigured if you need these during relay):</p>
      <div class="actions">
        <button type="button" class="btn" data-action="crew-relay-network-paste-petra">Clipboard Petra</button>
        <button type="button" class="btn" data-action="open-aeye-crew-bay">Open Aeye Crew Bay</button>
      </div>
    </details>
  </div>

  <div class="card" style="margin-top:16px">
    <h2>Safe local actions</h2>
    <div class="actions">
      <button type="button" class="btn primary" data-action="refresh-crew-dispatch">Refresh Crew Dispatch</button>
      <button type="button" class="btn" data-action="generate-petra">Generate Petra Packet</button>
      <button type="button" class="btn" data-action="generate-skybro">Generate Skybro Packet</button>
      <button type="button" class="btn" data-action="generate-ender">Generate Ender Packet</button>
      <button type="button" class="btn" data-action="generate-bean">Generate Bean Packet</button>
      <button type="button" class="btn" data-action="generate-computer">Generate Computer Packet</button>
    </div>
    <div class="actions" style="margin-top:8px">
      <button type="button" class="btn" data-action="open-outbox">Open Outbox Folder</button>
      <button type="button" class="btn" data-action="open-inbox">Open Inbox Folder</button>
      <button type="button" class="btn" data-action="open-reviews">Open Reviews Folder</button>
      <button type="button" class="btn" data-action="open-gate-review">Open Current Gate Review</button>
    </div>
    <div class="actions" style="margin-top:8px">
      <button type="button" class="btn" data-action="copy-petra-paste">Copy Latest Petra Paste Block</button>
      <button type="button" class="btn" data-action="copy-skybro-paste">Copy Latest Skybro Paste Block</button>
      <button type="button" class="btn" data-action="copy-ender-paste">Copy Latest Ender Paste Block</button>
      <button type="button" class="btn" data-action="copy-bean-paste">Copy Latest Bean Paste Block</button>
      <button type="button" class="btn" data-action="copy-computer-paste">Copy Latest Computer Paste Block</button>
    </div>
    <div class="actions" style="margin-top:8px">
      <button type="button" class="btn" data-action="show-current-gate">Show Current Gate</button>
      <button type="button" class="btn" data-action="show-active-agent">Show Active Agent</button>
      <button type="button" class="btn" data-action="show-budget-status">Show Budget Status</button>
    </div>
  </div>

  <div class="card" style="margin-top:16px">
    <h2>Blocked — human gates required</h2>
    <div class="actions">${blockedButtons}</div>
  </div>

  <div id="modal"><div class="panel"><p class="modal-hint" id="modal-hint">Cockpit reference — not an error. Click outside or Close to keep working.</p><h2 id="modal-title"></h2><pre id="modal-body"></pre><button type="button" class="btn" id="modal-close">Close</button></div></div>
  <div id="toast"></div>

  <script>
    const LOCAL_TOKEN = ${JSON.stringify(localToken)};

    const toast = document.getElementById('toast');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    function closeModal() {
      modal.style.display = 'none';
      modal.classList.remove('open');
    }
    document.getElementById('modal-close').onclick = closeModal;
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    function showToast(msg, isError) {
      toast.textContent = msg;
      toast.className = isError ? 'error' : '';
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 6000);
    }

    async function postJson(url, payload) {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Foreman-Local-Token': LOCAL_TOKEN
        },
        body: JSON.stringify(payload)
      });
      let data = {};
      try { data = await res.json(); } catch { data = { ok: false, error: 'Invalid JSON response' }; }
      return { res, data };
    }

    function resetButton(btn, original) {
      btn.disabled = false;
      btn.classList.remove('btn-pending', 'btn-success', 'btn-failed');
      btn.textContent = original;
    }

    async function runAction(action, btn) {
      const original = btn.textContent;
      btn.disabled = true;
      btn.classList.remove('btn-success', 'btn-failed');
      btn.classList.add('btn-pending');
      btn.textContent = 'Working...';

      try {
        const { res, data } = await postJson('/api/action', { action });

        if (data.blocked) {
          btn.classList.add('btn-failed');
          btn.textContent = 'HUMAN GATE';
          showToast('HUMAN GATE REQUIRED — ' + action, true);
          setTimeout(() => resetButton(btn, original), 2500);
          return;
        }

        if (!res.ok || !data.ok) {
          btn.classList.add('btn-failed');
          btn.textContent = 'FAILED';
          showToast(data.error || data.message || ('Failed (' + res.status + ')'), true);
          setTimeout(() => resetButton(btn, original), 2500);
          return;
        }

        btn.classList.remove('btn-pending');
        btn.classList.add('btn-success');
        btn.textContent = data.successLabel || 'Done';
        showToast(data.message || ('Done: ' + action), false);

        if (data.content) {
          modalTitle.textContent = data.title || 'Cockpit';
          modalBody.textContent = data.content;
          modal.style.display = 'flex';
          modal.classList.add('open');
        }

        if (['refresh-crew-dispatch','generate-petra','generate-skybro','generate-ender','generate-bean','generate-computer','refresh-finance-dashboard','crew-relay-process','crew-relay-validate'].includes(action)) {
          setTimeout(() => location.reload(), 900);
          return;
        }

        if (['gd-thread-refresh','copy-thread-refresh-packet','open-thread-refresh-packet'].includes(action)) {
          await refreshGimpDashPanel();
        }

        setTimeout(() => resetButton(btn, original), 1800);
      } catch (e) {
        btn.classList.add('btn-failed');
        btn.textContent = 'FAILED';
        showToast(e.message || String(e), true);
        setTimeout(() => resetButton(btn, original), 2500);
      }
    }

    document.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => runAction(btn.dataset.action, btn));
    });

    async function refreshGimpDashPanel() {
      try {
        const res = await fetch('/api/gd/status');
        const data = await res.json();
        const meta = document.getElementById('gd-output-meta');
        const preview = document.getElementById('gd-packet-preview');
        if (!meta || !preview) return;

        if (data.threadRefresh?.exists) {
          meta.innerHTML = '<span class="gd-ready">Ready</span> · ' + data.threadRefresh.chars + ' chars · ' +
            (data.threadRefresh.modifiedAt || '') +
            (data.threadRefresh.runId ? ' · run <code>' + data.threadRefresh.runId + '</code>' : '');
          preview.hidden = false;
          preview.textContent = data.threadRefresh.preview || '';
        } else {
          meta.textContent = 'No packet yet — route thread refresh intent or click Generate.';
          preview.hidden = true;
          preview.textContent = '';
        }

        const mt = document.querySelector('#gd-mission-table tbody');
        if (mt) {
          mt.innerHTML = (data.missionClasses || []).map(m => {
            const mode = m.generationMode === 'COCKPIT_DIRECT' ? 'cockpit direct' : (m.recipients?.length ? m.recipients.join(', ') : '—');
            return '<tr><td><code>' + m.id + '</code></td><td>' + m.label + '</td><td>' + mode + '</td></tr>';
          }).join('') || '<tr><td colspan="3" class="muted">None</td></tr>';
        }

        const rt = document.querySelector('#gd-runs-table tbody');
        if (rt) {
          rt.innerHTML = (data.runs || []).slice(0, 8).map(r =>
            '<tr><td><code>' + r.runId + '</code></td><td>' + r.missionClass + '</td><td>' + r.status + '</td></tr>'
          ).join('') || '<tr><td colspan="3" class="muted">No runs yet</td></tr>';
        }
      } catch (e) {
        showToast('GimpDash refresh failed: ' + (e.message || String(e)), true);
      }
    }

    function escGovernorHtml(s) {
      return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function renderGovernorOutput(result, formatted) {
      const out = document.getElementById('gd-governor-output');
      const copyBtn = document.getElementById('gd-copy-governor-brief');
      if (!out || !result) return;

      const verdictClass = result.verdict === 'NO_GO'
        ? 'gd-verdict-no-go'
        : result.verdict === 'HUMAN_REVIEW_REQUIRED'
          ? 'gd-verdict-review'
          : 'gd-verdict-draft';

      const crewHtml = (result.routedCrew || []).map(function (c) {
        const lens = c.lens ? ' · <span class="muted">' + escGovernorHtml(c.lens) + '</span>' : '';
        return '<li><strong>' + escGovernorHtml(c.label) + '</strong> · ' +
          escGovernorHtml(c.seat) + ' · ' + escGovernorHtml(c.platform) + lens + '</li>';
      }).join('') || '<li class="muted">Cockpit direct — no cousin packets</li>';

      const hardStopsHtml = (result.hardStops || []).map(function (h) {
        return '<li>' + escGovernorHtml(h) + '</li>';
      }).join('');

      const threadRefreshCta = result.missionClass === 'THREAD_REFRESH_PACKET' && result.verdict !== 'NO_GO'
        ? '<div class="actions" style="margin-top:10px"><button type="button" class="btn primary" data-action="gd-thread-refresh">Generate Thread Refresh Packet</button></div>'
        : '';

      out.innerHTML =
        '<div class="gd-verdict-grid">' +
          '<div class="gd-verdict-card ' + verdictClass + '"><span class="gd-k">Verdict</span><span class="gd-v">' + escGovernorHtml(result.verdict) + '</span></div>' +
          '<div class="gd-verdict-card"><span class="gd-k">Topic</span><span class="gd-v">' + escGovernorHtml(result.missionLabel) + '</span><span class="muted">' + escGovernorHtml(result.missionClass) + '</span></div>' +
          '<div class="gd-verdict-card"><span class="gd-k">Risk</span><span class="gd-v">' + escGovernorHtml(result.risk) + '</span></div>' +
          '<div class="gd-verdict-card"><span class="gd-k">Human gate</span><span class="gd-v">' + (result.humanGate ? 'Yes' : 'No') + '</span><span class="muted">' + escGovernorHtml(result.humanGateLevel) + '</span></div>' +
        '</div>' +
        '<p class="muted">' + escGovernorHtml(result.missionDescription || '') + '</p>' +
        '<h4>Auto-routed crew</h4><ul class="gd-crew-list">' + crewHtml + '</ul>' +
        '<h4>Hard stops</h4><ul>' + hardStopsHtml + '</ul>' +
        '<p><strong>Next:</strong> ' + escGovernorHtml(result.nextAction) + '</p>' +
        threadRefreshCta +
        '<h4>Draft packet</h4><pre class="gd-preview">' + escGovernorHtml(result.generatedPacket) + '</pre>' +
        '<details><summary><strong>Full export</strong></summary><pre class="gd-preview">' + escGovernorHtml(formatted) + '</pre></details>';

      out.classList.remove('hidden');
      if (copyBtn) {
        copyBtn.disabled = false;
        copyBtn.dataset.brief = formatted || '';
      }

      out.querySelectorAll('[data-action]').forEach(function (btn) {
        btn.addEventListener('click', function () { runAction(btn.dataset.action, btn); });
      });
    }

    async function routeGovernorIntent() {
      const input = document.getElementById('gd-intent-input');
      const btn = document.getElementById('gd-route-btn');
      if (!input || !btn) return;

      const original = btn.textContent;
      btn.disabled = true;
      btn.classList.add('btn-pending');
      btn.textContent = 'Routing...';

      try {
        const { res, data } = await postJson('/api/gd/route-intent', { intent: input.value || '' });
        if (!res.ok || !data.ok) {
          showToast(data.error || 'Governor routing failed', true);
          return;
        }
        renderGovernorOutput(data.result, data.formatted);
        showToast('Governor routed: ' + (data.result?.missionClass || '—'), false);
      } catch (e) {
        showToast(e.message || String(e), true);
      } finally {
        btn.disabled = false;
        btn.classList.remove('btn-pending');
        btn.textContent = original;
      }
    }

    const gdRouteBtn = document.getElementById('gd-route-btn');
    if (gdRouteBtn) gdRouteBtn.addEventListener('click', routeGovernorIntent);

    const gdCopyBriefBtn = document.getElementById('gd-copy-governor-brief');
    if (gdCopyBriefBtn) {
      gdCopyBriefBtn.addEventListener('click', async function () {
        const brief = this.dataset.brief;
        if (!brief) return;
        try {
          await navigator.clipboard.writeText(brief);
          showToast('Governor brief copied', false);
        } catch (e) {
          showToast('Copy failed — select Full export manually', true);
        }
      });
    }

    if (location.hash === '#gimpdash') {
      document.getElementById('gimpdash')?.scrollIntoView({ behavior: 'smooth' });
    }
    if (location.hash === '#gd-speaker') {
      document.getElementById('gd-speaker')?.scrollIntoView({ behavior: 'smooth' });
    }

    const speakerDraftBtn = document.getElementById('speaker-draft-btn');
    if (speakerDraftBtn) {
      speakerDraftBtn.addEventListener('click', async function () {
        const title = document.getElementById('speaker-draft-title')?.value || '';
        const event = document.getElementById('speaker-draft-event')?.value || '';
        const context = document.getElementById('speaker-draft-context')?.value || '';
        const lesson = document.getElementById('speaker-draft-lesson')?.value || '';
        const why = document.getElementById('speaker-draft-why')?.value || '';
        const warning_triggers = document.getElementById('speaker-draft-triggers')?.value || '';
        const original = speakerDraftBtn.textContent;
        speakerDraftBtn.disabled = true;
        speakerDraftBtn.textContent = 'Saving...';
        try {
          const { res, data } = await postJson('/api/gd/speaker/draft', {
            title,
            event,
            context,
            lesson,
            why,
            warning_triggers,
          });
          if (!res.ok || !data.ok) {
            showToast(data.error || 'Speaker draft failed', true);
            return;
          }
          showToast(data.message || 'DRAFT saved', false);
          setTimeout(() => location.reload(), 600);
        } catch (e) {
          showToast(e.message || String(e), true);
        } finally {
          speakerDraftBtn.disabled = false;
          speakerDraftBtn.textContent = original;
        }
      });
    }

    async function runRelay(path, btn, original) {
      btn.disabled = true;
      btn.classList.add('btn-pending');
      btn.textContent = 'Working...';
      try {
        const { res, data } = await postJson(path, {});
        if (!res.ok || !data.ok) {
          btn.classList.add('btn-failed');
          btn.textContent = 'FAILED';
          showToast(data.error || data.message || 'Relay failed', true);
          setTimeout(() => resetButton(btn, original), 2500);
          return;
        }
        showToast(data.message || 'Relay updated', false);
        setTimeout(() => location.reload(), 500);
      } catch (e) {
        btn.classList.add('btn-failed');
        btn.textContent = 'FAILED';
        showToast(e.message || String(e), true);
        setTimeout(() => resetButton(btn, original), 2500);
      }
    }

    const relayStart = document.getElementById('relay-start');
    const relayStartPlow = document.getElementById('relay-start-plow');
    const relaySentPlow = document.getElementById('relay-sent-plow');
    const relaySent = document.getElementById('relay-sent');
    const sessionState = ${JSON.stringify(status.relay?.session?.state || "idle")};
    if (relaySentPlow && sessionState === 'awaiting_send') {
      relaySentPlow.disabled = false;
    }
    function bindRelay(btn, path) {
      if (!btn) return;
      btn.addEventListener('click', function () {
        runRelay(path, this, this.textContent);
      });
    }
    bindRelay(relayStart, '/api/relay/start');
    bindRelay(relayStartPlow, '/api/relay/start');
    bindRelay(relaySent, '/api/relay/sent');
    bindRelay(relaySentPlow, '/api/relay/sent');
    const relayCancel = document.getElementById('relay-cancel');
    if (relayCancel) {
      relayCancel.addEventListener('click', function () {
        runRelay('/api/relay/cancel', this, this.textContent);
      });
    }
    const relayReset = document.getElementById('relay-reset');
    if (relayReset) {
      relayReset.addEventListener('click', function () {
        runRelay('/api/relay/reset', this, this.textContent);
      });
    }

    document.getElementById('drop-save').addEventListener('click', async function () {
      const btn = this;
      const original = btn.textContent;
      btn.disabled = true;
      btn.classList.add('btn-pending');
      btn.textContent = 'Saving...';
      try {
        const { res, data } = await postJson('/api/drop-zone/save', {
          content: document.getElementById('drop-content').value,
          slugHint: document.getElementById('drop-slug').value
        });
        if (!res.ok || !data.ok) {
          btn.classList.add('btn-failed');
          btn.textContent = 'FAILED';
          showToast(data.error || data.message || 'Save failed', true);
          setTimeout(() => resetButton(btn, original), 2500);
          return;
        }
        btn.classList.add('btn-success');
        btn.textContent = 'Saved';
        showToast('Saved ' + data.filename + ' to inbox', false);
        document.getElementById('drop-content').value = '';
        setTimeout(() => location.reload(), 900);
      } catch (e) {
        btn.classList.add('btn-failed');
        btn.textContent = 'FAILED';
        showToast(e.message || String(e), true);
        setTimeout(() => resetButton(btn, original), 2500);
      }
    });
  </script>
</body>
</html>`;
}

function formatDispatch(status) {
  const d = status.dispatch;
  if (d?.missing) return "DISPATCH_DASHBOARD.json missing — click Refresh Crew Dispatch";
  const lines = [
    `Dashboard: ${d.generatedAt || "unknown"}`,
    `main: ${d.mainHead || "?"}`,
    `Latest: ${status.latestDispatch?.packetId || d.latestDispatch?.packetId || "none"}`,
    `Status: ${status.latestDispatch?.status || d.latestDispatch?.status || "idle"}`,
  ];
  return lines.join("\n");
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function readBody(req, maxBytes = DROP_ZONE_MAX_BYTES + 4096) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw new Error("Request body too large");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function rejectUnauthorized(res) {
  return sendJson(res, 401, { ok: false, success: false, error: "Unauthorized — missing or invalid local token" });
}

function openBrowser() {
  const panelUrl = `http://${HOST}:${PORT}/`;
  spawn("cmd.exe", ["/c", "start", "", panelUrl], {
    cwd: REPO_ROOT,
    windowsHide: true,
    detached: true,
  }).unref();
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);

  if (req.method === "GET" && url.pathname === "/api/gd/status") {
    return sendJson(res, 200, buildGdStatus());
  }

  if (req.method === "GET" && url.pathname === "/api/gd/speaker") {
    return sendJson(res, 200, buildSpeakerStatus(REPO_ROOT));
  }

  if (req.method === "GET" && (url.pathname === "/gd" || url.pathname === "/gimpdash")) {
    res.writeHead(302, { Location: "/#gimpdash" });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/gd/speaker") {
    res.writeHead(302, { Location: "/#gd-speaker" });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/status") {
    return sendJson(res, 200, buildStatus());
  }

  if (req.method === "GET" && url.pathname === "/api/relay/status") {
    return sendJson(res, 200, loadRelayStatusSync());
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
    const token = ensureLocalToken();
    const html = renderPage(buildStatus(), token, loadPanelTheme());
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  if (req.method === "POST") {
    if (!verifyLocalToken(req)) {
      return rejectUnauthorized(res);
    }

    if (url.pathname === "/api/gd/route-intent") {
      try {
        const body = await readBody(req);
        const intent = typeof body.intent === "string" ? body.intent : "";
        const result = classifyGdCommand(intent);
        return sendJson(res, 200, {
          ok: true,
          result,
          formatted: formatGdCommandVerdict(result),
        });
      } catch (err) {
        return sendJson(res, 500, { ok: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/gd/speaker/draft") {
      try {
        const body = await readBody(req);
        const saved = draftSpeakerEntry(REPO_ROOT, body);
        return sendJson(res, 200, saved);
      } catch (err) {
        return sendJson(res, 400, { ok: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/action") {
      try {
        const body = await readBody(req);
        const action = body.action;
        if (!action) return sendJson(res, 400, { ok: false, success: false, error: "Missing action" });

      if (BLOCKED_ACTIONS.some((b) => b.id === action)) {
        return sendJson(res, 403, {
          ok: false,
          success: false,
          blocked: true,
          message: "HUMAN GATE REQUIRED",
          action,
        });
      }
      if (FINANCE_BLOCKED_ACTIONS.some((b) => b.id === action)) {
        return sendJson(res, 403, {
          ok: false,
          success: false,
          blocked: true,
          message: "HUMAN GATE REQUIRED — finance action blocked",
          action,
        });
      }

        const result = await handleAction(action);
        if (result.blocked) {
          return sendJson(res, 403, { ok: false, success: false, ...result });
        }
        return sendJson(res, 200, { ok: true, ...result });
      } catch (err) {
        return sendJson(res, 500, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/drop-zone/save") {
      try {
        const body = await readBody(req);
        const saved = await saveDropZone(body.content, body.slugHint);
        return sendJson(res, 200, {
          ok: true,
          success: true,
          message: `Saved ${saved.filename} to inbox`,
          successLabel: "Saved",
          ...saved,
        });
      } catch (err) {
        return sendJson(res, 400, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/relay/start") {
      try {
        const body = await readBody(req);
        const result = await relayApiStart(Boolean(body.reissue));
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 500, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/relay/sent") {
      try {
        const result = await relayApiSent();
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 500, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/relay/cancel") {
      try {
        const result = await relayApiCancel();
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 500, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    if (url.pathname === "/api/relay/reset") {
      try {
        const result = await relayApiReset();
        return sendJson(res, 200, result);
      } catch (err) {
        return sendJson(res, 500, { ok: false, success: false, error: err.message || String(err) });
      }
    }

    return sendJson(res, 404, { ok: false, success: false, error: "Not found" });
  }

  sendJson(res, 404, { ok: false, error: "Not found" });
});

async function main() {
  console.log("Starting Foreman Control Panel...");
  ensureControlPanelDir();
  ensureLocalToken();
  let portState = await ensurePortAvailable();

  if (portState === "already_running") {
    const gdOk = await probeGimpDashRoute();
    if (gdOk) {
      if (!process.argv.includes("--no-browser")) {
        openBrowser();
      }
      console.log("Reused existing server. Close its terminal window to stop Foreman.");
      return;
    }

    console.log("Foreman is running but GimpDash routes are missing — restarting with updated server...");
    const listenerPid = await getListeningPid(PORT);
    if (listenerPid) {
      const pidRecord = loadPidRecord();
      const commandLine = await getProcessCommandLine(listenerPid);
      const isKnownForeman =
        (pidRecord && pidRecord.pid === listenerPid) || isForemanControlProcess(commandLine);
      if (!isKnownForeman) {
        throw new Error(
          `HUMAN GATE REQUIRED: port ${PORT} occupied by PID ${listenerPid} without GimpDash routes. Close manually.`
        );
      }
      await killProcess(listenerPid);
      await sleep(600);
      if (await getListeningPid(PORT)) {
        throw new Error(`HUMAN GATE REQUIRED: port ${PORT} still occupied after Foreman restart.`);
      }
    }
    portState = "free";
  }

  server.listen(PORT, HOST, () => {
    writePidRecord();
    console.log(`Foreman Control Panel listening on http://${HOST}:${PORT}`);
    console.log(`Repo: ${REPO_ROOT}`);
    console.log("Localhost only. POST endpoints require local token.");
    console.log("Stops before Send. Close this window to stop the server.");
    if (!process.argv.includes("--no-browser")) {
      openBrowser();
    }
  });
}

function shutdown() {
  removePidRecord();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("exit", removePidRecord);

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
