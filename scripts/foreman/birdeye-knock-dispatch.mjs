import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const topologyPath = path.join(root, "foreman", "relay", "BIRDEYE_FLEET_TOPOLOGY_20260712.json");
const knockPath = path.join(root, "foreman", "handoffs", "outbox", "KNOCK_ALL_AEYES_20260712.md");
const outbox = path.join(root, "data", "tinkerden", "outbox", "knock-20260712");
const args = new Set(process.argv.slice(2));

if (!args.has("--all")) {
  console.error("Usage: node scripts/foreman/birdeye-knock-dispatch.mjs --all");
  process.exit(2);
}

const topology = JSON.parse(fs.readFileSync(topologyPath, "utf8"));
const knock = fs.readFileSync(knockPath, "utf8");
const knockSha256 = crypto.createHash("sha256").update(knock).digest("hex").toUpperCase();
fs.mkdirSync(outbox, { recursive: true });

const rows = [];
for (const machine of topology.machines) {
  for (const aeye of topology.aeyes) {
    const seat = `${aeye.name}@${machine.name}`;
    const nickname = topology.nicknames.find((entry) => entry.seat === seat)?.nickname || aeye.name;
    const special = topology.special_status.find((entry) => entry.seat === seat);
    const packetId = `KNOCK_${aeye.id.toUpperCase()}_${machine.id.toUpperCase()}_20260712`;
    const file = `${packetId}.json`;
    const packet = {
      message_type: "birdie_packet",
      courier_class: "Birdeyes",
      packet_id: packetId,
      target_aeye: aeye.name,
      target_machine: machine.name,
      target_hostname: machine.hostname,
      target_seat: seat,
      target_nickname: nickname,
      machine_status: machine.status,
      seat_status: special?.model_status || "ADDRESSABLE_UNVERIFIED_ROUTE",
      mission: "Retrieve and execute the current universal Werkles KNOCK.",
      knock_source: "foreman/handoffs/outbox/KNOCK_ALL_AEYES_20260712.md",
      knock_sha256: knockSha256,
      status: "QUEUED_FOR_COURIER",
      receipt_required: true,
      completion_rule: "Receiver-side RECEIVED then COMPLETED or BLOCKER",
      return_destination: "foreman/handoffs/inbox",
      proof_boundary: "Queued is not sent; sent is not received; received is not completed."
    };
    fs.writeFileSync(path.join(outbox, file), `${JSON.stringify(packet, null, 2)}\n`, "utf8");
    rows.push({ packet_id: packetId, target: seat, nickname, status: packet.status, file });
  }
}

const manifest = {
  schema: "werkles.birdeye-knock-manifest/v1",
  generated_at: new Date().toISOString(),
  topology_source: path.relative(root, topologyPath).replaceAll("\\", "/"),
  knock_source: path.relative(root, knockPath).replaceAll("\\", "/"),
  knock_sha256: knockSha256,
  packet_count: rows.length,
  status: "QUEUED_NOT_DELIVERED",
  packets: rows
};
fs.writeFileSync(path.join(outbox, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outbox, packet_count: rows.length, status: manifest.status, knock_sha256: knockSha256 }, null, 2));

