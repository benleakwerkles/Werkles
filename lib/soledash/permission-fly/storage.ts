import fs from "node:fs";
import path from "node:path";

import type { PermissionFlyEntry, PermissionFlyReceipt } from "./types";

const ROOT = process.cwd();
export const PERMISSION_FLY_DIR = path.join(ROOT, "foreman", "soledash", "permission-fly");
export const RECEIPTS_DIR = path.join(PERMISSION_FLY_DIR, "receipts");
const REGISTRY_FILE = path.join(PERMISSION_FLY_DIR, "registry.json");

export function rel(p: string): string {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

export function ensurePermissionFlyDirs(): void {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

type Registry = { flies: PermissionFlyEntry[] };

export function loadRegistry(): Registry {
  ensurePermissionFlyDirs();
  try {
    const data = JSON.parse(fs.readFileSync(REGISTRY_FILE, "utf8")) as Registry;
    return { flies: Array.isArray(data.flies) ? data.flies : [] };
  } catch {
    return { flies: [] };
  }
}

export function saveRegistry(flies: PermissionFlyEntry[]): void {
  ensurePermissionFlyDirs();
  fs.writeFileSync(REGISTRY_FILE, `${JSON.stringify({ flies }, null, 2)}\n`, "utf8");
}

export function writePermissionFlyReceipt(receipt: PermissionFlyReceipt): string {
  ensurePermissionFlyDirs();
  const file = path.join(RECEIPTS_DIR, `${receipt.receipt_id}.json`);
  fs.writeFileSync(file, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return rel(file);
}

export function readPermissionFlyReceipt(receiptId: string): PermissionFlyReceipt | null {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(RECEIPTS_DIR, `${receiptId}.json`), "utf8")
    ) as PermissionFlyReceipt;
  } catch {
    return null;
  }
}

export function latestPermissionFlyReceipt(): PermissionFlyReceipt | null {
  ensurePermissionFlyDirs();
  let latest: PermissionFlyReceipt | null = null;
  let latestTs = 0;

  for (const name of fs.readdirSync(RECEIPTS_DIR)) {
    if (!name.endsWith(".json")) continue;
    const receipt = readPermissionFlyReceipt(name.replace(/\.json$/, ""));
    if (!receipt) continue;
    const ts = new Date(receipt.timestamp).getTime();
    if (ts >= latestTs) {
      latestTs = ts;
      latest = receipt;
    }
  }

  return latest;
}

export function activeFly(flies: PermissionFlyEntry[]): PermissionFlyEntry | null {
  if (!flies.length) return null;
  return [...flies].sort(
    (a, b) => new Date(b.last_occurrence).getTime() - new Date(a.last_occurrence).getTime()
  )[0];
}
