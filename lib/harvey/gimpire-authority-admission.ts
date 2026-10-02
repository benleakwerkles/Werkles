import { createHash, createPublicKey, verify } from "node:crypto";

const SHA256 = /^[a-f0-9]{64}$/;
const ID = /^[a-z0-9][a-z0-9-]{2,127}$/;
const OPERATOR = "Ben@Operator";

export const GIMPIRE_TRUE_GATE_KINDS = Object.freeze([
  "AUTHORITY_EXPANSION",
  "SECRET_CREDENTIAL",
  "SPEND",
  "IRREVERSIBLE_EXTERNAL_COMMITMENT",
  "DEPLOY_PUBLICATION",
  "NEW_RECURRENCE"
] as const);

export type GimpireTrueGateKind = typeof GIMPIRE_TRUE_GATE_KINDS[number];

export const GIMPIRE_AUTHORIZED_ACTION_CLASSES = Object.freeze([
  "READ_INSPECT",
  "LOCAL_SOURCE_EDIT",
  "LOCAL_TEST",
  "LOCAL_CHECKPOINT",
  "CREW_REVIEW"
] as const);

export type GimpireAuthorizedActionClass = typeof GIMPIRE_AUTHORIZED_ACTION_CLASSES[number];

type WorkObject = {
  schema: "werkles.gimpire-authority-work-object/v1";
  project_id: string;
  work_object_id: string;
  lane_id: string;
  objective: string;
  objective_sha256: string;
};

type Authority = {
  schema: "werkles.gimpire-active-authority/v1";
  authority_id: string;
  operator_id: "Ben@Operator";
  project_id: string;
  work_object_id: string;
  lane_id: string;
  objective_sha256: string;
  authorized_action_classes: GimpireAuthorizedActionClass[];
  issued_at: string;
  expires_at: string;
  provenance_sha256: string;
};

type Action = {
  schema: "werkles.gimpire-authority-action/v1";
  action_id: string;
  project_id: string;
  work_object_id: string;
  lane_id: string;
  objective_sha256: string;
  action_class: GimpireAuthorizedActionClass;
  description: string;
  risk_class: "SAFE_REVERSIBLE_IN_LANE" | GimpireTrueGateKind;
};

export type GimpireOperatorAuthorityClaim = {
  schema: "werkles.gimpire-operator-authority-claim/v1";
  operator_id: "Ben@Operator";
  authority_id: string;
  authority_sha256: string;
  project_id: string;
  work_object_id: string;
  lane_id: string;
  objective_sha256: string;
  issued_at: string;
  expires_at: string;
  provenance_sha256: string;
  action_sha256: string;
  action_class: GimpireAuthorizedActionClass;
  risk_class: "SAFE_REVERSIBLE_IN_LANE" | GimpireTrueGateKind;
};

export type GimpireVerifiedOperatorAuthority = GimpireOperatorAuthorityClaim & {
  state: "VERIFIED_BY_EXTERNAL_OPERATOR_AUTHORITY";
  attestation_sha256: string;
};

export type GimpireOperatorAuthorityVerifier = (
  claim: Readonly<GimpireOperatorAuthorityClaim>
) => unknown;

export class GimpireOperatorAuthorityTrustRoot {
  private readonly publicKeyPem: string;
  readonly key_fingerprint_sha256: string;

  constructor(input: { operator_public_key_pem: string; operator_key_fingerprint_sha256: string }) {
    if (!record(input) || !exact(input, ["operator_public_key_pem", "operator_key_fingerprint_sha256"])
      || typeof input.operator_public_key_pem !== "string" || !SHA256.test(String(input.operator_key_fingerprint_sha256))) {
      throw new Error("GIMPIRE_OPERATOR_TRUST_ROOT_INVALID");
    }
    const key = createPublicKey(input.operator_public_key_pem);
    const fingerprint = createHash("sha256").update(key.export({ type: "spki", format: "der" })).digest("hex");
    if (fingerprint !== input.operator_key_fingerprint_sha256) throw new Error("GIMPIRE_OPERATOR_TRUST_ROOT_MISMATCH");
    this.publicKeyPem = input.operator_public_key_pem;
    this.key_fingerprint_sha256 = fingerprint;
  }

  verifier(attestation: unknown): GimpireOperatorAuthorityVerifier {
    return (claim) => {
      this.verifyExactClaim(attestation, claim, "werkles.gimpire-operator-authority-attestation/v1");
      return { ...claim, state: "VERIFIED_BY_EXTERNAL_OPERATOR_AUTHORITY", attestation_sha256: hashGimpireAuthorityValue(attestation) };
    };
  }

  verifyExactClaim(attestation: unknown, claim: unknown, expectedSchema: string) {
    if (!record(attestation) || !exact(attestation, [
      "schema", "claim_sha256", "operator_key_fingerprint_sha256", "signature_base64"
    ]) || attestation.schema !== expectedSchema
      || attestation.claim_sha256 !== hashGimpireAuthorityValue(claim)
      || attestation.operator_key_fingerprint_sha256 !== this.key_fingerprint_sha256
      || typeof attestation.signature_base64 !== "string" || attestation.signature_base64.length < 16
      || !verify(null, Buffer.from(canonical(claim), "utf8"), this.publicKeyPem, Buffer.from(attestation.signature_base64, "base64"))) {
      throw new Error("GIMPIRE_OPERATOR_AUTHORITY_SIGNATURE_INVALID");
    }
    return Object.freeze({ attestation_sha256: hashGimpireAuthorityValue(attestation) });
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exact(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (record(value)) {
    return `{${Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashGimpireAuthorityValue(value: unknown) {
  return createHash("sha256").update(canonical(value), "utf8").digest("hex");
}

function text(value: unknown, code: string, maximum = 2048) {
  if (typeof value !== "string" || value.trim().length === 0 || value !== value.trim()
    || Buffer.byteLength(value, "utf8") > maximum) throw new Error(code);
  return value;
}

function id(value: unknown, code: string) {
  const parsed = text(value, code, 128);
  if (!ID.test(parsed)) throw new Error(code);
  return parsed;
}

function hash(value: unknown, code: string) {
  if (typeof value !== "string" || !SHA256.test(value)) throw new Error(code);
  return value;
}

function instant(value: unknown, code: string) {
  if (typeof value !== "string") throw new Error(code);
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) throw new Error(code);
  return value;
}

function workObject(value: unknown): WorkObject {
  if (!record(value) || !exact(value, [
    "schema", "project_id", "work_object_id", "lane_id", "objective", "objective_sha256"
  ]) || value.schema !== "werkles.gimpire-authority-work-object/v1") throw new Error("GIMPIRE_AUTHORITY_WORK_INVALID");
  const objective = text(value.objective, "GIMPIRE_AUTHORITY_WORK_INVALID");
  const parsed: WorkObject = {
    schema: value.schema,
    project_id: id(value.project_id, "GIMPIRE_AUTHORITY_WORK_INVALID"),
    work_object_id: id(value.work_object_id, "GIMPIRE_AUTHORITY_WORK_INVALID"),
    lane_id: id(value.lane_id, "GIMPIRE_AUTHORITY_WORK_INVALID"),
    objective,
    objective_sha256: hash(value.objective_sha256, "GIMPIRE_AUTHORITY_WORK_INVALID")
  };
  if (parsed.objective_sha256 !== createHash("sha256").update(objective, "utf8").digest("hex")) {
    throw new Error("GIMPIRE_AUTHORITY_OBJECTIVE_HASH_MISMATCH");
  }
  return parsed;
}

function authority(value: unknown): Authority {
  if (!record(value) || !exact(value, [
    "schema", "authority_id", "operator_id", "project_id", "work_object_id", "lane_id", "objective_sha256",
    "authorized_action_classes", "issued_at", "expires_at", "provenance_sha256"
  ]) || value.schema !== "werkles.gimpire-active-authority/v1" || value.operator_id !== OPERATOR
    || !Array.isArray(value.authorized_action_classes)) throw new Error("GIMPIRE_AUTHORITY_INVALID");
  const actionClasses = value.authorized_action_classes.map((item) => {
    if (!GIMPIRE_AUTHORIZED_ACTION_CLASSES.includes(item as GimpireAuthorizedActionClass)) {
      throw new Error("GIMPIRE_AUTHORITY_ACTION_CLASS_INVALID");
    }
    return item as GimpireAuthorizedActionClass;
  });
  if (new Set(actionClasses).size !== actionClasses.length || actionClasses.length === 0) throw new Error("GIMPIRE_AUTHORITY_INVALID");
  return {
    schema: value.schema,
    authority_id: id(value.authority_id, "GIMPIRE_AUTHORITY_INVALID"),
    operator_id: OPERATOR,
    project_id: id(value.project_id, "GIMPIRE_AUTHORITY_INVALID"),
    work_object_id: id(value.work_object_id, "GIMPIRE_AUTHORITY_INVALID"),
    lane_id: id(value.lane_id, "GIMPIRE_AUTHORITY_INVALID"),
    objective_sha256: hash(value.objective_sha256, "GIMPIRE_AUTHORITY_INVALID"),
    authorized_action_classes: actionClasses,
    issued_at: instant(value.issued_at, "GIMPIRE_AUTHORITY_INVALID"),
    expires_at: instant(value.expires_at, "GIMPIRE_AUTHORITY_INVALID"),
    provenance_sha256: hash(value.provenance_sha256, "GIMPIRE_AUTHORITY_INVALID")
  };
}

function action(value: unknown): Action {
  if (!record(value) || !exact(value, [
    "schema", "action_id", "project_id", "work_object_id", "lane_id", "objective_sha256", "action_class", "description", "risk_class"
  ]) || value.schema !== "werkles.gimpire-authority-action/v1") throw new Error("GIMPIRE_AUTHORITY_ACTION_INVALID");
  const riskClass = value.risk_class;
  if (riskClass !== "SAFE_REVERSIBLE_IN_LANE" && !GIMPIRE_TRUE_GATE_KINDS.includes(riskClass as GimpireTrueGateKind)) {
    throw new Error("GIMPIRE_AUTHORITY_ACTION_INVALID");
  }
  return {
    schema: value.schema,
    action_id: id(value.action_id, "GIMPIRE_AUTHORITY_ACTION_INVALID"),
    project_id: id(value.project_id, "GIMPIRE_AUTHORITY_ACTION_INVALID"),
    work_object_id: id(value.work_object_id, "GIMPIRE_AUTHORITY_ACTION_INVALID"),
    lane_id: id(value.lane_id, "GIMPIRE_AUTHORITY_ACTION_INVALID"),
    objective_sha256: hash(value.objective_sha256, "GIMPIRE_AUTHORITY_ACTION_INVALID"),
    action_class: (() => {
      if (!GIMPIRE_AUTHORIZED_ACTION_CLASSES.includes(value.action_class as GimpireAuthorizedActionClass)) {
        throw new Error("GIMPIRE_AUTHORITY_ACTION_CLASS_INVALID");
      }
      return value.action_class as GimpireAuthorizedActionClass;
    })(),
    description: text(value.description, "GIMPIRE_AUTHORITY_ACTION_INVALID"),
    risk_class: riskClass as Action["risk_class"]
  };
}

function verified(value: unknown, claim: GimpireOperatorAuthorityClaim) {
  const keys = [...Object.keys(claim), "state", "attestation_sha256"];
  if (!record(value) || !exact(value, keys) || value.state !== "VERIFIED_BY_EXTERNAL_OPERATOR_AUTHORITY"
    || !SHA256.test(String(value.attestation_sha256))) throw new Error("GIMPIRE_OPERATOR_AUTHORITY_UNVERIFIED");
  for (const [key, item] of Object.entries(claim)) {
    if (value[key] !== item) throw new Error("GIMPIRE_OPERATOR_AUTHORITY_MISBOUND");
  }
}

export function classifyGimpireAuthorityAdmission(input: {
  current_work_object: unknown;
  active_authority: unknown;
  action: unknown;
  evaluated_at: string;
  verify_operator_authority: GimpireOperatorAuthorityVerifier;
}) {
  if (!record(input) || !exact(input, [
    "current_work_object", "active_authority", "action", "evaluated_at", "verify_operator_authority"
  ]) || typeof input.verify_operator_authority !== "function") throw new Error("GIMPIRE_AUTHORITY_ADMISSION_INVALID");
  const current = workObject(input.current_work_object);
  const grant = authority(input.active_authority);
  const candidate = action(input.action);
  const evaluatedAt = instant(input.evaluated_at, "GIMPIRE_AUTHORITY_EVALUATION_TIME_INVALID");
  if (grant.project_id !== current.project_id || grant.work_object_id !== current.work_object_id
    || grant.lane_id !== current.lane_id || grant.objective_sha256 !== current.objective_sha256
    || candidate.project_id !== current.project_id || candidate.work_object_id !== current.work_object_id
    || candidate.lane_id !== current.lane_id || candidate.objective_sha256 !== current.objective_sha256) {
    throw new Error("GIMPIRE_AUTHORITY_SCOPE_MISBOUND");
  }
  const claim: GimpireOperatorAuthorityClaim = Object.freeze({
    schema: "werkles.gimpire-operator-authority-claim/v1",
    operator_id: OPERATOR,
    authority_id: grant.authority_id,
    authority_sha256: hashGimpireAuthorityValue(grant),
    project_id: grant.project_id,
    work_object_id: grant.work_object_id,
    lane_id: grant.lane_id,
    objective_sha256: grant.objective_sha256,
    issued_at: grant.issued_at,
    expires_at: grant.expires_at,
    provenance_sha256: grant.provenance_sha256,
    action_sha256: hashGimpireAuthorityValue(candidate),
    action_class: candidate.action_class,
    risk_class: candidate.risk_class
  });
  let verification: unknown;
  try { verification = input.verify_operator_authority(claim); }
  catch { throw new Error("GIMPIRE_OPERATOR_AUTHORITY_UNVERIFIED"); }
  verified(verification, claim);
  if (evaluatedAt < grant.issued_at || evaluatedAt >= grant.expires_at) throw new Error("GIMPIRE_AUTHORITY_EXPIRED");

  if (candidate.risk_class !== "SAFE_REVERSIBLE_IN_LANE") {
    return Object.freeze({
      decision: "HUMAN_GATE_REQUIRED" as const,
      gate_kind: candidate.risk_class,
      redundant_gate_request: false as const,
      operator_notification_allowed: true as const,
      code: `TRUE_GATE__${candidate.risk_class}` as const,
      work_complete: false as const,
      recurrence_created: false as const,
      authority_expanded: false as const
    });
  }
  if (!grant.authorized_action_classes.includes(candidate.action_class)) {
    return Object.freeze({
      decision: "HUMAN_GATE_REQUIRED" as const,
      gate_kind: "AUTHORITY_EXPANSION" as const,
      redundant_gate_request: false as const,
      operator_notification_allowed: true as const,
      code: "TRUE_GATE__AUTHORITY_EXPANSION" as const,
      work_complete: false as const,
      recurrence_created: false as const,
      authority_expanded: false as const
    });
  }
  return Object.freeze({
    decision: "CONTINUE_ALREADY_AUTHORIZED" as const,
    gate_kind: null,
    redundant_gate_request: true as const,
    operator_notification_allowed: false as const,
    code: "REDUNDANT_GATE__MUEL_WORK_FORBIDDEN" as const,
    work_complete: false as const,
    recurrence_created: false as const,
    authority_expanded: false as const
  });
}

export const GIMPIRE_AUTHORITY_ADMISSION_CAPABILITIES = Object.freeze({
  classifier_only: true as const,
  mutates_work_state: false as const,
  infers_completion: false as const,
  creates_recurrence: false as const,
  operator_provenance_verifier_required: true as const
});
