import fs from "node:fs";
import path from "node:path";

import type { WisdomWatchActionResult, WisdomWatchPanel, WisdomWatchReport } from "./types";

const ROOT = process.cwd();
export const WISDOM_DIR = path.join(ROOT, "foreman", "soledash", "wisdom-watch");
export const REPORT_JSON = path.join(WISDOM_DIR, "LATEST_REPORT.json");
export const REPORT_MD = path.join(WISDOM_DIR, "LATEST_REPORT.md");
const STATE_FILE = path.join(WISDOM_DIR, "state.json");
const RECEIPTS_DIR = path.join(WISDOM_DIR, "receipts");

export function rel(p: string): string {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

export function ensureWisdomDirs(): void {
  fs.mkdirSync(WISDOM_DIR, { recursive: true });
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

type WatchState = {
  resolved_ids: string[];
  parked: boolean;
  parked_reason: string | null;
  parked_at: string | null;
  last_action: string | null;
};

export function loadWatchState(): WatchState {
  ensureWisdomDirs();
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as WatchState;
  } catch {
    return {
      resolved_ids: [],
      parked: false,
      parked_reason: null,
      parked_at: null,
      last_action: null
    };
  }
}

export function saveWatchState(state: WatchState): void {
  ensureWisdomDirs();
  fs.writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export function readReportJson(): WisdomWatchReport | null {
  try {
    return JSON.parse(fs.readFileSync(REPORT_JSON, "utf8")) as WisdomWatchReport;
  } catch {
    return null;
  }
}

export function writeReport(report: WisdomWatchReport, markdown: string): void {
  ensureWisdomDirs();
  fs.writeFileSync(REPORT_JSON, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(REPORT_MD, markdown, "utf8");
}

export function readReportMarkdown(): string | null {
  try {
    return fs.readFileSync(REPORT_MD, "utf8");
  } catch {
    return null;
  }
}

export function writeActionReceipt(result: WisdomWatchActionResult): string {
  ensureWisdomDirs();
  const id = `ww_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const file = path.join(RECEIPTS_DIR, `${id}.json`);
  fs.writeFileSync(
    file,
    `${JSON.stringify({ receipt_id: id, at: new Date().toISOString(), ...result }, null, 2)}\n`,
    "utf8"
  );
  return rel(file);
}

export function severityRank(severity: string): number {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

export function topRisksForPanel(report: WisdomWatchReport, state: WatchState) {
  return report.risks
    .filter((r) => !state.resolved_ids.includes(r.id))
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 5);
}

export function buildPanel(report: WisdomWatchReport): WisdomWatchPanel {
  const state = loadWatchState();
  return {
    report,
    top_risks: topRisksForPanel(report, state),
    parked: state.parked,
    parked_reason: state.parked_reason,
    resolved_ids: state.resolved_ids
  };
}
