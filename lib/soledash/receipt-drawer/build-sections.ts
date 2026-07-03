import type { DecisionReceipt, ReceiptCenterEntry } from "@/protocol/index";
import type { RelayCardView } from "@/lib/soledash/automatica-relay/types";

import { nextRecommendation } from "./recommendations";
import type {
  BuildDrawerInput,
  DrawerDispositionRecord,
  DrawerReceipt,
  DrawerSectionId,
  DrawerSections
} from "./types";
import { approvalStoreKey } from "./types";
import {
  provenanceFromDecisionReceipt,
  provenanceFromDrawerAction,
  provenanceFromReceiptEntry,
  provenanceFromRelayCard
} from "@/lib/soledash/provenance/compute";

const TERMINAL_TRANSPORT = new Set(["received", "resolved", "failed"]);

const TERMINAL_RELAY = new Set(["RECEIPT RETURNED", "EXPLODED"]);

function coalesce(...values: Array<string | null | undefined>): string {
  for (const v of values) {
    if (v && v.trim()) return v.trim();
  }
  return "—";
}

function drawerId(source: DrawerReceipt["source"], key: string): string {
  return `${source}:${key}`;
}

function lookupApproval(
  cardId: string,
  approver: string,
  approvals: Record<string, DrawerDispositionRecord>
): DrawerDispositionRecord | null {
  return approvals[approvalStoreKey(cardId, approver)] ?? null;
}

function withDisposition(
  base: Omit<
    DrawerReceipt,
    "nextRecommendation" | "disposition" | "dispositionRecord" | "provenance"
  > & { provenance: DrawerReceipt["provenance"] },
  approvals: Record<string, DrawerDispositionRecord>,
  approver: string
): DrawerReceipt {
  const record = lookupApproval(base.cardId, approver, approvals);
  const disposition = record?.disposition ?? null;
  const draft: Omit<DrawerReceipt, "nextRecommendation"> = {
    ...base,
    disposition,
    dispositionRecord: record,
    provenance: record ? provenanceFromDrawerAction(record.acted_at) : base.provenance
  };
  return { ...draft, nextRecommendation: nextRecommendation(draft) };
}

function fromTransport(
  entry: ReceiptCenterEntry,
  machineLabel: string,
  approvals: Record<string, DrawerDispositionRecord>,
  approver: string
): DrawerReceipt | null {
  if (!TERMINAL_TRANSPORT.has(entry.status)) return null;

  const cardId = entry.action_id;
  const id = drawerId("transport", `${entry.action_id}:${entry.last_update}`);
  return withDisposition(
    {
      id,
      cardId,
      source: "transport",
      owner: coalesce(entry.owner, "Operator"),
      machine: machineLabel,
      timestamp: entry.last_update,
      artifact: coalesce(entry.receipt_link, entry.target),
      result: entry.mock || entry.mock_test ? `${entry.status} (sim)` : entry.status,
      title: entry.target,
      simulated: Boolean(entry.mock || entry.mock_test || entry.simulated),
      receiptLink: entry.receipt_link,
      provenance: provenanceFromReceiptEntry(entry)
    },
    approvals,
    approver
  );
}

function fromRelay(
  card: RelayCardView,
  approvals: Record<string, DrawerDispositionRecord>,
  approver: string
): DrawerReceipt | null {
  if (!TERMINAL_RELAY.has(card.state)) return null;

  const id = drawerId("relay", card.id);
  const primaryArtifact =
    card.artifacts[0]?.value ??
    card.receipt.receiptPath ??
    card.receipt.outboundPath ??
    card.receipt.packetPath ??
    card.receiptPath;

  return withDisposition(
    {
      id,
      cardId: card.id,
      source: "relay",
      owner: coalesce(card.owner, card.cousin, card.targetAgent),
      machine: coalesce(card.targetComputer, "Betsy"),
      timestamp: coalesce(card.lastUpdate, card.receipt.updatedAt, new Date().toISOString()),
      artifact: coalesce(primaryArtifact, card.expectedReceipt),
      result: card.state === "EXPLODED" ? "EXPLODED" : "RECEIPT RETURNED",
      title: card.name,
      simulated: !card.live,
      receiptLink: card.receiptPath ?? card.receipt.receiptPath,
      provenance: provenanceFromRelayCard(card)
    },
    approvals,
    approver
  );
}

function fromDecision(
  receipt: DecisionReceipt,
  machineLabel: string,
  owner: string,
  payloadUpdatedAt: string,
  approvals: Record<string, DrawerDispositionRecord>,
  approver: string
): DrawerReceipt | null {
  if (!receipt.outcome && !receipt.written_to) return null;

  const cardId = coalesce(receipt.receipt_id, receipt.last_action, "frontier-decision");
  const id = drawerId("decision", cardId);

  return withDisposition(
    {
      id,
      cardId,
      source: "decision",
      owner,
      machine: machineLabel,
      timestamp: payloadUpdatedAt,
      artifact: coalesce(receipt.written_to, receipt.receipt_id, receipt.last_action),
      result: coalesce(receipt.outcome, receipt.next_state, "decision recorded"),
      title: coalesce(receipt.last_action, "Operator decision"),
      simulated: receipt.kind === "mock_action",
      receiptLink: receipt.written_to,
      provenance: provenanceFromDecisionReceipt(receipt.written_to, receipt.outcome, payloadUpdatedAt)
    },
    approvals,
    approver
  );
}

function bucketFor(receipt: DrawerReceipt): DrawerSectionId {
  if (receipt.disposition === "approved") return "approved";
  if (receipt.disposition === "rejected") return "archived";
  if (receipt.disposition === "follow_up") return "needs_review";

  const result = receipt.result.toLowerCase();
  if (result.includes("fail") || result.includes("exploded") || receipt.simulated) {
    return "needs_review";
  }

  return "new";
}

function sortReceipts(a: DrawerReceipt, b: DrawerReceipt): number {
  return b.timestamp.localeCompare(a.timestamp) || a.title.localeCompare(b.title);
}

function countUniqueApproved(receipts: DrawerReceipt[]): number {
  const cardIds = new Set<string>();
  for (const receipt of receipts) {
    if (receipt.disposition === "approved") cardIds.add(receipt.cardId);
  }
  return cardIds.size;
}

export function buildDrawerSections(input: BuildDrawerInput): DrawerSections {
  const seen = new Set<string>();
  const all: DrawerReceipt[] = [];

  function push(receipt: DrawerReceipt | null) {
    if (!receipt || seen.has(receipt.id)) return;
    seen.add(receipt.id);
    all.push(receipt);
  }

  for (const entry of input.receipts) {
    push(fromTransport(entry, input.machineLabel, input.approvals, input.approver));
  }

  for (const card of input.relayCards) {
    push(fromRelay(card, input.approvals, input.approver));
  }

  push(
    fromDecision(
      input.decisionReceipt,
      input.machineLabel,
      coalesce("Operator"),
      input.payloadUpdatedAt,
      input.approvals,
      input.approver
    )
  );

  const sections: DrawerSections = {
    new: [],
    needs_review: [],
    approved: [],
    archived: [],
    counts: { new: 0, needs_review: 0, approved: 0, archived: 0 },
    uniqueApprovedCount: 0
  };

  for (const receipt of all) {
    sections[bucketFor(receipt)].push(receipt);
  }

  for (const key of Object.keys(sections.counts) as DrawerSectionId[]) {
    sections[key].sort(sortReceipts);
    sections.counts[key] = sections[key].length;
  }

  sections.uniqueApprovedCount = countUniqueApproved(sections.approved);

  return sections;
}

export function drawerAttentionCount(sections: DrawerSections): number {
  return sections.counts.new + sections.counts.needs_review;
}
