import fs from "node:fs";
import path from "node:path";

import type {
  ActionLifecycle,
  CurrentBlocker,
  DecisionSurfacePayload,
  FrontierOverride,
  FrontierQueueItem,
  FrontierRef,
  Proposal,
  ReceiptCenterEntry,
  TransportActionFile,
  TransportReceiptFile
} from "@/protocol/index";
import { SOLEDASH_PROTOCOL_VERSION } from "@/protocol/index";

const ROOT = process.cwd();
const SOLEDASH_DIR = path.join(ROOT, "foreman", "soledash");
const SURFACE_FILE = path.join(SOLEDASH_DIR, "DECISION_SURFACE.json");
const RECEIPTS_DIR = path.join(SOLEDASH_DIR, "receipts");
const ACTIONS_DIR = path.join(SOLEDASH_DIR, "actions");

export type LiveTransportLoadResult =
  | { ok: true; payload: DecisionSurfacePayload; receipts: ReceiptCenterEntry[]; latestAction: ActionLifecycle | null }
  | { ok: false; error: string };

function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function listJsonFiles(dir: string): string[] {
  try {
    return fs
      .readdirSync(dir)
      .filter((name) => name.endsWith(".json"))
      .map((name) => path.join(dir, name));
  } catch {
    return [];
  }
}

function sortByUpdatedAt<T extends { updated_at: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export function loadTransportReceipts(surfaceMock: boolean): ReceiptCenterEntry[] {
  const files = listJsonFiles(RECEIPTS_DIR);
  const parsed: TransportReceiptFile[] = [];

  for (const file of files) {
    const raw = readJsonFile<TransportReceiptFile>(file);
    if (!raw?.action_id || !raw.status || !raw.updated_at) continue;
    parsed.push(raw);
  }

  return sortByUpdatedAt(parsed).map((row) => ({
    action_id: row.action_id,
    target: row.target,
    owner: row.owner ?? null,
    created_at: row.created_at,
    status: row.status,
    last_update: row.updated_at,
    receipt_link: row.receipt_link ?? null,
    mock: surfaceMock && !row.simulated,
    simulated: row.simulated ?? false,
    mock_test: row.mock_test ?? row.action_id.startsWith("mock_test_")
  }));
}

export function loadTransportActions(surfaceMock: boolean): ActionLifecycle[] {
  const files = listJsonFiles(ACTIONS_DIR);
  const parsed: TransportActionFile[] = [];

  for (const file of files) {
    const raw = readJsonFile<TransportActionFile>(file);
    if (!raw?.action_id || !raw.phase || !raw.updated_at) continue;
    parsed.push(raw);
  }

  return sortByUpdatedAt(parsed).map((row) => ({
    phase: row.phase,
    action: row.action,
    action_id: row.action_id,
    proposal_id: row.proposal_id,
    updated_at: row.updated_at,
    message: row.message,
    route_owner: row.route_owner ?? null,
    mock: surfaceMock && !row.simulated,
    simulated: row.simulated ?? false,
    failure_reason: row.failure_reason ?? null
  }));
}

function toFrontierRef(item: FrontierQueueItem): FrontierRef {
  return {
    action_code: item.action_code ?? item.proposal_id,
    proposal_id: item.proposal_id,
    title: item.title
  };
}

function buildFrontierOverride(
  frontier: FrontierQueueItem | null | undefined,
  machineFrontier: FrontierQueueItem | null | undefined,
  machineWhy: string | null | undefined
): FrontierOverride | null {
  if (!machineFrontier) return null;

  const operatorSelected =
    frontier && frontier.rank_source === "OPERATOR" ? toFrontierRef(frontier) : null;

  let queueBadge: FrontierOverride["queue_badge"] = "MACHINE";
  if (operatorSelected && operatorSelected.proposal_id !== machineFrontier.proposal_id) {
    queueBadge = "MIXED";
  } else if (frontier?.rank_source === "OPERATOR") {
    queueBadge = "OPERATOR";
  }

  return {
    machine_recommends: toFrontierRef(machineFrontier),
    operator_selected: operatorSelected,
    current_source: frontier?.rank_source ?? "MACHINE",
    queue_badge: queueBadge,
    machine_why_number_one: machineWhy ?? null
  };
}

function frontierToProposal(
  item: FrontierQueueItem,
  fallback: Proposal | null,
  queueLen: number
): Proposal {
  return {
    id: item.proposal_id,
    action_code: item.action_code,
    title: item.title,
    summary: fallback?.summary ?? "",
    queue_behind: Math.max(0, queueLen - 1),
    evidence_status: item.evidence_status
  };
}

function isLiveTransportPayload(raw: unknown): raw is DecisionSurfacePayload {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  return (
    o.schema_version === SOLEDASH_PROTOCOL_VERSION &&
    typeof o.generated_at === "string" &&
    o.live_transport === true
  );
}

function mergeActiveOwner(payload: DecisionSurfacePayload): DecisionSurfacePayload {
  const owner = payload.active_owner ?? payload.queue_brain?.active_owner ?? null;
  return {
    ...payload,
    queue_brain: {
      ...payload.queue_brain,
      active_owner: owner
    }
  };
}

export function loadLiveTransport(): LiveTransportLoadResult {
  if (!fs.existsSync(SURFACE_FILE)) {
    return { ok: false, error: "DECISION_SURFACE.json not found" };
  }

  const raw = readJsonFile<unknown>(SURFACE_FILE);
  if (!raw) {
    return { ok: false, error: "DECISION_SURFACE.json unreadable or invalid JSON" };
  }

  if (!isLiveTransportPayload(raw)) {
    return { ok: false, error: "DECISION_SURFACE.json missing live_transport contract" };
  }

  const surfaceMock = raw.mock === true;
  const receipts = loadTransportReceipts(surfaceMock);
  const actions = loadTransportActions(surfaceMock);
  const latestAction = actions[0] ?? null;

  const frontier = raw.frontier ?? null;
  const machineFrontier = raw.machine_frontier ?? null;
  const queueItems = raw.queue_items ?? raw.frontier_queue ?? [];
  const top3 = raw.top_3_alternatives ?? [];

  const existingProposal = raw.proposal ?? null;
  const proposal =
    existingProposal ??
    (frontier ? frontierToProposal(frontier, existingProposal, queueItems.length) : null);

  const frontierOverride =
    raw.frontier_override ??
    buildFrontierOverride(frontier, machineFrontier, raw.machine_why_number_one);

  const currentBlocker: CurrentBlocker | null =
    raw.current_blocker ??
    ({
      headline: "No current_blocker slot in live payload",
      detail: null,
      mock: surfaceMock
    } as CurrentBlocker);

  const payload: DecisionSurfacePayload = mergeActiveOwner({
    ...raw,
    generated_at: raw.updated_at ?? raw.generated_at,
    proposal,
    frontier_queue: queueItems,
    frontier_override: frontierOverride,
    current_blocker: currentBlocker,
    receipt_center: receipts,
    action_lifecycle: latestAction ?? raw.action_lifecycle ?? null,
    frontier,
    machine_frontier: machineFrontier,
    top_3_alternatives: top3,
    queue_items: queueItems
  });

  return { ok: true, payload, receipts, latestAction };
}

export function surfaceFileExists(): boolean {
  return fs.existsSync(SURFACE_FILE);
}
