import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";
import { base, createCommand, json, updateCommand, workspace } from "./harvey-test-client.mjs";

test("fleet KNOCK remains nonterminal until every addressed machine is terminal", async () => {
  const created = await json("/api/harvey/commands", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" },
    body: JSON.stringify({ machines: ["Doss", "Sally"], action: "KNOCK", payload: {} })
  });
  assert.equal(created.response.status, 200);
  assert.equal(created.body.commands.length, 2);
  assert.match(created.body.fleet.fleet_id, /^harvey_fleet_/);
  assert.equal(created.body.fleet.terminal, false);
  const [doss, sally] = created.body.commands;

  const dossClaim = await updateCommand("Doss", { command_id: doss.command_id, status: "RECEIVED", evidence: "Doss received" });
  const dossDone = await updateCommand("Doss", {
    command_id: doss.command_id,
    status: "COMPLETED",
    claim_id: dossClaim.body.command.claim.claim_id,
    evidence: "Doss done"
  });
  assert.equal(dossDone.response.status, 200);

  const partialResponse = await fetch(`${base}/api/harvey/commands?fleet_id=${encodeURIComponent(created.body.fleet.fleet_id)}`);
  const partial = await partialResponse.json();
  assert.equal(partial.fleet.terminal, false);
  assert.equal(partial.fleet.status, "RECEIVED");
  assert.equal(partial.fleet.terminal_count, 1);
  assert.equal(partial.fleet.completed_count, 1);
  assert.equal(partial.fleet.blocker_count, 0);
  assert.equal(partial.fleet.pending_count, 1);

  const sallyClaim = await updateCommand("Sally", { command_id: sally.command_id, status: "RECEIVED", evidence: "Sally received" });
  const sallyBlocked = await updateCommand("Sally", {
    command_id: sally.command_id,
    status: "BLOCKER",
    claim_id: sallyClaim.body.command.claim.claim_id,
    evidence: "Sally blocker"
  });
  assert.equal(sallyBlocked.response.status, 200);

  const terminalResponse = await fetch(`${base}/api/harvey/commands?fleet_id=${encodeURIComponent(created.body.fleet.fleet_id)}`);
  const terminal = await terminalResponse.json();
  assert.equal(terminal.fleet.terminal, true);
  assert.equal(terminal.fleet.status, "BLOCKER");
  assert.equal(terminal.fleet.terminal_count, 2);
  assert.equal(terminal.fleet.completed_count, 1);
  assert.equal(terminal.fleet.blocker_count, 1);
  assert.equal(terminal.fleet.pending_count, 0);

  const commandDirectory = path.join(workspace, "data", "harvey", "machine-control", "commands");
  const retentionIds = Array.from({ length: 260 }, (_, index) => `fleet_retention_doss_${String(index).padStart(3, "0")}`);
  let retentionTriggerId;
  try {
    for (const [index, commandId] of retentionIds.entries()) {
      const timestamp = new Date(Date.now() + (index + 1) * 1000).toISOString();
      await fs.writeFile(path.join(commandDirectory, `${commandId}.json`), `${JSON.stringify({
        command_id: commandId,
        machine: "Doss",
        action: "PING",
        payload: {},
        status: "COMPLETED",
        created_at: timestamp,
        updated_at: timestamp,
        receipts: []
      })}\n`, "utf8");
    }

    const retentionTrigger = await createCommand("Doss");
    assert.equal(retentionTrigger.response.status, 200);
    retentionTriggerId = retentionTrigger.body.command.command_id;
    await assert.rejects(fs.stat(path.join(commandDirectory, `${doss.command_id}.json`)), { code: "ENOENT" });

    const retainedResponse = await fetch(`${base}/api/harvey/commands?fleet_id=${encodeURIComponent(created.body.fleet.fleet_id)}`);
    const retained = await retainedResponse.json();
    assert.equal(retainedResponse.status, 200);
    assert.equal(retained.fleet.addressed_count, 2);
    assert.equal(retained.fleet.terminal, true);
    assert.equal(retained.fleet.status, "BLOCKER");
    assert.equal(retained.fleet.terminal_count, 2);
    assert.equal(retained.fleet.completed_count, 1);
    assert.equal(retained.fleet.blocker_count, 1);
    assert.equal(retained.fleet.pending_count, 0);
    assert.deepEqual(retained.fleet.commands.map((command) => command.machine).sort(), ["Doss", "Sally"]);
  } finally {
    await Promise.all(retentionIds.map((commandId) => fs.unlink(path.join(commandDirectory, `${commandId}.json`)).catch(() => undefined)));
    if (retentionTriggerId) await fs.unlink(path.join(commandDirectory, `${retentionTriggerId}.json`)).catch(() => undefined);
  }
});

test("fleet creation fails without partial commands when one addressed machine is at capacity", async () => {
  const directory = path.join(workspace, "data", "harvey", "machine-control", "commands");
  const capacityIds = Array.from({ length: 64 }, (_, index) => `fleet_capacity_betsy_${String(index).padStart(2, "0")}`);
  const before = await json("/api/harvey/commands?machine=Doss");
  try {
    for (const commandId of capacityIds) {
      const timestamp = new Date().toISOString();
      await fs.writeFile(path.join(directory, `${commandId}.json`), `${JSON.stringify({
        command_id: commandId,
        machine: "Betsy",
        action: "PING",
        payload: {},
        status: "QUEUED",
        created_at: timestamp,
        updated_at: timestamp,
        receipts: []
      })}\n`, "utf8");
    }
    const attempt = await json("/api/harvey/commands", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" },
      body: JSON.stringify({ machines: ["Doss", "Betsy"], action: "KNOCK", payload: {} })
    });
    assert.equal(attempt.response.status, 429);
    assert.equal(attempt.body.error, "ACTIVE_COMMAND_CAPACITY_EXCEEDED");
    const after = await json("/api/harvey/commands?machine=Doss");
    assert.equal(after.body.commands.length, before.body.commands.length);
  } finally {
    await Promise.all(capacityIds.map((commandId) => fs.unlink(path.join(directory, `${commandId}.json`)).catch(() => undefined)));
  }
});

test("terminal fleet-ledger retention is bounded while active fleets are preserved", async () => {
  const fleetDirectory = path.join(workspace, "data", "harvey", "machine-control", "fleets");
  const commandDirectory = path.join(workspace, "data", "harvey", "machine-control", "commands");
  const terminalFleetIds = Array.from({ length: 260 }, (_, index) => `harvey_fleet_retention_${String(index).padStart(3, "0")}`);
  const activeFleetId = "harvey_fleet_retention_active";
  const agedFleetId = "harvey_fleet_retention_aged";
  let triggerFleetId;
  let triggerCommandId;
  const ledger = (fleetId, status, updatedAt) => ({
    schema: "werkles.harvey-fleet-ledger/v1",
    fleet_id: fleetId,
    action: "KNOCK",
    created_at: updatedAt,
    updated_at: updatedAt,
    members: [{ command_id: `${fleetId}_command`, machine: "Doss", status, updated_at: updatedAt }]
  });

  try {
    for (const [index, fleetId] of terminalFleetIds.entries()) {
      const updatedAt = new Date(Date.now() - (index + 1) * 1000).toISOString();
      await fs.writeFile(path.join(fleetDirectory, `${fleetId}.json`), `${JSON.stringify(ledger(fleetId, "COMPLETED", updatedAt))}\n`, "utf8");
    }
    const oldActive = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const oldTerminal = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    await fs.writeFile(path.join(fleetDirectory, `${activeFleetId}.json`), `${JSON.stringify(ledger(activeFleetId, "QUEUED", oldActive))}\n`, "utf8");
    await fs.writeFile(path.join(fleetDirectory, `${agedFleetId}.json`), `${JSON.stringify(ledger(agedFleetId, "BLOCKER", oldTerminal))}\n`, "utf8");

    const created = await json("/api/harvey/commands", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" },
      body: JSON.stringify({ machines: ["Doss"], action: "KNOCK", payload: {} })
    });
    assert.equal(created.response.status, 200);
    triggerFleetId = created.body.fleet.fleet_id;
    triggerCommandId = created.body.commands[0].command_id;
    const claim = await updateCommand("Doss", { command_id: triggerCommandId, status: "RECEIVED", evidence: "retention trigger claimed" });
    const completed = await updateCommand("Doss", {
      command_id: triggerCommandId,
      status: "COMPLETED",
      claim_id: claim.body.command.claim.claim_id,
      evidence: "retention trigger completed"
    });
    assert.equal(completed.response.status, 200);

    const names = (await fs.readdir(fleetDirectory)).filter((name) => name.endsWith(".json"));
    const ledgers = await Promise.all(names.map(async (name) => JSON.parse(await fs.readFile(path.join(fleetDirectory, name), "utf8"))));
    const terminalCount = ledgers.filter((item) => item.members.length > 0 && item.members.every((member) => ["COMPLETED", "BLOCKER"].includes(member.status))).length;
    assert.ok(terminalCount <= 256);
    assert.equal(await fs.stat(path.join(fleetDirectory, `${activeFleetId}.json`)).then(() => true), true);
    assert.equal(await fs.stat(path.join(fleetDirectory, `${triggerFleetId}.json`)).then(() => true), true);
    await assert.rejects(fs.stat(path.join(fleetDirectory, `${agedFleetId}.json`)), { code: "ENOENT" });
  } finally {
    const cleanupFleetIds = [...terminalFleetIds, activeFleetId, agedFleetId, ...(triggerFleetId ? [triggerFleetId] : [])];
    await Promise.all(cleanupFleetIds.map((fleetId) => fs.unlink(path.join(fleetDirectory, `${fleetId}.json`)).catch(() => undefined)));
    if (triggerCommandId) await fs.unlink(path.join(commandDirectory, `${triggerCommandId}.json`)).catch(() => undefined);
  }
});
