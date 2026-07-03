export type PearlState = "NEW" | "REVIEWED" | "PROMOTED" | "ARCHIVED" | "KILLED";

export type Pearl = {
  pearl_id: string;
  title: string;
  source: string;
  note: string;
  state: PearlState;
  created_at: string;
  updated_at: string;
  task_card_id?: string;
};

export type DraftTaskCard = {
  task_card_id: string;
  pearl_id: string;
  title: string;
  status: "DRAFT";
  created_at: string;
  receipt: {
    created_from: "PEARL_PROMOTION_PIPELINE";
    pearl_id: string;
  };
};

export type PearlRegistry = {
  registry_id: "pearl-promotion-pipeline-v0";
  created_at: string;
  updated_at: string;
  pearls: Pearl[];
  draft_task_cards: DraftTaskCard[];
};

export type PearlReceipt = {
  ok: true;
  pearl_id: string;
  from_state?: PearlState;
  to_state: PearlState;
  task_card_id?: string;
  receipt: string;
};

export const PEARL_STATES: PearlState[] = ["NEW", "REVIEWED", "PROMOTED", "ARCHIVED", "KILLED"];

const TERMINAL_STATES: PearlState[] = ["ARCHIVED", "KILLED"];

function nowIso() {
  return new Date().toISOString();
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function makeId(prefix: string, value: string) {
  const stable = slug(value) || "untitled";
  return `${prefix}-${stable}`;
}

export function createEmptyPearlRegistry(): PearlRegistry {
  const createdAt = nowIso();
  return {
    registry_id: "pearl-promotion-pipeline-v0",
    created_at: createdAt,
    updated_at: createdAt,
    pearls: [],
    draft_task_cards: [],
  };
}

export function createPearl(
  registry: PearlRegistry,
  input: { title: string; source?: string; note?: string; pearl_id?: string }
): { registry: PearlRegistry; pearl: Pearl; receipt: PearlReceipt } {
  const timestamp = nowIso();
  const pearlId = input.pearl_id || makeId("pearl", input.title);
  const existing = registry.pearls.find((pearl) => pearl.pearl_id === pearlId);

  if (existing) {
    return {
      registry,
      pearl: existing,
      receipt: {
        ok: true,
        pearl_id: existing.pearl_id,
        to_state: existing.state,
        task_card_id: existing.task_card_id,
        receipt: "existing pearl returned without duplicate",
      },
    };
  }

  const pearl: Pearl = {
    pearl_id: pearlId,
    title: input.title,
    source: input.source || "crawler",
    note: input.note || "",
    state: "NEW",
    created_at: timestamp,
    updated_at: timestamp,
  };

  const nextRegistry = {
    ...registry,
    updated_at: timestamp,
    pearls: [...registry.pearls, pearl],
  };

  return {
    registry: nextRegistry,
    pearl,
    receipt: {
      ok: true,
      pearl_id: pearl.pearl_id,
      to_state: "NEW",
      receipt: "crawler discovery captured as NEW pearl",
    },
  };
}

function canTransition(fromState: PearlState, toState: PearlState) {
  if (fromState === toState) return true;
  if (TERMINAL_STATES.includes(fromState)) return false;
  if (toState === "NEW") return false;
  return true;
}

function createDraftTaskCard(pearl: Pearl, timestamp: string): DraftTaskCard {
  return {
    task_card_id: makeId("task", pearl.pearl_id),
    pearl_id: pearl.pearl_id,
    title: `Draft build candidate: ${pearl.title}`,
    status: "DRAFT",
    created_at: timestamp,
    receipt: {
      created_from: "PEARL_PROMOTION_PIPELINE",
      pearl_id: pearl.pearl_id,
    },
  };
}

export function transitionPearl(
  registry: PearlRegistry,
  pearlId: string,
  toState: PearlState
): { registry: PearlRegistry; pearl: Pearl; task_card?: DraftTaskCard; receipt: PearlReceipt } {
  if (!PEARL_STATES.includes(toState)) {
    throw new Error(`Unknown pearl state: ${toState}`);
  }

  const pearl = registry.pearls.find((candidate) => candidate.pearl_id === pearlId);
  if (!pearl) {
    throw new Error(`Pearl not found: ${pearlId}`);
  }

  if (!canTransition(pearl.state, toState)) {
    throw new Error(`Invalid pearl transition: ${pearl.state} -> ${toState}`);
  }

  const timestamp = nowIso();
  const fromState = pearl.state;
  let taskCard = registry.draft_task_cards.find((candidate) => candidate.pearl_id === pearl.pearl_id);

  if (toState === "PROMOTED" && !taskCard) {
    taskCard = createDraftTaskCard(pearl, timestamp);
  }

  const updatedPearl: Pearl = {
    ...pearl,
    state: toState,
    updated_at: timestamp,
    task_card_id: taskCard?.task_card_id || pearl.task_card_id,
  };

  const nextRegistry: PearlRegistry = {
    ...registry,
    updated_at: timestamp,
    pearls: registry.pearls.map((candidate) => (candidate.pearl_id === pearl.pearl_id ? updatedPearl : candidate)),
    draft_task_cards: taskCard && !registry.draft_task_cards.some((candidate) => candidate.task_card_id === taskCard?.task_card_id)
      ? [...registry.draft_task_cards, taskCard]
      : registry.draft_task_cards,
  };

  return {
    registry: nextRegistry,
    pearl: updatedPearl,
    task_card: taskCard,
    receipt: {
      ok: true,
      pearl_id: updatedPearl.pearl_id,
      from_state: fromState,
      to_state: toState,
      task_card_id: taskCard?.task_card_id,
      receipt: toState === "PROMOTED"
        ? "pearl promoted and linked draft task card ensured"
        : `pearl moved to ${toState}`,
    },
  };
}
