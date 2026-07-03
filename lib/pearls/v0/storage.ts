import "server-only";

import fs from "node:fs";
import path from "node:path";

import { seedPearlShelf } from "./seed";
import type { PearlShelfStore, PearlV0 } from "./types";

export const PEARLS_STORE_REL_PATH = "foreman/soledash/PEARLS_V0.json";

const ROOT = process.cwd();
const STORE_FILE = path.join(ROOT, PEARLS_STORE_REL_PATH);

export function normalizePearlShelf(raw: unknown): PearlShelfStore {
  if (!raw || typeof raw !== "object") return seedPearlShelf();
  const record = raw as Record<string, unknown>;
  if (record.version !== 0 || !Array.isArray(record.pearls)) return seedPearlShelf();
  return { version: 0, pearls: record.pearls as PearlV0[] };
}

export function readPearlShelf(): PearlShelfStore {
  try {
    const raw = JSON.parse(fs.readFileSync(STORE_FILE, "utf8")) as unknown;
    return normalizePearlShelf(raw);
  } catch {
    const seeded = seedPearlShelf();
    persistPearlShelf(seeded);
    return seeded;
  }
}

export function persistPearlShelf(store: PearlShelfStore): void {
  fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
  fs.writeFileSync(STORE_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export function pearlStorePath(): string {
  return PEARLS_STORE_REL_PATH;
}
