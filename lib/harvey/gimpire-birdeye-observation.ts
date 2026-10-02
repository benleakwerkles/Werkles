import { createHash } from "node:crypto";

const SHA256 = /^[a-f0-9]{64}$/;
const ID = /^[a-z0-9][a-z0-9-]{2,127}$/;

export const GIMPIRE_BIRDEYE_MATERIAL_EVENTS = [
  "OPERATOR_TURN",
  "TOOL_RESULT",
  "CREW_RECEIPT",
  "HUMAN_GATE_CHANGED",
  "CONTINUITY_RESTART"
] as const;

export const GIMPIRE_BIRDEYE_TRANSPORT_STATES = ["SENT", "QUEUED", "THINKING"] as const;

export type GimpireBirdeyeEventClass =
  | typeof GIMPIRE_BIRDEYE_MATERIAL_EVENTS[number]
  | typeof GIMPIRE_BIRDEYE_TRANSPORT_STATES[number];

export type GimpireBirdeyeAnchor = {
  schema: "werkles.gimpire-birdeye-anchor/v1";
  project_id: string;
  work_object_id: string;
  work_id: string;
  revision: number;
  state_sha256: string;
  last_event_sha256: string | null;
};

export type GimpireBirdeyeEvent = {
  schema: "werkles.gimpire-birdeye-event/v1";
  sensor_id: string;
  event_class: GimpireBirdeyeEventClass;
  project_id: string;
  work_object_id: string;
  work_id: string;
  observed_revision: number;
  project_sha256: string;
  work_sha256: string;
  revision_sha256: string;
  payload_sha256: string;
  event_sha256: string;
};

export type GimpireBirdeyeTransportClaim = {
  schema: "werkles.gimpire-birdeye-transport-claim/v1";
  project_id: string;
  work_object_id: string;
  work_id: string;
  revision: number;
  state_sha256: string;
  sensor_id: string;
  event_sha256: string;
};

export type GimpireVerifiedBirdeyeTransport = GimpireBirdeyeTransportClaim & {
  state: "VERIFIED_FRESH_BY_EXTERNAL_TRANSPORT";
  attestation_sha256: string;
};

export type GimpireBirdeyeTransportVerifier = (
  claim: Readonly<GimpireBirdeyeTransportClaim>
) => GimpireVerifiedBirdeyeTransport;

export const GIMPIRE_BIRDEYE_PRODUCTION_TRUST =
  "INCOMPLETE_UNTIL_EXTERNAL_VERIFIER_INTEGRATION" as const;

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exact(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function hash(value: unknown, code: string) {
  if (typeof value !== "string" || !SHA256.test(value)) throw new Error(code);
  return value;
}

function id(value: unknown, code: string) {
  if (typeof value !== "string" || !ID.test(value)) throw new Error(code);
  return value;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function validateAnchor(value: unknown): GimpireBirdeyeAnchor {
  if (!record(value) || !exact(value, [
    "schema", "project_id", "work_object_id", "work_id", "revision", "state_sha256", "last_event_sha256"
  ]) || value.schema !== "werkles.gimpire-birdeye-anchor/v1") {
    throw new Error("GIMPIRE_BIRDEYE_ANCHOR_INVALID");
  }
  if (!Number.isSafeInteger(value.revision) || Number(value.revision) < 0) {
    throw new Error("GIMPIRE_BIRDEYE_REVISION_INVALID");
  }
  return {
    schema: "werkles.gimpire-birdeye-anchor/v1",
    project_id: id(value.project_id, "GIMPIRE_BIRDEYE_PROJECT_INVALID"),
    work_object_id: id(value.work_object_id, "GIMPIRE_BIRDEYE_WORK_INVALID"),
    work_id: id(value.work_id, "GIMPIRE_BIRDEYE_WORK_INVALID"),
    revision: Number(value.revision),
    state_sha256: hash(value.state_sha256, "GIMPIRE_BIRDEYE_STATE_HASH_INVALID"),
    last_event_sha256: value.last_event_sha256 === null
      ? null
      : hash(value.last_event_sha256, "GIMPIRE_BIRDEYE_EVENT_HASH_INVALID")
  };
}

function scopeHashes(anchor: GimpireBirdeyeAnchor) {
  const projectSha256 = sha256(JSON.stringify({
    schema: "werkles.gimpire-birdeye-project-scope/v1",
    project_id: anchor.project_id
  }));
  const workSha256 = sha256(JSON.stringify({
    schema: "werkles.gimpire-birdeye-work-scope/v1",
    project_sha256: projectSha256,
    work_object_id: anchor.work_object_id,
    work_id: anchor.work_id
  }));
  const revisionSha256 = sha256(JSON.stringify({
    schema: "werkles.gimpire-birdeye-revision-scope/v1",
    work_sha256: workSha256,
    revision: anchor.revision,
    state_sha256: anchor.state_sha256
  }));
  return { projectSha256, workSha256, revisionSha256 };
}

function canonicalEvent(value: Omit<GimpireBirdeyeEvent, "event_sha256">) {
  return JSON.stringify({
    schema: value.schema,
    sensor_id: value.sensor_id,
    event_class: value.event_class,
    project_id: value.project_id,
    work_object_id: value.work_object_id,
    work_id: value.work_id,
    observed_revision: value.observed_revision,
    project_sha256: value.project_sha256,
    work_sha256: value.work_sha256,
    revision_sha256: value.revision_sha256,
    payload_sha256: value.payload_sha256
  });
}

function eventClass(value: unknown): GimpireBirdeyeEventClass {
  const allowed = [...GIMPIRE_BIRDEYE_MATERIAL_EVENTS, ...GIMPIRE_BIRDEYE_TRANSPORT_STATES] as readonly string[];
  if (typeof value !== "string" || !allowed.includes(value)) throw new Error("GIMPIRE_BIRDEYE_EVENT_CLASS_INVALID");
  return value as GimpireBirdeyeEventClass;
}

export function compileGimpireBirdeyeEvent(anchorValue: unknown, draftValue: unknown): GimpireBirdeyeEvent {
  const anchor = validateAnchor(anchorValue);
  if (!record(draftValue) || !exact(draftValue, ["sensor_id", "event_class", "payload_sha256"])) {
    throw new Error("GIMPIRE_BIRDEYE_EVENT_DRAFT_INVALID");
  }
  const scopes = scopeHashes(anchor);
  const event: Omit<GimpireBirdeyeEvent, "event_sha256"> = {
    schema: "werkles.gimpire-birdeye-event/v1",
    sensor_id: id(draftValue.sensor_id, "GIMPIRE_BIRDEYE_SENSOR_INVALID"),
    event_class: eventClass(draftValue.event_class),
    project_id: anchor.project_id,
    work_object_id: anchor.work_object_id,
    work_id: anchor.work_id,
    observed_revision: anchor.revision,
    project_sha256: scopes.projectSha256,
    work_sha256: scopes.workSha256,
    revision_sha256: scopes.revisionSha256,
    payload_sha256: hash(draftValue.payload_sha256, "GIMPIRE_BIRDEYE_PAYLOAD_HASH_INVALID")
  };
  return Object.freeze({ ...event, event_sha256: sha256(canonicalEvent(event)) });
}

export function observeGimpireBirdeyeEvent(
  anchorValue: unknown,
  eventValue: unknown,
  verifyTransport: GimpireBirdeyeTransportVerifier
) {
  const anchor = validateAnchor(anchorValue);
  if (!record(eventValue) || !exact(eventValue, [
    "schema", "sensor_id", "event_class", "project_id", "work_object_id", "work_id", "observed_revision",
    "project_sha256", "work_sha256", "revision_sha256", "payload_sha256", "event_sha256"
  ]) || eventValue.schema !== "werkles.gimpire-birdeye-event/v1") {
    throw new Error("GIMPIRE_BIRDEYE_EVENT_INVALID");
  }

  const observedRevision = eventValue.observed_revision;
  if (!Number.isSafeInteger(observedRevision) || Number(observedRevision) !== anchor.revision) {
    throw new Error("GIMPIRE_BIRDEYE_STALE_REVISION");
  }
  if (eventValue.project_id !== anchor.project_id) throw new Error("GIMPIRE_BIRDEYE_PROJECT_SUBSTITUTION");
  if (eventValue.work_object_id !== anchor.work_object_id || eventValue.work_id !== anchor.work_id) {
    throw new Error("GIMPIRE_BIRDEYE_WORK_SUBSTITUTION");
  }

  const scopes = scopeHashes(anchor);
  if (eventValue.project_sha256 !== scopes.projectSha256) throw new Error("GIMPIRE_BIRDEYE_PROJECT_HASH_SUBSTITUTION");
  if (eventValue.work_sha256 !== scopes.workSha256) throw new Error("GIMPIRE_BIRDEYE_WORK_HASH_SUBSTITUTION");
  if (eventValue.revision_sha256 !== scopes.revisionSha256) throw new Error("GIMPIRE_BIRDEYE_REVISION_HASH_SUBSTITUTION");

  const validatedEvent: Omit<GimpireBirdeyeEvent, "event_sha256"> = {
    schema: "werkles.gimpire-birdeye-event/v1",
    sensor_id: id(eventValue.sensor_id, "GIMPIRE_BIRDEYE_SENSOR_INVALID"),
    event_class: eventClass(eventValue.event_class),
    project_id: anchor.project_id,
    work_object_id: anchor.work_object_id,
    work_id: anchor.work_id,
    observed_revision: anchor.revision,
    project_sha256: hash(eventValue.project_sha256, "GIMPIRE_BIRDEYE_PROJECT_HASH_SUBSTITUTION"),
    work_sha256: hash(eventValue.work_sha256, "GIMPIRE_BIRDEYE_WORK_HASH_SUBSTITUTION"),
    revision_sha256: hash(eventValue.revision_sha256, "GIMPIRE_BIRDEYE_REVISION_HASH_SUBSTITUTION"),
    payload_sha256: hash(eventValue.payload_sha256, "GIMPIRE_BIRDEYE_PAYLOAD_HASH_INVALID")
  };
  const eventSha256 = hash(eventValue.event_sha256, "GIMPIRE_BIRDEYE_EVENT_HASH_INVALID");
  if (eventSha256 !== sha256(canonicalEvent(validatedEvent))) throw new Error("GIMPIRE_BIRDEYE_EVENT_HASH_SUBSTITUTION");
  if (eventSha256 === anchor.last_event_sha256) throw new Error("GIMPIRE_BIRDEYE_EVENT_REPLAY");

  if (typeof verifyTransport !== "function") throw new Error("GIMPIRE_BIRDEYE_EXTERNAL_VERIFIER_REQUIRED");
  const transportClaim = Object.freeze({
    schema: "werkles.gimpire-birdeye-transport-claim/v1" as const,
    project_id: anchor.project_id,
    work_object_id: anchor.work_object_id,
    work_id: anchor.work_id,
    revision: anchor.revision,
    state_sha256: anchor.state_sha256,
    sensor_id: validatedEvent.sensor_id,
    event_sha256: eventSha256
  });
  let verifiedTransport: GimpireVerifiedBirdeyeTransport;
  try { verifiedTransport = verifyTransport(transportClaim); }
  catch { throw new Error("GIMPIRE_BIRDEYE_TRANSPORT_UNTRUSTED"); }
  if (!record(verifiedTransport) || !exact(verifiedTransport, [
    "schema", "state", "project_id", "work_object_id", "work_id", "revision", "state_sha256",
    "sensor_id", "event_sha256", "attestation_sha256"
  ]) || verifiedTransport.schema !== transportClaim.schema
    || verifiedTransport.state !== "VERIFIED_FRESH_BY_EXTERNAL_TRANSPORT"
    || verifiedTransport.project_id !== transportClaim.project_id
    || verifiedTransport.work_object_id !== transportClaim.work_object_id
    || verifiedTransport.work_id !== transportClaim.work_id
    || verifiedTransport.revision !== transportClaim.revision
    || verifiedTransport.state_sha256 !== transportClaim.state_sha256
    || verifiedTransport.sensor_id !== transportClaim.sensor_id
    || verifiedTransport.event_sha256 !== transportClaim.event_sha256
    || typeof verifiedTransport.attestation_sha256 !== "string"
    || !SHA256.test(verifiedTransport.attestation_sha256)) {
    throw new Error("GIMPIRE_BIRDEYE_TRANSPORT_UNTRUSTED");
  }

  const material = GIMPIRE_BIRDEYE_MATERIAL_EVENTS.includes(validatedEvent.event_class as never);
  const scope = Object.freeze({
    project_id: anchor.project_id,
    work_object_id: anchor.work_object_id,
    work_id: anchor.work_id,
    observed_revision: anchor.revision,
    project_sha256: scopes.projectSha256,
    work_sha256: scopes.workSha256,
    revision_sha256: scopes.revisionSha256
  });
  const observation = Object.freeze({
    state: material ? "MATERIAL_EVENT_OBSERVED" as const : "TRANSPORT_STATE_OBSERVED" as const,
    sensor_id: validatedEvent.sensor_id,
    event_class: validatedEvent.event_class,
    event_sha256: eventSha256,
    payload_sha256: validatedEvent.payload_sha256,
    transport_attestation_sha256: verifiedTransport.attestation_sha256
  });
  const judgment = Object.freeze({
    state: "NOT_PERFORMED" as const,
    effect_evidence: false as const,
    completion_inferred: false as const,
    authority_granted: false as const,
    work_state_mutated: false as const
  });
  const capabilities = Object.freeze({
    read_only: true as const,
    polling_authorized: false as const,
    recurrence_authorized: false as const,
    production_trust_integration: GIMPIRE_BIRDEYE_PRODUCTION_TRUST
  });
  return Object.freeze({
    schema: "werkles.gimpire-birdeye-observation/v1" as const,
    scope,
    observation,
    judgment,
    capabilities
  });
}
