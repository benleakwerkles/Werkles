import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";
import { base, workspace } from "./harvey-test-client.mjs";

test("snapshot API is anonymous, no-store, revision-bound, sanitized, and read-only", async () => {
  const first = await fetch(`${base}/api/harvey/snapshot`, { cache: "no-store" });
  assert.equal(first.status, 200);
  assert.match(first.headers.get("cache-control") ?? "", /no-store/);
  const etag = first.headers.get("etag");
  const body = await first.json();
  assert.equal(body.schema, "werkles.harvey-snapshot/v1");
  assert.equal(etag, `"${body.revision}"`);
  assert.deepEqual(body.machines.map((machine) => machine.machine), ["Doss", "Betsy", "Spanzee", "Medullina", "Sally"]);
  const serialized = JSON.stringify(body);
  for (const forbidden of ["HARVEY_OPERATOR_TOKEN", "HARVEY_AGENT_SECRET", "Authorization", "harvey-test-doss-secret", "harvey-test-sally-secret", "BenLeak", "COURTNEY"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }

  const unchanged = await fetch(`${base}/api/harvey/snapshot`, { headers: { "if-none-match": etag } });
  assert.equal(unchanged.status, 304);
  assert.equal(await unchanged.text(), "");

  const heartbeatFile = path.join(workspace, "data", "harvey", "machine-control", "machines", "sally.json");
  const previousHeartbeat = await fs.readFile(heartbeatFile, "utf8").catch(() => null);
  try {
    await fs.mkdir(path.dirname(heartbeatFile), { recursive: true });
    await fs.writeFile(heartbeatFile, `${JSON.stringify({ machine: "Sally", hostname: "SALLY", agent_id: "handeye-sally-sally", agent_version: "etag-test", capabilities: ["PING"], observed_at: new Date().toISOString() })}\n`, "utf8");
    const changed = await fetch(`${base}/api/harvey/snapshot`, { headers: { "if-none-match": etag }, cache: "no-store" });
    assert.equal(changed.status, 200);
    const changedBody = await changed.json();
    assert.notEqual(changedBody.revision, body.revision);
    assert.notEqual(changed.headers.get("etag"), etag);
  } finally {
    if (previousHeartbeat === null) await fs.unlink(heartbeatFile).catch(() => undefined);
    else await fs.writeFile(heartbeatFile, previousHeartbeat, "utf8");
  }
  const post = await fetch(`${base}/api/harvey/snapshot`, { method: "POST" });
  assert.equal(post.status, 405);
});

test("malformed optional evidence degrades with sanitized codes instead of inventing truth", async () => {
  const commandDirectory = path.join(workspace, "data", "harvey", "machine-control", "commands");
  const commandId = "snapshot_api_invalid_evidence";
  const file = path.join(commandDirectory, `${commandId}.json`);
  await fs.mkdir(commandDirectory, { recursive: true });
  try {
    await fs.writeFile(file, `${JSON.stringify({
      command_id: commandId,
      machine: "Doss",
      workstream_id: "harvey-command",
      action: "PING",
      payload: {},
      status: "COMPLETED",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      receipts: []
    })}\n`, "utf8");
    const response = await fetch(`${base}/api/harvey/snapshot`, { cache: "no-store" });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.degraded, true);
    assert.ok(body.errors.includes(`COMMAND_EVIDENCE_INVALID:${commandId}`));
    assert.equal(JSON.stringify(body).includes(workspace), false);
    assert.equal(body.workstreams.find((item) => item.workstream_id === "harvey-command").execution_status, "EVIDENCE_INVALID");
  } finally {
    await fs.unlink(file).catch(() => undefined);
  }
});
