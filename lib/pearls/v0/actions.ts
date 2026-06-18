import type { PearlAction, PearlDraftTask, PearlShelfStore, PearlStatus, PearlV0 } from "./types";
import { TERMINAL_PEARL_STATUSES } from "./types";

export type PearlActionResult = {
  ok: boolean;
  pearl: PearlV0 | null;
  error: string | null;
  duplicate_draft: boolean;
};

function draftTaskForPearl(pearl: PearlV0): PearlDraftTask {
  return {
    task_id: `draft_${pearl.pearl_id}`,
    title: `Draft: ${pearl.title}`,
    summary: `Promoted from pearl — ${pearl.core_principle}`
  };
}

function canApplyAction(status: PearlStatus, action: PearlAction): boolean {
  if (TERMINAL_PEARL_STATUSES.has(status)) return false;
  switch (action) {
    case "review":
      return status === "NEW";
    case "promote":
      return status === "REVIEWED";
    case "archive":
    case "kill":
      return status === "NEW" || status === "REVIEWED" || status === "PROMOTED";
    default:
      return false;
  }
}

function nextStatus(action: PearlAction): PearlStatus {
  switch (action) {
    case "review":
      return "REVIEWED";
    case "promote":
      return "PROMOTED";
    case "archive":
      return "ARCHIVED";
    case "kill":
      return "KILLED";
  }
}

export function applyPearlAction(store: PearlShelfStore, pearlId: string, action: PearlAction): PearlActionResult {
  const index = store.pearls.findIndex((pearl) => pearl.pearl_id === pearlId);
  if (index < 0) {
    return { ok: false, pearl: null, error: "Pearl not found", duplicate_draft: false };
  }

  const current = store.pearls[index]!;
  if (!canApplyAction(current.status, action)) {
    return {
      ok: false,
      pearl: current,
      error: `Cannot ${action} pearl in ${current.status} state`,
      duplicate_draft: false
    };
  }

  const updated: PearlV0 = {
    ...current,
    status: nextStatus(action),
    updated_at: new Date().toISOString()
  };

  if (action === "promote") {
    if (current.linked_draft_task) {
      return {
        ok: false,
        pearl: current,
        error: "Draft task already linked — no duplicate draft",
        duplicate_draft: true
      };
    }
    updated.linked_draft_task = draftTaskForPearl(current);
  }

  if (action === "archive" || action === "kill") {
    updated.linked_draft_task = current.linked_draft_task;
  }

  store.pearls[index] = updated;
  return { ok: true, pearl: updated, error: null, duplicate_draft: false };
}

export function pearlActionsFor(status: PearlStatus): PearlAction[] {
  if (TERMINAL_PEARL_STATUSES.has(status)) return [];
  if (status === "NEW") return ["review", "archive", "kill"];
  if (status === "REVIEWED") return ["promote", "archive", "kill"];
  if (status === "PROMOTED") return ["archive", "kill"];
  return [];
}
