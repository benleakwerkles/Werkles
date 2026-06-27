#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { DatabaseSync } = require("node:sqlite");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const SOURCE_TRUTH_DIR = path.join(REPO_ROOT, "foreman", "source-truth");
const DEFAULT_FRONTIER_PATH = path.join(SOURCE_TRUTH_DIR, "shared_frontier.json");
const DEFAULT_RECEIPT_DIR = path.join(SOURCE_TRUTH_DIR, "receipts", "memory");
const DEFAULT_DB_CANDIDATES = [
  path.join(path.parse(REPO_ROOT).root, "tinkarden", "server", "circulation.db"),
  path.join(REPO_ROOT, "data", "organism", "circulation.db"),
  path.join(REPO_ROOT, "circulation.db"),
  path.join(path.parse(REPO_ROOT).root, "tinkarden", "circulation.db"),
];

const COMPLETED_STATUSES = new Set(["ACK", "ARTIFACT", "COMPLETE", "COMPLETED", "DONE", "SUCCESS"]);
const BLOCKER_STATUSES = new Set(["BLOCKER", "BLOCKED", "ERROR", "FAIL", "FAILED", "NO_GO", "NO-GO"]);
const TIMESTAMP_COLUMNS = [
  "completed_at",
  "created_at",
  "timestamp",
  "updated_at",
  "write_timestamp",
  "read_timestamp",
  "logged_at",
  "started_at",
];

function parseArgs(argv) {
  const args = {
    db: process.env.SLEEP_CYCLE_DB || process.env.CIRCULATION_DB || null,
    frontier: process.env.SHARED_FRONTIER_PATH || DEFAULT_FRONTIER_PATH,
    receiptDir: process.env.SLEEP_CYCLE_RECEIPT_DIR || DEFAULT_RECEIPT_DIR,
    date: localDateString(new Date()),
    commit: true,
    json: true,
    limitPerTable: Number(process.env.SLEEP_CYCLE_LIMIT_PER_TABLE || 500),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--db") args.db = requireValue(argv, ++i, arg);
    else if (arg.startsWith("--db=")) args.db = arg.slice("--db=".length);
    else if (arg === "--frontier") args.frontier = requireValue(argv, ++i, arg);
    else if (arg.startsWith("--frontier=")) args.frontier = arg.slice("--frontier=".length);
    else if (arg === "--receipt-dir") args.receiptDir = requireValue(argv, ++i, arg);
    else if (arg.startsWith("--receipt-dir=")) args.receiptDir = arg.slice("--receipt-dir=".length);
    else if (arg === "--date") args.date = requireValue(argv, ++i, arg);
    else if (arg.startsWith("--date=")) args.date = arg.slice("--date=".length);
    else if (arg === "--limit-per-table") args.limitPerTable = Number(requireValue(argv, ++i, arg));
    else if (arg.startsWith("--limit-per-table=")) args.limitPerTable = Number(arg.slice("--limit-per-table=".length));
    else if (arg === "--no-commit") args.commit = false;
    else if (arg === "--plain") args.json = false;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) {
    throw new Error("--date must be YYYY-MM-DD");
  }
  if (!Number.isFinite(args.limitPerTable) || args.limitPerTable < 1) {
    throw new Error("--limit-per-table must be a number >= 1");
  }
  return args;
}

function requireValue(argv, index, flag) {
  const value = argv[index];
  if (!value) throw new Error(`${flag} requires a value`);
  return value;
}

function printHelp() {
  process.stdout.write(`Nerdkle sleep cycle

Usage:
  node scripts/foreman/sleep_cycle.js
  node scripts/foreman/sleep_cycle.js --db C:\\tinkarden\\server\\circulation.db
  node scripts/foreman/sleep_cycle.js --date 2026-06-27 --no-commit

Environment:
  SLEEP_CYCLE_DB or CIRCULATION_DB
  SHARED_FRONTIER_PATH
  SLEEP_CYCLE_RECEIPT_DIR
  SLEEP_CYCLE_LIMIT_PER_TABLE
`);
}

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timestampForFilename(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function stableJson(value) {
  return JSON.stringify(sortForStableJson(value), null, 2);
}

function sortForStableJson(value) {
  if (Array.isArray(value)) return value.map(sortForStableJson);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).sort().reduce((acc, key) => {
    acc[key] = sortForStableJson(value[key]);
    return acc;
  }, {});
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex").toUpperCase();
}

function ensureDirectory(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function resolveDbPath(explicitDb) {
  if (explicitDb) return path.resolve(explicitDb);
  return DEFAULT_DB_CANDIDATES.find((candidate) => fs.existsSync(candidate)) || null;
}

function quoteIdent(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

function readTables(db) {
  return db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all().map((row) => row.name);
}

function readColumns(db, table) {
  return db.prepare(`PRAGMA table_info(${quoteIdent(table)})`).all().map((column) => column.name);
}

function pickTimestampColumn(columns) {
  const byLower = new Map(columns.map((column) => [column.toLowerCase(), column]));
  for (const candidate of TIMESTAMP_COLUMNS) {
    if (byLower.has(candidate)) return byLower.get(candidate);
  }
  return null;
}

function pickFirst(row, keys) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(row, key) && row[key] !== null && row[key] !== undefined && String(row[key]).trim() !== "") {
      return String(row[key]).trim();
    }
  }
  return null;
}

function normalizeStatus(row) {
  const status = pickFirst(row, ["status", "state", "result", "kind", "type"]);
  return status ? status.toUpperCase() : "UNKNOWN";
}

function parseTimestamp(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const millis = value > 10_000_000_000 ? value : value * 1000;
    const parsed = new Date(millis);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const text = String(value).trim();
  if (!text) return null;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const dateOnly = new Date(`${text.slice(0, 10)}T00:00:00`);
    return Number.isNaN(dateOnly.getTime()) ? null : dateOnly;
  }
  return null;
}

function isDateOnLocalDay(value, targetDate) {
  const parsed = parseTimestamp(value);
  if (!parsed) return false;
  return localDateString(parsed) === targetDate;
}

function summarizeRow(table, row, timestampColumn) {
  const status = normalizeStatus(row);
  return {
    table,
    rowid: row.__rowid ?? null,
    packet_id: pickFirst(row, ["packet_id", "packetId", "id", "receipt_id", "receiptId", "mission"]) || `row-${row.__rowid}`,
    mission: pickFirst(row, ["mission", "title", "name", "description"]) || "UNKNOWN",
    owner: pickFirst(row, ["owner", "producer", "reader", "writer", "assignee"]) || "UNKNOWN",
    status,
    timestamp: timestampColumn ? String(row[timestampColumn] ?? "") : null,
    artifact: pickFirst(row, ["artifact_path", "artifact", "path", "target_path", "derived_artifact"]),
  };
}

function queryDailyActions(dbPath, targetDate, limitPerTable) {
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const tables = readTables(db);
    const tableSummaries = [];
    const completedPackets = [];
    const blockers = [];
    const warnings = [];

    for (const table of tables) {
      const columns = readColumns(db, table);
      const timestampColumn = pickTimestampColumn(columns);
      if (!timestampColumn) {
        tableSummaries.push({
          table,
          columns_seen: columns,
          rows_today: 0,
          skipped_reason: "NO_TIMESTAMP_COLUMN",
        });
        continue;
      }

      const rows = db.prepare(`
        SELECT rowid AS __rowid, *
        FROM ${quoteIdent(table)}
        ORDER BY rowid DESC
        LIMIT ?
      `).all(limitPerTable);
      const rowsToday = rows.filter((row) => isDateOnLocalDay(row[timestampColumn], targetDate));
      const summarized = rowsToday.map((row) => summarizeRow(table, row, timestampColumn));
      const completed = summarized.filter((row) => COMPLETED_STATUSES.has(row.status));
      const blocked = summarized.filter((row) => BLOCKER_STATUSES.has(row.status));

      completedPackets.push(...completed);
      blockers.push(...blocked.map((row) => ({
        blocker_id: row.packet_id,
        source_table: table,
        mission: row.mission,
        owner: row.owner,
        status: row.status,
        timestamp: row.timestamp,
      })));

      tableSummaries.push({
        table,
        timestamp_column: timestampColumn,
        columns_seen: columns,
        rows_sampled: rows.length,
        rows_today: rowsToday.length,
        completed_count: completed.length,
        blocker_count: blocked.length,
        other_count: summarized.length - completed.length - blocked.length,
      });
    }

    if (completedPackets.length === 0) {
      warnings.push("No completed packets were found for the selected day in readable timestamped tables.");
    }

    return {
      query_status: "READBACK_PROVEN",
      db_path: dbPath,
      tables_seen: tables,
      table_summaries: tableSummaries,
      completed_packets: completedPackets,
      blockers,
      warnings,
    };
  } finally {
    db.close();
  }
}

function blockerSummary(options, dbPath) {
  return {
    query_status: "BLOCKER",
    db_path: dbPath,
    searched_paths: options.db ? [path.resolve(options.db)] : DEFAULT_DB_CANDIDATES,
    tables_seen: [],
    table_summaries: [],
    completed_packets: [],
    blockers: [{
      blocker_id: "CIRCULATION_DB_MISSING",
      source_table: null,
      mission: "BIRD_0036_SWANSON_DAILY_STATE_SNAPSHOT",
      owner: "Swanson@Doss",
      status: "BLOCKER",
      timestamp: new Date().toISOString(),
      missing_path: options.db ? path.resolve(options.db) : DEFAULT_DB_CANDIDATES[0],
      next_owner: "Swanson@Doss",
      next_action: "Create or point SLEEP_CYCLE_DB/CIRCULATION_DB at the real production circulation.db before claiming daily action readback.",
    }],
    warnings: ["circulation.db was not found; no daily packet rows were queried."],
  };
}

function buildSnapshot(options, dailyReadback) {
  const createdAt = new Date().toISOString();
  const snapshotId = `SLEEP_CYCLE_${options.date.replaceAll("-", "")}_${timestampForFilename(new Date())}`;
  const status = dailyReadback.query_status === "READBACK_PROVEN" ? "ARTIFACT" : "BLOCKER";
  const completedPackets = dailyReadback.completed_packets || [];
  const blockers = dailyReadback.blockers || [];

  return {
    snapshot_id: snapshotId,
    packet_id: "BIRD_0036_SWANSON_DAILY_STATE_SNAPSHOT",
    owner: "Swanson@Doss",
    machine: "Doss",
    stream: "INFRASTRUCTURE / MEMORY",
    created_at: createdAt,
    date: options.date,
    status,
    query_status: dailyReadback.query_status,
    circulation_db: dailyReadback.db_path || null,
    completed_packet_count: completedPackets.length,
    blocker_count: blockers.length,
    built_today: completedPackets.map((packet) => ({
      packet_id: packet.packet_id,
      mission: packet.mission,
      owner: packet.owner,
      status: packet.status,
      artifact: packet.artifact || null,
      source_table: packet.table,
      timestamp: packet.timestamp,
    })),
    blocking_next_day: blockers,
    table_summaries: dailyReadback.table_summaries,
    warnings: dailyReadback.warnings,
    raw_receipts_deleted: false,
    rule: "Sleep cycle aggregates today's ledger into shared_frontier.json. It does not delete raw receipts.",
  };
}

function readFrontier(frontierPath) {
  if (!fs.existsSync(frontierPath)) {
    return {
      frontier_id: "SHARED_FRONTIER_V0",
      owner: "Swanson@Doss",
      source_truth_rule: "GitHub origin/main remains canonical. Review branches and local runs are evidence until human-gated promotion.",
      created_at: new Date().toISOString(),
      updated_at: null,
      current_day: null,
      next_bootloader: null,
      daily_state_snapshots: [],
    };
  }
  return JSON.parse(fs.readFileSync(frontierPath, "utf8"));
}

function writeFrontier(frontierPath, snapshot) {
  ensureDirectory(path.dirname(frontierPath));
  const frontier = readFrontier(frontierPath);
  const existingSnapshots = Array.isArray(frontier.daily_state_snapshots)
    ? frontier.daily_state_snapshots
    : [];
  const snapshots = [...existingSnapshots, snapshot].slice(-30);

  const updated = {
    ...frontier,
    updated_at: snapshot.created_at,
    current_day: snapshot,
    next_bootloader: {
      read_this_first: "foreman/source-truth/shared_frontier.json",
      date: snapshot.date,
      status: snapshot.status,
      completed_packet_count: snapshot.completed_packet_count,
      blocker_count: snapshot.blocker_count,
      blocking_next_day: snapshot.blocking_next_day,
      warning: snapshot.status === "BLOCKER"
        ? "Daily state snapshot exists, but live ledger readback is blocked."
        : "Daily state snapshot read back today's ledger.",
    },
    daily_state_snapshots: snapshots,
  };

  fs.writeFileSync(frontierPath, `${stableJson(updated)}\n`, "utf8");
  return updated;
}

function writeReceipt(receiptDir, snapshot, frontierPath) {
  ensureDirectory(receiptDir);
  const frontierSha = sha256File(frontierPath);
  const receipt = {
    receipt_id: `${snapshot.snapshot_id}_RECEIPT`,
    packet_id: snapshot.packet_id,
    owner: snapshot.owner,
    status: snapshot.status,
    created_at: new Date().toISOString(),
    frontier_path: frontierPath,
    frontier_sha256: frontierSha,
    circulation_db: snapshot.circulation_db,
    completed_packet_count: snapshot.completed_packet_count,
    blocker_count: snapshot.blocker_count,
    raw_receipts_deleted: false,
    commit_expected: true,
  };
  const receiptPath = path.join(receiptDir, `${snapshot.snapshot_id}_RECEIPT.json`);
  fs.writeFileSync(receiptPath, `${stableJson(receipt)}\n`, "utf8");
  return {
    receipt_path: receiptPath,
    receipt_sha256: sha256File(receiptPath),
  };
}

function git(args, options = {}) {
  const output = execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: options.stdio || ["ignore", "pipe", "pipe"],
  });
  return typeof output === "string" ? output.trim() : "";
}

function commitState(paths, snapshot) {
  const relativePaths = paths.map((filePath) => path.relative(REPO_ROOT, filePath));
  git(["add", "--", ...relativePaths], { stdio: "ignore" });
  try {
    git(["diff", "--cached", "--quiet"], { stdio: "ignore" });
    return {
      commit_status: "NO_CHANGES",
      commit_hash: null,
      committed_paths: relativePaths,
    };
  } catch {
    const message = `Update shared frontier sleep cycle ${snapshot.date}`;
    git(["commit", "-m", message, "--", ...relativePaths], { stdio: "inherit" });
    return {
      commit_status: "COMMITTED",
      commit_hash: git(["rev-parse", "HEAD"]),
      committed_paths: relativePaths,
    };
  }
}

function run(options) {
  const dbPath = resolveDbPath(options.db);
  const dailyReadback = dbPath && fs.existsSync(dbPath)
    ? queryDailyActions(dbPath, options.date, options.limitPerTable)
    : blockerSummary(options, dbPath);

  const snapshot = buildSnapshot(options, dailyReadback);
  const frontierPath = path.resolve(options.frontier);
  writeFrontier(frontierPath, snapshot);
  const receiptInfo = writeReceipt(path.resolve(options.receiptDir), snapshot, frontierPath);

  const commitInfo = options.commit
    ? commitState([frontierPath, receiptInfo.receipt_path], snapshot)
    : {
        commit_status: "SKIPPED_BY_FLAG",
        commit_hash: null,
        committed_paths: [
          path.relative(REPO_ROOT, frontierPath),
          path.relative(REPO_ROOT, receiptInfo.receipt_path),
        ],
      };

  return {
    status: "ARTIFACT",
    packet_id: snapshot.packet_id,
    snapshot_id: snapshot.snapshot_id,
    query_status: snapshot.query_status,
    frontier_path: frontierPath,
    frontier_sha256: sha256File(frontierPath),
    receipt_path: receiptInfo.receipt_path,
    receipt_sha256: receiptInfo.receipt_sha256,
    completed_packet_count: snapshot.completed_packet_count,
    blocker_count: snapshot.blocker_count,
    commit: commitInfo,
    raw_receipts_deleted: false,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  try {
    const result = run(options);
    if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    else process.stdout.write(`${result.status} ${result.snapshot_id}\n`);
    process.exit(0);
  } catch (error) {
    const result = {
      status: "BLOCKER",
      packet_id: "BIRD_0036_SWANSON_DAILY_STATE_SNAPSHOT",
      message: error.message,
      stack: error.stack,
      raw_receipts_deleted: false,
    };
    if (options.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    else process.stderr.write(`${result.status}: ${result.message}\n`);
    process.exit(1);
  }
}

main();
