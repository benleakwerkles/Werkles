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

function routeEnabled(routeButtons: DecisionButton[], id: string): boolean {
  return routeButtons.find((b) => b.id === id)?.enabled === true;
}

function activeFrontierVerbs(routeButtons: DecisionButton[]): OptionVerb[] {
  const verbs: OptionVerb[] = ["dispatch", "yea", "nay"];
  if (routeEnabled(routeButtons, "needs_research")) verbs.push("needs_research");
  if (routeEnabled(routeButtons, "kill_test")) verbs.push("kill_test");
  if (routeEnabled(routeButtons, "human_reality")) verbs.push("human_reality");
  return verbs;
}

function queueOption(
  item: FrontierQueueItem,
  activeProposalId: string | null,
  unavailable: boolean,
  rationale: Rationale | null,
  machineFrontierTitle: string | null,
  routeButtons: DecisionButton[]
): CompanyOption {
  const isActive = item.proposal_id === activeProposalId;
  const base = {
    id: `proposal:${item.proposal_id}`,
    cardType: "intent_proposal" as const,
    code: item.action_code ?? item.proposal_id,
    title: item.title,
    summary: item.owner ? `Owner · ${item.owner}` : null,
    score: item.score ?? item.weight,
    owner: item.owner ?? null,
    suggestedCousin: ownerToCousin(item.owner),
    rankSource: item.rank_source ?? null,
    verbs: isActive
      ? activeFrontierVerbs(routeButtons)
      : (["dispatch", "make_frontier", "hold"] as OptionVerb[]),
    isActiveFrontier: isActive,
    frontierSlotId: item.proposal_id,
    enabled: !unavailable,
    disabledReason: unavailable ? "Live payload unavailable" : null
  };
  return enrichOption(base, {
    evidenceStatus: itemEvidence(item),
    rationale: proposalRationaleForOption(null, item.proposal_id, rationale),
    machineFrontierTitle
  });
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

  const list = queue.map((item) =>
    queueOption(
      item,
      activeId,
      unavailable,
      rationale ?? null,
      machineFrontierTitle ?? null,
      routeButtons
    )
  );

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
      return "Approve";
    case "nay":
      return "Reject";
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
