#!/usr/bin/env node

const chokidar = require("chokidar");
const { mkdir, rename, stat, writeFile } = require("node:fs/promises");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const INTAKE_DIR = path.join(ROOT, "intake");
const PROCESSING_DIR = path.join(ROOT, "processing");
const LOG_DIR = path.join(ROOT, "logs");
const EVENT_LOG = path.join(LOG_DIR, "brainstem-events.jsonl");

function slash(value) {
  return value.split(path.sep).join("/");
}

function rel(value) {
  return slash(path.relative(ROOT, value));
}

async function appendEvent(event) {
  await mkdir(LOG_DIR, { recursive: true });
  await writeFile(EVENT_LOG, `${JSON.stringify(event)}\n`, { encoding: "utf8", flag: "a" });
}

async function uniqueDestination(filePath) {
  const parsed = path.parse(filePath);
  let candidate = path.join(PROCESSING_DIR, parsed.base);
  let suffix = 1;

  while (true) {
    try {
      await stat(candidate);
      candidate = path.join(PROCESSING_DIR, `${parsed.name}.${suffix}${parsed.ext}`);
      suffix += 1;
    } catch {
      return candidate;
    }
  }
}

async function moveToProcessing(filePath) {
  await mkdir(PROCESSING_DIR, { recursive: true });
  const destination = await uniqueDestination(filePath);
  await rename(filePath, destination);

  const event = {
    event_type: "brainstem_file_moved",
    timestamp: new Date().toISOString(),
    source_path: rel(filePath),
    destination_path: rel(destination),
    status: "MOVED_TO_PROCESSING"
  };
  await appendEvent(event);
  console.log(`[brainstem] moved ${event.source_path} -> ${event.destination_path}`);
}

async function main() {
  await mkdir(INTAKE_DIR, { recursive: true });
  await mkdir(PROCESSING_DIR, { recursive: true });
  await mkdir(LOG_DIR, { recursive: true });

  const started = {
    event_type: "brainstem_started",
    timestamp: new Date().toISOString(),
    intake_path: rel(INTAKE_DIR),
    processing_path: rel(PROCESSING_DIR),
    log_path: rel(EVENT_LOG)
  };
  await appendEvent(started);
  console.log(`[brainstem] watching ${started.intake_path}`);

  const watcher = chokidar.watch(INTAKE_DIR, {
    ignoreInitial: true,
    depth: 0,
    awaitWriteFinish: {
      stabilityThreshold: 250,
      pollInterval: 100
    }
  });

  watcher.on("add", (filePath) => {
    moveToProcessing(filePath).catch(async (error) => {
      const failed = {
        event_type: "brainstem_move_failed",
        timestamp: new Date().toISOString(),
        source_path: rel(filePath),
        status: "MOVE_FAILED",
        error: error instanceof Error ? error.message : String(error)
      };
      await appendEvent(failed);
      console.error(`[brainstem] failed ${failed.source_path}: ${failed.error}`);
    });
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
