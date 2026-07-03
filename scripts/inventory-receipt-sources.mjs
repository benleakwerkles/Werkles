import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUTPUT = join(ROOT, "foreman", "artifacts", "receipt_sources.json");
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", ".git"]);
const TEXT_EXTENSIONS = /\.(md|json|ts|tsx|js|mjs|txt|ps1)$/i;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

function normalizePath(path) {
  return relative(ROOT, path).replace(/\\/g, "/");
}

function findLine(text, pattern) {
  return text.split(/\r?\n/).find((line) => pattern.test(line))?.trim();
}

function cleanIdentity(value) {
  return value
    .replace(/^[-*]\s*/, "")
    .replace(/^from:\s*/i, "")
    .replace(/^to:\s*/i, "")
    .replace(/^producer:\s*/i, "")
    .replace(/^consumer:\s*/i, "")
    .replace(/^owner:\s*/i, "")
    .replace(/^destination:\s*/i, "")
    .replace(/^#\s*/, "")
    .replace(/[`*_]/g, "")
    .trim();
}

function jsonOwnerMachine(text) {
  const owner = text.match(/"owner"\s*:\s*"([^"]+)"/i)?.[1];
  const machine = text.match(/"machine"\s*:\s*"([^"]+)"/i)?.[1];
  if (!owner) return null;
  return machine ? `${owner}@${machine}` : owner;
}

function producerFromText(text, relPath) {
  const from = findLine(text, /^FROM:\s*/i);
  if (from) return cleanIdentity(from);

  const producer = findLine(text, /^producer:\s*/i);
  if (producer) return cleanIdentity(producer);

  const owner = findLine(text, /^owner:\s*/i);
  if (owner) return cleanIdentity(owner);

  const jsonOwner = jsonOwnerMachine(text);
  if (jsonOwner) return jsonOwner;

  const title = findLine(text, /^#\s+/);
  if (title && /^#\s+Cursor\b/i.test(title)) return "Cursor / Smart Factory";
  if (title && /^#\s+Codex\b/i.test(title)) return "Codex Foreman";

  return "UNKNOWN";
}

function consumerFromText(text) {
  const to = findLine(text, /^TO:\s*/i);
  if (to) return cleanIdentity(to);

  const consumer = findLine(text, /^consumer:\s*/i);
  if (consumer) return cleanIdentity(consumer);

  const destination = findLine(text, /^Destination:\s*/i);
  if (destination) return cleanIdentity(destination);

  return "UNKNOWN";
}

function receiptType(relPath, text) {
  if (relPath === "foreman/artifacts/ARTIFACT_REGISTRY_V0.json") return "artifact_registry_receipts";
  if (relPath === "foreman/artifacts/status_rail_v0.json") return "generated_status_receipt_index";
  if (relPath === "foreman/artifacts/receipt_sources.json") return "generated_receipt_source_inventory";
  if (/\/handoffs\/.*RECEIPT.*\.(md|json)$/i.test(relPath)) return "handoff_receipt";
  if (/\/handoffs\//i.test(relPath) && /\breceipt\b/i.test(text)) return "handoff_report_with_receipt_text";
  if (/^app\/api\//i.test(relPath) && /\breceipt\b/i.test(text)) return "api_receipt_surface";
  if (/^components\//i.test(relPath) && /\breceipt\b/i.test(text)) return "ui_receipt_surface";
  if (/^lib\//i.test(relPath) && /\breceipt\b/i.test(text)) return "library_receipt_shape";
  if (/^scripts\//i.test(relPath) && /\breceipt\b/i.test(text)) return "receipt_inventory_script";
  if (/\.json$/i.test(relPath) && /"receipt"\s*:/i.test(text)) return "json_receipt_shape";
  if (/\breceipt\b/i.test(text)) return "receipt_text_reference";
  return "receipt_named_path";
}

function isReceiptSource(relPath, text) {
  return /receipt/i.test(relPath) || /\breceipt\b/i.test(text) || /"receipt"\s*:/i.test(text);
}

const files = await walk(ROOT);
const sources = [];

for (const path of files) {
  const relPath = normalizePath(path);
  if (!TEXT_EXTENSIONS.test(relPath)) continue;
  const text = await readFile(path, "utf8").catch(() => "");
  if (!isReceiptSource(relPath, text)) continue;

  sources.push({
    path: relPath,
    receipt_type: receiptType(relPath, text),
    producer: producerFromText(text, relPath),
    consumer: consumerFromText(text),
  });
}

sources.sort((left, right) => left.path.localeCompare(right.path));
await writeFile(OUTPUT, `${JSON.stringify(sources, null, 2)}\n`, "utf8");
console.log(`wrote ${sources.length} receipt source(s) to ${OUTPUT}`);
