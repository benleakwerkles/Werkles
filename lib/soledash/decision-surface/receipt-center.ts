import type {
  ActionLifecycle,
  ActionLifecyclePhase,
  ReceiptCenterEntry,
  ReceiptCenterStatus
} from "@/protocol/index";

const MOCK_RECEIPT_PATH = "foreman/soledash/RECEIPT_CENTER.jsonl (mock — Dink owns live writes)";

export function lifecycleToReceiptStatus(phase: ActionLifecyclePhase): ReceiptCenterStatus {
  switch (phase) {
    case "clicked":
      return "drafted";
    case "queued":
      return "queued";
    case "sent":
      return "sent";
    case "received":
      return "received";
    case "working":
      return "working";
    case "resolved":
      return "resolved";
    case "failed":
      return "failed";
    default:
      return "drafted";
  }
}

export function upsertReceiptEntry(
  entries: ReceiptCenterEntry[],
  patch: ReceiptCenterEntry
): ReceiptCenterEntry[] {
  const idx = entries.findIndex((e) => e.action_id === patch.action_id);
  if (idx < 0) return [patch, ...entries];
  const next = [...entries];
  next[idx] = { ...next[idx], ...patch, last_update: patch.last_update };
  return next;
}

export function receiptFromLifecycle(
  lifecycle: ActionLifecycle,
  target: string,
  owner: string | null,
  mock: boolean
): ReceiptCenterEntry {
  const status = lifecycleToReceiptStatus(lifecycle.phase);
  return {
    action_id: lifecycle.action_id ?? `act_${Date.now()}`,
    target,
    owner,
    created_at: lifecycle.updated_at,
    status,
    last_update: lifecycle.updated_at,
    receipt_link: mock ? MOCK_RECEIPT_PATH : lifecycle.action_id,
    mock
  };
}

export function createReceiptEntry(
  actionId: string,
  target: string,
  owner: string | null,
  status: ReceiptCenterStatus,
  mock: boolean
): ReceiptCenterEntry {
  const now = new Date().toISOString();
  return {
    action_id: actionId,
    target,
    owner,
    created_at: now,
    status,
    last_update: now,
    receipt_link: mock ? MOCK_RECEIPT_PATH : actionId,
    mock
  };
}

export function advanceReceiptStatus(
  entries: ReceiptCenterEntry[],
  actionId: string,
  status: ReceiptCenterStatus
): ReceiptCenterEntry[] {
  const now = new Date().toISOString();
  return entries.map((e) =>
    e.action_id === actionId ? { ...e, status, last_update: now } : e
  );
}
