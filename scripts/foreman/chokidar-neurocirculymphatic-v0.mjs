#!/usr/bin/env node
import chokidar from "chokidar";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const EVENTS_PATH = path.join(ROOT, "data", "organism", "events.jsonl");
const DETECTED_BY = "Maker@Betsy";

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

function eventTypeFor(chokidarEvent, destinationGuess) {
  if (destinationGuess === "aeye_message_outbox" && chokidarEvent === "add") return "packet_dispatched";
  if (destinationGuess === "aeye_message_outbox" && chokidarEvent === "change") return "packet_updated";
  if (destinationGuess === "aeye_message_inbox" && chokidarEvent === "add") return "packet_delivered";
  if (destinationGuess === "aeye_message_receipts" && chokidarEvent === "add") return "packet_receipted";

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
  const event = {
    timestamp: new Date().toISOString(),
    event_type: eventTypeFor(chokidarEvent, destinationGuess),
    source_path: rel(filePath),
    file_name: path.basename(filePath),
    detected_by: DETECTED_BY,
    destination_guess: destinationGuess,
    sha256: sha256(contents),
    size_bytes: stat.size,
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

startWatcher();
