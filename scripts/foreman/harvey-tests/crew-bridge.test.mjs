import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { json, jsonAt, secondaryBase, signedMachineHeaders, workspace } from "./harvey-test-client.mjs";

const route = "/api/harvey/relay-events";
const sha = (character) => character.repeat(64);
const deliveryId = () => `harvey_bridge_${randomUUID().replaceAll("-", "")}`;
const eventId = () => `harvey_bridge_event_${randomUUID().replaceAll("-", "")}`;
const eventFields = [
  "delivery_id", "event_id", "sequence", "phase", "transport", "workstream_id", "target_aeye",
  "source_repository", "source_workspace_sha256", "source_git_common_dir_sha256", "source_worktree_sha256",
  "source_branch", "source_commit", "flock_path", "flock_offset", "flock_record_sha256", "bird_path",
  "bird_sha256", "notice_sha256", "observed_at", "proof"
];
const digest = (value) => createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");

function rehashStoredEvents(delivery) {
  let previous;
  for (const stored of delivery.events) {
    const eventValue = Object.fromEntries(eventFields.map((field) => [field, stored[field]]));
    stored.event_sha256 = digest(eventValue);
    stored.ledger_entry_sha256 = digest({ event_sha256: stored.event_sha256, received_at: stored.received_at, previous_ledger_entry_sha256: previous ?? null });
    previous = stored.ledger_entry_sha256;
  }
}

function proofFor(phase, observedAt) {
  if (phase === "QUEUED") return { source: "FLOCK_LOG" };
  if (phase === "SESSION_FOUND") return { session_id_sha256: sha("1"), audit_start_offset: 100 };
  if (phase === "VISUALLY_CONFIRMED") return { window_handle_sha256: sha("2"), visual_snapshot_sha256: sha("3") };
  if (phase === "AWAITING_SEND_CONFIRMATION") return { confirmation_id_sha256: sha("4"), confirmation_expires_at: new Date(Date.parse(observedAt) + 60_000).toISOString() };
  if (phase === "SENT") return { audit_message_sha256: sha("5"), audit_message_offset: 200 };
  if (phase === "ACKNOWLEDGED") return { ack_sha256: sha("6"), audit_ack_offset: 300 };
  if (phase === "ARTIFACT_WRITTEN") return { artifact_path: "Docs/MakerHandoff/BIRD_DOOZER_TO_DINK_TEST.md", artifact_sha256: sha("7"), artifact_bytes: 512 };
  if (phase === "RECEIPTED") return { receipt_id: "oddly_godly_test_receipt", receipt_sha256: sha("8"), result: "COMPLETED" };
  return { blocker_code: "FIXTURE_BLOCKER", blocked_stage: "SESSION_FOUND" };
}

function event(delivery, phase = "QUEUED", sequence = 1, overrides = {}) {
  const observedAt = new Date(Date.now() - 1000 + sequence).toISOString();
  return {
    delivery_id: delivery,
    event_id: eventId(),
    sequence,
    phase,
    transport: "COWORK_UI_FALLBACK",
    workstream_id: "religion_playable_proof",
    target_aeye: "Doozer",
    source_repository: "benleakwerkles/OddlyGodly2.0",
    source_workspace_sha256: sha("a"),
    source_git_common_dir_sha256: sha("b"),
    source_worktree_sha256: sha("c"),
    source_branch: "codex/oddly-godly-next-slices",
    source_commit: "d".repeat(40),
    flock_path: "Docs/MakerHandoff/FLOCK_LOG.jsonl",
    flock_offset: 42,
    flock_record_sha256: sha("e"),
    bird_path: "Docs/MakerHandoff/BIRD_DINK_TO_DOOZER_TEST.md",
    bird_sha256: sha("f"),
    notice_sha256: sha("0"),
    observed_at: observedAt,
    proof: proofFor(phase, observedAt),
    ...overrides
  };
}

async function post(machine, value) {
  const body = JSON.stringify(value);
  return json(route, { method: "POST", headers: signedMachineHeaders({ method: "POST", route, machine, body }), body });
}

async function postAt(targetBase, machine, value) {
  const body = JSON.stringify(value);
  return jsonAt(targetBase, route, { method: "POST", headers: signedMachineHeaders({ method: "POST", route, machine, body }), body });
}

test("public crew bridge projection is read-only, sanitized, and starts empty", async () => {
  const root = path.join(workspace, "data", "harvey", "crew-bridge");
  await fs.rm(root, { recursive: true, force: true });
  const result = await json(route);
  assert.equal(result.response.status, 200);
  assert.equal(result.response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(result.body.automation, "SEND_DISABLED");
  assert.equal(result.body.terminal_rule, "RECEIPTED_OR_BLOCKED_ONLY");
  assert.deepEqual(result.body.deliveries, []);
  assert.equal(await fs.stat(root).then(() => true).catch(() => false), false, "GET created runtime storage");
});

test("crew bridge rejects unauthenticated and non-Spanzee writers", async () => {
  const value = event(deliveryId());
  const unauthenticated = await json(route, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(value) });
  assert.equal(unauthenticated.response.status, 401);
  const wrongMachine = await post("Doss", value);
  assert.equal(wrongMachine.response.status, 403);
  assert.equal(wrongMachine.body.error, "SPANZEE_BRIDGE_WRITER_REQUIRED");
});

test("crew bridge is ordered, idempotent, identity-bound, and terminal only on receipt", async () => {
  const delivery = deliveryId();
  const queuedEvent = event(delivery);
  const queued = await post("Spanzee", queuedEvent);
  assert.equal(queued.response.status, 200);
  assert.equal(queued.body.delivery.phase, "QUEUED");
  assert.equal(queued.body.delivery.terminal, false);

  const replay = await post("Spanzee", queuedEvent);
  assert.equal(replay.response.status, 200);
  assert.equal(replay.body.idempotent, true);
  assert.equal(replay.body.delivery.events.length, 1);

  const conflictingId = await post("Spanzee", { ...queuedEvent, notice_sha256: sha("9") });
  assert.equal(conflictingId.response.status, 409);
  assert.equal(conflictingId.body.error, "BRIDGE_EVENT_ID_CONFLICT");

  const skipped = await post("Spanzee", event(delivery, "SENT", 2));
  assert.equal(skipped.response.status, 409);
  assert.equal(skipped.body.error, "BRIDGE_PHASE_TRANSITION_INVALID");

  const identityDrift = await post("Spanzee", event(delivery, "SESSION_FOUND", 2, { source_commit: "e".repeat(40) }));
  assert.equal(identityDrift.response.status, 409);
  assert.equal(identityDrift.body.error, "BRIDGE_DELIVERY_IDENTITY_MISMATCH");

  const phases = ["SESSION_FOUND", "VISUALLY_CONFIRMED", "AWAITING_SEND_CONFIRMATION", "SENT", "ACKNOWLEDGED", "ARTIFACT_WRITTEN", "RECEIPTED"];
  for (const [index, phase] of phases.entries()) {
    const result = await post("Spanzee", event(delivery, phase, index + 2));
    assert.equal(result.response.status, 200, JSON.stringify(result.body));
    assert.equal(result.body.delivery.phase, phase);
    assert.equal(result.body.delivery.terminal, phase === "RECEIPTED");
    if (["SENT", "ACKNOWLEDGED", "ARTIFACT_WRITTEN"].includes(phase)) assert.equal(result.body.delivery.terminal, false);
  }

  const rewrite = await post("Spanzee", event(delivery, "BLOCKED", 9));
  assert.equal(rewrite.response.status, 409);
  assert.equal(rewrite.body.error, "BRIDGE_DELIVERY_ALREADY_TERMINAL");
});

test("event identifiers are globally unique across deliveries", async () => {
  const sharedEventId = eventId();
  assert.equal((await post("Spanzee", event(deliveryId(), "QUEUED", 1, { event_id: sharedEventId }))).response.status, 200);
  const collision = await post("Spanzee", event(deliveryId(), "QUEUED", 1, { event_id: sharedEventId }));
  assert.equal(collision.response.status, 409);
  assert.equal(collision.body.error, "BRIDGE_EVENT_ID_CONFLICT");
});

test("crew bridge rejects path escape, raw transcript-shaped proof, and invalid first state", async () => {
  const escaped = await post("Spanzee", event(deliveryId(), "QUEUED", 1, { bird_path: "../secrets.txt" }));
  assert.equal(escaped.response.status, 400);
  assert.equal(escaped.body.error, "BRIDGE_BIRD_PATH_INVALID");

  const transcript = event(deliveryId());
  transcript.proof = { source: "FLOCK_LOG", transcript: "raw Cowork contents" };
  const raw = await post("Spanzee", transcript);
  assert.equal(raw.response.status, 400);
  assert.equal(raw.body.error, "BRIDGE_PROOF_FIELDS_INVALID");

  const topLevelTranscript = event(deliveryId());
  topLevelTranscript.transcript = "raw Cowork contents";
  const topLevelRaw = await post("Spanzee", topLevelTranscript);
  assert.equal(topLevelRaw.response.status, 400);
  assert.equal(topLevelRaw.body.error, "BRIDGE_EVENT_FIELDS_INVALID");

  const wrongRepository = await post("Spanzee", event(deliveryId(), "QUEUED", 1, { source_repository: "benleakwerkles/Werkles" }));
  assert.equal(wrongRepository.response.status, 400);
  assert.equal(wrongRepository.body.error, "BRIDGE_SOURCE_REPOSITORY_INVALID");

  const invalidFirst = await post("Spanzee", event(deliveryId(), "SESSION_FOUND", 1));
  assert.equal(invalidFirst.response.status, 409);
  assert.equal(invalidFirst.body.error, "BRIDGE_QUEUED_EVENT_REQUIRED");
});

test("crew bridge serializes a same-sequence race and accepts a structured blocker", async () => {
  const delivery = deliveryId();
  assert.equal((await post("Spanzee", event(delivery))).response.status, 200);
  const contenders = await Promise.all([
    post("Spanzee", event(delivery, "SESSION_FOUND", 2)),
    postAt(secondaryBase, "Spanzee", event(delivery, "SESSION_FOUND", 2))
  ]);
  assert.deepEqual(contenders.map((result) => result.response.status).sort(), [200, 409]);

  const blockedDelivery = deliveryId();
  assert.equal((await post("Spanzee", event(blockedDelivery))).response.status, 200);
  const blocked = await post("Spanzee", event(blockedDelivery, "BLOCKED", 2));
  assert.equal(blocked.response.status, 200);
  assert.equal(blocked.body.delivery.phase, "BLOCKED");
  assert.equal(blocked.body.delivery.terminal, true);
  assert.equal(blocked.body.delivery.events.at(-1).proof.blocker_code, "FIXTURE_BLOCKER");

  const invalidBlockerDelivery = deliveryId();
  assert.equal((await post("Spanzee", event(invalidBlockerDelivery))).response.status, 200);
  const invalidBlocker = await post("Spanzee", event(invalidBlockerDelivery, "BLOCKED", 2, { proof: { blocker_code: "FIXTURE_BLOCKER", blocked_stage: "SENT" } }));
  assert.equal(invalidBlocker.response.status, 409);
  assert.equal(invalidBlocker.body.error, "BRIDGE_BLOCKED_STAGE_INVALID");
});

test("confirmation expiry and audit offsets are enforced at transition time", async () => {
  const expiredAtIntake = event(deliveryId(), "AWAITING_SEND_CONFIRMATION", 4);
  expiredAtIntake.observed_at = new Date(Date.now() - 120_000).toISOString();
  expiredAtIntake.proof.confirmation_expires_at = new Date(Date.now() - 60_000).toISOString();
  const expired = await post("Spanzee", expiredAtIntake);
  assert.equal(expired.response.status, 400);
  assert.equal(expired.body.error, "BRIDGE_CONFIRMATION_EXPIRED");

  const expiryDelivery = deliveryId();
  for (const [index, phase] of ["QUEUED", "SESSION_FOUND", "VISUALLY_CONFIRMED"].entries()) {
    assert.equal((await post("Spanzee", event(expiryDelivery, phase, index + 1))).response.status, 200);
  }
  const awaiting = event(expiryDelivery, "AWAITING_SEND_CONFIRMATION", 4);
  awaiting.proof.confirmation_expires_at = new Date(Date.now() + 250).toISOString();
  assert.equal((await post("Spanzee", awaiting)).response.status, 200);
  await new Promise((resolve) => setTimeout(resolve, 300));
  const sentAfterExpiry = await post("Spanzee", event(expiryDelivery, "SENT", 5));
  assert.equal(sentAfterExpiry.response.status, 409);
  assert.equal(sentAfterExpiry.body.error, "BRIDGE_CONFIRMATION_EXPIRED");

  const offsetDelivery = deliveryId();
  for (const [index, phase] of ["QUEUED", "SESSION_FOUND", "VISUALLY_CONFIRMED", "AWAITING_SEND_CONFIRMATION"].entries()) {
    assert.equal((await post("Spanzee", event(offsetDelivery, phase, index + 1))).response.status, 200);
  }
  const badSent = await post("Spanzee", event(offsetDelivery, "SENT", 5, { proof: { audit_message_sha256: sha("5"), audit_message_offset: 99 } }));
  assert.equal(badSent.response.status, 409);
  assert.equal(badSent.body.error, "BRIDGE_AUDIT_OFFSET_INVALID");
  assert.equal((await post("Spanzee", event(offsetDelivery, "SENT", 5))).response.status, 200);
  const badAck = await post("Spanzee", event(offsetDelivery, "ACKNOWLEDGED", 6, { proof: { ack_sha256: sha("6"), audit_ack_offset: 200 } }));
  assert.equal(badAck.response.status, 409);
  assert.equal(badAck.body.error, "BRIDGE_AUDIT_OFFSET_INVALID");
});

test("public projection strips unknown ledger fields and fails closed on proof tampering", async () => {
  const delivery = deliveryId();
  assert.equal((await post("Spanzee", event(delivery))).response.status, 200);
  const file = path.join(workspace, "data", "harvey", "crew-bridge", "deliveries", `${delivery}.json`);
  const original = await fs.readFile(file, "utf8");
  try {
    const withUnknown = JSON.parse(original);
    withUnknown.private_canary = "PRIVATE_LEDGER_CANARY";
    withUnknown.hostname = "FORGED";
    await fs.writeFile(file, `${JSON.stringify(withUnknown, null, 2)}\n`, "utf8");
    const stripped = await json(route);
    assert.equal(stripped.response.status, 200);
    assert.equal(JSON.stringify(stripped.body).includes("PRIVATE_LEDGER_CANARY"), false);
    assert.equal(stripped.body.deliveries.find((item) => item.delivery_id === delivery).hostname, "SPANZEE");

    const withEventTranscript = JSON.parse(original);
    withEventTranscript.events[0].transcript = "PRIVATE_EVENT_CANARY";
    await fs.writeFile(file, `${JSON.stringify(withEventTranscript, null, 2)}\n`, "utf8");
    const rejectedEvent = await json(route);
    assert.equal(rejectedEvent.response.status, 500);
    assert.equal(rejectedEvent.body.error, "BRIDGE_LEDGER_CORRUPT");
    assert.equal(JSON.stringify(rejectedEvent.body).includes("PRIVATE_EVENT_CANARY"), false);

    const withReceiptTimeTamper = JSON.parse(original);
    withReceiptTimeTamper.events[0].received_at = new Date(Date.parse(withReceiptTimeTamper.events[0].received_at) + 1000).toISOString();
    await fs.writeFile(file, `${JSON.stringify(withReceiptTimeTamper, null, 2)}\n`, "utf8");
    const rejectedReceiptTime = await json(route);
    assert.equal(rejectedReceiptTime.response.status, 500);
    assert.equal(rejectedReceiptTime.body.error, "BRIDGE_LEDGER_CORRUPT");

    const withTranscript = JSON.parse(original);
    withTranscript.events[0].proof.transcript = "PRIVATE_TRANSCRIPT_CANARY";
    await fs.writeFile(file, `${JSON.stringify(withTranscript, null, 2)}\n`, "utf8");
    const rejected = await json(route);
    assert.equal(rejected.response.status, 500);
    assert.equal(rejected.body.error, "BRIDGE_LEDGER_CORRUPT");
    assert.equal(JSON.stringify(rejected.body).includes("PRIVATE_TRANSCRIPT_CANARY"), false);
  } finally {
    await fs.writeFile(file, original, "utf8");
  }
});

test("readback rejects an internally rehashed ledger with impossible cross-event evidence", async () => {
  const delivery = deliveryId();
  for (const [index, phase] of ["QUEUED", "SESSION_FOUND", "VISUALLY_CONFIRMED", "AWAITING_SEND_CONFIRMATION", "SENT"].entries()) {
    assert.equal((await post("Spanzee", event(delivery, phase, index + 1))).response.status, 200);
  }
  const file = path.join(workspace, "data", "harvey", "crew-bridge", "deliveries", `${delivery}.json`);
  const original = await fs.readFile(file, "utf8");
  try {
    const impossible = JSON.parse(original);
    impossible.events[4].proof.audit_message_offset = 1;
    rehashStoredEvents(impossible);
    await fs.writeFile(file, `${JSON.stringify(impossible, null, 2)}\n`, "utf8");
    const rejected = await json(route);
    assert.equal(rejected.response.status, 500);
    assert.equal(rejected.body.error, "BRIDGE_LEDGER_CORRUPT");
  } finally {
    await fs.writeFile(file, original, "utf8");
  }
});

test("crew bridge ledger root cannot be redirected outside the isolated workspace", async () => {
  const root = path.join(workspace, "data", "harvey", "crew-bridge", "deliveries");
  const backup = `${root}-backup-${randomUUID()}`;
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), "harvey-crew-bridge-outside-"));
  await fs.mkdir(path.dirname(root), { recursive: true });
  await fs.rename(root, backup);
  try {
    await fs.symlink(outside, root, "junction");
    const read = await json(route);
    assert.equal(read.response.status, 500);
    assert.equal(read.body.error, "BRIDGE_LEDGER_PATH_INVALID");
    const write = await post("Spanzee", event(deliveryId()));
    assert.equal(write.response.status, 500);
    assert.equal(write.body.error, "BRIDGE_LEDGER_PATH_INVALID");
    assert.deepEqual(await fs.readdir(outside), []);
  } finally {
    await fs.unlink(root).catch(() => undefined);
    await fs.rename(backup, root);
    await fs.rm(outside, { recursive: true, force: true });
  }
});
