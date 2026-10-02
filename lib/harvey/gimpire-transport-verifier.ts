import { createHash } from "node:crypto";

import { verifyStationTerminalEvidence } from "./station-fabric-core.mjs";

import type {
  GimpireBirdeyeEventClass,
  GimpireBirdeyeTransportClaim,
  GimpireBirdeyeTransportVerifier,
  GimpireVerifiedBirdeyeTransport
} from "./gimpire-birdeye-observation";
import type {
  GimpireReviewReceipt,
  GimpireReviewTransportVerifier,
  GimpireVerifiedReviewTransport
} from "./gimpire-review-ring";

const SHA256 = /^[a-f0-9]{64}$/;
const ADDRESS = /^[A-Za-z][A-Za-z0-9_-]{1,63}@[A-Za-z][A-Za-z0-9_-]{1,63}$/;
const ID = /^[a-z0-9][a-z0-9-]{2,127}$/;
const PROVIDER_SOURCE = /^(codex|chatgpt|gemini|perplexity|deepseek|claude|cowork|cursor)$/;
const PROVIDER_PRINCIPAL = /^(openai|anthropic|google|perplexity|deepseek)$/;
const TRUSTED_PROVIDER_PRINCIPAL_BY_SOURCE: Readonly<Record<string, string>> = Object.freeze({
  codex: "openai",
  chatgpt: "openai",
  claude: "anthropic",
  cowork: "anthropic",
  gemini: "google",
  perplexity: "perplexity",
  deepseek: "deepseek"
});
const MATERIAL_EVENTS = new Set<GimpireBirdeyeEventClass>([
  "OPERATOR_TURN", "TOOL_RESULT", "CREW_RECEIPT", "HUMAN_GATE_CHANGED", "CONTINUITY_RESTART"
]);

type TerminalProof = {
  dispatch: Record<string, unknown>;
  station_terminal_attestation: unknown;
};

export type GimpireVerifiedSignedTerminalProof = {
  dispatch: Record<string, unknown>;
  receiver_task_id: string;
  attestation_sha256: string;
};

type ReviewTask = {
  schema: "werkles.gimpire-review-terminal-task/v1";
  project_id: string;
  ring_id: string;
  work_object_id: string;
  stage: string;
  actor: string;
  artifact_id: string;
  input_sha256: string | null;
  provider_source_id: string;
  provider_principal_id: string;
  provider_route_id: string;
  source_attestation_sha256: string;
};

type BirdeyeTask = {
  schema: "werkles.gimpire-birdeye-terminal-task/v1";
  project_id: string;
  work_object_id: string;
  work_id: string;
  revision: number;
  state_sha256: string;
  sensor_id: string;
  actor: string;
};

type BirdeyeReport = Omit<GimpireBirdeyeTransportClaim, "schema"> & {
  schema: "werkles.gimpire-birdeye-terminal-report/v1";
  actor: string;
  event_class: GimpireBirdeyeEventClass;
};

type VerifiedProof<TTask, TReply> = {
  task: TTask;
  reply: TReply;
  receiver_task_id: string;
  attestation_sha256: string;
  consumed: boolean;
};

export function compileGimpireReviewSourceAttestationSha256(value: {
  actor: string;
  receiver_task_id: string;
  provider_source_id: string;
  provider_principal_id: string;
  provider_route_id: string;
}) {
  actorSeat(value.actor, "GIMPIRE_REVIEW_SOURCE_ATTESTATION_INVALID");
  if (typeof value.receiver_task_id !== "string" || value.receiver_task_id.trim().length < 3
    || typeof value.provider_source_id !== "string" || !PROVIDER_SOURCE.test(value.provider_source_id)
    || typeof value.provider_principal_id !== "string" || !PROVIDER_PRINCIPAL.test(value.provider_principal_id)
    || TRUSTED_PROVIDER_PRINCIPAL_BY_SOURCE[value.provider_source_id] !== value.provider_principal_id
    || typeof value.provider_route_id !== "string" || !ID.test(value.provider_route_id)) {
    throw new Error("GIMPIRE_REVIEW_SOURCE_ATTESTATION_INVALID");
  }
  return createHash("sha256").update(JSON.stringify({
    actor: value.actor,
    receiver_task_id: value.receiver_task_id,
    provider_source_id: value.provider_source_id,
    provider_principal_id: value.provider_principal_id,
    provider_route_id: value.provider_route_id
  })).digest("hex");
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exact(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function parseCanonicalObject(value: unknown, keys: readonly string[], code: string) {
  if (typeof value !== "string") throw new Error(code);
  let parsed: unknown;
  try { parsed = JSON.parse(value); }
  catch { throw new Error(code); }
  if (!record(parsed) || !exact(parsed, keys) || JSON.stringify(parsed) !== value) throw new Error(code);
  return parsed;
}

function actorSeat(actor: unknown, code: string) {
  if (typeof actor !== "string" || !ADDRESS.test(actor)) throw new Error(code);
  return actor.toLowerCase();
}

function terminalProof(value: unknown, coordinatorPublicKeyPem: string) {
  if (!record(value) || !exact(value, ["dispatch", "station_terminal_attestation"]) || !record(value.dispatch)) {
    throw new Error("GIMPIRE_TRANSPORT_PROOF_INVALID");
  }
  const dispatch = value.dispatch;
  if (dispatch.state !== "COMPLETED" || typeof dispatch.thread_id !== "string" || typeof dispatch.project_id !== "string"
    || typeof dispatch.seat_id !== "string" || typeof dispatch.body !== "string" || typeof dispatch.reply !== "string") {
    throw new Error("GIMPIRE_TRANSPORT_NOT_TERMINAL");
  }
  const verified = verifyStationTerminalEvidence({
    state: dispatch.state,
    stationTerminalAttestation: value.station_terminal_attestation,
    coordinatorPublicKeyPem,
    dispatch
  });
  if (verified?.status !== "VERIFIED" || verified.trusted_terminal_transport !== true
    || typeof verified.coordinator_record_sha256 !== "string" || !SHA256.test(verified.coordinator_record_sha256)) {
    throw new Error("GIMPIRE_TRANSPORT_SIGNATURE_UNTRUSTED");
  }
  return {
    dispatch,
    receiver_task_id: dispatch.thread_id,
    attestation_sha256: verified.coordinator_record_sha256
  };
}

export function verifyGimpireSignedTerminalProof(
  value: unknown,
  coordinatorPublicKeyPem: string
): GimpireVerifiedSignedTerminalProof {
  const verified = terminalProof(value, coordinatorPublicKeyPem);
  return Object.freeze({ ...verified });
}

function reviewTask(value: unknown): ReviewTask {
  if (!record(value) || !exact(value, [
    "schema", "project_id", "ring_id", "work_object_id", "stage", "actor", "artifact_id", "input_sha256",
    "provider_source_id", "provider_principal_id", "provider_route_id", "source_attestation_sha256"
  ]) || value.schema !== "werkles.gimpire-review-terminal-task/v1"
    || typeof value.project_id !== "string" || !ID.test(value.project_id)
    || typeof value.ring_id !== "string" || !ID.test(value.ring_id)
    || typeof value.work_object_id !== "string" || !ID.test(value.work_object_id)
    || typeof value.stage !== "string" || typeof value.artifact_id !== "string" || !ID.test(value.artifact_id)
    || (value.input_sha256 !== null && (typeof value.input_sha256 !== "string" || !SHA256.test(value.input_sha256)))
    || typeof value.provider_source_id !== "string" || !PROVIDER_SOURCE.test(value.provider_source_id)
    || typeof value.provider_principal_id !== "string" || !PROVIDER_PRINCIPAL.test(value.provider_principal_id)
    || TRUSTED_PROVIDER_PRINCIPAL_BY_SOURCE[value.provider_source_id] !== value.provider_principal_id
    || typeof value.provider_route_id !== "string" || !ID.test(value.provider_route_id)
    || typeof value.source_attestation_sha256 !== "string" || !SHA256.test(value.source_attestation_sha256)) {
    throw new Error("GIMPIRE_REVIEW_TRANSPORT_TASK_INVALID");
  }
  actorSeat(value.actor, "GIMPIRE_REVIEW_TRANSPORT_TASK_INVALID");
  return value as ReviewTask;
}

function reviewReceipt(value: unknown): GimpireReviewReceipt {
  if (!record(value) || !exact(value, [
    "receipt_id", "ring_id", "work_object_id", "stage", "actor", "artifact_id", "input_sha256", "output_sha256", "verdict", "receipt_sha256"
  ]) || typeof value.receipt_id !== "string" || !ID.test(value.receipt_id)
    || typeof value.ring_id !== "string" || !ID.test(value.ring_id)
    || typeof value.work_object_id !== "string" || !ID.test(value.work_object_id)
    || typeof value.stage !== "string" || typeof value.artifact_id !== "string" || !ID.test(value.artifact_id)
    || typeof value.output_sha256 !== "string" || !SHA256.test(value.output_sha256)
    || typeof value.receipt_sha256 !== "string" || !SHA256.test(value.receipt_sha256)) {
    throw new Error("GIMPIRE_REVIEW_TRANSPORT_REPLY_INVALID");
  }
  actorSeat(value.actor, "GIMPIRE_REVIEW_TRANSPORT_REPLY_INVALID");
  return value as unknown as GimpireReviewReceipt;
}

function birdeyeTask(value: unknown): BirdeyeTask {
  if (!record(value) || !exact(value, [
    "schema", "project_id", "work_object_id", "work_id", "revision", "state_sha256", "sensor_id", "actor"
  ]) || value.schema !== "werkles.gimpire-birdeye-terminal-task/v1"
    || typeof value.project_id !== "string" || !ID.test(value.project_id)
    || typeof value.work_object_id !== "string" || !ID.test(value.work_object_id)
    || typeof value.work_id !== "string" || !ID.test(value.work_id)
    || !Number.isSafeInteger(value.revision) || Number(value.revision) < 0
    || typeof value.state_sha256 !== "string" || !SHA256.test(value.state_sha256)
    || typeof value.sensor_id !== "string" || !ID.test(value.sensor_id)) {
    throw new Error("GIMPIRE_BIRDEYE_TRANSPORT_TASK_INVALID");
  }
  actorSeat(value.actor, "GIMPIRE_BIRDEYE_TRANSPORT_TASK_INVALID");
  return value as BirdeyeTask;
}

function birdeyeReport(value: unknown): BirdeyeReport {
  if (!record(value) || !exact(value, [
    "schema", "project_id", "work_object_id", "work_id", "revision", "state_sha256", "sensor_id", "event_sha256", "actor", "event_class"
  ]) || value.schema !== "werkles.gimpire-birdeye-terminal-report/v1"
    || typeof value.project_id !== "string" || !ID.test(value.project_id)
    || typeof value.work_object_id !== "string" || !ID.test(value.work_object_id)
    || typeof value.work_id !== "string" || !ID.test(value.work_id)
    || !Number.isSafeInteger(value.revision) || Number(value.revision) < 0
    || typeof value.state_sha256 !== "string" || !SHA256.test(value.state_sha256)
    || typeof value.sensor_id !== "string" || !ID.test(value.sensor_id)
    || typeof value.event_sha256 !== "string" || !SHA256.test(value.event_sha256)
    || !MATERIAL_EVENTS.has(value.event_class as GimpireBirdeyeEventClass)) {
    throw new Error("GIMPIRE_BIRDEYE_TRANSPORT_REPORT_INVALID");
  }
  actorSeat(value.actor, "GIMPIRE_BIRDEYE_TRANSPORT_REPORT_INVALID");
  return value as BirdeyeReport;
}

function terminalInputs(value: unknown) {
  if (!record(value) || !exact(value, ["trusted_coordinator_public_key_pem", "proofs"])
    || typeof value.trusted_coordinator_public_key_pem !== "string" || !Array.isArray(value.proofs) || value.proofs.length === 0) {
    throw new Error("GIMPIRE_TRANSPORT_VERIFIER_INPUT_INVALID");
  }
  return value as { trusted_coordinator_public_key_pem: string; proofs: unknown[] };
}

export function createGimpireReviewTransportVerifier(value: unknown): GimpireReviewTransportVerifier {
  const input = terminalInputs(value);
  const byReceipt = new Map<string, VerifiedProof<ReviewTask, GimpireReviewReceipt>>();
  const taskIds = new Set<string>();
  const attestations = new Set<string>();
  for (const raw of input.proofs) {
    const proof = terminalProof(raw, input.trusted_coordinator_public_key_pem);
    const task = reviewTask(parseCanonicalObject(proof.dispatch.body, [
      "schema", "project_id", "ring_id", "work_object_id", "stage", "actor", "artifact_id", "input_sha256",
      "provider_source_id", "provider_principal_id", "provider_route_id", "source_attestation_sha256"
    ], "GIMPIRE_REVIEW_TRANSPORT_TASK_INVALID"));
    const reply = reviewReceipt(parseCanonicalObject(proof.dispatch.reply, [
      "receipt_id", "ring_id", "work_object_id", "stage", "actor", "artifact_id", "input_sha256", "output_sha256", "verdict", "receipt_sha256"
    ], "GIMPIRE_REVIEW_TRANSPORT_REPLY_INVALID"));
    const expectedSourceAttestation = compileGimpireReviewSourceAttestationSha256({
      actor: task.actor,
      receiver_task_id: proof.receiver_task_id,
      provider_source_id: task.provider_source_id,
      provider_principal_id: task.provider_principal_id,
      provider_route_id: task.provider_route_id
    });
    if (proof.dispatch.project_id !== task.project_id || proof.dispatch.seat_id !== actorSeat(task.actor, "GIMPIRE_REVIEW_TRANSPORT_BINDING_INVALID")
      || reply.ring_id !== task.ring_id || reply.work_object_id !== task.work_object_id || reply.stage !== task.stage
      || reply.actor !== task.actor || reply.artifact_id !== task.artifact_id || reply.input_sha256 !== task.input_sha256
      || task.source_attestation_sha256 !== expectedSourceAttestation
      || byReceipt.has(reply.receipt_id) || taskIds.has(proof.receiver_task_id) || attestations.has(proof.attestation_sha256)) {
      throw new Error("GIMPIRE_REVIEW_TRANSPORT_BINDING_INVALID");
    }
    byReceipt.set(reply.receipt_id, { task, reply, ...proof, consumed: false });
    taskIds.add(proof.receiver_task_id);
    attestations.add(proof.attestation_sha256);
  }
  return (receipt): GimpireVerifiedReviewTransport => {
    const proof = byReceipt.get(receipt.receipt_id);
    if (!proof || proof.consumed || JSON.stringify(receipt) !== JSON.stringify(proof.reply)) {
      throw new Error("GIMPIRE_REVIEW_TRANSPORT_UNTRUSTED");
    }
    proof.consumed = true;
    return {
      state: "VERIFIED_BY_EXTERNAL_TRANSPORT",
      actor: receipt.actor,
      receiver_task_id: proof.receiver_task_id,
      attestation_sha256: proof.attestation_sha256,
      provider_source_id: proof.task.provider_source_id,
      provider_principal_id: proof.task.provider_principal_id,
      provider_route_id: proof.task.provider_route_id,
      source_attestation_sha256: proof.task.source_attestation_sha256
    };
  };
}

export function createGimpireBirdeyeTransportVerifier(value: unknown): GimpireBirdeyeTransportVerifier {
  const input = terminalInputs(value);
  const byEvent = new Map<string, VerifiedProof<BirdeyeTask, BirdeyeReport>>();
  const taskIds = new Set<string>();
  const attestations = new Set<string>();
  for (const raw of input.proofs) {
    const proof = terminalProof(raw, input.trusted_coordinator_public_key_pem);
    const task = birdeyeTask(parseCanonicalObject(proof.dispatch.body, [
      "schema", "project_id", "work_object_id", "work_id", "revision", "state_sha256", "sensor_id", "actor"
    ], "GIMPIRE_BIRDEYE_TRANSPORT_TASK_INVALID"));
    const reply = birdeyeReport(parseCanonicalObject(proof.dispatch.reply, [
      "schema", "project_id", "work_object_id", "work_id", "revision", "state_sha256", "sensor_id", "event_sha256", "actor", "event_class"
    ], "GIMPIRE_BIRDEYE_TRANSPORT_REPORT_INVALID"));
    if (proof.dispatch.project_id !== task.project_id || proof.dispatch.seat_id !== actorSeat(task.actor, "GIMPIRE_BIRDEYE_TRANSPORT_BINDING_INVALID")
      || reply.project_id !== task.project_id || reply.work_object_id !== task.work_object_id || reply.work_id !== task.work_id
      || reply.revision !== task.revision || reply.state_sha256 !== task.state_sha256 || reply.sensor_id !== task.sensor_id
      || reply.actor !== task.actor || byEvent.has(reply.event_sha256) || taskIds.has(proof.receiver_task_id)
      || attestations.has(proof.attestation_sha256)) {
      throw new Error("GIMPIRE_BIRDEYE_TRANSPORT_BINDING_INVALID");
    }
    byEvent.set(reply.event_sha256, { task, reply, ...proof, consumed: false });
    taskIds.add(proof.receiver_task_id);
    attestations.add(proof.attestation_sha256);
  }
  return (claim): GimpireVerifiedBirdeyeTransport => {
    const proof = byEvent.get(claim.event_sha256);
    if (!proof || proof.consumed
      || claim.project_id !== proof.reply.project_id || claim.work_object_id !== proof.reply.work_object_id
      || claim.work_id !== proof.reply.work_id || claim.revision !== proof.reply.revision
      || claim.state_sha256 !== proof.reply.state_sha256 || claim.sensor_id !== proof.reply.sensor_id) {
      throw new Error("GIMPIRE_BIRDEYE_TRANSPORT_UNTRUSTED");
    }
    proof.consumed = true;
    return {
      ...claim,
      state: "VERIFIED_FRESH_BY_EXTERNAL_TRANSPORT",
      attestation_sha256: proof.attestation_sha256
    };
  };
}

export const GIMPIRE_TRANSPORT_ADAPTER_CAPABILITIES = Object.freeze({
  terminal_transport_only: true as const,
  work_completion_proved: false as const,
  effect_proved: false as const,
  acceptance_proved: false as const,
  polling_authorized: false as const,
  recurrence_authorized: false as const,
  production_trust_root_binding: "REQUIRED_FROM_HARVEY_COORDINATOR_CONFIGURATION" as const
});
