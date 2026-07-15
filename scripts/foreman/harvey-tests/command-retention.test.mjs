import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";
import { createCommand, updateCommand, workspace } from "./harvey-test-client.mjs";

const commandDirectory = path.join(workspace, "data", "harvey", "machine-control", "commands");

function fixtureCommand(commandId, machine, status, timestamp) {
  return {
    command_id: commandId,
    machine,
    action: "PING",
    payload: {},
    status,
    created_at: timestamp,
    updated_at: timestamp,
    receipts: []
  };
}

async function writeFixture(command) {
  await fs.writeFile(path.join(commandDirectory, `${command.command_id}.json`), `${JSON.stringify(command)}\n`, "utf8");
}

test("terminal retention is bounded and never removes active commands", async () => {
  await fs.mkdir(commandDirectory, { recursive: true });
  const oldId = "retention_old_sally";
  await writeFixture(fixtureCommand(oldId, "Sally", "COMPLETED", "2020-01-01T00:00:00.000Z"));
  for (let index = 0; index < 260; index += 1) {
    const timestamp = new Date(Date.now() - index * 1000).toISOString();
    await writeFixture(fixtureCommand(`retention_terminal_sally_${String(index).padStart(3, "0")}`, "Sally", "COMPLETED", timestamp));
  }
  const activeId = "retention_active_sally";
  await writeFixture(fixtureCommand(activeId, "Sally", "QUEUED", new Date().toISOString()));

  const created = await createCommand("Sally", "PING");
  assert.equal(created.response.status, 200);
  const names = (await fs.readdir(commandDirectory)).filter((name) => name.endsWith(".json"));
  const commands = await Promise.all(names.map(async (name) => JSON.parse(await fs.readFile(path.join(commandDirectory, name), "utf8"))));
  const sallyTerminal = commands.filter((command) => command.machine === "Sally" && ["COMPLETED", "BLOCKER"].includes(command.status));
  assert.ok(sallyTerminal.length <= 256, `terminal count ${sallyTerminal.length}`);
  assert.ok(commands.some((command) => command.command_id === activeId));
  assert.equal(commands.some((command) => command.command_id === oldId), false);
});

test("receipt evidence and active command capacity fail closed", async () => {
  const evidenceCommand = await createCommand("Betsy", "PING");
  const oversized = await updateCommand("Betsy", {
    command_id: evidenceCommand.body.command.command_id,
    status: "RECEIVED",
    evidence: "x".repeat(4097)
  });
  assert.equal(oversized.response.status, 413);
  assert.equal(oversized.body.error, "RECEIPT_EVIDENCE_TOO_LARGE");

  const capacityIds = Array.from({ length: 64 }, (_, index) => `capacity_sally_${String(index).padStart(2, "0")}`);
  try {
    for (const commandId of capacityIds) {
      await writeFixture(fixtureCommand(commandId, "Sally", "QUEUED", new Date().toISOString()));
    }
    const overflow = await createCommand("Sally", "PING");
    assert.equal(overflow.response.status, 429);
    assert.equal(overflow.body.error, "ACTIVE_COMMAND_CAPACITY_EXCEEDED");
  } finally {
    await Promise.all(capacityIds.map((commandId) => fs.unlink(path.join(commandDirectory, `${commandId}.json`)).catch(() => undefined)));
  }
});
