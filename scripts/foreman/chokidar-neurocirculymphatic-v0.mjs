#!/usr/bin/env node
import chokidar from "chokidar";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const EVENTS_PATH = path.join(ROOT, "data", "organism", "events.jsonl");
const DETECTED_BY = "Maker@Betsy";
const HARVEY_NERDKLE_EVENT_SCHEMA = "harvey_nerdkle_event_v0";

const WATCH_TARGETS = [
  { path: "foreman/handoffs/outbox", destinationGuess: "handoff_outbox" },
  { path: "foreman/handoffs/inbox", destinationGuess: "handoff_inbox" },
  { path: "foreman/receipts", destinationGuess: "foreman_receipts" },
  { path: "foreman/messages/outbox", destinationGuess: "aeye_message_outbox" },
  { path: "foreman/messages/inbox", destinationGuess: "aeye_message_inbox" },
  { path: "foreman/messages/receipts", destinationGuess: "aeye_message_receipts" },
  { path: "foreman/speaker/entries", destinationGuess: "speaker_intake" },
  { path: "tinkerden/dispatch/packets", destinationGuess: "tinkerden_dispatch" },
  { path: "data/tinkerden/receipts", destinationGuess: "tinkerden_receipts" },
];

const recentlySeen = new Map();
const DEDUPE_WINDOW_MS = Number(process.env.CHOKIDAR_NEURO_DEDUPE_MS || 750);

function ensureDirs() {
  fs.mkdirSync(path.dirname(EVENTS_PATH), { recursive: true });

  for (const target of WATCH_TARGETS) {
    fs.mkdirSync(path.join(ROOT, target.path), { recursive: true });
  }
}

function rel(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join("/");
}

function normalizePath(filePath) {
  return path.resolve(ROOT, filePath);
}

function destinationGuessFor(filePath) {
  const relativePath = rel(filePath);
  const target = WATCH_TARGETS.find((candidate) => relativePath.startsWith(`${candidate.path}/`));

  return target?.destinationGuess || "unknown";
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function stamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function safeId(value) {
  return String(value || "")
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function markdownField(text, fieldName) {
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`^\\s*${escaped}\\s*:\\s*` + "`?" + `([^\\r\\n` + "`" + `]+)` + "`?" + `\\s*$`, "im"));
  return match?.[1]?.trim() || null;
}

function jsonStringField(text, fieldName) {
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`"(${escaped})"\\s*:\\s*"([^"]+)"`, "i"));
  return match?.[2]?.trim() || null;
}

function basenameWithoutExtension(filePath) {
  return path.basename(filePath).replace(/\.[^.]+$/, "");
}

function extractIds(filePath, contents) {
  const text = contents.toString("utf8");
  const parsed = safeJsonParse(text);
  const record = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  const fileBase = basenameWithoutExtension(filePath);
  const relativePath = rel(filePath);

  const packetId = firstString(
    record.packet_id,
    record.linked_packet_id,
    record.command_packet_id,
    record.source_packet_id,
    markdownField(text, "PACKET_ID"),
    markdownField(text, "packet_id"),
    jsonStringField(text, "packet_id"),
    jsonStringField(text, "linked_packet_id"),
    jsonStringField(text, "command_packet_id"),
    jsonStringField(text, "source_packet_id"),
    /(^|\/)(packets|outbox|dispatch)\//i.test(relativePath) ? fileBase : null,
  );

  const receiptId = firstString(
    record.receipt_id,
    record.command_receipt_id,
    record.aeye_receipt_id,
    markdownField(text, "RECEIPT_ID"),
    markdownField(text, "receipt_id"),
    jsonStringField(text, "receipt_id"),
    jsonStringField(text, "command_receipt_id"),
    jsonStringField(text, "aeye_receipt_id"),
    /(^|\/)(receipts)\//i.test(relativePath) ? fileBase : null,
  );

  return {
    packet_id: packetId,
    receipt_id: receiptId,
  };
}

function eventIdFor(eventType) {
  return `${eventType}_${stamp()}_${crypto.randomBytes(3).toString("hex")}`;
}

function eventTypeFor(chokidarEvent, destinationGuess, ids) {
  const isAdd = chokidarEvent === "add";
  const isChange = chokidarEvent === "change";

  if ((destinationGuess === "aeye_message_receipts" || destinationGuess === "tinkerden_receipts" || destinationGuess === "foreman_receipts") && ids.packet_id && ids.receipt_id) {
    return "packet_receipted";
  }

  if ((destinationGuess === "aeye_message_outbox" || destinationGuess === "tinkerden_dispatch" || destinationGuess === "handoff_outbox") && isAdd && ids.packet_id) {
    return "packet_dispatched";
  }

  if ((destinationGuess === "aeye_message_inbox" || destinationGuess === "handoff_inbox") && isAdd && ids.packet_id) {
    return "packet_delivered";
  }

  if (chokidarEvent === "add") return "file_created";
  if (chokidarEvent === "change") return "file_changed";

  return `file_${chokidarEvent}`;
}

function shouldSkip(filePath, stat) {
  if (!stat?.isFile()) return true;

  const key = `${filePath}:${stat.size}:${stat.mtimeMs}`;
  const now = Date.now();
  const previous = recentlySeen.get(key);

  if (previous && now - previous < DEDUPE_WINDOW_MS) return true;

  recentlySeen.set(key, now);

  for (const [seenKey, timestamp] of recentlySeen.entries()) {
    if (now - timestamp > DEDUPE_WINDOW_MS * 4) recentlySeen.delete(seenKey);
  }

  return false;
}

function appendEvent(chokidarEvent, filePath, stat) {
  if (shouldSkip(filePath, stat)) return null;

  const contents = fs.readFileSync(filePath);
  const destinationGuess = destinationGuessFor(filePath);
  const ids = extractIds(filePath, contents);
  const eventType = eventTypeFor(chokidarEvent, destinationGuess, ids);
  const event = {
    schema: HARVEY_NERDKLE_EVENT_SCHEMA,
    event_id: eventIdFor(eventType),
    timestamp: new Date().toISOString(),
    event_type: eventType,
    source_path: rel(filePath),
    file_name: path.basename(filePath),
    detected_by: DETECTED_BY,
    destination_guess: destinationGuess,
    sha256: sha256(contents),
    packet_id: ids.packet_id,
    receipt_id: ids.receipt_id,
    size_bytes: stat.size,
    raw_chokidar_event: chokidarEvent,
  };

  fs.appendFileSync(EVENTS_PATH, `${JSON.stringify(event)}\n`, "utf8");
  return event;
}

function startWatcher() {
  ensureDirs();

  const absoluteTargets = WATCH_TARGETS.map((target) => normalizePath(target.path));
  const watcher = chokidar.watch(absoluteTargets, {
    awaitWriteFinish: {
      stabilityThreshold: Number(process.env.CHOKIDAR_NEURO_STABILITY_MS || 500),
      pollInterval: 100,
    },
    ignoreInitial: true,
    persistent: true,
  });

  watcher
    .on("add", (filePath, stat) => {
      const event = appendEvent("add", filePath, stat);
      if (event) console.log(JSON.stringify(event));
    })
    .on("change", (filePath, stat) => {
      const event = appendEvent("change", filePath, stat);
      if (event) console.log(JSON.stringify(event));
    })
    .on("ready", () => {
      console.log(
        JSON.stringify({
          status: "watching",
          detected_by: DETECTED_BY,
          events_path: rel(EVENTS_PATH),
          watched_paths: WATCH_TARGETS.map((target) => target.path),
        }),
      );
    })
    .on("error", (error) => {
      console.error(
        JSON.stringify({
          status: "watcher_error",
          message: error?.message || String(error),
        }),
      );
      process.exitCode = 1;
    });
}

export {
  appendEvent,
  destinationGuessFor,
  eventTypeFor,
  extractIds,
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startWatcher();
}
