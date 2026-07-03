import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
export const INTENT_DIR = path.join(ROOT, "foreman", "soledash", "intent-memory");
const STATE_FILE = path.join(INTENT_DIR, "state.json");
const PARKED_FILE = path.join(INTENT_DIR, "parked.json");
const RECEIPTS_DIR = path.join(INTENT_DIR, "receipts");

export type ParkedIntent = {
  intent_id: string;
  raw_command: string;
  interpreted_command: string;
  recommended_owner: string;
  parked_at: string;
  reason: string | null;
};

type IntentState = {
  last_intent_id: string | null;
  last_action: string | null;
};

export function ensureIntentDirs(): void {
  fs.mkdirSync(INTENT_DIR, { recursive: true });
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

export function loadIntentState(): IntentState {
  ensureIntentDirs();
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as IntentState;
  } catch {
    return { last_intent_id: null, last_action: null };
  }
}

export function saveIntentState(state: IntentState): void {
  ensureIntentDirs();
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export function loadParkedIntents(): ParkedIntent[] {
  ensureIntentDirs();
  try {
    const raw = JSON.parse(fs.readFileSync(PARKED_FILE, "utf8")) as ParkedIntent[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function saveParkedIntents(items: ParkedIntent[]): void {
  ensureIntentDirs();
  fs.writeFileSync(PARKED_FILE, `${JSON.stringify(items, null, 2)}\n`, "utf8");
}

export function writeActionReceipt(payload: Record<string, unknown>): string {
  ensureIntentDirs();
  const id = String(payload.intent_id ?? `intent_${Date.now()}`);
  const file = path.join(RECEIPTS_DIR, `${id}_${Date.now()}.json`);
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return path.relative(ROOT, file).split(path.sep).join("/");
}
