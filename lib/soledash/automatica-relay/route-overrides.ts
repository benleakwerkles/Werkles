import fs from "node:fs";
import path from "node:path";

import { AUTOMATICA_DIR } from "./storage";

const OVERRIDE_FILE = path.join(AUTOMATICA_DIR, "route-overrides.json");

export type RouteOverride = {
  cousin: "MAKER" | "DINK" | "PETRA" | "ENDER" | "BEAN";
  updated_at: string;
  note: string | null;
};

type OverrideMap = Record<string, RouteOverride>;

function readAll(): OverrideMap {
  try {
    return JSON.parse(fs.readFileSync(OVERRIDE_FILE, "utf8")) as OverrideMap;
  } catch {
    return {};
  }
}

export function readRouteOverride(cardId: string): RouteOverride | null {
  return readAll()[cardId] ?? null;
}

export function saveRouteOverride(
  cardId: string,
  cousin: RouteOverride["cousin"],
  note?: string | null
): RouteOverride {
  fs.mkdirSync(AUTOMATICA_DIR, { recursive: true });
  const all = readAll();
  const entry: RouteOverride = {
    cousin,
    updated_at: new Date().toISOString(),
    note: note?.trim() || null
  };
  all[cardId] = entry;
  fs.writeFileSync(OVERRIDE_FILE, `${JSON.stringify(all, null, 2)}\n`, "utf8");
  return entry;
}
