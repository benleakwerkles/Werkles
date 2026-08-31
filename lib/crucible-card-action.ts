import type { CrucibleState } from "@/lib/crucible";
import type { CruciblePriceKey } from "@/lib/pricing";

export type CrucibleCardAction = {
  label: string;
  enabled: boolean;
  emphasis: "primary" | "secondary";
};

type CrucibleCardActionInput = {
  state: CrucibleState;
  checkKey: CruciblePriceKey;
  checkTitle: string;
  defaultLabel: string;
  hasRoute: boolean;
  hasHandler: boolean;
  busy?: boolean;
  previewDisabled?: boolean;
  walkthroughReadOnly?: boolean;
  runtimeUnavailable?: boolean;
};

export function crucibleCardAction(input: CrucibleCardActionInput): CrucibleCardAction {
  if (input.previewDisabled) {
    return { label: "Sandbox action disabled in preview.", enabled: false, emphasis: "secondary" };
  }

  if (input.busy) {
    return { label: "Starting check...", enabled: false, emphasis: "secondary" };
  }

  if (input.state === "unavailable") {
    return { label: "Not available yet", enabled: false, emphasis: "secondary" };
  }

  if (input.walkthroughReadOnly) {
    return { label: "Connected test account required", enabled: false, emphasis: "secondary" };
  }

  if (input.runtimeUnavailable && input.hasRoute) {
    return {
      label: input.checkKey === "funds" ? "Connect Plaid sandbox keys" : "Provider test unavailable",
      enabled: false,
      emphasis: "secondary"
    };
  }

  if (
    input.state === "pending" ||
    input.state === "sandbox_pending" ||
    input.state === "provider_redirect"
  ) {
    return { label: "Provider check already in progress", enabled: false, emphasis: "secondary" };
  }

  if (input.state === "membership_required") {
    return { label: "Membership required", enabled: false, emphasis: "secondary" };
  }

  if (input.state === "payment_required") {
    return { label: "Payment required", enabled: false, emphasis: "secondary" };
  }

  const enabled = input.hasRoute && input.hasHandler;

  if (input.state === "legacy_unbacked") {
    if (input.checkKey !== "funds") {
      return { label: "Action unavailable", enabled: false, emphasis: "secondary" };
    }
    return {
      label: "Open Plaid sandbox demo",
      enabled,
      emphasis: enabled ? "primary" : "secondary"
    };
  }

  if (
    input.state === "sandbox_verified" ||
    input.state === "live_verified" ||
    input.state === "verified"
  ) {
    return {
      label: `Re-check ${input.checkTitle}`,
      enabled,
      emphasis: enabled ? "primary" : "secondary"
    };
  }

  if (input.state === "expired") {
    return { label: `Renew ${input.checkTitle}`, enabled, emphasis: enabled ? "primary" : "secondary" };
  }

  if (input.state === "failed") {
    return { label: `Try ${input.checkTitle} again`, enabled, emphasis: enabled ? "primary" : "secondary" };
  }

  if (input.state === "manual_review") {
    return { label: "Manual review in progress", enabled: false, emphasis: "secondary" };
  }

  if (input.state === "not_started" || input.state === "ready_to_start") {
    if (input.checkKey === "funds") {
      return {
        label: "Open Plaid sandbox demo",
        enabled,
        emphasis: enabled ? "primary" : "secondary"
      };
    }
    return { label: input.defaultLabel, enabled, emphasis: enabled ? "primary" : "secondary" };
  }

  return { label: "Action unavailable", enabled: false, emphasis: "secondary" };
}
