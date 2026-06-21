import type {
  ActionLifecycle,
  CurrentBlocker,
  DecisionReceipt,
  DecisionSurfacePayload,
  FrontierQueueItem,
  Proposal,
  ReceiptCenterEntry
} from "@/protocol/index";
import type { RelayCardView } from "@/lib/soledash/automatica-relay/types";
import type { GateResolution } from "@/lib/soledash/human-gate/types";

import {
  areaLabel,
  type BuildCardContext,
  projectFromText,
  purposeLine,
  receiptReturnPath,
  splitOwnerMachine
} from "./card-context";
import {
  lifecyclePhaseToGuillotine,
  receiptStatusToGuillotine,
  relayStateToGuillotine
} from "./map-status";
import { guillotineToOperator, operatorStatusRank } from "./operator-status";
import type { GuillotineCard, GuillotineSections, GuillotineStatus } from "./types";
import {
  sendReceiveFromReceipt,
  sendReceiveFromRelay,
  workbenchCardStaysOnBench
} from "./send-receive-surface";
import {
  provenanceFromDecisionReceipt,
  provenanceFromReceiptEntry,
  provenanceFromRelayCard
} from "@/lib/soledash/provenance/compute";
import type { Provenance } from "@/lib/soledash/provenance/types";

function coalesce(...values: Array<string | null | undefined>): string {
  for (const v of values) {
    if (v && v.trim()) return v.trim();
  }
  return "—";
}

function finalize(
  partial: Omit<GuillotineCard, "status">,
  internal: GuillotineStatus
): GuillotineCard {
  return { ...partial, status: guillotineToOperator(internal) };
}

function frontierOwner(payload: DecisionSurfacePayload, frontier: FrontierQueueItem | null): string {
  return coalesce(
    frontier?.owner,
    payload.queue_brain?.active_owner,
    payload.active_owner,
    "Dink"
  );
}

function frontierStatus(
  gate: GateResolution,
  lifecycle: ActionLifecycle,
  hasBlocker: boolean,
  proposalId: string | null
): GuillotineStatus {
  if (gate.tier === "red" && gate.redCard) return "Human Gate";
  if (hasBlocker) return "Blocked";
  if (proposalId && lifecycle.proposal_id === proposalId) {
    const mapped = lifecyclePhaseToGuillotine(lifecycle.phase);
    if (mapped && mapped !== "Returned" && mapped !== "Closed") return mapped;
  }
  return "Queued";
}

export function buildFrontierCard(input: {
  payload: DecisionSurfacePayload;
  proposal: Proposal | null;
  frontier: FrontierQueueItem | null;
  gate: GateResolution;
  lifecycle: ActionLifecycle;
  decisionReceipt: DecisionReceipt;
  hasBlocker: boolean;
  unavailable: boolean;
  surfaceProvenance: Provenance;
  context: BuildCardContext;
}): GuillotineCard | null {
  if (input.unavailable) {
    const { owner, machine } = splitOwnerMachine("Dink", input.context.machineLabel);
    return finalize(
      {
        id: "frontier-unavailable",
        cardId: "PAYLOAD_UNAVAILABLE",
        title: "Decision surface unavailable",
        purpose: purposeLine(input.payload.human_gate.detail, "Restore live payload before building"),
        project: "Werkles",
        area: "SoleDash Command",
        owner,
        machine,
        branch: input.context.branch,
        nextAction: "Restore DECISION_SURFACE.json",
        receiptReturn: receiptReturnPath("foreman/soledash/DECISION_SURFACE.json"),
        provenance: input.surfaceProvenance
      },
      "Blocked"
    );
  }

  if (!input.proposal) return null;

  const code = input.proposal.action_code ?? input.frontier?.action_code;
  const { owner, machine } = splitOwnerMachine(
    frontierOwner(input.payload, input.frontier),
    input.context.machineLabel
  );

  return finalize(
    {
      id: `frontier:${input.proposal.id}`,
      cardId: coalesce(code, input.proposal.id),
      title: input.proposal.title,
      purpose: purposeLine(input.proposal.summary, input.frontier?.title),
      project: projectFromText(code, input.proposal.id),
      area: "Ready Queue",
      owner,
      machine,
      branch: input.context.branch,
      nextAction: coalesce(
        input.payload.queue_brain?.recommended_next_action,
        input.decisionReceipt.next_state,
        "Pick owner in Next Step — save or send"
      ),
      receiptReturn: receiptReturnPath(
        input.decisionReceipt.written_to,
        "foreman/soledash/receipts/"
      ),
      receiptLink: input.decisionReceipt.written_to,
      provenance: input.surfaceProvenance
    },
    frontierStatus(input.gate, input.lifecycle, input.hasBlocker, input.proposal.id)
  );
}

function receiptEntryCard(entry: ReceiptCenterEntry, context: BuildCardContext): GuillotineCard {
  const internal = receiptStatusToGuillotine(entry.status);
  const { owner, machine } = splitOwnerMachine(entry.owner, context.machineLabel);
  const nextAction =
    internal === "Queued"
      ? "Send when route is wired"
      : internal === "Working"
        ? "Wait for cousin receipt return"
        : internal === "Returned"
          ? "Review returned proof"
          : "Inspect failure before retry";

  return finalize(
    {
      id: `receipt:${entry.action_id}:${entry.last_update}`,
      cardId: entry.action_id,
      title: entry.target,
      purpose: purposeLine(entry.owner ? `Transport to ${entry.owner}` : null, entry.action_id),
      project: projectFromText(entry.target, entry.action_id),
      area: "Operator Transport",
      owner,
      machine,
      branch: context.branch,
      nextAction,
      receiptReturn: receiptReturnPath(
        entry.receipt_link,
        `foreman/soledash/receipts/${entry.action_id}.json`
      ),
      receiptLink: entry.receipt_link,
      provenance: provenanceFromReceiptEntry(entry),
      sendReceive: sendReceiveFromReceipt(entry, owner, machine)
    },
    internal
  );
}

function relayCard(card: RelayCardView, context: BuildCardContext): GuillotineCard | null {
  const internal = relayStateToGuillotine(card.state);
  if (!internal) return null;

  const { owner, machine } = splitOwnerMachine(
    coalesce(card.owner, card.cousin, card.targetAgent),
    card.targetComputer || context.machineLabel
  );

  return finalize(
    {
      id: `relay:${card.id}`,
      cardId: card.id,
      title: card.name,
      purpose: purposeLine(card.missionText, card.taskType),
      project: projectFromText(card.name, card.missionText),
      area: areaLabel(card.taskType),
      owner,
      machine,
      branch: context.branch,
      nextAction: coalesce(card.nextAction, card.notes.nextAction, card.nextActionReady),
      receiptReturn: receiptReturnPath(
        card.receiptPath,
        card.receipt.receiptPath,
        card.expectedReceipt,
        "foreman/soledash/automatica-relay/receipts/"
      ),
      receiptLink: card.receiptPath,
      provenance: provenanceFromRelayCard(card),
      sendReceive: sendReceiveFromRelay(card)
    },
    card.state === "EXPLODED" ? "Closed" : internal
  );
}

function blockerCard(
  blocker: CurrentBlocker,
  surfaceProvenance: Provenance,
  context: BuildCardContext
): GuillotineCard {
  return finalize(
    {
      id: "blocker:current",
      cardId: blocker.headline,
      title: blocker.headline.replace(/_/g, " "),
      purpose: purposeLine(blocker.detail, "Active platform blocker"),
      project: projectFromText(blocker.headline),
      area: "Platform Integration",
      owner: "Dink",
      machine: context.machineLabel,
      branch: context.branch,
      nextAction: "Clear dependency before new builds",
      receiptReturn: receiptReturnPath(blocker.detail, "foreman/soledash/DECISION_SURFACE.json"),
      provenance: blocker.mock
        ? { source: "LOCAL", updatedAt: surfaceProvenance.updatedAt, detail: "mock blocker slot" }
        : surfaceProvenance
    },
    "Blocked"
  );
}

function lifecycleCard(
  lifecycle: ActionLifecycle,
  proposal: Proposal | null,
  context: BuildCardContext
): GuillotineCard | null {
  const internal = lifecyclePhaseToGuillotine(lifecycle.phase);
  if (!internal || internal === "Returned" || internal === "Closed") return null;
  if (proposal && lifecycle.proposal_id === proposal.id) return null;

  const { owner, machine } = splitOwnerMachine(lifecycle.route_owner, context.machineLabel);

  return finalize(
    {
      id: `lifecycle:${lifecycle.action_id ?? lifecycle.updated_at}`,
      cardId: coalesce(lifecycle.action_id, lifecycle.action ?? "operator-action"),
      title: coalesce(lifecycle.action, "Operator action"),
      purpose: purposeLine(lifecycle.message, lifecycle.phase),
      project: projectFromText(lifecycle.action, lifecycle.proposal_id),
      area: "Operator Action",
      owner,
      machine,
      branch: context.branch,
      nextAction: coalesce(lifecycle.message, "Wait for lifecycle update"),
      receiptReturn: receiptReturnPath(
        lifecycle.action_id ? `foreman/soledash/actions/${lifecycle.action_id}.json` : null
      ),
      provenance: {
        source: lifecycle.mock ? "LOCAL" : "FILE",
        updatedAt: lifecycle.updated_at,
        detail: lifecycle.action_id
          ? `foreman/soledash/actions/${lifecycle.action_id}`
          : "action lifecycle"
      }
    },
    internal
  );
}

export function buildGuillotineSections(input: {
  payload: DecisionSurfacePayload;
  proposal: Proposal | null;
  frontier: FrontierQueueItem | null;
  gate: GateResolution;
  lifecycle: ActionLifecycle;
  decisionReceipt: DecisionReceipt;
  receipts: ReceiptCenterEntry[];
  relayCards: RelayCardView[];
  blocker: CurrentBlocker;
  hasBlocker: boolean;
  unavailable: boolean;
  surfaceProvenance: Provenance;
  context: BuildCardContext;
}): GuillotineSections {
  const frontier = buildFrontierCard(input);

  const working: GuillotineCard[] = [];
  const returned: GuillotineCard[] = [];
  const seen = new Set<string>();

  function push(bucket: GuillotineCard[], card: GuillotineCard) {
    if (seen.has(card.id)) return;
    seen.add(card.id);
    bucket.push(card);
  }

  if (input.hasBlocker && !input.unavailable) {
    push(working, blockerCard(input.blocker, input.surfaceProvenance, input.context));
  }

  for (const entry of input.receipts) {
    const card = receiptEntryCard(entry, input.context);
    if (workbenchCardStaysOnBench(card)) {
      push(working, card);
    } else if (card.status === "Receipts") {
      push(returned, card);
    } else {
      push(working, card);
    }
  }

  const lifecycleWorking = lifecycleCard(input.lifecycle, input.proposal, input.context);
  if (lifecycleWorking) push(working, lifecycleWorking);

  for (const relay of input.relayCards) {
    const card = relayCard(relay, input.context);
    if (!card) continue;
    if (workbenchCardStaysOnBench(card)) {
      push(working, card);
    } else if (card.status === "Receipts") {
      push(returned, card);
    } else {
      push(working, card);
    }
  }

  working.sort(
    (a, b) =>
      operatorStatusRank(a.status) - operatorStatusRank(b.status) ||
      a.title.localeCompare(b.title)
  );
  returned.sort((a, b) => b.receiptReturn.localeCompare(a.receiptReturn));

  if (input.decisionReceipt.last_action && input.decisionReceipt.outcome) {
    const dr = input.decisionReceipt;
    const { owner, machine } = splitOwnerMachine(
      frontierOwner(input.payload, input.frontier),
      input.context.machineLabel
    );
    const payloadUpdated =
      input.payload.updated_at ?? input.payload.generated_at ?? input.surfaceProvenance.updatedAt;
    push(returned, finalize(
      {
        id: `decision-receipt:${dr.receipt_id ?? dr.last_action}`,
        cardId: coalesce(dr.receipt_id, dr.last_action),
        title: coalesce(dr.last_action, "Operator decision"),
        purpose: purposeLine(dr.next_state, dr.outcome),
        project: projectFromText(dr.last_action),
        area: "Operator Decision",
        owner,
        machine,
        branch: input.context.branch,
        nextAction: coalesce(dr.next_state, "Review returned decision proof"),
        receiptReturn: receiptReturnPath(dr.written_to, dr.outcome),
        receiptLink: dr.written_to,
        provenance: provenanceFromDecisionReceipt(dr.written_to, dr.outcome, payloadUpdated)
      },
      dr.outcome?.toLowerCase().includes("fail") ? "Closed" : "Returned"
    ));
  }

  return { frontier, working, receipts: returned };
}
