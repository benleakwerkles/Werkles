#!/usr/bin/env node

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn, spawnSync } = require("node:child_process");

const SPEAKER_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(SPEAKER_ROOT, "..");
const TINKARDEN_ROOT = path.join(REPO_ROOT, "tinkarden");
const SCHEMA_PATH = path.join(SPEAKER_ROOT, "schemas", "receipt.schema.json");
const APOPTOSIS_PATCH_SCHEMA_PATH = path.join(SPEAKER_ROOT, "schemas", "apoptosis_patch.schema.json");
const CANONICAL_DIR = path.join(SPEAKER_ROOT, "receipts", "canonical");
const QUARANTINE_DIR = path.join(SPEAKER_ROOT, "receipts", "quarantine");
const RAW_RECEIPT_INBOX_DIR = path.join(SPEAKER_ROOT, "receipts", "raw", "inbox");
const STAGED_REPORT_DIR = path.join(SPEAKER_ROOT, "receipts", "staged");
const LOG_PATH = path.join(SPEAKER_ROOT, "logs", "ingest.jsonl");
const VALIDATION_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "validation.jsonl");
const SECURITY_AUDIT_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "security_audit.jsonl");
const DASHBOARD_STATUS_PATH = path.join(SPEAKER_ROOT, "logs", "dashboard_status.json");
const INTERFACE_NOTIFY_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "interface-notify.jsonl");
const SPEAKER_DB_PATH = path.resolve(process.env.SPEAKER_DB_PATH || path.join(SPEAKER_ROOT, "speaker.sqlite"));
const OPERATOR_PUBKEY_KEYRING = path.join(SPEAKER_ROOT, "LOCKS", "operator_pubkey.gpg");
const ATLAS_SOURCE_TRUTH_PATH = path.join(SPEAKER_ROOT, "bin", "atlas-source-truth.js");
const CLIP_HARVESTER_PATH = path.join(SPEAKER_ROOT, "bin", "clip-harvester.js");
const DEFAULT_INTERFACE_NOTIFY_URL = "http://127.0.0.1:3339/v1/interface/notify_harvest";
const BOOTPACK_OUT_DIR = path.join(SPEAKER_ROOT, "bootpacks", "out");
const BOOTLOADER_INCOMING_DIR = path.join(SPEAKER_ROOT, "bootloader", "incoming");
const RAW_PAYLOAD_PATH = path.join(BOOTLOADER_INCOMING_DIR, "RAW_PAYLOAD.txt");
const APPLY_PAYLOAD_ROOTS = [
  SPEAKER_ROOT,
  TINKARDEN_ROOT,
  "C:\\speaker",
  "C:\\tinkarden"
].map((root) => path.resolve(root));
const PROFILE_DIR = path.join(SPEAKER_ROOT, "bootloader", "profiles");
const DOCTRINE_ROOT = path.join(SPEAKER_ROOT, "doctrine");
const ACTIVE_DOCTRINE_DIR = path.join(DOCTRINE_ROOT, "active");
const DOCTRINE_GRAVEYARD_DIR = path.join(DOCTRINE_ROOT, "graveyard");
const DOCTRINE_DEPRECATED_DIR = path.join(DOCTRINE_ROOT, "deprecated");
const SPEAKER_VALIDATE_PATH = path.join(SPEAKER_ROOT, "bin", "speaker-validate.sh");
const PATCHES_DIR = path.join(SPEAKER_ROOT, "patches");
const APOPTOSIS_QUEUE_DIR = path.join(SPEAKER_ROOT, "apoptosis", "queue");
const DEFAULT_APOPTOSIS_REVIEW_DAYS = 30;
const DEFAULT_BOOTPACK_STREAM = "DEFAULT";
const MAX_COMPTROLLER_REPORTS = 3;
const MAX_COMPTROLLER_REPORT_BYTES = 50 * 1024;
const COMPTROLLER_REPORT_NAME_PATTERN = /^(BEAN|THUFIR|PETRA|ENDER)[A-Za-z0-9_.@-]*\.(md|json)$/i;

const APOPTOSIS_SELECTION_QUERIES = Object.freeze({
  duplicateDoctrineIds: `
    WITH doctrine_records AS (
      SELECT
        doctrine_id,
        path,
        title,
        status,
        updated_at,
        CASE
          WHEN instr(path, '/') > 0 THEN substr(path, 1, instr(path, '/') - 1)
          ELSE 'root'
        END AS environment
      FROM doctrine_index
      WHERE doctrine_id IS NOT NULL AND doctrine_id <> ''
    )
    SELECT
      doctrine_id,
      COUNT(*) AS record_count,
      COUNT(DISTINCT environment) AS environment_count,
      group_concat(environment || ':' || path, ' | ') AS locations,
      MIN(updated_at) AS oldest_updated_at,
      MAX(updated_at) AS newest_updated_at
    FROM doctrine_records
    GROUP BY doctrine_id
    HAVING COUNT(*) > 1 OR COUNT(DISTINCT environment) > 1
    ORDER BY newest_updated_at ASC, doctrine_id ASC
  `,
  supersededActiveDoctrine: `
    SELECT
      d.doctrine_id,
      d.path,
      d.title,
      d.status,
      d.updated_at,
      e.edge_id,
      e.to_doctrine_id,
      e.relation,
      e.created_at AS edge_created_at
    FROM doctrine_index d
    INNER JOIN doctrine_edges e
      ON e.from_doctrine_id = d.doctrine_id
    WHERE UPPER(d.status) = 'ACTIVE'
      AND LOWER(e.relation) = 'superseded'
    ORDER BY e.created_at ASC, d.doctrine_id ASC
  `,
  staleActiveDoctrine: `
    SELECT
      doctrine_id,
      path,
      title,
      status,
      updated_at
    FROM doctrine_index
    WHERE UPPER(status) = 'ACTIVE'
      AND datetime(updated_at) < datetime(@cutoff)
    ORDER BY datetime(updated_at) ASC, doctrine_id ASC
  `
});

function stamp() {
  return new Date().toISOString();
}

function slash(value) {
  return value.split(path.sep).join("/");
}

function rel(value) {
  return slash(path.relative(SPEAKER_ROOT, value));
}

function ensureDirs() {
  fs.mkdirSync(path.dirname(SCHEMA_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(APOPTOSIS_PATCH_SCHEMA_PATH), { recursive: true });
  fs.mkdirSync(CANONICAL_DIR, { recursive: true });
  fs.mkdirSync(QUARANTINE_DIR, { recursive: true });
  fs.mkdirSync(RAW_RECEIPT_INBOX_DIR, { recursive: true });
  fs.mkdirSync(STAGED_REPORT_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(VALIDATION_LOG_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(SECURITY_AUDIT_LOG_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(DASHBOARD_STATUS_PATH), { recursive: true });
  fs.mkdirSync(path.dirname(INTERFACE_NOTIFY_LOG_PATH), { recursive: true });
  fs.mkdirSync(BOOTPACK_OUT_DIR, { recursive: true });
  fs.mkdirSync(BOOTLOADER_INCOMING_DIR, { recursive: true });
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  fs.mkdirSync(ACTIVE_DOCTRINE_DIR, { recursive: true });
  fs.mkdirSync(DOCTRINE_GRAVEYARD_DIR, { recursive: true });
  fs.mkdirSync(DOCTRINE_DEPRECATED_DIR, { recursive: true });
  fs.mkdirSync(PATCHES_DIR, { recursive: true });
  fs.mkdirSync(APOPTOSIS_QUEUE_DIR, { recursive: true });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function sanitize(value, fallback) {
  const text = typeof value === "string" && value.trim() ? value.trim() : fallback;
  return text.replace(/[^A-Za-z0-9_.-]+/g, "_").slice(0, 120);
}

function uniquePath(directory, filename) {
  const parsed = path.parse(filename);
  let candidate = path.join(directory, filename);
  let index = 2;
  while (fs.existsSync(candidate)) {
    candidate = path.join(directory, `${parsed.name}.${index}${parsed.ext}`);
    index += 1;
  }
  return candidate;
}

function moveFile(source, destination, context = {}) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.renameSync(source, destination);
  schedulePostMutationAudit({
    trigger: "fs.renameSync:moveFile",
    source_path: source,
    destination_path: destination,
    proposed_mutations: context.proposed_mutations || [source, destination],
    ...context
  });
}

function appendLog(entry) {
  fs.appendFileSync(LOG_PATH, `${JSON.stringify(entry)}\n`, "utf8");
}

function appendValidationLog(entry) {
  fs.appendFileSync(VALIDATION_LOG_PATH, `${JSON.stringify(entry)}\n`, "utf8");
}

function appendSecurityAuditLog(entry) {
  fs.mkdirSync(path.dirname(SECURITY_AUDIT_LOG_PATH), { recursive: true });
  fs.appendFileSync(SECURITY_AUDIT_LOG_PATH, `${JSON.stringify({
    event: "post_mutation_workspace_audit",
    timestamp: stamp(),
    ...entry
  })}\n`, "utf8");
}

function writeDashboardStatus(status, details = {}) {
  fs.mkdirSync(path.dirname(DASHBOARD_STATUS_PATH), { recursive: true });
  fs.writeFileSync(DASHBOARD_STATUS_PATH, `${JSON.stringify({
    STATUS: status,
    timestamp: stamp(),
    ...details
  }, null, 2)}\n`, "utf8");
}

function normalizeMutationPath(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  let text = value.trim().replace(/^["']|["']$/g, "");
  text = text.replace(/^(?:modified:|deleted:|new file:|renamed:)\s*/i, "");
  text = text.replace(/^[MADRCU?! ]{1,3}\s+/, "");
  if (text.includes(" -> ")) {
    text = text.split(" -> ").pop();
  }
  const absolute = path.isAbsolute(text) ? path.resolve(text) : null;
  if (absolute) {
    const repoRelative = path.relative(REPO_ROOT, absolute);
    if (!repoRelative.startsWith("..") && !path.isAbsolute(repoRelative)) return slash(repoRelative);
    const speakerRelative = path.relative(SPEAKER_ROOT, absolute);
    if (!speakerRelative.startsWith("..") && !path.isAbsolute(speakerRelative)) return slash(path.join("speaker", speakerRelative));
  }
  return slash(text).replace(/^\.\//, "");
}

function proposedMutationSet(metadata = {}, fallback = []) {
  const source =
    metadata.PROPOSED_MUTATIONS ||
    metadata.proposed_mutations ||
    metadata.proposedMutations ||
    metadata.target_mutations ||
    metadata.targetMutations ||
    metadata.mutations ||
    fallback;
  const values = Array.isArray(source)
    ? source
    : typeof source === "string"
      ? source.split(/[,\r\n]+/)
      : fallback;
  const normalized = new Set();

  for (const value of values) {
    const mutation = normalizeMutationPath(String(value || ""));
    if (!mutation) continue;
    normalized.add(mutation);
    if (!mutation.startsWith("speaker/")) normalized.add(slash(path.join("speaker", mutation)));
    if (mutation.startsWith("speaker/")) normalized.add(mutation.slice("speaker/".length));
  }

  return normalized;
}

function isAllowedMutation(mutation, allowed) {
  const normalized = normalizeMutationPath(mutation);
  if (!normalized) return true;
  if (allowed.has(normalized)) return true;
  if (normalized.startsWith("speaker/") && allowed.has(normalized.slice("speaker/".length))) return true;
  return Array.from(allowed).some((candidate) => candidate && normalized.endsWith(`/${candidate}`));
}

function collectAtlasPaths(value, output = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectAtlasPaths(item, output));
    return output;
  }
  if (!value || typeof value !== "object") return output;
  for (const key of ["path", "file", "file_path", "filepath", "relative_path", "worktree_path"]) {
    if (typeof value[key] === "string") output.push(value[key]);
  }
  for (const child of Object.values(value)) collectAtlasPaths(child, output);
  return output;
}

function atlasMutationPaths(stdout, stderr) {
  const raw = `${stdout || ""}\n${stderr || ""}`.trim();
  if (!raw) return [];
  try {
    return Array.from(new Set(collectAtlasPaths(JSON.parse(raw)).map(normalizeMutationPath).filter(Boolean)));
  } catch {
    return Array.from(new Set(raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^(?:[MADRCU?!]{1,2}|\?\?|modified:|deleted:|new file:|renamed:)\s+/i.test(line))
      .map(normalizeMutationPath)
      .filter(Boolean)));
  }
}

function sweepDanglingArtifacts(root = SPEAKER_ROOT) {
  const deleted = [];
  for (const filePath of walkFiles(root, (candidate) => /\.(tmp|bak)$/i.test(candidate))) {
    try {
      const stat = fs.statSync(filePath);
      if (Date.now() - stat.mtimeMs < 10000) continue;
      fs.rmSync(filePath, { force: true });
      deleted.push(sourceLabel(filePath));
    } catch (error) {
      appendSecurityAuditLog({
        status: "DANGLING_ARTIFACT_DELETE_FAILED",
        artifact_path: sourceLabel(filePath),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return deleted;
}

function schedulePostMutationAudit(context = {}) {
  const allowed = proposedMutationSet(context, context.proposed_mutations || [context.source_path, context.destination_path]);
  const auditContext = {
    trigger: context.trigger || "fs.renameSync",
    source_path: context.source_path ? sourceLabel(path.resolve(context.source_path)) : null,
    destination_path: context.destination_path ? sourceLabel(path.resolve(context.destination_path)) : null,
    proposed_mutations: Array.from(allowed)
  };

  setImmediate(() => {
    const deleted_dangling_artifacts = sweepDanglingArtifacts(SPEAKER_ROOT);

    if (!fs.existsSync(ATLAS_SOURCE_TRUTH_PATH)) {
      appendSecurityAuditLog({
        status: "ATLAS_SOURCE_TRUTH_MISSING",
        atlas_script_path: sourceLabel(ATLAS_SOURCE_TRUTH_PATH),
        deleted_dangling_artifacts,
        ...auditContext
      });
      return;
    }

    const child = spawn(process.execPath, [ATLAS_SOURCE_TRUTH_PATH], {
      cwd: REPO_ROOT,
      shell: false,
      windowsHide: true,
      timeout: 120000
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      appendSecurityAuditLog({
        status: "ATLAS_SOURCE_TRUTH_FAILED",
        atlas_script_path: sourceLabel(ATLAS_SOURCE_TRUTH_PATH),
        error: error instanceof Error ? error.message : String(error),
        deleted_dangling_artifacts,
        ...auditContext
      });
    });
    child.on("close", (exitCode) => {
      const mutations = atlasMutationPaths(stdout, stderr);
      const unauthorized = mutations.filter((mutation) => !isAllowedMutation(mutation, allowed));
      const status = unauthorized.length > 0 ? "UNAUTHORIZED_WORKSPACE_MUTATION" : "PASS";
      const entry = {
        status,
        atlas_script_path: sourceLabel(ATLAS_SOURCE_TRUTH_PATH),
        atlas_exit_code: exitCode,
        atlas_mutations: mutations,
        unauthorized_mutations: unauthorized,
        stdout,
        stderr,
        deleted_dangling_artifacts,
        ...auditContext
      };

      appendSecurityAuditLog(entry);
      if (unauthorized.length > 0) {
        writeDashboardStatus("UNAUTHORIZED_WORKSPACE_MUTATION", {
          source: "post_mutation_workspace_audit",
          unauthorized_mutations: unauthorized,
          audit_log_path: sourceLabel(SECURITY_AUDIT_LOG_PATH)
        });
      }
    });
  });
}

function safeExistingFilePath(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label}_PATH_REQUIRED`);
  }
  if (value.includes("\0")) {
    throw new Error(`${label}_PATH_CONTAINS_NULL_BYTE`);
  }

  const absolutePath = path.resolve(value);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`${label}_PATH_NOT_FOUND: ${absolutePath}`);
  }
  if (!fs.statSync(absolutePath).isFile()) {
    throw new Error(`${label}_PATH_NOT_FILE: ${absolutePath}`);
  }
  return absolutePath;
}

function logCriticalSovereigntyViolation(details) {
  const entry = {
    event: "403 CRITICAL_SOVEREIGNTY_VIOLATION",
    status: "CRITICAL_SOVEREIGNTY_VIOLATION",
    timestamp: stamp(),
    ...details
  };
  appendValidationLog(entry);
  return entry;
}

function verifySignature(payloadPath, signaturePath) {
  ensureDirs();
  let safePayloadPath;
  let safeSignaturePath;
  let safeKeyringPath;
  try {
    safePayloadPath = safeExistingFilePath(payloadPath, "PAYLOAD");
    safeSignaturePath = safeExistingFilePath(signaturePath, "SIGNATURE");
    safeKeyringPath = safeExistingFilePath(OPERATOR_PUBKEY_KEYRING, "OPERATOR_PUBKEY_KEYRING");
  } catch (error) {
    const violation = logCriticalSovereigntyViolation({
      command: "gpg --no-default-keyring --keyring [operator_pubkey.gpg] --verify [signaturePath] [payloadPath]",
      exit_code: null,
      payload_path: String(payloadPath || ""),
      signature_path: String(signaturePath || ""),
      keyring_path: sourceLabel(OPERATOR_PUBKEY_KEYRING),
      stdout: "",
      stderr: "",
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error(`CRITICAL_SOVEREIGNTY_VIOLATION: GPG signature verification failed before execution; logged ${violation.event}`);
  }
  const gpgProgram = process.env.GPG_PROGRAM || "gpg";
  const args = [
    "--no-default-keyring",
    "--keyring",
    safeKeyringPath,
    "--verify",
    safeSignaturePath,
    safePayloadPath
  ];

  const result = spawnSync(gpgProgram, args, {
    cwd: SPEAKER_ROOT,
    encoding: "utf8",
    shell: false,
    windowsHide: true
  });

  const exitCode = typeof result.status === "number" ? result.status : 1;
  const stderr = result.stderr || "";
  const stdout = result.stdout || "";
  const command = [gpgProgram, ...args].join(" ");

  if (exitCode === 0 && stderr.includes("Good signature from")) {
    return true;
  }

  const violation = logCriticalSovereigntyViolation({
    command,
    exit_code: exitCode,
    payload_path: sourceLabel(safePayloadPath),
    signature_path: sourceLabel(safeSignaturePath),
    keyring_path: sourceLabel(safeKeyringPath),
    stdout,
    stderr,
    error: result.error ? result.error.message : null
  });

  throw new Error(`CRITICAL_SOVEREIGNTY_VIOLATION: GPG signature verification failed; logged ${violation.event}`);
}

function loadDatabaseDriver() {
  const localDriver = path.join(SPEAKER_ROOT, "..", "tinkarden", "server", "node_modules", "better-sqlite3");
  try {
    return require(localDriver);
  } catch {
    return require("better-sqlite3");
  }
}

function openSpeakerDb(options = {}) {
  const Database = loadDatabaseDriver();
  return new Database(SPEAKER_DB_PATH, options);
}

function ensureSpeakerIndex(db) {
  db.pragma("journal_mode = DELETE");
  db.exec(`
    CREATE TABLE IF NOT EXISTS topology_locks (
      lock_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 100,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS boundary_rules (
      rule_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 100,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS artifact_receipts (
      receipt_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      evidence_path TEXT NOT NULL,
      sha256 TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS doctrine_index (
      doctrine_id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      title TEXT,
      status TEXT NOT NULL,
      source_receipt_id TEXT,
      hash TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS doctrine_edges (
      edge_id TEXT PRIMARY KEY,
      from_doctrine_id TEXT NOT NULL,
      to_doctrine_id TEXT NOT NULL,
      relation TEXT NOT NULL,
      source_receipt_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_doctrine_edges_from_relation
      ON doctrine_edges (from_doctrine_id, relation);

    CREATE TABLE IF NOT EXISTS apoptosis_queue (
      queue_entry_id TEXT PRIMARY KEY,
      queue_id TEXT NOT NULL,
      doctrine_id TEXT NOT NULL,
      selector TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued',
      candidate_json TEXT NOT NULL,
      queue_path TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_apoptosis_queue_status
      ON apoptosis_queue (status, queue_id);

    CREATE TABLE IF NOT EXISTS graveyard_ledger (
      ledger_id TEXT PRIMARY KEY,
      doctrine_id TEXT NOT NULL,
      source_path TEXT NOT NULL,
      destination_path TEXT NOT NULL,
      outcome TEXT NOT NULL,
      reason TEXT NOT NULL,
      operator_approval_receipt_id TEXT NOT NULL,
      patch_path TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

function typeOf(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function validateValue(value, schema, pointer = "$") {
  const errors = [];

  if (schema.type && typeOf(value) !== schema.type) {
    errors.push(`${pointer}: expected ${schema.type}, got ${typeOf(value)}`);
    return errors;
  }

  if (schema.type === "object") {
    for (const key of schema.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(`${pointer}.${key}: required field missing`);
      }
    }

    if (typeof schema.minProperties === "number" && Object.keys(value).length < schema.minProperties) {
      errors.push(`${pointer}: expected at least ${schema.minProperties} properties`);
    }

    for (const [key, childSchema] of Object.entries(schema.properties || {})) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(...validateValue(value[key], childSchema, `${pointer}.${key}`));
      }
    }

    if (Array.isArray(schema.anyOf)) {
      const anyPasses = schema.anyOf.some((candidate) => validateValue(value, candidate, pointer).length === 0);
      if (!anyPasses) {
        errors.push(`${pointer}: failed anyOf requirement`);
      }
    }
  }

  if (schema.type === "array") {
    if (typeof schema.minItems === "number" && value.length < schema.minItems) {
      errors.push(`${pointer}: expected at least ${schema.minItems} items`);
    }

    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateValue(item, schema.items, `${pointer}[${index}]`));
      });
    }
  }

  if (schema.type === "string") {
    if (typeof schema.minLength === "number" && value.length < schema.minLength) {
      errors.push(`${pointer}: shorter than minLength ${schema.minLength}`);
    }

    if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
      errors.push(`${pointer}: value "${value}" is not one of ${schema.enum.join(", ")}`);
    }

    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${pointer}: does not match pattern ${schema.pattern}`);
    }

    if (schema.format === "date-time" && Number.isNaN(Date.parse(value))) {
      errors.push(`${pointer}: invalid date-time`);
    }
  }

  return errors;
}

function validateReceipt(receipt, schema) {
  const errors = validateValue(receipt, schema);
  const bannedStatusWords = new Set(["fixed", "done", "handled", "sent", "posted", "working", "live"]);
  const status = typeof receipt.status === "string" ? receipt.status.trim().toLowerCase() : "";

  if (bannedStatusWords.has(status)) {
    errors.push(`$.status: vague completion word "${receipt.status}" is not canonical evidence`);
  }

  return errors;
}

class ApoptosisValidationError extends Error {
  constructor(code, errors) {
    const details = Array.isArray(errors) ? errors : [String(errors)];
    super(`${code}: ${details.join("; ")}`);
    this.name = "ApoptosisValidationError";
    this.code = code;
    this.errors = details;
    this.exitCode = 1;
  }
}

function failApoptosisValidation(code, errors) {
  throw new ApoptosisValidationError(code, errors);
}

function canonicalDestination(receipt, hash) {
  const receiptId = sanitize(receipt.receipt_id, "receipt_unknown");
  return path.join(CANONICAL_DIR, `${receiptId}.${hash}.json`);
}

function quarantineDestination(sourcePath, hash, receipt) {
  const fallback = path.basename(sourcePath, path.extname(sourcePath));
  const receiptId = sanitize(receipt?.receipt_id, fallback);
  return uniquePath(QUARANTINE_DIR, `${receiptId}.${hash}.json`);
}

function printResult(result) {
  console.log(JSON.stringify(result, null, 2));
}

function readPayloadSource(sourcePath) {
  if (sourcePath) {
    return fs.readFileSync(path.resolve(sourcePath), "utf8");
  }
  return fs.readFileSync(0, "utf8");
}

function extractPrimaryFencePayload(raw) {
  const match = raw.match(/```[^\r\n]*(?:\r?\n)([\s\S]*?)```/);
  if (!match) {
    throw new Error("EXTRACT_PAYLOAD_FENCE_NOT_FOUND");
  }
  return match[1];
}

function extractPayload({ source } = {}) {
  ensureDirs();
  const raw = readPayloadSource(source);
  const payload = extractPrimaryFencePayload(raw);
  fs.writeFileSync(RAW_PAYLOAD_PATH, payload, "utf8");
  const result = {
    ok: true,
    status: "RAW_PAYLOAD_EXTRACTED",
    source_path: source ? sourceLabel(path.resolve(source)) : "stdin",
    output_path: sourceLabel(RAW_PAYLOAD_PATH),
    bytes_written: Buffer.byteLength(payload, "utf8"),
    sha256: sha256(payload)
  };
  printResult(result);
  return result;
}

function isInsideRoot(resolvedPath, rootPath) {
  const root = path.resolve(rootPath);
  return resolvedPath === root || resolvedPath.startsWith(`${root}${path.sep}`);
}

function resolveApplyPayloadDestination(targetDestination) {
  if (typeof targetDestination !== "string" || !targetDestination.trim()) {
    throw new Error("APPLY_PAYLOAD_TARGET_REQUIRED");
  }

  const resolvedPath = path.resolve(targetDestination);
  if (!APPLY_PAYLOAD_ROOTS.some((root) => isInsideRoot(resolvedPath, root))) {
    console.error("CRITICAL_PATH_VIOLATION: Attempted write outside sandbox boundaries.");
    process.exit(1);
  }
  return resolvedPath;
}

function applyPayload({ targetDestination } = {}) {
  ensureDirs();
  const resolvedPath = resolveApplyPayloadDestination(targetDestination);
  if (!fs.existsSync(RAW_PAYLOAD_PATH)) {
    throw new Error(`RAW_PAYLOAD_NOT_FOUND: ${sourceLabel(RAW_PAYLOAD_PATH)}`);
  }

  const payload = fs.readFileSync(RAW_PAYLOAD_PATH);
  const destinationDir = path.dirname(resolvedPath);
  const destinationName = path.basename(resolvedPath);
  const nonce = `${Date.now()}_${process.pid}`;
  const tempPath = path.join(destinationDir, `.${destinationName}.${nonce}.tmp`);
  const backupPath = fs.existsSync(resolvedPath)
    ? uniquePath(destinationDir, `${destinationName}.${nonce}.backup`)
    : null;

  fs.mkdirSync(destinationDir, { recursive: true });
  fs.writeFileSync(tempPath, payload);

  try {
    if (backupPath) fs.renameSync(resolvedPath, backupPath);
    fs.renameSync(tempPath, resolvedPath);
  } catch (error) {
    if (backupPath && fs.existsSync(backupPath) && !fs.existsSync(resolvedPath)) {
      fs.renameSync(backupPath, resolvedPath);
    }
    throw error;
  }

  schedulePostMutationAudit({
    trigger: "fs.renameSync:apply_payload",
    source_path: RAW_PAYLOAD_PATH,
    destination_path: resolvedPath,
    proposed_mutations: [RAW_PAYLOAD_PATH, resolvedPath, backupPath].filter(Boolean)
  });

  const result = {
    ok: true,
    status: "RAW_PAYLOAD_APPLIED",
    source_path: sourceLabel(RAW_PAYLOAD_PATH),
    destination_path: sourceLabel(resolvedPath),
    backup_path: backupPath ? sourceLabel(backupPath) : null,
    bytes_written: payload.length,
    sha256: sha256(payload)
  };
  printResult(result);
  return result;
}

function ingest(receiptPath) {
  ensureDirs();

  const absoluteReceiptPath = path.resolve(receiptPath);
  const schema = readJson(SCHEMA_PATH);
  let raw = "";
  let receipt = null;
  const errors = [];

  try {
    raw = fs.readFileSync(absoluteReceiptPath, "utf8");
  } catch (error) {
    throw new Error(`READ_FAILED: ${error instanceof Error ? error.message : String(error)}`);
  }

  const hash = sha256(raw);

  try {
    receipt = JSON.parse(raw);
  } catch (error) {
    errors.push(`$: invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (receipt) {
    errors.push(...validateReceipt(receipt, schema));
  }

  if (errors.length === 0) {
    const destinationPath = canonicalDestination(receipt, hash);
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(absoluteReceiptPath, destinationPath);

    const logEntry = {
      event: "speaker_receipt_ingested",
      status: "CANONICAL",
      timestamp: stamp(),
      receipt_id: receipt.receipt_id,
      sha256: hash,
      source_path: absoluteReceiptPath,
      destination_path: destinationPath,
      schema_path: SCHEMA_PATH
    };
    appendLog(logEntry);

    const result = {
      ok: true,
      status: "CANONICAL",
      receipt_id: receipt.receipt_id,
      sha256: hash,
      canonical_path: rel(destinationPath),
      log_path: rel(LOG_PATH)
    };
    printResult(result);
    return result;
  }

  const destinationPath = quarantineDestination(absoluteReceiptPath, hash, receipt);
  moveFile(absoluteReceiptPath, destinationPath, {
    trigger: "fs.renameSync:receipt_quarantine",
    proposed_mutations: [absoluteReceiptPath, destinationPath],
    receipt_id: receipt?.receipt_id || null
  });

  const logEntry = {
    event: "speaker_receipt_quarantined",
    status: "QUARANTINED",
    timestamp: stamp(),
    receipt_id: receipt?.receipt_id || null,
    sha256: hash,
    source_path: absoluteReceiptPath,
    destination_path: destinationPath,
    schema_path: SCHEMA_PATH,
    errors
  };
  appendLog(logEntry);

  const result = {
    ok: false,
    status: "QUARANTINED",
    receipt_id: receipt?.receipt_id || null,
    sha256: hash,
    quarantine_path: rel(destinationPath),
    errors,
    log_path: rel(LOG_PATH)
  };
  printResult(result);
  return result;
}

function profilePathFor(aeye, machine) {
  return path.join(PROFILE_DIR, `${sanitize(aeye, "Aeye")}.${sanitize(machine, "Machine")}.json`);
}

function profilePathForId(profileId) {
  if (typeof profileId !== "string" || !profileId.trim()) {
    throw new Error("BOOTPACK_PROFILE_ID_REQUIRED");
  }
  const trimmed = profileId.trim();
  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed.endsWith(".json")) {
    return path.resolve(trimmed);
  }
  return path.join(PROFILE_DIR, `${sanitize(trimmed, "Profile")}.json`);
}

function bootpackLegacyPathFor(profile) {
  const stream = sanitize(profile.stream || "BOOTPACK", "BOOTPACK");
  const suffix = stream.toUpperCase() === "BOOTPACK" ? "BOOTPACK" : `${stream}.BOOTPACK`;
  return path.join(
    BOOTPACK_OUT_DIR,
    `${sanitize(profile.aeye, "Aeye")}.${sanitize(profile.machine, "Machine")}.${suffix}.md`
  );
}

function bootpackPathFor(profile) {
  const stream = sanitize(profile.output_stream || DEFAULT_BOOTPACK_STREAM, DEFAULT_BOOTPACK_STREAM);
  return path.join(
    BOOTPACK_OUT_DIR,
    `${sanitize(profile.aeye, "Aeye")}.${sanitize(profile.machine, "Machine")}.${stream}.BOOTPACK.md`
  );
}

function bootpackOutputPathsFor(profile) {
  return Array.from(new Set([bootpackPathFor(profile), bootpackLegacyPathFor(profile)]));
}

function validateProfile(profile) {
  const errors = [];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) errors.push("profile must be an object");
  for (const field of ["aeye", "machine", "stream", "priority_order", "token_budget"]) {
    if (!Object.prototype.hasOwnProperty.call(profile || {}, field)) errors.push(`profile.${field}: required field missing`);
  }
  if (!Array.isArray(profile?.priority_order) || profile.priority_order.length === 0) {
    errors.push("profile.priority_order: must be a non-empty array");
  }
  if (!Number.isInteger(profile?.token_budget) || profile.token_budget < 200) {
    errors.push("profile.token_budget: must be an integer >= 200");
  }

  const allowedSections = new Set(["topology_locks", "boundary_rules", "recent_artifact_receipts"]);
  for (const section of profile?.priority_order || []) {
    if (!allowedSections.has(section)) errors.push(`profile.priority_order: unsupported section ${section}`);
  }

  return errors;
}

function queryTopologyLocks(db) {
  return db.prepare(`
    SELECT lock_id, title, body, status, priority, created_at
    FROM topology_locks
    WHERE status = 'ACTIVE'
    ORDER BY priority ASC, created_at DESC
  `).all();
}

function queryBoundaryRules(db) {
  return db.prepare(`
    SELECT rule_id, title, body, status, priority, created_at
    FROM boundary_rules
    WHERE status = 'ACTIVE'
    ORDER BY priority ASC, created_at DESC
  `).all();
}

function queryRecentArtifactReceipts(db, limit) {
  return db.prepare(`
    SELECT receipt_id, title, status, evidence_path, sha256, summary, created_at
    FROM artifact_receipts
    WHERE status = 'ARTIFACT'
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
}

function renderTopologyLocks(rows) {
  return [
    "## ACTIVE_TOPOLOGY_LOCKS",
    rows.length ? rows.map((row) => [
      `### ${row.lock_id}: ${row.title}`,
      `- status: ${row.status}`,
      `- priority: ${row.priority}`,
      `- created_at: ${row.created_at}`,
      row.body
    ].join("\n")).join("\n\n") : "[]"
  ].join("\n\n");
}

function renderBoundaryRules(rows) {
  return [
    "## BOUNDARY_RULES",
    rows.length ? rows.map((row) => [
      `### ${row.rule_id}: ${row.title}`,
      `- status: ${row.status}`,
      `- priority: ${row.priority}`,
      `- created_at: ${row.created_at}`,
      row.body
    ].join("\n")).join("\n\n") : "[]"
  ].join("\n\n");
}

function renderArtifactReceipts(rows) {
  return [
    "## RECENT_ARTIFACT_RECEIPTS",
    rows.length ? rows.map((row) => [
      `### ${row.receipt_id}: ${row.title}`,
      `- status: ${row.status}`,
      `- created_at: ${row.created_at}`,
      `- evidence_path: ${row.evidence_path}`,
      `- sha256: ${row.sha256}`,
      row.summary
    ].join("\n")).join("\n\n") : "[]"
  ].join("\n\n");
}

function truncateTrailingLines(text, maxChars) {
  if (text.length <= maxChars) return { text, truncated: false };
  const clipped = text.slice(0, Math.max(0, maxChars));
  const newlineIndex = clipped.lastIndexOf("\n");
  const safeText = newlineIndex > 0 ? clipped.slice(0, newlineIndex) : clipped;
  return { text: safeText, truncated: true };
}

function readReportTextWithCap(filePath) {
  const raw = fs.readFileSync(filePath);
  const capped = raw.length > MAX_COMPTROLLER_REPORT_BYTES
    ? raw.subarray(0, MAX_COMPTROLLER_REPORT_BYTES)
    : raw;
  const decoded = capped.toString("utf8");
  const truncated = raw.length > MAX_COMPTROLLER_REPORT_BYTES;
  if (!truncated) {
    return { text: decoded, bytes: raw.length, truncated: false };
  }
  const lineSafe = truncateTrailingLines(decoded, decoded.length);
  return { text: lineSafe.text, bytes: raw.length, truncated: true };
}

function inferReportOwner(fileName) {
  const match = fileName.match(/^(BEAN|THUFIR|PETRA|ENDER)/i);
  if (!match) return "UNKNOWN";
  const aeye = match[1][0].toUpperCase() + match[1].slice(1).toLowerCase();
  return `${aeye}@Betsy/Sally`;
}

function collectComptrollerSensoryInputs() {
  const errors = [];
  if (!fs.existsSync(STAGED_REPORT_DIR)) {
    return {
      status: "AWAITING_FIELD_DATA",
      reports: [],
      errors: [`MISSING_DIRECTORY: ${sourceLabel(STAGED_REPORT_DIR)}`]
    };
  }

  const candidates = fs
    .readdirSync(STAGED_REPORT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const filePath = path.join(STAGED_REPORT_DIR, entry.name);
      const stat = fs.statSync(filePath);
      return { name: entry.name, filePath, stat };
    })
    .filter((entry) => COMPTROLLER_REPORT_NAME_PATTERN.test(entry.name))
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
    .slice(0, MAX_COMPTROLLER_REPORTS);

  if (candidates.length === 0) {
    return {
      status: "AWAITING_FIELD_DATA",
      reports: [],
      errors: []
    };
  }

  const reports = [];
  for (const candidate of candidates) {
    try {
      const loaded = readReportTextWithCap(candidate.filePath);
      if (!loaded.text.trim()) {
        errors.push(`${candidate.name}: EMPTY_REPORT`);
        continue;
      }
      if (candidate.name.toLowerCase().endsWith(".json") && !loaded.truncated) {
        JSON.parse(loaded.text);
      }

      reports.push({
        file_name: candidate.name,
        source_path: sourceLabel(candidate.filePath),
        owner_guess: inferReportOwner(candidate.name),
        modified_at: candidate.stat.mtime.toISOString(),
        byte_size: loaded.bytes,
        sha256: sha256(fs.readFileSync(candidate.filePath)),
        truncated_to_50kb: loaded.truncated,
        validation: loaded.truncated && candidate.name.toLowerCase().endsWith(".json")
          ? "TRUNCATED_SIZE_GATE_JSON_PARSE_SKIPPED"
          : "VERIFIED",
        text: loaded.text
      });
    } catch (error) {
      errors.push(`${candidate.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    status: reports.length > 0 ? (errors.length > 0 ? "READY_WITH_WARNINGS" : "READY") : "AWAITING_FIELD_DATA",
    reports,
    errors
  };
}

function renderComptrollerSensoryInputs(context, perReportCharLimit = MAX_COMPTROLLER_REPORT_BYTES) {
  const reports = context.reports || [];
  const lines = [
    "---COMPTROLLER_SENSORY_INPUTS---",
    `status: ${context.status || "AWAITING_FIELD_DATA"}`,
    `source_directory: ${sourceLabel(STAGED_REPORT_DIR)}`,
    `reports_included: ${reports.length}`,
    `max_reports: ${MAX_COMPTROLLER_REPORTS}`,
    `max_bytes_per_report: ${MAX_COMPTROLLER_REPORT_BYTES}`,
    `validation_errors: ${JSON.stringify(context.errors || [])}`
  ];

  if (reports.length === 0) {
    lines.push("slot: AWAITING_FIELD_DATA");
    lines.push("---END_COMPTROLLER_SENSORY_INPUTS---");
    return lines.join("\n");
  }

  reports.forEach((report, index) => {
    const truncated = truncateTrailingLines(report.text, perReportCharLimit);
    lines.push("");
    lines.push(`### REPORT_${index + 1}: ${report.file_name}`);
    lines.push(`owner_guess: ${report.owner_guess}`);
    lines.push(`source_path: ${report.source_path}`);
    lines.push(`modified_at: ${report.modified_at}`);
    lines.push(`sha256: ${report.sha256}`);
    lines.push(`byte_size: ${report.byte_size}`);
    lines.push(`validation: ${report.validation}`);
    lines.push(`truncated_to_50kb: ${report.truncated_to_50kb}`);
    lines.push(`truncated_for_bootpack_budget: ${truncated.truncated}`);
    lines.push("```raw");
    lines.push(truncated.text);
    lines.push("```");
  });

  lines.push("---END_COMPTROLLER_SENSORY_INPUTS---");
  return lines.join("\n");
}

function renderHeader(profile, renderedAt) {
  return [
    "---",
    "SPEAKER_IS_ACTIVE_LLM: false",
    `AEYE: ${profile.aeye}`,
    `MACHINE: ${profile.machine}`,
    `STREAM: ${profile.stream}`,
    `PROFILE_ID: ${profile.profile_id || `${profile.aeye}.${profile.machine}`}`,
    `RENDERED_AT: ${renderedAt}`,
    `TOKEN_BUDGET: ${profile.token_budget}`,
    "SOURCE_DB: speaker/speaker.sqlite",
    "---",
    "",
    "# Speaker Bootpack",
    "",
    "Speaker is deterministic filesystem memory. This bootpack is rendered text for an Aeye; it is not an Aeye and it does not infer missing context."
  ].join("\n");
}

function estimatedTokens(markdown) {
  return Math.ceil(markdown.length / 4);
}

function assembleBootpack(profile, sections, receiptRows, comptrollerInputs) {
  const renderedAt = stamp();
  const header = renderHeader(profile, renderedAt);
  const maxChars = profile.token_budget * 4;
  let includedReceipts = receiptRows.slice();
  let comptrollerReportCharLimit = MAX_COMPTROLLER_REPORT_BYTES;
  let comptrollerSection = renderComptrollerSensoryInputs(comptrollerInputs, comptrollerReportCharLimit);

  function renderWithReceipts(rows) {
    return [
      comptrollerSection,
      header,
      ...profile.priority_order.map((section) => {
        if (section === "topology_locks") return renderTopologyLocks(sections.topology_locks);
        if (section === "boundary_rules") return renderBoundaryRules(sections.boundary_rules);
        if (section === "recent_artifact_receipts") return renderArtifactReceipts(rows);
        throw new Error(`UNSUPPORTED_PROFILE_SECTION: ${section}`);
      })
    ].join("\n\n");
  }

  let markdown = renderWithReceipts(includedReceipts);
  while (markdown.length > maxChars && includedReceipts.length > 0) {
    includedReceipts = includedReceipts.slice(0, -1);
    markdown = renderWithReceipts(includedReceipts);
  }

  while (markdown.length > maxChars && comptrollerReportCharLimit > 0) {
    comptrollerReportCharLimit = Math.max(0, Math.floor(comptrollerReportCharLimit / 2));
    comptrollerSection = renderComptrollerSensoryInputs(comptrollerInputs, comptrollerReportCharLimit);
    markdown = renderWithReceipts(includedReceipts);
  }

  if (markdown.length > maxChars) {
    throw new Error("BOOTPACK_TOKEN_BUDGET_TOO_SMALL_FOR_REQUIRED_LOCKS_AND_RULES");
  }

  return {
    markdown,
    rendered_at: renderedAt,
    estimated_tokens: estimatedTokens(markdown),
    receipts_included: includedReceipts.length,
    receipts_truncated: receiptRows.length - includedReceipts.length,
    comptroller_sensory_status: comptrollerInputs.status || "AWAITING_FIELD_DATA",
    comptroller_reports_included: (comptrollerInputs.reports || []).length,
    comptroller_validation_errors: comptrollerInputs.errors || [],
    comptroller_report_char_limit: comptrollerReportCharLimit
  };
}

function renderBootpackFromProfilePath(profilePath, options = {}) {
  ensureDirs();
  if (!fs.existsSync(profilePath)) {
    throw new Error(`BOOTPACK_PROFILE_NOT_FOUND: ${profilePath}`);
  }
  if (!fs.existsSync(SPEAKER_DB_PATH)) {
    throw new Error(`SPEAKER_SQLITE_NOT_FOUND: ${SPEAKER_DB_PATH}`);
  }

  const profile = readJson(profilePath);
  const profileErrors = validateProfile(profile);
  if (profileErrors.length > 0) {
    throw new Error(`BOOTPACK_PROFILE_INVALID: ${profileErrors.join("; ")}`);
  }

  const db = openSpeakerDb();
  const sections = {
    topology_locks: queryTopologyLocks(db),
    boundary_rules: queryBoundaryRules(db)
  };
  const receiptRows = queryRecentArtifactReceipts(db, profile.max_recent_artifact_receipts || 25);
  db.close();

  const comptrollerInputs = collectComptrollerSensoryInputs();
  const rendered = assembleBootpack(profile, sections, receiptRows, comptrollerInputs);
  const outputPaths = bootpackOutputPathsFor(profile);
  for (const outPath of outputPaths) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${rendered.markdown}\n`, "utf8");
  }
  const primaryHash = sha256(fs.readFileSync(outputPaths[0], "utf8"));
  const manifestPath = outputPaths[0].replace(/\.md$/, ".manifest.json");
  const manifest = {
    event: "speaker_bootpack_rendered",
    rendered_at: rendered.rendered_at,
    profile_id: profile.profile_id || `${profile.aeye}.${profile.machine}`,
    aeye: profile.aeye,
    machine: profile.machine,
    stream: profile.output_stream || DEFAULT_BOOTPACK_STREAM,
    source_db: sourceLabel(SPEAKER_DB_PATH),
    bootpack_path: sourceLabel(outputPaths[0]),
    compatibility_paths: outputPaths.slice(1).map((outPath) => sourceLabel(outPath)),
    bootpack_sha256: primaryHash,
    topology_locks: sections.topology_locks.length,
    boundary_rules: sections.boundary_rules.length,
    receipts_included: rendered.receipts_included,
    receipts_truncated: rendered.receipts_truncated,
    comptroller_sensory_status: rendered.comptroller_sensory_status,
    comptroller_reports_included: rendered.comptroller_reports_included,
    comptroller_validation_errors: rendered.comptroller_validation_errors,
    estimated_tokens: rendered.estimated_tokens,
    topology_locks_preserved: true
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const result = {
    ok: true,
    status: "ARTIFACT",
    profile_path: rel(profilePath),
    db_path: rel(SPEAKER_DB_PATH),
    bootpack_path: rel(outputPaths[0]),
    bootpack_paths: outputPaths.map((outPath) => rel(outPath)),
    manifest_path: rel(manifestPath),
    bootpack_sha256: primaryHash,
    sections_rendered: profile.priority_order,
    topology_locks: sections.topology_locks.length,
    boundary_rules: sections.boundary_rules.length,
    receipts_included: rendered.receipts_included,
    receipts_truncated: rendered.receipts_truncated,
    comptroller_sensory_status: rendered.comptroller_sensory_status,
    comptroller_reports_included: rendered.comptroller_reports_included,
    comptroller_validation_errors: rendered.comptroller_validation_errors,
    estimated_tokens: rendered.estimated_tokens
  };
  if (options.print !== false) {
    printResult(result);
  }
  return result;
}

function renderBootpack(aeye, machine, options = {}) {
  return renderBootpackFromProfilePath(profilePathFor(aeye, machine), options);
}

function renderBootpackProfile(profileId, options = {}) {
  return renderBootpackFromProfilePath(profilePathForId(profileId), options);
}

function hotReloadBootpack({ profileId = "Skybro.Betsy", changedPath = null, trigger = "manual" } = {}) {
  ensureDirs();
  const db = openSpeakerDb();
  const doctrineIndexRows = rebuildDoctrineIndex(db);
  db.close();

  const rendered = renderBootpackProfile(profileId, { print: false });
  const manifestPath = path.resolve(SPEAKER_ROOT, rendered.manifest_path);
  const manifest = readJson(manifestPath);
  const logEntry = {
    event: "speaker_bootpack_hot_reload",
    status: "BOOTPACK_HOT_RELOADED",
    timestamp: stamp(),
    trigger,
    changed_path: changedPath ? sourceLabel(path.resolve(changedPath)) : null,
    profile_id: profileId,
    doctrine_index_rows: doctrineIndexRows,
    bootpack_path: rendered.bootpack_path,
    manifest_path: rendered.manifest_path,
    bootpack_sha256: rendered.bootpack_sha256,
    rendered_at: manifest.rendered_at,
    topology_locks: manifest.topology_locks,
    topology_locks_preserved: manifest.topology_locks_preserved === true,
    receipts_truncated: manifest.receipts_truncated
  };

  appendLog(logEntry);
  return logEntry;
}

function watchBootpackHotReload({ profileId = "Skybro.Betsy", once = false, timeoutMs = 0, print = false } = {}) {
  ensureDirs();
  const watchRoot = DOCTRINE_ROOT;
  fs.mkdirSync(watchRoot, { recursive: true });

  return new Promise((resolve, reject) => {
    let settled = false;
    let debounce = null;
    const watcher = fs.watch(watchRoot, { recursive: true }, (eventType, filename) => {
      const relative = filename ? String(filename) : "";
      if (relative && !relative.endsWith(".md")) return;
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        try {
          const changedPath = relative ? path.join(watchRoot, relative) : watchRoot;
          const logEntry = hotReloadBootpack({
            profileId,
            changedPath,
            trigger: `watch-substrate:${eventType}`
          });
          if (print) printResult(logEntry);
          if (once && !settled) {
            settled = true;
            watcher.close();
            resolve(logEntry);
          }
        } catch (error) {
          const failure = {
            event: "speaker_bootpack_hot_reload",
            status: "BOOTPACK_HOT_RELOAD_FAILED",
            timestamp: stamp(),
            profile_id: profileId,
            error: error instanceof Error ? error.message : String(error)
          };
          appendLog(failure);
          if (!settled) {
            settled = true;
            watcher.close();
            reject(error);
          }
        }
      }, 100);
    });

    appendLog({
      event: "speaker_substrate_watch_started",
      status: "WATCHING",
      timestamp: stamp(),
      profile_id: profileId,
      watch_root: sourceLabel(watchRoot),
      once
    });

    if (timeoutMs > 0) {
      setTimeout(() => {
        if (settled) return;
        settled = true;
        watcher.close();
        reject(new Error(`WATCH_SUBSTRATE_TIMEOUT_AFTER_${timeoutMs}_MS`));
      }, timeoutMs);
    }
  });
}

function sourceLabel(value) {
  const relative = path.relative(SPEAKER_ROOT, value);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return slash(value);
  return slash(relative);
}

function compactStamp() {
  return stamp().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function normalizeReviewDays(value) {
  if (value === undefined || value === true) return DEFAULT_APOPTOSIS_REVIEW_DAYS;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("QUEUE_APOPTOSIS_REVIEW_DAYS_MUST_BE_POSITIVE_INTEGER");
  }
  return parsed;
}

function staleCutoffIso(reviewDays) {
  return new Date(Date.now() - reviewDays * 24 * 60 * 60 * 1000).toISOString();
}

function candidateReason(selector) {
  if (selector === "duplicate_doctrine_id") return "Duplicate doctrine_id found across indexed environments.";
  if (selector === "superseded_active_doctrine") return "Active doctrine has an explicit superseded relation edge.";
  if (selector === "stale_active_doctrine") return "Active doctrine is older than the configured review interval.";
  return "Unknown deterministic selector.";
}

function buildApoptosisCandidate(queueId, selector, row, index) {
  const doctrineId = row.doctrine_id || `unknown_${index + 1}`;
  const queryKey = selector === "duplicate_doctrine_id"
    ? "duplicateDoctrineIds"
    : selector === "superseded_active_doctrine"
      ? "supersededActiveDoctrine"
      : "staleActiveDoctrine";

  return {
    candidate_id: `${queueId}_${selector}_${String(index + 1).padStart(3, "0")}`,
    doctrine_id: doctrineId,
    selector,
    reason: candidateReason(selector),
    status: "queued",
    title: row.title || null,
    path: row.path || null,
    updated_at: row.updated_at || row.oldest_updated_at || null,
    evidence: {
      source_query: queryKey,
      row
    }
  };
}

function queueApoptosis(options = {}) {
  ensureDirs();
  const reviewDays = normalizeReviewDays(options.reviewDays);
  const cutoff = staleCutoffIso(reviewDays);
  const createdAt = stamp();
  const queueId = `apoptosis_queue_${compactStamp()}_${crypto.randomUUID().slice(0, 8)}`;
  const queuePath = path.join(APOPTOSIS_QUEUE_DIR, `${queueId}.json`);

  const db = openSpeakerDb();
  ensureSpeakerIndex(db);

  const duplicateRows = db.prepare(APOPTOSIS_SELECTION_QUERIES.duplicateDoctrineIds).all();
  const supersededRows = db.prepare(APOPTOSIS_SELECTION_QUERIES.supersededActiveDoctrine).all();
  const staleRows = db.prepare(APOPTOSIS_SELECTION_QUERIES.staleActiveDoctrine).all({ cutoff });

  const candidates = [
    ...duplicateRows.map((row, index) => buildApoptosisCandidate(queueId, "duplicate_doctrine_id", row, index)),
    ...supersededRows.map((row, index) => buildApoptosisCandidate(queueId, "superseded_active_doctrine", row, index)),
    ...staleRows.map((row, index) => buildApoptosisCandidate(queueId, "stale_active_doctrine", row, index))
  ];

  const collection = {
    queue_id: queueId,
    created_at: createdAt,
    review_interval_days: reviewDays,
    stale_cutoff: cutoff,
    source_db: sourceLabel(SPEAKER_DB_PATH),
    selection_rules: [
      "duplicate doctrine_id records across indexed environments",
      "active doctrine rows with a superseded relation edge",
      "active doctrine rows older than the review interval"
    ],
    selection_queries: APOPTOSIS_SELECTION_QUERIES,
    counts: {
      duplicate_doctrine_id: duplicateRows.length,
      superseded_active_doctrine: supersededRows.length,
      stale_active_doctrine: staleRows.length,
      total_candidates: candidates.length
    },
    candidates
  };

  fs.writeFileSync(queuePath, `${JSON.stringify(collection, null, 2)}\n`, "utf8");

  const insert = db.prepare(`
    INSERT INTO apoptosis_queue (
      queue_entry_id,
      queue_id,
      doctrine_id,
      selector,
      status,
      candidate_json,
      queue_path,
      created_at
    )
    VALUES (
      @queue_entry_id,
      @queue_id,
      @doctrine_id,
      @selector,
      'queued',
      @candidate_json,
      @queue_path,
      @created_at
    )
  `);

  const register = db.transaction((rows) => {
    for (const candidate of rows) {
      insert.run({
        queue_entry_id: candidate.candidate_id,
        queue_id: queueId,
        doctrine_id: candidate.doctrine_id,
        selector: candidate.selector,
        candidate_json: JSON.stringify(candidate),
        queue_path: rel(queuePath),
        created_at: createdAt
      });
    }
  });
  register(candidates);
  db.close();

  const result = {
    ok: true,
    status: "ARTIFACT",
    queue_id: queueId,
    queue_path: rel(queuePath),
    candidate_count: candidates.length,
    registered_queue_entries: candidates.length,
    review_interval_days: reviewDays,
    stale_cutoff: cutoff,
    selectors: Object.keys(APOPTOSIS_SELECTION_QUERIES)
  };
  printResult(result);
  return result;
}

function stripShellQuotes(value) {
  const text = String(value || "").trim();
  if (
    (text.startsWith("'") && text.endsWith("'")) ||
    (text.startsWith("\"") && text.endsWith("\""))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

function parseFrontierPayload(rawPayload) {
  if (typeof rawPayload !== "string" || !rawPayload.trim()) {
    throw new Error("SYNC_FRONTIER_PAYLOAD_REQUIRED");
  }

  let payload;
  try {
    payload = JSON.parse(stripShellQuotes(rawPayload));
  } catch (error) {
    throw new Error(`SYNC_FRONTIER_PAYLOAD_INVALID_JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("SYNC_FRONTIER_PAYLOAD_MUST_BE_OBJECT");
  }

  const requiredStringFields = ["last_node_active", "current_focus", "timestamp"];
  for (const field of requiredStringFields) {
    if (typeof payload[field] !== "string" || !payload[field].trim()) {
      throw new Error(`SYNC_FRONTIER_PAYLOAD_FIELD_REQUIRED: ${field}`);
    }
  }

  if (
    Object.prototype.hasOwnProperty.call(payload, "operator_alert") &&
    (typeof payload.operator_alert !== "string" || !payload.operator_alert.trim())
  ) {
    throw new Error("SYNC_FRONTIER_PAYLOAD_FIELD_INVALID: operator_alert");
  }

  for (const field of ["locked_lanes", "packets_in_flight"]) {
    if (!Array.isArray(payload[field]) || payload[field].length === 0 || payload[field].some((item) => typeof item !== "string" || !item.trim())) {
      throw new Error(`SYNC_FRONTIER_PAYLOAD_ARRAY_REQUIRED: ${field}`);
    }
  }

  return payload;
}

function frontierTargets() {
  const repoRoot = path.resolve(SPEAKER_ROOT, "..");
  const configuredSallyPath = process.env.SALLY_FRONTIER_PATH || process.env.SPEAKER_SYNC_SALLY_PATH;
  const targets = [
    {
      node: "Betsy",
      role: "primary_local_frontier",
      path: path.join(repoRoot, "tinkarden", "nervous_system", "shared_frontier.json"),
      required: true
    },
    {
      node: "Doss",
      role: "requested_local_log_mirror",
      path: path.join(SPEAKER_ROOT, "logs", "shared_frontier.json"),
      required: true
    }
  ];

  if (configuredSallyPath) {
    targets.push({
      node: "Sally",
      role: "configured_ssh_or_rsync_frontier",
      path: path.resolve(configuredSallyPath),
      required: true
    });
  } else {
    targets.push({
      node: "Sally",
      role: "deferred_until_ssh_or_rsync_layer_clears",
      path: null,
      required: false,
      deferred_reason: "SALLY_FRONTIER_PATH or SPEAKER_SYNC_SALLY_PATH is not configured on Betsy"
    });
  }

  return targets;
}

function writeFrontierTarget(target, serializedPayload, payloadHash) {
  if (!target.path) {
    return {
      node: target.node,
      role: target.role,
      status: "DEFERRED",
      required: target.required,
      path: null,
      matched_payload_sha256: false,
      reason: target.deferred_reason || "target path not configured"
    };
  }

  try {
    fs.mkdirSync(path.dirname(target.path), { recursive: true });
    fs.writeFileSync(target.path, serializedPayload, "utf8");
    const readback = fs.readFileSync(target.path, "utf8");
    const readbackHash = sha256(readback);
    if (readbackHash !== payloadHash) {
      throw new Error(`READBACK_HASH_MISMATCH: expected ${payloadHash}, got ${readbackHash}`);
    }

    return {
      node: target.node,
      role: target.role,
      status: "SYNCED",
      required: target.required,
      path: sourceLabel(target.path),
      matched_payload_sha256: true,
      sha256: readbackHash
    };
  } catch (error) {
    return {
      node: target.node,
      role: target.role,
      status: "FAILED",
      required: target.required,
      path: target.path ? sourceLabel(target.path) : null,
      matched_payload_sha256: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function syncFrontier({ payload, sourcePacketId = "BIRD_0089_DINK_AUTOMATED_BROADCAST" }) {
  ensureDirs();
  const parsedPayload = parseFrontierPayload(payload);
  const serializedPayload = `${JSON.stringify(parsedPayload, null, 2)}\n`;
  const payloadHash = sha256(serializedPayload);
  const targets = frontierTargets();
  const target_results = targets.map((target) => writeFrontierTarget(target, serializedPayload, payloadHash));
  const hard_failures = target_results.filter((target) => target.required && target.status !== "SYNCED");
  const deferred_nodes = target_results.filter((target) => target.status === "DEFERRED").map((target) => target.node);
  const synced_nodes = target_results.filter((target) => target.status === "SYNCED").map((target) => target.node);
  const status = hard_failures.length > 0
    ? "FRONTIER_SYNC_FAILED"
    : deferred_nodes.length > 0
      ? "FRONTIER_SYNCED_LOCAL_CLUSTER_SALLY_DEFERRED"
      : "FRONTIER_SYNCED_ALL_CONFIGURED_NODES";

  const logEntry = {
    event: "speaker_frontier_sync",
    status,
    timestamp: stamp(),
    command: "sync-frontier",
    source_packet_id: sourcePacketId,
    payload_sha256: payloadHash,
    synced_nodes,
    deferred_nodes,
    hard_failures,
    target_results
  };

  appendLog(logEntry);
  return logEntry;
}

function readSyncFrontierPayloadArg(args) {
  if (args.payloadFile || args.payloadPath) {
    const payloadPath = path.resolve(String(args.payloadFile || args.payloadPath));
    return fs.readFileSync(payloadPath, "utf8");
  }
  return args.payload || args._[0];
}

function readSourcePacketIdArg(args) {
  const value = args.sourcePacketId || args.packetId || "BIRD_0089_DINK_AUTOMATED_BROADCAST";
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("SYNC_FRONTIER_SOURCE_PACKET_ID_INVALID");
  }
  return value.trim();
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      args._.push(arg);
      continue;
    }
    const equalsIndex = arg.indexOf("=");
    if (equalsIndex > 2) {
      const rawKey = arg.slice(2, equalsIndex);
      const key = rawKey.replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
      args[key] = arg.slice(equalsIndex + 1);
      continue;
    }
    const key = arg.slice(2).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());
    const next = argv[index + 1];
    args[key] = next && !next.startsWith("--") ? argv[++index] : true;
  }
  return args;
}

function walkFiles(directory, predicate, output = []) {
  if (!fs.existsSync(directory)) return output;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, predicate, output);
    } else if (predicate(fullPath)) {
      output.push(fullPath);
    }
  }
  return output;
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error("DOCTRINE_FRONTMATTER_MISSING");

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (pair) fields[pair[1]] = pair[2].trim();
  }

  return {
    raw: match[1],
    full: match[0],
    fields,
    body: markdown.slice(match[0].length)
  };
}

function setFrontmatterField(rawFrontmatter, key, value) {
  const lines = rawFrontmatter.split(/\r?\n/);
  const index = lines.findIndex((line) => line.startsWith(`${key}:`));
  const nextLine = `${key}: ${value}`;
  if (index >= 0) {
    lines[index] = nextLine;
  } else {
    lines.push(nextLine);
  }
  return lines.join("\n");
}

function updateDoctrineFrontmatter(markdown, updates) {
  const parsed = parseFrontmatter(markdown);
  let nextFrontmatter = parsed.raw;
  for (const [key, value] of Object.entries(updates)) {
    nextFrontmatter = setFrontmatterField(nextFrontmatter, key, value);
  }
  return `---\n${nextFrontmatter}\n---${parsed.body}`;
}

function normalizeOutcome(value) {
  return String(value || "").trim().toUpperCase();
}

function resolveApoptosisPatchPath(value) {
  const requested = typeof value === "string" && value.trim() ? value.trim() : "apoptosis_patch.json";
  const candidate = path.isAbsolute(requested)
    ? path.resolve(requested)
    : path.resolve(PATCHES_DIR, requested);
  const relative = path.relative(PATCHES_DIR, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    failApoptosisValidation("APOPTOSIS_PATCH_OUTSIDE_PATCHES_DIR", [`patch_path: ${candidate}`]);
  }
  if (!fs.existsSync(candidate)) {
    failApoptosisValidation("APOPTOSIS_PATCH_NOT_FOUND", [`patch_path: ${candidate}`]);
  }
  if (!fs.statSync(candidate).isFile()) {
    failApoptosisValidation("APOPTOSIS_PATCH_NOT_FILE", [`patch_path: ${candidate}`]);
  }
  return candidate;
}

function collectOutcomeValues(value, output = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectOutcomeValues(item, output));
    return output;
  }
  if (!value || typeof value !== "object") return output;
  for (const [key, child] of Object.entries(value)) {
    if (key === "outcome") output.push(child);
    collectOutcomeValues(child, output);
  }
  return output;
}

function doctrineIdsFromPatch(patch) {
  return Array.isArray(patch.decisions)
    ? patch.decisions.map((decision) => decision?.doctrine_id).filter(Boolean).map(String)
    : [];
}

function appendApoptosisValidationPass({ patch, patchPath, doctrineIds }) {
  appendValidationLog({
    event: "validate_apoptosis",
    status: "PASS",
    timestamp: stamp(),
    patch_id: patch.patch_id,
    patch_path: sourceLabel(patchPath),
    schema_path: sourceLabel(APOPTOSIS_PATCH_SCHEMA_PATH),
    reviewer_aeye: patch.reviewer.aeye,
    reviewer_model_family: patch.reviewer.model_family,
    decisions_checked: doctrineIds.length,
    doctrine_ids: doctrineIds
  });
}

function validateApoptosis({ patchPath } = {}) {
  ensureDirs();
  const absolutePatchPath = resolveApoptosisPatchPath(patchPath);
  const schema = readJson(APOPTOSIS_PATCH_SCHEMA_PATH);
  let patch;

  try {
    patch = readJson(absolutePatchPath);
  } catch (error) {
    failApoptosisValidation("APOPTOSIS_PATCH_INVALID_JSON", [
      error instanceof Error ? error.message : String(error)
    ]);
  }

  const hardDeleteOutcomes = collectOutcomeValues(patch)
    .map(normalizeOutcome)
    .filter((outcome) => outcome === "HARD_DELETE");
  if (hardDeleteOutcomes.length > 0) {
    failApoptosisValidation("HARD_DELETE_FORBIDDEN", ["outcome HARD_DELETE is not legal in apoptosis patches"]);
  }

  const schemaErrors = validateValue(patch, schema);
  if (schemaErrors.length > 0) {
    failApoptosisValidation("APOPTOSIS_SCHEMA_MISMATCH", schemaErrors);
  }

  if (patch.reviewer.aeye !== "Ender") {
    failApoptosisValidation("APOPTOSIS_REVIEWER_AEYE_NOT_ENDER", [`reviewer.aeye=${patch.reviewer.aeye}`]);
  }

  if (patch.reviewer.model_family !== "Claude") {
    failApoptosisValidation("APOPTOSIS_REVIEWER_MODEL_FAMILY_NOT_CLAUDE", [
      `reviewer.model_family=${patch.reviewer.model_family}`
    ]);
  }

  const graveyardReasonErrors = patch.decisions
    .map((decision, index) => ({ decision, index }))
    .filter(({ decision }) => normalizeOutcome(decision.outcome) === "GRAVEYARD" && !String(decision.reason || "").trim())
    .map(({ index }) => `$.decisions[${index}].reason: GRAVEYARD requires non-empty reason`);
  if (graveyardReasonErrors.length > 0) {
    failApoptosisValidation("GRAVEYARD_REASON_REQUIRED", graveyardReasonErrors);
  }

  const doctrineIds = doctrineIdsFromPatch(patch);
  const db = openSpeakerDb();
  ensureSpeakerIndex(db);
  const missingDoctrineIds = [];
  const exists = db.prepare("SELECT 1 FROM doctrine_index WHERE doctrine_id = ? LIMIT 1");
  for (const doctrineId of doctrineIds) {
    if (!exists.get(doctrineId)) missingDoctrineIds.push(doctrineId);
  }
  db.close();

  if (missingDoctrineIds.length > 0) {
    failApoptosisValidation("DOCTRINE_ID_NOT_INDEXED", missingDoctrineIds);
  }

  appendApoptosisValidationPass({ patch, patchPath: absolutePatchPath, doctrineIds });
  const result = {
    ok: true,
    status: "PASS",
    command: "validate-apoptosis",
    patch_id: patch.patch_id,
    patch_path: sourceLabel(absolutePatchPath),
    schema_path: sourceLabel(APOPTOSIS_PATCH_SCHEMA_PATH),
    decisions_checked: doctrineIds.length
  };
  printResult(result);
  return result;
}

function patchTargetPath(patch) {
  const target = patch.target_path || patch.target || patch.doctrine_path || patch.path;
  if (!target || typeof target !== "string") throw new Error("PATCH_TARGET_REQUIRED");
  const absolute = path.resolve(SPEAKER_ROOT, target.startsWith("speaker/") ? path.relative("speaker", target) : target);
  const relative = path.relative(SPEAKER_ROOT, absolute);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("PATCH_TARGET_OUTSIDE_SPEAKER");
  }
  if (!absolute.startsWith(DOCTRINE_ROOT)) {
    throw new Error("PATCH_TARGET_NOT_DOCTRINE");
  }
  return absolute;
}

function patchRelativePath(patchPath, candidate) {
  if (!candidate || typeof candidate !== "string") return "";
  if (path.isAbsolute(candidate)) return candidate;
  return path.resolve(path.dirname(patchPath), candidate);
}

function findReceiptById(receiptId) {
  const candidates = walkFiles(path.join(SPEAKER_ROOT, "receipts"), (filePath) => filePath.endsWith(".json"));
  for (const filePath of candidates) {
    try {
      const parsed = readJson(filePath);
      if (parsed.receipt_id === receiptId) return filePath;
    } catch {
      // Malformed receipts are not valid approval evidence.
    }
  }
  return null;
}

function safeMoveDoctrine(source, destination, context = {}) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.renameSync(source, destination);
  schedulePostMutationAudit({
    trigger: "fs.renameSync:safeMoveDoctrine",
    source_path: source,
    destination_path: destination,
    proposed_mutations: context.proposed_mutations || [source, destination],
    ...context
  });
}

function rebuildDoctrineIndex(db) {
  ensureSpeakerIndex(db);
  db.prepare("DELETE FROM doctrine_index").run();
  const upsert = db.prepare(`
    INSERT INTO doctrine_index (doctrine_id, path, title, status, source_receipt_id, hash, updated_at)
    VALUES (@doctrine_id, @path, @title, @status, @source_receipt_id, @hash, @updated_at)
  `);

  const files = walkFiles(DOCTRINE_ROOT, (filePath) => filePath.endsWith(".md"));
  let indexed = 0;
  for (const filePath of files) {
    let parsed;
    try {
      parsed = parseFrontmatter(fs.readFileSync(filePath, "utf8"));
    } catch {
      continue;
    }
    const doctrineId = parsed.fields.doctrine_id;
    const status = parsed.fields.status;
    if (!doctrineId || !status) continue;
    upsert.run({
      doctrine_id: doctrineId,
      path: rel(filePath),
      title: parsed.fields.title || path.basename(filePath, ".md"),
      status,
      source_receipt_id: parsed.fields.source_receipt_id || null,
      hash: parsed.fields.hash || null,
      updated_at: stamp()
    });
    indexed += 1;
  }
  return indexed;
}

function rebuildIndexCommand() {
  ensureDirs();
  const db = openSpeakerDb();
  ensureSpeakerIndex(db);
  const indexed = rebuildDoctrineIndex(db);
  db.close();
  const result = {
    ok: true,
    status: "DOCTRINE_INDEX_REBUILT",
    doctrine_index_rows: indexed,
    db_path: sourceLabel(SPEAKER_DB_PATH)
  };
  printResult(result);
  return result;
}

function appendAutonomicEvent(entry) {
  appendLog({
    event: "watch_substrate",
    timestamp: stamp(),
    ...entry
  });
}

function watchedFileSnapshot(directory, predicate) {
  const snapshot = new Map();
  if (!fs.existsSync(directory)) return snapshot;
  for (const filePath of walkFiles(directory, predicate)) {
    try {
      const stat = fs.statSync(filePath);
      snapshot.set(filePath, `${stat.mtimeMs}:${stat.size}`);
    } catch {
      // Ignore files that disappear between directory scan and stat.
    }
  }
  return snapshot;
}

function mergeSnapshots(...snapshots) {
  const merged = new Map();
  for (const snapshot of snapshots) {
    for (const [filePath, marker] of snapshot.entries()) {
      merged.set(filePath, marker);
    }
  }
  return merged;
}

function isReceiptInboxFile(filePath) {
  return filePath.endsWith(".json");
}

function isActiveDoctrineMarkdown(filePath) {
  return filePath.endsWith(".md");
}

function postMutationContextFromWatchedFile(filePath, eventType) {
  const fallback = [filePath];
  const context = {
    trigger: `watch-substrate:${eventType}:post_write_audit`,
    source_path: filePath,
    destination_path: filePath,
    proposed_mutations: fallback
  };

  try {
    if (filePath.endsWith(".json")) {
      const parsed = readJson(filePath);
      context.proposed_mutations = proposedMutationSet(parsed, fallback);
      context.capsule_id = parsed.capsule_id || parsed.packet_id || parsed.receipt_id || null;
      return context;
    }
    if (filePath.endsWith(".md")) {
      const parsed = parseFrontmatter(fs.readFileSync(filePath, "utf8"));
      context.proposed_mutations = proposedMutationSet(parsed.fields, fallback);
      context.doctrine_id = parsed.fields.doctrine_id || null;
      return context;
    }
  } catch (error) {
    appendSecurityAuditLog({
      status: "POST_MUTATION_METADATA_READ_FAILED",
      file_path: sourceLabel(filePath),
      error: error instanceof Error ? error.message : String(error)
    });
  }

  return context;
}

function runNodeSpeakerctl(args) {
  const result = spawnSync(process.execPath, [__filename, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
    timeout: 120000,
    maxBuffer: 1024 * 1024 * 20
  });

  return {
    command: [process.execPath, sourceLabel(__filename), ...args].join(" "),
    exit_code: typeof result.status === "number" ? result.status : 1,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error ? result.error.message : null
  };
}

function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const endpoint = new URL(url);
    const request = http.request({
      method: "POST",
      hostname: endpoint.hostname,
      port: endpoint.port || 80,
      path: `${endpoint.pathname}${endpoint.search}`,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body)
      },
      timeout: 5000
    }, (response) => {
      let raw = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        raw += chunk;
      });
      response.on("end", () => {
        resolve({
          status_code: response.statusCode || 0,
          body: raw
        });
      });
    });

    request.on("error", reject);
    request.on("timeout", () => {
      request.destroy(new Error("INTERFACE_NOTIFY_TIMEOUT"));
    });
    request.write(body);
    request.end();
  });
}

function clearClipboardAsync() {
  const powershell = process.env.SystemRoot
    ? path.join(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
    : "powershell.exe";
  const child = spawn(powershell, ["-NoProfile", "-Command", "Set-Clipboard -Value ''"], {
    cwd: REPO_ROOT,
    shell: false,
    windowsHide: true,
    stdio: "ignore"
  });
  child.unref();
}

function extractWrittenFilesFromClipResult(value) {
  if (!value || typeof value !== "object") return [];
  const direct = value.written_files || value.writtenFiles || value.files || value.paths || value.output_files;
  const single = value.written_file || value.writtenFile || value.file || value.path || value.output_file;
  const source = Array.isArray(direct) ? direct : single ? [single] : [];
  return source.map(String).filter(Boolean);
}

function parseClipHarvesterPayload(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return null;
  const lines = trimmed.split(/\r?\n/).reverse();
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // Keep scanning; clip harvesters may write progress lines before JSON.
    }
  }
  return null;
}

async function notifyHarvestComplete(payload, notifyUrl = DEFAULT_INTERFACE_NOTIFY_URL) {
  const writtenFiles = extractWrittenFilesFromClipResult(payload);
  const notice = {
    event_type: "clipboard_ingest",
    status: "CLIPBOARD_INGEST_SUCCESSFUL",
    badge: "[ CLIPBOARD_INGEST: SUCCESSFUL ]",
    timestamp: stamp(),
    capsule_id: payload?.capsule_id || payload?.receipt_id || path.basename(writtenFiles[0] || ""),
    written_files: writtenFiles,
    clipboard_cleared: true,
    payload: payload || {}
  };

  clearClipboardAsync();
  const result = await postJson(notifyUrl, notice);
  appendLog({
    event: "clip_harvester_notify",
    status: result.status_code >= 200 && result.status_code < 300 ? "PASS" : "FAIL",
    timestamp: stamp(),
    notify_url: notifyUrl,
    written_files: writtenFiles,
    notify_status_code: result.status_code,
    response_body: result.body
  });
  return { notice, result };
}

function startClipHarvest(options = {}) {
  ensureDirs();
  const notifyUrl = options.notifyUrl || DEFAULT_INTERFACE_NOTIFY_URL;

  if (!fs.existsSync(CLIP_HARVESTER_PATH)) {
    const result = {
      ok: false,
      status: "CLIP_HARVESTER_MISSING",
      clip_harvester_path: sourceLabel(CLIP_HARVESTER_PATH),
      notify_url: notifyUrl
    };
    appendLog({
      event: "clip_harvester_start",
      timestamp: stamp(),
      ...result
    });
    printResult(result);
    return result;
  }

  const child = spawn(process.execPath, [CLIP_HARVESTER_PATH], {
    cwd: REPO_ROOT,
    shell: false,
    windowsHide: true,
    detached: Boolean(options.background),
    env: {
      ...process.env,
      CLIP_HARVEST_NOTIFY_URL: notifyUrl,
      CLIP_HARVEST_CLEAR_CLIPBOARD: "1"
    },
    stdio: options.background ? "ignore" : ["ignore", "pipe", "pipe"]
  });

  if (options.background) {
    child.unref();
    const result = {
      ok: true,
      status: "CLIP_HARVESTER_BACKGROUND_STARTED",
      pid: child.pid,
      clip_harvester_path: sourceLabel(CLIP_HARVESTER_PATH),
      notify_url: notifyUrl
    };
    appendLog({
      event: "clip_harvester_start",
      timestamp: stamp(),
      ...result
    });
    printResult(result);
    return result;
  }

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });
  child.on("close", async (exitCode) => {
    const payload = parseClipHarvesterPayload(stdout);
    if (exitCode === 0 && payload && extractWrittenFilesFromClipResult(payload).length > 0) {
      await notifyHarvestComplete(payload, notifyUrl);
    }
    appendLog({
      event: "clip_harvester_exit",
      status: exitCode === 0 ? "PASS" : "FAIL",
      timestamp: stamp(),
      exit_code: exitCode,
      stdout,
      stderr
    });
  });

  const result = {
    ok: true,
    status: "CLIP_HARVESTER_RUNNING",
    pid: child.pid,
    clip_harvester_path: sourceLabel(CLIP_HARVESTER_PATH),
    notify_url: notifyUrl
  };
  printResult(result);
  return result;
}

function shellCandidates() {
  return [
    "sh",
    "bash",
    "C:\\Program Files\\Git\\bin\\sh.exe",
    "C:\\Program Files\\Git\\usr\\bin\\sh.exe"
  ].filter((candidate, index, all) => all.indexOf(candidate) === index);
}

function runSpeakerValidate(filePath) {
  const relativePath = path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
  let lastResult = null;
  for (const shell of shellCandidates()) {
    if (path.isAbsolute(shell) && !fs.existsSync(shell)) continue;
    const result = spawnSync(shell, [SPEAKER_VALIDATE_PATH, relativePath], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      shell: false,
      windowsHide: true,
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 20
    });

    lastResult = {
      command: [shell, sourceLabel(SPEAKER_VALIDATE_PATH), relativePath].join(" "),
      exit_code: typeof result.status === "number" ? result.status : 1,
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      error: result.error ? result.error.message : null
    };

    if (!result.error || result.error.code !== "ENOENT") return lastResult;
  }
  return lastResult || {
    command: "speaker-validate.sh",
    exit_code: 1,
    stdout: "",
    stderr: "",
    error: "NO_SHELL_AVAILABLE_FOR_SPEAKER_VALIDATE"
  };
}

function handleReceiptInboxFile(filePath) {
  appendAutonomicEvent({
    status: "TRIGGER",
    trigger: "receipt_inbox_new_file",
    file_path: sourceLabel(filePath)
  });

  const ingestResult = runNodeSpeakerctl(["ingest", filePath]);
  appendAutonomicEvent({
    status: ingestResult.exit_code === 0 ? "PASS" : "FAIL",
    trigger: "receipt_inbox_ingest",
    file_path: sourceLabel(filePath),
    ...ingestResult
  });
}

function handleActiveDoctrineFile(filePath) {
  appendAutonomicEvent({
    status: "TRIGGER",
    trigger: "active_doctrine_new_markdown",
    file_path: sourceLabel(filePath)
  });

  const validateResult = runSpeakerValidate(filePath);
  appendAutonomicEvent({
    status: validateResult.exit_code === 0 ? "PASS" : "FAIL",
    trigger: "active_doctrine_frontmatter_validate",
    file_path: sourceLabel(filePath),
    ...validateResult
  });

  if (validateResult.exit_code !== 0) return;

  const rebuildResult = runNodeSpeakerctl(["rebuild-index"]);
  appendAutonomicEvent({
    status: rebuildResult.exit_code === 0 ? "PASS" : "FAIL",
    trigger: "active_doctrine_rebuild_index",
    file_path: sourceLabel(filePath),
    ...rebuildResult
  });
}

function scanWatchTargets(seen, options = {}) {
  const receiptSnapshot = watchedFileSnapshot(RAW_RECEIPT_INBOX_DIR, isReceiptInboxFile);
  const doctrineSnapshot = watchedFileSnapshot(ACTIVE_DOCTRINE_DIR, isActiveDoctrineMarkdown);
  const nextSeen = mergeSnapshots(receiptSnapshot, doctrineSnapshot);

  for (const [filePath, marker] of nextSeen.entries()) {
    const previousMarker = seen.get(filePath);
    if (previousMarker === marker) continue;
    seen.set(filePath, marker);
    if (previousMarker === undefined && options.ignoreExisting) continue;
    if (filePath.startsWith(RAW_RECEIPT_INBOX_DIR)) {
      handleReceiptInboxFile(filePath);
    } else if (filePath.startsWith(ACTIVE_DOCTRINE_DIR)) {
      handleActiveDoctrineFile(filePath);
    }
    schedulePostMutationAudit(postMutationContextFromWatchedFile(filePath, "scan"));
  }

  for (const filePath of Array.from(seen.keys())) {
    if (!nextSeen.has(filePath)) seen.delete(filePath);
  }
}

function watchSubstrate(options = {}) {
  ensureDirs();
  const intervalMs = Number.parseInt(String(options.intervalMs || 500), 10);
  const safeIntervalMs = Number.isInteger(intervalMs) && intervalMs >= 100 ? intervalMs : 500;
  const seen = options.includeExisting
    ? new Map()
    : mergeSnapshots(
      watchedFileSnapshot(RAW_RECEIPT_INBOX_DIR, isReceiptInboxFile),
      watchedFileSnapshot(ACTIVE_DOCTRINE_DIR, isActiveDoctrineMarkdown)
    );

  appendAutonomicEvent({
    status: "START",
    trigger: "watch_substrate",
    receipt_inbox_dir: sourceLabel(RAW_RECEIPT_INBOX_DIR),
    active_doctrine_dir: sourceLabel(ACTIVE_DOCTRINE_DIR),
    interval_ms: safeIntervalMs,
    include_existing: Boolean(options.includeExisting)
  });

  if (options.clipHarvester) {
    startClipHarvest({ background: true, notifyUrl: options.notifyUrl || DEFAULT_INTERFACE_NOTIFY_URL });
  }

  if (options.once) {
    scanWatchTargets(seen, { ignoreExisting: false });
    appendAutonomicEvent({ status: "STOP", trigger: "watch_substrate_once" });
    return { ok: true, status: "WATCH_SUBSTRATE_ONCE_COMPLETE" };
  }

  setInterval(() => {
    try {
      scanWatchTargets(seen, { ignoreExisting: false });
    } catch (error) {
      appendAutonomicEvent({
        status: "FAIL",
        trigger: "watch_substrate_scan",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, safeIntervalMs);

  printResult({
    ok: true,
    status: "WATCH_SUBSTRATE_RUNNING",
    receipt_inbox_dir: sourceLabel(RAW_RECEIPT_INBOX_DIR),
    active_doctrine_dir: sourceLabel(ACTIVE_DOCTRINE_DIR),
    interval_ms: safeIntervalMs,
    clip_harvester: Boolean(options.clipHarvester)
  });
  return { ok: true, status: "WATCH_SUBSTRATE_RUNNING", clip_harvester: Boolean(options.clipHarvester) };
}

function applyApoptosis({ patchPath, approvalReceiptId }) {
  ensureDirs();
  if (!patchPath) throw new Error("APPLY_APOPTOSIS_REQUIRES_PATCH");
  if (!approvalReceiptId) throw new Error("APPLY_APOPTOSIS_REQUIRES_APPROVAL_RECEIPT");

  const approvalPath = findReceiptById(approvalReceiptId);
  if (!approvalPath) throw new Error(`OPERATOR_APPROVAL_RECEIPT_NOT_FOUND: ${approvalReceiptId}`);
  const approvalReceipt = readJson(approvalPath);
  const approvalSignaturePath = patchRelativePath(
    approvalPath,
    approvalReceipt.signature_path || approvalReceipt.signaturePath || `${approvalPath}.sig`
  );
  verifySignature(approvalPath, approvalSignaturePath);

  const absolutePatchPath = path.resolve(patchPath);
  const patch = readJson(absolutePatchPath);
  const outcome = normalizeOutcome(patch.outcome || patch.action || patch.status);
  if (outcome === "HARD_DELETE") throw new Error("HARD_DELETE_FORBIDDEN");
  if (!["GRAVEYARD", "DEPRECATE"].includes(outcome)) {
    throw new Error(`UNSUPPORTED_APOPTOSIS_OUTCOME: ${outcome}`);
  }

  const targetPath = patchTargetPath(patch);
  if (!fs.existsSync(targetPath)) throw new Error(`TARGET_DOCTRINE_NOT_FOUND: ${rel(targetPath)}`);

  const original = fs.readFileSync(targetPath, "utf8");
  const parsed = parseFrontmatter(original);
  const doctrineId = parsed.fields.doctrine_id || path.basename(targetPath, ".md");
  const reason = String(patch.reason || patch.rationale || patch.why || "No reason supplied").trim();
  const newStatus = outcome === "GRAVEYARD" ? "GRAVEYARD" : "DEPRECATED";
  const updated = updateDoctrineFrontmatter(original, {
    status: newStatus,
    apoptosis_outcome: outcome,
    operator_approval_receipt_id: approvalReceiptId,
    apoptosis_reason: JSON.stringify(reason),
    apoptosis_applied_at: stamp()
  });

  fs.writeFileSync(targetPath, updated, "utf8");

  const destinationRoot = outcome === "GRAVEYARD" ? DOCTRINE_GRAVEYARD_DIR : DOCTRINE_DEPRECATED_DIR;
  const destinationPath = uniquePath(destinationRoot, path.basename(targetPath));
  safeMoveDoctrine(targetPath, destinationPath, {
    trigger: "fs.renameSync:apply_apoptosis",
    proposed_mutations: proposedMutationSet(patch, [targetPath, destinationPath]),
    patch_id: patch.patch_id || null,
    doctrine_id: doctrineId,
    outcome
  });

  const db = openSpeakerDb();
  ensureSpeakerIndex(db);
  const indexed = rebuildDoctrineIndex(db);
  const ledgerId = `graveyard_${stamp().replace(/[-:.TZ]/g, "").slice(0, 14)}_${sanitize(doctrineId, "doctrine")}`;
  db.prepare(`
    INSERT INTO graveyard_ledger (
      ledger_id,
      doctrine_id,
      source_path,
      destination_path,
      outcome,
      reason,
      operator_approval_receipt_id,
      patch_path,
      created_at
    )
    VALUES (
      @ledger_id,
      @doctrine_id,
      @source_path,
      @destination_path,
      @outcome,
      @reason,
      @operator_approval_receipt_id,
      @patch_path,
      @created_at
    )
  `).run({
    ledger_id: ledgerId,
    doctrine_id: doctrineId,
    source_path: rel(targetPath),
    destination_path: rel(destinationPath),
    outcome,
    reason,
    operator_approval_receipt_id: approvalReceiptId,
    patch_path: rel(absolutePatchPath),
    created_at: stamp()
  });
  db.close();

  const result = {
    ok: true,
    status: "APOPTOSIS_APPLIED",
    outcome,
    doctrine_id: doctrineId,
    source_path: rel(targetPath),
    destination_path: rel(destinationPath),
    operator_approval_receipt_id: approvalReceiptId,
    ledger_id: ledgerId,
    doctrine_index_rows: indexed
  };
  printResult(result);
  return result;
}

function seedDemoIndex() {
  ensureDirs();
  const db = openSpeakerDb();
  ensureSpeakerIndex(db);

  const topologyLocks = [
    {
      lock_id: "SPEAKER_TOPOLOGY_LOCK",
      title: "Speaker is deterministic file memory",
      body: "Speaker is not an active LLM or Aeye. Speaker stores, validates, indexes, and renders memory as files and SQLite rows.",
      status: "ACTIVE",
      priority: 1,
      created_at: "2026-06-27T17:25:00-04:00"
    }
  ];
  const boundaryRules = [
    {
      rule_id: "NO_GUESSING_BOOTPACK_CONTENT",
      title: "Bootpack renderer follows profile order only",
      body: "The renderer may not infer missing sections or reorder memory. Unsupported profile sections block rendering.",
      status: "ACTIVE",
      priority: 1,
      created_at: "2026-06-27T17:25:00-04:00"
    },
    {
      rule_id: "SPEAKER_IS_ACTIVE_LLM_FALSE",
      title: "Header must deny Speaker agency",
      body: "Every rendered bootpack starts with SPEAKER_IS_ACTIVE_LLM: false so receiving Aeyes cannot mistake Speaker for an agent.",
      status: "ACTIVE",
      priority: 2,
      created_at: "2026-06-27T17:25:00-04:00"
    }
  ];
  const canonicalReceipt = fs
    .readdirSync(CANONICAL_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(CANONICAL_DIR, entry.name))
    .sort()
    .at(-1);
  const receiptRaw = canonicalReceipt ? fs.readFileSync(canonicalReceipt, "utf8") : "{}";
  const receiptJson = canonicalReceipt ? JSON.parse(receiptRaw) : {
    receipt_id: "receipt_bird_0056_seed",
    status: "ARTIFACT",
    timestamp: stamp(),
    evidence: { path: "speaker/bin/speakerctl.js", summary: "Seed fallback receipt" }
  };
  const artifactReceipts = [
    {
      receipt_id: receiptJson.receipt_id,
      title: "Speaker deterministic ingestion proof",
      status: "ARTIFACT",
      evidence_path: receiptJson.evidence?.path || canonicalReceipt || "UNKNOWN_EVIDENCE",
      sha256: canonicalReceipt ? sha256(receiptRaw) : sha256(JSON.stringify(receiptJson)),
      summary: receiptJson.evidence?.summary || "Canonical receipt indexed for bootpack proof.",
      created_at: receiptJson.timestamp || stamp()
    }
  ];

  const upsertTopology = db.prepare(`
    INSERT INTO topology_locks (lock_id, title, body, status, priority, created_at)
    VALUES (@lock_id, @title, @body, @status, @priority, @created_at)
    ON CONFLICT(lock_id) DO UPDATE SET
      title = excluded.title,
      body = excluded.body,
      status = excluded.status,
      priority = excluded.priority,
      created_at = excluded.created_at
  `);
  const upsertRule = db.prepare(`
    INSERT INTO boundary_rules (rule_id, title, body, status, priority, created_at)
    VALUES (@rule_id, @title, @body, @status, @priority, @created_at)
    ON CONFLICT(rule_id) DO UPDATE SET
      title = excluded.title,
      body = excluded.body,
      status = excluded.status,
      priority = excluded.priority,
      created_at = excluded.created_at
  `);
  const upsertReceipt = db.prepare(`
    INSERT INTO artifact_receipts (receipt_id, title, status, evidence_path, sha256, summary, created_at)
    VALUES (@receipt_id, @title, @status, @evidence_path, @sha256, @summary, @created_at)
    ON CONFLICT(receipt_id) DO UPDATE SET
      title = excluded.title,
      status = excluded.status,
      evidence_path = excluded.evidence_path,
      sha256 = excluded.sha256,
      summary = excluded.summary,
      created_at = excluded.created_at
  `);

  const seed = db.transaction(() => {
    topologyLocks.forEach((row) => upsertTopology.run(row));
    boundaryRules.forEach((row) => upsertRule.run(row));
    artifactReceipts.forEach((row) => upsertReceipt.run(row));
  });
  seed();
  db.close();

  const result = {
    ok: true,
    status: "SEEDED",
    db_path: rel(SPEAKER_DB_PATH),
    topology_locks: topologyLocks.length,
    boundary_rules: boundaryRules.length,
    artifact_receipts: artifactReceipts.length
  };
  printResult(result);
  return result;
}

function usage() {
  return [
    "Usage:",
    "  node speaker/bin/speakerctl.js ingest [path_to_receipt]",
    "  node speaker/bin/speakerctl.js render-bootpack [Aeye] [Machine]",
    "  node speaker/bin/speakerctl.js render-bootpack --profile Skybro.Betsy",
    "  node speaker/bin/speakerctl.js queue-apoptosis [--review-days 30]",
    "  node speaker/bin/speakerctl.js sync-frontier --payload='{\"last_node_active\":\"...\"}'",
    "  node speaker/bin/speakerctl.js sync-frontier --payload-file [state_payload.json]",
    "  node speaker/bin/speakerctl.js sync-frontier --source-packet-id [packet_id] --payload-file [state_payload.json]",
    "  node speaker/bin/speakerctl.js extract-payload --source [packet.md]",
    "  node speaker/bin/speakerctl.js apply-payload --target [destination_path]",
    "  node speaker/bin/speakerctl.js clip-harvest [--wait]",
    "  node speaker/bin/speakerctl.js rebuild-index",
    "  node speaker/bin/speakerctl.js watch-substrate [--interval-ms 500] [--clip-harvester]",
    "  node speaker/bin/speakerctl.js seed-demo-index",
    "  node speaker/bin/speakerctl.js validate-apoptosis [--patch apoptosis_patch.json]",
    "  node speaker/bin/speakerctl.js apply-apoptosis --patch [path_to_patch.json] --approval-receipt [receipt_id]",
    "  node speaker/bin/speakerctl.js verify-signature --payload [path] --signature [path]"
  ].join("\n");
}

function main() {
  const argv = process.argv.slice(2);
  const [command, firstArg, secondArg] = argv;

  if (command === "ingest" && firstArg) {
    try {
      ingest(firstArg);
    } catch (error) {
      console.error(JSON.stringify({
        ok: false,
        status: "ERROR",
        error: error instanceof Error ? error.message : String(error)
      }, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === "render-bootpack") {
    const args = parseArgs(argv.slice(1));
    try {
      if (args.profile) {
        renderBootpackProfile(args.profile);
      } else if (firstArg && secondArg) {
        renderBootpack(firstArg, secondArg);
      } else {
        throw new Error("RENDER_BOOTPACK_REQUIRES_PROFILE_OR_AEYE_MACHINE");
      }
    } catch (error) {
      console.error(JSON.stringify({
        ok: false,
        status: "ERROR",
        error: error instanceof Error ? error.message : String(error)
      }, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === "watch-substrate") {
    const args = parseArgs(argv.slice(1));
    try {
      watchSubstrate({
        intervalMs: args.intervalMs,
        once: Boolean(args.once),
        includeExisting: Boolean(args.includeExisting),
        clipHarvester: Boolean(args.clipHarvester),
        notifyUrl: args.notifyUrl || DEFAULT_INTERFACE_NOTIFY_URL
      });
    } catch (error) {
      console.error(JSON.stringify({
        ok: false,
        status: "ERROR",
        error: error instanceof Error ? error.message : String(error)
      }, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === "seed-demo-index") {
    try {
      seedDemoIndex();
    } catch (error) {
      console.error(JSON.stringify({
        ok: false,
        status: "ERROR",
        error: error instanceof Error ? error.message : String(error)
      }, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === "queue-apoptosis") {
    const args = parseArgs(argv.slice(1));
    try {
      queueApoptosis({
        reviewDays: args.reviewDays
      });
    } catch (error) {
      console.error(JSON.stringify({
        ok: false,
        status: "ERROR",
        error: error instanceof Error ? error.message : String(error)
      }, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === "sync-frontier") {
    const args = parseArgs(argv.slice(1));
    try {
      const result = syncFrontier({
        payload: readSyncFrontierPayloadArg(args),
        sourcePacketId: readSourcePacketIdArg(args)
      });
      if (result.hard_failures.length > 0) {
        console.error(JSON.stringify(result, null, 2));
        process.exitCode = 1;
      } else if (args.print) {
        printResult(result);
      }
    } catch (error) {
      console.error(JSON.stringify({
        ok: false,
        status: "ERROR",
        error: error instanceof Error ? error.message : String(error)
      }, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === "extract-payload") {
    const args = parseArgs(argv.slice(1));
    try {
      extractPayload({
        source: args.source || args._[0]
      });
    } catch (error) {
      console.error(JSON.stringify({
        ok: false,
        status: "ERROR",
        error: error instanceof Error ? error.message : String(error)
      }, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === "apply-payload") {
    const args = parseArgs(argv.slice(1));
    try {
      applyPayload({
        targetDestination: args.target || args.destination || args.targetDestination || args._[0]
      });
    } catch (error) {
      console.error(JSON.stringify({
        ok: false,
        status: "ERROR",
        error: error instanceof Error ? error.message : String(error)
      }, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === "clip-harvest") {
    const args = parseArgs(argv.slice(1));
    try {
      startClipHarvest({
        background: !args.wait,
        notifyUrl: args.notifyUrl || DEFAULT_INTERFACE_NOTIFY_URL
      });
    } catch (error) {
      console.error(JSON.stringify({
        ok: false,
        status: "ERROR",
        error: error instanceof Error ? error.message : String(error)
      }, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === "rebuild-index") {
    try {
      rebuildIndexCommand();
    } catch (error) {
      console.error(JSON.stringify({
        ok: false,
        status: "ERROR",
        error: error instanceof Error ? error.message : String(error)
      }, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === "apply-apoptosis") {
    const args = parseArgs(argv.slice(1));
    try {
      applyApoptosis({
        patchPath: args.patch,
        approvalReceiptId: args.approvalReceipt
      });
    } catch (error) {
      console.error(JSON.stringify({
        ok: false,
        status: "ERROR",
        error: error instanceof Error ? error.message : String(error)
      }, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  if (command === "validate-apoptosis") {
    const args = parseArgs(argv.slice(1));
    try {
      validateApoptosis({
        patchPath: args.patch || args._[0]
      });
    } catch (error) {
      console.error(JSON.stringify({
        ok: false,
        status: "ERROR",
        code: error instanceof ApoptosisValidationError ? error.code : "VALIDATE_APOPTOSIS_FAILED",
        errors: error instanceof ApoptosisValidationError ? error.errors : [error instanceof Error ? error.message : String(error)]
      }, null, 2));
      process.exitCode = error instanceof ApoptosisValidationError ? error.exitCode : 1;
    }
    return;
  }

  if (command === "verify-signature") {
    const args = parseArgs(argv.slice(1));
    try {
      const ok = verifySignature(args.payload, args.signature);
      printResult({ ok, status: "SIGNATURE_VERIFIED" });
    } catch (error) {
      console.error(JSON.stringify({
        ok: false,
        status: "ERROR",
        error: error instanceof Error ? error.message : String(error)
      }, null, 2));
      process.exitCode = 1;
    }
    return;
  }

  {
    console.error(usage());
    process.exitCode = 2;
    return;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  applyApoptosis,
  applyPayload,
  notifyHarvestComplete,
  extractPayload,
  ingest,
  queueApoptosis,
  rebuildDoctrineIndex,
  rebuildIndexCommand,
  renderBootpack,
  renderBootpackProfile,
  seedDemoIndex,
  startClipHarvest,
  syncFrontier,
  watchSubstrate,
  validateApoptosis,
  validateReceipt,
  verifySignature
};
