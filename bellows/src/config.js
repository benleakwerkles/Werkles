import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

function loadDotEnv() {
  const envPath = join(rootDir, ".env");
  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const MODES = new Set(["dry-run", "local", "supabase"]);

export function loadConfig() {
  const mode = process.env.BELLOWS_MODE || "dry-run";
  if (!MODES.has(mode)) {
    throw new Error(`Invalid BELLOWS_MODE "${mode}". Expected: ${[...MODES].join(", ")}`);
  }

  return {
    rootDir,
    mode,
    storageDir: resolve(rootDir, process.env.BELLOWS_STORAGE_DIR || "./data/assets"),
    queuePath: resolve(rootDir, process.env.BELLOWS_QUEUE_PATH || "./data/queue.jsonl"),
    ghostForgeUrl: process.env.GHOST_FORGE_URL || "",
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}
