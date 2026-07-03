#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACKET_DIR = path.join(ROOT, "tinkerden", "dispatch", "packets");
const INBOX_PATH = path.join(ROOT, "tinkerden", "dispatch", "packet_inbox.json");
const VALID_STATUSES = new Set(["NEW", "SEEN", "WORKING", "COMPLETE"]);

function field(value, fallback = "UNKNOWN") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function statusFor(record) {
  const explicit = field(record.inbox_status, field(record.packet?.inbox_status, ""));
  if (VALID_STATUSES.has(explicit)) return explicit;

  const sourceStatus = field(record.status, field(record.packet?.status, ""));
  if (sourceStatus === "COMPLETE" || sourceStatus === "RECEIPT_RETURNED" || sourceStatus === "VALIDATED" || sourceStatus === "ASSIMILATED") {
    return "COMPLETE";
  }
  if (sourceStatus === "WORKING") return "WORKING";
  if (sourceStatus === "SEEN") return "SEEN";

  return "NEW";
}

function normalizePacket(record, fileName) {
  const packet = record.packet && typeof record.packet === "object" ? record.packet : {};
  const bridgeCard = record.bridge_card && typeof record.bridge_card === "object" ? record.bridge_card : {};

  return {
    packet_id: field(packet.packet_id, path.basename(fileName, ".json")),
    action: field(bridgeCard.operator_selection, field(record.action, "UNKNOWN")),
    created_at: field(packet.created_at, field(record.created_at, "UNKNOWN")),
    status: statusFor(record),
  };
}

function sortTime(value) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function readPackets() {
  await fs.mkdir(PACKET_DIR, { recursive: true });
  const entries = await fs.readdir(PACKET_DIR, { withFileTypes: true });
  const packets = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
    const fullPath = path.join(PACKET_DIR, entry.name);
    try {
      const parsed = JSON.parse(await fs.readFile(fullPath, "utf8"));
      packets.push(normalizePacket(parsed, entry.name));
    } catch {
      packets.push({
        packet_id: path.basename(entry.name, ".json"),
        action: "UNKNOWN",
        created_at: "UNKNOWN",
        status: "NEW",
      });
    }
  }

  return packets.sort((a, b) => sortTime(b.created_at) - sortTime(a.created_at));
}

async function main() {
  const packets = await readPackets();
  await fs.mkdir(path.dirname(INBOX_PATH), { recursive: true });
  await fs.writeFile(INBOX_PATH, `${JSON.stringify(packets, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        input: "tinkerden/dispatch/packets/*.json",
        output: "tinkerden/dispatch/packet_inbox.json",
        count: packets.length,
        packets,
      },
      null,
      2,
    ),
  );
}

await main();
