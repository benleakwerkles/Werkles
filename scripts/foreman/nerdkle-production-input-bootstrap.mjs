#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..", "..");
const writeMode = process.argv.includes("--write");
const dbPath = path.resolve(valueAfter("--db") || process.env.NERDKLE_PRODUCTION_DB || "C:\\tinkarden\\server\\circulation.db");

function valueAfter(flag) {
  const exact = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (exact) return exact.slice(flag.length + 1);
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

function repoPath(...parts) {
  return path.join(repoRoot, ...parts);
}

function rel(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex").toUpperCase();
}

function quoteIdent(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

function inspectDb(DatabaseSync, filePath) {
  if (!existsSync(filePath)) {
    return {
      exists: false,
      tables: [],
      table_shapes: [],
      byte_count: 0,
      sha256: null,
    };
  }

  const db = new DatabaseSync(filePath, { readOnly: true });
  try {
    const tables = db.prepare(`
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all().map((row) => row.name);
    const tableShapes = tables.map((table) => ({
      table,
      columns: db.prepare(`PRAGMA table_info(${quoteIdent(table)})`).all().map((column) => column.name),
      row_count: db.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdent(table)}`).get().count,
    }));
    return {
      exists: true,
      tables,
      table_shapes: tableShapes,
      byte_count: statSync(filePath).size,
      sha256: sha256File(filePath),
    };
  } finally {
    db.close();
  }
}

function ensureSchema(DatabaseSync, filePath) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  const db = new DatabaseSync(filePath);
  try {
    db.exec(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS LiveReceipt (
        id TEXT PRIMARY KEY,
        receipt_id TEXT,
        packet_id TEXT,
        mission TEXT,
        producer TEXT,
        owner TEXT,
        status TEXT NOT NULL,
        ASSIMILATED INTEGER NOT NULL DEFAULT 0,
        receipt TEXT,
        payload TEXT,
        artifact_path TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS shadow_cache (
        id TEXT PRIMARY KEY,
        kind TEXT,
        type TEXT,
        status TEXT,
        state TEXT,
        operator_signature TEXT,
        operator_signature_requested_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        target_path TEXT,
        payload TEXT
      );

      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL,
        description TEXT NOT NULL
      );
    `);

    db.prepare(`
      INSERT OR IGNORE INTO schema_migrations (id, applied_at, description)
      VALUES (?, ?, ?)
    `).run(
      "NERDKLE_PRODUCTION_INPUT_BOOTSTRAP_V0",
      new Date().toISOString(),
      "Create minimum production ledger schema for LiveReceipt and shadow_cache without inserting fake work rows."
    );
  } finally {
    db.close();
  }
}

const { DatabaseSync } = await import("node:sqlite");
const before = inspectDb(DatabaseSync, dbPath);
if (writeMode) ensureSchema(DatabaseSync, dbPath);
const after = inspectDb(DatabaseSync, dbPath);

const readback = {
  readback_id: "NERDKLE_PRODUCTION_INPUT_BOOTSTRAP_READBACK",
  created_at: new Date().toISOString(),
  owner: "Swanson@Doss",
  machine: "Doss",
  status: writeMode ? "ARTIFACT" : before.exists ? "ACK" : "BLOCKER",
  mode: writeMode ? "WRITE" : "READ_ONLY",
  db_path: dbPath,
  before,
  after,
  rows_inserted_as_work: 0,
  fake_receipts_created: false,
  raw_receipts_deleted: false,
  rule: "Create schema only. Do not insert fake LiveReceipt or shadow_cache work rows.",
};

if (writeMode) {
  const readbackDir = repoPath("foreman", "source-truth", "readbacks");
  const receiptDir = repoPath("foreman", "source-truth", "receipts", "inputs");
  mkdirSync(readbackDir, { recursive: true });
  mkdirSync(receiptDir, { recursive: true });

  const readbackPath = path.join(readbackDir, "NERDKLE_PRODUCTION_INPUT_BOOTSTRAP_READBACK.json");
  writeFileSync(readbackPath, `${JSON.stringify(readback, null, 2)}\n`, "utf8");
  const receipt = {
    receipt_id: "NERDKLE_PRODUCTION_INPUT_BOOTSTRAP_RECEIPT",
    mission: "NERDKLE_PRODUCTION_INPUT_BOOTSTRAP",
    owner: "Swanson@Doss",
    created_at: new Date().toISOString(),
    status: "ARTIFACT",
    db_path: dbPath,
    db_sha256: after.sha256,
    db_byte_count: after.byte_count,
    readback_path: rel(readbackPath),
    readback_hash: sha256File(readbackPath),
    readback_byte_count: statSync(readbackPath).size,
    fake_receipts_created: false,
    rows_inserted_as_work: 0,
  };
  const receiptPath = path.join(receiptDir, "NERDKLE_PRODUCTION_INPUT_BOOTSTRAP_RECEIPT.json");
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  readback.receipt = {
    path: rel(receiptPath),
    hash: sha256File(receiptPath),
    byte_count: statSync(receiptPath).size,
  };
}

process.stdout.write(`${JSON.stringify(readback, null, 2)}\n`);
