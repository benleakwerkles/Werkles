import { pricing } from "@/lib/pricing";
import { copy } from "@/lib/copy";

export type CrucibleState =
  | "not_started"
  | "membership_required"
  | "payment_required"
  | "ready_to_start"
  | "provider_redirect"
  | "pending"
  | "verified"
  | "failed"
  | "expired"
  | "manual_review"
  | "unavailable";

export const crucibleStateCopy: Record<CrucibleState, string> = {
  not_started: "Not started",
  membership_required: "Members only",
  payment_required: "Needs a paid plan",
  ready_to_start: "Ready to verify",
  provider_redirect: "Continue with the provider — Werkles waits for the receipt.",
  pending: "Checking…",
  verified: "Verified",
  failed: "Couldn't verify",
  expired: "Needs renewing",
  manual_review: "Under review",
  unavailable: "Not available yet"
};

export const crucibleTrustCopy = [
  copy.crucible.principle,
  copy.proofDisclaimer,
  "Paid status alone is not a proof signal.",
  copy.crucible.storesDefault
] as const;

export const crucibleChecks = pricing.crucible.map((check) => {
  const active = check.key === "identity" || check.key === "funds";

  return {
    ...check,
    state: active ? "ready_to_start" : "unavailable",
    route:
      check.key === "identity"
        ? "/api/verification/identity"
        : check.key === "funds"
          ? "/api/verification/funds"
          : null,
    stores:
      check.key === "funds"
        ? copy.crucible.storesFunds
        : check.key === "identity"
          ? copy.crucible.storesIdentity
          : copy.crucible.storesDefault
  };
});

export type CrucibleCheck = (typeof crucibleChecks)[number];
