import type {
  FrontierOverride,
  FrontierQueueItem,
  FrontierRef,
  Proposal,
  QueueOverrideAction,
  QueueRankSource
} from "@/protocol/index";

export type QueueOverrideResult = {
  queue: FrontierQueueItem[];
  frontier_override: FrontierOverride;
  active_proposal_id: string;
  message: string;
};

function sortByFinalRank(items: FrontierQueueItem[]): FrontierQueueItem[] {
  return [...items].sort(
    (a, b) => (a.final_rank ?? a.rank) - (b.final_rank ?? b.rank)
  );
}

function itemRankSource(item: FrontierQueueItem): QueueRankSource {
  const machine = item.machine_rank ?? item.rank;
  const operator = item.operator_rank ?? machine;
  if (operator === machine) return "MACHINE";
  return "OPERATOR";
}

function computeQueueBadge(items: FrontierQueueItem[]): QueueRankSource {
  const sources = items.map(itemRankSource);
  if (sources.every((s) => s === "MACHINE")) return "MACHINE";
  if (sources.every((s) => s === "OPERATOR")) return "OPERATOR";
  return "MIXED";
}

function normalizeQueue(items: FrontierQueueItem[]): FrontierQueueItem[] {
  const sorted = sortByFinalRank(items);
  return sorted.map((item, i) => {
    const final_rank = i + 1;
    const rank_source = itemRankSource({ ...item, final_rank });
    return {
      ...item,
      rank: final_rank,
      final_rank,
      rank_source,
      weight_label: final_rank === 1 ? "frontier" : "queued"
    };
  });
}

function toRef(item: FrontierQueueItem): FrontierRef {
  return {
    action_code: item.action_code ?? item.proposal_id,
    proposal_id: item.proposal_id,
    title: item.title
  };
}

function deriveOverride(
  queue: FrontierQueueItem[],
  machineRecommends: FrontierRef,
  operatorSelectedId: string | null
): FrontierOverride {
  const frontier = queue.find((q) => (q.final_rank ?? q.rank) === 1) ?? queue[0];
  const operatorSelected =
    queue.find((q) => q.proposal_id === operatorSelectedId) ??
    (operatorSelectedId ? queue.find((q) => q.proposal_id === operatorSelectedId) : null);

  const selectedRef = operatorSelected ? toRef(operatorSelected) : toRef(frontier);
  const current_source: QueueRankSource =
    selectedRef.proposal_id === machineRecommends.proposal_id ? "MACHINE" : "OPERATOR";

  return {
    machine_recommends: machineRecommends,
    operator_selected: selectedRef,
    current_source,
    queue_badge: computeQueueBadge(queue)
  };
}

export function applyQueueOverrideAction(
  queue: FrontierQueueItem[],
  frontierOverride: FrontierOverride,
  action: QueueOverrideAction,
  proposalId: string
): QueueOverrideResult {
  const machineRecommends = frontierOverride.machine_recommends;
  let items: FrontierQueueItem[] = queue.map((item) => ({
    ...item,
    machine_rank: item.machine_rank ?? item.rank,
    operator_rank: item.operator_rank ?? item.machine_rank ?? item.rank,
    final_rank: item.final_rank ?? item.rank
  }));

  const idx = items.findIndex((i) => i.proposal_id === proposalId);
  if (idx < 0) {
    return {
      queue,
      frontier_override: frontierOverride,
      active_proposal_id: frontierOverride.operator_selected?.proposal_id ?? queue[0]?.proposal_id ?? "",
      message: "Item not found in queue."
    };
  }

  let message = "";
  let operatorSelectedId = frontierOverride.operator_selected?.proposal_id ?? null;

  if (action === "return_to_machine_order") {
    items = items.map((item) => ({
      ...item,
      operator_rank: item.machine_rank ?? item.rank,
      final_rank: item.machine_rank ?? item.rank
    }));
    operatorSelectedId = machineRecommends.proposal_id;
    message = "MOCK: Returned queue to machine order — Dink owns live persistence.";
  } else if (action === "make_frontier") {
    const target = items[idx];
    const others = items.filter((i) => i.proposal_id !== proposalId);
    const reordered = [target, ...others];
    items = reordered.map((item, i) => ({
      ...item,
      operator_rank: i + 1,
      final_rank: i + 1
    }));
    operatorSelectedId = proposalId;
    message = `MOCK: ${target.action_code ?? target.title} set as frontier — operator override.`;
  } else if (action === "move_up") {
    const sorted = sortByFinalRank(items);
    const pos = sorted.findIndex((i) => i.proposal_id === proposalId);
    if (pos > 0) {
      const tmp = sorted[pos - 1].final_rank!;
      sorted[pos - 1] = { ...sorted[pos - 1], final_rank: sorted[pos].final_rank, operator_rank: sorted[pos].final_rank! };
      sorted[pos] = { ...sorted[pos], final_rank: tmp, operator_rank: tmp };
      items = sorted;
      operatorSelectedId = proposalId;
      message = `MOCK: Moved ${sorted[pos].action_code ?? sorted[pos].title} up.`;
    } else {
      message = "Already at top of queue.";
    }
  } else if (action === "move_down") {
    const sorted = sortByFinalRank(items);
    const pos = sorted.findIndex((i) => i.proposal_id === proposalId);
    if (pos >= 0 && pos < sorted.length - 1) {
      const tmp = sorted[pos + 1].final_rank!;
      sorted[pos + 1] = { ...sorted[pos + 1], final_rank: sorted[pos].final_rank, operator_rank: sorted[pos].final_rank! };
      sorted[pos] = { ...sorted[pos], final_rank: tmp, operator_rank: tmp };
      items = sorted;
      operatorSelectedId = proposalId;
      message = `MOCK: Moved ${sorted[pos].action_code ?? sorted[pos].title} down.`;
    } else {
      message = "Already at bottom of queue.";
    }
  }

  const normalized = normalizeQueue(items);
  const override = deriveOverride(normalized, machineRecommends, operatorSelectedId);
  const active = normalized.find((q) => (q.final_rank ?? q.rank) === 1) ?? normalized[0];

  return {
    queue: normalized,
    frontier_override: override,
    active_proposal_id: active?.proposal_id ?? proposalId,
    message
  };
}

export function proposalFromQueueItem(
  item: FrontierQueueItem,
  existing: Proposal | null
): Proposal {
  return {
    id: item.proposal_id,
    title: item.title,
    summary: existing?.summary ?? `${item.title} — Dink supplies summary when live.`,
    queue_behind: Math.max(0, (item.final_rank ?? item.rank) - 1),
    evidence_status: item.evidence_status,
    action_code: item.action_code
  };
}
