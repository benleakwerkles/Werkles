#!/usr/bin/env node
/**
 * SkyPooka queue drain — local Dink/courier pickup tool for mobile FIRE/HOLD requests.
 *
 * Mobile writes queue artifacts to foreman/skypooka/{fire,hold}-queue/.
 * This tool is the desk-side half of the loop: list what the phone queued,
 * ack items you are taking, and mark them done with a note. It never sends
 * relay traffic itself — handing the packet to relay courier / Edge Bay
 * remains a separate, human-gated step.
 *
 * Usage:
 *   node scripts/foreman/skypooka-queue.mjs list
 *   node scripts/foreman/skypooka-queue.mjs ack <id> [--by DINK_BETSY]
 *   node scripts/foreman/skypooka-queue.mjs done <id> [--note "delivered via courier run 123"]
 *   node scripts/foreman/skypooka-queue.mjs archive          # move done items to archive/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const BASE_DIR = path.join(REPO_ROOT, "foreman", "skypooka");
const QUEUE_DIRS = [
  path.join(BASE_DIR, "fire-queue"),
  path.join(BASE_DIR, "hold-queue")
];
const ARCHIVE_DIR = path.join(BASE_DIR, "archive");
const RECEIPT_LOG = path.join(BASE_DIR, "QUEUE_LOG.md");

function readArgValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

function listQueueFiles() {
  const items = [];
  for (const dir of QUEUE_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith(".json")) continue;
      const filePath = path.join(dir, name);
      try {
        const record = JSON.parse(fs.readFileSync(filePath, "utf8"));
        items.push({ filePath, record });
      } catch {
        console.error(`SKIP unreadable: ${path.relative(REPO_ROOT, filePath)}`);
      }
    }
  }
  return items.sort((a, b) => String(b.record.created_at).localeCompare(String(a.record.created_at)));
}

function writeRecord(filePath, record) {
  fs.writeFileSync(filePath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
}

function appendLog(line) {
  fs.mkdirSync(BASE_DIR, { recursive: true });
  if (!fs.existsSync(RECEIPT_LOG)) {
    fs.writeFileSync(RECEIPT_LOG, "# SkyPooka Queue Log\n\nAppend-only pickup log for mobile FIRE/HOLD queue artifacts.\n\n", "utf8");
  }
  fs.appendFileSync(RECEIPT_LOG, `${line}\n`, "utf8");
}

function findById(id) {
  const item = listQueueFiles().find((entry) => entry.record.id === id);
  if (!item) {
    console.error(`NOT_FOUND: no queue artifact with id ${id}`);
    process.exit(1);
  }
  return item;
}

const command = process.argv[2] || "list";

if (command === "list") {
  const items = listQueueFiles();
  if (items.length === 0) {
    console.log("SkyPooka queue empty.");
    process.exit(0);
  }
  for (const { filePath, record } of items) {
    const rel = path.relative(REPO_ROOT, filePath).replace(/\\/g, "/");
    console.log(
      `${record.status.padEnd(6)} ${record.action.padEnd(4)} ${record.id}  ${record.subject}  -> ${record.target}  (${record.created_at})  [${rel}]`
    );
  }
  process.exit(0);
}

if (command === "ack") {
  const id = process.argv[3];
  if (!id) {
    console.error("Usage: skypooka-queue.mjs ack <id> [--by NAME]");
    process.exit(1);
  }
  const by = readArgValue("--by", "LOCAL_OPERATOR");
  const { filePath, record } = findById(id);
  if (record.status !== "queued") {
    console.error(`INVALID_STATE: ${id} is ${record.status}, expected queued`);
    process.exit(1);
  }
  record.status = "acked";
  record.acked_at = new Date().toISOString();
  record.acked_by = by;
  writeRecord(filePath, record);
  appendLog(`- ${record.acked_at} ACK ${record.id} (${record.action} ${record.subject}) by ${by}`);
  console.log(`ACKED ${record.id} by ${by}`);
  process.exit(0);
}

if (command === "done") {
  const id = process.argv[3];
  if (!id) {
    console.error("Usage: skypooka-queue.mjs done <id> [--note TEXT]");
    process.exit(1);
  }
  const note = readArgValue("--note", "");
  const { filePath, record } = findById(id);
  if (record.status === "done") {
    console.error(`INVALID_STATE: ${id} already done`);
    process.exit(1);
  }
  record.status = "done";
  record.done_at = new Date().toISOString();
  if (note) record.done_note = note;
  writeRecord(filePath, record);
  appendLog(`- ${record.done_at} DONE ${record.id} (${record.action} ${record.subject})${note ? ` — ${note}` : ""}`);
  console.log(`DONE ${record.id}`);
  process.exit(0);
}

if (command === "archive") {
  const items = listQueueFiles().filter((entry) => entry.record.status === "done");
  if (items.length === 0) {
    console.log("Nothing to archive (no done items).");
    process.exit(0);
  }
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  for (const { filePath, record } of items) {
    const dest = path.join(ARCHIVE_DIR, path.basename(filePath));
    fs.renameSync(filePath, dest);
    appendLog(`- ${new Date().toISOString()} ARCHIVE ${record.id}`);
    console.log(`ARCHIVED ${record.id}`);
  }
  process.exit(0);
}

console.error(`Unknown command: ${command}. Use list | ack | done | archive.`);
process.exit(1);
