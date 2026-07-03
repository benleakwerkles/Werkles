import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const INPUT = join(ROOT, "foreman", "artifacts", "packet_inbox.json");
const OUTPUT = join(ROOT, "foreman", "artifacts", "packet_status.json");
const OBSERVED_STATUSES = new Set(["NEW", "SEEN", "WORKING", "COMPLETE"]);

function observedStatus(value) {
  if (typeof value !== "string") return "UNKNOWN";
  const status = value.trim().toUpperCase();
  return OBSERVED_STATUSES.has(status) ? status : "UNKNOWN";
}

function asString(value) {
  return typeof value === "string" ? value : "";
}

const raw = await readFile(INPUT, "utf8").catch(() => "[]");
const inbox = JSON.parse(raw);
const packets = Array.isArray(inbox) ? inbox : [];

const status = packets.map((packet) => ({
  packet_id: asString(packet.packet_id),
  status: observedStatus(packet.status),
}));

await writeFile(OUTPUT, `${JSON.stringify(status, null, 2)}\n`, "utf8");
console.log(`wrote ${status.length} packet status entr${status.length === 1 ? "y" : "ies"} to ${OUTPUT}`);
