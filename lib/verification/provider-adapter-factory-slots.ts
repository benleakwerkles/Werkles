import type {
  ExternalVerificationProviderId,
  ProviderCompletionAuthority,
  ProviderInteraction
} from "./provider-adapter-port.ts";

export type ProviderServerDependencyId =
  | "stripe_identity.server_client"
  | "stripe_identity.webhook_verifier"
  | "plaid.server_client"
  | "plaid.webhook_verifier"
  | "twilio_verify.server_client"
  | "checkr.server_client"
  | "checkr.webhook_verifier";

export type ProviderOperationPersistenceRequirement =
  | "owner_subject_binding"
  | "provider_operation_reference"
  | "purpose_scope_binding"
  | "consent_receipt_reference"
  | "idempotency_reference"
  | "status_transition_history"
  | "created_and_expiry_instants"
  | "revocation_instant"
  | "encrypted_provider_custody"
  | "provider_redaction_state"
  | "provider_report_reference"
  | "provider_removal_state"
  | "delivery_attempt_history"
  | "adverse_action_workflow_state"
  | "retention_schedule_binding";

export type ProviderEvidencePersistenceRequirement =
  | "provider_event_identity"
  | "provider_status"
  | "canonical_observed_instant"
  | "evidence_digest"
  | "trust_domain"
  | "claim_binding_reference"
  | "evidence_expiry_instant"
  | "revoke_and_dispute_state";

export type ProviderAdapterFactoryGateStatus =
  | "blocked_on_credentials_and_persistence"
  | "blocked_on_item_custody_and_persistence"
  | "blocked_on_provider_spend_and_persistence"
  | "policy_blocked_pending_legal_and_provider_approval";

export type ProviderAdapterFactorySlot = Readonly<{
  version: "v1";
  providerId: ExternalVerificationProviderId;
  runtimeBoundary: "server_only";
  factoryModule: string;
  factoryExport: string;
  factoryContract: Readonly<{
    output: "VerificationProviderAdapterPort";
    trustDomainSource: "trusted_server_composition";
    validationBoundary: "defineVerificationProviderAdapter";
    productionComposition: "closed_until_gate";
  }>;
  interaction: ProviderInteraction;
  completionAuthority: ProviderCompletionAuthority;
  requiredServerDependencies: readonly ProviderServerDependencyId[];
  operationPersistence: readonly ProviderOperationPersistenceRequirement[];
  evidencePersistence: readonly ProviderEvidencePersistenceRequirement[];
  revokeSemantics: Readonly<{
    providerAction: string;
    localAction: string;
    lateEventRule: string;
  }>;
  gate: Readonly<{
    status: ProviderAdapterFactoryGateStatus;
    productionReady: false;
    requirements: readonly string[];
  }>;
}>;

const BASE_OPERATION_PERSISTENCE = Object.freeze([
  "owner_subject_binding",
  "provider_operation_reference",
  "purpose_scope_binding",
  "consent_receipt_reference",
  "idempotency_reference",
  "status_transition_history",
  "created_and_expiry_instants",
  "revocation_instant"
] as const satisfies readonly ProviderOperationPersistenceRequirement[]);

const BASE_EVIDENCE_PERSISTENCE = Object.freeze([
  "provider_event_identity",
  "provider_status",
  "canonical_observed_instant",
  "evidence_digest",
  "trust_domain",
  "claim_binding_reference",
  "evidence_expiry_instant",
  "revoke_and_dispute_state"
] as const satisfies readonly ProviderEvidencePersistenceRequirement[]);

function factorySlot(value: ProviderAdapterFactorySlot): ProviderAdapterFactorySlot {
  return Object.freeze({
    ...value,
    requiredServerDependencies: Object.freeze([...value.requiredServerDependencies]),
    operationPersistence: Object.freeze([...value.operationPersistence]),
    evidencePersistence: Object.freeze([...value.evidencePersistence]),
    factoryContract: Object.freeze({ ...value.factoryContract }),
    revokeSemantics: Object.freeze({ ...value.revokeSemantics }),
    gate: Object.freeze({
      ...value.gate,
      requirements: Object.freeze([...value.gate.requirements])
    })
  });
}

/**
 * Static contracts for the concrete server factories that may eventually
 * create provider adapters. These slots contain dependency identifiers only:
 * never dependency instances, credentials, configuration values, or adapters.
 */
export const PROVIDER_ADAPTER_FACTORY_SLOTS: Readonly<
  Record<ExternalVerificationProviderId, ProviderAdapterFactorySlot>
> = Object.freeze({
  stripe_identity: factorySlot({
    version: "v1",
    providerId: "stripe_identity",
    runtimeBoundary: "server_only",
    factoryModule: "lib/verification/adapters/stripe-identity-adapter.ts",
    factoryExport: "createStripeIdentityVerificationAdapter",
    factoryContract: {
      output: "VerificationProviderAdapterPort",
      trustDomainSource: "trusted_server_composition",
      validationBoundary: "defineVerificationProviderAdapter",
      productionComposition: "closed_until_gate"
    },
    interaction: "hosted_redirect",
    completionAuthority: "signed_webhook",
    requiredServerDependencies: [
      "stripe_identity.server_client",
      "stripe_identity.webhook_verifier"
    ],
    operationPersistence: Object.freeze([
      ...BASE_OPERATION_PERSISTENCE,
      "provider_redaction_state"
    ]),
    evidencePersistence: BASE_EVIDENCE_PERSISTENCE,
    revokeSemantics: {
      providerAction: "Cancel the VerificationSession only when its provider state permits cancellation; cancellation is not redaction, and asynchronous redaction is a separate retention action.",
      localAction: "Revoke the owner-bound operation and every derived active claim without deleting its audit receipt.",
      lateEventRule: "A signed event received after local revocation may extend audit history but cannot reactivate a claim."
    },
    gate: {
      status: "blocked_on_credentials_and_persistence",
      productionReady: false,
      requirements: [
        "private server credential entry",
        "signed webhook endpoint review",
        "durable owner-bound operation and evidence persistence",
        "retention and redaction policy approval"
      ]
    }
  }),
  plaid: factorySlot({
    version: "v1",
    providerId: "plaid",
    runtimeBoundary: "server_only",
    factoryModule: "lib/verification/adapters/plaid-adapter.ts",
    factoryExport: "createPlaidVerificationAdapter",
    factoryContract: {
      output: "VerificationProviderAdapterPort",
      trustDomainSource: "trusted_server_composition",
      validationBoundary: "defineVerificationProviderAdapter",
      productionComposition: "closed_until_gate"
    },
    interaction: "embedded_link",
    completionAuthority: "signed_webhook",
    requiredServerDependencies: ["plaid.server_client", "plaid.webhook_verifier"],
    operationPersistence: Object.freeze([
      ...BASE_OPERATION_PERSISTENCE,
      "encrypted_provider_custody",
      "provider_report_reference",
      "provider_removal_state"
    ]),
    evidencePersistence: BASE_EVIDENCE_PERSISTENCE,
    revokeSemantics: {
      providerAction: "Remove the Plaid Item through the server client and erase encrypted access-token custody after confirmed removal; removal does not delete existing Asset Reports or Audit Copies.",
      localAction: "Revoke the owner-bound operation, bank-ownership claim, funds claim, and all grants derived from them.",
      lateEventRule: "Events for a removed or locally revoked Item remain audit-only and cannot restore evidence or access."
    },
    gate: {
      status: "blocked_on_item_custody_and_persistence",
      productionReady: false,
      requirements: [
        "private server credential entry",
        "encrypted owner-bound Item custody",
        "signed webhook verification",
        "transactional operation evidence and grant persistence",
        "Item removal and retention proof"
      ]
    }
  }),
  twilio_verify: factorySlot({
    version: "v1",
    providerId: "twilio_verify",
    runtimeBoundary: "server_only",
    factoryModule: "lib/verification/adapters/twilio-verify-adapter.ts",
    factoryExport: "createTwilioVerifyAdapter",
    factoryContract: {
      output: "VerificationProviderAdapterPort",
      trustDomainSource: "trusted_server_composition",
      validationBoundary: "defineVerificationProviderAdapter",
      productionComposition: "closed_until_gate"
    },
    interaction: "challenge_code",
    completionAuthority: "server_check",
    requiredServerDependencies: ["twilio_verify.server_client"],
    operationPersistence: Object.freeze([
      ...BASE_OPERATION_PERSISTENCE,
      "delivery_attempt_history"
    ]),
    evidencePersistence: BASE_EVIDENCE_PERSISTENCE,
    revokeSemantics: {
      providerAction: "Treat a successful send as pending, never proof; only an approved Verification Check completes possession, and the default challenge expiry is ten minutes.",
      localAction: "Revoke the possession operation and derived phone claim, then reject any later challenge completion.",
      lateEventRule: "A check that completes after expiry or local revocation is audit-only and cannot satisfy the claim."
    },
    gate: {
      status: "blocked_on_provider_spend_and_persistence",
      productionReady: false,
      requirements: [
        "provider service setup and private server credential entry",
        "member consent and delivery-purpose copy",
        "rate abuse and spend controls",
        "durable attempt expiry and evidence persistence"
      ]
    }
  }),
  checkr: factorySlot({
    version: "v1",
    providerId: "checkr",
    runtimeBoundary: "server_only",
    factoryModule: "lib/verification/adapters/checkr-adapter.ts",
    factoryExport: "createCheckrVerificationAdapter",
    factoryContract: {
      output: "VerificationProviderAdapterPort",
      trustDomainSource: "trusted_server_composition",
      validationBoundary: "defineVerificationProviderAdapter",
      productionComposition: "closed_until_gate"
    },
    interaction: "hosted_invitation",
    completionAuthority: "signed_webhook",
    requiredServerDependencies: ["checkr.server_client", "checkr.webhook_verifier"],
    operationPersistence: Object.freeze([
      ...BASE_OPERATION_PERSISTENCE,
      "provider_report_reference",
      "adverse_action_workflow_state",
      "retention_schedule_binding"
    ]),
    evidencePersistence: BASE_EVIDENCE_PERSISTENCE,
    revokeSemantics: {
      providerAction: "Cancel an invitation or report only where the provider and governing workflow permit; cancellation or deletion never counts as adverse-action completion.",
      localAction: "Revoke Werkles access and claims while preserving legally required dispute, adverse-action, and audit state.",
      lateEventRule: "Late signed events may update the compliance record but cannot silently restore a revoked member-facing claim."
    },
    gate: {
      status: "policy_blocked_pending_legal_and_provider_approval",
      productionReady: false,
      requirements: [
        "approved permissible purpose",
        "counsel-reviewed consent certification disclosure and authorization",
        "adverse-action and dispute workflow",
        "provider account approval and private credential entry",
        "reviewed retention access and deletion policy",
        "durable operation and evidence persistence"
      ]
    }
  })
});

export function providerAdapterFactorySlot(
  providerId: ExternalVerificationProviderId
): ProviderAdapterFactorySlot {
  return PROVIDER_ADAPTER_FACTORY_SLOTS[providerId];
}
