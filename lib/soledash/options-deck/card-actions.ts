import type { CompanyOption, OptionVerb } from "./types";

export type CardButton = {
  id: "fire" | "hold" | "kill_test" | "needs_research";
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

  const canKill = option.verbs.includes("kill_test") || option.id.includes("kill_test");
  const canResearch =
    option.verbs.includes("needs_research") || option.id.includes("needs_research");

  const fireVerb: OptionVerb = option.isActiveFrontier
    ? option.verbs.includes("yea")
      ? "yea"
      : option.verbs.includes("dispatch")
        ? "dispatch"
        : option.verbs[0] ?? "hold"
    : option.verbs.includes("make_frontier")
      ? "make_frontier"
      : option.verbs.includes("dispatch")
        ? "dispatch"
        : option.verbs[0] ?? "hold";

  const fireNeedsText = fireVerb === "dispatch" && needsText;

  return [
    {
      id: "fire",
      label: "FIRE",
      verb: fireVerb,
      enabled: !baseDisabled && !fireNeedsText && fireVerb !== "hold",
      reason: baseReason ?? (fireNeedsText ? "Add operator bar text for packet dispatch" : null)
    },
    {
      id: "hold",
      label: "HOLD",
      verb: "hold",
      enabled: !baseDisabled,
      reason: baseReason
    },
    {
      id: "kill_test",
      label: "KILL TEST",
      verb: "kill_test",
      enabled: !baseDisabled && canKill && option.enabled,
      reason:
        baseReason ??
        (!canKill ? "Kill test not enabled in Dink protocol for this option" : option.disabledReason)
    },
    {
      id: "needs_research",
      label: "NEEDS RESEARCH",
      verb: "needs_research",
      enabled: !baseDisabled && canResearch && option.enabled,
      reason:
        baseReason ??
        (!canResearch
          ? "Needs research not enabled in Dink protocol for this option"
          : option.disabledReason)
    }
  ];
}
