"use client";

import type {
  ActionLifecycle,
  MockTestFailureMode,
  MockTestResult,
  MockTestRoute,
  MockTestRunResponse,
  ReceiptCenterEntry
} from "@/protocol/index";
import { MOCK_TEST_ROUTES, MOCK_TEST_ROUTE_LIST } from "@/lib/soledash/mock-test/routes";
import { stepLifecycle } from "@/lib/soledash/mock-test/shared";
import { upsertReceiptEntry, receiptFromLifecycle } from "@/lib/soledash/decision-surface/receipt-center";

const STORAGE_KEY = "soledash_mock_test_receipts_v1";
const LAST_MOCK_KEY = "soledash_last_mock_test_v1";
const MAX_CLIENT_RECEIPTS = 24;

export function loadLastMockTest(): MockTestResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_MOCK_KEY);
    return raw ? (JSON.parse(raw) as MockTestResult) : null;
  } catch {
    return null;
  }
}

export function saveLastMockTest(result: MockTestResult): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(LAST_MOCK_KEY, JSON.stringify(result));
  }
}

export function loadClientMockReceipts(): ReceiptCenterEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReceiptCenterEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_CLIENT_RECEIPTS) : [];
  } catch {
    return [];
  }
}

export function saveClientMockReceipt(entry: ReceiptCenterEntry): ReceiptCenterEntry[] {
  const next = [entry, ...loadClientMockReceipts()].slice(0, MAX_CLIENT_RECEIPTS);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export async function animateMockTestSteps(
  steps: MockTestRunResponse["lifecycle_steps"],
  action: string,
  proposalId: string,
  actionId: string,
  routeOwner: string | null,
  failureMode: MockTestFailureMode,
  onLifecycle: (lc: ActionLifecycle) => void,
  onReceiptPatch: (entry: ReceiptCenterEntry) => void,
  target: string,
  owner: string | null
): Promise<ActionLifecycle> {
  let current = stepLifecycle(steps[0], action, proposalId, actionId, routeOwner, failureMode);
  onLifecycle(current);
  onReceiptPatch(receiptFromLifecycle(current, target, owner, false));

  for (const phase of steps.slice(1)) {
    await new Promise((r) => setTimeout(r, phase === "queued" ? 140 : 320));
    current = stepLifecycle(phase, action, proposalId, actionId, routeOwner, failureMode);
    onLifecycle(current);
    onReceiptPatch(receiptFromLifecycle({ ...current, simulated: true }, target, owner, false));
  }

  return current;
}

export async function executeMockTest(input: {
  route: MockTestRoute;
  proposalId: string;
  failureMode: MockTestFailureMode;
  actionCode?: string | null;
  frontierTitle?: string | null;
  actionOverride?: string | null;
  onLifecycle: (lc: ActionLifecycle) => void;
  onReceipt: (entry: ReceiptCenterEntry) => void;
  onResult: (result: MockTestResult) => void;
  onDecisionReceipt: (receipt: MockTestRunResponse["decision_receipt"]) => void;
}): Promise<MockTestRunResponse | null> {
  const res = await fetch("/api/soledash/v1/mock-test/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      route: input.route,
      proposal_id: input.proposalId,
      failure_mode: input.failureMode,
      action_code: input.actionCode ?? null,
      frontier_title: input.frontierTitle ?? null,
      action_override: input.actionOverride ?? null
    })
  });

  const data = (await res.json()) as MockTestRunResponse & { error?: string };
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? `Mock test failed (${res.status})`);
  }

  const cfg = MOCK_TEST_ROUTES[input.route];
  const routeOwner = cfg.owner;
  const action = input.actionOverride?.trim() || cfg.action;

  await animateMockTestSteps(
    data.lifecycle_steps,
    action,
    input.proposalId,
    data.result.action_id,
    routeOwner,
    input.failureMode,
    input.onLifecycle,
    (patch) => {
      const merged = {
        ...patch,
        mock_test: true,
        simulated: true,
        receipt_link: data.result.written_to
      };
      input.onReceipt(merged);
    },
    data.receipt_entry.target,
    data.receipt_entry.owner
  );

  input.onLifecycle(data.action_lifecycle);
  input.onReceipt(data.receipt_entry);
  input.onResult(data.result);
  input.onDecisionReceipt(data.decision_receipt);

  if (data.result.client_only) {
    saveClientMockReceipt(data.receipt_entry);
  }

  return data;
}

export function mergeMockReceipts(
  serverEntries: ReceiptCenterEntry[],
  clientEntries: ReceiptCenterEntry[],
  sessionEntries: ReceiptCenterEntry[]
): ReceiptCenterEntry[] {
  const byId = new Map<string, ReceiptCenterEntry>();
  for (const e of [...serverEntries, ...clientEntries, ...sessionEntries]) {
    byId.set(e.action_id, e);
  }
  return [...byId.values()].sort(
    (a, b) => new Date(b.last_update).getTime() - new Date(a.last_update).getTime()
  );
}

export function upsertSessionReceipt(
  entries: ReceiptCenterEntry[],
  patch: ReceiptCenterEntry
): ReceiptCenterEntry[] {
  return upsertReceiptEntry(entries, { ...patch, mock_test: true, simulated: true });
}

export { MOCK_TEST_ROUTE_LIST };

export const FAILURE_MODE_OPTIONS: { id: MockTestFailureMode; label: string }[] = [
  { id: "success", label: "Success" },
  { id: "failed_transport", label: "Failed transport" },
  { id: "blocked_red_gate", label: "Blocked by RED gate" },
  { id: "waiting_for_owner", label: "Waiting for owner" },
  { id: "missing_live_payload", label: "Missing live payload" }
];
