#!/usr/bin/env node

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const crypto = require("node:crypto");

const SPEAKER_ROOT = path.resolve(__dirname, "..");
const STAGED_DOCTRINE_DIR = path.join(SPEAKER_ROOT, "doctrine", "staged");
const STAGED_RECEIPT_DIR = path.join(SPEAKER_ROOT, "receipts", "staged");
const RAW_INBOX_DIR = path.join(SPEAKER_ROOT, "receipts", "raw", "inbox");
const LOG_PATH = path.join(SPEAKER_ROOT, "logs", "autonomic-harvest.jsonl");
const SNAPSHOT_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "snapshot_log.jsonl");
const TIER3_COOLING_STATE_PATH = path.join(SPEAKER_ROOT, "logs", "tier3-cooling-state.json");
const OPERATOR_PUBLIC_KEY_PATH = path.join(SPEAKER_ROOT, "LOCKS", "operator_pubkey.asc");
const DEFAULT_INTERVAL_MS = 250;
const DEFAULT_SSE_PORT = 3339;
const AUTONOMIC_OWNER = "Dink@Betsy";
const DEGRADED_STATE = "DEGRADED_SOVEREIGNTY";
const REMOTE_PUSH_BLOCK_ENV = "PROCESS_ENV_BLOCK_REMOTE_PUSH";
const PROMOTE_STAGED_BLOCK_ENV = "PROCESS_ENV_BLOCK_PROMOTE_STAGED";
const TIER3_COOLING_MS = 24 * 60 * 60 * 1000;
const TIER3_REQUIRED_RECEIPTS = [1, 2, 3, 4, 5, 6, 7];

function stamp() {
  return new Date().toISOString();
}

function sha256(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function slash(value) {
  return value.split(path.sep).join("/");
}

function rel(value) {
  return slash(path.relative(SPEAKER_ROOT, value));
}

function ensureDirs() {
  for (const dir of [STAGED_DOCTRINE_DIR, STAGED_RECEIPT_DIR, RAW_INBOX_DIR, path.dirname(LOG_PATH)]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function appendJsonl(filePath, entry) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`, "utf8");
}

function readJson(filePath, fallback = {}) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readJsonl(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry));
}

function logEvent(entry) {
  appendJsonl(LOG_PATH, {
    event: "autonomic_harvest",
    timestamp: stamp(),
    authority: AUTONOMIC_OWNER,
    ...entry
  });
}

function evaluateGovernanceState() {
  const publicKeyPresent = fs.existsSync(OPERATOR_PUBLIC_KEY_PATH);
  const blockRemotePush = !publicKeyPresent;

  if (blockRemotePush) {
    process.env[REMOTE_PUSH_BLOCK_ENV] = "true";
  }

  const state = blockRemotePush ? DEGRADED_STATE : "SOVEREIGNTY_READY";
  const governance = {
    state,
    public_key_path: rel(OPERATOR_PUBLIC_KEY_PATH),
    public_key_present: publicKeyPresent,
    block_remote_push: blockRemotePush,
    env: {
      [REMOTE_PUSH_BLOCK_ENV]: process.env[REMOTE_PUSH_BLOCK_ENV] === "true" ? "true" : "false"
    },
    warning: blockRemotePush ? "[ SYSTEM STATE: DEGRADED_SOVEREIGNTY ]" : null
  };

  logEvent({
    status: blockRemotePush ? DEGRADED_STATE : "ACK",
    trigger: "governance_key_check",
    ...governance
  });

  return governance;
}

function parseTimeMs(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSnapshotId(entry) {
  const candidates = [
    entry.snapshot_id,
    entry.target_snapshot_id,
    entry.snapshotId,
    entry.snapshot?.snapshot_id,
    entry.snapshot?.id,
    entry.payload?.snapshot_id,
    entry.metadata?.snapshot_id
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  return null;
}

function isTier3Entry(entry) {
  const candidates = [
    entry.tier,
    entry.risk_tier,
    entry.branch_clearance_tier,
    entry.clearance_tier,
    entry.action_tier,
    entry.snapshot?.tier,
    entry.payload?.tier,
    entry.metadata?.tier
  ];

  return candidates.some((candidate) => {
    if (candidate === 3) return true;
    if (typeof candidate !== "string") return false;
    const normalized = candidate.toUpperCase().replace(/\s+/g, "_");
    return normalized === "3" || normalized === "TIER_3" || normalized === "TIER-3" || normalized === "TIER3";
  });
}

function receiptNumberFromValue(value) {
  if (typeof value === "number" && TIER3_REQUIRED_RECEIPTS.includes(value)) return value;
  if (typeof value !== "string") return null;
  const exact = Number.parseInt(value, 10);
  if (TIER3_REQUIRED_RECEIPTS.includes(exact)) return exact;
  const match = value.match(/\b(?:receipt|prerequisite|step|gate)[_-]?([1-7])\b/i);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

function collectReceiptNumbers(entry) {
  const numbers = new Set();
  const scalarFields = [
    entry.receipt_number,
    entry.prerequisite_receipt_number,
    entry.prerequisite_number,
    entry.clearance_receipt,
    entry.clearance_step,
    entry.step,
    entry.gate,
    entry.receipt_id,
    entry.event,
    entry.status
  ];

  for (const value of scalarFields) {
    const number = receiptNumberFromValue(value);
    if (number) numbers.add(number);
  }

  const arrayFields = [
    entry.receipts,
    entry.receipt_numbers,
    entry.prerequisite_receipts,
    entry.prerequisites,
    entry.snapshot_log,
    entry.payload?.receipts,
    entry.metadata?.receipts
  ];

  for (const field of arrayFields) {
    if (!Array.isArray(field)) continue;
    for (const item of field) {
      if (item && typeof item === "object") {
        for (const value of Object.values(item)) {
          const number = receiptNumberFromValue(value);
          if (number) numbers.add(number);
        }
      } else {
        const number = receiptNumberFromValue(item);
        if (number) numbers.add(number);
      }
    }
  }

  return Array.from(numbers).sort((a, b) => a - b);
}

function formatDuration(ms) {
  const safeMs = Math.max(0, Math.ceil(ms / 1000) * 1000);
  const totalSeconds = Math.floor(safeMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function deriveTier3CoolingClock(snapshotLogRows, previousState = {}, nowMs = Date.now()) {
  const grouped = new Map();

  for (const entry of snapshotLogRows) {
    const snapshotId = normalizeSnapshotId(entry);
    if (!snapshotId) continue;

    if (!grouped.has(snapshotId)) {
      grouped.set(snapshotId, {
        snapshot_id: snapshotId,
        tier3_seen: false,
        receipt_times: {},
        source_events: 0
      });
    }

    const group = grouped.get(snapshotId);
    group.source_events += 1;
    if (isTier3Entry(entry)) group.tier3_seen = true;

    const timestampMs =
      parseTimeMs(entry.timestamp) ||
      parseTimeMs(entry.created_at) ||
      parseTimeMs(entry.logged_at) ||
      parseTimeMs(entry.filed_at) ||
      parseTimeMs(entry.completed_at) ||
      nowMs;

    for (const receiptNumber of collectReceiptNumbers(entry)) {
      group.receipt_times[String(receiptNumber)] = Math.max(
        group.receipt_times[String(receiptNumber)] || 0,
        timestampMs
      );
    }
  }

  const snapshots = {};
  const activeLocks = [];
  const waitingSnapshots = [];
  const previousSnapshots = previousState.snapshots && typeof previousState.snapshots === "object" ? previousState.snapshots : {};

  for (const group of grouped.values()) {
    const receiptNumbers = Object.keys(group.receipt_times).map(Number).sort((a, b) => a - b);
    const hasAllPrerequisites = TIER3_REQUIRED_RECEIPTS.every((receiptNumber) =>
      receiptNumbers.includes(receiptNumber)
    );

    if (!group.tier3_seen && receiptNumbers.length === 0) continue;

    const missingReceipts = TIER3_REQUIRED_RECEIPTS.filter((receiptNumber) => !receiptNumbers.includes(receiptNumber));
    const previousSnapshot = previousSnapshots[group.snapshot_id] || {};

    let prerequisitesCompletedAtMs = previousSnapshot.prerequisites_completed_at_ms || null;
    if (hasAllPrerequisites && !prerequisitesCompletedAtMs) {
      prerequisitesCompletedAtMs = Math.max(...Object.values(group.receipt_times));
    }

    const unlockAtMs = prerequisitesCompletedAtMs ? prerequisitesCompletedAtMs + TIER3_COOLING_MS : null;
    const remainingMs = unlockAtMs ? Math.max(0, unlockAtMs - nowMs) : null;
    const status = !hasAllPrerequisites
      ? "WAITING_ON_PREREQUISITES"
      : remainingMs > 0
        ? "LOCK_ACTIVE"
        : "UNLOCKED";

    const snapshot = {
      snapshot_id: group.snapshot_id,
      tier: group.tier3_seen ? "TIER_3" : "UNKNOWN",
      status,
      required_receipts: TIER3_REQUIRED_RECEIPTS,
      filed_receipts: receiptNumbers,
      missing_receipts: missingReceipts,
      prerequisites_completed_at: prerequisitesCompletedAtMs ? new Date(prerequisitesCompletedAtMs).toISOString() : null,
      prerequisites_completed_at_ms: prerequisitesCompletedAtMs,
      unlock_at: unlockAtMs ? new Date(unlockAtMs).toISOString() : null,
      unlock_at_ms: unlockAtMs,
      remaining_ms: remainingMs,
      time_remaining: remainingMs === null ? null : formatDuration(remainingMs),
      source_events: group.source_events
    };

    snapshots[group.snapshot_id] = snapshot;
    if (status === "LOCK_ACTIVE") activeLocks.push(snapshot);
    if (status === "WAITING_ON_PREREQUISITES") waitingSnapshots.push(snapshot);
  }

  const maxRemainingMs = activeLocks.reduce((max, snapshot) => Math.max(max, snapshot.remaining_ms || 0), 0);
  const status = activeLocks.length > 0
    ? "LOCK_ACTIVE"
    : waitingSnapshots.length > 0
      ? "WAITING_ON_PREREQUISITES"
      : "CLEAR";

  return {
    status,
    generated_at: new Date(nowMs).toISOString(),
    snapshot_log_path: rel(SNAPSHOT_LOG_PATH),
    cooling_ms: TIER3_COOLING_MS,
    required_receipts: TIER3_REQUIRED_RECEIPTS,
    active_lock_count: activeLocks.length,
    waiting_count: waitingSnapshots.length,
    locked_snapshot_ids: activeLocks.map((snapshot) => snapshot.snapshot_id),
    waiting_snapshot_ids: waitingSnapshots.map((snapshot) => snapshot.snapshot_id),
    max_remaining_ms: maxRemainingMs,
    time_remaining: formatDuration(maxRemainingMs),
    promote_staged_blocked: activeLocks.length > 0,
    promote_staged_block_env: {
      [PROMOTE_STAGED_BLOCK_ENV]: activeLocks.length > 0 ? "true" : "false"
    },
    message: `[ TIER_3_COOLING_CLOCK: ${status} / TIME_REMAINING: ${formatDuration(maxRemainingMs)} ]`,
    snapshots
  };
}

function writeTier3CoolingState(coolingState) {
  atomicWriteJson(TIER3_COOLING_STATE_PATH, coolingState);
}

function evaluateTier3CoolingGate() {
  const previousState = readJson(TIER3_COOLING_STATE_PATH, {});
  const snapshotRows = readJsonl(SNAPSHOT_LOG_PATH);
  const coolingState = deriveTier3CoolingClock(snapshotRows, previousState, Date.now());
  writeTier3CoolingState(coolingState);
  process.env[PROMOTE_STAGED_BLOCK_ENV] = coolingState.promote_staged_blocked ? "true" : "false";
  return coolingState;
}

function tier3CoolingTelemetry(coolingState) {
  return {
    event_type: "tier_3_cooling_clock",
    status: coolingState.status,
    message: coolingState.message,
    time_remaining: coolingState.time_remaining,
    locked_snapshot_ids: coolingState.locked_snapshot_ids,
    waiting_snapshot_ids: coolingState.waiting_snapshot_ids,
    promote_staged_blocked: coolingState.promote_staged_blocked,
    state_path: rel(TIER3_COOLING_STATE_PATH),
    snapshot_log_path: rel(SNAPSHOT_LOG_PATH),
    timestamp: stamp()
  };
}

function assertPromoteStagedCoolingGate(snapshotId) {
  const coolingState = evaluateTier3CoolingGate();
  const target = coolingState.snapshots[String(snapshotId || "")];

  if (target?.status === "LOCK_ACTIVE") {
    const error = new Error(
      `403 TIER_3_COOLING_CLOCK_LOCK_ACTIVE: ${target.snapshot_id} unlocks at ${target.unlock_at}; remaining ${target.time_remaining}`
    );
    error.statusCode = 403;
    error.cooling_state = target;
    throw error;
  }

  return {
    ok: true,
    status: target?.status || "NO_TIER_3_LOCK_FOUND",
    snapshot_id: snapshotId || null
  };
}

function sanitize(value, fallback = "value") {
  const text = typeof value === "string" && value.trim() ? value.trim() : fallback;
  return text.replace(/[^A-Za-z0-9_.:-]+/g, "_").slice(0, 120);
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith("--")) {
      args._.push(item);
      continue;
    }

    const normalized = item.slice(2).replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[normalized] = true;
    } else {
      args[normalized] = next;
      i += 1;
    }
  }
  return args;
}

function parseScalar(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function parseMetadataBlock(markdown) {
  const fields = {};
  const lines = markdown.split(/\r?\n/);
  let bodyStart = 0;

  if (lines[0]?.trim() === "---") {
    for (let i = 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.trim() === "---") {
        bodyStart = i + 1;
        break;
      }
      const match = line.match(/^([A-Za-z0-9_.-]+)\s*:\s*(.*)$/);
      if (match) fields[match[1].trim()] = parseScalar(match[2]);
    }
    return { metadata: fields, body: lines.slice(bodyStart).join("\n").trimStart() };
  }

  for (let i = 0; i < Math.min(lines.length, 40); i += 1) {
    const line = lines[i];
    if (!line.trim()) {
      bodyStart = i + 1;
      break;
    }
    const match = line.match(/^([A-Za-z0-9_. -]+)\s*:\s*(.*)$/);
    if (!match) {
      bodyStart = i;
      break;
    }
    fields[match[1].trim().toLowerCase().replace(/\s+/g, "_")] = parseScalar(match[2]);
  }

  return { metadata: fields, body: lines.slice(bodyStart).join("\n").trimStart() };
}

function firstHeading(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

function inferThinker(metadata, filePath) {
  const explicit =
    metadata.owner ||
    metadata.thinker ||
    metadata.aeye ||
    metadata.author ||
    metadata.from ||
    metadata.node;
  if (typeof explicit === "string" && explicit.includes("@")) return explicit;

  const basename = path.basename(filePath);
  const match = basename.match(/\b(Ender|Bean|Thufir|Petra|Maker|Dink|Skybro)@?(Betsy|Sally|Doss|Spanzee)?\b/i);
  if (match) {
    const aeye = match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
    const machine = match[2] ? match[2][0].toUpperCase() + match[2].slice(1).toLowerCase() : "Betsy";
    return `${aeye}@${machine}`;
  }

  return "Unknown@Betsy";
}

function sourceKind(filePath) {
  if (filePath.startsWith(STAGED_DOCTRINE_DIR)) return "doctrine_staged";
  if (filePath.startsWith(STAGED_RECEIPT_DIR)) return "receipt_staged";
  return "unknown_staged";
}

function buildReceipt(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const sourceHash = sha256(raw);
  const { metadata, body } = parseMetadataBlock(raw);
  const title = String(metadata.title || metadata.mission || firstHeading(body) || path.basename(filePath, ".md")).trim();
  const thinkerNode = inferThinker(metadata, filePath);
  const capsuleId = sanitize(
    metadata.capsule_id || metadata.packet_id || metadata.receipt_id || `TRANSACTION_CAPSULE_${stamp().replace(/[-:.TZ]/g, "").slice(0, 14)}_${sourceHash.slice(0, 8)}`,
    "TRANSACTION_CAPSULE"
  );
  const receiptId = sanitize(`HARVEST_${capsuleId}`, "HARVEST_TRANSACTION_CAPSULE");

  return {
    receipt_id: receiptId,
    receipt_type: "ARTIFACT",
    timestamp: stamp(),
    owner: AUTONOMIC_OWNER,
    status: "ARTIFACT",
    evidence: {
      type: "TRANSACTION_CAPSULE",
      path: rel(filePath),
      sha256: sourceHash,
      summary: `Autonomic harvest wrapped thinker report from ${thinkerNode}: ${title}`
    },
    transaction_capsule: {
      capsule_type: "TRANSACTION_CAPSULE",
      capsule_id: capsuleId,
      title,
      thinker_node: thinkerNode,
      source_kind: sourceKind(filePath),
      source_path: rel(filePath),
      source_sha256: sourceHash,
      parsed_metadata: metadata,
      content_markdown: body || raw,
      harvested_by: AUTONOMIC_OWNER,
      harvested_at: stamp()
    }
  };
}

function uniqueInboxPath(receiptId) {
  let candidate = path.join(RAW_INBOX_DIR, `${sanitize(receiptId, "harvest")}.json`);
  let index = 2;
  while (fs.existsSync(candidate)) {
    candidate = path.join(RAW_INBOX_DIR, `${sanitize(receiptId, "harvest")}.${index}.json`);
    index += 1;
  }
  return candidate;
}

function atomicWriteJson(filePath, value) {
  const raw = `${JSON.stringify(value, null, 2)}\n`;
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, raw, "utf8");
  fs.renameSync(tempPath, filePath);
}

function isMarkdownFile(filePath) {
  return /\.md$/i.test(filePath);
}

function listMarkdownFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isMarkdownFile(entry.name))
    .map((entry) => path.join(directory, entry.name));
}

function snapshotFiles() {
  const snapshot = new Map();
  for (const filePath of [...listMarkdownFiles(STAGED_DOCTRINE_DIR), ...listMarkdownFiles(STAGED_RECEIPT_DIR)]) {
    try {
      const stat = fs.statSync(filePath);
      snapshot.set(filePath, `${stat.mtimeMs}:${stat.size}`);
    } catch {
      // A file can disappear while the watcher is scanning. The next pass will settle it.
    }
  }
  return snapshot;
}

function waitForStableFile(filePath, attempts = 5) {
  let previous = null;
  for (let i = 0; i < attempts; i += 1) {
    const stat = fs.statSync(filePath);
    const marker = `${stat.mtimeMs}:${stat.size}`;
    if (marker === previous) return true;
    previous = marker;
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 80);
  }
  return true;
}

function harvestFile(filePath, broadcaster) {
  waitForStableFile(filePath);
  const receipt = buildReceipt(filePath);
  const inboxPath = uniqueInboxPath(receipt.receipt_id);
  atomicWriteJson(inboxPath, receipt);

  const event = {
    event_type: "transaction_capsule_harvested",
    capsule_id: receipt.transaction_capsule.capsule_id,
    receipt_id: receipt.receipt_id,
    thinker_node: receipt.transaction_capsule.thinker_node,
    title: receipt.transaction_capsule.title,
    raw_inbox_path: rel(inboxPath),
    source_path: rel(filePath),
    timestamp: receipt.timestamp
  };

  const broadcastResult = broadcaster.broadcast(event);
  logEvent({
    status: "ARTIFACT",
    trigger: "markdown_harvested",
    source_path: rel(filePath),
    raw_inbox_path: rel(inboxPath),
    receipt_id: receipt.receipt_id,
    capsule_id: receipt.transaction_capsule.capsule_id,
    broadcast: broadcastResult
  });

  return { receipt, inboxPath, broadcastResult };
}

function createBroadcaster(options, governance, coolingProvider = null) {
  const clients = new Set();
  let server = null;
  let serverStatus = "DISABLED";
  const port = Number.parseInt(String(options.ssePort || DEFAULT_SSE_PORT), 10);
  const safePort = Number.isInteger(port) && port > 0 ? port : DEFAULT_SSE_PORT;

  function send(res, event, data) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  if (!options.noSse) {
    server = http.createServer((req, res) => {
      const url = new URL(req.url || "/", `http://127.0.0.1:${safePort}`);
      if (req.method === "GET" && url.pathname === "/events") {
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*"
        });
        send(res, "autonomic_harvest_ready", { status: "CONNECTED", timestamp: stamp(), governance });
        if (governance?.block_remote_push) {
          send(res, "system_state", {
            status: DEGRADED_STATE,
            message: governance.warning,
            block_remote_push: true,
            public_key_path: governance.public_key_path,
            timestamp: stamp()
          });
        }
        if (typeof coolingProvider === "function") {
          send(res, "tier_3_cooling_clock", tier3CoolingTelemetry(coolingProvider()));
        }
        clients.add(res);
        req.on("close", () => clients.delete(res));
        return;
      }

      if (req.method === "GET" && url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, status: "AUTONOMIC_HARVEST_SSE_READY", clients: clients.size, governance }));
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "NOT_FOUND" }));
    });

    server.on("error", (error) => {
      serverStatus = "FAILED";
      logEvent({
        status: "BLOCKER",
        trigger: "sse_server_error",
        port: safePort,
        error: error instanceof Error ? error.message : String(error)
      });
    });

    server.listen(safePort, "127.0.0.1", () => {
      serverStatus = "LISTENING";
      logEvent({
        status: "ACK",
        trigger: "sse_server_started",
        port: safePort,
        endpoint: `http://127.0.0.1:${safePort}/events`
      });
    });
  }

  return {
    broadcast(event) {
      const payload = { ...event, sse_port: safePort, governance };
      let sent = 0;
      const eventName = event?.event_type === "tier_3_cooling_clock" ? "tier_3_cooling_clock" : "transaction_capsule";
      for (const client of clients) {
        if (governance?.block_remote_push) {
          send(client, "system_state", {
            status: DEGRADED_STATE,
            message: governance.warning,
            block_remote_push: true,
            public_key_path: governance.public_key_path,
            timestamp: stamp()
          });
        }
        send(client, eventName, payload);
        sent += 1;
      }
      return {
        mode: options.noSse ? "disabled" : "local_sse_hub",
        status: serverStatus,
        endpoint: options.noSse ? null : `http://127.0.0.1:${safePort}/events`,
        clients_notified: sent
      };
    },
    close() {
      for (const client of clients) client.end();
      clients.clear();
      if (server) server.close();
    }
  };
}

function scanForChanges(seen, broadcaster, options = {}) {
  const next = snapshotFiles();
  const harvested = [];

  for (const [filePath, marker] of next.entries()) {
    const previous = seen.get(filePath);
    seen.set(filePath, marker);
    if (previous === marker) continue;
    if (previous === undefined && options.ignoreExisting) continue;

    try {
      const result = harvestFile(filePath, broadcaster);
      harvested.push({
        source_path: rel(filePath),
        raw_inbox_path: rel(result.inboxPath),
        receipt_id: result.receipt.receipt_id,
        capsule_id: result.receipt.transaction_capsule.capsule_id
      });
    } catch (error) {
      logEvent({
        status: "BLOCKER",
        trigger: "markdown_harvest_failed",
        source_path: rel(filePath),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  for (const filePath of Array.from(seen.keys())) {
    if (!next.has(filePath)) seen.delete(filePath);
  }

  return harvested;
}

function run(options = {}) {
  ensureDirs();
  const interval = Number.parseInt(String(options.intervalMs || DEFAULT_INTERVAL_MS), 10);
  const intervalMs = Number.isInteger(interval) && interval >= 100 ? interval : DEFAULT_INTERVAL_MS;
  const governance = evaluateGovernanceState();
  let coolingState = evaluateTier3CoolingGate();
  const broadcaster = createBroadcaster(options, governance, () => coolingState);
  const seen = options.includeExisting ? new Map() : snapshotFiles();
  let coolingSignature = null;

  function publishCoolingState(trigger, force = false) {
    coolingState = evaluateTier3CoolingGate();
    const telemetry = tier3CoolingTelemetry(coolingState);
    const signature = JSON.stringify({
      status: telemetry.status,
      time_remaining: telemetry.time_remaining,
      locked_snapshot_ids: telemetry.locked_snapshot_ids,
      waiting_snapshot_ids: telemetry.waiting_snapshot_ids
    });

    if (force || signature !== coolingSignature) {
      coolingSignature = signature;
      const broadcast = broadcaster.broadcast(telemetry);
      logEvent({
        status: telemetry.status,
        trigger,
        message: telemetry.message,
        locked_snapshot_ids: telemetry.locked_snapshot_ids,
        waiting_snapshot_ids: telemetry.waiting_snapshot_ids,
        promote_staged_blocked: telemetry.promote_staged_blocked,
        cooling_state_path: telemetry.state_path,
        broadcast
      });
    }

    return telemetry;
  }

  logEvent({
    status: "START",
    trigger: "autonomic_harvest_start",
    staged_doctrine_dir: rel(STAGED_DOCTRINE_DIR),
    staged_receipt_dir: rel(STAGED_RECEIPT_DIR),
    raw_inbox_dir: rel(RAW_INBOX_DIR),
    interval_ms: intervalMs,
    include_existing: Boolean(options.includeExisting),
    governance
  });
  publishCoolingState("tier3_cooling_gate_start", true);

  if (options.once) {
    const harvested = scanForChanges(seen, broadcaster, { ignoreExisting: false });
    const cooling = publishCoolingState("tier3_cooling_gate_once", true);
    broadcaster.close();
    return {
      ok: true,
      status: "AUTONOMIC_HARVEST_ONCE_COMPLETE",
      harvested_count: harvested.length,
      harvested,
      raw_inbox_dir: rel(RAW_INBOX_DIR),
      log_path: rel(LOG_PATH),
      governance,
      cooling
    };
  }

  setInterval(() => {
    scanForChanges(seen, broadcaster, { ignoreExisting: false });
    publishCoolingState("tier3_cooling_gate_interval");
  }, intervalMs);

  return {
    ok: true,
    status: "AUTONOMIC_HARVEST_RUNNING",
    staged_doctrine_dir: rel(STAGED_DOCTRINE_DIR),
    staged_receipt_dir: rel(STAGED_RECEIPT_DIR),
    raw_inbox_dir: rel(RAW_INBOX_DIR),
    sse_endpoint: options.noSse ? null : `http://127.0.0.1:${options.ssePort || DEFAULT_SSE_PORT}/events`,
    interval_ms: intervalMs,
    log_path: rel(LOG_PATH),
    governance,
    cooling: tier3CoolingTelemetry(coolingState)
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = run({
    once: Boolean(args.once),
    includeExisting: Boolean(args.includeExisting),
    intervalMs: args.intervalMs,
    ssePort: args.ssePort,
    noSse: Boolean(args.noSse)
  });
  console.log(JSON.stringify(result, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(JSON.stringify({
      ok: false,
      status: "ERROR",
      error: error instanceof Error ? error.message : String(error)
    }, null, 2));
    process.exitCode = 1;
  }
}

module.exports = {
  assertPromoteStagedCoolingGate,
  buildReceipt,
  deriveTier3CoolingClock,
  evaluateGovernanceState,
  evaluateTier3CoolingGate,
  harvestFile,
  parseMetadataBlock,
  run
};
