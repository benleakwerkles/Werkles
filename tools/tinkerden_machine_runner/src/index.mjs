#!/usr/bin/env node
import crypto from "node:crypto";
import http from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");
const MACHINE = normalizeMachine(process.env.TINKERDEN_MACHINE || os.hostname() || "Betsy");
const DEFAULT_PORT = Number(process.env.TINKERDEN_MACHINE_RUNNER_PORT || 4877);
const INBOX_DIR = path.join(ROOT, "tinkerden", "machine-runner", "inbox", MACHINE);
const RECEIPT_DIR = path.join(ROOT, "tinkerden", "machine-runner", "receipts", MACHINE);
const TINKERDEN_RECEIPT_DIR = path.join(ROOT, "data", "tinkerden", "receipts");
const RECEIPT_PICKUP_PATH = path.join(ROOT, "data", "organism", "receipt_pickup.jsonl");
const EVENTS_PATH = path.join(ROOT, "data", "organism", "events.jsonl");
const DEFAULT_WORKSPACE_CONFIG = path.join(ROOT, "foreman", "soledash", "POWERToys_AUTOPASTE_HELPER_CONFIG.json");
const AEYE_MESSAGE_ROOT = path.join(ROOT, "foreman", "messages");
const AEYE_OUTBOX_DIR = path.join(AEYE_MESSAGE_ROOT, "outbox");
const AEYE_RECEIVED_DIR = path.join(AEYE_MESSAGE_ROOT, "received");
const AEYE_ANSWERS_DIR = path.join(AEYE_MESSAGE_ROOT, "answers");
const AEYE_RETURNED_DIR = path.join(AEYE_MESSAGE_ROOT, "returned");
const AEYE_RECEIPTS_DIR = path.join(AEYE_MESSAGE_ROOT, "receipts");
const ANSWER_EVENTS_PATH = path.join(ROOT, "data", "organism", "aeye-answer-events.jsonl");

function normalizeMachine(value) {
  const text = String(value || "").trim().toLowerCase();
  if (text === "betsy") return "Betsy";
  if (text === "doss") return "Doss";
  if (text === "sally") return "Sally";
  if (text === "spanzee") return "Spanzee";
  return text ? text[0].toUpperCase() + text.slice(1) : "Betsy";
}

function usage() {
  return [
    "Usage:",
    "  node tools/tinkerden_machine_runner/src/index.mjs serve [--port 4877]",
    "  node tools/tinkerden_machine_runner/src/index.mjs handle --request <request.json>",
    "  node tools/tinkerden_machine_runner/src/index.mjs answer-once [--packet <packet_id_or_path>]",
    "  node tools/tinkerden_machine_runner/src/index.mjs answer-watch [--interval-ms 1000]",
    "  node tools/tinkerden_machine_runner/src/index.mjs self-test",
  ].join("\n");
}

function parseArgs(argv) {
  const [command = "serve", ...rest] = argv;
  const args = {};
  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token.startsWith("--")) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const next = rest[i + 1];
    if (!next || next.startsWith("--")) throw new Error(`Missing value for --${key}`);
    args[key] = next;
    i += 1;
  }
  return { command, args };
}

function nowIso() {
  return new Date().toISOString();
}

function compactStamp(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function slash(value) {
  return value.split(path.sep).join("/");
}

function repoRel(fullPath) {
  return slash(path.relative(ROOT, fullPath));
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function appendJsonl(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.appendFile(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function run(command, args, input, options = {}) {
  return new Promise((resolve, reject) => {
    const timeoutMs = options.timeoutMs || 45000;
    const child = spawn(command, args, {
      cwd: ROOT,
      windowsHide: options.windowsHide ?? true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`${command} timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`${command} exited ${code}: ${stderr || stdout}`.trim()));
    });
    child.stdin.end(input || "");
  });
}

async function setClipboard(text) {
  const script = [
    "$text = [Console]::In.ReadToEnd();",
    "for ($i = 0; $i -lt 5; $i++) {",
    "  try { Set-Clipboard -Value $text; exit 0 }",
    "  catch { Start-Sleep -Milliseconds 200 }",
    "}",
    "exit 1",
  ].join(" ");
  await run(
    "powershell.exe",
    ["-Sta", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
    text,
  );
}

function normalizeClipboardText(value) {
  return String(value || "").replace(/\r\n/g, "\n").replace(/\n+$/g, "");
}

async function verifyClipboard(text) {
  const result = await run(
    "powershell.exe",
    ["-Sta", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", "Get-Clipboard -Raw"],
  );
  return normalizeClipboardText(result.stdout) === normalizeClipboardText(text);
}

async function readWorkspaceTarget(requestedTarget) {
  if (requestedTarget && requestedTarget.mode) return requestedTarget;

  const config = await readJson(DEFAULT_WORKSPACE_CONFIG).catch(() => null);
  const targetId = requestedTarget?.id || config?.default_workspace_target || "none";
  const target = config?.workspace_targets?.[targetId];
  if (!target) {
    return {
      id: targetId,
      label: targetId,
      mode: "none",
      configured: false,
      configuration_error: "WORKSPACE_TARGET_NOT_CONFIGURED",
    };
  }

  return {
    id: targetId,
    label: target.label || targetId,
    mode: target.mode || "none",
    command: target.command || "",
    args: Array.isArray(target.args) ? target.args.map(String) : [],
    window_title: target.window_title || "",
    configured: target.enabled !== false && target.mode !== "none",
  };
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

async function runWorkspaceTarget(target) {
  if (!target.configured || target.mode === "none") {
    return {
      attempted: false,
      focused: false,
      status: "SKIPPED",
      detail: target.configuration_error || "NO_WORKSPACE_TARGET",
    };
  }

  if (target.mode === "window_title") {
    if (!target.window_title) {
      return { attempted: false, focused: false, status: "BLOCKED", detail: "NO_WINDOW_TITLE" };
    }
    await activateWindow(String(target.window_title));
    return { attempted: true, focused: true, status: "WORKSPACE_FOCUSED", detail: "WINDOW_FOCUSED" };
  }

  if (target.mode === "process") {
    const command = String(target.command || target.target || "");
    if (!command) return { attempted: false, focused: false, status: "BLOCKED", detail: "NO_PROCESS_COMMAND" };
    const result = await run(command, Array.isArray(target.args) ? target.args.map(String) : [], "", {
      windowsHide: false,
      timeoutMs: 60000,
    });
    return {
      attempted: true,
      focused: true,
      status: "WORKSPACE_FOCUSED",
      detail: "PROCESS_COMPLETED",
      stdout: result.stdout.slice(0, 4000),
      stderr: result.stderr.slice(0, 4000),
    };
  }

  return { attempted: false, focused: false, status: "BLOCKED", detail: `UNSUPPORTED_WORKSPACE_MODE:${target.mode}` };
}

function assertPacket(request) {
  const targetMachine = normalizeMachine(request.target_machine || request.packet?.machine || MACHINE);
  if (targetMachine !== MACHINE) {
    throw new Error(`PACKET_TARGET_MISMATCH:${targetMachine}:local:${MACHINE}`);
  }
  if (!request.packet_id) throw new Error("PACKET_ID_REQUIRED");
  if (!request.packet_text) throw new Error("PACKET_TEXT_REQUIRED");
  return targetMachine;
}

function safeName(value) {
  return String(value || "unknown").replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function answerReceiptPath(packetId) {
  return path.join(AEYE_RECEIPTS_DIR, `nerdkle_answer_receipt_${safeName(packetId)}.json`);
}

function answerPath(packetId) {
  return path.join(AEYE_ANSWERS_DIR, `${safeName(packetId)}.json`);
}

function returnedAnswerPath(packetId) {
  return path.join(AEYE_RETURNED_DIR, `${safeName(packetId)}.json`);
}

function receivedPacketPath(packetId) {
  return path.join(AEYE_RECEIVED_DIR, `${safeName(packetId)}.json`);
}

function packetCommandText(packet) {
  const payload = packet?.payload && typeof packet.payload === "object" ? packet.payload : {};
  for (const key of ["command", "task_text", "task", "question", "mission"]) {
    if (typeof payload[key] === "string" && payload[key].trim()) return payload[key].trim();
  }
  return JSON.stringify(payload, null, 2);
}

function buildNerdkleAnswer(packet, receivedAt) {
  const command = packetCommandText(packet);
  return [
    `NerdkleAnswerWorker@${MACHINE} received packet ${packet.packet_id}.`,
    `Target: ${packet.target_aeye}@${packet.target_machine}.`,
    `Received at: ${receivedAt}.`,
    "",
    "Answer:",
    `I can act on the packet text. The requested command/query was: ${command}`,
    "",
    "Proof standard:",
    "- This answer was produced by a separate machine-runner process after reading foreman/messages/outbox.",
    "- It is not a model-chat proof and not an external Aeye UI proof.",
    "- It does prove packet-left, received, answered, and answer-returned inside the local Nerdkle organism transport."
  ].join("\n");
}

async function listOutboxPacketFiles() {
  const entries = await fs.readdir(AEYE_OUTBOX_DIR, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(AEYE_OUTBOX_DIR, entry.name))
    .sort();
}

async function resolveOutboxPacket(target) {
  if (!target) return null;
  const candidate = path.isAbsolute(target) ? target : path.join(ROOT, target);
  if (await fileExists(candidate)) return candidate;
  const byId = path.join(AEYE_OUTBOX_DIR, `${safeName(target)}.json`);
  return (await fileExists(byId)) ? byId : null;
}

async function findAnswerablePackets(target) {
  const explicit = await resolveOutboxPacket(target);
  const files = explicit ? [explicit] : await listOutboxPacketFiles();
  const answerable = [];
  for (const filePath of files) {
    const packet = await readJson(filePath).catch(() => null);
    if (!packet || !packet.packet_id) continue;
    if (normalizeMachine(packet.target_machine || MACHINE) !== MACHINE) continue;
    if (await fileExists(answerReceiptPath(packet.packet_id))) continue;
    answerable.push({ filePath, packet });
  }
  return answerable;
}

async function answerAeyePacket(filePath, packet) {
  const receivedAt = nowIso();
  const packetId = String(packet.packet_id);
  const answerText = buildNerdkleAnswer(packet, receivedAt);
  const answer = {
    schema: "nerdkle_aeye_answer_v0",
    packet_id: packetId,
    origin_surface: packet.origin_surface || "UNKNOWN",
    target_aeye: packet.target_aeye || "UNKNOWN",
    target_machine: packet.target_machine || MACHINE,
    worker: `NerdkleAnswerWorker@${MACHINE}`,
    worker_pid: process.pid,
    received_at: receivedAt,
    answered_at: nowIso(),
    source_outbox_path: repoRel(filePath),
    source_outbox_sha256: sha256(await fs.readFile(filePath, "utf8")),
    answer_text: answerText,
    answer_sha256: sha256(answerText)
  };
  const received = {
    schema: "nerdkle_aeye_received_v0",
    packet_id: packetId,
    received_at: receivedAt,
    worker: answer.worker,
    worker_pid: process.pid,
    source_outbox_path: repoRel(filePath),
    source_status: packet.status || "UNKNOWN",
    packet
  };
  const returned = {
    schema: "nerdkle_answer_returned_v0",
    packet_id: packetId,
    returned_at: nowIso(),
    worker: answer.worker,
    answer_path: repoRel(answerPath(packetId)),
    answer_sha256: answer.answer_sha256,
    return_status: "ANSWER_RETURNED_TO_ORGANISM"
  };
  const receipt = {
    schema: "nerdkle_answer_receipt_v0",
    receipt_id: `nerdkle_answer_receipt_${safeName(packetId)}`,
    packet_id: packetId,
    from_aeye: packet.target_aeye || "Dink",
    from_machine: MACHINE,
    status: "ANSWER_RETURNED",
    message: `NerdkleAnswerWorker@${MACHINE} received, answered, and returned packet ${packetId}.`,
    created_at: nowIso(),
    source_outbox_path: repoRel(filePath),
    received_path: repoRel(receivedPacketPath(packetId)),
    answer_path: repoRel(answerPath(packetId)),
    returned_path: repoRel(returnedAnswerPath(packetId)),
    answer_sha256: answer.answer_sha256,
    proof: {
      packet_left: repoRel(filePath),
      packet_received: repoRel(receivedPacketPath(packetId)),
      packet_answered: repoRel(answerPath(packetId)),
      answer_returned: repoRel(returnedAnswerPath(packetId))
    },
    limitation: "Local Nerdkle organism worker proof. Not external chat UI proof."
  };
  const event = {
    event_type: "nerdkle_aeye_answer_returned",
    packet_id: packetId,
    receipt_id: receipt.receipt_id,
    timestamp: receipt.created_at,
    worker: answer.worker,
    status: receipt.status,
    source_outbox_path: receipt.source_outbox_path,
    received_path: receipt.received_path,
    answer_path: receipt.answer_path,
    returned_path: receipt.returned_path,
    answer_sha256: receipt.answer_sha256
  };
  const pickup = {
    receipt_id: receipt.receipt_id,
    packet_id: packetId,
    linked_packet_id: packetId,
    mission: packetCommandText(packet).slice(0, 240),
    producer: answer.worker,
    status_guess: receipt.status,
    timestamp: receipt.created_at,
    path: repoRel(answerReceiptPath(packetId)),
    proof_reference: repoRel(answerReceiptPath(packetId))
  };

  await writeJson(receivedPacketPath(packetId), received);
  await writeJson(answerPath(packetId), answer);
  await writeJson(returnedAnswerPath(packetId), returned);
  await writeJson(answerReceiptPath(packetId), receipt);
  await appendJsonl(ANSWER_EVENTS_PATH, event);
  await appendJsonl(EVENTS_PATH, event);
  await appendJsonl(RECEIPT_PICKUP_PATH, pickup);

  return {
    ok: true,
    packet_id: packetId,
    status: receipt.status,
    receipt_id: receipt.receipt_id,
    source_outbox_path: receipt.source_outbox_path,
    received_path: receipt.received_path,
    answer_path: receipt.answer_path,
    returned_path: receipt.returned_path,
    receipt_path: repoRel(answerReceiptPath(packetId)),
    answer_sha256: receipt.answer_sha256,
    worker_pid: process.pid,
    limitation: receipt.limitation
  };
}

async function answerOnce(target) {
  const answerable = await findAnswerablePackets(target);
  if (answerable.length === 0) {
    return { ok: true, status: "NO_ANSWERABLE_PACKETS", answered: [] };
  }
  const [next] = answerable;
  return {
    ok: true,
    status: "ANSWERED_ONE_PACKET",
    answered: [await answerAeyePacket(next.filePath, next.packet)]
  };
}

async function answerWatch(intervalMs = 1000) {
  const seen = new Set(await listOutboxPacketFiles());
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const files = await listOutboxPacketFiles();
      const fresh = files.filter((filePath) => !seen.has(filePath));
      for (const filePath of fresh) seen.add(filePath);
      for (const filePath of fresh) {
        const packet = await readJson(filePath).catch(() => null);
        if (!packet?.packet_id) continue;
        if (normalizeMachine(packet.target_machine || MACHINE) !== MACHINE) continue;
        if (await fileExists(answerReceiptPath(packet.packet_id))) continue;
        const result = {
          ok: true,
          status: "ANSWERED_WATCH_PACKET",
          answered: [await answerAeyePacket(filePath, packet)]
        };
        console.log(JSON.stringify(result, null, 2));
      }
    } catch (error) {
      await appendJsonl(ANSWER_EVENTS_PATH, {
        event_type: "nerdkle_aeye_answer_error",
        status: "FAIL",
        timestamp: nowIso(),
        worker: `NerdkleAnswerWorker@${MACHINE}`,
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      running = false;
    }
  };
  console.log(JSON.stringify({ ok: true, event: "answer_watch_started", machine: MACHINE, interval_ms: intervalMs }, null, 2));
  setInterval(tick, intervalMs);
  void tick();
}

async function handlePacket(request) {
  const targetMachine = assertPacket(request);
  const timestamp = nowIso();
  const packetId = String(request.packet_id);
  const receiptId = compactStamp("workspace_relay_receipt");
  const workspaceTarget = await readWorkspaceTarget(request.workspace_target);
  const packetPath = path.join(INBOX_DIR, `${packetId}.json`);
  const workspaceReceiptPath = path.join(RECEIPT_DIR, `${receiptId}.json`);
  const tinkerdenReceiptPath = path.join(TINKERDEN_RECEIPT_DIR, `${receiptId}.json`);
  const packetText = String(request.packet_text);
  const packetRecord = {
    schema: "tinkerden_machine_runner_packet_v0",
    received_at: timestamp,
    local_machine: MACHINE,
    packet_id: packetId,
    target_aeye: request.target_aeye || request.packet?.assigned_to || "UNKNOWN",
    target_machine: targetMachine,
    mission: request.mission || request.packet?.mission || "UNKNOWN",
    packet_path_from_tinkerden: request.packet_path || "UNKNOWN",
    workspace_target: workspaceTarget,
    packet_text: packetText,
  };

  await writeJson(packetPath, packetRecord);
  await setClipboard(packetText);
  const clipboardVerified = await verifyClipboard(packetText);
  const workspace = await runWorkspaceTarget(workspaceTarget);
  const status = clipboardVerified && workspace.focused ? "READY_FOR_AEYE" : clipboardVerified ? "CLIPBOARD_SET" : "BLOCKED";
  const event = {
    event_type: "workspace_relay_ready",
    packet_id: packetId,
    receipt_id: receiptId,
    target_aeye: packetRecord.target_aeye,
    target_machine: targetMachine,
    workspace_target: workspaceTarget.label || workspaceTarget.id,
    timestamp,
    clipboard_set: true,
    clipboard_verified: clipboardVerified,
    workspace_attempted: workspace.attempted,
    workspace_focused: workspace.focused,
    status,
    packet_sha256: sha256(packetText),
  };
  const receipt = {
    schema: "tinkerden_workspace_relay_receipt_v0",
    receipt_id: receiptId,
    packet_id: packetId,
    linked_packet_id: packetId,
    mission: packetRecord.mission,
    producer: `MachineRunner@${MACHINE}`,
    status_guess: status,
    timestamp: nowIso(),
    proof_reference: repoRel(tinkerdenReceiptPath),
    runner_receipt_path: repoRel(workspaceReceiptPath),
    packet_inbox_path: repoRel(packetPath),
    event_path: repoRel(EVENTS_PATH),
    clipboard: {
      set: true,
      verified: clipboardVerified,
    },
    workspace: {
      target: workspaceTarget,
      attempted: workspace.attempted,
      focused: workspace.focused,
      status: workspace.status,
      detail: workspace.detail,
    },
    guardrails: [
      "No auto-send.",
      "No browser credential control.",
      "No account automation.",
      "Local clipboard and workspace focus only."
    ],
  };
  const pickup = {
    receipt_id: receiptId,
    packet_id: packetId,
    linked_packet_id: packetId,
    mission: packetRecord.mission,
    producer: receipt.producer,
    status_guess: status,
    timestamp: receipt.timestamp,
    path: repoRel(tinkerdenReceiptPath),
    proof_reference: repoRel(tinkerdenReceiptPath),
  };

  await writeJson(workspaceReceiptPath, receipt);
  await writeJson(tinkerdenReceiptPath, receipt);
  await appendJsonl(EVENTS_PATH, event);
  await appendJsonl(RECEIPT_PICKUP_PATH, pickup);

  return {
    ok: true,
    packet_id: packetId,
    receipt_id: receiptId,
    status,
    clipboard_set: true,
    clipboard_verified: clipboardVerified,
    workspace_focused: workspace.focused,
    workspace_detail: workspace.detail,
    packet_inbox_path: repoRel(packetPath),
    receipt_path: repoRel(tinkerdenReceiptPath),
    runner_receipt_path: repoRel(workspaceReceiptPath),
    event_path: repoRel(EVENTS_PATH),
    pickup_path: repoRel(RECEIPT_PICKUP_PATH),
    receipt,
    event,
  };
}

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, statusCode, value) {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  res.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function serve(port) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
      if (req.method === "GET" && url.pathname === "/health") {
        sendJson(res, 200, { ok: true, machine: MACHINE, schema: "tinkerden_machine_runner_health_v0" });
        return;
      }
      if (req.method === "POST" && url.pathname === "/packets") {
        sendJson(res, 200, await handlePacket(await readRequestBody(req)));
        return;
      }
      sendJson(res, 404, { ok: false, error: "NOT_FOUND" });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(JSON.stringify({ ok: true, event: "runner_listening", machine: MACHINE, port }, null, 2));
  });
}

async function selfTest() {
  const packetId = compactStamp("workspace_relay_selftest");
  return handlePacket({
    packet_id: packetId,
    target_aeye: "Dink",
    target_machine: MACHINE,
    mission: "TINKERDEN_WORKSPACE_RELAY_BETSY_V0_SELF_TEST",
    packet_text: [
      `TO: Dink@${MACHINE}`,
      "FROM: TinkerDen@Betsy",
      "",
      "MISSION: TINKERDEN_WORKSPACE_RELAY_BETSY_V0_SELF_TEST",
      "",
      "TASK:",
      "Prove machine runner can set clipboard, launch/focus workspace target, and write receipt.",
      "",
      "RETURN:",
      "Receipt to data/tinkerden/receipts",
      "",
      "RULES:",
      "- No auto-send.",
      "- Local proof only."
    ].join("\n"),
  });
}

async function main() {
  try {
    const { command, args } = parseArgs(process.argv.slice(2));
    if (command === "serve") {
      serve(Number(args.port || DEFAULT_PORT));
      return;
    }
    if (command === "handle") {
      if (!args.request) throw new Error(`Missing --request\n\n${usage()}`);
      console.log(JSON.stringify(await handlePacket(await readJson(path.resolve(ROOT, args.request))), null, 2));
      return;
    }
    if (command === "answer-once") {
      console.log(JSON.stringify(await answerOnce(args.packet), null, 2));
      return;
    }
    if (command === "answer-watch") {
      await answerWatch(Number(args["interval-ms"] || 1000));
      return;
    }
    if (command === "self-test") {
      console.log(JSON.stringify(await selfTest(), null, 2));
      return;
    }
    throw new Error(`Unknown command: ${command}\n\n${usage()}`);
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
    process.exitCode = 1;
  }
}

await main();
