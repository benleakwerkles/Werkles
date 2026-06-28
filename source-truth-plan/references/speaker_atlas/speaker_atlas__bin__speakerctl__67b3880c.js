#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");

const SPEAKER_ROOT = process.env.SPEAKER_ROOT || path.resolve(__dirname, "..");
const SCHEMA_PATH = path.join(SPEAKER_ROOT, "schemas", "receipt.schema.json");
const CANONICAL_DIR = path.join(SPEAKER_ROOT, "receipts", "canonical");
const QUARANTINE_DIR = path.join(SPEAKER_ROOT, "receipts", "quarantine");
const RAW_INBOX_DIR = path.join(SPEAKER_ROOT, "receipts", "raw", "inbox");
const LOG_PATH = path.join(SPEAKER_ROOT, "logs", "ingest.jsonl");
const SPEAKER_DB_PATH = path.join(SPEAKER_ROOT, "speaker.sqlite");
const BOOTPACK_PROFILE_DIR = path.join(SPEAKER_ROOT, "bootloader", "profiles");
const BOOTPACK_TEMPLATE_DIR = path.join(SPEAKER_ROOT, "bootloader", "templates");
const CURRENT_REPO_STATE_TEMPLATE_PATH = path.join(BOOTPACK_TEMPLATE_DIR, "CURRENT_REPO_STATE.md");
const BOOTPACK_OUT_DIR = path.join(SPEAKER_ROOT, "bootpacks", "out");
const GIT_SNAPSHOT_SCRIPT_PATH = path.join(SPEAKER_ROOT, "bin", "git-snapshot.sh");
const GIT_BASH_PATH = "C:\\Program Files\\Git\\bin\\bash.exe";
const ENDER_BUNDLE_DIR = path.join(SPEAKER_ROOT, "ender", "bundles");
const GRAVEYARD_RECEIPT_DIR = path.join(SPEAKER_ROOT, "graveyard", "receipts");
const DOCTRINE_INDEX_PATH = path.join(SPEAKER_ROOT, "doctrine", "index.json");
const ACTION_CAPSULE_DIR = path.join(SPEAKER_ROOT, "action_capsules");
const RELEASE_VALVE_STATE_PATH = path.join(SPEAKER_ROOT, "state", "release_valve.json");
const RELEASE_VALVE_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "release_valve.jsonl");
const OPERATOR_PUBKEY_ASC_PATH = path.join(SPEAKER_ROOT, "LOCKS", "operator_pubkey.asc");
const OPERATOR_PUBKEY_SHA256_PATH = path.join(SPEAKER_ROOT, "LOCKS", "operator_pubkey.asc.sha256");
const DISALLOWED_STATUS_WORDS = new Set(["fixed", "done", "handled", "working", "sent", "looks good", "should be fine"]);
const BOOTPACK_SQLITE_INDEX_LOCK_PATH = "/speaker/db/speaker.sqlite";
const ALLOWED_BOOTPACK_PRIORITY_KEYS = new Set([
  "header",
  "active_topology_locks",
  "boundary_rules",
  "current_repo_state",
  "recent_artifact_receipts",
]);

function usage(exitCode = 0) {
  const text = [
    "Usage:",
    "  node C:\\speaker\\bin\\speakerctl.js ingest <path_to_receipt>",
    "  node C:\\speaker\\bin\\speakerctl.js ingest-inbox [raw_inbox_path]",
    "  node C:\\speaker\\bin\\speakerctl.js render-bootpack <Aeye.Machine>",
    "  node C:\\speaker\\bin\\speakerctl.js queue-apoptosis <receipt_id>",
    "  node C:\\speaker\\bin\\speakerctl.js export-apoptosis <queue_id>",
    "  node C:\\speaker\\bin\\speakerctl.js apply-apoptosis <apoptosis_patch.json> <operator_approval_receipt.json>",
    "  node C:\\speaker\\bin\\speakerctl.js promote-staged <action_capsule.json> [--plan]",
    "  node C:\\speaker\\bin\\speakerctl.js verify-release-readiness [--no-log]",
    "  node C:\\speaker\\bin\\speakerctl.js verify-integrity --strict",
    "  node C:\\speaker\\bin\\speakerctl.js verify-bootpack-headers",
    "  node C:\\speaker\\bin\\speakerctl.js verify-current-repo-state",
    "  & 'C:\\Program Files\\Git\\bin\\bash.exe' C:\\speaker\\bin\\git-snapshot.sh",
    "",
    "Deterministically validates JSON receipts against C:\\speaker\\schemas\\receipt.schema.json.",
    "Valid receipts are copied to C:\\speaker\\receipts\\canonical\\.",
    "Invalid receipts are moved to C:\\speaker\\receipts\\quarantine\\.",
    "ingest-inbox runs the same hard validation over every .json receipt in C:\\speaker\\receipts\\raw\\inbox\\.",
    "",
    "Deterministically renders Aeye bootpacks from C:\\speaker\\speaker.sqlite and a profile in C:\\speaker\\bootloader\\profiles\\.",
    "Deterministically queues, exports, and applies apoptosis packets into the graveyard ledger.",
    "Ratifies a canonical receipt and runs the git branch/commit/push release valve only after operator signature validation.",
    "Verifies release-valve blockers such as missing origin, missing keyring lock, and missing signing config.",
    "Verifies doctrine file hashes against C:\\speaker\\doctrine\\index.json and speaker.sqlite.",
    "Verifies every generated .BOOTPACK.md begins with the required Speaker-not-runtime YAML frontmatter.",
    "render-bootpack can include C:\\speaker\\bootloader\\templates\\CURRENT_REPO_STATE.md when the profile requests current_repo_state.",
    "When current_repo_state is requested, render-bootpack refreshes the Git snapshot before rendering unless the profile disables it.",
  ].join("\n");
  (exitCode === 0 ? process.stdout : process.stderr).write(`${text}\n`);
  process.exit(exitCode);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function stableName(prefix, sourcePath, hash) {
  const stem = path.basename(sourcePath, path.extname(sourcePath)).replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 80) || "receipt";
  return `${stem}_${hash.slice(0, 16)}${prefix}.json`;
}

function sha256Buffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex").toUpperCase();
}

function appendLog(entry) {
  ensureDir(path.dirname(LOG_PATH));
  fs.appendFileSync(LOG_PATH, `${JSON.stringify({ ...entry, logged_at: new Date().toISOString() })}\n`, "utf8");
}

function appendBootpackLog(entry) {
  const logPath = path.join(SPEAKER_ROOT, "logs", "bootpack.jsonl");
  ensureDir(path.dirname(logPath));
  fs.appendFileSync(logPath, `${JSON.stringify({ ...entry, logged_at: new Date().toISOString() })}\n`, "utf8");
}

function appendRepoStateLog(entry) {
  const logPath = path.join(SPEAKER_ROOT, "logs", "repo_state_refresh.jsonl");
  ensureDir(path.dirname(logPath));
  fs.appendFileSync(logPath, `${JSON.stringify({ ...entry, logged_at: new Date().toISOString() })}\n`, "utf8");
}

function appendApoptosisLog(entry) {
  const logPath = path.join(SPEAKER_ROOT, "logs", "apoptosis.jsonl");
  ensureDir(path.dirname(logPath));
  fs.appendFileSync(logPath, `${JSON.stringify({ ...entry, logged_at: new Date().toISOString() })}\n`, "utf8");
}

function appendReleaseValveLog(entry) {
  ensureDir(path.dirname(RELEASE_VALVE_LOG_PATH));
  fs.appendFileSync(RELEASE_VALVE_LOG_PATH, `${JSON.stringify({ ...entry, logged_at: new Date().toISOString() })}\n`, "utf8");
}

function loadJsonFile(filePath) {
  const raw = fs.readFileSync(filePath);
  return {
    raw,
    json: JSON.parse(raw.toString("utf8")),
  };
}

function sanitizeId(value) {
  return String(value || "").replace(/[^A-Za-z0-9._:-]+/g, "_").slice(0, 120);
}

function sanitizeBranchSegment(value) {
  return String(value || "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "capsule";
}

function writeJsonFile(filePath, value) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function openSpeakerDb(options = {}) {
  const { readOnly = true } = options;
  if (readOnly && !fs.existsSync(SPEAKER_DB_PATH)) {
    throw new Error(`Missing SQLite index: ${SPEAKER_DB_PATH}`);
  }
  const { DatabaseSync } = require("node:sqlite");
  const db = new DatabaseSync(SPEAKER_DB_PATH, { readOnly });
  if (!readOnly) ensureSpeakerDbSchema(db);
  return db;
}

function ensureSpeakerDbSchema(db) {
  db.exec(`
CREATE TABLE IF NOT EXISTS active_topology_locks (
  lock_id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  rule TEXT NOT NULL,
  source TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 100,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS boundary_rules (
  rule_id TEXT PRIMARY KEY,
  rule TEXT NOT NULL,
  severity TEXT,
  source TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 100
);
CREATE TABLE IF NOT EXISTS artifact_receipts (
  receipt_id TEXT PRIMARY KEY,
  packet_id TEXT,
  status TEXT NOT NULL,
  artifact_path TEXT,
  sha256 TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS apoptosis_queue (
  queue_id TEXT PRIMARY KEY,
  target_receipt_id TEXT NOT NULL,
  status TEXT NOT NULL,
  reason TEXT,
  bundle_path TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS graveyard_ledger (
  graveyard_id TEXT PRIMARY KEY,
  queue_id TEXT NOT NULL,
  target_receipt_id TEXT NOT NULL,
  receipt_id TEXT NOT NULL,
  action TEXT NOT NULL,
  artifact_path TEXT,
  approval_id TEXT NOT NULL,
  patch_path TEXT NOT NULL,
  patch_sha256 TEXT NOT NULL,
  applied_at TEXT NOT NULL,
  reason TEXT
);
CREATE TABLE IF NOT EXISTS doctrine_file_log (
  file_path TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  receipt_signature_id TEXT NOT NULL,
  canonical_receipt_path TEXT NOT NULL,
  logged_at TEXT NOT NULL,
  PRIMARY KEY (file_path, sha256)
);
`);
}

function upsertArtifactReceipt(receipt, canonicalPath, hash) {
  const receiptId = receipt && receipt.receipt_id ? String(receipt.receipt_id) : null;
  if (!receiptId) return;
  const db = openSpeakerDb({ readOnly: false });
  try {
    db.prepare([
      "INSERT INTO artifact_receipts (receipt_id, packet_id, status, artifact_path, sha256, active, created_at)",
      "VALUES (?, ?, ?, ?, ?, 1, ?)",
      "ON CONFLICT(receipt_id) DO UPDATE SET",
      "packet_id = excluded.packet_id,",
      "status = excluded.status,",
      "artifact_path = excluded.artifact_path,",
      "sha256 = excluded.sha256,",
      "active = 1,",
      "created_at = excluded.created_at",
    ].join(" ")).run(
      receiptId,
      receipt.packet_id ? String(receipt.packet_id) : null,
      receipt.status ? String(receipt.status) : "UNKNOWN",
      canonicalPath,
      hash,
      receipt.created_at ? String(receipt.created_at) : new Date().toISOString()
    );
  } finally {
    db.close();
  }
}

function typeName(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function matchesType(value, expected) {
  const actual = typeName(value);
  if (Array.isArray(expected)) return expected.includes(actual);
  return actual === expected;
}

function validateAgainstSchema(value, schema, pointer = "$") {
  const errors = [];

  if (schema.type && !matchesType(value, schema.type)) {
    errors.push(`${pointer} expected type ${JSON.stringify(schema.type)} but found ${typeName(value)}`);
    return errors;
  }

  if (schema.type === "object" && value && typeof value === "object" && !Array.isArray(value)) {
    const required = Array.isArray(schema.required) ? schema.required : [];
    for (const key of required) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(`${pointer}.${key} is required`);
      }
    }

    if (Number.isInteger(schema.minProperties) && Object.keys(value).length < schema.minProperties) {
      errors.push(`${pointer} must have at least ${schema.minProperties} properties`);
    }

    const properties = schema.properties || {};
    for (const [key, childSchema] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(...validateAgainstSchema(value[key], childSchema, `${pointer}.${key}`));
      }
    }
  }

  if (typeof value === "string") {
    if (Number.isInteger(schema.minLength) && value.length < schema.minLength) {
      errors.push(`${pointer} must have length >= ${schema.minLength}`);
    }
    if (schema.pattern && !(new RegExp(schema.pattern).test(value))) {
      errors.push(`${pointer} does not match pattern ${schema.pattern}`);
    }
    if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
      errors.push(`${pointer} must be one of ${schema.enum.join(", ")}`);
    }
  } else if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    errors.push(`${pointer} must be one of ${schema.enum.join(", ")}`);
  }

  return errors;
}

function validateReceipt(receipt, schema) {
  const errors = validateAgainstSchema(receipt, schema);
  const status = typeof receipt.status === "string" ? receipt.status.trim().toLowerCase() : "";
  if (DISALLOWED_STATUS_WORDS.has(status)) {
    errors.push(`$.status uses disallowed vague status word "${receipt.status}"`);
  }
  return errors;
}

function copyCanonical(sourcePath, raw, hash) {
  ensureDir(CANONICAL_DIR);
  const targetPath = path.join(CANONICAL_DIR, stableName("", sourcePath, hash));
  fs.writeFileSync(targetPath, raw);
  return targetPath;
}

function moveQuarantine(sourcePath, raw, hash) {
  ensureDir(QUARANTINE_DIR);
  const targetPath = path.join(QUARANTINE_DIR, stableName("_QUARANTINED", sourcePath, hash));
  fs.writeFileSync(targetPath, raw);
  fs.rmSync(sourcePath, { force: true });
  return targetPath;
}

function ingest(receiptPath) {
  if (!receiptPath) usage(2);

  const absoluteReceiptPath = path.resolve(receiptPath);
  const startedAt = new Date().toISOString();

  let schema;
  try {
    schema = loadJsonFile(SCHEMA_PATH).json;
  } catch (error) {
    const entry = {
      event: "SPEAKER_INGEST_BLOCKER",
      status: "BLOCKER",
      receipt_path: absoluteReceiptPath,
      schema_path: SCHEMA_PATH,
      error: `Cannot load schema: ${error.message}`,
      started_at: startedAt,
    };
    appendLog(entry);
    process.stdout.write(`${JSON.stringify(entry, null, 2)}\n`);
    process.exit(3);
  }

  let loaded;
  try {
    loaded = loadJsonFile(absoluteReceiptPath);
  } catch (error) {
    const entry = {
      event: "SPEAKER_INGEST_BLOCKER",
      status: "BLOCKER",
      receipt_path: absoluteReceiptPath,
      error: `Cannot parse receipt JSON: ${error.message}`,
      started_at: startedAt,
    };
    appendLog(entry);
    process.stdout.write(`${JSON.stringify(entry, null, 2)}\n`);
    process.exit(4);
  }

  const hash = sha256Buffer(loaded.raw);
  const errors = validateReceipt(loaded.json, schema);
  const receiptId = loaded.json && loaded.json.receipt_id ? String(loaded.json.receipt_id) : null;
  const packetId = loaded.json && loaded.json.packet_id ? String(loaded.json.packet_id) : null;

  if (errors.length > 0) {
    const quarantinePath = moveQuarantine(absoluteReceiptPath, loaded.raw, hash);
    const entry = {
      event: "SPEAKER_INGEST_QUARANTINE",
      status: "QUARANTINED",
      receipt_id: receiptId,
      packet_id: packetId,
      source_path: absoluteReceiptPath,
      quarantine_path: quarantinePath,
      sha256: hash,
      errors,
      schema_path: SCHEMA_PATH,
      started_at: startedAt,
    };
    appendLog(entry);
    process.stdout.write(`${JSON.stringify(entry, null, 2)}\n`);
    return 1;
  }

  const canonicalPath = copyCanonical(absoluteReceiptPath, loaded.raw, hash);
  upsertArtifactReceipt(loaded.json, canonicalPath, hash);
  const entry = {
    event: "SPEAKER_INGEST_CANONICAL",
    status: "CANONICALIZED",
    receipt_id: receiptId,
    packet_id: packetId,
    source_path: absoluteReceiptPath,
    canonical_path: canonicalPath,
    sha256: hash,
    schema_path: SCHEMA_PATH,
    started_at: startedAt,
  };
  appendLog(entry);
  process.stdout.write(`${JSON.stringify(entry, null, 2)}\n`);
  return 0;
}

function parseChildJson(stdout) {
  try {
    return stdout ? JSON.parse(stdout) : null;
  } catch {
    return null;
  }
}

function summarizeIngestChild(entry, filePath, exitCode) {
  return {
    file_path: filePath,
    exit_code: exitCode,
    event: entry && entry.event ? entry.event : "UNKNOWN",
    status: entry && entry.status ? entry.status : "UNKNOWN",
    receipt_id: entry && entry.receipt_id ? entry.receipt_id : null,
    packet_id: entry && entry.packet_id ? entry.packet_id : null,
    sha256: entry && entry.sha256 ? entry.sha256 : null,
    canonical_path: entry && entry.canonical_path ? entry.canonical_path : null,
    quarantine_path: entry && entry.quarantine_path ? entry.quarantine_path : null,
    source_path: entry && entry.source_path ? entry.source_path : filePath,
    errors: entry && Array.isArray(entry.errors) ? entry.errors : [],
  };
}

function ingestInbox(inboxPathArg) {
  const startedAt = new Date().toISOString();
  const inboxPath = inboxPathArg ? path.resolve(inboxPathArg) : RAW_INBOX_DIR;
  const report = {
    event: "SPEAKER_INGEST_INBOX",
    status: "UNKNOWN",
    started_at: startedAt,
    inbox_path: inboxPath,
    files_found: 0,
    processed: [],
    canonicalized_count: 0,
    quarantined_count: 0,
    skipped_count: 0,
    blocker_count: 0,
    blockers: [],
  };

  if (!fs.existsSync(inboxPath)) {
    report.status = "EMPTY";
    report.note = "raw inbox path does not exist";
    appendLog(report);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return 0;
  }

  const files = fs.readdirSync(inboxPath)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .map((name) => path.join(inboxPath, name))
    .filter((filePath) => fs.statSync(filePath).isFile())
    .sort((left, right) => left.localeCompare(right));

  report.files_found = files.length;

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath);
    const hash = sha256Buffer(raw);
    const canonicalPath = path.join(CANONICAL_DIR, stableName("", filePath, hash));
    if (fs.existsSync(canonicalPath) && sha256File(canonicalPath) === hash) {
      let skippedJson = null;
      try {
        skippedJson = JSON.parse(raw.toString("utf8"));
      } catch {
        skippedJson = null;
      }
      report.skipped_count += 1;
      report.processed.push({
        file_path: filePath,
        exit_code: 0,
        event: "SPEAKER_INGEST_SKIPPED",
        status: "ALREADY_CANONICAL",
        receipt_id: skippedJson && skippedJson.receipt_id ? String(skippedJson.receipt_id) : null,
        packet_id: skippedJson && skippedJson.packet_id ? String(skippedJson.packet_id) : null,
        sha256: hash,
        canonical_path: canonicalPath,
        quarantine_path: null,
        source_path: filePath,
        errors: [],
      });
      continue;
    }

    try {
      const stdout = execFileSync(process.execPath, [__filename, "ingest", filePath], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      });
      const entry = parseChildJson(stdout);
      const summary = summarizeIngestChild(entry, filePath, 0);
      report.processed.push(summary);
      if (summary.status === "CANONICALIZED") report.canonicalized_count += 1;
    } catch (error) {
      const stdout = error.stdout ? String(error.stdout) : "";
      const entry = parseChildJson(stdout);
      const exitCode = typeof error.status === "number" ? error.status : 1;
      const summary = summarizeIngestChild(entry, filePath, exitCode);
      report.processed.push(summary);
      if (summary.status === "QUARANTINED") {
        report.quarantined_count += 1;
      } else {
        report.blocker_count += 1;
        report.blockers.push({
          file_path: filePath,
          error: entry && entry.error ? entry.error : error.message,
          exit_code: exitCode,
        });
      }
    }
  }

  if (report.blocker_count > 0) {
    report.status = "BLOCKER";
  } else if (report.files_found === 0) {
    report.status = "EMPTY";
  } else if (report.canonicalized_count === 0 && report.quarantined_count === 0 && report.skipped_count > 0) {
    report.status = "NOOP_ALREADY_INGESTED";
  } else {
    report.status = "INGESTED";
  }

  appendLog(report);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report.status === "BLOCKER" ? 1 : 0;
}

function parseProfileTarget(target) {
  if (!target || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(target)) {
    throw new Error("render-bootpack target must be Aeye.Machine, for example Skybro.Betsy");
  }
  const [aeye, machine] = target.split(".");
  return { aeye, machine, target };
}

function loadBootpackProfile(target) {
  const profilePath = path.join(BOOTPACK_PROFILE_DIR, `${target}.json`);
  const { json } = loadJsonFile(profilePath);
  const priorityOrder = Array.isArray(json.priority_order) ? json.priority_order : [];

  if (priorityOrder.length === 0) {
    throw new Error(`Bootpack profile ${profilePath} has no priority_order`);
  }

  for (const key of priorityOrder) {
    if (!ALLOWED_BOOTPACK_PRIORITY_KEYS.has(key)) {
      throw new Error(`Bootpack profile ${profilePath} contains unknown priority key ${JSON.stringify(key)}`);
    }
  }

  return { profile: json, profilePath };
}

function queryRows(db, sql, params = {}) {
  return db.prepare(sql).all(params);
}

function bootpackStream(profile) {
  return profile.stream ? String(profile.stream) : "DEFAULT";
}

function renderBootpackFrontmatter(profile, renderId, renderedAt) {
  const tokenBudget = Number.isInteger(profile.token_budget) ? profile.token_budget : 4000;
  return [
    "---",
    `BOOTPACK_RENDER_ID: ${renderId}`,
    `AEYE: ${profile.aeye}`,
    `MACHINE: ${profile.machine}`,
    `STREAM: ${bootpackStream(profile)}`,
    `RENDERED_AT: ${renderedAt}`,
    "SOURCE: Speaker deterministic bootloader",
    "SPEAKER_IS_ACTIVE_LLM: false",
    "SPEAKER_IS_AEYE: false",
    "SPEAKER_IS_PROCESS_AT_RUNTIME: false",
    `SQLITE_INDEX: ${BOOTPACK_SQLITE_INDEX_LOCK_PATH}`,
    `TOKEN_BUDGET: ${tokenBudget}`,
    "---",
    "",
  ].join("\n");
}

function renderHeader(profile, profilePath, renderId, renderedAt) {
  const lines = [
    `PROFILE_ID: ${profile.profile_id || `${profile.aeye}.${profile.machine}`}`,
    `BOOTPACK_RENDER_ID: ${renderId}`,
    `AEYE: ${profile.aeye}`,
    `MACHINE: ${profile.machine}`,
    `STREAM: ${bootpackStream(profile)}`,
    `PROFILE_PATH: ${profilePath}`,
    `SPEAKER_DB: ${SPEAKER_DB_PATH}`,
    `RENDERED_AT: ${renderedAt}`,
    "SPEAKER_IS_ACTIVE_LLM: false",
    "SPEAKER_IS_AEYE: false",
    "SPEAKER_IS_PROCESS_AT_RUNTIME: false",
  ];
  return `# ${profile.aeye}@${profile.machine} Bootpack\n\n${lines.join("\n")}\n`;
}

function renderTopologyLocks(rows) {
  const lines = ["## Active Topology Locks", ""];
  if (rows.length === 0) {
    lines.push("- NONE");
    return lines.join("\n");
  }
  for (const row of rows) {
    lines.push(`- ${row.lock_id}: ${row.subject} -> ${row.rule}`);
    lines.push(`  - source: ${row.source || "UNKNOWN"}`);
    lines.push(`  - created_at: ${row.created_at || "UNKNOWN"}`);
  }
  return lines.join("\n");
}

function renderBoundaryRules(rows) {
  const lines = ["## Boundary Rules", ""];
  if (rows.length === 0) {
    lines.push("- NONE");
    return lines.join("\n");
  }
  for (const row of rows) {
    lines.push(`- ${row.rule_id}: ${row.rule}`);
    lines.push(`  - severity: ${row.severity || "UNKNOWN"}`);
    lines.push(`  - source: ${row.source || "UNKNOWN"}`);
  }
  return lines.join("\n");
}

function renderReceiptRows(rows) {
  const lines = [];
  for (const row of rows) {
    lines.push(`- ${row.receipt_id}: ${row.packet_id || "NO_PACKET"} -> ${row.status || "UNKNOWN"}`);
    lines.push(`  - artifact_path: ${row.artifact_path || "UNKNOWN"}`);
    lines.push(`  - sha256: ${row.sha256 || "UNKNOWN"}`);
    lines.push(`  - created_at: ${row.created_at || "UNKNOWN"}`);
  }
  return lines.join("\n");
}

function renderCurrentRepoState() {
  if (!fs.existsSync(CURRENT_REPO_STATE_TEMPLATE_PATH)) {
    return [
      "## Current Repo State",
      "",
      `BLOCKER: Missing git snapshot template at ${CURRENT_REPO_STATE_TEMPLATE_PATH}`,
      "Run: C:\\Program Files\\Git\\bin\\bash.exe C:\\speaker\\bin\\git-snapshot.sh",
    ].join("\n");
  }

  const body = fs.readFileSync(CURRENT_REPO_STATE_TEMPLATE_PATH, "utf8").trimEnd();
  return [
    "## Current Repo State",
    "",
    body,
  ].join("\n");
}

function toGitBashPath(filePath) {
  const resolved = path.resolve(filePath);
  const drive = resolved.slice(0, 1).toLowerCase();
  const rest = resolved.slice(2).replace(/\\/g, "/");
  return `/${drive}${rest}`;
}

function refreshCurrentRepoStateIfRequested(profile) {
  const priorityOrder = Array.isArray(profile.priority_order) ? profile.priority_order : [];
  if (!priorityOrder.includes("current_repo_state")) {
    return { attempted: false, reason: "profile_does_not_request_current_repo_state" };
  }
  if (profile.auto_refresh_repo_state === false) {
    return { attempted: false, reason: "profile_disabled_auto_refresh_repo_state" };
  }
  if (!fs.existsSync(GIT_SNAPSHOT_SCRIPT_PATH)) {
    throw new Error(`Missing Git snapshot script: ${GIT_SNAPSHOT_SCRIPT_PATH}`);
  }
  if (!fs.existsSync(GIT_BASH_PATH)) {
    throw new Error(`Missing Git Bash needed for git-snapshot.sh: ${GIT_BASH_PATH}`);
  }

  const startedAt = new Date().toISOString();
  const stdout = execFileSync(GIT_BASH_PATH, [GIT_SNAPSHOT_SCRIPT_PATH], {
    cwd: SPEAKER_ROOT,
    env: {
      ...process.env,
      SPEAKER_ROOT: toGitBashPath(SPEAKER_ROOT),
    },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const entry = {
    event: "SPEAKER_REFRESH_CURRENT_REPO_STATE",
    status: "REFRESHED",
    started_at: startedAt,
    script_path: GIT_SNAPSHOT_SCRIPT_PATH,
    template_path: CURRENT_REPO_STATE_TEMPLATE_PATH,
    template_sha256: fs.existsSync(CURRENT_REPO_STATE_TEMPLATE_PATH) ? sha256File(CURRENT_REPO_STATE_TEMPLATE_PATH) : null,
    stdout: stdout.trim(),
  };
  appendRepoStateLog(entry);
  return entry;
}

function approxTokenLimitToChars(tokenBudget) {
  const numericBudget = Number.isInteger(tokenBudget) ? tokenBudget : 4000;
  return Math.max(1000, numericBudget * 4);
}

function renderBootpack(targetArg) {
  const startedAt = new Date().toISOString();
  const renderId = crypto.randomUUID();
  const { aeye, machine, target } = parseProfileTarget(targetArg);
  const { profile, profilePath } = loadBootpackProfile(target);

  if (profile.aeye !== aeye || profile.machine !== machine) {
    throw new Error(`Profile identity mismatch: expected ${target}, got ${profile.aeye}.${profile.machine}`);
  }

  const repoStateRefresh = refreshCurrentRepoStateIfRequested(profile);

  const db = openSpeakerDb();
  let topologyLocks;
  let boundaryRules;
  let receiptRows;
  try {
    topologyLocks = queryRows(db, [
      "SELECT lock_id, subject, rule, source, created_at, priority",
      "FROM active_topology_locks",
      "WHERE active = 1",
      "ORDER BY priority ASC, created_at DESC",
    ].join(" "));
    boundaryRules = queryRows(db, [
      "SELECT rule_id, rule, severity, source, priority",
      "FROM boundary_rules",
      "WHERE active = 1",
      "ORDER BY priority ASC, rule_id ASC",
    ].join(" "));
    receiptRows = queryRows(db, [
      "SELECT receipt_id, packet_id, status, artifact_path, sha256, created_at",
      "FROM artifact_receipts",
      "WHERE active = 1",
      "ORDER BY created_at DESC, receipt_id DESC",
      "LIMIT $limit",
    ].join(" "), { $limit: profile.receipt_limit || 50 });
  } finally {
    db.close();
  }

  const sections = new Map();
  sections.set("header", renderHeader(profile, profilePath, renderId, startedAt));
  sections.set("active_topology_locks", renderTopologyLocks(topologyLocks));
  sections.set("boundary_rules", renderBoundaryRules(boundaryRules));
  sections.set("current_repo_state", renderCurrentRepoState());

  const maxChars = approxTokenLimitToChars(profile.token_budget);
  let receiptsForRender = receiptRows.slice();
  let truncatedReceipts = 0;
  let markdown = "";

  while (true) {
    sections.set("recent_artifact_receipts", [
      "## Recent Artifact Receipts",
      "",
      receiptsForRender.length === 0 ? "- NONE" : renderReceiptRows(receiptsForRender),
    ].join("\n"));

    markdown = renderBootpackFrontmatter(profile, renderId, startedAt);
    markdown += profile.priority_order.map((key) => sections.get(key)).join("\n\n").trimEnd() + "\n";
    markdown += `\n## Render Report\n\n- token_budget: ${profile.token_budget || 4000}\n- budget_mode: approximate_4_chars_per_token\n- receipts_included: ${receiptsForRender.length}\n- receipts_truncated_oldest: ${truncatedReceipts}\n`;

    if (markdown.length <= maxChars || receiptsForRender.length === 0) break;
    receiptsForRender.pop();
    truncatedReceipts += 1;
  }

  if (markdown.length > maxChars) {
    throw new Error(`Bootpack exceeds token budget after receipt truncation: ${markdown.length} chars > ${maxChars} chars`);
  }

  if (!markdown.startsWith("---\nBOOTPACK_RENDER_ID: ")) {
    throw new Error("Bootpack compiler invariant failed: required YAML frontmatter is not at line zero");
  }

  ensureDir(BOOTPACK_OUT_DIR);
  const filename = profile.stream
    ? `${aeye}.${machine}.${String(profile.stream).replace(/[^A-Za-z0-9_-]+/g, "_")}.BOOTPACK.md`
    : `${aeye}.${machine}.BOOTPACK.md`;
  const outPath = path.join(BOOTPACK_OUT_DIR, filename);
  fs.writeFileSync(outPath, markdown, "utf8");
  const outputHash = sha256Buffer(Buffer.from(markdown, "utf8"));

  const entry = {
    event: "SPEAKER_RENDER_BOOTPACK",
    status: "BOOTPACK_RENDERED",
    bootpack_render_id: renderId,
    target,
    profile_path: profilePath,
    db_path: SPEAKER_DB_PATH,
    output_path: outPath,
    sha256: outputHash,
    byte_count: Buffer.byteLength(markdown, "utf8"),
    topology_locks: topologyLocks.length,
    boundary_rules: boundaryRules.length,
    receipts_seen: receiptRows.length,
    receipts_included: receiptsForRender.length,
    receipts_truncated_oldest: truncatedReceipts,
    repo_state_refresh: repoStateRefresh,
    started_at: startedAt,
  };
  appendBootpackLog(entry);
  process.stdout.write(`${JSON.stringify(entry, null, 2)}\n`);
  return 0;
}

function getActiveReceipt(db, receiptId) {
  return db.prepare([
    "SELECT receipt_id, packet_id, status, artifact_path, sha256, active, created_at",
    "FROM artifact_receipts",
    "WHERE receipt_id = ? AND active = 1",
  ].join(" ")).get(receiptId);
}

function queueApoptosis(receiptId) {
  if (!receiptId) throw new Error("queue-apoptosis requires receipt_id");
  const startedAt = new Date().toISOString();
  const db = openSpeakerDb({ readOnly: false });
  let receipt;
  const queueId = `APOPTOSIS_${sanitizeId(receiptId)}`;
  try {
    receipt = getActiveReceipt(db, receiptId);
    if (!receipt) throw new Error(`Cannot queue missing or inactive receipt: ${receiptId}`);
    db.prepare([
      "INSERT INTO apoptosis_queue (queue_id, target_receipt_id, status, reason, bundle_path, created_at, updated_at)",
      "VALUES (?, ?, 'QUEUED', ?, NULL, ?, ?)",
      "ON CONFLICT(queue_id) DO UPDATE SET",
      "target_receipt_id = excluded.target_receipt_id,",
      "status = 'QUEUED',",
      "reason = excluded.reason,",
      "bundle_path = NULL,",
      "updated_at = excluded.updated_at",
    ].join(" ")).run(queueId, receiptId, "V0 deterministic apoptosis test queue", startedAt, startedAt);
  } finally {
    db.close();
  }

  const entry = {
    event: "SPEAKER_QUEUE_APOPTOSIS",
    status: "QUEUED",
    queue_id: queueId,
    target_receipt_id: receiptId,
    receipt_status: receipt.status,
    started_at: startedAt,
  };
  appendApoptosisLog(entry);
  process.stdout.write(`${JSON.stringify(entry, null, 2)}\n`);
  return 0;
}

function exportApoptosis(queueId) {
  if (!queueId) throw new Error("export-apoptosis requires queue_id");
  const startedAt = new Date().toISOString();
  const db = openSpeakerDb({ readOnly: false });
  let queue;
  let receipt;
  let bundlePath;
  try {
    queue = db.prepare("SELECT * FROM apoptosis_queue WHERE queue_id = ?").get(queueId);
    if (!queue) throw new Error(`Cannot export missing apoptosis queue: ${queueId}`);
    receipt = db.prepare("SELECT * FROM artifact_receipts WHERE receipt_id = ?").get(queue.target_receipt_id);
    if (!receipt) throw new Error(`Cannot export queue ${queueId}; missing receipt ${queue.target_receipt_id}`);

    ensureDir(ENDER_BUNDLE_DIR);
    bundlePath = path.join(ENDER_BUNDLE_DIR, `${sanitizeId(queueId)}.bundle.json`);
    const bundle = {
      bundle_id: `ENDER_BUNDLE_${sanitizeId(queueId)}`,
      queue,
      receipt,
      created_at: startedAt,
      instruction: "External reviewer may propose an apoptosis_patch.json. This bundle does not invoke an LLM.",
    };
    fs.writeFileSync(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
    db.prepare("UPDATE apoptosis_queue SET status = 'EXPORTED', bundle_path = ?, updated_at = ? WHERE queue_id = ?")
      .run(bundlePath, startedAt, queueId);
  } finally {
    db.close();
  }

  const entry = {
    event: "SPEAKER_EXPORT_APOPTOSIS",
    status: "EXPORTED",
    queue_id: queueId,
    target_receipt_id: queue.target_receipt_id,
    bundle_path: bundlePath,
    sha256: sha256Buffer(fs.readFileSync(bundlePath)),
    started_at: startedAt,
  };
  appendApoptosisLog(entry);
  process.stdout.write(`${JSON.stringify(entry, null, 2)}\n`);
  return 0;
}

function requireStringField(object, fieldName, label) {
  if (!object || typeof object[fieldName] !== "string" || object[fieldName].trim() === "") {
    throw new Error(`${label}.${fieldName} is required`);
  }
  return object[fieldName];
}

function applyApoptosis(patchPath, approvalPath) {
  if (!patchPath || !approvalPath) throw new Error("apply-apoptosis requires apoptosis_patch.json and operator_approval_receipt.json");
  const startedAt = new Date().toISOString();
  const absolutePatchPath = path.resolve(patchPath);
  const absoluteApprovalPath = path.resolve(approvalPath);
  const loadedPatch = loadJsonFile(absolutePatchPath);
  const loadedApproval = loadJsonFile(absoluteApprovalPath);
  const patch = loadedPatch.json;
  const approval = loadedApproval.json;
  const patchHash = sha256Buffer(loadedPatch.raw);

  const queueId = requireStringField(patch, "queue_id", "patch");
  const targetReceiptId = requireStringField(patch, "target_receipt_id", "patch");
  const action = requireStringField(patch, "action", "patch");
  const approvalId = requireStringField(approval, "approval_id", "approval");

  if (action !== "GRAVEYARD_RECEIPT") throw new Error(`Unsupported apoptosis action: ${action}`);
  if (approval.queue_id !== queueId) throw new Error("approval.queue_id must match patch.queue_id");
  if (approval.target_receipt_id !== targetReceiptId) throw new Error("approval.target_receipt_id must match patch.target_receipt_id");
  if (approval.approved !== true) throw new Error("operator approval must set approved true");

  const db = openSpeakerDb({ readOnly: false });
  let queue;
  let receipt;
  let graveyardPath;
  const graveyardId = patch.graveyard_id ? sanitizeId(patch.graveyard_id) : `GRAVEYARD_${sanitizeId(targetReceiptId)}`;
  try {
    queue = db.prepare("SELECT * FROM apoptosis_queue WHERE queue_id = ?").get(queueId);
    if (!queue) throw new Error(`Cannot apply missing apoptosis queue: ${queueId}`);
    if (queue.target_receipt_id !== targetReceiptId) throw new Error("queue target does not match patch target");
    receipt = getActiveReceipt(db, targetReceiptId);
    if (!receipt) throw new Error(`Cannot graveyard missing or inactive receipt: ${targetReceiptId}`);
    if (!receipt.artifact_path || !fs.existsSync(receipt.artifact_path)) {
      throw new Error(`Cannot graveyard receipt because artifact_path is missing on disk: ${receipt.artifact_path || "UNKNOWN"}`);
    }

    ensureDir(GRAVEYARD_RECEIPT_DIR);
    graveyardPath = path.join(GRAVEYARD_RECEIPT_DIR, `${sanitizeId(targetReceiptId)}_${receipt.sha256.slice(0, 16)}.json`);
    fs.copyFileSync(receipt.artifact_path, graveyardPath);

    db.prepare([
      "INSERT OR REPLACE INTO graveyard_ledger",
      "(graveyard_id, queue_id, target_receipt_id, receipt_id, action, artifact_path, approval_id, patch_path, patch_sha256, applied_at, reason)",
      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ].join(" ")).run(
      graveyardId,
      queueId,
      targetReceiptId,
      receipt.receipt_id,
      action,
      graveyardPath,
      approvalId,
      absolutePatchPath,
      patchHash,
      startedAt,
      patch.reason || "V0 deterministic apoptosis test"
    );
    db.prepare("UPDATE artifact_receipts SET active = 0 WHERE receipt_id = ?").run(targetReceiptId);
    db.prepare("UPDATE apoptosis_queue SET status = 'APPLIED', updated_at = ? WHERE queue_id = ?").run(startedAt, queueId);
  } finally {
    db.close();
  }

  const entry = {
    event: "SPEAKER_APPLY_APOPTOSIS",
    status: "APPLIED",
    graveyard_id: graveyardId,
    queue_id: queueId,
    target_receipt_id: targetReceiptId,
    approval_id: approvalId,
    patch_path: absolutePatchPath,
    patch_sha256: patchHash,
    graveyard_artifact_path: graveyardPath,
    started_at: startedAt,
  };
  appendApoptosisLog(entry);
  process.stdout.write(`${JSON.stringify(entry, null, 2)}\n`);
  return 0;
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function printIntegrityFailure(report) {
  const lines = [
    "",
    "============================================================",
    "SPEAKER PRE-PUSH INTEGRITY BREACH - PUSH BLOCKED",
    "============================================================",
    `strict: ${report.strict}`,
    `doctrine_index: ${report.doctrine_index_path}`,
    `speaker_db: ${report.speaker_db_path}`,
    `checked_files: ${report.checked_files}`,
    `breach_count: ${report.breaches.length}`,
    "",
  ];

  for (const breach of report.breaches) {
    lines.push(`BREACH: ${breach.file_path}`);
    lines.push(`  reason: ${breach.reason}`);
    if (breach.expected_sha256) lines.push(`  expected_sha256: ${breach.expected_sha256}`);
    if (breach.actual_sha256) lines.push(`  actual_sha256:   ${breach.actual_sha256}`);
    if (breach.receipt_signature_id) lines.push(`  receipt_signature_id: ${breach.receipt_signature_id}`);
    lines.push("");
  }

  lines.push("Push rejected. Add a canonical receipt signature record before pushing doctrine mutations.");
  lines.push("============================================================");
  process.stdout.write(`${lines.join("\n")}\n`);
}

function verifyIntegrity(options = {}) {
  const strict = options.strict === true;
  const startedAt = new Date().toISOString();
  const report = {
    event: "SPEAKER_VERIFY_INTEGRITY",
    status: "UNKNOWN",
    strict,
    started_at: startedAt,
    doctrine_index_path: DOCTRINE_INDEX_PATH,
    speaker_db_path: SPEAKER_DB_PATH,
    checked_files: 0,
    breaches: [],
  };

  let index;
  try {
    index = loadJsonFile(DOCTRINE_INDEX_PATH).json;
  } catch (error) {
    report.status = "BLOCKED";
    report.breaches.push({
      file_path: DOCTRINE_INDEX_PATH,
      reason: `Cannot load active doctrine index: ${error.message}`,
    });
    printIntegrityFailure(report);
    return 1;
  }

  if (index.active !== true || !Array.isArray(index.files)) {
    report.status = "BLOCKED";
    report.breaches.push({
      file_path: DOCTRINE_INDEX_PATH,
      reason: "Doctrine index must set active=true and provide files[]",
    });
    printIntegrityFailure(report);
    return 1;
  }

  let db;
  try {
    db = openSpeakerDb({ readOnly: true });
    for (const entry of index.files) {
      report.checked_files += 1;
      const relativePath = String(entry.relative_path || "");
      const expectedHash = String(entry.sha256 || "").toUpperCase();
      const expectedSignatureId = String(entry.receipt_signature_id || "");
      const doctrineFilePath = path.join(SPEAKER_ROOT, relativePath);

      if (!relativePath || !expectedHash || !expectedSignatureId) {
        report.breaches.push({
          file_path: relativePath || "UNKNOWN",
          reason: "Index entry missing relative_path, sha256, or receipt_signature_id",
          expected_sha256: expectedHash || null,
          receipt_signature_id: expectedSignatureId || null,
        });
        continue;
      }

      if (!fs.existsSync(doctrineFilePath)) {
        report.breaches.push({
          file_path: relativePath,
          reason: "Cataloged doctrine file is missing",
          expected_sha256: expectedHash,
          receipt_signature_id: expectedSignatureId,
        });
        continue;
      }

      const actualHash = sha256File(doctrineFilePath);
      const logRow = db.prepare([
        "SELECT file_path, sha256, receipt_signature_id, canonical_receipt_path, logged_at",
        "FROM doctrine_file_log",
        "WHERE file_path = ? AND sha256 = ?",
      ].join(" ")).get(relativePath, actualHash);

      if (actualHash !== expectedHash) {
        report.breaches.push({
          file_path: relativePath,
          reason: "Doctrine file hash does not match active doctrine index",
          expected_sha256: expectedHash,
          actual_sha256: actualHash,
          receipt_signature_id: expectedSignatureId,
        });
        continue;
      }

      if (!logRow) {
        report.breaches.push({
          file_path: relativePath,
          reason: "No matching historical receipt signature row in speaker.sqlite",
          expected_sha256: expectedHash,
          actual_sha256: actualHash,
          receipt_signature_id: expectedSignatureId,
        });
        continue;
      }

      if (logRow.receipt_signature_id !== expectedSignatureId) {
        report.breaches.push({
          file_path: relativePath,
          reason: "SQLite receipt signature id does not match active doctrine index",
          expected_sha256: expectedHash,
          actual_sha256: actualHash,
          receipt_signature_id: expectedSignatureId,
          sqlite_receipt_signature_id: logRow.receipt_signature_id,
        });
        continue;
      }

      if (!logRow.canonical_receipt_path || !fs.existsSync(logRow.canonical_receipt_path)) {
        report.breaches.push({
          file_path: relativePath,
          reason: "SQLite signature row lacks an existing canonical receipt path",
          expected_sha256: expectedHash,
          actual_sha256: actualHash,
          receipt_signature_id: expectedSignatureId,
        });
      }
    }
  } catch (error) {
    report.breaches.push({
      file_path: SPEAKER_DB_PATH,
      reason: `Integrity query failed: ${error.message}`,
    });
  } finally {
    if (db) db.close();
  }

  if (report.breaches.length > 0) {
    report.status = "BREACH";
    printIntegrityFailure(report);
    return strict ? 1 : 0;
  }

  report.status = "PASS";
  process.stdout.write([
    "============================================================",
    "SPEAKER INTEGRITY OK",
    "============================================================",
    `strict: ${report.strict}`,
    `doctrine_index: ${report.doctrine_index_path}`,
    `speaker_db: ${report.speaker_db_path}`,
    `checked_files: ${report.checked_files}`,
    "result: PASS",
    "============================================================",
  ].join("\n") + "\n");
  return 0;
}

function parseBootpackFrontmatter(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  if (lines[0] !== "---") {
    return { ok: false, fields: {}, errors: ["line_zero_must_be_yaml_frontmatter_open"] };
  }

  const fields = {};
  const errors = [];
  let closeIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === "---") {
      closeIndex = i;
      break;
    }
    const match = /^([A-Z0-9_]+):\s*(.*)$/.exec(lines[i]);
    if (!match) {
      errors.push(`invalid_frontmatter_line_${i + 1}`);
      continue;
    }
    fields[match[1]] = match[2];
  }

  if (closeIndex < 0) {
    errors.push("missing_yaml_frontmatter_close");
  }

  return { ok: errors.length === 0, fields, errors, closeIndex };
}

function validateBootpackHeaderFields(fields) {
  const errors = [];
  const requiredFields = [
    "BOOTPACK_RENDER_ID",
    "AEYE",
    "MACHINE",
    "STREAM",
    "RENDERED_AT",
    "SOURCE",
    "SPEAKER_IS_ACTIVE_LLM",
    "SPEAKER_IS_AEYE",
    "SPEAKER_IS_PROCESS_AT_RUNTIME",
    "SQLITE_INDEX",
    "TOKEN_BUDGET",
  ];

  for (const field of requiredFields) {
    if (!Object.prototype.hasOwnProperty.call(fields, field) || fields[field] === "") {
      errors.push(`missing_${field}`);
    }
  }

  if (fields.BOOTPACK_RENDER_ID && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(fields.BOOTPACK_RENDER_ID)) {
    errors.push("BOOTPACK_RENDER_ID_must_be_uuid");
  }
  if (fields.SOURCE !== "Speaker deterministic bootloader") {
    errors.push("SOURCE_must_be_Speaker_deterministic_bootloader");
  }
  if (fields.SPEAKER_IS_ACTIVE_LLM !== "false") {
    errors.push("SPEAKER_IS_ACTIVE_LLM_must_be_false");
  }
  if (fields.SPEAKER_IS_AEYE !== "false") {
    errors.push("SPEAKER_IS_AEYE_must_be_false");
  }
  if (fields.SPEAKER_IS_PROCESS_AT_RUNTIME !== "false") {
    errors.push("SPEAKER_IS_PROCESS_AT_RUNTIME_must_be_false");
  }
  if (fields.SQLITE_INDEX !== BOOTPACK_SQLITE_INDEX_LOCK_PATH) {
    errors.push(`SQLITE_INDEX_must_be_${BOOTPACK_SQLITE_INDEX_LOCK_PATH}`);
  }
  if (fields.TOKEN_BUDGET && !/^[0-9]+$/.test(fields.TOKEN_BUDGET)) {
    errors.push("TOKEN_BUDGET_must_be_integer");
  }
  if (fields.RENDERED_AT && Number.isNaN(Date.parse(fields.RENDERED_AT))) {
    errors.push("RENDERED_AT_must_be_ISO_8601_timestamp");
  }

  return errors;
}

function verifyBootpackHeaders() {
  const startedAt = new Date().toISOString();
  ensureDir(BOOTPACK_OUT_DIR);
  const bootpackFiles = fs.readdirSync(BOOTPACK_OUT_DIR)
    .filter((name) => name.endsWith(".BOOTPACK.md"))
    .sort()
    .map((name) => path.join(BOOTPACK_OUT_DIR, name));

  const results = bootpackFiles.map((filePath) => {
    const parsed = parseBootpackFrontmatter(filePath);
    const fieldErrors = validateBootpackHeaderFields(parsed.fields);
    const errors = [...parsed.errors, ...fieldErrors];
    return {
      file_path: filePath,
      sha256: sha256File(filePath),
      byte_count: fs.statSync(filePath).size,
      first_line: fs.readFileSync(filePath, "utf8").split(/\r?\n/, 1)[0],
      bootpack_render_id: parsed.fields.BOOTPACK_RENDER_ID || null,
      aeye: parsed.fields.AEYE || null,
      machine: parsed.fields.MACHINE || null,
      stream: parsed.fields.STREAM || null,
      ok: errors.length === 0,
      errors,
    };
  });

  const report = {
    event: "SPEAKER_VERIFY_BOOTPACK_HEADERS",
    status: results.every((result) => result.ok) ? "PASS" : "FAIL",
    started_at: startedAt,
    bootpack_out_dir: BOOTPACK_OUT_DIR,
    checked_count: results.length,
    required_line_zero: "---",
    required_false_fields: [
      "SPEAKER_IS_ACTIVE_LLM",
      "SPEAKER_IS_AEYE",
      "SPEAKER_IS_PROCESS_AT_RUNTIME",
    ],
    results,
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report.status === "PASS" ? 0 : 1;
}

function parseRepoStateTemplate() {
  if (!fs.existsSync(CURRENT_REPO_STATE_TEMPLATE_PATH)) {
    throw new Error(`Missing current repo state template: ${CURRENT_REPO_STATE_TEMPLATE_PATH}`);
  }
  const text = fs.readFileSync(CURRENT_REPO_STATE_TEMPLATE_PATH, "utf8");
  const fields = {};
  for (const line of text.split(/\r?\n/)) {
    const match = /^([A-Z_]+):\s*(.*)$/.exec(line);
    if (match) fields[match[1]] = match[2];
  }
  return { text, fields };
}

function normalizeGitPath(repoPath) {
  if (/^\/[a-z]\//i.test(repoPath)) {
    return `${repoPath[1].toUpperCase()}:\\${repoPath.slice(3).replace(/\//g, "\\")}`;
  }
  return repoPath;
}

function gitStdout(repoPath, args) {
  return execFileSync("git", ["-C", repoPath, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function verifyCurrentRepoState() {
  const startedAt = new Date().toISOString();
  const report = {
    event: "SPEAKER_VERIFY_CURRENT_REPO_STATE",
    status: "UNKNOWN",
    started_at: startedAt,
    template_path: CURRENT_REPO_STATE_TEMPLATE_PATH,
    checks: [],
    errors: [],
  };

  let parsed;
  try {
    parsed = parseRepoStateTemplate();
  } catch (error) {
    report.status = "FAIL";
    report.errors.push(error.message);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return 1;
  }

  const { text, fields } = parsed;
  const requiredFields = ["SNAPSHOT_ID", "GENERATED_AT", "TARGET_REPO", "CURRENT_BRANCH", "HEAD", "UPSTREAM"];
  for (const field of requiredFields) {
    report.checks.push({
      check: `field_${field}`,
      ok: Object.prototype.hasOwnProperty.call(fields, field) && fields[field] !== "",
      value: fields[field] || null,
    });
  }

  const requiredSections = ["## git remote -v", "## git branch -a", "## git log -n 5 --oneline", "## git status --short"];
  for (const section of requiredSections) {
    report.checks.push({
      check: `section_${section.replace(/[^A-Za-z0-9]+/g, "_")}`,
      ok: text.includes(section),
    });
  }

  const secretPattern = /(ghp_|github_pat_|x-access-token|BEGIN OPENSSH PRIVATE KEY|BEGIN RSA PRIVATE KEY)/;
  report.checks.push({
    check: "no_obvious_pat_or_private_key_pattern",
    ok: !secretPattern.test(text),
  });

  if (fields.GENERATED_AT) {
    const generatedAtMs = Date.parse(fields.GENERATED_AT);
    report.checks.push({
      check: "generated_at_is_parseable",
      ok: !Number.isNaN(generatedAtMs),
      value: fields.GENERATED_AT,
    });
  }

  if (fields.TARGET_REPO) {
    const repoPath = normalizeGitPath(fields.TARGET_REPO);
    report.repo_path = repoPath;
    try {
      const currentBranch = gitStdout(repoPath, ["branch", "--show-current"]) || "DETACHED";
      const head = gitStdout(repoPath, ["rev-parse", "HEAD"]);
      let upstream = "NONE";
      try {
        upstream = gitStdout(repoPath, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"]) || "NONE";
      } catch {
        upstream = "NONE";
      }

      report.checks.push({
        check: "current_branch_matches_live_git",
        ok: fields.CURRENT_BRANCH === currentBranch,
        snapshot: fields.CURRENT_BRANCH,
        live: currentBranch,
      });
      report.checks.push({
        check: "head_matches_live_git",
        ok: fields.HEAD === head,
        snapshot: fields.HEAD,
        live: head,
      });
      report.checks.push({
        check: "upstream_matches_live_git",
        ok: fields.UPSTREAM === upstream,
        snapshot: fields.UPSTREAM,
        live: upstream,
      });
    } catch (error) {
      report.errors.push(`live_git_compare_failed: ${error.message}`);
    }
  }

  report.template_sha256 = sha256File(CURRENT_REPO_STATE_TEMPLATE_PATH);
  report.status = report.errors.length === 0 && report.checks.every((check) => check.ok) ? "PASS" : "FAIL";
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report.status === "PASS" ? 0 : 1;
}

function isPathInside(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function timestampForBranch(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function requirePromoteCapsuleField(capsule, fieldName) {
  if (!capsule || typeof capsule[fieldName] !== "string" || capsule[fieldName].trim() === "") {
    throw new Error(`capsule.${fieldName} is required`);
  }
  return capsule[fieldName].trim();
}

function hasValidOperatorSignature(capsule) {
  const signature = typeof capsule.operator_signature === "string" ? capsule.operator_signature.trim() : "";
  const validation = capsule.signature_validation && typeof capsule.signature_validation === "object" ? capsule.signature_validation : {};
  const validationStatus = typeof validation.status === "string" ? validation.status.toUpperCase() : "";
  const hasArmoredSignature = /-----BEGIN PGP (SIGNATURE|SIGNED MESSAGE)-----[\s\S]+-----END PGP (SIGNATURE|SIGNED MESSAGE)-----/.test(signature);
  const hasExplicitValidationReceipt = validationStatus === "VALID"
    && typeof validation.receipt_id === "string"
    && validation.receipt_id.trim() !== ""
    && typeof validation.validator === "string"
    && validation.validator.trim() !== "";

  return {
    ok: Boolean(signature) && hasExplicitValidationReceipt,
    signature,
    signature_sha256: signature ? sha256Buffer(Buffer.from(signature, "utf8")) : null,
    validation,
    has_armored_signature: hasArmoredSignature,
    has_explicit_validation_receipt: hasExplicitValidationReceipt,
  };
}

function findCanonicalReceiptById(receiptId) {
  if (!fs.existsSync(CANONICAL_DIR)) return null;
  const candidates = fs.readdirSync(CANONICAL_DIR)
    .filter((name) => name.toLowerCase().endsWith(".json"))
    .map((name) => path.join(CANONICAL_DIR, name));

  for (const candidate of candidates) {
    try {
      const loaded = loadJsonFile(candidate);
      if (loaded.json && String(loaded.json.receipt_id || "") === receiptId) {
        return {
          path: candidate,
          receipt: loaded.json,
          raw: loaded.raw,
        };
      }
    } catch {
      // Ignore malformed historical files here; ingest validation owns quarantine.
    }
  }
  return null;
}

function resolveCanonicalReceiptForCapsule(capsule) {
  const targetReceiptId = requirePromoteCapsuleField(capsule, "target_receipt_id");
  if (typeof capsule.canonical_receipt_path === "string" && capsule.canonical_receipt_path.trim() !== "") {
    const canonicalPath = path.resolve(capsule.canonical_receipt_path);
    if (!isPathInside(canonicalPath, CANONICAL_DIR)) {
      throw new Error(`canonical_receipt_path must stay inside ${CANONICAL_DIR}`);
    }
    if (!fs.existsSync(canonicalPath)) throw new Error(`canonical_receipt_path missing: ${canonicalPath}`);
    const loaded = loadJsonFile(canonicalPath);
    if (String(loaded.json.receipt_id || "") !== targetReceiptId) {
      throw new Error("canonical receipt_id does not match capsule.target_receipt_id");
    }
    return { path: canonicalPath, receipt: loaded.json, raw: loaded.raw };
  }

  const found = findCanonicalReceiptById(targetReceiptId);
  if (!found) throw new Error(`No canonical receipt found for target_receipt_id: ${targetReceiptId}`);
  return found;
}

function speakerGit(args, options = {}) {
  return execFileSync("git", args, {
    cwd: SPEAKER_ROOT,
    encoding: "utf8",
    stdio: options.capture === false ? "inherit" : ["ignore", "pipe", "pipe"],
  }).trim();
}

function remoteOriginUrl() {
  try {
    return speakerGit(["remote", "get-url", "origin"]);
  } catch {
    return "";
  }
}

function gitHasBranch(branchName) {
  try {
    speakerGit(["rev-parse", "--verify", "--quiet", branchName]);
    return true;
  } catch {
    return false;
  }
}

function gitMaybe(args) {
  try {
    return speakerGit(args);
  } catch {
    return "";
  }
}

function readLastJsonlEntry(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      return JSON.parse(lines[index]);
    } catch {
      // Continue backward until a parseable event is found.
    }
  }
  return null;
}

function summarizeReleaseValveEvent(entry) {
  if (!entry || typeof entry !== "object") return null;
  return {
    event: entry.event || null,
    status: entry.status || null,
    started_at: entry.started_at || null,
    logged_at: entry.logged_at || null,
    capsule_id: entry.capsule_id || null,
    target_receipt_id: entry.target_receipt_id || null,
    branch_name: entry.branch_name || null,
    blocker_count: Array.isArray(entry.blockers) ? entry.blockers.length : 0,
    blockers: Array.isArray(entry.blockers) ? entry.blockers.slice(0, 5) : [],
    planned_commands_count: Array.isArray(entry.planned_commands) ? entry.planned_commands.length : 0,
  };
}

function verifyReleaseReadiness(options = {}) {
  const shouldLog = options.log !== false;
  const startedAt = new Date().toISOString();
  const report = {
    event: "SPEAKER_VERIFY_RELEASE_READINESS",
    status: "UNKNOWN",
    started_at: startedAt,
    speaker_root: SPEAKER_ROOT,
    checks: [],
    blockers: [],
    warnings: [],
  };

  function addCheck(check, ok, details = {}, blocker = null) {
    report.checks.push({ check, ok, ...details });
    if (!ok && blocker) report.blockers.push(blocker);
  }

  const insideWorkTree = gitMaybe(["rev-parse", "--is-inside-work-tree"]);
  addCheck(
    "speaker_root_is_git_repo",
    insideWorkTree === "true",
    { value: insideWorkTree || null },
    `C:\\speaker is not a readable git repository at ${SPEAKER_ROOT}`
  );

  report.current_branch = gitMaybe(["branch", "--show-current"]) || "DETACHED_OR_UNKNOWN";
  report.head = gitMaybe(["rev-parse", "HEAD"]) || "UNKNOWN";
  const originUrl = remoteOriginUrl();
  report.origin_configured = Boolean(originUrl);
  if (originUrl) {
    report.origin_url = originUrl.replace(/(https?:\/\/)([^/@]+@)/, "$1");
  }
  addCheck(
    "git_remote_origin_configured",
    Boolean(originUrl),
    { origin_configured: Boolean(originUrl) },
    "git remote origin is not configured for C:\\speaker"
  );

  const signingKey = gitMaybe(["config", "--get", "user.signingkey"]);
  const gpgProgram = gitMaybe(["config", "--get", "gpg.program"]);
  const commitGpgSign = gitMaybe(["config", "--get", "commit.gpgsign"]);
  report.git_signing = {
    user_signingkey_configured: Boolean(signingKey),
    user_signingkey: signingKey || null,
    gpg_program: gpgProgram || null,
    commit_gpgsign: commitGpgSign || null,
  };
  addCheck(
    "git_user_signingkey_configured",
    Boolean(signingKey),
    { user_signingkey_configured: Boolean(signingKey) },
    "git user.signingkey is not configured for release signing"
  );

  const operatorPubkeyExists = fs.existsSync(OPERATOR_PUBKEY_ASC_PATH);
  const operatorPubkeyHashExists = fs.existsSync(OPERATOR_PUBKEY_SHA256_PATH);
  report.operator_keyring_lock = {
    operator_pubkey_asc: OPERATOR_PUBKEY_ASC_PATH,
    operator_pubkey_asc_exists: operatorPubkeyExists,
    operator_pubkey_sha256: OPERATOR_PUBKEY_SHA256_PATH,
    operator_pubkey_sha256_exists: operatorPubkeyHashExists,
  };
  addCheck(
    "operator_pubkey_lock_present",
    operatorPubkeyExists && operatorPubkeyHashExists,
    report.operator_keyring_lock,
    "operator public key lock is missing C:\\speaker\\LOCKS\\operator_pubkey.asc and/or .sha256"
  );

  const processEnvBlocksRemotePush = process.env.PROCESS_ENV_BLOCK_REMOTE_PUSH === "true";
  report.remote_push_environment_lock = {
    process_env_block_remote_push: process.env.PROCESS_ENV_BLOCK_REMOTE_PUSH || null,
    blocked: processEnvBlocksRemotePush,
  };
  addCheck(
    "process_env_allows_remote_push",
    !processEnvBlocksRemotePush,
    report.remote_push_environment_lock,
    "remote push blocked by PROCESS_ENV_BLOCK_REMOTE_PUSH=true"
  );

  const canonicalCount = fs.existsSync(CANONICAL_DIR)
    ? fs.readdirSync(CANONICAL_DIR).filter((name) => name.toLowerCase().endsWith(".json")).length
    : 0;
  report.canonical_receipt_count = canonicalCount;
  addCheck(
    "canonical_receipts_present",
    canonicalCount > 0,
    { canonical_receipt_count: canonicalCount },
    "no canonical receipts are available to ratify"
  );

  const statusLines = gitMaybe(["status", "--short"]).split(/\r?\n/).filter(Boolean);
  report.pending_worktree_item_count = statusLines.length;
  report.pending_worktree_sample = statusLines.slice(0, 12);
  if (statusLines.length > 0) {
    report.warnings.push("C:\\speaker has untracked or modified files; promote-staged intentionally stages all files after validation.");
  }

  report.release_valve_state_path = RELEASE_VALVE_STATE_PATH;
  report.release_valve_state = fs.existsSync(RELEASE_VALVE_STATE_PATH) ? loadJsonFile(RELEASE_VALVE_STATE_PATH).json : null;
  report.last_release_valve_event = summarizeReleaseValveEvent(readLastJsonlEntry(RELEASE_VALVE_LOG_PATH));

  report.next_required_actions = [];
  if (!originUrl) {
    report.next_required_actions.push("Choose GitHub Source Truth and run: git -C C:\\speaker remote add origin <GITHUB_URL>");
  }
  if (!signingKey) {
    report.next_required_actions.push("Configure release signing key: git -C C:\\speaker config user.signingkey <BEN_YUBIKEY_KEY_ID>");
  }
  if (!(operatorPubkeyExists && operatorPubkeyHashExists)) {
    report.next_required_actions.push("Install pinned operator public key lock at C:\\speaker\\LOCKS\\operator_pubkey.asc and .sha256");
  }

  report.status = report.blockers.length === 0 ? "READY" : "BLOCKED";
  if (shouldLog) appendReleaseValveLog(report);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  return report.status === "READY" ? 0 : 1;
}

function appendOperatorSignatureToReceipt(receiptRecord, capsule, signatureInfo, branchName, startedAt) {
  const receipt = receiptRecord.receipt;
  const ratification = {
    capsule_id: capsule.capsule_id,
    operator_signature: signatureInfo.signature,
    operator_signature_sha256: signatureInfo.signature_sha256,
    signature_validation: signatureInfo.validation,
    ratified_at: startedAt,
    release_branch: branchName,
    release_valve: "speakerctl promote-staged",
  };

  const existing = Array.isArray(receipt.operator_signatures) ? receipt.operator_signatures : [];
  const filtered = existing.filter((item) => item && item.capsule_id !== capsule.capsule_id);
  const nextReceipt = {
    ...receipt,
    operator_signatures: [...filtered, ratification],
    latest_operator_signature_sha256: signatureInfo.signature_sha256,
    latest_ratified_capsule_id: capsule.capsule_id,
  };

  writeJsonFile(receiptRecord.path, nextReceipt);
  return {
    path: receiptRecord.path,
    sha256: sha256File(receiptRecord.path),
    receipt: nextReceipt,
  };
}

function assertRemotePushSafetyLock() {
  if (process.env.PROCESS_ENV_BLOCK_REMOTE_PUSH === "true" || !fs.existsSync(OPERATOR_PUBKEY_ASC_PATH)) {
    const message = "CRITICAL_ABORT: 403 DEGRADED_STATE_RELEASE_BLOCKED. Missing physical signature token.";
    console.error(message);
    const error = new Error(message);
    error.code = "403_DEGRADED_STATE_RELEASE_BLOCKED";
    throw error;
  }
}

function promoteStaged(capsulePath, options = {}) {
  if (!capsulePath) throw new Error("promote-staged requires action_capsule.json");

  const startedAt = new Date().toISOString();
  const planOnly = Boolean(options.planOnly);
  const absoluteCapsulePath = path.resolve(capsulePath);
  const report = {
    event: "SPEAKER_PROMOTE_STAGED",
    status: "UNKNOWN",
    started_at: startedAt,
    plan_only: planOnly,
    capsule_path: absoluteCapsulePath,
    speaker_root: SPEAKER_ROOT,
    planned_commands: [],
    blockers: [],
    mutations_performed: [],
  };

  let capsule;
  let receiptRecord;
  let signatureInfo;
  let branchName;
  let originUrl;

  try {
    capsule = loadJsonFile(absoluteCapsulePath).json;
    const capsuleId = requirePromoteCapsuleField(capsule, "capsule_id");
    const targetReceiptId = requirePromoteCapsuleField(capsule, "target_receipt_id");
    if (capsule.action && String(capsule.action) !== "PROMOTE_STAGED") {
      throw new Error("capsule.action must be PROMOTE_STAGED when provided");
    }

    const stamp = timestampForBranch(new Date(startedAt));
    branchName = `feature/ratified-capsule-${stamp}-${sanitizeBranchSegment(capsuleId)}`;
    report.capsule_id = capsuleId;
    report.target_receipt_id = targetReceiptId;
    report.branch_name = branchName;
    report.planned_commands = [
      `git checkout -b ${branchName}`,
      "git add .",
      `git commit -S -m "Ratified capsule: ${capsuleId}"`,
      "git push origin HEAD",
    ];

    signatureInfo = hasValidOperatorSignature(capsule);
    if (!signatureInfo.ok) {
      throw new Error("operator_signature must be non-empty and paired with signature_validation.status VALID, receipt_id, and validator");
    }

    receiptRecord = resolveCanonicalReceiptForCapsule(capsule);
    originUrl = remoteOriginUrl();

    report.signature_sha256 = signatureInfo.signature_sha256;
    report.signature_validation = {
      has_armored_signature: signatureInfo.has_armored_signature,
      has_explicit_validation_receipt: signatureInfo.has_explicit_validation_receipt,
      status: signatureInfo.validation.status || null,
      receipt_id: signatureInfo.validation.receipt_id || null,
      validator: signatureInfo.validation.validator || null,
    };
    report.canonical_receipt_path = receiptRecord.path;
    report.origin_configured = Boolean(originUrl);

    if (gitHasBranch(branchName)) {
      throw new Error(`release branch already exists: ${branchName}`);
    }
    if (!originUrl) {
      throw new Error("git remote origin is not configured for C:\\speaker");
    }

    report.origin_url = originUrl.replace(/(https?:\/\/)([^/@]+@)/, "$1");

    if (planOnly) {
      report.status = "PLAN_READY";
      report.would_mutate = [
        "append operator signature to canonical receipt",
        "create tracking branch",
        "git add .",
        "git commit -S",
        "git push origin HEAD",
        "write release valve state",
      ];
      appendReleaseValveLog(report);
      process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
      return 0;
    }

    const ratifiedReceipt = appendOperatorSignatureToReceipt(receiptRecord, capsule, signatureInfo, branchName, startedAt);
    report.mutations_performed.push({
      mutation: "APPENDED_OPERATOR_SIGNATURE_TO_CANONICAL_RECEIPT",
      path: ratifiedReceipt.path,
      sha256: ratifiedReceipt.sha256,
    });

    speakerGit(["checkout", "-b", branchName]);
    report.mutations_performed.push({ mutation: "GIT_BRANCH_CREATED", branch_name: branchName });
    speakerGit(["add", "."]);
    report.mutations_performed.push({ mutation: "GIT_ADD_ALL", repo: SPEAKER_ROOT });
    speakerGit(["commit", "-S", "-m", `Ratified capsule: ${capsuleId}`]);
    report.mutations_performed.push({ mutation: "GIT_SIGNED_COMMIT_CREATED", message: `Ratified capsule: ${capsuleId}` });
    assertRemotePushSafetyLock();
    report.mutations_performed.push({ mutation: "DEGRADED_SOVEREIGNTY_PUSH_LOCK_PASSED", operator_pubkey: OPERATOR_PUBKEY_ASC_PATH });
    speakerGit(["push", "origin", "HEAD"]);
    report.mutations_performed.push({ mutation: "GIT_PUSHED", remote: "origin", ref: "HEAD" });

    report.status = "PROMOTED";
    report.release_valve_state = {
      slot_status: "CLEARED",
      advanced_next_capsule: true,
      capsule_id: capsuleId,
      target_receipt_id: targetReceiptId,
      branch_name: branchName,
      updated_at: new Date().toISOString(),
    };
    writeJsonFile(RELEASE_VALVE_STATE_PATH, report.release_valve_state);
    appendReleaseValveLog(report);
    appendLog(report);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return 0;
  } catch (error) {
    report.status = "BLOCKER";
    report.blockers.push(error.message);
    if (capsule && capsule.capsule_id) report.capsule_id = capsule.capsule_id;
    if (capsule && capsule.target_receipt_id) report.target_receipt_id = capsule.target_receipt_id;
    if (branchName) report.branch_name = branchName;
    if (originUrl !== undefined) report.origin_configured = Boolean(originUrl);
    appendReleaseValveLog(report);
    appendLog(report);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return 1;
  }
}

function main() {
  const [command, arg, arg2] = process.argv.slice(2);
  if (!command || command === "--help" || command === "-h") usage(0);

  try {
    if (command === "ingest") {
      const exitCode = ingest(arg);
      process.exit(exitCode);
    }
    if (command === "ingest-inbox") {
      const exitCode = ingestInbox(arg);
      process.exit(exitCode);
    }
    if (command === "render-bootpack") {
      const exitCode = renderBootpack(arg);
      process.exit(exitCode);
    }
    if (command === "queue-apoptosis") {
      const exitCode = queueApoptosis(arg);
      process.exit(exitCode);
    }
    if (command === "export-apoptosis") {
      const exitCode = exportApoptosis(arg);
      process.exit(exitCode);
    }
    if (command === "apply-apoptosis") {
      const exitCode = applyApoptosis(arg, arg2);
      process.exit(exitCode);
    }
    if (command === "promote-staged") {
      const exitCode = promoteStaged(arg, { planOnly: process.argv.includes("--plan") });
      process.exit(exitCode);
    }
    if (command === "verify-release-readiness") {
      const exitCode = verifyReleaseReadiness({ log: !process.argv.includes("--no-log") });
      process.exit(exitCode);
    }
    if (command === "verify-integrity") {
      const exitCode = verifyIntegrity({ strict: process.argv.includes("--strict") });
      process.exit(exitCode);
    }
    if (command === "verify-bootpack-headers") {
      const exitCode = verifyBootpackHeaders();
      process.exit(exitCode);
    }
    if (command === "verify-current-repo-state") {
      const exitCode = verifyCurrentRepoState();
      process.exit(exitCode);
    }
  } catch (error) {
    const entry = {
      event: "SPEAKERCTL_BLOCKER",
      status: "BLOCKER",
      command,
      error: error.message,
      started_at: new Date().toISOString(),
    };
    appendLog(entry);
    process.stdout.write(`${JSON.stringify(entry, null, 2)}\n`);
    process.exit(5);
  }

  process.stderr.write(`Unknown command: ${command}\n`);
  usage(2);
}

main();
