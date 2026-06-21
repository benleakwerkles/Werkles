import fs from "node:fs";
import path from "node:path";

export type SwatterScoreboardEvent = "approval_suppressed" | "permission_swatted";

export type PermissionSwatterScoreboard = {
  total: number;
  approval_suppressed: number;
  permission_swatted: number;
  display: string;
  source_path: string;
  counted_at: string;
};

const ROOT = process.cwd();
const SWATTER_DIR = path.join(ROOT, "foreman", "soledash", "approval-swatter-alpha");
const RECEIPTS_DIR = path.join(SWATTER_DIR, "receipts");
const PROCESSED_DIR = path.join(SWATTER_DIR, "processed");

const SCOREBOARD_TYPES = new Set<SwatterScoreboardEvent>([
  "approval_suppressed",
  "permission_swatted"
]);

export const SCOREBOARD_EVENT_TYPES = SCOREBOARD_TYPES;

function readJson(file: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function eventKey(record: Record<string, unknown>, fallback: string): string {
  const id = record.decision_id ?? record.prompt_id ?? record.id;
  return typeof id === "string" && id.trim() ? id.trim() : fallback;
}

export function classifyProcessedDecision(record: Record<string, unknown>): SwatterScoreboardEvent | null {
  const swatterEvent = record.swatter_event;
  if (typeof swatterEvent === "string" && SCOREBOARD_TYPES.has(swatterEvent as SwatterScoreboardEvent)) {
    return swatterEvent as SwatterScoreboardEvent;
  }

  const origin = typeof record.origin === "string" ? record.origin : "";
  const approvalClass = typeof record.approval_class === "string" ? record.approval_class : "";
  const action = typeof record.action === "string" ? record.action : "";
  const execution =
    record.execution && typeof record.execution === "object"
      ? (record.execution as Record<string, unknown>)
      : null;

  if (origin === "soledash_permission_fly") {
    if (approvalClass === "GREEN") return "permission_swatted";
    if (approvalClass === "BLUE" && execution?.ok === true) return "permission_swatted";
    return null;
  }

  if (approvalClass === "GREEN" && action === "AUTO_APPROVED_SILENT") {
    return "approval_suppressed";
  }

  return null;
}

function addEvent(
  tallies: { total: number; approval_suppressed: number; permission_swatted: number },
  seen: Set<string>,
  key: string,
  kind: SwatterScoreboardEvent
) {
  if (seen.has(key)) return;
  seen.add(key);
  tallies.total += 1;
  if (kind === "approval_suppressed") tallies.approval_suppressed += 1;
  if (kind === "permission_swatted") tallies.permission_swatted += 1;
}

/** Count real swatter scoreboard events from receipts + processed decision artifacts. */
export function loadPermissionSwatterScoreboard(): PermissionSwatterScoreboard {
  const tallies = { total: 0, approval_suppressed: 0, permission_swatted: 0 };
  const seen = new Set<string>();

  if (fs.existsSync(RECEIPTS_DIR)) {
    for (const name of fs.readdirSync(RECEIPTS_DIR)) {
      if (!name.toLowerCase().endsWith(".json")) continue;
      const file = path.join(RECEIPTS_DIR, name);
      if (!fs.statSync(file).isFile()) continue;
      const record = readJson(file);
      if (!record) continue;
      const receiptType = record.receipt_type;
      if (typeof receiptType !== "string" || !SCOREBOARD_TYPES.has(receiptType as SwatterScoreboardEvent)) {
        continue;
      }
      addEvent(tallies, seen, eventKey(record, name), receiptType as SwatterScoreboardEvent);
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
      addEvent(tallies, seen, eventKey(record, name), kind);
    }
  }

  return {
    total: tallies.total,
    approval_suppressed: tallies.approval_suppressed,
    permission_swatted: tallies.permission_swatted,
    display: String(tallies.total).padStart(9, "0"),
    source_path: path.relative(ROOT, RECEIPTS_DIR).split(path.sep).join("/"),
    counted_at: new Date().toISOString()
  };
}
