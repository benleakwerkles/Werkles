import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";
import { createCommand, updateCommand, workspace } from "./harvey-test-client.mjs";

test("command lifecycle binds terminal receipt to the active claim lease", async () => {
  const created = await createCommand("Betsy");
  assert.equal(created.response.status, 200);
  assert.equal(created.body.command.status, "QUEUED");
  assert.deepEqual(created.body.command.receipts, []);

  const commandId = created.body.command.command_id;
  const claimed = await updateCommand("Betsy", {
    command_id: commandId,
    status: "RECEIVED",
    evidence: "Betsy accepted the command"
  });
  assert.equal(claimed.response.status, 200);
  assert.equal(claimed.body.command.status, "RECEIVED");
  assert.match(claimed.body.command.claim.claim_id, /^[a-f0-9]{32}$/);
  assert.equal(claimed.body.command.receipts.at(-1).status, "RECEIVED");
  const claimId = claimed.body.command.claim.claim_id;

  const missingLease = await updateCommand("Betsy", {
    command_id: commandId,
    status: "COMPLETED",
    evidence: "missing lease"
  });
  assert.equal(missingLease.response.status, 409);
  assert.equal(missingLease.body.error, "COMMAND_CLAIM_MISMATCH");

  const completed = await updateCommand("Betsy", {
    command_id: commandId,
    status: "COMPLETED",
    claim_id: claimId,
    evidence: "Betsy completed the command"
  });
  assert.equal(completed.response.status, 200);
  assert.equal(completed.body.command.status, "COMPLETED");
  assert.deepEqual(completed.body.command.receipts.map((receipt) => receipt.status), ["RECEIVED", "COMPLETED"]);
  assert.ok(completed.body.command.receipts.every((receipt) => receipt.command_id === commandId));
  assert.ok(completed.body.command.receipts.every((receipt) => receipt.machine === "Betsy"));
  assert.ok(completed.body.command.receipts.every((receipt) => receipt.claim_id === claimId));

  const terminalRewrite = await updateCommand("Betsy", {
    command_id: commandId,
    status: "BLOCKER",
    claim_id: claimId,
    evidence: "rewrite"
  });
  assert.equal(terminalRewrite.response.status, 409);
  assert.equal(terminalRewrite.body.error, "COMMAND_ALREADY_TERMINAL");
});

test("expired claims require an explicit reclaim and issue a new lease", async () => {
  const created = await createCommand("Medullina");
  const commandId = created.body.command.command_id;
  const first = await updateCommand("Medullina", {
    command_id: commandId,
    status: "RECEIVED",
    evidence: "first claim"
  });
  assert.equal(first.response.status, 200);
  const firstClaim = first.body.command.claim.claim_id;

  const fixturePath = path.join(workspace, "data", "harvey", "machine-control", "commands", `${commandId}.json`);
  const fixture = JSON.parse(await fs.readFile(fixturePath, "utf8"));
  fixture.claim.lease_expires_at = new Date(Date.now() - 1000).toISOString();
  await fs.writeFile(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
  const terminalAfterExpiry = await updateCommand("Medullina", {
    command_id: commandId,
    status: "COMPLETED",
    claim_id: firstClaim,
    evidence: "too late"
  });
  assert.equal(terminalAfterExpiry.response.status, 409);
  assert.equal(terminalAfterExpiry.body.error, "COMMAND_CLAIM_EXPIRED");

  const implicitReclaim = await updateCommand("Medullina", {
    command_id: commandId,
    status: "RECEIVED",
    evidence: "implicit reclaim"
  });
  assert.equal(implicitReclaim.response.status, 409);
  assert.equal(implicitReclaim.body.error, "COMMAND_CLAIM_EXPIRED_RECLAIM_REQUIRED");

  const reclaimed = await updateCommand("Medullina", {
    command_id: commandId,
    status: "RECEIVED",
    reclaim_expired: true,
    evidence: "explicit reclaim"
  });
  assert.equal(reclaimed.response.status, 200);
  assert.notEqual(reclaimed.body.command.claim.claim_id, firstClaim);
  assert.equal(reclaimed.body.command.receipts.filter((receipt) => receipt.status === "RECEIVED").length, 2);
});
