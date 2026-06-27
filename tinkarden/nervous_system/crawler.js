#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const TINKARDEN_ROOT = path.resolve(__dirname, "..");
const DEFAULT_DB = path.join(TINKARDEN_ROOT, "server", "circulation.db");
const DEFAULT_QUEUE = path.join(TINKARDEN_ROOT, "intake", "speaker_queue");
const DEFAULT_INTERVAL_MS = Number(process.env.RECEIPT_CRAWLER_INTERVAL_MS || 60_000);
const DEFAULT_LIMIT = Number(process.env.RECEIPT_CRAWLER_LIMIT || 25);

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

function slug(value) {
  return String(value || "UNKNOWN")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "UNKNOWN";
}

function parseArgs(argv) {
  const options = {
    db: process.env.CIRCULATION_DB || DEFAULT_DB,
    queue: process.env.SPEAKER_QUEUE_DIR || DEFAULT_QUEUE,
    intervalMs: DEFAULT_INTERVAL_MS,
    limit: DEFAULT_LIMIT,
    once: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--db") options.db = argv[++i];
    else if (arg.startsWith("--db=")) options.db = arg.slice("--db=".length);
    else if (arg === "--queue") options.queue = argv[++i];
    else if (arg.startsWith("--queue=")) options.queue = arg.slice("--queue=".length);
    else if (arg === "--interval-ms") options.intervalMs = Number(argv[++i]);
    else if (arg.startsWith("--interval-ms=")) options.intervalMs = Number(arg.slice("--interval-ms=".length));
    else if (arg === "--limit") options.limit = Number(argv[++i]);
    else if (arg.startsWith("--limit=")) options.limit = Number(arg.slice("--limit=".length));
    else if (arg === "--once") options.once = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function markdownFor(row) {
  const body = row.receipt || row.payload || JSON.stringify(row, null, 2);
  return `---
receipt_id: ${row.receipt_id || row.id || "UNKNOWN"}
packet_id: ${row.packet_id || "UNKNOWN"}
mission: ${row.mission || "UNKNOWN"}
producer: ${row.producer || row.owner || "UNKNOWN"}
source: C:\\tinkarden\\server\\circulation.db
status: SPEAKER_QUEUE_CANDIDATE
created_at: ${new Date().toISOString()}
---

# Receipt Pickup

${body}
`;
}

function crawlOnce(options) {
  if (!fs.existsSync(options.db)) {
    return {
      event: "RECEIPT_CRAWLER_BLOCKED",
      status: "BLOCKER",
      missing_db: options.db,
      moved: 0,
    };
  }

  fs.mkdirSync(options.queue, { recursive: true });
  const db = new DatabaseSync(options.db);
  try {
    const rows = db.prepare(`
      SELECT rowid AS _rowid, *
      FROM LiveReceipt
      WHERE UPPER(CAST(status AS TEXT)) = 'SUCCESS'
        AND (
          ASSIMILATED IS NULL
          OR ASSIMILATED = 0
          OR UPPER(CAST(ASSIMILATED AS TEXT)) IN ('FALSE', 'NO', '')
        )
      ORDER BY COALESCE(updated_at, created_at, id, _rowid)
      LIMIT ?
    `).all(options.limit);

    const moved = [];
    for (const row of rows) {
      const md = markdownFor(row);
      const name = `${new Date().toISOString().replace(/[:.]/g, "-")}_${slug(row.receipt_id || row.id || row._rowid)}.md`;
      const outputPath = path.join(options.queue, name);
      fs.writeFileSync(outputPath, md, "utf8");
      db.prepare("UPDATE LiveReceipt SET ASSIMILATED = 1, updated_at = ? WHERE rowid = ?")
        .run(new Date().toISOString(), row._rowid);
      moved.push({
        receipt_id: row.receipt_id || row.id || String(row._rowid),
        path: outputPath,
        hash: sha256(md),
      });
    }

    return {
      event: "RECEIPT_CRAWLER_SCAN",
      status: "ARTIFACT",
      db: options.db,
      queue: options.queue,
      moved: moved.length,
      receipts: moved,
    };
  } finally {
    db.close();
  }
}

function log(event) {
  process.stdout.write(`${JSON.stringify({ ...event, logged_at: new Date().toISOString() })}\n`);
}

const options = parseArgs(process.argv.slice(2));
log(crawlOnce(options));
if (!options.once) {
  setInterval(() => {
    try {
      log(crawlOnce(options));
    } catch (error) {
      log({ event: "RECEIPT_CRAWLER_ERROR", status: "BLOCKER", error: error.message });
    }
  }, options.intervalMs);
}

