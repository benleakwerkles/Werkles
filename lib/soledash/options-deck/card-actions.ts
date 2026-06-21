import type { CompanyOption, OptionVerb } from "./types";

export type CardButton = {
  id: "approve" | "reject" | "dispatch" | "make_frontier" | "hold" | "kill_test" | "needs_research" | "human_reality";
  label: string;
  verb: OptionVerb;
  enabled: boolean;
  reason: string | null;
};

export function cardButtons(
  option: CompanyOption,
  busy: boolean,
  chatDraft: string
): CardButton[] {
  const needsText = !chatDraft.trim();
  const baseDisabled = busy || !option.enabled;
  const baseReason = !option.enabled ? option.disabledReason : busy ? "Action in progress" : null;

  if (!option.isActiveFrontier) {
    const canMakeFrontier = option.verbs.includes("make_frontier");
    const canDispatch = option.verbs.includes("dispatch");
    const dispatchNeedsText = canDispatch && needsText;

    return [
      {
        id: "make_frontier",
        label: "MAKE FRONTIER",
        verb: "make_frontier",
        enabled: !baseDisabled && canMakeFrontier,
        reason: baseReason ?? (!canMakeFrontier ? "Not in queue protocol" : null)
      },
      {
        id: "dispatch",
        label: "DISPATCH",
        verb: "dispatch",
        enabled: !baseDisabled && canDispatch && !dispatchNeedsText,
        reason: baseReason ?? (dispatchNeedsText ? "Add operator bar text for packet dispatch" : null)
      },
      {
        id: "hold",
        label: "HOLD",
        verb: "hold",
        enabled: !baseDisabled,
        reason: baseReason
      }
    ];
  }

  const buttons: CardButton[] = [];

  if (option.verbs.includes("yea")) {
    buttons.push({
      id: "approve",
      label: "APPROVE",
      verb: "yea",
      enabled: !baseDisabled,
      reason: baseReason
    });
  }

  if (option.verbs.includes("nay")) {
    buttons.push({
      id: "reject",
      label: "REJECT",
      verb: "nay",
      enabled: !baseDisabled,
      reason: baseReason
    });
  }

  if (option.verbs.includes("dispatch")) {
    buttons.push({
      id: "dispatch",
      label: "DISPATCH",
      verb: "dispatch",
      enabled: !baseDisabled && !needsText,
      reason: baseReason ?? (needsText ? "Add operator bar text for packet dispatch" : null)
    });
  }

  if (option.verbs.includes("needs_research")) {
    buttons.push({
      id: "needs_research",
      label: "NEEDS RESEARCH",
      verb: "needs_research",
      enabled: !baseDisabled,
      reason: baseReason
    });
  }

  if (option.verbs.includes("kill_test")) {
    buttons.push({
      id: "kill_test",
      label: "KILL TEST",
      verb: "kill_test",
      enabled: !baseDisabled,
      reason: baseReason
    });
  }

  if (option.verbs.includes("human_reality")) {
    buttons.push({
      id: "human_reality",
      label: "HUMAN REALITY",
      verb: "human_reality",
      enabled: !baseDisabled,
      reason: baseReason
    });
  }

  buttons.push({
    id: "hold",
    label: "HOLD",
    verb: "hold",
    enabled: !baseDisabled,
    reason: baseReason
  });

  return buttons;
}
