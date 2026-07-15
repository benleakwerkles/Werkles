import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";
import { base, createCommand, json, secondaryBase, updateCommandAt, workspace } from "./harvey-test-client.mjs";

test("simultaneous cross-process claims have exactly one durable winner", async () => {
  for (let run = 0; run < 6; run += 1) {
    const created = await createCommand("Spanzee", "PING", { race_run: run });
    const commandId = created.body.command.command_id;
    const attempts = await Promise.all(Array.from({ length: 24 }, async (_, index) => {
      const target = index % 2 ? secondaryBase : base;
      const result = await updateCommandAt(target, "Spanzee", {
        command_id: commandId,
        status: "RECEIVED",
        evidence: `claim-${run}-${index}`
      });
      return { ...result, contender: index, server: target };
    }));
    const winners = attempts.filter((attempt) => attempt.response.status === 200);
    const losers = attempts.filter((attempt) => attempt.response.status === 409);
    const unexpected = attempts.filter((attempt) => ![200, 409].includes(attempt.response.status));
    const diagnostics = JSON.stringify(unexpected.map((attempt) => ({ contender: attempt.contender, server: attempt.server, status: attempt.response.status, body: attempt.body })));
    assert.equal(winners.length, 1, diagnostics);
    assert.equal(losers.length, 23, diagnostics);
    assert.ok(losers.every((attempt) => attempt.body.error === "COMMAND_ALREADY_CLAIMED"));
    assert.equal(diagnostics.includes(workspace), false);

    const readback = await json("/api/harvey/commands?machine=Spanzee");
    const durable = readback.body.commands.find((candidate) => candidate.command_id === commandId);
    assert.equal(durable.status, "RECEIVED");
    assert.equal(durable.claim.attempt, 1);
    assert.equal(durable.receipts.filter((receipt) => receipt.status === "RECEIVED").length, 1);
    assert.equal(new Set(durable.receipts.map((receipt) => receipt.claim_id)).size, 1);
  }
});

test("an old lock owned by a live process fails closed instead of being stolen", async () => {
  const created = await createCommand("Betsy");
  const commandId = created.body.command.command_id;
  const commandPath = path.join(workspace, "data", "harvey", "machine-control", "commands", `${commandId}.json`);
  const lockPath = `${commandPath}.lock`;
  const lock = { owner_id: "live-owner-regression", pid: process.pid, created_at: new Date(Date.now() - 60_000).toISOString() };
  await fs.writeFile(lockPath, `${JSON.stringify(lock)}\n`, "utf8");
  const oldTime = new Date(Date.now() - 60_000);
  await fs.utimes(lockPath, oldTime, oldTime);

  try {
    const attempt = await updateCommandAt(base, "Betsy", {
      command_id: commandId,
      status: "RECEIVED",
      evidence: "must not steal a live owner's lock"
    });
    assert.equal(attempt.response.status, 503);
    assert.equal(attempt.body.error, "COMMAND_LOCK_TIMEOUT");

    const readback = await json("/api/harvey/commands?machine=Betsy");
    const command = readback.body.commands.find((candidate) => candidate.command_id === commandId);
    assert.equal(command.status, "QUEUED");
    assert.equal(command.receipts.length, 0);
    assert.equal(JSON.parse(await fs.readFile(lockPath, "utf8")).owner_id, lock.owner_id);
  } finally {
    await fs.unlink(lockPath).catch(() => undefined);
    await fs.unlink(commandPath).catch(() => undefined);
  }
});
