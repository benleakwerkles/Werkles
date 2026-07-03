import chokidar from "chokidar";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const repoRoot = process.cwd();
const relayRoot = path.join(repoRoot, "tinkerden", "aeye-relay");
const requestGlob = path.join(relayRoot, "requests", "*.json");
const eventPath = path.join(relayRoot, "events.jsonl");

async function appendEvent(event) {
  await mkdir(path.dirname(eventPath), { recursive: true });
  await writeFile(eventPath, `${JSON.stringify(event)}\n`, { encoding: "utf8", flag: "a" });
}

async function recordRelayRequest(filePath, action) {
  try {
    const request = JSON.parse(await readFile(filePath, "utf8"));
    await appendEvent({
      event_type: "real_aeye_relay_watch",
      action,
      timestamp: new Date().toISOString(),
      relay_id: request.relay_id ?? path.basename(filePath, ".json"),
      status: request.status ?? "UNKNOWN",
      command_packet_id: request.command_packet_id ?? null,
      destination_label: request.destination_label ?? null,
      request_path: path.relative(repoRoot, filePath).split(path.sep).join("/"),
      bridge_required: true,
      note: "Watcher observed request. Codex thread creation still requires the Codex bridge or future authenticated daemon."
    });
  } catch (error) {
    await appendEvent({
      event_type: "real_aeye_relay_watch_error",
      action,
      timestamp: new Date().toISOString(),
      request_path: path.relative(repoRoot, filePath).split(path.sep).join("/"),
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

await mkdir(path.join(relayRoot, "requests"), { recursive: true });
await mkdir(path.join(relayRoot, "responses"), { recursive: true });
await mkdir(path.join(relayRoot, "receipts"), { recursive: true });

console.log(`[real-aeye-relay-watch] watching ${requestGlob}`);

chokidar
  .watch(requestGlob, {
    ignoreInitial: false,
    awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 }
  })
  .on("add", (filePath) => void recordRelayRequest(filePath, "add"))
  .on("change", (filePath) => void recordRelayRequest(filePath, "change"))
  .on("error", (error) =>
    void appendEvent({
      event_type: "real_aeye_relay_watch_error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    })
  );
