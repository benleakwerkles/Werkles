import fs from "node:fs";
import path from "node:path";

export type PetraEmptyLinkConfig = {
  endpoint_url: string | null;
  outbound_dir: string;
  response_timeout_ms: number;
};

const CONFIG_PATH = path.join(process.cwd(), "foreman", "soledash", "PETRA_EMPTY_LINK.json");

const DEFAULTS: PetraEmptyLinkConfig = {
  endpoint_url: null,
  outbound_dir: "foreman/soledash/outbound/petra",
  response_timeout_ms: 15000
};

export function loadPetraEmptyLinkConfig(): PetraEmptyLinkConfig {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return { ...DEFAULTS };
    }
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) as Partial<PetraEmptyLinkConfig>;
    const url = typeof raw.endpoint_url === "string" ? raw.endpoint_url.trim() || null : null;
    return {
      endpoint_url: url,
      outbound_dir:
        typeof raw.outbound_dir === "string" && raw.outbound_dir.trim()
          ? raw.outbound_dir.trim()
          : DEFAULTS.outbound_dir,
      response_timeout_ms:
        typeof raw.response_timeout_ms === "number" && raw.response_timeout_ms > 0
          ? raw.response_timeout_ms
          : DEFAULTS.response_timeout_ms
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function configPath(): string {
  return CONFIG_PATH;
}
