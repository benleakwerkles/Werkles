import "server-only";

import fs from "node:fs";
import path from "node:path";

import {
  applyDrawerDisposition,
  countUniqueApprovedCards,
  DRAWER_STORE_REL_PATH,
  defaultDrawerApprover,
  normalizeDrawerStore,
  type WriteDrawerDispositionResult
} from "./approval-store";
import type { DrawerAction, DrawerStore } from "./types";

const ROOT = process.cwd();
const STORE_FILE = path.join(ROOT, DRAWER_STORE_REL_PATH);

function persistStore(store: DrawerStore): void {
  fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
  fs.writeFileSync(STORE_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export function readDrawerStore(): DrawerStore {
  try {
    const raw = JSON.parse(fs.readFileSync(STORE_FILE, "utf8")) as unknown;
    const store = normalizeDrawerStore(raw);
    if (raw && typeof raw === "object" && (raw as { version?: number }).version === 1) {
      persistStore(store);
    }
    return store;
  } catch {
    return normalizeDrawerStore(null);
  }
}

export { countUniqueApprovedCards, defaultDrawerApprover, type WriteDrawerDispositionResult };

export function writeDrawerDisposition(input: {
  receiptId: string;
  cardId?: string | null;
  action: DrawerAction;
  approver?: string | null;
  note?: string | null;
}): WriteDrawerDispositionResult {
  const store = readDrawerStore();
  const { store: nextStore, result } = applyDrawerDisposition(store, input);
  if (!result.duplicate) {
    persistStore(nextStore);
  }
  return result;
}

export function drawerStorePath(): string {
  return DRAWER_STORE_REL_PATH;
}
