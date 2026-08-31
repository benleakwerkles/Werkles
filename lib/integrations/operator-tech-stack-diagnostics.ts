import {
  TECH_STACK_SLOT_IDS,
  techStackSlot,
  type TechStackSlot,
  type TechStackSlotId
} from "./tech-stack-slot-catalog.ts";
import {
  CRUCIBLE_PROVIDER_READINESS,
  type CrucibleProviderReadinessEntry
} from "../crucible-provider-readiness.ts";
import type { CruciblePriceKey } from "../pricing.ts";

/** Static repository state only. None of these labels assert runtime readiness. */
export type OperatorTechStackState =
  | "foundation_only"
  | "code_path_present"
  | "sandbox_scaffold"
  | "policy_blocked"
  | "not_connected";

export type OperatorProviderCheckDiagnostic = Readonly<{
  checkKey: CruciblePriceKey;
  provider: string;
  state: Exclude<OperatorTechStackState, "foundation_only">;
  route: string | null;
  runtimeAvailability: "unknown";
  actionEnabled: false;
  productionLive: false;
  blocker: string;
}>;

export type OperatorTechStackSlotDiagnostic = Readonly<{
  id: TechStackSlotId;
  system: string;
  purpose: string;
  state: OperatorTechStackState;
  stateDetail: string;
  runtimeAvailability: "unknown";
  actionEnabled: false;
  productionLive: false;
  compositionModule: string;
  routes: readonly string[];
  authority: string;
  blocker: string;
  providerChecks: readonly OperatorProviderCheckDiagnostic[];
}>;

export type OperatorTechStackDiagnosticSnapshot = Readonly<{
  audience: "server_operator_only";
  scope: "static_repository_readiness";
  runtimeInspected: false;
  secretsInspected: false;
  providersContacted: false;
  runtimeAvailability: "unknown";
  actionEnabled: false;
  productionLive: false;
  slots: readonly OperatorTechStackSlotDiagnostic[];
  unassignedProviderChecks: readonly OperatorProviderCheckDiagnostic[];
}>;

const CHECK_SLOT_ASSIGNMENTS = Object.freeze({
  identity: "stripe_identity",
  identity_reverification: "stripe_identity",
  phone: "twilio_verify",
  funds: "plaid",
  funds_reverification: "plaid",
  background_basic: "checkr",
  background_essential: "checkr",
  background_complete: "checkr",
  continuous_monitoring: "checkr"
} as const satisfies Partial<Record<CruciblePriceKey, TechStackSlotId>>);

/** Deliberate omissions from the current provider stack, not accidental gaps. */
export const UNASSIGNED_PROVIDER_CHECKS = Object.freeze([
  "license",
  "reference",
  "employment"
] as const satisfies readonly CruciblePriceKey[]);

const STATE_DETAILS: Readonly<Record<OperatorTechStackState, string>> = Object.freeze({
  foundation_only: "Internal foundation exists; no provider path or runtime availability is claimed.",
  code_path_present: "A code path is present; provider and runtime availability remain unknown.",
  sandbox_scaffold: "A sandbox scaffold is present; it is not proof storage or production readiness.",
  policy_blocked: "An explicit policy, legal, provider, or approval gate blocks this work.",
  not_connected: "The integration path is not connected."
});

function stateForSlot(slot: TechStackSlot): OperatorTechStackState {
  switch (slot.stage) {
    case "test_path_present":
      return "code_path_present";
    case "sandbox_demo":
      return "sandbox_scaffold";
    case "foundation_only":
      return "foundation_only";
    case "policy_blocked":
      return "policy_blocked";
    case "not_connected":
      return "not_connected";
  }
}

function stateForCheck(
  entry: CrucibleProviderReadinessEntry
): OperatorProviderCheckDiagnostic["state"] {
  switch (entry.adapterStage) {
    case "test_adapter":
      return "code_path_present";
    case "sandbox_demo":
      return "sandbox_scaffold";
    case "policy_blocked":
      return "policy_blocked";
    case "planned":
      return "not_connected";
  }
}

function diagnosticForCheck(checkKey: CruciblePriceKey): OperatorProviderCheckDiagnostic {
  const entry = CRUCIBLE_PROVIDER_READINESS[checkKey];
  return Object.freeze({
    checkKey,
    provider: entry.provider,
    state: stateForCheck(entry),
    route: entry.route,
    runtimeAvailability: "unknown",
    actionEnabled: false,
    productionLive: false,
    blocker: entry.readout
  });
}

function checkKeysForSlot(slotId: TechStackSlotId): CruciblePriceKey[] {
  return (Object.entries(CHECK_SLOT_ASSIGNMENTS) as [CruciblePriceKey, TechStackSlotId][])
    .filter(([, assignedSlot]) => assignedSlot === slotId)
    .map(([checkKey]) => checkKey);
}

function assertExactProviderCheckCoverage(): void {
  const allChecks = Object.keys(CRUCIBLE_PROVIDER_READINESS) as CruciblePriceKey[];
  const assigned = Object.keys(CHECK_SLOT_ASSIGNMENTS) as CruciblePriceKey[];
  const declared = [...assigned, ...UNASSIGNED_PROVIDER_CHECKS];

  if (new Set(declared).size !== declared.length) {
    throw new Error("Provider check mapping contains a duplicate assignment.");
  }
  if ([...declared].sort().join("|") !== [...allChecks].sort().join("|")) {
    throw new Error("Provider check mapping does not exactly cover the readiness manifest.");
  }
}

function diagnosticForSlot(id: TechStackSlotId): OperatorTechStackSlotDiagnostic {
  const slot = techStackSlot(id);
  const state = stateForSlot(slot);

  if (!slot.blocker) {
    throw new Error(`Tech-stack slot ${id} has no operator blocker.`);
  }

  return Object.freeze({
    id: slot.id,
    system: slot.system,
    purpose: slot.purpose,
    state,
    stateDetail: STATE_DETAILS[state],
    runtimeAvailability: "unknown",
    actionEnabled: false,
    productionLive: false,
    compositionModule: slot.compositionModule,
    routes: Object.freeze([...slot.routes]),
    authority: slot.authority,
    blocker: slot.blocker,
    providerChecks: Object.freeze(checkKeysForSlot(id).map(diagnosticForCheck))
  });
}

/**
 * Internal pure model used by the server-only wrapper and offline smoke. It
 * reads static manifests only; it performs no configuration, environment,
 * secret, SDK, network, persistence, or provider inspection.
 */
export function buildOperatorTechStackDiagnosticSnapshot(): OperatorTechStackDiagnosticSnapshot {
  assertExactProviderCheckCoverage();
  return Object.freeze({
    audience: "server_operator_only",
    scope: "static_repository_readiness",
    runtimeInspected: false,
    secretsInspected: false,
    providersContacted: false,
    runtimeAvailability: "unknown",
    actionEnabled: false,
    productionLive: false,
    slots: Object.freeze(TECH_STACK_SLOT_IDS.map(diagnosticForSlot)),
    unassignedProviderChecks: Object.freeze(UNASSIGNED_PROVIDER_CHECKS.map(diagnosticForCheck))
  });
}
