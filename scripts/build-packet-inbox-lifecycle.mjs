import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const INPUT = join(ROOT, "foreman", "artifacts", "packet_inbox.json");
const OUTPUT = join(ROOT, "foreman", "artifacts", "packet_lifecycle.json");
const TRACKED_STATUSES = new Set(["NEW", "SEEN", "WORKING", "COMPLETE"]);

function packetId(packet) {
  return typeof packet?.packet_id === "string" ? packet.packet_id : "UNKNOWN";
}

function observedStatus(packet) {
  if (typeof packet?.status !== "string") return "UNKNOWN";
  const status = packet.status.trim().toUpperCase();
  return TRACKED_STATUSES.has(status) ? status : "UNKNOWN";
}

const raw = await readFile(INPUT, "utf8").catch(() => "[]");
const inbox = JSON.parse(raw);
const packets = Array.isArray(inbox) ? inbox : [];

const lifecycle = packets.map((packet) => ({
  packet_id: packetId(packet),
  status: observedStatus(packet),
}));

await writeFile(OUTPUT, `${JSON.stringify(lifecycle, null, 2)}\n`, "utf8");
console.log(`wrote ${lifecycle.length} packet lifecycle entr${lifecycle.length === 1 ? "y" : "ies"} to ${OUTPUT}`);
