import assert from "node:assert/strict";
import test from "node:test";
import { buildHarveySnapshot } from "../../../lib/harvey/snapshot.ts";

const now = Date.parse("2026-07-14T05:00:00.000Z");
const identities = {
  Doss: { hostname: "DOSS", agent_id: "handeye-doss-doss" },
  Betsy: { hostname: "BETSY", agent_id: "handeye-betsy-betsy" },
  Spanzee: { hostname: "SPANZEE", agent_id: "handeye-spanzee-spanzee" },
  Medullina: { hostname: "COURTNEY", agent_id: "handeye-medullina-courtney" },
  Sally: { hostname: "SALLY", agent_id: "handeye-sally-sally" }
};
const heartbeat = (machine, ageMs) => ({ machine, ...identities[machine], observed_at: new Date(now - ageMs).toISOString() });
const workstreams = { updated_at: "2026-07-13T00:00:00.000Z", workstreams: [{ id: "harvey-command", name: "Harvey command cockpit", machine: "Doss", status: "ACTIVE_LOCAL_PROOF" }] };

function completedCommand({ commandId, machine = "Doss", terminalAt, workstreamId = "harvey-command" }) {
  const identity = identities[machine];
  const claimId = `${commandId}claim`;
  return {
    command_id: commandId,
    machine,
    workstream_id: workstreamId,
    action: "PING",
    payload: {},
    status: "COMPLETED",
    created_at: new Date(terminalAt - 2_000).toISOString(),
    updated_at: new Date(terminalAt).toISOString(),
    claim: { claim_id: claimId, machine, ...identity, claimed_at: new Date(terminalAt - 1_000).toISOString(), lease_expires_at: new Date(now + 60_000).toISOString(), attempt: 1 },
    receipts: [
      { receipt_id: `${commandId}received`, command_id: commandId, status: "RECEIVED", machine, ...identity, claim_id: claimId, evidence: "received", observed_at: new Date(terminalAt - 1_000).toISOString() },
      { receipt_id: `${commandId}completed`, command_id: commandId, status: "COMPLETED", machine, ...identity, claim_id: claimId, evidence: "completed", observed_at: new Date(terminalAt).toISOString() }
    ]
  };
}

test("snapshot uses canonical machine order and exact heartbeat freshness bands", () => {
  const snapshot = buildHarveySnapshot({
    heartbeats: [
      heartbeat("Medullina", 300_001),
      heartbeat("Doss", 90_000),
      heartbeat("Spanzee", 300_000),
      heartbeat("Betsy", 90_001),
      { machine: "Sally", ...identities.Sally, observed_at: new Date(now + 1).toISOString() }
    ],
    commands: [],
    workstreams
  }, now);
  assert.deepEqual(snapshot.machines.map((machine) => machine.machine), ["Doss", "Betsy", "Spanzee", "Medullina", "Sally"]);
  assert.deepEqual(snapshot.machines.map((machine) => machine.connectivity), ["LIVE", "STALE", "STALE", "DISCONNECTED", "DISCONNECTED"]);
  assert.equal(snapshot.machines.at(-1).heartbeat_error, "HEARTBEAT_TIMESTAMP_INVALID");
  assert.equal(snapshot.degraded, true);
  assert.ok(snapshot.errors.includes("HEARTBEAT_TIMESTAMP_INVALID:Sally"));
});

test("snapshot revision ignores generation time and input order but changes with truth bands and receipts", () => {
  const input = { heartbeats: [heartbeat("Doss", 10_000)], commands: [], workstreams };
  const first = buildHarveySnapshot(input, now);
  const reordered = buildHarveySnapshot({ ...input, heartbeats: [...input.heartbeats].reverse() }, now + 5_000);
  assert.equal(first.revision, reordered.revision);
  assert.notEqual(first.generated_at, reordered.generated_at);
  assert.notEqual(first.machines[0].heartbeat_age_ms, reordered.machines[0].heartbeat_age_ms);

  const boundaryInput = { heartbeats: [heartbeat("Doss", 90_000)], commands: [], workstreams };
  assert.notEqual(buildHarveySnapshot(boundaryInput, now).revision, buildHarveySnapshot(boundaryInput, now + 1).revision);

  const claimId = "snapshotclaim";
  const command = {
    command_id: "harvey_doss_snapshot_contract",
    machine: "Doss",
    workstream_id: "harvey-command",
    action: "PING",
    payload: {},
    status: "COMPLETED",
    created_at: new Date(now - 4_000).toISOString(),
    updated_at: new Date(now - 1_000).toISOString(),
    claim: { claim_id: claimId, machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", claimed_at: new Date(now - 3_000).toISOString(), lease_expires_at: new Date(now + 60_000).toISOString(), attempt: 1 },
    receipts: [
      { receipt_id: "received", command_id: "harvey_doss_snapshot_contract", status: "RECEIVED", machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", claim_id: claimId, evidence: "received", observed_at: new Date(now - 3_000).toISOString() },
      { receipt_id: "completed", command_id: "harvey_doss_snapshot_contract", status: "COMPLETED", machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", claim_id: claimId, evidence: "completed", observed_at: new Date(now - 1_000).toISOString() }
    ]
  };
  const withReceipt = buildHarveySnapshot({ ...input, commands: [command] }, now);
  assert.notEqual(first.revision, withReceipt.revision);
  assert.equal(withReceipt.workstreams[0].execution_status, "COMMAND_COMPLETED");
});

test("terminal receipts never manufacture machine connectivity", () => {
  const claimId = "offlineclaim";
  const command = {
    command_id: "harvey_sally_offline_terminal",
    machine: "Sally",
    workstream_id: "harvey-command",
    action: "PING",
    payload: {},
    status: "BLOCKER",
    created_at: new Date(now - 5_000).toISOString(),
    updated_at: new Date(now - 1_000).toISOString(),
    claim: { claim_id: claimId, machine: "Sally", hostname: "SALLY", agent_id: "handeye-sally-sally", claimed_at: new Date(now - 4_000).toISOString(), lease_expires_at: new Date(now + 60_000).toISOString(), attempt: 1 },
    receipts: [
      { receipt_id: "offline-received", command_id: "harvey_sally_offline_terminal", status: "RECEIVED", machine: "Sally", hostname: "SALLY", agent_id: "handeye-sally-sally", claim_id: claimId, evidence: "received", observed_at: new Date(now - 4_000).toISOString() },
      { receipt_id: "offline-blocker", command_id: "harvey_sally_offline_terminal", status: "BLOCKER", machine: "Sally", hostname: "SALLY", agent_id: "handeye-sally-sally", claim_id: claimId, evidence: "blocked", observed_at: new Date(now - 1_000).toISOString() }
    ]
  };
  const snapshot = buildHarveySnapshot({ heartbeats: [], commands: [command], workstreams }, now);
  assert.equal(snapshot.machines.find((machine) => machine.machine === "Sally").connectivity, "DISCONNECTED");
});

test("heartbeat actor binding fails closed", () => {
  const snapshot = buildHarveySnapshot({
    heartbeats: [{ machine: "Doss", hostname: "SALLY", agent_id: "handeye-sally-sally", observed_at: new Date(now - 1_000).toISOString() }],
    commands: [],
    workstreams
  }, now);
  assert.equal(snapshot.machines[0].connectivity, "DISCONNECTED");
  assert.equal(snapshot.machines[0].heartbeat_error, "HEARTBEAT_IDENTITY_INVALID");
  assert.ok(snapshot.errors.includes("HEARTBEAT_IDENTITY_INVALID:Doss"));
});

test("receipt freshness boundaries are exact and revision changes at band transitions", () => {
  const at = (ageMs) => buildHarveySnapshot({ commands: [completedCommand({ commandId: "freshnessproof", terminalAt: now - ageMs })], workstreams }, now);
  const freshBoundary = at(30 * 60 * 1000);
  const agingStart = at(30 * 60 * 1000 + 1);
  const agingBoundary = at(120 * 60 * 1000);
  const staleStart = at(120 * 60 * 1000 + 1);
  assert.equal(freshBoundary.workstreams[0].receipt_freshness, "FRESH");
  assert.equal(agingStart.workstreams[0].receipt_freshness, "AGING");
  assert.equal(agingBoundary.workstreams[0].receipt_freshness, "AGING");
  assert.equal(staleStart.workstreams[0].receipt_freshness, "STALE");
  assert.notEqual(freshBoundary.revision, agingStart.revision);
  assert.notEqual(agingBoundary.revision, staleStart.revision);
});

test("multi-element heartbeat and command input order cannot change the snapshot", () => {
  const heartbeats = [heartbeat("Spanzee", 25_000), heartbeat("Doss", 10_000), heartbeat("Betsy", 20_000)];
  const commands = [
    completedCommand({ commandId: "orderproofdoss", machine: "Doss", terminalAt: now - 2_000 }),
    completedCommand({ commandId: "orderproofspanzee", machine: "Spanzee", terminalAt: now - 3_000, workstreamId: "spanzee-work" })
  ];
  const report = { ...workstreams, workstreams: [...workstreams.workstreams, { id: "spanzee-work", name: "Spanzee work", machine: "Spanzee", status: "ACTIVE_OPERATOR_REPORTED" }] };
  const forward = buildHarveySnapshot({ heartbeats, commands, workstreams: report }, now);
  const reversed = buildHarveySnapshot({ heartbeats: [...heartbeats].reverse(), commands: [...commands].reverse(), workstreams: { ...report, workstreams: [...report.workstreams].reverse() } }, now);
  assert.equal(forward.revision, reversed.revision);
  assert.deepEqual(forward.machines, reversed.machines);
  assert.deepEqual(forward.workstreams, reversed.workstreams);
});
