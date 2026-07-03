import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PACKET_DIR = join(ROOT, "tinkerden", "dispatch", "packets");
const OUTPUT = join(ROOT, "foreman", "artifacts", "packet_inbox.json");
const ALLOWED_STATUSES = new Set(["NEW", "SEEN", "WORKING", "COMPLETE"]);

function asString(value, fallback = "UNKNOWN") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeStatus(value) {
  const status = asString(value, "NEW").toUpperCase();
  return ALLOWED_STATUSES.has(status) ? status : "NEW";
}

function inboxEntry(packet) {
  return {
    packet_id: asString(packet.packet_id),
    action: asString(packet.action),
    created_at: asString(packet.created_at),
    status: normalizeStatus(packet.status),
  };
}

async function packetFiles() {
  const entries = await readdir(PACKET_DIR, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => join(PACKET_DIR, entry.name))
    .sort();
}

const inbox = [];

for (const file of await packetFiles()) {
  const raw = await readFile(file, "utf8");
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    inbox.push(...parsed.map(inboxEntry));
  } else {
    inbox.push(inboxEntry(parsed));
  }
}

inbox.sort((left, right) => left.created_at.localeCompare(right.created_at) || left.packet_id.localeCompare(right.packet_id));
await writeFile(OUTPUT, `${JSON.stringify(inbox, null, 2)}\n`, "utf8");
console.log(`wrote ${inbox.length} packet inbox entr${inbox.length === 1 ? "y" : "ies"} to ${OUTPUT}`);
