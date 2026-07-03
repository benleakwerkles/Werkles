#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

const MESSAGE_ROOT = path.join(ROOT, "foreman", "messages");
const OUTBOX_DIR = path.join(MESSAGE_ROOT, "outbox");
const INBOX_DIR = path.join(MESSAGE_ROOT, "inbox");
const RECEIPTS_DIR = path.join(MESSAGE_ROOT, "receipts");
const PICKUP_PATH = path.join(ROOT, "data", "organism", "receipt_pickup.jsonl");

function rel(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function fileInfo(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return {
      exists: true,
      path: rel(filePath),
      size_bytes: stat.size,
      modified_at: stat.mtime.toISOString()
    };
  } catch {
    return {
      exists: false,
      path: rel(filePath)
    };
  }
}

function listJsonFiles(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => {
        const fullPath = path.join(dir, entry.name);
        return { fullPath, stat: fs.statSync(fullPath) };
      })
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  } catch {
    return [];
  }
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const packetIdFlag = args.findIndex((arg) => arg === "--packet-id");
  if (packetIdFlag >= 0) return args[packetIdFlag + 1] || "";

  const positional = args.find((arg) => !arg.startsWith("--"));
  return positional || "";
}

function latestPacketId() {
  const latest = listJsonFiles(OUTBOX_DIR)[0] || listJsonFiles(INBOX_DIR)[0];
  if (!latest) return "";
  const parsed = readJson(latest.fullPath);
  return typeof parsed?.packet_id === "string" ? parsed.packet_id : path.basename(latest.fullPath, ".json");
}

function pickupRecordsForPacket(packetId) {
  try {
    return fs
      .readFileSync(PICKUP_PATH, "utf8")
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
      .filter((record) => record?.linked_packet_id === packetId);
  } catch {
    return [];
  }
}

function receiptsForPacket(packetId) {
  return listJsonFiles(RECEIPTS_DIR)
    .map(({ fullPath }) => ({ fullPath, receipt: readJson(fullPath) }))
    .filter(({ receipt }) => receipt?.packet_id === packetId)
    .map(({ fullPath, receipt }) => ({
      ...fileInfo(fullPath),
      receipt_id: receipt.receipt_id,
      status: receipt.status,
      message: receipt.message,
      created_at: receipt.created_at
    }));
}

function tracePacket(packetId) {
  const outboxPath = path.join(OUTBOX_DIR, `${packetId}.json`);
  const inboxPath = path.join(INBOX_DIR, `${packetId}.json`);
  const outboxPacket = readJson(outboxPath);
  const inboxPacket = readJson(inboxPath);
  const receipts = receiptsForPacket(packetId);
  const pickup = pickupRecordsForPacket(packetId);

  return {
    ok: Boolean(outboxPacket || inboxPacket || receipts.length || pickup.length),
    packet_id: packetId,
    outbox: {
      ...fileInfo(outboxPath),
      status: outboxPacket?.status || "MISSING",
      target: [outboxPacket?.target_aeye, outboxPacket?.target_machine].filter(Boolean).join("@") || "UNKNOWN"
    },
    inbox: {
      ...fileInfo(inboxPath),
      status: inboxPacket?.status || "MISSING",
      target: [inboxPacket?.target_aeye, inboxPacket?.target_machine].filter(Boolean).join("@") || "UNKNOWN"
    },
    receipts,
    receipt_pickup: pickup.map((record) => ({
      receipt_id: record.receipt_id,
      status_guess: record.status_guess,
      path: record.path,
      timestamp: record.timestamp
    })),
    verdict:
      outboxPacket?.status === "SENT" && inboxPacket && receipts.length > 0
        ? "PASS"
        : "PARTIAL"
  };
}

const requestedPacketId = parseArgs(process.argv);
const packetId = requestedPacketId || latestPacketId();

if (!packetId) {
  console.log(
    JSON.stringify(
      {
        ok: false,
        verdict: "FAIL",
        error: "No packet id supplied and no packet files found.",
        watched_paths: [rel(OUTBOX_DIR), rel(INBOX_DIR), rel(RECEIPTS_DIR), rel(PICKUP_PATH)]
      },
      null,
      2
    )
  );
  process.exitCode = 1;
} else {
  const trace = tracePacket(packetId);
  console.log(JSON.stringify(trace, null, 2));
  if (!trace.ok) process.exitCode = 1;
}
