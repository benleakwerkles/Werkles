import fs from "node:fs";
import path from "node:path";

import type { SwatterScoreboardEvent } from "@/lib/soledash/permission-swatter/load-scoreboard";
import {
  classifyProcessedDecision,
  eventKey,
  SCOREBOARD_EVENT_TYPES
} from "@/lib/soledash/permission-swatter/load-scoreboard";

export type SwatterReceiptLogEntry = {
  id: string;
  kind: SwatterScoreboardEvent;
  label: string;
  timestamp: string;
  detail: string;
  source_file: string;
};

const ROOT = process.cwd();
const SWATTER_DIR = path.join(ROOT, "foreman", "soledash", "approval-swatter-alpha");
const RECEIPTS_DIR = path.join(SWATTER_DIR, "receipts");
const PROCESSED_DIR = path.join(SWATTER_DIR, "processed");

function readJson(file: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function labelFromRecord(record: Record<string, unknown>, fallback: string): string {
  const candidates = [
    record.policy_label,
    record.prompt,
    record.prompt_id,
    record.candidate_label,
    record.id
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function timestampFromRecord(record: Record<string, unknown>, fallback: string): string {
  const candidates = [record.timestamp, record.decided_at, record.received_at];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function detailFromRecord(record: Record<string, unknown>, kind: SwatterScoreboardEvent): string {
  const action = typeof record.action === "string" ? record.action : "";
  const reason = typeof record.reason === "string" ? record.reason : "";
  if (kind === "approval_suppressed") {
    return reason || action || "Approval suppressed silently";
  }
  return reason || action || "Permission fly swatted";
}

function pushEntry(
  entries: SwatterReceiptLogEntry[],
  seen: Set<string>,
  record: Record<string, unknown>,
  kind: SwatterScoreboardEvent,
  sourceFile: string,
  fallbackId: string
) {
  const id = eventKey(record, fallbackId);
  if (seen.has(id)) return;
  seen.add(id);
  entries.push({
    id,
    kind,
    label: labelFromRecord(record, fallbackId),
    timestamp: timestampFromRecord(record, new Date(0).toISOString()),
    detail: detailFromRecord(record, kind),
    source_file: path.relative(ROOT, sourceFile).split(path.sep).join("/")
  });
}

/** Latest swatter scoreboard events from receipts + processed artifacts. */
export function loadPermissionSwatterReceiptLog(): SwatterReceiptLogEntry[] {
  const entries: SwatterReceiptLogEntry[] = [];
  const seen = new Set<string>();

  if (fs.existsSync(RECEIPTS_DIR)) {
    for (const name of fs.readdirSync(RECEIPTS_DIR)) {
      if (!name.toLowerCase().endsWith(".json")) continue;
      const file = path.join(RECEIPTS_DIR, name);
      if (!fs.statSync(file).isFile()) continue;
      const record = readJson(file);
      if (!record) continue;
      const receiptType = record.receipt_type;
      if (typeof receiptType !== "string" || !SCOREBOARD_EVENT_TYPES.has(receiptType as SwatterScoreboardEvent)) {
        continue;
      }
      pushEntry(entries, seen, record, receiptType as SwatterScoreboardEvent, file, name);
    }
  }

  if (fs.existsSync(PROCESSED_DIR)) {
    for (const name of fs.readdirSync(PROCESSED_DIR)) {
      if (!name.toLowerCase().endsWith(".json")) continue;
      const file = path.join(PROCESSED_DIR, name);
      if (!fs.statSync(file).isFile()) continue;
      const record = readJson(file);
      if (!record) continue;
      const kind = classifyProcessedDecision(record);
      if (!kind) continue;
      pushEntry(entries, seen, record, kind, file, name);
    }
  }

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
