import { createHash } from "node:crypto";

import {
  VERIFICATION_CLAIM_TYPES,
  VERIFICATION_PURPOSES,
  type VerificationClaim
} from "./claim-evidence-contract.ts";
import type {
  FundsEvidenceBundleCommand,
  FundsEvidenceClaimMembership
} from "./funds-evidence-bundle.ts";

export const BUNDLE_COMMAND_DIGEST_DOMAIN =
  "werkles:verification:funds-evidence-bundle-command:v1";
export const IMMUTABLE_CLAIM_DIGEST_DOMAIN =
  "werkles:verification:immutable-claim-content:v1";

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type WithoutCommandDigest<T> = T extends unknown ? Omit<T, "commandDigest"> : never;

export type FundsEvidenceBundleCommandDigestContent =
  WithoutCommandDigest<FundsEvidenceBundleCommand>;

export class VerificationDigestContractError extends TypeError {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "VerificationDigestContractError";
  }
}

const ISO_INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const KEY = /^[A-Za-z0-9][A-Za-z0-9:._/-]{0,199}$/;

function fail(code: string): never {
  throw new VerificationDigestContractError(code);
}

function canonicalUnicode(value: string, path: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) fail(`${path}.unicode`);
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      fail(`${path}.unicode`);
    }
  }
  if (value.normalize("NFC") !== value) fail(`${path}.unicode_normalization`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
  ) fail(`${path}.object`);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== "string" || !Object.prototype.propertyIsEnumerable.call(value, key)) {
      fail(`${path}.non_json_key`);
    }
    if (!descriptor || !("value" in descriptor)) fail(`${path}.${key}.accessor`);
    canonicalUnicode(key, `${path}.key`);
  }
  return value as Record<string, unknown>;
}

function exactKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[],
  path: string
): void {
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) fail(`${path}.${key}.required`);
  }
  const allowed = new Set([...required, ...optional]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail(`${path}.${key}.unknown`);
    if (value[key] === undefined) fail(`${path}.${key}.undefined`);
  }
}

function text(value: unknown, path: string): asserts value is string {
  if (
    typeof value !== "string" ||
    value !== value.trim() ||
    value.length < 1 ||
    value.length > 500
  ) fail(`${path}.text`);
}

function key(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string" || value !== value.trim() || !KEY.test(value)) {
    fail(`${path}.key`);
  }
}

function instant(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string" || !ISO_INSTANT.test(value)) fail(`${path}.instant`);
  const parsed = Date.parse(value);
  const normalized = value.includes(".") ? value : value.replace("Z", ".000Z");
  if (Number.isNaN(parsed) || new Date(parsed).toISOString() !== normalized) {
    fail(`${path}.instant`);
  }
}

function digest(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string" || !SHA256.test(value)) fail(`${path}.sha256`);
}

function enumeration(value: unknown, allowed: readonly string[], path: string): void {
  if (typeof value !== "string" || !allowed.includes(value)) fail(`${path}.enum`);
}

function nonnegativeVersion(value: unknown, path: string): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) fail(`${path}.version`);
}

function validateTrustDomain(value: unknown, path: string): void {
  const item = record(value, path);
  exactKeys(item, ["evidenceClass", "key"], [], path);
  enumeration(item.evidenceClass, ["test", "production"], `${path}.evidenceClass`);
  key(item.key, `${path}.key`);
}

function validateScopes(value: unknown, path: string): void {
  const item = record(value, path);
  exactKeys(
    item,
    ["reviewDigest", "bankAccountOwnership", "fundsThreshold"],
    [],
    path
  );
  digest(item.reviewDigest, `${path}.reviewDigest`);
  key(item.bankAccountOwnership, `${path}.bankAccountOwnership`);
  key(item.fundsThreshold, `${path}.fundsThreshold`);
  if (item.bankAccountOwnership === item.fundsThreshold) fail(`${path}.distinct`);
}

function validateMembership(value: unknown, path: string): void {
  const item = record(value, path);
  exactKeys(
    item,
    ["role", "claimId", "claimDigest", "claimType", "scope", "subjectId", "purpose", "trustDomain"],
    [],
    path
  );
  enumeration(item.role, ["bankAccountOwnership", "fundsThreshold"], `${path}.role`);
  key(item.claimId, `${path}.claimId`);
  digest(item.claimDigest, `${path}.claimDigest`);
  const expectedType = item.role === "bankAccountOwnership"
    ? "bank_account_ownership_matched"
    : "funds_threshold_observed";
  if (item.claimType !== expectedType) fail(`${path}.claimType.role_mismatch`);
  key(item.scope, `${path}.scope`);
  key(item.subjectId, `${path}.subjectId`);
  enumeration(item.purpose, VERIFICATION_PURPOSES, `${path}.purpose`);
  validateTrustDomain(item.trustDomain, `${path}.trustDomain`);
}

function validateCommand(value: unknown, withDigest: boolean): void {
  const command = record(value, "command");
  const common = ["kind", "bundleId", "commandId", "expectedVersion", "serverOrder", "occurredAt"];
  if (withDigest) common.push("commandDigest");
  enumeration(command.kind, ["create", "attach_claim", "seal", "revoke"], "command.kind");
  const kindFields: Record<string, readonly string[]> = {
    create: ["subjectId", "purpose", "approvedPolicyDigest", "reviewedScopes", "trustDomain"],
    attach_claim: ["membership"],
    seal: [],
    revoke: ["reason"]
  };
  exactKeys(command, [...common, ...kindFields[command.kind as string]], [], "command");
  key(command.bundleId, "command.bundleId");
  key(command.commandId, "command.commandId");
  if (withDigest) digest(command.commandDigest, "command.commandDigest");
  nonnegativeVersion(command.expectedVersion, "command.expectedVersion");
  if (typeof command.serverOrder !== "string" || !/^[1-9][0-9]{0,39}$/.test(command.serverOrder)) {
    fail("command.serverOrder.uint");
  }
  instant(command.occurredAt, "command.occurredAt");
  if (command.kind === "create") {
    key(command.subjectId, "command.subjectId");
    enumeration(command.purpose, VERIFICATION_PURPOSES, "command.purpose");
    digest(command.approvedPolicyDigest, "command.approvedPolicyDigest");
    validateScopes(command.reviewedScopes, "command.reviewedScopes");
    validateTrustDomain(command.trustDomain, "command.trustDomain");
  } else if (command.kind === "attach_claim") {
    validateMembership(command.membership, "command.membership");
  } else if (command.kind === "revoke") {
    text(command.reason, "command.reason");
  }
}

function validateConsent(value: unknown): void {
  const consent = record(value, "claim.consent");
  enumeration(consent.basis, ["affirmative_consent", "not_required"], "claim.consent.basis");
  if (consent.basis === "affirmative_consent") {
    exactKeys(consent, ["basis", "capturedAt", "version", "evidenceRef"], [], "claim.consent");
    instant(consent.capturedAt, "claim.consent.capturedAt");
    text(consent.version, "claim.consent.version");
    text(consent.evidenceRef, "claim.consent.evidenceRef");
  } else {
    exactKeys(consent, ["basis", "rationale"], [], "claim.consent");
    text(consent.rationale, "claim.consent.rationale");
  }
}

function validateProvenance(value: unknown): void {
  const provenance = record(value, "claim.provenance");
  exactKeys(provenance, ["sourceKind", "sourceId", "method", "evidenceRef"], [], "claim.provenance");
  enumeration(provenance.sourceKind, ["provider", "issuer", "member", "werkles"], "claim.provenance.sourceKind");
  text(provenance.sourceId, "claim.provenance.sourceId");
  text(provenance.method, "claim.provenance.method");
  text(provenance.evidenceRef, "claim.provenance.evidenceRef");
}

function validateDispute(value: unknown): void {
  const dispute = record(value, "claim.dispute");
  enumeration(dispute.status, ["open", "resolved"], "claim.dispute.status");
  if (dispute.status === "open") {
    exactKeys(dispute, ["status", "openedAt", "disputeRef"], [], "claim.dispute");
  } else {
    exactKeys(
      dispute,
      ["status", "openedAt", "disputeRef", "resolvedAt", "resolutionRef", "disposition"],
      [],
      "claim.dispute"
    );
    instant(dispute.resolvedAt, "claim.dispute.resolvedAt");
    text(dispute.resolutionRef, "claim.dispute.resolutionRef");
    enumeration(
      dispute.disposition,
      ["claim_restored", "claim_not_restored"],
      "claim.dispute.disposition"
    );
  }
  instant(dispute.openedAt, "claim.dispute.openedAt");
  text(dispute.disputeRef, "claim.dispute.disputeRef");
}

function validateClaim(value: unknown): void {
  const claim = record(value, "claim");
  exactKeys(
    claim,
    ["id", "subjectId", "type", "scope", "purpose", "consent", "provenance", "evaluation", "observedAt", "expiresAt"],
    ["revokedAt", "revocationReason", "dispute"],
    "claim"
  );
  text(claim.id, "claim.id");
  text(claim.subjectId, "claim.subjectId");
  enumeration(claim.type, VERIFICATION_CLAIM_TYPES, "claim.type");
  text(claim.scope, "claim.scope");
  enumeration(claim.purpose, VERIFICATION_PURPOSES, "claim.purpose");
  validateConsent(claim.consent);
  validateProvenance(claim.provenance);
  enumeration(claim.evaluation, ["pending", "satisfied", "not_satisfied", "inconclusive"], "claim.evaluation");
  instant(claim.observedAt, "claim.observedAt");
  instant(claim.expiresAt, "claim.expiresAt");
  const consent = claim.consent as Record<string, unknown>;
  if (
    consent.basis === "affirmative_consent" &&
    Date.parse(consent.capturedAt as string) > Date.parse(claim.observedAt as string)
  ) fail("claim.consent.capturedAt.order");
  if (Date.parse(claim.expiresAt as string) <= Date.parse(claim.observedAt as string)) {
    fail("claim.expiresAt.order");
  }
  const hasRevokedAt = Object.prototype.hasOwnProperty.call(claim, "revokedAt");
  const hasReason = Object.prototype.hasOwnProperty.call(claim, "revocationReason");
  if (hasRevokedAt !== hasReason) fail("claim.revocation.pair");
  if (hasRevokedAt) {
    instant(claim.revokedAt, "claim.revokedAt");
    text(claim.revocationReason, "claim.revocationReason");
    if (Date.parse(claim.revokedAt as string) < Date.parse(claim.observedAt as string)) {
      fail("claim.revokedAt.order");
    }
  }
  if (Object.prototype.hasOwnProperty.call(claim, "dispute")) {
    validateDispute(claim.dispute);
    const dispute = claim.dispute as Record<string, unknown>;
    if (Date.parse(dispute.openedAt as string) < Date.parse(claim.observedAt as string)) {
      fail("claim.dispute.openedAt.order");
    }
    if (
      dispute.status === "resolved" &&
      Date.parse(dispute.resolvedAt as string) < Date.parse(dispute.openedAt as string)
    ) fail("claim.dispute.resolvedAt.order");
    if (
      hasRevokedAt &&
      Date.parse(dispute.openedAt as string) > Date.parse(claim.revokedAt as string)
    ) fail("claim.dispute.openedAt.after_revocation");
  }
}

export function canonicalizeVerificationDigestValue(value: unknown): string {
  const visit = (item: unknown, path: string): string => {
    if (item === null) return "null";
    if (typeof item === "string") {
      canonicalUnicode(item, path);
      return JSON.stringify(item);
    }
    if (typeof item === "boolean") return JSON.stringify(item);
    if (typeof item === "number") {
      if (!Number.isFinite(item) || Object.is(item, -0) ||
          (Number.isInteger(item) && !Number.isSafeInteger(item))) fail(`${path}.number`);
      return JSON.stringify(item);
    }
    if (Array.isArray(item)) {
      for (const key of Reflect.ownKeys(item)) {
        if (key === "length") continue;
        const descriptor = Object.getOwnPropertyDescriptor(item, key);
        if (
          typeof key !== "string" ||
          !/^(?:0|[1-9][0-9]*)$/.test(key) ||
          Number(key) >= item.length
        ) fail(`${path}.array_property`);
        if (!descriptor || !("value" in descriptor)) fail(`${path}.${key}.accessor`);
      }
      for (let index = 0; index < item.length; index += 1) {
        if (!Object.prototype.hasOwnProperty.call(item, index)) fail(`${path}.${index}.array_hole`);
      }
      return `[${item.map((entry, index) => visit(entry, `${path}.${index}`)).join(",")}]`;
    }
    const object = record(item, path);
    return `{${Object.keys(object).sort().map((key) =>
      `${JSON.stringify(key)}:${visit(object[key], `${path}.${key}`)}`
    ).join(",")}}`;
  };
  return visit(value, "value");
}

function domainDigest(domain: string, content: unknown): string {
  const serialized = canonicalizeVerificationDigestValue(content);
  return `sha256:${createHash("sha256").update(`${domain}\u0000${serialized}`, "utf8").digest("hex")}`;
}

export function computeFundsEvidenceBundleCommandDigest(
  command: FundsEvidenceBundleCommandDigestContent
): string {
  validateCommand(command, false);
  return domainDigest(BUNDLE_COMMAND_DIGEST_DOMAIN, command);
}

export function verifyFundsEvidenceBundleCommandDigest(
  command: FundsEvidenceBundleCommand
): boolean {
  validateCommand(command, true);
  const { commandDigest, ...content } = command;
  return commandDigest === domainDigest(BUNDLE_COMMAND_DIGEST_DOMAIN, content);
}

export function computeImmutableVerificationClaimDigest(
  claim: VerificationClaim
): string {
  validateClaim(claim);
  return domainDigest(IMMUTABLE_CLAIM_DIGEST_DOMAIN, claim);
}

export function verifyImmutableVerificationClaimDigest(
  claim: VerificationClaim,
  expectedDigest: string
): boolean {
  digest(expectedDigest, "expectedDigest");
  return computeImmutableVerificationClaimDigest(claim) === expectedDigest;
}

export function membershipMatchesImmutableClaim(
  membership: FundsEvidenceClaimMembership,
  claim: VerificationClaim
): boolean {
  validateMembership(membership, "membership");
  validateClaim(claim);
  return membership.claimId === claim.id &&
    membership.claimDigest === computeImmutableVerificationClaimDigest(claim) &&
    membership.claimType === claim.type &&
    membership.scope === claim.scope &&
    membership.subjectId === claim.subjectId &&
    membership.purpose === claim.purpose;
}
