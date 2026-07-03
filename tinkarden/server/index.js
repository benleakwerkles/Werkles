#!/usr/bin/env node

const Fastify = require("fastify");
const Database = require("better-sqlite3");
const fs = require("node:fs");
const { readFile } = require("node:fs/promises");
const { randomBytes, createHash } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const PORT = 4317;
const HOST = "127.0.0.1";
const DB_PATH = path.join(__dirname, "circulation.db");
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DECISION_RECEIPT_DIR = path.join(__dirname, "receipts", "decisions");
const RECOMMENDATIONS_PATH = path.join(__dirname, "..", "..", "tinkerden", "recommendations", "recommendation_cards.json");
const SALVAGE_PROTOCOL_PATH = path.join(__dirname, "..", "nervous_system", "salvage_protocol.js");
const SPEAKER_ROOT = path.join(REPO_ROOT, "speaker");
const SPEAKER_STAGED_RECEIPTS_DIR = path.join(SPEAKER_ROOT, "receipts", "staged");
const SPEAKER_RAW_INBOX_DIR = path.join(SPEAKER_ROOT, "receipts", "raw", "inbox");
const INTERFACE_NOTIFY_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "interface-notify.jsonl");
const OPERATOR_PUBLIC_KEY_PATH = path.join(SPEAKER_ROOT, "LOCKS", "operator_pubkey.asc");
const DEGRADED_RELEASE_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "degraded-release-blocks.jsonl");
const REMOTE_PUSH_BLOCK_ENV = "PROCESS_ENV_BLOCK_REMOTE_PUSH";
const FRICTIONAL_HEAT_PATHS = [
  path.join(__dirname, "..", "membrane", "frictional_heat.json"),
  path.join(__dirname, "..", "nervous_system", "frictional_heat.json")
];

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS shadow_cache (
  shadow_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  action_type TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  mock_diff_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS receipts (
  receipt_id TEXT PRIMARY KEY,
  shadow_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  action_type TEXT NOT NULL,
  operator_signature TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  mock_diff_json TEXT NOT NULL,
  status TEXT NOT NULL
);
`);

const app = Fastify({
  logger: {
    level: "info"
  }
});

app.addHook("onRequest", async (_request, reply) => {
  reply.header("Access-Control-Allow-Origin", "*");
  reply.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  reply.header("Access-Control-Allow-Headers", "Content-Type");
  reply.header("Access-Control-Allow-Private-Network", "true");
});

app.options("/*", (_request, reply) => {
  reply.code(204).send();
});

function stamp() {
  return new Date().toISOString();
}

function id(prefix) {
  const time = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `${prefix}_${time}_${randomBytes(4).toString("hex")}`;
}

function hashObject(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function hashText(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function rel(value) {
  return path.relative(REPO_ROOT, value).split(path.sep).join("/");
}

function appendJsonl(filePath, entry) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`, "utf8");
}

function isRemotePushBlocked() {
  return process.env[REMOTE_PUSH_BLOCK_ENV] === "true" || !fs.existsSync(OPERATOR_PUBLIC_KEY_PATH);
}

function writeDegradedReleaseBlock(details) {
  const entry = {
    event: "403 DEGRADED_STATE_RELEASE_BLOCKED",
    status: "DEGRADED_STATE_RELEASE_BLOCKED",
    timestamp: stamp(),
    operator_public_key_path: rel(OPERATOR_PUBLIC_KEY_PATH),
    operator_public_key_present: fs.existsSync(OPERATOR_PUBLIC_KEY_PATH),
    env_block_remote_push: process.env[REMOTE_PUSH_BLOCK_ENV] === "true",
    ...details
  };

  appendJsonl(DEGRADED_RELEASE_LOG_PATH, entry);
  return entry;
}

function writeDecisionReceiptFile(receipt) {
  fs.mkdirSync(DECISION_RECEIPT_DIR, { recursive: true });
  const filePath = path.join(DECISION_RECEIPT_DIR, `${receipt.receipt_id}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return filePath;
}

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function objectPayload(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function parseJson(value, fallback = {}) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function firstExisting(paths) {
  return paths.find((candidate) => fs.existsSync(candidate));
}

function loadRawConveyorCapsules() {
  if (!fs.existsSync(SPEAKER_RAW_INBOX_DIR)) return [];

  return fs
    .readdirSync(SPEAKER_RAW_INBOX_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const filePath = path.join(SPEAKER_RAW_INBOX_DIR, entry.name);
      try {
        const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? [parsed] : [];
      } catch {
        return [];
      }
    });
}

function writeInterfaceHarvestNotice(body) {
  const payload = objectPayload(body);
  const writtenFiles = Array.isArray(payload.written_files)
    ? payload.written_files.map(String)
    : payload.written_file
      ? [String(payload.written_file)]
      : [];
  const entry = {
    event: "interface_harvest_notification",
    event_type: "clipboard_ingest",
    status: "CLIPBOARD_INGEST_SUCCESSFUL",
    badge: "[ CLIPBOARD_INGEST: SUCCESSFUL ]",
    timestamp: stamp(),
    source: "POST /v1/interface/notify_harvest",
    capsule_id: text(payload.capsule_id) || text(payload.receipt_id) || path.basename(writtenFiles[0] || ""),
    written_files: writtenFiles,
    clipboard_cleared: payload.clipboard_cleared === true,
    payload
  };
  appendJsonl(INTERFACE_NOTIFY_LOG_PATH, entry);
  return entry;
}

function flattenFrictionItems(value) {
  if (Array.isArray(value)) return value.flatMap(flattenFrictionItems);
  if (!value || typeof value !== "object") return [];

  const ownStall =
    value.status === "STALLED" ||
    value.state === "STALLED" ||
    value.stalled === true ||
    value.friction_state === "STALLED";

  const nested = [];
  for (const key of ["items", "stalls", "packets", "in_flight", "flags", "blockers"]) {
    if (Array.isArray(value[key])) nested.push(...flattenFrictionItems(value[key]));
  }

  return ownStall ? [value, ...nested] : nested;
}

function loadFrictionalHeat() {
  const filePath = firstExisting(FRICTIONAL_HEAT_PATHS);
  if (!filePath) {
    return { ok: false, path: FRICTIONAL_HEAT_PATHS[0], stalled_items: [] };
  }

  const data = parseJson(fs.readFileSync(filePath, "utf8"), {});
  return {
    ok: true,
    path: filePath,
    stalled_items: flattenFrictionItems(data)
  };
}

function stallTone(item) {
  const value = String(item.tone || item.severity || item.risk_class || item.level || "AMBER").toUpperCase();
  if (value.includes("RED") || value.includes("FRACTURE") || value.includes("HARD")) return "RED";
  if (value.includes("TEAL") || value.includes("LOW") || value.includes("GNAT")) return "TEAL";
  return "AMBER";
}

function matchesStall(shadow, payload, stalledItem) {
  const candidates = [
    shadow.shadow_id,
    shadow.action_type,
    payload.target,
    payload.target_aeye,
    payload.path,
    payload.card_id,
    payload.source_packet_id,
    payload.mission
  ].filter(Boolean).map(String);

  return ["shadow_id", "action_type", "target", "target_aeye", "path", "card_id", "source_packet_id", "mission", "id"]
    .map((key) => stalledItem[key])
    .filter(Boolean)
    .some((value) => candidates.includes(String(value)));
}

function buildMockDiff(actionType, payload) {
  return {
    diff_id: id("mock_diff"),
    action_type: actionType,
    summary: `DRY RUN ONLY: would stage ${actionType}.`,
    payload_hash: hashObject(payload),
    changes: [
      {
        op: "stage",
        path: payload.path || "UNKNOWN_PATH",
        note: "Mock diff generated by Feral backend V0. No live action executed."
      }
    ]
  };
}

function runSalvageProtocol({ shadowId, receiptId }) {
  if (!fs.existsSync(SALVAGE_PROTOCOL_PATH)) {
    return { ok: false, status: "SALVAGE_PROTOCOL_MISSING", path: SALVAGE_PROTOCOL_PATH };
  }

  const result = spawnSync(process.execPath, [
    SALVAGE_PROTOCOL_PATH,
    "capture",
    "--trigger",
    "shadow_merge",
    "--shadow-id",
    shadowId,
    "--receipt-id",
    receiptId
  ], {
    cwd: path.join(__dirname, "..", ".."),
    encoding: "utf8",
    windowsHide: true,
    timeout: 120000,
    maxBuffer: 1024 * 1024 * 20
  });

  const raw = result.stdout || result.stderr || "";
  try {
    return JSON.parse(raw);
  } catch {
    return {
      ok: false,
      status: "SALVAGE_PROTOCOL_UNPARSEABLE",
      exit_code: result.status,
      stdout: result.stdout || "",
      stderr: result.stderr || ""
    };
  }
}

app.get("/health", async () => ({
  ok: true,
  service: "feral-tinkerden-backend-v0",
  db_path: DB_PATH,
  timestamp: stamp()
}));

app.get("/v1/recommendations", async () => {
  const raw = await readFile(RECOMMENDATIONS_PATH, "utf8");
  const parsed = JSON.parse(raw);
  return {
    ok: true,
    source_path: RECOMMENDATIONS_PATH,
    cards: Array.isArray(parsed.cards) ? parsed.cards.slice(0, 3) : [],
    generated_at: parsed.generated_at ?? null
  };
});

app.get("/v1/engine-room", async () => {
  const friction = loadFrictionalHeat();
  const rows = db
    .prepare("SELECT shadow_id, created_at, action_type, payload_json, mock_diff_json FROM shadow_cache ORDER BY created_at DESC")
    .all();

  return {
    ok: true,
    generated_at: stamp(),
    frictional_heat: {
      ok: friction.ok,
      path: friction.path,
      stalled_count: friction.stalled_items.length
    },
    in_flight: rows.map((shadow) => {
      const payload = parseJson(shadow.payload_json, {});
      const mockDiff = parseJson(shadow.mock_diff_json, {});
      const stall = friction.stalled_items.find((item) => matchesStall(shadow, payload, item));

      return {
        shadow_id: shadow.shadow_id,
        created_at: shadow.created_at,
        status: "WAITING_FOR_MERGE",
        target_aeye: payload.target_aeye || payload.target || "UNKNOWN_AEYE",
        action: shadow.action_type,
        payload,
        mock_diff_summary: mockDiff.summary || "",
        stalled: Boolean(stall),
        stall_tone: stall ? stallTone(stall) : "NONE",
        stall_reason: stall ? stall.reason || stall.message || stall.code || "STALLED_BY_FRICTIONAL_HEAT" : null
      };
    })
  };
});

app.get("/v1/conveyor/active", async (_request, reply) => {
  return reply
    .type("application/json; charset=utf-8")
    .send(JSON.stringify(loadRawConveyorCapsules()));
});

app.post("/v1/interface/notify_harvest", async (request, reply) => {
  const entry = writeInterfaceHarvestNotice(request.body);
  return reply.send({
    ok: true,
    status: "CLIPBOARD_INGEST_SUCCESSFUL",
    badge: entry.badge,
    timestamp: entry.timestamp,
    log_path: rel(INTERFACE_NOTIFY_LOG_PATH)
  });
});

app.get("/v1/action/staged/:id", async (request, reply) => {
  const shadowId = text(request.params.id);
  const shadow = db.prepare("SELECT payload_json FROM shadow_cache WHERE shadow_id = ?").get(shadowId);

  if (!shadow) {
    return reply.code(404).send({ ok: false, error: "NOT_FOUND" });
  }

  return reply
    .type("application/json")
    .send(JSON.stringify(JSON.parse(shadow.payload_json)));
});

app.get("/v1/reports/raw/:filename", async (request, reply) => {
  const filename = text(request.params.filename);
  const reportPath = path.join(SPEAKER_STAGED_RECEIPTS_DIR, path.basename(filename));

  if (!filename || !fs.existsSync(reportPath) || !fs.statSync(reportPath).isFile()) {
    return reply.code(404).type("text/plain").send("NOT_FOUND");
  }

  const plaintext = await readFile(reportPath, "utf8");
  return reply.type("text/plain; charset=utf-8").send(plaintext);
});

app.post("/v1/action/dry_run", async (request, reply) => {
  const body = objectPayload(request.body);
  const actionType = text(body.action_type) || "unknown_action";
  const payload = objectPayload(body.payload);
  const shadowId = id("shadow");
  const createdAt = stamp();
  const mockDiff = buildMockDiff(actionType, payload);

  db.prepare(`
    INSERT INTO shadow_cache (shadow_id, created_at, action_type, payload_json, mock_diff_json)
    VALUES (@shadow_id, @created_at, @action_type, @payload_json, @mock_diff_json)
  `).run({
    shadow_id: shadowId,
    created_at: createdAt,
    action_type: actionType,
    payload_json: JSON.stringify(payload),
    mock_diff_json: JSON.stringify(mockDiff)
  });

  return reply.send({
    ok: true,
    status: "DRY_RUN_CACHED",
    shadow_id: shadowId,
    created_at: createdAt,
    mock_diff: mockDiff,
    receipt_required_for_live_action: true
  });
});

app.post("/v1/action/shadow_merge", async (request, reply) => {
  const body = objectPayload(request.body);
  const shadowId = text(body.shadow_id);
  const operatorSignature = text(body.operator_signature);
  const decisionReceiptInput = objectPayload(body.decision_receipt);
  const operatorApprovalReceiptId = text(body.operator_approval_receipt_id) || text(decisionReceiptInput.operator_approval_receipt_id);

  if (!shadowId) {
    return reply.code(400).send({ ok: false, error: "SHADOW_ID_REQUIRED" });
  }

  if (!operatorSignature) {
    return reply.code(400).send({ ok: false, error: "OPERATOR_SIGNATURE_REQUIRED" });
  }

  if (!operatorApprovalReceiptId) {
    return reply.code(400).send({ ok: false, error: "OPERATOR_APPROVAL_RECEIPT_ID_REQUIRED" });
  }

  const shadow = db.prepare("SELECT * FROM shadow_cache WHERE shadow_id = ?").get(shadowId);
  if (!shadow) {
    return reply.code(404).send({ ok: false, error: "SHADOW_NOT_FOUND" });
  }

  if (isRemotePushBlocked()) {
    const block = writeDegradedReleaseBlock({
      route: "/v1/action/shadow_merge",
      shadow_id: shadow.shadow_id,
      action_type: shadow.action_type,
      reason: "operator_pubkey.asc missing or PROCESS_ENV_BLOCK_REMOTE_PUSH=true"
    });

    return reply.code(403).send({
      ok: false,
      status: "DEGRADED_STATE_RELEASE_BLOCKED",
      error: "403 DEGRADED_STATE_RELEASE_BLOCKED",
      shadow_id: shadow.shadow_id,
      log_path: rel(DEGRADED_RELEASE_LOG_PATH),
      block
    });
  }

  const receiptId = id("receipt");
  const createdAt = stamp();
  const decisionReceipt = {
    receipt_id: receiptId,
    receipt_type: "DECISION",
    status: "DECISION",
    decision: "PROCEED",
    created_at: createdAt,
    shadow_id: shadow.shadow_id,
    action_type: shadow.action_type,
    operator_approval_receipt_id: operatorApprovalReceiptId,
    operator_signature_sha256: operatorSignature,
    payload_sha256: hashText(shadow.payload_json),
    mock_diff_sha256: hashText(shadow.mock_diff_json),
    posted_decision_receipt: decisionReceiptInput,
    payload: parseJson(shadow.payload_json, {}),
    mock_diff: parseJson(shadow.mock_diff_json, {})
  };
  const decisionReceiptPath = writeDecisionReceiptFile(decisionReceipt);

  const writeReceipt = db.transaction(() => {
    db.prepare(`
      INSERT INTO receipts (
        receipt_id,
        shadow_id,
        created_at,
        action_type,
        operator_signature,
        payload_json,
        mock_diff_json,
        status
      )
      VALUES (
        @receipt_id,
        @shadow_id,
        @created_at,
        @action_type,
        @operator_signature,
        @payload_json,
        @mock_diff_json,
        @status
      )
    `).run({
      receipt_id: receiptId,
      shadow_id: shadow.shadow_id,
      created_at: createdAt,
      action_type: shadow.action_type,
      operator_signature: operatorSignature,
      payload_json: shadow.payload_json,
      mock_diff_json: shadow.mock_diff_json,
      status: "SHADOW_MERGED_WITH_RECEIPT"
    });
    db.prepare("DELETE FROM shadow_cache WHERE shadow_id = ?").run(shadow.shadow_id);
  });

  writeReceipt();
  const salvage = runSalvageProtocol({ shadowId: shadow.shadow_id, receiptId });

  return reply.send({
    ok: true,
    status: "SHADOW_MERGED_WITH_RECEIPT",
    receipt_id: receiptId,
    shadow_id: shadow.shadow_id,
    operator_approval_receipt_id: operatorApprovalReceiptId,
    decision_receipt_path: rel(decisionReceiptPath),
    receipt_url: `/v1/receipt/${receiptId}`,
    salvage_protocol: salvage
  });
});

app.get("/v1/receipt/:id", async (request, reply) => {
  const receiptId = text(request.params.id);
  const receipt = db.prepare("SELECT * FROM receipts WHERE receipt_id = ?").get(receiptId);

  if (!receipt) {
    return reply.code(404).send({ ok: false, error: "RECEIPT_NOT_FOUND" });
  }

  return reply.send({
    ok: true,
    receipt: {
      receipt_id: receipt.receipt_id,
      shadow_id: receipt.shadow_id,
      created_at: receipt.created_at,
      action_type: receipt.action_type,
      operator_signature: receipt.operator_signature,
      payload: JSON.parse(receipt.payload_json),
      mock_diff: JSON.parse(receipt.mock_diff_json),
      status: receipt.status
    }
  });
});

async function start() {
  try {
    await app.listen({ port: PORT, host: HOST });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
