import { loadConfig } from "./config.js";

export function getHealthReport() {
  const config = loadConfig();

  return {
    service: "bellows",
    status: "ok",
    mode: config.mode,
    storageDir: config.storageDir,
    queuePath: config.queuePath,
    ghostForgeConfigured: Boolean(config.ghostForgeUrl),
    supabaseConfigured: Boolean(config.supabaseUrl && config.supabaseServiceRoleKey),
    networkCallsEnabled: config.mode !== "dry-run",
  };
}
