import { createHash } from "node:crypto";

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

export const GIMPIRE_REVIEW_STAGES = [
  "ARCHITECT_DRAFT",
  "REVIEW_ONE",
  "REVIEW_TWO",
  "ARCHITECT_RECONCILIATION",
  "FINAL_RED_TEAM"
] as const;

export type GimpireReviewStage = typeof GIMPIRE_REVIEW_STAGES[number];

export type GimpireReviewReceipt = {
  receipt_id: string;
  ring_id: string;
  work_object_id: string;
  stage: GimpireReviewStage;
  actor: string;
  artifact_id: string;
  input_sha256: string | null;
  output_sha256: string;
  verdict: "DRAFT_READY" | "PASS" | "PATCH_REQUIRED" | "BLOCKER" | "RECONCILED";
  receipt_sha256: string;
};

export type GimpireVerifiedReviewTransport = {
  state: "VERIFIED_BY_EXTERNAL_TRANSPORT";
  actor: string;
  receiver_task_id: string;
  attestation_sha256: string;
  provider_source_id: string;
  provider_principal_id: string;
  provider_route_id: string;
  source_attestation_sha256: string;
};

export type GimpireReviewTransportVerifier = (receipt: Readonly<GimpireReviewReceipt>) => GimpireVerifiedReviewTransport;

export type GimpireReviewRingInput = {
  schema: "werkles.gimpire-review-ring/v1";
  ring_id: string;
  work_object_id: string;
  participants: [string, string, string];
  architect: string;
  artifact_id: string;
  receipts: GimpireReviewReceipt[];
};

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function exact(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function canonicalReceipt(receipt: Omit<GimpireReviewReceipt, "receipt_sha256">) {
  return JSON.stringify({
    receipt_id: receipt.receipt_id,
    ring_id: receipt.ring_id,
    work_object_id: receipt.work_object_id,
    stage: receipt.stage,
    actor: receipt.actor,
    artifact_id: receipt.artifact_id,
    input_sha256: receipt.input_sha256,
    output_sha256: receipt.output_sha256,
    verdict: receipt.verdict
  });
}

export function compileGimpireReviewReceipt(input: Omit<GimpireReviewReceipt, "receipt_sha256">): GimpireReviewReceipt {
  return { ...input, receipt_sha256: createHash("sha256").update(canonicalReceipt(input)).digest("hex") };
}

function validateReceipt(value: unknown, ringId: string, workObjectId: string, artifactId: string): GimpireReviewReceipt {
  if (!record(value) || !exact(value, [
    "receipt_id", "ring_id", "work_object_id", "stage", "actor", "artifact_id", "input_sha256", "output_sha256", "verdict", "receipt_sha256"
  ])) throw new Error("GIMPIRE_REVIEW_RECEIPT_INVALID");
  if (typeof value.receipt_id !== "string" || !ID.test(value.receipt_id)
    || value.ring_id !== ringId || value.work_object_id !== workObjectId
    || !GIMPIRE_REVIEW_STAGES.includes(value.stage as never)
    || typeof value.actor !== "string" || !ADDRESS.test(value.actor)
    || value.artifact_id !== artifactId
    || (value.input_sha256 !== null && (typeof value.input_sha256 !== "string" || !SHA256.test(value.input_sha256)))
    || typeof value.output_sha256 !== "string" || !SHA256.test(value.output_sha256)
    || !["DRAFT_READY", "PASS", "PATCH_REQUIRED", "BLOCKER", "RECONCILED"].includes(String(value.verdict))
    || typeof value.receipt_sha256 !== "string" || !SHA256.test(value.receipt_sha256)) {
    throw new Error("GIMPIRE_REVIEW_RECEIPT_INVALID");
  }
  const receipt = value as unknown as GimpireReviewReceipt;
  const expected = createHash("sha256").update(canonicalReceipt({
    receipt_id: receipt.receipt_id,
    ring_id: receipt.ring_id,
    work_object_id: receipt.work_object_id,
    stage: receipt.stage,
    actor: receipt.actor,
    artifact_id: receipt.artifact_id,
    input_sha256: receipt.input_sha256,
    output_sha256: receipt.output_sha256,
    verdict: receipt.verdict
  })).digest("hex");
  if (expected !== receipt.receipt_sha256) throw new Error("GIMPIRE_REVIEW_RECEIPT_HASH_INVALID");
  return receipt;
}

export function projectGimpireReviewRing(value: unknown, verifyTransport: GimpireReviewTransportVerifier) {
  if (!record(value) || !exact(value, ["schema", "ring_id", "work_object_id", "participants", "architect", "artifact_id", "receipts"])
    || value.schema !== "werkles.gimpire-review-ring/v1"
    || typeof value.ring_id !== "string" || !ID.test(value.ring_id)
    || typeof value.work_object_id !== "string" || !ID.test(value.work_object_id)
    || typeof value.artifact_id !== "string" || !ID.test(value.artifact_id)
    || !Array.isArray(value.participants) || value.participants.length !== 3
    || value.participants.some((item) => typeof item !== "string" || !ADDRESS.test(item))
    || new Set(value.participants).size !== 3
    || typeof value.architect !== "string" || !value.participants.includes(value.architect)
    || !Array.isArray(value.receipts) || value.receipts.length > GIMPIRE_REVIEW_STAGES.length) {
    throw new Error("GIMPIRE_REVIEW_RING_INVALID");
  }
  const participants = value.participants as [string, string, string];
  const architect = value.architect as string;
  const architectIndex = participants.indexOf(architect);
  const actors = [
    architect,
    participants[(architectIndex + 1) % 3],
    participants[(architectIndex + 2) % 3],
    architect,
    participants[(architectIndex + 1) % 3]
  ];
  const receipts = value.receipts.map((receipt) => validateReceipt(receipt, value.ring_id as string, value.work_object_id as string, value.artifact_id as string));
  if (new Set(receipts.map((receipt) => receipt.receipt_id)).size !== receipts.length
    || new Set(receipts.map((receipt) => receipt.receipt_sha256)).size !== receipts.length) {
    throw new Error("GIMPIRE_REVIEW_RECEIPT_REPLAY");
  }
  if (typeof verifyTransport !== "function") throw new Error("GIMPIRE_REVIEW_EXTERNAL_VERIFIER_REQUIRED");
  const verifiedTasks = new Set<string>();
  const actorSources = new Map<string, {
    provider_source_id: string;
    provider_principal_id: string;
    provider_route_id: string;
    source_attestation_sha256: string;
  }>();
  for (const receipt of receipts) {
    let verified: GimpireVerifiedReviewTransport;
    try { verified = verifyTransport(Object.freeze({ ...receipt })); }
    catch { throw new Error("GIMPIRE_REVIEW_TRANSPORT_UNTRUSTED"); }
    if (!record(verified) || !exact(verified, [
      "state", "actor", "receiver_task_id", "attestation_sha256",
      "provider_source_id", "provider_principal_id", "provider_route_id", "source_attestation_sha256"
    ])
      || verified.state !== "VERIFIED_BY_EXTERNAL_TRANSPORT"
      || verified.actor !== receipt.actor
      || typeof verified.receiver_task_id !== "string" || verified.receiver_task_id.trim().length < 3
      || typeof verified.attestation_sha256 !== "string" || !SHA256.test(verified.attestation_sha256)
      || typeof verified.provider_source_id !== "string" || !PROVIDER_SOURCE.test(verified.provider_source_id)
      || typeof verified.provider_principal_id !== "string" || !PROVIDER_PRINCIPAL.test(verified.provider_principal_id)
      || TRUSTED_PROVIDER_PRINCIPAL_BY_SOURCE[verified.provider_source_id] !== verified.provider_principal_id
      || typeof verified.provider_route_id !== "string" || !ID.test(verified.provider_route_id)
      || typeof verified.source_attestation_sha256 !== "string" || !SHA256.test(verified.source_attestation_sha256)
      || verifiedTasks.has(verified.receiver_task_id)) {
      throw new Error("GIMPIRE_REVIEW_TRANSPORT_UNTRUSTED");
    }
    verifiedTasks.add(verified.receiver_task_id);
    const prior = actorSources.get(receipt.actor);
    const source = {
      provider_source_id: verified.provider_source_id,
      provider_principal_id: verified.provider_principal_id,
      provider_route_id: verified.provider_route_id,
      source_attestation_sha256: verified.source_attestation_sha256
    };
    if (prior && JSON.stringify(prior) !== JSON.stringify(source)) {
      throw new Error("GIMPIRE_REVIEW_SOURCE_IDENTITY_DRIFT");
    }
    actorSources.set(receipt.actor, source);
    const observedSources = [...actorSources.values()];
    if (new Set(observedSources.map((item) => item.provider_source_id)).size !== observedSources.length
      || new Set(observedSources.map((item) => item.provider_principal_id)).size !== observedSources.length
      || new Set(observedSources.map((item) => item.provider_route_id)).size !== observedSources.length) {
      throw new Error("GIMPIRE_REVIEW_SOURCE_DIVERSITY_INVALID");
    }
  }

  let draftSha: string | null = null;
  let reconciledSha: string | null = null;
  receipts.forEach((receipt, index) => {
    if (receipt.stage !== GIMPIRE_REVIEW_STAGES[index] || receipt.actor !== actors[index]) throw new Error("GIMPIRE_REVIEW_ROTATION_INVALID");
    if (index === 0) {
      if (receipt.input_sha256 !== null || receipt.verdict !== "DRAFT_READY") throw new Error("GIMPIRE_ARCHITECT_DRAFT_INVALID");
      draftSha = receipt.output_sha256;
      return;
    }
    if (index === 1 || index === 2) {
      if (receipt.input_sha256 !== draftSha || receipt.output_sha256 !== draftSha || !["PASS", "PATCH_REQUIRED", "BLOCKER"].includes(receipt.verdict)) {
        throw new Error("GIMPIRE_REVIEW_INPUT_SUBSTITUTION");
      }
      return;
    }
    if (index === 3) {
      if (receipt.input_sha256 !== draftSha || receipt.verdict !== "RECONCILED") throw new Error("GIMPIRE_RECONCILIATION_INVALID");
      reconciledSha = receipt.output_sha256;
      return;
    }
    if (receipt.input_sha256 !== reconciledSha || receipt.output_sha256 !== reconciledSha || !["PASS", "BLOCKER"].includes(receipt.verdict)) {
      throw new Error("GIMPIRE_FINAL_RED_TEAM_INVALID");
    }
  });

  const nextIndex = receipts.length;
  const sourceDiversityProved = actorSources.size === participants.length
    && new Set([...actorSources.values()].map((item) => item.provider_source_id)).size === participants.length
    && new Set([...actorSources.values()].map((item) => item.provider_principal_id)).size === participants.length
    && new Set([...actorSources.values()].map((item) => item.provider_route_id)).size === participants.length;
  const complete = nextIndex === GIMPIRE_REVIEW_STAGES.length && receipts.at(-1)?.verdict === "PASS" && sourceDiversityProved;
  const blocked = nextIndex === GIMPIRE_REVIEW_STAGES.length && receipts.at(-1)?.verdict === "BLOCKER";
  return Object.freeze({
    ring_id: value.ring_id as string,
    work_object_id: value.work_object_id as string,
    artifact_id: value.artifact_id as string,
    architect,
    state: complete ? "ACCEPTED" as const : blocked ? "FINAL_BLOCKER" as const : "IN_REVIEW" as const,
    accepted: complete,
    receipts_observed: receipts.length,
    next_required_stage: nextIndex < GIMPIRE_REVIEW_STAGES.length ? GIMPIRE_REVIEW_STAGES[nextIndex] : null,
    next_required_actor: nextIndex < actors.length ? actors[nextIndex] : null,
    draft_sha256: draftSha,
    reconciled_sha256: reconciledSha,
    source_diversity_proved: sourceDiversityProved,
    distinct_provider_source_count: new Set([...actorSources.values()].map((item) => item.provider_source_id)).size,
    distinct_provider_principal_count: new Set([...actorSources.values()].map((item) => item.provider_principal_id)).size,
    public_release_admitted: complete,
    self_review_can_promote: false as const,
    solo_source_can_promote: false as const,
    assignment_is_receipt: false as const,
    recurrence_authorized: false as const
  });
}
