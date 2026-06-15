import type { DecisionButton } from "@/protocol/index";

/** SoleDash decision-surface routing — Dink owns live policy; Maker renders labels. */
export const ACTION_ROUTE_OWNERS: Record<string, string> = {
  needs_research: "Thufir",
  kill_test: "Bean",
  human_reality: "Ender"
};

/** Protocol route slots — DEFER removed; Dink supplies enabled state per slot */
export const ROUTE_PROTOCOL_SLOTS = [
  { id: "needs_research", label: "NEEDS RESEARCH", route_owner: "Thufir" },
  { id: "kill_test", label: "KILL TEST", route_owner: "Bean" },
  { id: "human_reality", label: "HUMAN REALITY", route_owner: "Ender" }
] as const;

export const ROUTE_BUTTON_IDS = new Set<string>(ROUTE_PROTOCOL_SLOTS.map((slot) => slot.id));

export function resolveRouteOwner(action: string, fromButton?: string | null): string | null {
  if (fromButton?.trim()) return fromButton.trim();
  return ACTION_ROUTE_OWNERS[action] ?? null;
}

export function actionDisplayLabel(action: string): string {
  switch (action) {
    case "yea":
      return "YEA";
    case "nay":
      return "NAY";
    case "needs_research":
      return "NEEDS RESEARCH";
    case "kill_test":
      return "KILL TEST";
    case "human_reality":
      return "HUMAN REALITY";
    default:
      return action.replace(/_/g, " ").toUpperCase();
  }
}

/** Always render three route slots — disable visibly when Dink omits or payload unavailable */
export function mergeRouteButtons(
  protocolButtons: DecisionButton[],
  unavailable: boolean
): DecisionButton[] {
  const byId = new Map(protocolButtons.filter((b) => b.id !== "defer").map((b) => [b.id, b]));

  return ROUTE_PROTOCOL_SLOTS.map((slot) => {
    const fromProtocol = byId.get(slot.id);
    if (unavailable) {
      return {
        id: slot.id,
        label: slot.label,
        enabled: false,
        reason_disabled: "Live payload unavailable",
        route_owner: slot.route_owner
      };
    }
    if (!fromProtocol) {
      return {
        id: slot.id,
        label: slot.label,
        enabled: false,
        reason_disabled: "Dink protocol slot not supplied",
        route_owner: slot.route_owner
      };
    }
    return fromProtocol;
  });
}
