#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const TINKARDEN_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TINKARDEN_ROOT, "..");
const SPEAKER_QUEUE_DIR = path.join(TINKARDEN_ROOT, "intake", "speaker_queue");
const CHANGE_CAPSULE_DIR = path.join(TINKARDEN_ROOT, "change_capsules");

function slash(value) {
  return value.split(path.sep).join("/");
}

function rel(value) {
  return slash(path.relative(REPO_ROOT, value));
}

function ensureDirs() {
  fs.mkdirSync(SPEAKER_QUEUE_DIR, { recursive: true });
  fs.mkdirSync(CHANGE_CAPSULE_DIR, { recursive: true });
}

function readReceipt(receiptPath) {
  const raw = fs.readFileSync(receiptPath, "utf8");
  return { raw, parsed: JSON.parse(raw) };
}

function text(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function firstText(receipt, fields, fallback = "") {
  for (const field of fields) {
    const value = field.split(".").reduce((current, key) => current && current[key], receipt);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function safeSlug(value) {
  return text(value, "change_capsule")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 96)
    .toLowerCase();
}

function actionTaken(receipt) {
  return firstText(receipt, [
    "action_taken",
    "action",
    "title",
    "mission",
    "artifact",
    "artifact_path",
    "status",
    "status_guess",
    "event_type",
    "packet_id",
    "receipt_id"
  ], "Raw receipt captured");
}

function timestamp(receipt) {
  return firstText(receipt, [
    "timestamp",
    "created_at",
    "generated_at",
    "paid_at",
    "finished_at",
    "updated_at"
  ], new Date().toISOString());
}

function owner(receipt) {
  return firstText(receipt, [
    "target_aeye",
    "target",
    "owner",
    "owner_aeye",
    "producer",
    "from",
    "machine"
  ], "UNKNOWN_AEYE");
}

function receiptId(receipt, sourcePath) {
  return firstText(receipt, ["receipt_id", "id", "packet_id"], path.basename(sourcePath, ".json"));
}

function whatChanged(receipt) {
  const lines = [];
  const fields = [
    ["receipt_id", "receipt_id"],
    ["packet_id", "packet_id"],
    ["status", "status"],
    ["status_guess", "status_guess"],
    ["action_taken", "action_taken"],
    ["artifact_path", "artifact_path"],
    ["path", "path"]
  ];

  for (const [label, key] of fields) {
    const value = receipt[key];
    if (typeof value === "string" && value.trim()) lines.push(`- ${label}: ${value.trim()}`);
  }

  if (!lines.length) {
    lines.push(`- raw_receipt_keys: ${Object.keys(receipt).join(", ") || "none"}`);
  }

  return lines.join("\n");
}

function buildMarkdown({ receipt, sourcePath, raw }) {
  const action = actionTaken(receipt);
  const rawJson = JSON.stringify(JSON.parse(raw), null, 2);

  return `# Change Capsule — ${action}
timestamp: ${timestamp(receipt)}
owner: ${owner(receipt)}
## what_changed
${whatChanged(receipt)}

## why_it_changed

## who_is_affected
owner: ${owner(receipt)}

## what_is_next

## source_receipt
source_path: ${rel(sourcePath)}

\`\`\`json
${rawJson}
\`\`\`
`;
}

function outputPathFor(receipt, sourcePath) {
  const id = receiptId(receipt, sourcePath);
  return path.join(CHANGE_CAPSULE_DIR, `${safeSlug(id)}.md`);
}

function generateCapsule(receiptPath) {
  ensureDirs();
  if (!receiptPath.endsWith(".json")) return null;

  const absolutePath = path.resolve(REPO_ROOT, receiptPath);
  const { raw, parsed } = readReceipt(absolutePath);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Receipt must be a JSON object: ${rel(absolutePath)}`);
  }

  const capsulePath = outputPathFor(parsed, absolutePath);
  const markdown = buildMarkdown({ receipt: parsed, sourcePath: absolutePath, raw });
  fs.writeFileSync(capsulePath, markdown, "utf8");

  return {
    status: "ARTIFACT",
    source_receipt: rel(absolutePath),
    capsule_path: rel(capsulePath),
    action_taken: actionTaken(parsed),
    timestamp: timestamp(parsed),
    owner: owner(parsed)
  };
}

function processExisting() {
  ensureDirs();
  return fs.readdirSync(SPEAKER_QUEUE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => generateCapsule(path.join(SPEAKER_QUEUE_DIR, name)))
    .filter(Boolean);
}

function debounce(fn, delayMs) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

async function watchQueue() {
  ensureDirs();
  console.log(JSON.stringify({ startup_generated: processExisting() }, null, 2));

  const handle = debounce((filePath) => {
    try {
      const result = generateCapsule(filePath);
      if (result) console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
    }
  }, 150);

  try {
    const { watch } = await import("chokidar");
    const watcher = watch(path.join(SPEAKER_QUEUE_DIR, "*.json"), {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 }
    });
    watcher.on("add", handle);
    watcher.on("change", handle);
    console.log(`[capsule_generator] watching ${rel(SPEAKER_QUEUE_DIR)}`);
  } catch {
    fs.watch(SPEAKER_QUEUE_DIR, (_eventType, filename) => {
      if (!filename || !filename.toString().endsWith(".json")) return;
      handle(path.join(SPEAKER_QUEUE_DIR, filename.toString()));
    });
    console.log(`[capsule_generator] watching ${rel(SPEAKER_QUEUE_DIR)} with fs.watch fallback`);
  }
}

async function main() {
  const command = process.argv[2] || "watch";

  if (command === "process") {
    const receiptPath = process.argv[3];
    if (!receiptPath) throw new Error("process requires a raw receipt path");
    console.log(JSON.stringify(generateCapsule(receiptPath), null, 2));
    return;
  }

  if (command === "once") {
    console.log(JSON.stringify(processExisting(), null, 2));
    return;
  }

  if (command === "watch") {
    await watchQueue();
    return;
  }

  throw new Error("Usage: node capsule_generator.js [watch|once|process <raw_receipt_path>]");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
