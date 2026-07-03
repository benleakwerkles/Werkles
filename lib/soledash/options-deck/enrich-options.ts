import type { FrontierQueueItem, Proposal, Rationale } from "@/protocol/index";

import { ownerToCousin } from "./build-options";
import type { CompanyOption, OptionRisk } from "./types";

function evidenceToConfidence(status: string): string {
  const s = status.toUpperCase();
  if (s === "OBSERVED") return "high — observed";
  if (s === "HYPOTHESIS") return "medium — hypothesis";
  if (s === "UNKNOWN") return "low — no signal";
  return s.toLowerCase();
}

function evidenceToRisk(status: string, rationaleRisk?: string | null): OptionRisk {
  const r = (rationaleRisk ?? "").toLowerCase();
  if (r.includes("high")) return "high";
  if (r.includes("medium")) return "medium";
  if (r.includes("low")) return "low";
  const s = status.toUpperCase();
  if (s === "HYPOTHESIS") return "high";
  if (s === "OBSERVED") return "medium";
  return "unknown";
}

function scoreToTimeCost(score: number | null): number {
  if (score == null) return 15;
  if (score >= 0.85) return 45;
  if (score >= 0.7) return 30;
  if (score >= 0.5) return 20;
  return 10;
}

function expectedForQueue(item: FrontierQueueItem, isActive: boolean): string {
  if (isActive) {
    return "Approve advances frontier · cousin dispatch + receipt on disk";
  }
  return "Make frontier · defers current operator rank";
}

export function enrichOption(
  base: Omit<
    CompanyOption,
    | "action"
    | "target"
    | "expectedResult"
    | "timeCostMin"
    | "risk"
    | "confidence"
    | "conflictsWith"
    | "conflictHints"
    | "consumesAgent"
    | "consumesFrontier"
  >,
  ctx: {
    evidenceStatus?: string;
    rationale?: Rationale | null;
    machineFrontierTitle?: string | null;
  }
): CompanyOption {
  const target = base.suggestedCousin;
  const evidence = ctx.evidenceStatus ?? "UNKNOWN";
  const action = base.isActiveFrontier ? "Active frontier proposal" : "Queued intent proposal";

  let expectedResult = base.summary ?? "Operator dispatch";
  if (base.cardType === "intent_proposal") {
    expectedResult = expectedForQueue(
      {
        proposal_id: base.id.replace("proposal:", ""),
        title: base.title,
        rank: 0,
        evidence_status: evidence,
        weight: base.score,
        weight_label: null
      } as FrontierQueueItem,
      base.isActiveFrontier
    );
  }

  if (ctx.machineFrontierTitle && !base.isActiveFrontier && base.score != null && base.score >= 0.85) {
    expectedResult += ` · machine prefers "${ctx.machineFrontierTitle}"`;
  }

  return {
    ...base,
    action,
    target,
    expectedResult,
    timeCostMin: scoreToTimeCost(base.score),
    risk: evidenceToRisk(evidence, ctx.rationale?.risk),
    confidence: ctx.rationale?.confidence ?? evidenceToConfidence(evidence),
    conflictsWith: [],
    conflictHints: [],
    frontierSlotId: base.frontierSlotId ?? null,
    consumesAgent: base.verbs.some((v) => v === "dispatch" || v === "yea" || v === "make_frontier"),
    consumesFrontier: base.verbs.some((v) => v === "yea" || v === "dispatch" || v === "nay" || v === "make_frontier")
  };
}

export function proposalRationaleForOption(
  proposal: Proposal | null,
  proposalId: string,
  rationale: Rationale | null | undefined
): Rationale | null {
  if (!rationale || !proposal) return null;
  if (proposal.id === proposalId || proposalId.includes(proposal.id)) return rationale;
  return null;
}

export function itemEvidence(item: FrontierQueueItem): string {
  return String(item.evidence_status ?? "UNKNOWN");
}

export function cousinLabel(c: string): string {
  return c.charAt(0) + c.slice(1).toLowerCase();
}

export { ownerToCousin };
