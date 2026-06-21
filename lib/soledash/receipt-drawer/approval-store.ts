import {
  approvalStoreKey,
  DEFAULT_DRAWER_APPROVER,
  parseCardIdFromReceiptId,
  type ApprovalCounter,
  type DrawerAction,
  type DrawerDispositionRecord,
  type DrawerStore,
  type DrawerStoreV1
} from "./types";

const ACTION_TO_DISPOSITION: Record<DrawerAction, DrawerDispositionRecord["disposition"]> = {
  approve: "approved",
  reject: "rejected",
  follow_up: "follow_up"
};

export function emptyDrawerStore(): DrawerStore {
  return { version: 2, approvals: {} };
}

export function migrateDrawerStoreV1(raw: DrawerStoreV1): DrawerStore {
  const store = emptyDrawerStore();

  for (const [receiptId, legacy] of Object.entries(raw.entries ?? {})) {
    const cardId = parseCardIdFromReceiptId(receiptId);
    const approver = legacy.acted_by?.trim() || DEFAULT_DRAWER_APPROVER;
    const key = approvalStoreKey(cardId, approver);
    if (store.approvals[key]) continue;

    store.approvals[key] = {
      card_id: cardId,
      receipt_id: receiptId,
      disposition: legacy.disposition,
      acted_at: legacy.acted_at,
      acted_by: approver,
      note: legacy.note ?? null
    };
  }

  return store;
}

export function normalizeDrawerStore(raw: unknown): DrawerStore {
  if (!raw || typeof raw !== "object") return emptyDrawerStore();

  const record = raw as Record<string, unknown>;
  const version = record.version;

  if (version === 2 && record.approvals && typeof record.approvals === "object") {
    return { version: 2, approvals: { ...(record.approvals as DrawerStore["approvals"]) } };
  }

  if (version === 1 && record.entries && typeof record.entries === "object") {
    return migrateDrawerStoreV1(record as DrawerStoreV1);
  }

  return emptyDrawerStore();
}

export function countUniqueApprovedCards(store: DrawerStore): ApprovalCounter {
  const cardIds = new Set<string>();

  for (const record of Object.values(store.approvals)) {
    if (record.disposition !== "approved") continue;
    cardIds.add(record.card_id);
  }

  return { uniqueApproved: cardIds.size };
}

export type WriteDrawerDispositionResult = {
  record: DrawerDispositionRecord;
  duplicate: boolean;
  counter: ApprovalCounter;
  message: string | null;
};

export function applyDrawerDisposition(
  store: DrawerStore,
  input: {
    receiptId: string;
    cardId?: string | null;
    action: DrawerAction;
    approver?: string | null;
    note?: string | null;
  }
): { store: DrawerStore; result: WriteDrawerDispositionResult } {
  const receiptId = input.receiptId.trim();
  const cardId = (input.cardId?.trim() || parseCardIdFromReceiptId(receiptId)).trim();
  const approver = input.approver?.trim() || DEFAULT_DRAWER_APPROVER;
  const key = approvalStoreKey(cardId, approver);
  const existing = store.approvals[key] ?? null;

  if (input.action === "approve" && existing?.disposition === "approved") {
    const counter = countUniqueApprovedCards(store);
    const when = new Date(existing.acted_at).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    return {
      store,
      result: {
        record: existing,
        duplicate: true,
        counter,
        message: `Already approved by ${existing.acted_by} at ${when}. No action taken.`
      }
    };
  }

  const record: DrawerDispositionRecord = {
    card_id: cardId,
    receipt_id: receiptId,
    disposition: ACTION_TO_DISPOSITION[input.action],
    acted_at: new Date().toISOString(),
    acted_by: approver,
    note: input.note?.trim() || null
  };

  const nextStore: DrawerStore = {
    version: 2,
    approvals: { ...store.approvals, [key]: record }
  };

  return {
    store: nextStore,
    result: {
      record,
      duplicate: false,
      counter: countUniqueApprovedCards(nextStore),
      message: null
    }
  };
}

export function defaultDrawerApprover(): string {
  return DEFAULT_DRAWER_APPROVER;
}

export const DRAWER_STORE_REL_PATH = "foreman/soledash/RECEIPT_DRAWER.json";
