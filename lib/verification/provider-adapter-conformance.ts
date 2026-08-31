import {
  VERIFICATION_PURPOSES,
  validateVerificationClaim,
  type ClaimEvaluation,
  type ConsentRecord,
  type ContractIssue,
  type VerificationClaim,
  type VerificationClaimType,
  type VerificationPurpose
} from "./claim-evidence-contract.ts";
import {
  isPortVerifiedProviderEvent,
  type ProviderVerifiedEvent
} from "./provider-adapter-port.ts";

export const VERIFICATION_PROVIDER_IDS = ["stripe_identity", "plaid", "twilio_verify", "checkr", "werkles_native"] as const;
export type VerificationProviderId = (typeof VERIFICATION_PROVIDER_IDS)[number];
export const PROVIDER_TRUST_DOMAINS = ["test", "production"] as const;
export type ProviderTrustDomain = (typeof PROVIDER_TRUST_DOMAINS)[number];

type ProviderCapability = Readonly<{
  observationKind: string;
  claimType: VerificationClaimType;
  purposes: readonly VerificationPurpose[];
  consentBases: readonly ConsentRecord["basis"][];
  providerStatuses: Readonly<Record<string, ClaimEvaluation>>;
  method: string;
  validitySeconds: number;
}>;
export type ProviderAdapterProfile = Readonly<{
  providerId: VerificationProviderId;
  sourceKind: "provider" | "werkles";
  sourceId: string;
  capabilities: readonly ProviderCapability[];
}>;

function capability(value: ProviderCapability): ProviderCapability {
  return Object.freeze({
    ...value,
    purposes: Object.freeze([...value.purposes]),
    consentBases: Object.freeze([...value.consentBases]),
    providerStatuses: Object.freeze({ ...value.providerStatuses })
  });
}

/** Adding a mapping or changing a TTL is a reviewed trust/product decision. */
export const PROVIDER_ADAPTER_PROFILES: Readonly<Record<VerificationProviderId, ProviderAdapterProfile>> = Object.freeze({
  stripe_identity: Object.freeze({
    providerId: "stripe_identity",
    sourceKind: "provider",
    sourceId: "stripe_identity",
    capabilities: Object.freeze([
      capability({
        observationKind: "government_id_document_check",
        claimType: "government_id_document_authentic",
        purposes: ["account_security", "marketplace_eligibility"],
        consentBases: ["affirmative_consent"],
        providerStatuses: { verified: "satisfied", processing: "pending", requires_input: "inconclusive", canceled: "not_satisfied" },
        method: "stripe_identity.document_result",
        validitySeconds: 30 * 24 * 60 * 60
      }),
      capability({
        observationKind: "selfie_government_id_match",
        claimType: "selfie_matches_government_id",
        purposes: ["account_security", "marketplace_eligibility"],
        consentBases: ["affirmative_consent"],
        providerStatuses: { verified: "satisfied", processing: "pending", requires_input: "inconclusive", canceled: "not_satisfied" },
        method: "stripe_identity.selfie_match_result",
        validitySeconds: 30 * 24 * 60 * 60
      })
    ])
  }),
  plaid: Object.freeze({
    providerId: "plaid",
    sourceKind: "provider",
    sourceId: "plaid",
    capabilities: Object.freeze([
      capability({
        observationKind: "bank_account_ownership_match",
        claimType: "bank_account_ownership_matched",
        purposes: ["marketplace_eligibility", "payment_risk"],
        consentBases: ["affirmative_consent"],
        providerStatuses: { matched: "satisfied", not_matched: "not_satisfied", pending: "pending", inconclusive: "inconclusive" },
        method: "plaid.identity_match_result",
        validitySeconds: 24 * 60 * 60
      }),
      capability({
        observationKind: "funds_threshold_observation",
        claimType: "funds_threshold_observed",
        purposes: ["marketplace_eligibility", "payment_risk"],
        consentBases: ["affirmative_consent"],
        providerStatuses: { threshold_met: "satisfied", threshold_not_met: "not_satisfied", pending: "pending", inconclusive: "inconclusive" },
        method: "plaid.balance_threshold_result",
        validitySeconds: 24 * 60 * 60
      })
    ])
  }),
  twilio_verify: Object.freeze({
    providerId: "twilio_verify",
    sourceKind: "provider",
    sourceId: "twilio_verify",
    capabilities: Object.freeze([
      capability({
        observationKind: "contact_channel_possession_check",
        claimType: "contact_channel_possession_confirmed",
        purposes: ["account_security", "marketplace_eligibility"],
        consentBases: ["affirmative_consent"],
        providerStatuses: { approved: "satisfied", pending: "pending", canceled: "not_satisfied", max_attempts_reached: "not_satisfied" },
        method: "twilio_verify.channel_possession_result",
        validitySeconds: 10 * 60
      })
    ])
  }),
  checkr: Object.freeze({
    providerId: "checkr",
    sourceKind: "provider",
    sourceId: "checkr",
    capabilities: Object.freeze([
      capability({
        observationKind: "employment_background_screening_completed",
        claimType: "background_screening_completed",
        purposes: ["employment_screening"],
        consentBases: ["affirmative_consent"],
        providerStatuses: { complete: "satisfied", pending: "pending", suspended: "inconclusive", dispute_pending: "inconclusive" },
        method: "checkr.employment_screening_completion",
        validitySeconds: 30 * 24 * 60 * 60
      })
    ])
  }),
  werkles_native: Object.freeze({
    providerId: "werkles_native",
    sourceKind: "werkles",
    sourceId: "werkles",
    capabilities: Object.freeze([
      capability({
        observationKind: "network_attestation_recorded",
        claimType: "network_attestation_recorded",
        purposes: ["network_reputation"],
        consentBases: ["affirmative_consent", "not_required"],
        providerStatuses: { recorded: "satisfied", withdrawn: "not_satisfied", disputed: "inconclusive" },
        method: "werkles.network_attestation_record",
        validitySeconds: 30 * 24 * 60 * 60
      })
    ])
  })
});

const REPLAY_STATE = Symbol("provider-observation-replay-state");
const CONFORMED_OBSERVATIONS = new WeakSet<object>();
const REPLAY_STATES = new WeakSet<object>();

/** Must be returned by the composition root's authoritative operation resolver. */
export type TrustedProviderClaimBindingSources = Readonly<{
  claimId: string;
  subjectId: string;
  claimType: VerificationClaimType;
  purpose: VerificationPurpose;
  scope: string;
  consent: ConsentRecord;
}>;

export type PortProviderObservationContext = Readonly<{
  evidenceRef: string;
  receivedAt: string;
}>;

export type ConformedProviderObservation = Readonly<{
  providerId: VerificationProviderId;
  providerEventId: string;
  operationRef: string;
  adapterEventKey: string;
  trustDomain: ProviderTrustDomain;
  evidenceDigest: string;
  receivedAt: string;
  claim: VerificationClaim;
}>;
export type ProviderObservationConformanceResult =
  | Readonly<{ ok: true; value: ConformedProviderObservation }>
  | Readonly<{ ok: false; issues: readonly ContractIssue[] }>;

export type ProviderObservationReplayState = Readonly<{
  readonly [REPLAY_STATE]: true;
  byAdapterEventKey: Readonly<Record<string, ConformedProviderObservation>>;
}>;
export type ProviderObservationReplayResult =
  | Readonly<{
      ok: true;
      outcome: "accepted" | "idempotent";
      state: ProviderObservationReplayState;
      value: ConformedProviderObservation;
    }>
  | Readonly<{
      ok: false;
      state: ProviderObservationReplayState;
      issues: readonly ContractIssue[];
    }>;

const BINDING_KEYS = Object.freeze(["claimId", "subjectId", "claimType", "purpose", "scope", "consent"]);
const VERIFIED_OBSERVATION_KEYS = Object.freeze([
  "providerId", "trustDomain", "providerEventId", "operationRef", "observationKind",
  "providerStatus", "observedAt", "evidenceDigest"
]);
const AFFIRMATIVE_CONSENT_KEYS = Object.freeze(["basis", "capturedAt", "version", "evidenceRef"]);
const NOT_REQUIRED_CONSENT_KEYS = Object.freeze(["basis", "rationale"]);
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const SHA_256 = /^sha256:[0-9a-f]{64}$/;
const FORBIDDEN_SCOPE_VALUES = new Set(["*", "all", "global", "safe", "verified"]);

function isPlainDataObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return Object.values(Object.getOwnPropertyDescriptors(value)).every((descriptor) => !descriptor.get && !descriptor.set);
}
function validInstant(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_INSTANT.test(value) || Number.isNaN(Date.parse(value))) return false;
  return new Date(value).toISOString() === value;
}
function requireText(issues: ContractIssue[], path: string, value: unknown, maximum = 256): value is string {
  if (typeof value !== "string" || !value.length || value !== value.trim() || value.length > maximum || /[\u0000-\u001f\u007f]/.test(value)) {
    issues.push({ path, code: "invalid_text" });
    return false;
  }
  return true;
}
function rejectUnknownKeys(issues: ContractIssue[], path: string, value: Record<string, unknown>, allowed: readonly string[]): void {
  const allowedKeys = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) issues.push({ path: path ? `${path}.${key}` : key, code: "unknown_field" });
  }
}

function validateConsent(value: unknown, issues: ContractIssue[]): ConsentRecord | null {
  if (!isPlainDataObject(value)) {
    issues.push({ path: "binding.consent", code: "plain_data_object_required" });
    return null;
  }
  if (value.basis === "affirmative_consent") {
    rejectUnknownKeys(issues, "binding.consent", value, AFFIRMATIVE_CONSENT_KEYS);
    requireText(issues, "binding.consent.version", value.version, 100);
    requireText(issues, "binding.consent.evidenceRef", value.evidenceRef);
    if (!validInstant(value.capturedAt)) issues.push({ path: "binding.consent.capturedAt", code: "invalid_instant" });
    if (issues.some((issue) => issue.path.startsWith("binding.consent"))) return null;
    return Object.freeze({ basis: "affirmative_consent", capturedAt: value.capturedAt as string, version: value.version as string, evidenceRef: value.evidenceRef as string });
  }
  if (value.basis === "not_required") {
    rejectUnknownKeys(issues, "binding.consent", value, NOT_REQUIRED_CONSENT_KEYS);
    requireText(issues, "binding.consent.rationale", value.rationale, 500);
    if (issues.some((issue) => issue.path.startsWith("binding.consent"))) return null;
    return Object.freeze({ basis: "not_required", rationale: value.rationale as string });
  }
  issues.push({ path: "binding.consent.basis", code: "unknown_enum" });
  return null;
}
function trustDomainEvaluation(evaluation: ClaimEvaluation, trustDomain: ProviderTrustDomain): ClaimEvaluation {
  return evaluation === "satisfied" && trustDomain === "test" ? "inconclusive" : evaluation;
}
function freezeClaim(claim: VerificationClaim): VerificationClaim {
  Object.freeze(claim.consent);
  Object.freeze(claim.provenance);
  return Object.freeze(claim);
}

function makeReplayState(
  byAdapterEventKey: Readonly<Record<string, ConformedProviderObservation>>
): ProviderObservationReplayState {
  const state = Object.freeze({
    [REPLAY_STATE]: true as const,
    byAdapterEventKey: Object.freeze({ ...byAdapterEventKey })
  });
  REPLAY_STATES.add(state);
  return state;
}

function sameCanonicalClaim(left: VerificationClaim, right: VerificationClaim): boolean {
  return (
    left.id === right.id &&
    left.subjectId === right.subjectId &&
    left.type === right.type &&
    left.scope === right.scope &&
    left.purpose === right.purpose &&
    left.evaluation === right.evaluation &&
    left.observedAt === right.observedAt &&
    left.expiresAt === right.expiresAt &&
    JSON.stringify(left.consent) === JSON.stringify(right.consent) &&
    JSON.stringify(left.provenance) === JSON.stringify(right.provenance)
  );
}

export function createProviderObservationReplayState(): ProviderObservationReplayState {
  return makeReplayState(Object.freeze({}));
}

/**
 * Pure in-memory replay reducer. Persistence must perform the equivalent key +
 * digest comparison atomically; this function is not a database uniqueness gate.
 */
export function reduceProviderObservationReplay(
  state: ProviderObservationReplayState,
  candidate: ConformedProviderObservation
): ProviderObservationReplayResult {
  if (!REPLAY_STATES.has(state)) {
    const safeState = createProviderObservationReplayState();
    return Object.freeze({
      ok: false,
      state: safeState,
      issues: Object.freeze([Object.freeze({ path: "replayState", code: "untrusted_context" })])
    });
  }
  if (!CONFORMED_OBSERVATIONS.has(candidate)) {
    return Object.freeze({
      ok: false,
      state,
      issues: Object.freeze([Object.freeze({ path: "candidate", code: "unconformed_provider_observation" })])
    });
  }
  const existing = state.byAdapterEventKey[candidate.adapterEventKey];
  if (existing) {
    if (
      existing.evidenceDigest !== candidate.evidenceDigest ||
      existing.operationRef !== candidate.operationRef ||
      existing.trustDomain !== candidate.trustDomain ||
      !sameCanonicalClaim(existing.claim, candidate.claim)
    ) {
      return Object.freeze({
        ok: false,
        state,
        issues: Object.freeze([Object.freeze({ path: "candidate.evidenceDigest", code: "adapter_event_replay_conflict" })])
      });
    }
    return Object.freeze({ ok: true, outcome: "idempotent", state, value: existing });
  }
  const nextState = makeReplayState({ ...state.byAdapterEventKey, [candidate.adapterEventKey]: candidate });
  return Object.freeze({ ok: true, outcome: "accepted", state: nextState, value: candidate });
}

/**
 * Persistence must enforce adapterEventKey uniqueness and recompute/verify the
 * digest from canonical evidence. This layer accepts no raw provider payload.
 */
/**
 * Internal conformance core. Supported application code must reach this only
 * through provider-composition-root; app/routes are source-checked against a
 * direct import. The event itself must carry the port's unforgeable identity.
 */
export function conformPortVerifiedProviderObservation(
  trustedBinding: TrustedProviderClaimBindingSources,
  observation: ProviderVerifiedEvent,
  context: PortProviderObservationContext
): ProviderObservationConformanceResult {
  const issues: ContractIssue[] = [];
  if (!isPortVerifiedProviderEvent(observation)) return Object.freeze({ ok: false, issues: Object.freeze([{ path: "observation", code: "unverified_provider_event" }]) });
  if (!isPlainDataObject(context)) return Object.freeze({ ok: false, issues: Object.freeze([{ path: "context", code: "plain_data_object_required" }]) });
  rejectUnknownKeys(issues, "context", context, ["evidenceRef", "receivedAt"]);
  const providerId = observation.providerId;
  const receivedAt = context.receivedAt;
  if (!VERIFICATION_PROVIDER_IDS.includes(providerId)) return Object.freeze({ ok: false, issues: Object.freeze([{ path: "providerId", code: "unknown_enum" }]) });
  if (!validInstant(receivedAt)) return Object.freeze({ ok: false, issues: Object.freeze([{ path: "receivedAt", code: "invalid_instant" }]) });
  if (!isPlainDataObject(trustedBinding)) issues.push({ path: "binding", code: "trusted_plain_data_object_required" });
  if (!isPlainDataObject(observation)) issues.push({ path: "observation", code: "plain_data_object_required" });
  if (issues.length || !isPlainDataObject(trustedBinding) || !isPlainDataObject(observation)) {
    return Object.freeze({ ok: false, issues: Object.freeze(issues.map((issue) => Object.freeze(issue))) });
  }

  rejectUnknownKeys(issues, "binding", trustedBinding, BINDING_KEYS);
  requireText(issues, "binding.claimId", trustedBinding.claimId);
  requireText(issues, "binding.subjectId", trustedBinding.subjectId);
  requireText(issues, "binding.claimType", trustedBinding.claimType);
  const scopeValid = requireText(issues, "binding.scope", trustedBinding.scope, 500);
  if (scopeValid && FORBIDDEN_SCOPE_VALUES.has((trustedBinding.scope as string).toLowerCase())) issues.push({ path: "binding.scope", code: "unbounded_scope_forbidden" });
  if (!VERIFICATION_PURPOSES.includes(trustedBinding.purpose as VerificationPurpose)) issues.push({ path: "binding.purpose", code: "unknown_enum" });
  const consent = validateConsent(trustedBinding.consent, issues);

  rejectUnknownKeys(issues, "observation", observation, VERIFIED_OBSERVATION_KEYS);
  requireText(issues, "observation.providerEventId", observation.providerEventId);
  requireText(issues, "observation.operationRef", observation.operationRef);
  requireText(issues, "observation.observationKind", observation.observationKind);
  requireText(issues, "observation.providerStatus", observation.providerStatus);
  requireText(issues, "context.evidenceRef", context.evidenceRef);
  if (!PROVIDER_TRUST_DOMAINS.includes(observation.trustDomain as ProviderTrustDomain)) issues.push({ path: "observation.trustDomain", code: "unknown_enum" });
  if (!validInstant(observation.observedAt)) issues.push({ path: "observation.observedAt", code: "invalid_instant" });
  if (validInstant(observation.observedAt) && Date.parse(observation.observedAt) > Date.parse(receivedAt)) issues.push({ path: "observation.observedAt", code: "must_not_follow_received_at" });
  if (typeof observation.evidenceDigest !== "string" || !SHA_256.test(observation.evidenceDigest)) issues.push({ path: "observation.evidenceDigest", code: "sha256_digest_required" });

  const profile = PROVIDER_ADAPTER_PROFILES[providerId];
  const selected = profile.capabilities.find(
    (candidate) => candidate.observationKind === observation.observationKind
  );
  if (!selected) issues.push({ path: "observation.observationKind", code: "unsupported_provider_capability" });
  else {
    if (selected.claimType !== trustedBinding.claimType) issues.push({ path: "binding.claimType", code: "operation_capability_mismatch" });
    if (!selected.purposes.includes(trustedBinding.purpose as VerificationPurpose)) issues.push({ path: "binding.purpose", code: "unsupported_for_provider_capability" });
    if (consent && !selected.consentBases.includes(consent.basis)) issues.push({ path: "binding.consent.basis", code: "unsupported_for_provider_capability" });
    if (!Object.hasOwn(selected.providerStatuses, observation.providerStatus as string)) {
      issues.push({ path: "observation.providerStatus", code: "unsupported_for_provider_capability" });
    }
  }
  if (issues.length || !selected || !consent) return Object.freeze({ ok: false, issues: Object.freeze(issues.map((issue) => Object.freeze(issue))) });

  const observedAt = observation.observedAt as string;
  const claim: VerificationClaim = {
    id: trustedBinding.claimId as string,
    subjectId: trustedBinding.subjectId as string,
    type: selected.claimType,
    scope: trustedBinding.scope as string,
    purpose: trustedBinding.purpose as VerificationPurpose,
    consent,
    provenance: Object.freeze({ sourceKind: profile.sourceKind, sourceId: profile.sourceId, method: selected.method, evidenceRef: context.evidenceRef as string }),
    evaluation: trustDomainEvaluation(
      selected.providerStatuses[observation.providerStatus as string],
      observation.trustDomain as ProviderTrustDomain
    ),
    observedAt,
    expiresAt: new Date(Date.parse(observedAt) + selected.validitySeconds * 1000).toISOString()
  };
  const claimIssues = validateVerificationClaim(claim);
  if (claimIssues.length) return Object.freeze({ ok: false, issues: Object.freeze(claimIssues.map((issue) => Object.freeze(issue))) });

  const value = Object.freeze({
    providerId,
    providerEventId: observation.providerEventId as string,
    operationRef: observation.operationRef as string,
    adapterEventKey: `${providerId}:${observation.trustDomain}:${observation.providerEventId as string}`,
    trustDomain: observation.trustDomain as ProviderTrustDomain,
    evidenceDigest: observation.evidenceDigest as string,
    receivedAt,
    claim: freezeClaim(claim)
  });
  CONFORMED_OBSERVATIONS.add(value);
  return Object.freeze({
    ok: true,
    value
  });
}
