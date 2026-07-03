import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DATA_ROOT = join(ROOT, "data", "organism");
const RECEIPT_PICKUP = join(DATA_ROOT, "receipt_pickup.jsonl");
const OUTPUT = join(ROOT, "foreman", "artifacts", "trace_report.json");
const SKIP_DIRS = new Set(["node_modules", ".next", "dist", ".git"]);

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

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function objectPacketId(value) {
  return typeof value?.packet_id === "string" ? value.packet_id : null;
}

function objectReceiptId(value) {
  return typeof value?.receipt_id === "string" ? value.receipt_id : null;
}

function objectTime(value, keys) {
  for (const key of keys) {
    if (typeof value?.[key] === "string") return value[key];
  }
  return "";
}

function isDispatchEvent(value) {
  const marker = String(value?.event_type || value?.type || value?.event || "").toLowerCase();
  return marker === "packet_dispatched" || marker === "packet_dispatched_event";
}

function parseJsonLine(line, path, index) {
  try {
    return asObject(JSON.parse(line));
  } catch {
    return {
      parse_error: true,
      path: relative(ROOT, path).replace(/\\/g, "/"),
      line: index + 1,
    };
  }
}

async function readJsonl(path) {
  const raw = await readFile(path, "utf8").catch(() => "");
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => parseJsonLine(line, path, index))
    .filter(Boolean);
}

async function readJsonObjects(path) {
  const raw = await readFile(path, "utf8").catch(() => "");
  if (!raw.trim()) return [];

  if (/\.jsonl$/i.test(path)) return readJsonl(path);

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(asObject).filter(Boolean);
    const object = asObject(parsed);
    return object ? [object] : [];
  } catch {
    return [];
  }
}

async function collectPacketObjects() {
  const roots = [DATA_ROOT, join(ROOT, "foreman"), join(ROOT, "operator-cockpit")];
  const objects = [];

  for (const root of roots) {
    const files = (await walk(root)).filter((path) => /\.(json|jsonl)$/i.test(path));
    for (const path of files) {
      for (const object of await readJsonObjects(path)) {
        objects.push({
          object,
          path: relative(ROOT, path).replace(/\\/g, "/"),
        });
      }
    }
  }

  return objects;
}

async function receiptPanelReferences() {
  const files = (await walk(ROOT)).filter((path) => /\.(ts|tsx|js|jsx|md|json)$/i.test(path));
  const references = new Set();

  for (const path of files) {
    const rel = relative(ROOT, path).replace(/\\/g, "/");
    if (!/(receipt|panel|cockpit)/i.test(rel)) continue;
    const raw = await readFile(path, "utf8").catch(() => "");
    for (const match of raw.matchAll(/receipt_id["'`:\s=]+([A-Za-z0-9_.:-]+)/g)) {
      references.add(match[1]);
    }
    for (const match of raw.matchAll(/packet_id["'`:\s=]+([A-Za-z0-9_.:-]+)/g)) {
      references.add(match[1]);
    }
  }

  return references;
}

function makeTrace(packet, dispatch, receipt, visibleReferences) {
  const packetId = objectPacketId(packet.object);
  const receiptId = objectReceiptId(receipt.object);
  if (!packetId || !receiptId) return null;

  const visibleInCockpit = visibleReferences.has(packetId) || visibleReferences.has(receiptId);
  if (!visibleInCockpit) return null;

  return {
    packet_id: packetId,
    dispatch_time: objectTime(dispatch.object, ["dispatch_time", "dispatched_at", "timestamp", "created_at"]),
    receipt_time: objectTime(receipt.object, ["receipt_time", "received_at", "timestamp", "created_at"]),
    receipt_id: receiptId,
    visible_in_cockpit: true,
  };
}

const objects = await collectPacketObjects();
const packets = objects.filter((entry) => objectPacketId(entry.object));
const dispatches = objects.filter((entry) => objectPacketId(entry.object) && isDispatchEvent(entry.object));
const pickupObjects = (await readJsonl(RECEIPT_PICKUP)).map((object) => ({
  object,
  path: "data/organism/receipt_pickup.jsonl",
}));
const visibleReferences = await receiptPanelReferences();

const traces = [];
for (const packet of packets) {
  const packetId = objectPacketId(packet.object);
  const dispatch = dispatches.find((entry) => objectPacketId(entry.object) === packetId);
  const receipt = pickupObjects.find((entry) => objectPacketId(entry.object) === packetId);
  if (!dispatch || !receipt) continue;

  const trace = makeTrace(packet, dispatch, receipt, visibleReferences);
  if (trace) traces.push(trace);
}

await writeFile(OUTPUT, `${JSON.stringify(traces, null, 2)}\n`, "utf8");
console.log(`wrote ${traces.length} complete packet-to-receipt trace(s) to ${OUTPUT}`);
