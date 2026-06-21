import fs from "node:fs";
import path from "node:path";

import type { FocusTheftReceipt } from "./types";

const ROOT = process.cwd();
export const FOCUS_THEFT_DIR = path.join(ROOT, "foreman", "soledash", "focus-theft");
export const RECEIPTS_DIR = path.join(FOCUS_THEFT_DIR, "receipts");
const REPEAT_OFFENDERS_FILE = path.join(FOCUS_THEFT_DIR, "repeat-offenders.json");

export function rel(p: string): string {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

export function ensureFocusTheftDirs(): void {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

export function writeFocusTheftReceipt(receipt: FocusTheftReceipt): string {
  ensureFocusTheftDirs();
  const file = path.join(RECEIPTS_DIR, `${receipt.incident_id}.json`);
  fs.writeFileSync(file, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return rel(file);
}

export function readFocusTheftReceipt(incidentId: string): FocusTheftReceipt | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(RECEIPTS_DIR, `${incidentId}.json`), "utf8")) as FocusTheftReceipt;
  } catch {
    return null;
  }
}

export function latestFocusTheftReceipt(): FocusTheftReceipt | null {
  ensureFocusTheftDirs();
  let latest: FocusTheftReceipt | null = null;
  let latestTs = 0;

  for (const name of fs.readdirSync(RECEIPTS_DIR)) {
    if (!name.endsWith(".json")) continue;
    const receipt = readFocusTheftReceipt(name.replace(/\.json$/, ""));
    if (!receipt) continue;
    const ts = new Date(receipt.timestamp).getTime();
    if (ts >= latestTs) {
      latestTs = ts;
      latest = receipt;
    }
  }

  return latest;
}

export type RepeatOffenderEntry = {
  source_app: string;
  count: number;
  first_seen: string;
  last_seen: string;
  last_incident_id: string;
};

export function markRepeatOffender(sourceApp: string, incidentId: string, at: string): RepeatOffenderEntry {
  ensureFocusTheftDirs();
  let list: RepeatOffenderEntry[] = [];
  try {
    list = JSON.parse(fs.readFileSync(REPEAT_OFFENDERS_FILE, "utf8")) as RepeatOffenderEntry[];
  } catch {
    list = [];
  }

  const key = sourceApp.trim().toLowerCase();
  const idx = list.findIndex((e) => e.source_app.toLowerCase() === key);
  if (idx >= 0) {
    list[idx] = {
      ...list[idx],
      count: list[idx].count + 1,
      last_seen: at,
      last_incident_id: incidentId
    };
  } else {
    list.push({
      source_app: sourceApp.trim(),
      count: 1,
      first_seen: at,
      last_seen: at,
      last_incident_id: incidentId
    });
  }

  fs.writeFileSync(REPEAT_OFFENDERS_FILE, `${JSON.stringify(list, null, 2)}\n`, "utf8");
  return list.find((e) => e.source_app.toLowerCase() === key)!;
}
