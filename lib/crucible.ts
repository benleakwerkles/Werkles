import { pricing } from "@/lib/pricing";
import { copy } from "@/lib/copy";
import { providerReadinessFor } from "@/lib/crucible-provider-readiness";

export type CrucibleState =
  | "not_started"
  | "membership_required"
  | "payment_required"
  | "ready_to_start"
  | "provider_redirect"
  | "pending"
  | "sandbox_pending"
  | "sandbox_verified"
  | "live_verified"
  | "legacy_unbacked"
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
  sandbox_pending: "Stored status: sandbox pending",
  sandbox_verified: "Stored status: sandbox verified",
  live_verified: "Stored status: live verified",
  legacy_unbacked: "Legacy funds flag - no proof receipt on file",
  verified: "Verified",
  failed: "Couldn't verify",
  expired: "Needs renewing",
  manual_review: "Under review",
  unavailable: "Not available yet"
};

export const crucibleTrustCopy = [
  copy.proofDisclaimer,
  "Paid status alone is not a proof signal.",
  copy.crucible.storesDefault
] as const;

export const crucibleChecks = pricing.crucible.map((check) => {
  const providerReadiness = providerReadinessFor(check.key);
  const active =
    providerReadiness.adapterStage === "test_adapter" ||
    providerReadiness.adapterStage === "sandbox_demo";

  return {
    ...check,
    providerReadiness,
    state: active ? "ready_to_start" : "unavailable",
    route: providerReadiness.route,
    stores:
      check.key === "funds"
        ? copy.crucible.storesFunds
        : check.key === "identity"
          ? copy.crucible.storesIdentity
          : copy.crucible.storesDefault
  };
});

export type CrucibleCheck = (typeof crucibleChecks)[number];
