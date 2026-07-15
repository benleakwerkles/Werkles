import assert from "node:assert/strict";
import test from "node:test";
import { buildHarveySnapshot } from "../../../lib/harvey/snapshot.ts";

const now = Date.parse("2026-07-14T06:00:00.000Z");
const workstreams = { updated_at: "2026-07-13T00:00:00.000Z", workstreams: [{ id: "harvey-command", name: "Harvey command cockpit", machine: "Doss", status: "ACTIVE_LOCAL_PROOF", proof: "A prose field says COMPLETED but is only a historical operator report." }] };
const baseCommand = {
  machine: "Doss",
  workstream_id: "harvey-command",
  action: "PING",
  payload: { note: "COMPLETED" },
  created_at: new Date(now - 10_000).toISOString()
};

test("reported status is historical and prose cannot create execution truth", () => {
  const queued = { ...baseCommand, command_id: "snapshot_queued_prose", status: "QUEUED", updated_at: new Date(now - 9_000).toISOString(), receipts: [] };
  const snapshot = buildHarveySnapshot({ heartbeats: [], commands: [queued], workstreams }, now);
  assert.equal(snapshot.workstreams[0].reported_status, "ACTIVE_LOCAL_PROOF");
  assert.equal(snapshot.workstreams[0].execution_status, "UNPROVEN");
  assert.equal(snapshot.workstreams[0].source_kind, "HISTORICAL_OPERATOR_REPORT");
  assert.equal(snapshot.machines[0].connectivity, "DISCONNECTED");
});

test("invalid receipt order is evidence-invalid and a later valid receipt becomes command proof only", () => {
  const invalid = {
    ...baseCommand,
    command_id: "snapshot_invalid_terminal",
    status: "COMPLETED",
    updated_at: new Date(now - 8_000).toISOString(),
    claim: { claim_id: "invalidclaim", machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", claimed_at: new Date(now - 9_000).toISOString(), lease_expires_at: new Date(now + 60_000).toISOString(), attempt: 1 },
    receipts: [{ receipt_id: "invalid-terminal", command_id: "snapshot_invalid_terminal", status: "COMPLETED", machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", claim_id: "invalidclaim", evidence: "terminal without received", observed_at: new Date(now - 8_000).toISOString() }]
  };
  const invalidSnapshot = buildHarveySnapshot({ heartbeats: [], commands: [invalid], workstreams }, now);
  assert.equal(invalidSnapshot.workstreams[0].execution_status, "EVIDENCE_INVALID");
  assert.ok(invalidSnapshot.errors.includes("COMMAND_EVIDENCE_INVALID:snapshot_invalid_terminal"));

  const valid = {
    ...baseCommand,
    command_id: "snapshot_valid_terminal",
    status: "COMPLETED",
    updated_at: new Date(now - 1_000).toISOString(),
    claim: { claim_id: "validclaim", machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", claimed_at: new Date(now - 2_000).toISOString(), lease_expires_at: new Date(now + 60_000).toISOString(), attempt: 1 },
    receipts: [
      { receipt_id: "valid-received", command_id: "snapshot_valid_terminal", status: "RECEIVED", machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", claim_id: "validclaim", evidence: "received", observed_at: new Date(now - 2_000).toISOString() },
      { receipt_id: "valid-completed", command_id: "snapshot_valid_terminal", status: "COMPLETED", machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", claim_id: "validclaim", evidence: "completed", observed_at: new Date(now - 1_000).toISOString() }
    ]
  };
  const validSnapshot = buildHarveySnapshot({ heartbeats: [], commands: [invalid, valid], workstreams }, now);
  assert.equal(validSnapshot.workstreams[0].execution_status, "COMMAND_COMPLETED");
  assert.equal(validSnapshot.workstreams[0].receipt_freshness, "FRESH");
  assert.equal(validSnapshot.workstreams[0].latest_command_id, valid.command_id);
  assert.equal(validSnapshot.machines[0].connectivity, "DISCONNECTED");
});

test("reclaimed command history requires one abandoned RECEIVED group per prior attempt", () => {
  const valid = {
    ...baseCommand,
    command_id: "snapshot_reclaimed_history",
    status: "COMPLETED",
    updated_at: new Date(now - 1_000).toISOString(),
    claim: { claim_id: "currentclaim", machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", claimed_at: new Date(now - 4_000).toISOString(), lease_expires_at: new Date(now + 60_000).toISOString(), attempt: 2 },
    receipts: [
      { receipt_id: "prior-received", command_id: "snapshot_reclaimed_history", status: "RECEIVED", machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", claim_id: "priorclaim", evidence: "expired", observed_at: new Date(now - 8_000).toISOString() },
      { receipt_id: "current-received", command_id: "snapshot_reclaimed_history", status: "RECEIVED", machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", claim_id: "currentclaim", evidence: "received", observed_at: new Date(now - 4_000).toISOString() },
      { receipt_id: "current-completed", command_id: "snapshot_reclaimed_history", status: "COMPLETED", machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", claim_id: "currentclaim", evidence: "completed", observed_at: new Date(now - 1_000).toISOString() }
    ]
  };
  assert.equal(buildHarveySnapshot({ commands: [valid], workstreams }, now).workstreams[0].execution_status, "COMMAND_COMPLETED");

  const terminalOnlyHistory = structuredClone(valid);
  terminalOnlyHistory.receipts[0].status = "COMPLETED";
  const terminalSnapshot = buildHarveySnapshot({ commands: [terminalOnlyHistory], workstreams }, now);
  assert.equal(terminalSnapshot.workstreams[0].execution_status, "EVIDENCE_INVALID");

  const inventedAttempt = structuredClone(valid);
  inventedAttempt.claim.attempt = 99;
  const inventedSnapshot = buildHarveySnapshot({ commands: [inventedAttempt], workstreams }, now);
  assert.equal(inventedSnapshot.workstreams[0].execution_status, "EVIDENCE_INVALID");
});

test("claim and receipt actors and chronology must match canonical command evidence", () => {
  const command = {
    ...baseCommand,
    command_id: "snapshot_actor_binding",
    status: "COMPLETED",
    updated_at: new Date(now - 1_000).toISOString(),
    claim: { claim_id: "actorclaim", machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", claimed_at: new Date(now - 3_000).toISOString(), lease_expires_at: new Date(now + 60_000).toISOString(), attempt: 1 },
    receipts: [
      { receipt_id: "actor-received", command_id: "snapshot_actor_binding", status: "RECEIVED", machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", claim_id: "actorclaim", evidence: "received", observed_at: new Date(now - 3_000).toISOString() },
      { receipt_id: "actor-completed", command_id: "snapshot_actor_binding", status: "COMPLETED", machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", claim_id: "actorclaim", evidence: "completed", observed_at: new Date(now - 1_000).toISOString() }
    ]
  };
  const wrongActor = structuredClone(command);
  wrongActor.receipts[1].agent_id = "handeye-sally-sally";
  const actorSnapshot = buildHarveySnapshot({ commands: [wrongActor], workstreams }, now);
  assert.equal(actorSnapshot.workstreams[0].execution_status, "EVIDENCE_INVALID");
  assert.equal(actorSnapshot.machines[0].latest_command.evidence_state, "INVALID");

  const reversed = structuredClone(command);
  reversed.receipts.reverse();
  assert.equal(buildHarveySnapshot({ commands: [reversed], workstreams }, now).workstreams[0].execution_status, "EVIDENCE_INVALID");
});

test("untrusted historical report fields and future timestamps never reach the public projection", () => {
  const marker = "FAKE_SECRET_C:\\Courtney\\game";
  const hostile = {
    updated_at: new Date(now + 1).toISOString(),
    workstreams: [{ id: "harvey-command", name: marker, machine: "COURTNEY", status: marker, evidence: marker }]
  };
  const snapshot = buildHarveySnapshot({ workstreams: hostile }, now);
  const serialized = JSON.stringify(snapshot);
  assert.equal(snapshot.workstreams[0].name, "UNTRUSTED WORKSTREAM");
  assert.equal(snapshot.workstreams[0].reported_status, "UNTRUSTED_REPORT");
  assert.equal(snapshot.workstreams[0].reported_updated_at, null);
  assert.equal(snapshot.workstreams[0].machine, "UNASSIGNED");
  assert.equal(serialized.includes(marker), false);
  assert.ok(snapshot.errors.includes("WORKSTREAM_REPORT_TIMESTAMP_INVALID"));
});
