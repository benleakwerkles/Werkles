import {
  VERIFICATION_PURPOSES,
  type VerificationPurpose
} from "./claim-evidence-contract.ts";

export type FundsEvidenceBundleStatus = "open" | "sealed" | "revoked";
export type FundsEvidenceClaimRole = "bankAccountOwnership" | "fundsThreshold";
export type EvidenceTrustClass = "test" | "production";

export interface ReviewedFundsEvidenceScopes {
  reviewDigest: string;
  bankAccountOwnership: string;
  fundsThreshold: string;
}

export interface FundsEvidenceTrustDomain {
  evidenceClass: EvidenceTrustClass;
  key: string;
}

export interface FundsEvidenceClaimMembership {
  role: FundsEvidenceClaimRole;
  claimId: string;
  claimDigest: string;
  claimType: "bank_account_ownership_matched" | "funds_threshold_observed";
  scope: string;
  subjectId: string;
  purpose: VerificationPurpose;
  trustDomain: FundsEvidenceTrustDomain;
}

interface BundleCommandBase {
  bundleId: string;
  commandId: string;
  commandDigest: string;
  expectedVersion: number;
  serverOrder: string;
  occurredAt: string;
}

export type FundsEvidenceBundleCommand =
  | (BundleCommandBase & {
      kind: "create";
      subjectId: string;
      purpose: VerificationPurpose;
      approvedPolicyDigest: string;
      reviewedScopes: ReviewedFundsEvidenceScopes;
      trustDomain: FundsEvidenceTrustDomain;
    })
  | (BundleCommandBase & {
      kind: "attach_claim";
      membership: FundsEvidenceClaimMembership;
    })
  | (BundleCommandBase & { kind: "seal" })
  | (BundleCommandBase & { kind: "revoke"; reason: string });

interface BundleEventBase {
  bundleId: string;
  version: number;
  serverOrder: string;
  occurredAt: string;
  commandId: string;
  commandDigest: string;
}

export type FundsEvidenceBundleEvent =
  | (BundleEventBase & {
      kind: "bundle_created";
      subjectId: string;
      purpose: VerificationPurpose;
      approvedPolicyDigest: string;
      reviewedScopes: ReviewedFundsEvidenceScopes;
      trustDomain: FundsEvidenceTrustDomain;
    })
  | (BundleEventBase & {
      kind: "claim_attached";
      membership: FundsEvidenceClaimMembership;
    })
  | (BundleEventBase & { kind: "bundle_sealed" })
  | (BundleEventBase & { kind: "bundle_revoked"; reason: string });

export interface FundsEvidenceBundleState {
  bundleId: string;
  subjectId: string;
  purpose: VerificationPurpose;
  approvedPolicyDigest: string;
  reviewedScopes: ReviewedFundsEvidenceScopes;
  trustDomain: FundsEvidenceTrustDomain;
  assemblyOrder: string;
  status: FundsEvidenceBundleStatus;
  version: number;
  createdAt: string;
  sealedAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  lastServerOrder: string;
  memberships: Readonly<Partial<Record<FundsEvidenceClaimRole, FundsEvidenceClaimMembership>>>;
}

export interface ApplyBundleCommandResult {
  events: readonly FundsEvidenceBundleEvent[];
  state: FundsEvidenceBundleState;
  appended: boolean;
}

export class FundsEvidenceBundleContractError extends TypeError {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "FundsEvidenceBundleContractError";
  }
}

const KEY = /^[A-Za-z0-9][A-Za-z0-9:._/-]{0,199}$/;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const UINT = /^(?:0|[1-9][0-9]{0,39})$/;
const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function fail(code: string): never {
  throw new FundsEvidenceBundleContractError(code);
}

function requireKey(value: unknown, code: string): asserts value is string {
  if (typeof value !== "string" || value !== value.trim() || !KEY.test(value)) fail(code);
}

function requireText(value: unknown, code: string): asserts value is string {
  if (
    typeof value !== "string" ||
    value !== value.trim() ||
    value.length < 1 ||
    value.length > 500
  ) fail(code);
}

function requireDigest(value: unknown, code: string): asserts value is string {
  if (typeof value !== "string" || !SHA256.test(value)) fail(code);
}

function requireInstant(value: unknown, code: string): asserts value is string {
  if (typeof value !== "string" || !ISO_INSTANT.test(value)) {
    fail(code);
  }
  const parsed = Date.parse(value);
  const normalizedInput = value.includes(".") ? value : value.replace("Z", ".000Z");
  if (Number.isNaN(parsed) || new Date(parsed).toISOString() !== normalizedInput) fail(code);
}

function requireServerOrder(value: unknown, code: string): asserts value is string {
  if (typeof value !== "string" || !UINT.test(value) || BigInt(value) <= BigInt(0)) fail(code);
}

function requireVersion(value: unknown, code: string): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) fail(code);
}

function cloneScopes(scopes: ReviewedFundsEvidenceScopes): ReviewedFundsEvidenceScopes {
  return { ...scopes };
}

function cloneTrustDomain(domain: FundsEvidenceTrustDomain): FundsEvidenceTrustDomain {
  return { ...domain };
}

function cloneMembership(
  membership: FundsEvidenceClaimMembership
): FundsEvidenceClaimMembership {
  return { ...membership, trustDomain: cloneTrustDomain(membership.trustDomain) };
}

function freezeEvent(event: FundsEvidenceBundleEvent): FundsEvidenceBundleEvent {
  if (event.kind === "bundle_created") {
    const frozen = {
      ...event,
      reviewedScopes: Object.freeze(cloneScopes(event.reviewedScopes)),
      trustDomain: Object.freeze(cloneTrustDomain(event.trustDomain))
    };
    return Object.freeze(frozen);
  }
  if (event.kind === "claim_attached") {
    const membership = cloneMembership(event.membership);
    Object.freeze(membership.trustDomain);
    Object.freeze(membership);
    return Object.freeze({ ...event, membership });
  }
  return Object.freeze({ ...event });
}

function freezeState(state: FundsEvidenceBundleState): FundsEvidenceBundleState {
  Object.freeze(state.reviewedScopes);
  Object.freeze(state.trustDomain);
  for (const membership of Object.values(state.memberships)) {
    if (membership) {
      Object.freeze(membership.trustDomain);
      Object.freeze(membership);
    }
  }
  Object.freeze(state.memberships);
  return Object.freeze(state);
}

function validateTrustDomain(domain: FundsEvidenceTrustDomain, prefix: string): void {
  if (!domain || typeof domain !== "object") fail(`${prefix}.required`);
  if (domain.evidenceClass !== "test" && domain.evidenceClass !== "production") {
    fail(`${prefix}.evidence_class`);
  }
  requireKey(domain.key, `${prefix}.key`);
}

function validateScopes(scopes: ReviewedFundsEvidenceScopes): void {
  if (!scopes || typeof scopes !== "object") fail("reviewed_scopes.required");
  requireDigest(scopes.reviewDigest, "reviewed_scopes.digest");
  requireKey(scopes.bankAccountOwnership, "reviewed_scopes.ownership");
  requireKey(scopes.fundsThreshold, "reviewed_scopes.threshold");
  if (scopes.bankAccountOwnership === scopes.fundsThreshold) {
    fail("reviewed_scopes.must_be_distinct");
  }
}

function validateMembership(
  membership: FundsEvidenceClaimMembership,
  state: FundsEvidenceBundleState
): void {
  if (!membership || typeof membership !== "object") fail("membership.required");
  if (membership.role !== "bankAccountOwnership" && membership.role !== "fundsThreshold") {
    fail("membership.role");
  }
  requireKey(membership.claimId, "membership.claim_id");
  requireDigest(membership.claimDigest, "membership.claim_digest");
  requireKey(membership.subjectId, "membership.subject_id");
  requireKey(membership.scope, "membership.scope");
  if (!VERIFICATION_PURPOSES.includes(membership.purpose)) fail("membership.purpose");
  validateTrustDomain(membership.trustDomain, "membership.trust_domain");

  const expectedType = membership.role === "bankAccountOwnership"
    ? "bank_account_ownership_matched"
    : "funds_threshold_observed";
  const expectedScope = membership.role === "bankAccountOwnership"
    ? state.reviewedScopes.bankAccountOwnership
    : state.reviewedScopes.fundsThreshold;
  if (membership.claimType !== expectedType) fail("membership.claim_type_mismatch");
  if (membership.scope !== expectedScope) fail("membership.scope_mismatch");
  if (membership.subjectId !== state.subjectId) fail("membership.subject_mismatch");
  if (membership.purpose !== state.purpose) fail("membership.purpose_mismatch");
  if (
    membership.trustDomain.evidenceClass !== state.trustDomain.evidenceClass ||
    membership.trustDomain.key !== state.trustDomain.key
  ) fail("membership.trust_domain_mismatch");
}

function validateCommonEvent(event: FundsEvidenceBundleEvent, index: number): void {
  requireKey(event.bundleId, `events.${index}.bundle_id`);
  requireVersion(event.version, `events.${index}.version`);
  requireServerOrder(event.serverOrder, `events.${index}.server_order`);
  requireInstant(event.occurredAt, `events.${index}.occurred_at`);
  requireKey(event.commandId, `events.${index}.command_id`);
  requireDigest(event.commandDigest, `events.${index}.command_digest`);
}

function reduceValidatedEvents(
  events: readonly FundsEvidenceBundleEvent[]
): FundsEvidenceBundleState | undefined {
  let state: FundsEvidenceBundleState | undefined;
  const commandIds = new Set<string>();
  let previousOrder = BigInt(0);
  let previousTime = Number.NEGATIVE_INFINITY;

  events.forEach((event, index) => {
    validateCommonEvent(event, index);
    if (event.version !== index + 1) fail(`events.${index}.version_sequence`);
    if (BigInt(event.serverOrder) <= previousOrder) fail(`events.${index}.server_order_sequence`);
    if (Date.parse(event.occurredAt) < previousTime) fail(`events.${index}.time_sequence`);
    if (commandIds.has(event.commandId)) fail(`events.${index}.duplicate_command_id`);
    commandIds.add(event.commandId);
    previousOrder = BigInt(event.serverOrder);
    previousTime = Date.parse(event.occurredAt);

    if (index === 0) {
      if (event.kind !== "bundle_created") fail("events.first_must_create");
      requireKey(event.subjectId, "created.subject_id");
      if (!VERIFICATION_PURPOSES.includes(event.purpose)) fail("created.purpose");
      requireDigest(event.approvedPolicyDigest, "created.approved_policy_digest");
      validateScopes(event.reviewedScopes);
      validateTrustDomain(event.trustDomain, "created.trust_domain");
      state = {
        bundleId: event.bundleId,
        subjectId: event.subjectId,
        purpose: event.purpose,
        approvedPolicyDigest: event.approvedPolicyDigest,
        reviewedScopes: cloneScopes(event.reviewedScopes),
        trustDomain: cloneTrustDomain(event.trustDomain),
        assemblyOrder: event.serverOrder,
        status: "open",
        version: event.version,
        createdAt: event.occurredAt,
        lastServerOrder: event.serverOrder,
        memberships: {}
      };
      return;
    }

    if (!state) fail("events.missing_create");
    if (event.bundleId !== state.bundleId) fail(`events.${index}.bundle_mismatch`);
    if (state.status === "revoked") fail(`events.${index}.after_revocation`);

    if (event.kind === "claim_attached") {
      if (state.status !== "open") fail(`events.${index}.membership_after_seal`);
      validateMembership(event.membership, state);
      if (state.memberships[event.membership.role]) fail(`events.${index}.duplicate_role`);
      if (
        Object.values(state.memberships).some((membership) =>
          membership?.claimId === event.membership.claimId ||
          membership?.claimDigest === event.membership.claimDigest)
      ) fail(`events.${index}.duplicate_claim`);
      state = {
        ...state,
        version: event.version,
        lastServerOrder: event.serverOrder,
        memberships: {
          ...state.memberships,
          [event.membership.role]: cloneMembership(event.membership)
        }
      };
    } else if (event.kind === "bundle_sealed") {
      if (state.status !== "open") fail(`events.${index}.seal_state`);
      if (!state.memberships.bankAccountOwnership || !state.memberships.fundsThreshold) {
        fail(`events.${index}.seal_requires_exact_membership`);
      }
      state = {
        ...state,
        status: "sealed",
        sealedAt: event.occurredAt,
        version: event.version,
        lastServerOrder: event.serverOrder
      };
    } else if (event.kind === "bundle_revoked") {
      requireText(event.reason, `events.${index}.revocation_reason`);
      state = {
        ...state,
        status: "revoked",
        revokedAt: event.occurredAt,
        revocationReason: event.reason,
        version: event.version,
        lastServerOrder: event.serverOrder
      };
    } else {
      fail(`events.${index}.duplicate_create`);
    }
  });

  return state ? freezeState(state) : undefined;
}

export function validateFundsEvidenceBundleEvents(
  events: readonly FundsEvidenceBundleEvent[]
): void {
  if (!Array.isArray(events)) fail("events.must_be_array");
  reduceValidatedEvents(events);
}

export function reconstructFundsEvidenceBundleAt(
  events: readonly FundsEvidenceBundleEvent[],
  evaluatedAt: string
): FundsEvidenceBundleState | undefined {
  requireInstant(evaluatedAt, "evaluated_at");
  validateFundsEvidenceBundleEvents(events);
  return reduceValidatedEvents(
    events.filter((event) => Date.parse(event.occurredAt) <= Date.parse(evaluatedAt))
  );
}

function eventKindForCommand(command: FundsEvidenceBundleCommand): FundsEvidenceBundleEvent["kind"] {
  if (command.kind === "create") return "bundle_created";
  if (command.kind === "attach_claim") return "claim_attached";
  if (command.kind === "seal") return "bundle_sealed";
  return "bundle_revoked";
}

function sameTrustDomain(
  left: FundsEvidenceTrustDomain,
  right: FundsEvidenceTrustDomain
): boolean {
  return left.evidenceClass === right.evidenceClass && left.key === right.key;
}

function commandExactlyMatchesEvent(
  command: FundsEvidenceBundleCommand,
  event: FundsEvidenceBundleEvent
): boolean {
  if (
    event.kind !== eventKindForCommand(command) ||
    event.bundleId !== command.bundleId ||
    event.commandDigest !== command.commandDigest ||
    event.version - 1 !== command.expectedVersion ||
    event.serverOrder !== command.serverOrder ||
    event.occurredAt !== command.occurredAt
  ) return false;

  if (command.kind === "create" && event.kind === "bundle_created") {
    return event.subjectId === command.subjectId &&
      event.purpose === command.purpose &&
      event.approvedPolicyDigest === command.approvedPolicyDigest &&
      event.reviewedScopes.reviewDigest === command.reviewedScopes.reviewDigest &&
      event.reviewedScopes.bankAccountOwnership === command.reviewedScopes.bankAccountOwnership &&
      event.reviewedScopes.fundsThreshold === command.reviewedScopes.fundsThreshold &&
      sameTrustDomain(event.trustDomain, command.trustDomain);
  }
  if (command.kind === "attach_claim" && event.kind === "claim_attached") {
    const left = event.membership;
    const right = command.membership;
    return left.role === right.role &&
      left.claimId === right.claimId &&
      left.claimDigest === right.claimDigest &&
      left.claimType === right.claimType &&
      left.scope === right.scope &&
      left.subjectId === right.subjectId &&
      left.purpose === right.purpose &&
      sameTrustDomain(left.trustDomain, right.trustDomain);
  }
  if (command.kind === "seal" && event.kind === "bundle_sealed") return true;
  return command.kind === "revoke" && event.kind === "bundle_revoked" &&
    command.reason === event.reason;
}

function validateCommandBase(command: FundsEvidenceBundleCommand): void {
  if (!command || typeof command !== "object") fail("command.required");
  if (
    command.kind !== "create" &&
    command.kind !== "attach_claim" &&
    command.kind !== "seal" &&
    command.kind !== "revoke"
  ) fail("command.kind");
  requireKey(command.bundleId, "command.bundle_id");
  requireKey(command.commandId, "command.command_id");
  requireDigest(command.commandDigest, "command.command_digest");
  requireVersion(command.expectedVersion, "command.expected_version");
  requireServerOrder(command.serverOrder, "command.server_order");
  requireInstant(command.occurredAt, "command.occurred_at");
  if (command.kind === "create") {
    requireKey(command.subjectId, "command.subject_id");
    if (!VERIFICATION_PURPOSES.includes(command.purpose)) fail("command.purpose");
    requireDigest(command.approvedPolicyDigest, "command.approved_policy_digest");
    validateScopes(command.reviewedScopes);
    validateTrustDomain(command.trustDomain, "command.trust_domain");
  } else if (command.kind === "attach_claim") {
    if (!command.membership || typeof command.membership !== "object") {
      fail("command.membership");
    }
  } else if (command.kind === "revoke") {
    requireText(command.reason, "command.revocation_reason");
  }
}

function makeEvent(
  command: FundsEvidenceBundleCommand,
  version: number
): FundsEvidenceBundleEvent {
  const base: BundleEventBase = {
    bundleId: command.bundleId,
    version,
    serverOrder: command.serverOrder,
    occurredAt: command.occurredAt,
    commandId: command.commandId,
    commandDigest: command.commandDigest
  };
  if (command.kind === "create") {
    return {
      ...base,
      kind: "bundle_created",
      subjectId: command.subjectId,
      purpose: command.purpose,
      approvedPolicyDigest: command.approvedPolicyDigest,
      reviewedScopes: cloneScopes(command.reviewedScopes),
      trustDomain: cloneTrustDomain(command.trustDomain)
    };
  }
  if (command.kind === "attach_claim") {
    return { ...base, kind: "claim_attached", membership: cloneMembership(command.membership) };
  }
  if (command.kind === "seal") return { ...base, kind: "bundle_sealed" };
  return { ...base, kind: "bundle_revoked", reason: command.reason };
}

export function applyFundsEvidenceBundleCommand(
  existingEvents: readonly FundsEvidenceBundleEvent[],
  command: FundsEvidenceBundleCommand
): ApplyBundleCommandResult {
  if (!Array.isArray(existingEvents)) fail("events.must_be_array");
  validateCommandBase(command);
  validateFundsEvidenceBundleEvents(existingEvents);
  const canonicalEvents = Object.freeze(existingEvents.map(freezeEvent));

  const replay = canonicalEvents.find((event) => event.commandId === command.commandId);
  if (replay) {
    if (!commandExactlyMatchesEvent(command, replay)) fail("command.idempotency_conflict");
    const replayState = reduceValidatedEvents(canonicalEvents);
    if (!replayState) fail("command.replay_without_state");
    return { events: canonicalEvents, state: replayState, appended: false };
  }

  const current = reduceValidatedEvents(canonicalEvents);
  const currentVersion = current?.version ?? 0;
  if (command.expectedVersion !== currentVersion) fail("command.expected_version_conflict");
  if (current && command.bundleId !== current.bundleId) fail("command.bundle_mismatch");
  if (!current && command.kind !== "create") fail("command.create_required");
  if (current && command.kind === "create") fail("command.already_created");
  if (current && BigInt(command.serverOrder) <= BigInt(current.lastServerOrder)) {
    fail("command.server_order_conflict");
  }
  if (current && Date.parse(command.occurredAt) < Date.parse(canonicalEvents.at(-1)!.occurredAt)) {
    fail("command.time_conflict");
  }

  const event = makeEvent(command, currentVersion + 1);
  const events = Object.freeze([...canonicalEvents, freezeEvent(event)]);
  validateFundsEvidenceBundleEvents(events);
  const state = reduceValidatedEvents(events);
  if (!state) fail("command.state_missing");
  return { events, state, appended: true };
}

export function assertUnambiguousAssemblyOrdering(
  states: readonly FundsEvidenceBundleState[]
): void {
  if (!Array.isArray(states)) fail("states.must_be_array");
  const orders = new Set<string>();
  for (const state of states) {
    requireServerOrder(state.assemblyOrder, "state.assembly_order");
    if (orders.has(state.assemblyOrder)) fail("state.ambiguous_assembly_order");
    orders.add(state.assemblyOrder);
  }
}
