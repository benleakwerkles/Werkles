import type { OperatorCousinTarget } from "./cousins";
import type { CompanyOption, OptionVerb } from "./types";

export type ResourceProfile = {
  requiredAeyes: OperatorCousinTarget[];
  frontierSlotId: string | null;
};

function isFrontierAdvancing(verb: OptionVerb): boolean {
  return verb === "yea" || verb === "dispatch" || verb === "make_frontier";
}

/** Verbs used when comparing options for static board tension (not salvo-specific). */
export function conflictVerbs(option: CompanyOption): OptionVerb[] {
  if (option.cardType !== "intent_proposal") return [];
  if (option.isActiveFrontier) return ["yea", "dispatch", "nay"];
  return ["make_frontier"];
}

export function resourcesForVerb(option: CompanyOption, verb: OptionVerb): ResourceProfile {
  switch (verb) {
    case "yea":
    case "dispatch":
      return {
        requiredAeyes: [option.suggestedCousin],
        frontierSlotId: option.frontierSlotId
      };
    case "nay":
      return {
        requiredAeyes: [option.suggestedCousin],
        frontierSlotId: option.frontierSlotId
      };
    case "make_frontier":
      return {
        requiredAeyes: [option.suggestedCousin],
        frontierSlotId: option.frontierSlotId ?? option.id.replace("proposal:", "")
      };
    case "needs_research":
      return { requiredAeyes: ["THUFIR"], frontierSlotId: null };
    case "kill_test":
      return { requiredAeyes: ["BEAN"], frontierSlotId: null };
    case "human_reality":
      return { requiredAeyes: ["ENDER"], frontierSlotId: null };
    case "hold":
      return { requiredAeyes: [], frontierSlotId: null };
    default:
      return { requiredAeyes: [option.target], frontierSlotId: null };
  }
}

function aeyeOverlap(a: ResourceProfile, b: ResourceProfile): OperatorCousinTarget[] {
  const set = new Set(b.requiredAeyes);
  return a.requiredAeyes.filter((id) => set.has(id));
}

export function pairResourceConflict(
  a: CompanyOption,
  verbA: OptionVerb,
  b: CompanyOption,
  verbB: OptionVerb
): { kind: "agent" | "frontier" | "exclusive"; message: string } | null {
  const ra = resourcesForVerb(a, verbA);
  const rb = resourcesForVerb(b, verbB);

  if (
    ra.frontierSlotId &&
    rb.frontierSlotId &&
    ra.frontierSlotId === rb.frontierSlotId &&
    ((verbA === "yea" && verbB === "nay") || (verbA === "nay" && verbB === "yea"))
  ) {
    return { kind: "exclusive", message: "YEA and NAY on the same frontier — pick one." };
  }

  if (
    ra.frontierSlotId &&
    rb.frontierSlotId &&
    ra.frontierSlotId === rb.frontierSlotId &&
    isFrontierAdvancing(verbA) &&
    isFrontierAdvancing(verbB)
  ) {
    return {
      kind: "frontier",
      message: `Both advance the same frontier slot — pick one.`
    };
  }

  if (
    (verbA === "kill_test" && verbB === "yea") ||
    (verbA === "yea" && verbB === "kill_test")
  ) {
    return {
      kind: "exclusive",
      message: "Kill test and YEA on the same lane — kill test may explode the frontier."
    };
  }

  const overlap = aeyeOverlap(ra, rb);
  if (overlap.length > 0) {
    const aeye = overlap[0];
    return {
      kind: "agent",
      message: `Both need ${aeye} — “${shortTitle(a.title)}” and “${shortTitle(b.title)}” cannot run in parallel.`
    };
  }

  return null;
}

function shortTitle(title: string): string {
  return title.length > 36 ? `${title.slice(0, 34)}…` : title;
}
