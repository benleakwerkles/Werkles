import type { DecisionButton, FrontierQueueItem, Proposal, Rationale } from "@/protocol/index";
import type { OperatorCousinTarget } from "@/lib/soledash/options-deck/cousins";

import { attachConflicts } from "./conflicts";
import { enrichOption, itemEvidence, proposalRationaleForOption } from "./enrich-options";
import type { CompanyOption, OptionVerb } from "./types";

export function ownerToCousin(owner: string | null | undefined): OperatorCousinTarget {
  const o = (owner ?? "").toLowerCase();
  if (o.includes("dink") || o.includes("doss")) return "DINK";
  if (o.includes("ender")) return "ENDER";
  if (o.includes("bean")) return "BEAN";
  if (o.includes("thufir") || o.includes("computer") || o.includes("perplexity")) return "THUFIR";
  if (o.includes("skybro") || o.includes("gemini")) return "SKYBRO";
  return "MAKER";
}

function queueOption(
  item: FrontierQueueItem,
  activeProposalId: string | null,
  unavailable: boolean,
  rationale: Rationale | null,
  machineFrontierTitle: string | null
): CompanyOption {
  const isActive = item.proposal_id === activeProposalId;
  const base = {
    id: `queue:${item.proposal_id}`,
    kind: "queue" as const,
    code: item.action_code ?? item.proposal_id,
    title: item.title,
    summary: item.owner ? `Owner · ${item.owner}` : null,
    score: item.score ?? item.weight,
    owner: item.owner ?? null,
    suggestedCousin: ownerToCousin(item.owner),
    rankSource: item.rank_source ?? null,
    verbs: isActive
      ? (["dispatch", "yea", "nay", "needs_research", "kill_test", "human_reality"] as OptionVerb[])
      : (["dispatch", "make_frontier", "hold"] as OptionVerb[]),
    isActiveFrontier: isActive,
    enabled: !unavailable,
    disabledReason: unavailable ? "Live payload unavailable" : null
  };
  return enrichOption(base, {
    evidenceStatus: itemEvidence(item),
    rationale: proposalRationaleForOption(null, item.proposal_id, rationale),
    machineFrontierTitle
  });
}

function routeOption(slot: DecisionButton): CompanyOption | null {
  if (slot.id === "defer" || slot.id === "more_info") return null;
  const verb = slot.id as OptionVerb;
  if (!["needs_research", "kill_test", "human_reality", "yea", "nay"].includes(verb)) return null;

  const base = {
    id: `route:${slot.id}`,
    kind: "route" as const,
    code: slot.label,
    title: slot.label,
    summary: slot.route_owner ? `Routes to ${slot.route_owner}` : null,
    score: null,
    owner: slot.route_owner ?? null,
    suggestedCousin: ownerToCousin(slot.route_owner),
    rankSource: "OPERATOR",
    verbs: [verb] as OptionVerb[],
    isActiveFrontier: true,
    enabled: slot.enabled,
    disabledReason: slot.reason_disabled
  };
  return enrichOption(base, { evidenceStatus: "OBSERVED" });
}

export function buildCompanyOptions(input: {
  queue: FrontierQueueItem[];
  proposal: Proposal | null;
  routeButtons: DecisionButton[];
  unavailable: boolean;
  rationale?: Rationale | null;
  machineFrontierTitle?: string | null;
}): CompanyOption[] {
  const { queue, proposal, routeButtons, unavailable, rationale, machineFrontierTitle } = input;
  const activeId = proposal?.id ?? null;
  const byId = new Map<string, CompanyOption>();

  for (const item of queue) {
    byId.set(
      item.proposal_id,
      queueOption(item, activeId, unavailable, rationale ?? null, machineFrontierTitle ?? null)
    );
  }

  for (const slot of routeButtons) {
    const opt = routeOption(slot);
    if (opt) byId.set(opt.id, opt);
  }

  if (proposal && !unavailable) {
    const yeaBase = {
      id: "play:frontier-yea",
      kind: "play" as const,
      code: proposal.action_code ?? "YEA",
      title: `YEA · ${proposal.title}`,
      summary: proposal.summary,
      score: null,
      owner: null,
      suggestedCousin: "MAKER" as OperatorCousinTarget,
      rankSource: "FRONTIER",
      verbs: ["yea"] as OptionVerb[],
      isActiveFrontier: true,
      enabled: true,
      disabledReason: null
    };
    const nayBase = {
      id: "play:frontier-nay",
      kind: "play" as const,
      code: "NAY",
      title: `NAY · drop ${proposal.title}`,
      summary: "Decline frontier — next queue item surfaces.",
      score: null,
      owner: null,
      suggestedCousin: "MAKER" as OperatorCousinTarget,
      rankSource: "FRONTIER",
      verbs: ["nay"] as OptionVerb[],
      isActiveFrontier: true,
      enabled: true,
      disabledReason: null
    };
    byId.set("play:frontier-yea", enrichOption(yeaBase, { evidenceStatus: proposal.evidence_status, rationale }));
    byId.set("play:frontier-nay", enrichOption(nayBase, { evidenceStatus: proposal.evidence_status, rationale }));
  }

  const list = Array.from(byId.values());
  list.sort((a, b) => {
    if (a.isActiveFrontier !== b.isActiveFrontier) return a.isActiveFrontier ? -1 : 1;
    const sa = a.score ?? 0;
    const sb = b.score ?? 0;
    return sb - sa;
  });
  return attachConflicts(list);
}

export function optionMissionText(option: CompanyOption, chatDraft: string): string {
  const base = chatDraft.trim();
  if (base) {
    return `[${option.code}] ${option.title}\n\n${base}`;
  }
  return `[${option.code}] ${option.title}${option.summary ? `\n${option.summary}` : ""}`;
}

export function verbLabel(verb: OptionVerb): string {
  switch (verb) {
    case "dispatch":
      return "Dispatch packet";
    case "make_frontier":
      return "Make frontier";
    case "hold":
      return "Hold";
    case "yea":
      return "YEA";
    case "nay":
      return "NAY";
    case "needs_research":
      return "Needs research";
    case "kill_test":
      return "Kill test";
    case "human_reality":
      return "Human reality";
    default:
      return verb;
  }
}
