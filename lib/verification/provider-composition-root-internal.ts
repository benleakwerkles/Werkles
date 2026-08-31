import "server-only";

import {
  EXTERNAL_VERIFICATION_PROVIDER_IDS,
  PROVIDER_PORT_PROFILES,
  createVerificationProviderRegistry,
  isPortVerifiedProviderEvent,
  type ProviderBeginResult,
  type ExternalVerificationProviderId,
  type ProviderConsumeInput,
  type ProviderTrustDomain,
  type ProviderVerifiedEvent,
  type VerificationProviderAdapterPort
} from "./provider-adapter-port.ts";
import {
  PROVIDER_ADAPTER_PROFILES,
  conformPortVerifiedProviderObservation,
  type ConformedProviderObservation,
  type TrustedProviderClaimBindingSources
} from "./provider-adapter-conformance.ts";

export type ProviderConsumeMaterial =
  | Readonly<{ kind: "webhook"; rawBody: Uint8Array; headers: Readonly<Record<string, string>> }>
  | Readonly<{ kind: "challenge_response"; operationRef: string; code: string }>
  | Readonly<{ kind: "client_handoff"; operationRef: string; transientToken: string }>;

export type ProviderLifecycleAction = "begin" | "revoke";
export type ProviderRevokeReason = "member_requested" | "authorization_withdrawn" | "operation_replaced";

export type ProviderLifecycleRequest = Readonly<{
  operationId: string;
  authorizationId: string;
}>;

export type ProviderRevokeRequest = ProviderLifecycleRequest & Readonly<{
  reason: ProviderRevokeReason;
}>;

export type ResolvedProviderLifecycleOperation = Readonly<{
  operationId: string;
  operationRef: string;
  ownerSubjectId: string;
  providerId: ExternalVerificationProviderId;
  trustDomain: ProviderTrustDomain;
  capability: string;
  subjectRef: string;
  returnUrl: string | null;
  deliveryTargetRef: string | null;
}>;

export type ResolvedProviderLifecycleActor = Readonly<{
  principalId: string;
}>;

export type ResolvedProviderLifecycleAuthorization = Readonly<{
  authorizationId: string;
  operationId: string;
  ownerSubjectId: string;
  actorPrincipalId: string;
  providerId: ExternalVerificationProviderId;
  trustDomain: ProviderTrustDomain;
  capability: string;
  action: ProviderLifecycleAction;
  status: "active";
}>;

export type ResolvedVerifiedDeliveryTarget = Readonly<{
  targetRef: string;
  ownerSubjectId: string;
  deliveryTarget: string;
}>;

export type LifecycleLeaseResult =
  | Readonly<{ state: "acquired"; leaseId: string }>
  | Readonly<{ state: "unavailable" }>;

export type LifecycleLeaseOutcome = Readonly<{
  leaseId: string;
  operationId: string;
  action: ProviderLifecycleAction;
  outcome: "provider_acknowledged" | "provider_rejected";
  providerState: string | null;
  providerOperationRef: string | null;
}>;

export type ProviderLifecycleFailure = Readonly<{
  ok: false;
  code: "invalid_request" | "operation_not_found" | "not_authorized" | "operation_mismatch" | "unsupported_capability" | "action_not_available" | "provider_rejected" | "action_outcome_unrecorded";
}>;

export type ProviderCompositionBeginResult =
  | Readonly<{ ok: true; providerId: ExternalVerificationProviderId; operationId: string; kind: "hosted_redirect"; url: string; expiresAt?: string }>
  | Readonly<{ ok: true; providerId: ExternalVerificationProviderId; operationId: string; kind: "embedded_link"; clientToken: string; expiresAt?: string }>
  | Readonly<{ ok: true; providerId: ExternalVerificationProviderId; operationId: string; kind: "challenge_code"; maskedDestination: string; expiresAt: string }>
  | Readonly<{ ok: true; providerId: ExternalVerificationProviderId; operationId: string; kind: "hosted_invitation"; deliveryState: "queued" | "sent" }>
  | ProviderLifecycleFailure;

export type ProviderCompositionRevokeResult =
  | Readonly<{
      ok: true;
      kind: "provider_operation_revoke_acknowledgement";
      providerId: ExternalVerificationProviderId;
      operationId: string;
      providerOperationState: "revoked" | "already_revoked";
      claimState: "not_changed";
      evidenceState: "not_changed";
      providerDataDeletion: "not_asserted";
    }>
  | ProviderLifecycleFailure;

export type ResolvedProviderOperation = TrustedProviderClaimBindingSources & Readonly<{
  operationId: string;
  operationRef: string;
  providerId: ExternalVerificationProviderId;
  trustDomain: ProviderTrustDomain;
}>;

export type ProviderCompositionConsumeResult =
  | Readonly<{ ok: true; kind: "operation_progress"; operationId: string; state: "pending" | "connected" | "requires_input" | "cancelled" }>
  | Readonly<{ ok: true; kind: "conformed_observation"; value: ConformedProviderObservation }>
  | Readonly<{ ok: false; code: "provider_rejected" | "operation_not_found" | "operation_mismatch" | "evidence_unavailable" | "conformance_rejected" }>;

export type VerificationProviderCompositionRoot = Readonly<{
  version: "v1";
  trustDomain: ProviderTrustDomain;
  begin(request: ProviderLifecycleRequest): Promise<ProviderCompositionBeginResult>;
  consume(providerId: ExternalVerificationProviderId, material: ProviderConsumeMaterial): Promise<ProviderCompositionConsumeResult>;
  revoke(request: ProviderRevokeRequest): Promise<ProviderCompositionRevokeResult>;
}>;

export type VerificationProviderCompositionDependencies = Readonly<{
  adapters: readonly VerificationProviderAdapterPort[];
  resolveOperation(context: Readonly<{ operationRef: string; providerId: ExternalVerificationProviderId; trustDomain: ProviderTrustDomain }>): Promise<ResolvedProviderOperation | null>;
  resolveEvidenceRef(event: Readonly<{ providerId: ExternalVerificationProviderId; operationRef: string; providerEventId: string; evidenceDigest: string }>): Promise<string | null>;
  resolveLifecycleOperation(context: Readonly<{ operationId: string; action: ProviderLifecycleAction }>): Promise<ResolvedProviderLifecycleOperation | null>;
  resolveLifecycleAuthorization(context: Readonly<{ authorizationId: string; operationId: string; action: ProviderLifecycleAction }>): Promise<ResolvedProviderLifecycleAuthorization | null>;
  resolveLifecycleActor(): Promise<ResolvedProviderLifecycleActor | null>;
  resolveVerifiedDeliveryTarget(context: Readonly<{ targetRef: string; ownerSubjectId: string; providerId: ExternalVerificationProviderId }>): Promise<ResolvedVerifiedDeliveryTarget | null>;
  acquireLifecycleLease(context: Readonly<{
    operationId: string;
    authorizationId: string;
    actorPrincipalId: string;
    providerId: ExternalVerificationProviderId;
    trustDomain: ProviderTrustDomain;
    capability: string;
    action: ProviderLifecycleAction;
    reason: ProviderRevokeReason | null;
  }>): Promise<LifecycleLeaseResult>;
  finalizeLifecycleLease(outcome: LifecycleLeaseOutcome): Promise<Readonly<{ state: "recorded" }>>;
  now(): string;
}>;

const DEPENDENCY_KEYS = Object.freeze([
  "adapters",
  "resolveOperation",
  "resolveEvidenceRef",
  "resolveLifecycleOperation",
  "resolveLifecycleAuthorization",
  "resolveLifecycleActor",
  "resolveVerifiedDeliveryTarget",
  "acquireLifecycleLease",
  "finalizeLifecycleLease",
  "now"
]);
const FAILURE = Object.freeze({
  provider_rejected: Object.freeze({ ok: false as const, code: "provider_rejected" as const }),
  operation_not_found: Object.freeze({ ok: false as const, code: "operation_not_found" as const }),
  operation_mismatch: Object.freeze({ ok: false as const, code: "operation_mismatch" as const }),
  evidence_unavailable: Object.freeze({ ok: false as const, code: "evidence_unavailable" as const }),
  conformance_rejected: Object.freeze({ ok: false as const, code: "conformance_rejected" as const }),
  invalid_request: Object.freeze({ ok: false as const, code: "invalid_request" as const }),
  not_authorized: Object.freeze({ ok: false as const, code: "not_authorized" as const }),
  action_not_available: Object.freeze({ ok: false as const, code: "action_not_available" as const }),
  action_outcome_unrecorded: Object.freeze({ ok: false as const, code: "action_outcome_unrecorded" as const }),
  unsupported_capability: Object.freeze({ ok: false as const, code: "unsupported_capability" as const })
});

function isPlainDataObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return false;
  return Object.values(Object.getOwnPropertyDescriptors(value)).every((item) => !item.get && !item.set);
}

function hasExactKeys(value: unknown, allowed: readonly string[]): value is Record<string, unknown> {
  if (!isPlainDataObject(value)) return false;
  const actual = Reflect.ownKeys(value);
  return actual.length === allowed.length && actual.every((key) => typeof key === "string" && allowed.includes(key));
}

function canonicalInstant(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function validText(value: unknown, maximum = 512): value is string {
  return typeof value === "string" && Boolean(value) && value === value.trim() && value.length <= maximum && !/[\u0000-\u001f\u007f]/.test(value);
}

function validLifecycleRequest(value: unknown, revoke = false): value is ProviderLifecycleRequest | ProviderRevokeRequest {
  const keys = revoke ? ["operationId", "authorizationId", "reason"] : ["operationId", "authorizationId"];
  if (!hasExactKeys(value, keys) || !validText(value.operationId) || !validText(value.authorizationId)) return false;
  return !revoke || ["member_requested", "authorization_withdrawn", "operation_replaced"].includes(value.reason as string);
}

function lifecycleOperationCopy(value: ResolvedProviderLifecycleOperation): ResolvedProviderLifecycleOperation | null {
  const keys = ["operationId", "operationRef", "ownerSubjectId", "providerId", "trustDomain", "capability", "subjectRef", "returnUrl", "deliveryTargetRef"];
  if (!hasExactKeys(value, keys)) return null;
  for (const field of ["operationId", "operationRef", "ownerSubjectId", "capability", "subjectRef"] as const) {
    if (!validText(value[field])) return null;
  }
  if (!EXTERNAL_VERIFICATION_PROVIDER_IDS.includes(value.providerId) || !["test", "production"].includes(value.trustDomain)) return null;
  if (value.returnUrl !== null && !validText(value.returnUrl, 2048)) return null;
  if (value.deliveryTargetRef !== null && !validText(value.deliveryTargetRef, 512)) return null;
  return Object.freeze({ ...value });
}

function lifecycleAuthorizationCopy(value: ResolvedProviderLifecycleAuthorization): ResolvedProviderLifecycleAuthorization | null {
  const keys = ["authorizationId", "operationId", "ownerSubjectId", "actorPrincipalId", "providerId", "trustDomain", "capability", "action", "status"];
  if (!hasExactKeys(value, keys)) return null;
  for (const field of ["authorizationId", "operationId", "ownerSubjectId", "actorPrincipalId", "capability"] as const) {
    if (!validText(value[field])) return null;
  }
  if (!EXTERNAL_VERIFICATION_PROVIDER_IDS.includes(value.providerId) || !["test", "production"].includes(value.trustDomain)) return null;
  if (!["begin", "revoke"].includes(value.action) || value.status !== "active") return null;
  return Object.freeze({ ...value });
}

function capabilityIsSupported(operation: ResolvedProviderLifecycleOperation): boolean {
  return PROVIDER_ADAPTER_PROFILES[operation.providerId].capabilities.some(
    (candidate) => candidate.observationKind === operation.capability
  );
}

function lifecycleRecordsAgree(
  operation: ResolvedProviderLifecycleOperation,
  authorization: ResolvedProviderLifecycleAuthorization,
  actor: ResolvedProviderLifecycleActor,
  action: ProviderLifecycleAction,
  configuredTrustDomain: ProviderTrustDomain
): boolean {
  return authorization.action === action &&
    authorization.actorPrincipalId === actor.principalId &&
    operation.operationId === authorization.operationId &&
    operation.ownerSubjectId === authorization.ownerSubjectId &&
    operation.providerId === authorization.providerId &&
    operation.trustDomain === authorization.trustDomain &&
    operation.trustDomain === configuredTrustDomain &&
    operation.capability === authorization.capability;
}

function validInternalReturnUrl(value: string, trustDomain: ProviderTrustDomain): boolean {
  let parsed: URL;
  try { parsed = new URL(value); } catch { return false; }
  if (parsed.username || parsed.password || parsed.hash) return false;
  if (trustDomain === "production") return parsed.protocol === "https:" && parsed.origin === "https://werkles.com";
  const local = parsed.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  return local || (parsed.protocol === "https:" && parsed.origin === "https://werkles.test");
}

function validProviderRedirect(providerId: ExternalVerificationProviderId, trustDomain: ProviderTrustDomain, value: string): boolean {
  if (providerId !== "stripe_identity") return false;
  let parsed: URL;
  try { parsed = new URL(value); } catch { return false; }
  if (parsed.username || parsed.password || parsed.hash) return false;
  const expectedOrigin = trustDomain === "production" ? "https://verify.stripe.com" : "https://provider.invalid";
  return parsed.origin === expectedOrigin;
}

function sanitizedBeginResult(
  operation: ResolvedProviderLifecycleOperation,
  result: ProviderBeginResult
): ProviderCompositionBeginResult {
  const common = { ok: true as const, providerId: operation.providerId, operationId: operation.operationId };
  if (result.kind === "hosted_redirect") return Object.freeze({ ...common, kind: result.kind, url: result.url, ...(result.expiresAt ? { expiresAt: result.expiresAt } : {}) });
  if (result.kind === "embedded_link") return Object.freeze({ ...common, kind: result.kind, clientToken: result.clientToken, ...(result.expiresAt ? { expiresAt: result.expiresAt } : {}) });
  if (result.kind === "challenge_code") return Object.freeze({ ...common, kind: result.kind, maskedDestination: result.maskedDestination, expiresAt: result.expiresAt });
  return Object.freeze({ ...common, kind: result.kind, deliveryState: result.deliveryState });
}

function isActuallyMasked(masked: string, target: string): boolean {
  const foldedMasked = masked.toLocaleLowerCase();
  const foldedTarget = target.toLocaleLowerCase();
  return /[*•…]/.test(masked) && foldedMasked !== foldedTarget && !foldedMasked.includes(foldedTarget);
}

function trustedOperationCopy(value: ResolvedProviderOperation): ResolvedProviderOperation | null {
  const keys = ["operationId", "operationRef", "providerId", "trustDomain", "claimId", "subjectId", "claimType", "purpose", "scope", "consent"];
  if (!hasExactKeys(value, keys) || !isPlainDataObject(value.consent)) return null;
  for (const field of ["operationId", "operationRef", "claimId", "subjectId", "scope"] as const) {
    if (!validText(value[field])) return null;
  }
  return Object.freeze({
    operationId: value.operationId,
    operationRef: value.operationRef,
    providerId: value.providerId,
    trustDomain: value.trustDomain,
    claimId: value.claimId,
    subjectId: value.subjectId,
    claimType: value.claimType,
    purpose: value.purpose,
    scope: value.scope,
    consent: Object.freeze({ ...value.consent })
  }) as ResolvedProviderOperation;
}

function withReceivedAt(material: ProviderConsumeMaterial, receivedAt: string): ProviderConsumeInput {
  if (!isPlainDataObject(material)) throw new TypeError("Provider consume material is invalid");
  if (material.kind === "webhook" && hasExactKeys(material, ["kind", "rawBody", "headers"])) {
    return { kind: "webhook", rawBody: material.rawBody, headers: material.headers, receivedAt };
  }
  if (material.kind === "challenge_response" && hasExactKeys(material, ["kind", "operationRef", "code"])) {
    return { ...material, receivedAt };
  }
  if (material.kind === "client_handoff" && hasExactKeys(material, ["kind", "operationRef", "transientToken"])) {
    return { ...material, receivedAt };
  }
  throw new TypeError("Provider consume material is invalid");
}

export function composeVerificationProviderRoot(dependencies: VerificationProviderCompositionDependencies): VerificationProviderCompositionRoot {
  if (!hasExactKeys(dependencies, DEPENDENCY_KEYS) || !Array.isArray(dependencies.adapters)) {
    throw new TypeError("Verification provider composition dependencies are invalid");
  }
  if (
    typeof dependencies.resolveOperation !== "function" ||
    typeof dependencies.resolveEvidenceRef !== "function" ||
    typeof dependencies.resolveLifecycleOperation !== "function" ||
    typeof dependencies.resolveLifecycleAuthorization !== "function" ||
    typeof dependencies.resolveLifecycleActor !== "function" ||
    typeof dependencies.resolveVerifiedDeliveryTarget !== "function" ||
    typeof dependencies.acquireLifecycleLease !== "function" ||
    typeof dependencies.finalizeLifecycleLease !== "function" ||
    typeof dependencies.now !== "function"
  ) {
    throw new TypeError("Verification provider composition dependencies are invalid");
  }

  const registry = createVerificationProviderRegistry(dependencies.adapters);
  if (registry.size !== EXTERNAL_VERIFICATION_PROVIDER_IDS.length || EXTERNAL_VERIFICATION_PROVIDER_IDS.some((id) => !registry.has(id))) {
    throw new TypeError(`Verification provider composition requires exactly: ${EXTERNAL_VERIFICATION_PROVIDER_IDS.join(", ")}`);
  }
  const trustDomains = new Set(EXTERNAL_VERIFICATION_PROVIDER_IDS.map((id) => registry.get(id)?.trustDomain));
  if (trustDomains.size !== 1 || trustDomains.has(undefined)) throw new TypeError("Verification provider composition cannot mix trust domains");
  const trustDomain = registry.get("stripe_identity")?.trustDomain;
  if (!trustDomain) throw new TypeError("Verification provider composition trust domain is missing");
  const configuredTrustDomain: ProviderTrustDomain = trustDomain;

  const adapters = Object.freeze(Object.fromEntries(EXTERNAL_VERIFICATION_PROVIDER_IDS.map((id) => [id, registry.get(id)]))) as Readonly<Record<ExternalVerificationProviderId, VerificationProviderAdapterPort>>;
  const resolveOperation = dependencies.resolveOperation.bind(dependencies);
  const resolveEvidenceRef = dependencies.resolveEvidenceRef.bind(dependencies);
  const resolveLifecycleOperation = dependencies.resolveLifecycleOperation.bind(dependencies);
  const resolveLifecycleAuthorization = dependencies.resolveLifecycleAuthorization.bind(dependencies);
  const resolveLifecycleActor = dependencies.resolveLifecycleActor.bind(dependencies);
  const resolveVerifiedDeliveryTarget = dependencies.resolveVerifiedDeliveryTarget.bind(dependencies);
  const acquireLifecycleLease = dependencies.acquireLifecycleLease.bind(dependencies);
  const finalizeLifecycleLease = dependencies.finalizeLifecycleLease.bind(dependencies);
  const now = dependencies.now.bind(dependencies);

  async function resolveLifecycleRecords(
    request: ProviderLifecycleRequest,
    action: ProviderLifecycleAction
  ): Promise<
    | Readonly<{ ok: true; operation: ResolvedProviderLifecycleOperation; authorization: ResolvedProviderLifecycleAuthorization; actor: ResolvedProviderLifecycleActor }>
    | ProviderLifecycleFailure
  > {
    let rawOperation: ResolvedProviderLifecycleOperation | null;
    let rawAuthorization: ResolvedProviderLifecycleAuthorization | null;
    let rawActor: ResolvedProviderLifecycleActor | null;
    try {
      [rawOperation, rawAuthorization, rawActor] = await Promise.all([
        resolveLifecycleOperation({ operationId: request.operationId, action }),
        resolveLifecycleAuthorization({ authorizationId: request.authorizationId, operationId: request.operationId, action }),
        resolveLifecycleActor()
      ]);
    } catch {
      return FAILURE.not_authorized;
    }
    const operation = rawOperation ? lifecycleOperationCopy(rawOperation) : null;
    if (!operation) return FAILURE.operation_not_found;
    const authorization = rawAuthorization ? lifecycleAuthorizationCopy(rawAuthorization) : null;
    if (!authorization) return FAILURE.not_authorized;
    const actor = rawActor && hasExactKeys(rawActor, ["principalId"]) && validText(rawActor.principalId)
      ? Object.freeze({ principalId: rawActor.principalId })
      : null;
    if (!actor) return FAILURE.not_authorized;
    if (!lifecycleRecordsAgree(operation, authorization, actor, action, configuredTrustDomain)) return FAILURE.operation_mismatch;
    if (!capabilityIsSupported(operation)) return FAILURE.unsupported_capability;
    if (PROVIDER_PORT_PROFILES[operation.providerId].interaction !== adapters[operation.providerId].interaction) {
      return FAILURE.operation_mismatch;
    }
    return Object.freeze({ ok: true as const, operation, authorization, actor });
  }

  async function acquireActionLease(
    resolved: Readonly<{ operation: ResolvedProviderLifecycleOperation; authorization: ResolvedProviderLifecycleAuthorization; actor: ResolvedProviderLifecycleActor }>,
    action: ProviderLifecycleAction,
    reason: ProviderRevokeReason | null
  ): Promise<string | null> {
    try {
      const lease = await acquireLifecycleLease(Object.freeze({
        operationId: resolved.operation.operationId,
        authorizationId: resolved.authorization.authorizationId,
        actorPrincipalId: resolved.actor.principalId,
        providerId: resolved.operation.providerId,
        trustDomain: resolved.operation.trustDomain,
        capability: resolved.operation.capability,
        action,
        reason
      }));
      if (!hasExactKeys(lease, lease?.state === "acquired" ? ["state", "leaseId"] : ["state"])) return null;
      return lease.state === "acquired" && validText(lease.leaseId) ? lease.leaseId : null;
    } catch {
      return null;
    }
  }

  async function recordActionOutcome(
    leaseId: string,
    operationId: string,
    action: ProviderLifecycleAction,
    outcome: "provider_acknowledged" | "provider_rejected",
    providerState: string | null,
    providerOperationRef: string | null
  ): Promise<boolean> {
    try {
      const recorded = await finalizeLifecycleLease(Object.freeze({
        leaseId,
        operationId,
        action,
        outcome,
        providerState,
        providerOperationRef
      }));
      return hasExactKeys(recorded, ["state"]) && recorded.state === "recorded";
    } catch {
      return false;
    }
  }

  async function resolveDeliveryTarget(operation: ResolvedProviderLifecycleOperation): Promise<string | null | false> {
    if (operation.deliveryTargetRef === null) return null;
    try {
      const target = await resolveVerifiedDeliveryTarget({
        targetRef: operation.deliveryTargetRef,
        ownerSubjectId: operation.ownerSubjectId,
        providerId: operation.providerId
      });
      if (!target || !hasExactKeys(target, ["targetRef", "ownerSubjectId", "deliveryTarget"])) return false;
      if (
        target.targetRef !== operation.deliveryTargetRef ||
        target.ownerSubjectId !== operation.ownerSubjectId ||
        !validText(target.deliveryTarget, 512)
      ) return false;
      return target.deliveryTarget;
    } catch {
      return false;
    }
  }

  async function resolveTrustedOperation(
    providerId: ExternalVerificationProviderId,
    operationRef: string
  ): Promise<ResolvedProviderOperation | null> {
    try {
      const resolved = await resolveOperation({ operationRef, providerId, trustDomain: configuredTrustDomain });
      const operation = resolved ? trustedOperationCopy(resolved) : null;
      if (!operation) return null;
      if (
        operation.operationRef !== operationRef ||
        operation.providerId !== providerId ||
        operation.trustDomain !== configuredTrustDomain
      ) return null;
      return operation;
    } catch {
      return null;
    }
  }

  return Object.freeze({
    version: "v1" as const,
    trustDomain: configuredTrustDomain,
    async begin(request: ProviderLifecycleRequest) {
      if (!validLifecycleRequest(request)) return FAILURE.invalid_request;
      const resolved = await resolveLifecycleRecords(request, "begin");
      if (!resolved.ok) return resolved;
      const { operation } = resolved;
      const interaction = PROVIDER_PORT_PROFILES[operation.providerId].interaction;
      if (operation.returnUrl !== null && !validInternalReturnUrl(operation.returnUrl, operation.trustDomain)) return FAILURE.operation_mismatch;
      if (!["hosted_redirect", "embedded_link"].includes(interaction) && operation.returnUrl !== null) return FAILURE.operation_mismatch;
      const deliveryTarget = await resolveDeliveryTarget(operation);
      if (deliveryTarget === false) return FAILURE.not_authorized;
      if (["challenge_code", "hosted_invitation"].includes(interaction) && deliveryTarget === null) return FAILURE.not_authorized;
      if (!["challenge_code", "hosted_invitation"].includes(interaction) && deliveryTarget !== null) return FAILURE.operation_mismatch;
      const leaseId = await acquireActionLease(resolved, "begin", null);
      if (!leaseId) return FAILURE.action_not_available;
      try {
        const result = await adapters[operation.providerId].begin(Object.freeze({
          operationRef: operation.operationRef,
          subjectRef: operation.subjectRef,
          ...(operation.returnUrl !== null ? { returnUrl: operation.returnUrl } : {}),
          ...(deliveryTarget !== null ? { deliveryTarget } : {})
        }));
        if (result.kind === "hosted_redirect" && !validProviderRedirect(operation.providerId, operation.trustDomain, result.url)) {
          if (!await recordActionOutcome(leaseId, operation.operationId, "begin", "provider_rejected", null, null)) {
            return FAILURE.action_outcome_unrecorded;
          }
          return FAILURE.provider_rejected;
        }
        if (result.kind === "challenge_code" && (deliveryTarget === null || !isActuallyMasked(result.maskedDestination, deliveryTarget))) {
          if (!await recordActionOutcome(leaseId, operation.operationId, "begin", "provider_rejected", null, null)) {
            return FAILURE.action_outcome_unrecorded;
          }
          return FAILURE.provider_rejected;
        }
        if (!await recordActionOutcome(
          leaseId,
          operation.operationId,
          "begin",
          "provider_acknowledged",
          result.kind,
          result.providerOperationRef ?? null
        )) {
          return FAILURE.action_outcome_unrecorded;
        }
        return sanitizedBeginResult(operation, result);
      } catch {
        if (!await recordActionOutcome(leaseId, operation.operationId, "begin", "provider_rejected", null, null)) {
          return FAILURE.action_outcome_unrecorded;
        }
        return FAILURE.provider_rejected;
      }
    },
    async consume(providerId: ExternalVerificationProviderId, material: ProviderConsumeMaterial) {
      if (!EXTERNAL_VERIFICATION_PROVIDER_IDS.includes(providerId)) return FAILURE.provider_rejected;
      let receivedAt: string;
      let normalized;
      try {
        receivedAt = now();
        if (!canonicalInstant(receivedAt)) return FAILURE.provider_rejected;
        normalized = await adapters[providerId].verifyAndNormalize(withReceivedAt(material, receivedAt));
      } catch {
        return FAILURE.provider_rejected;
      }
      if (normalized.kind === "operation_progress") {
        const progressOperation = await resolveTrustedOperation(providerId, normalized.operationRef);
        if (!progressOperation) return FAILURE.operation_not_found;
        return Object.freeze({
          ok: true as const,
          kind: "operation_progress" as const,
          operationId: progressOperation.operationId,
          state: normalized.state
        });
      }
      const event: ProviderVerifiedEvent = normalized.event;
      if (!isPortVerifiedProviderEvent(event)) return FAILURE.provider_rejected;

      const operation = await resolveTrustedOperation(providerId, event.operationRef);
      if (!operation) return FAILURE.operation_not_found;
      if (operation.operationRef !== event.operationRef || operation.providerId !== providerId || operation.trustDomain !== configuredTrustDomain || event.providerId !== providerId || event.trustDomain !== configuredTrustDomain) {
        return FAILURE.operation_mismatch;
      }

      let evidenceRef: string | null;
      try {
        evidenceRef = await resolveEvidenceRef({ providerId, operationRef: event.operationRef, providerEventId: event.providerEventId, evidenceDigest: event.evidenceDigest });
      } catch {
        return FAILURE.evidence_unavailable;
      }
      if (typeof evidenceRef !== "string" || !evidenceRef.trim() || evidenceRef !== evidenceRef.trim()) return FAILURE.evidence_unavailable;

      const binding: TrustedProviderClaimBindingSources = Object.freeze({
        claimId: operation.claimId,
        subjectId: operation.subjectId,
        claimType: operation.claimType,
        purpose: operation.purpose,
        scope: operation.scope,
        consent: operation.consent
      });
      const conformed = conformPortVerifiedProviderObservation(binding, event, { evidenceRef, receivedAt });
      if (!conformed.ok) return FAILURE.conformance_rejected;
      return Object.freeze({ ok: true as const, kind: "conformed_observation" as const, value: conformed.value });
    },
    async revoke(request: ProviderRevokeRequest) {
      if (!validLifecycleRequest(request, true)) return FAILURE.invalid_request;
      const resolved = await resolveLifecycleRecords(request, "revoke");
      if (!resolved.ok) return resolved;
      const { operation } = resolved;
      const leaseId = await acquireActionLease(resolved, "revoke", request.reason);
      if (!leaseId) return FAILURE.action_not_available;
      try {
        const result = await adapters[operation.providerId].revoke(operation.operationRef);
        if (!await recordActionOutcome(leaseId, operation.operationId, "revoke", "provider_acknowledged", result.state, null)) {
          return FAILURE.action_outcome_unrecorded;
        }
        return Object.freeze({
          ok: true as const,
          kind: "provider_operation_revoke_acknowledgement" as const,
          providerId: operation.providerId,
          operationId: operation.operationId,
          providerOperationState: result.state,
          claimState: "not_changed" as const,
          evidenceState: "not_changed" as const,
          providerDataDeletion: "not_asserted" as const
        });
      } catch {
        if (!await recordActionOutcome(leaseId, operation.operationId, "revoke", "provider_rejected", null, null)) {
          return FAILURE.action_outcome_unrecorded;
        }
        return FAILURE.provider_rejected;
      }
    }
  });
}
