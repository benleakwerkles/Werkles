#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const INTAKE_DIR = path.join(ROOT, "intake");
const SHARED_FRONTIER_PATH = path.join(__dirname, "shared_frontier.json");
const LOG_PATH = path.join(__dirname, "frontier-sync-events.jsonl");

function slash(value) {
  return value.split(path.sep).join("/");
}

function rel(value) {
  return slash(path.relative(ROOT, value));
}

function ensureDirs() {
  fs.mkdirSync(INTAKE_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(SHARED_FRONTIER_PATH), { recursive: true });
}

function writeDefaultFrontierIfMissing() {
  if (fs.existsSync(SHARED_FRONTIER_PATH)) return;
  fs.writeFileSync(
    SHARED_FRONTIER_PATH,
    `${JSON.stringify({ last_node_active: "", current_focus: "", locked_lanes: [], timestamp: "" }, null, 2)}\n`,
    "utf8"
  );
}

function appendLog(event) {
  fs.writeFileSync(LOG_PATH, `${JSON.stringify(event)}\n`, { encoding: "utf8", flag: "a" });
}

function normalizeFrontier(packet) {
  const state = packet.shared_frontier && typeof packet.shared_frontier === "object" ? packet.shared_frontier : packet;
  return {
    last_node_active: typeof state.last_node_active === "string" ? state.last_node_active : "",
    current_focus: typeof state.current_focus === "string" ? state.current_focus : "",
    locked_lanes: Array.isArray(state.locked_lanes) ? state.locked_lanes.filter((lane) => typeof lane === "string") : [],
    timestamp: typeof state.timestamp === "string" && state.timestamp ? state.timestamp : new Date().toISOString()
  };
}

function processFile(filePath) {
  if (!filePath.endsWith(".json")) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const packet = JSON.parse(raw);
  if (packet.packet_type !== "STATE_BROADCAST" && packet.type !== "STATE_BROADCAST") return null;

  const sharedFrontier = normalizeFrontier(packet);
  fs.writeFileSync(SHARED_FRONTIER_PATH, `${JSON.stringify(sharedFrontier, null, 2)}\n`, "utf8");

  const event = {
    event_type: "state_broadcast_applied",
    timestamp: new Date().toISOString(),
    packet_path: rel(filePath),
    shared_frontier_path: rel(SHARED_FRONTIER_PATH),
    shared_frontier: sharedFrontier
  };
  appendLog(event);
  console.log(`[frontier_sync] STATE_BROADCAST ${event.packet_path} -> ${event.shared_frontier_path}`);
  return event;
}

function watch() {
  ensureDirs();
  writeDefaultFrontierIfMissing();
  console.log(`[frontier_sync] watching ${rel(INTAKE_DIR)}`);
  console.log(`[frontier_sync] shared frontier ${rel(SHARED_FRONTIER_PATH)}`);

  fs.watch(INTAKE_DIR, (eventType, filename) => {
    if (!filename || eventType !== "rename") return;
    const filePath = path.join(INTAKE_DIR, filename.toString());
    if (!fs.existsSync(filePath)) return;

    try {
      processFile(filePath);
    } catch (error) {
      const event = {
        event_type: "state_broadcast_failed",
        timestamp: new Date().toISOString(),
        packet_path: rel(filePath),
        error: error instanceof Error ? error.message : String(error)
      };
      appendLog(event);
      console.error(`[frontier_sync] failed ${event.packet_path}: ${event.error}`);
    }
  });
}

function main() {
  const command = process.argv[2] || "watch";
  ensureDirs();
  writeDefaultFrontierIfMissing();

  if (command === "watch") {
    watch();
    return;
  }

  if (command === "process") {
    const packetPath = process.argv[3];
    if (!packetPath) throw new Error("process requires packet path");
    const event = processFile(path.resolve(ROOT, packetPath));
    console.log(JSON.stringify({ ok: Boolean(event), event }, null, 2));
    return;
  }

  throw new Error("Usage: node frontier_sync.js [watch|process <packet_path>]");
}

main();
