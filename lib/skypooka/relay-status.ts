import { promises as fs } from "node:fs";
import path from "node:path";

const RELAY_LOCK_PATH = path.join(process.cwd(), "foreman", "crew-dispatch", "RELAY_LOCK.json");
const COURIER_CONFIG_PATH = path.join(process.cwd(), "foreman", "crew-dispatch", "relay-courier.config.json");
const CREW_TABS_PATH = path.join(process.cwd(), "foreman", "crew-dispatch", "crew-tabs.config.json");
const CONTEXT_HEALTH_PATH = path.join(process.cwd(), "foreman", "crew-dispatch", "context-health.json");

export type SkyPookaRelayStatus = {
  courier_config_present: boolean;
  crew_tabs_present: boolean;
  relay_lock_status: string | null;
  relay_lock_running: boolean;
  mobile_fire_mode: "queue" | "simulated";
  courier_ready: boolean;
  note: string;
};

async function readJsonFile(filePath: string) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function readSkyPookaRelayStatus(): Promise<SkyPookaRelayStatus> {
  const [configExists, tabsExists, lock, health] = await Promise.all([
    fs.access(COURIER_CONFIG_PATH).then(() => true).catch(() => false),
    fs.access(CREW_TABS_PATH).then(() => true).catch(() => false),
    readJsonFile(RELAY_LOCK_PATH),
    readJsonFile(CONTEXT_HEALTH_PATH)
  ]);

  const relayLockStatus = typeof lock?.status === "string" ? lock.status : null;
  const relayLockRunning = relayLockStatus === "RUNNING";
  const courierReady = configExists && tabsExists && !relayLockRunning;
  const healthOk = health && typeof health === "object" && health.ok !== false;

  return {
    courier_config_present: configExists,
    crew_tabs_present: tabsExists,
    relay_lock_status: relayLockStatus,
    relay_lock_running: relayLockRunning,
    mobile_fire_mode: courierReady ? "queue" : "simulated",
    courier_ready: courierReady && Boolean(healthOk ?? true),
    note: courierReady
      ? "Mobile FIRE queues a local fire-request artifact for relay courier pickup. Nothing is sent from the phone."
      : "Relay courier artifacts missing or lock is running — mobile FIRE stays simulated."
  };
}

export const SKYPOOKA_FIRE_QUEUE_DIR = path.join(process.cwd(), "foreman", "skypooka", "fire-queue");
export const SKYPOOKA_HOLD_QUEUE_DIR = path.join(process.cwd(), "foreman", "skypooka", "hold-queue");

export type SkyPookaQueuedAction = {
  id: string;
  action: "fire" | "hold";
  card_id: string;
  subject: string;
  target: string;
  path: string;
  created_at: string;
  status: "queued";
  source: "skypooka-mobile";
};

export async function listQueuedSkyPookaActions(limit = 20) {
  const readDir = async (directory: string, action: "fire" | "hold") => {
    try {
      const names = await fs.readdir(directory);
      const files = await Promise.all(
        names
          .filter((name) => name.endsWith(".json"))
          .map(async (name) => {
            const filePath = path.join(directory, name);
            const stat = await fs.stat(filePath);
            const value = JSON.parse(await fs.readFile(filePath, "utf8")) as SkyPookaQueuedAction;
            return { value, mtime: stat.mtimeMs };
          })
      );
      return files
        .sort((a, b) => b.mtime - a.mtime)
        .slice(0, limit)
        .map((file) => file.value);
    } catch {
      return [] as SkyPookaQueuedAction[];
    }
  };

  const [fire, hold] = await Promise.all([
    readDir(SKYPOOKA_FIRE_QUEUE_DIR, "fire"),
    readDir(SKYPOOKA_HOLD_QUEUE_DIR, "hold")
  ]);

  return [...fire, ...hold].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
}

export async function queueSkyPookaAction(input: Omit<SkyPookaQueuedAction, "id" | "created_at" | "status" | "source">) {
  const createdAt = new Date().toISOString();
  const id = `skypooka_${input.action}_${Date.now().toString(36)}`;
  const record: SkyPookaQueuedAction = {
    id,
    created_at: createdAt,
    status: "queued",
    source: "skypooka-mobile",
    ...input
  };
  const directory = input.action === "fire" ? SKYPOOKA_FIRE_QUEUE_DIR : SKYPOOKA_HOLD_QUEUE_DIR;
  await fs.mkdir(directory, { recursive: true });
  const filePath = path.join(directory, `${id}.json`);
  await fs.writeFile(filePath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  return {
    ok: true as const,
    record,
    queue_path: path.relative(process.cwd(), filePath).replace(/\\/g, "/")
  };
}
