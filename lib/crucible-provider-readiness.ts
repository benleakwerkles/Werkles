import type { CruciblePriceKey } from "@/lib/pricing";

export type ProviderAdapterStage = "test_adapter" | "sandbox_demo" | "planned" | "policy_blocked";
export type ProviderRuntimeAvailability = "unknown" | "available" | "unavailable";
export type ProviderProofStorage = "provider_status_webhook" | "none";

export type CrucibleProviderReadinessEntry = {
  checkKey: CruciblePriceKey;
  provider: string;
  adapterStage: ProviderAdapterStage;
  route: string | null;
  productionLive: false;
  proofStorage: ProviderProofStorage;
  policyGate: "counsel_and_provider_approval" | null;
  readout: string;
};

export type CrucibleProviderReadinessStatus =
  | "walkthrough_read_only"
  | "policy_blocked"
  | "not_connected"
  | "runtime_check_required"
  | "runtime_unavailable"
  | "test_available"
  | "sandbox_demo_available";

export type CrucibleProviderReadinessReadout = {
  status: CrucibleProviderReadinessStatus;
  label: string;
  detail: string;
  actionEnabled: boolean;
};

/**
 * Product-facing provider truth. This describes adapter scope, never current
 * runtime configuration. A route in this manifest means code exists; it does
 * not mean credentials, provider-account access, membership, or policy gates
 * have passed.
 */
function freezeProviderReadiness<
  const T extends Record<CruciblePriceKey, CrucibleProviderReadinessEntry>
>(value: T): Readonly<{ [K in keyof T]: Readonly<T[K]> }> {
  for (const entry of Object.values(value)) {
    Object.freeze(entry);
  }
  return Object.freeze(value);
}

export const CRUCIBLE_PROVIDER_READINESS = freezeProviderReadiness({
  identity: {
    checkKey: "identity",
    provider: "Stripe Identity",
    adapterStage: "test_adapter",
    route: "/api/verification/identity",
    productionLive: false,
    proofStorage: "provider_status_webhook",
    policyGate: null,
    readout: "Test adapter present. Availability is checked when the member starts the test flow."
  },
  identity_reverification: {
    checkKey: "identity_reverification",
    provider: "Stripe Identity",
    adapterStage: "planned",
    route: null,
    productionLive: false,
    proofStorage: "none",
    policyGate: null,
    readout: "Re-verification is not connected."
  },
  phone: {
    checkKey: "phone",
    provider: "Twilio Verify",
    adapterStage: "planned",
    route: null,
    productionLive: false,
    proofStorage: "none",
    policyGate: null,
    readout: "Phone verification is planned and not connected."
  },
  funds: {
    checkKey: "funds",
    provider: "Plaid Link",
    adapterStage: "sandbox_demo",
    route: "/api/verification/funds",
    productionLive: false,
    proofStorage: "none",
    policyGate: null,
    readout: "Plaid granted sandbox access. Werkles can open Link only after its sandbox keys are in server custody; completion still creates no funds proof or stored bank connection."
  },
  funds_reverification: {
    checkKey: "funds_reverification",
    provider: "Plaid",
    adapterStage: "planned",
    route: null,
    productionLive: false,
    proofStorage: "none",
    policyGate: null,
    readout: "Funds re-verification is not connected."
  },
  license: {
    checkKey: "license",
    provider: "State board or provider not selected",
    adapterStage: "planned",
    route: null,
    productionLive: false,
    proofStorage: "none",
    policyGate: null,
    readout: "License lookup is not connected."
  },
  reference: {
    checkKey: "reference",
    provider: "Provider not connected",
    adapterStage: "planned",
    route: null,
    productionLive: false,
    proofStorage: "none",
    policyGate: null,
    readout: "Reference checks are not connected."
  },
  employment: {
    checkKey: "employment",
    provider: "Provider not connected",
    adapterStage: "planned",
    route: null,
    productionLive: false,
    proofStorage: "none",
    policyGate: null,
    readout: "Employment checks are not connected."
  },
  background_basic: {
    checkKey: "background_basic",
    provider: "Background provider not approved",
    adapterStage: "policy_blocked",
    route: null,
    productionLive: false,
    proofStorage: "none",
    policyGate: "counsel_and_provider_approval",
    readout: "Blocked pending counsel and provider approval. No consent or report flow is active."
  },
  background_essential: {
    checkKey: "background_essential",
    provider: "Background provider not approved",
    adapterStage: "policy_blocked",
    route: null,
    productionLive: false,
    proofStorage: "none",
    policyGate: "counsel_and_provider_approval",
    readout: "Blocked pending counsel and provider approval. No consent or report flow is active."
  },
  background_complete: {
    checkKey: "background_complete",
    provider: "Background provider not approved",
    adapterStage: "policy_blocked",
    route: null,
    productionLive: false,
    proofStorage: "none",
    policyGate: "counsel_and_provider_approval",
    readout: "Blocked pending counsel and provider approval. No consent or report flow is active."
  },
  continuous_monitoring: {
    checkKey: "continuous_monitoring",
    provider: "Monitoring provider not approved",
    adapterStage: "policy_blocked",
    route: null,
    productionLive: false,
    proofStorage: "none",
    policyGate: "counsel_and_provider_approval",
    readout: "Continuous monitoring is blocked. No enrollment or monitoring is active."
  }
} as const satisfies Record<CruciblePriceKey, CrucibleProviderReadinessEntry>);

export function providerReadinessFor(checkKey: CruciblePriceKey): CrucibleProviderReadinessEntry {
  return CRUCIBLE_PROVIDER_READINESS[checkKey];
}

export function resolveProviderReadiness(
  entry: CrucibleProviderReadinessEntry,
  input: { walkthroughReadOnly: boolean; runtime: ProviderRuntimeAvailability }
): CrucibleProviderReadinessReadout {
  if (entry.adapterStage === "policy_blocked") {
    return { status: "policy_blocked", label: "Policy blocked", detail: entry.readout, actionEnabled: false };
  }

  if (entry.adapterStage === "planned") {
    return { status: "not_connected", label: "Not connected", detail: entry.readout, actionEnabled: false };
  }

  if (input.walkthroughReadOnly) {
    return {
      status: "walkthrough_read_only",
      label: "Connected test account required",
      detail: `${entry.provider}: ${entry.readout}`,
      actionEnabled: false
    };
  }

  if (input.runtime === "unknown") {
    return {
      status: "runtime_check_required",
      label: "Checked when opened",
      detail: entry.readout,
      actionEnabled: false
    };
  }

  if (input.runtime === "unavailable") {
    return {
      status: "runtime_unavailable",
      label: "Unavailable in this environment",
      detail: entry.readout,
      actionEnabled: false
    };
  }

  if (entry.adapterStage === "sandbox_demo") {
    return {
      status: "sandbox_demo_available",
      label: "Sandbox demo available",
      detail: entry.readout,
      actionEnabled: true
    };
  }

  return {
    status: "test_available",
    label: "Test path available",
    detail: entry.readout,
    actionEnabled: true
  };
}
