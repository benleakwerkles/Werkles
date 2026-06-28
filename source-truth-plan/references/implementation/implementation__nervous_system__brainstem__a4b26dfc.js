#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const chokidar = require("chokidar");

const TINKARDEN_ROOT = path.resolve(__dirname, "..");
const LOG_DIR = path.join(TINKARDEN_ROOT, "logs");
const EVENT_LOG = path.join(LOG_DIR, "brainstem_events.jsonl");
const WATCH_PATHS = [
  path.join(TINKARDEN_ROOT, "intake"),
  path.join(TINKARDEN_ROOT, "server"),
  path.join(TINKARDEN_ROOT, "nervous_system"),
];

function writeEvent(event) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.appendFileSync(EVENT_LOG, `${JSON.stringify({
    organ: "brainstem",
    generated_at: new Date().toISOString(),
    ...event,
  })}\n`, "utf8");
}

writeEvent({
  event: "BRAINSTEM_START",
  watch_paths: WATCH_PATHS,
  rule: "Observe file movement only. Do not route, delete, assimilate, or approve.",
});

const watcher = chokidar.watch(WATCH_PATHS, {
  ignoreInitial: false,
  persistent: true,
  awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  ignored: [
    /(^|[\\/])\../,
    EVENT_LOG,
  ],
});

watcher
  .on("add", (filePath) => writeEvent({ event: "FILE_ADD", path: filePath }))
  .on("change", (filePath) => writeEvent({ event: "FILE_CHANGE", path: filePath }))
  .on("unlink", (filePath) => writeEvent({ event: "FILE_UNLINK", path: filePath }))
  .on("error", (error) => {
    writeEvent({ event: "BRAINSTEM_ERROR", error: error.message });
    process.exitCode = 1;
  });

process.on("SIGINT", async () => {
  writeEvent({ event: "BRAINSTEM_STOP", signal: "SIGINT" });
  await watcher.close();
  process.exit(0);
});

