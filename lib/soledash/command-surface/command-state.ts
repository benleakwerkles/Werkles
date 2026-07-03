import fs from "node:fs";
import path from "node:path";

import type { BuildDecision, CommandState, DecisionLogEntry, ProposedBuild } from "./v1-types";

const ROOT = process.cwd();
const STATE_DIR = path.join(ROOT, "foreman", "soledash");
const STATE_FILE = path.join(STATE_DIR, "COMMAND_STATE.json");
const LOG_FILE = path.join(STATE_DIR, "DECISION_LOG.jsonl");

const EMPTY_STATE: CommandState = {
  version: "v1",
  builds: [],
  freeformPending: null
};

export function readCommandState(): CommandState {
  try {
    const raw = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as CommandState;
    if (raw.version !== "v1") return { ...EMPTY_STATE };
    return {
      version: "v1",
      builds: raw.builds ?? [],
      freeformPending: raw.freeformPending ?? null
    };
  } catch {
    return { ...EMPTY_STATE };
  }
}

export function writeCommandState(state: CommandState) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

export function appendDecision(entry: Omit<DecisionLogEntry, "id" | "at"> & { at?: string }) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const line: DecisionLogEntry = {
    id: `dec_${Date.now()}`,
    at: entry.at ?? new Date().toISOString(),
    buildId: entry.buildId,
    decision: entry.decision,
    note: entry.note ?? null,
    outboxPath: entry.outboxPath ?? null
  };
  fs.appendFileSync(LOG_FILE, `${JSON.stringify(line)}\n`, "utf8");
  return line;
}

export function upsertBuild(state: CommandState, build: ProposedBuild): CommandState {
  const idx = state.builds.findIndex((b) => b.id === build.id);
  const builds =
    idx >= 0 ? state.builds.map((b, i) => (i === idx ? build : b)) : [...state.builds, build];
  return { ...state, builds };
}

export function findBuild(state: CommandState, id: string): ProposedBuild | undefined {
  return state.builds.find((b) => b.id === id);
}

export function slugify(text: string, max = 48): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, max);
}

export function timestampSlug(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`;
}

export function applyDecision(
  state: CommandState,
  buildId: string,
  decision: BuildDecision,
  note?: string
): { state: CommandState; build: ProposedBuild | null } {
  const build = findBuild(state, buildId);
  if (!build) return { state, build: null };

  let updated: ProposedBuild = { ...build, updatedAt: new Date().toISOString() };

  switch (decision) {
    case "nay":
      updated = { ...updated, status: "dropped", blocker: null };
      break;
    case "defer":
      updated = { ...updated, status: "deferred", blocker: null };
      break;
    case "escalate":
      updated = {
        ...updated,
        status: "escalated",
        cousin: "PETRA",
        machine: "ChatGPT — Comptroller",
        blocker: null
      };
      break;
    case "modify":
      updated = { ...updated, status: "proposed" };
      break;
    case "more_info":
      break;
    default:
      break;
  }

  const next = upsertBuild(state, updated);
  appendDecision({ buildId, decision, note: note ?? null, outboxPath: updated.outboxPath });
  return { state: next, build: updated };
}
