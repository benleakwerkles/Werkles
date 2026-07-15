import assert from "node:assert/strict";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";

const base = process.env.HARVEY_TEST_BASE_URL;
const workspace = process.env.HARVEY_TEST_WORKSPACE;
assert.ok(base, "HARVEY_TEST_BASE_URL is required");
assert.ok(workspace, "HARVEY_TEST_WORKSPACE is required");

async function request(route, init = {}) {
  const response = await fetch(`${base}${route}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers || {}) }
  });
  const body = await response.json();
  return { response, body };
}

function signedMachineHeaders({ method, route, machine, secret, body, timestamp, nonce }) {
  const hostname = machine.toUpperCase();
  const agent = `handeye-${machine.toLowerCase()}-${hostname.toLowerCase()}`;
  const requestTimestamp = timestamp ?? String(Math.floor(Date.now() / 1000));
  const requestNonce = nonce ?? randomUUID().replaceAll("-", "");
  const bodyHash = createHash("sha256").update(body, "utf8").digest("hex");
  const canonical = [method, route, machine, agent, requestTimestamp, requestNonce, bodyHash].join("\n");
  return {
    "x-harvey-machine": machine,
    "x-harvey-agent-id": agent,
    "x-harvey-timestamp": requestTimestamp,
    "x-harvey-nonce": requestNonce,
    "x-harvey-signature": createHmac("sha256", secret).update(canonical, "utf8").digest("hex")
  };
}

test("Harvey write endpoints reject unauthenticated callers", async () => {
  const heartbeat = await request("/api/harvey/machines", {
    method: "POST",
    body: JSON.stringify({ machine: "Doss", hostname: "DOSS", agent_version: "test", capabilities: ["PING"] })
  });
  assert.equal(heartbeat.response.status, 401);

  const command = await request("/api/harvey/commands", {
    method: "POST",
    body: JSON.stringify({ machine: "Doss", action: "PING", payload: {} })
  });
  assert.equal(command.response.status, 401);
});

test("a machine credential cannot create operator commands", async () => {
  const command = await request("/api/harvey/commands", {
    method: "POST",
    headers: { authorization: "Bearer harvey-test-sally-secret" },
    body: JSON.stringify({ machine: "Sally", action: "PING", payload: {} })
  });
  assert.equal(command.response.status, 401);
  assert.equal(command.body.error, "INVALID_OPERATOR_CREDENTIAL");
});

test("Harvey write endpoints reject oversized bodies", async () => {
  const command = await request("/api/harvey/commands", {
    method: "POST",
    headers: { authorization: "Bearer harvey-test-operator-token" },
    body: JSON.stringify({ machine: "Doss", action: "PING", padding: "x".repeat(17 * 1024) })
  });
  assert.equal(command.response.status, 413);
  assert.equal(command.body.error, "REQUEST_BODY_TOO_LARGE");
});

test("Harvey command receipts require an authenticated machine signature", async () => {
  const created = await request("/api/harvey/commands", {
    method: "POST",
    headers: { authorization: "Bearer harvey-test-operator-token" },
    body: JSON.stringify({ machine: "Doss", action: "PING", payload: {} })
  });
  assert.equal(created.response.status, 200);
  const patched = await request("/api/harvey/commands", {
    method: "PATCH",
    body: JSON.stringify({ command_id: created.body.command.command_id, status: "RECEIVED", evidence: "forged" })
  });
  assert.equal(patched.response.status, 401);
});

test("a captured signed machine write cannot be replayed", async () => {
  const route = "/api/harvey/machines";
  const body = JSON.stringify({ machine: "Doss", hostname: "DOSS", agent_version: "test", capabilities: ["PING"] });
  const headers = signedMachineHeaders({ method: "POST", route, machine: "Doss", secret: "harvey-test-doss-secret", body });
  const first = await request(route, { method: "POST", headers, body });
  const replay = await request(route, { method: "POST", headers, body });
  assert.equal(first.response.status, 200);
  assert.equal(replay.response.status, 409);
  assert.equal(replay.body.error, "REQUEST_REPLAYED");
});

test("nonce capacity fails closed without evicting a still-fresh replay record", async () => {
  const route = "/api/harvey/machines";
  const body = JSON.stringify({ machine: "Doss", hostname: "DOSS", agent_version: "test", capabilities: ["PING"] });
  const capturedHeaders = signedMachineHeaders({ method: "POST", route, machine: "Doss", secret: "harvey-test-doss-secret", body });
  const captured = await request(route, { method: "POST", headers: capturedHeaders, body });
  assert.equal(captured.response.status, 200);

  const flood = await Promise.all(Array.from({ length: 260 }, async () => {
    const headers = signedMachineHeaders({ method: "POST", route, machine: "Doss", secret: "harvey-test-doss-secret", body });
    return request(route, { method: "POST", headers, body });
  }));
  const floodSummary = flood.reduce((summary, result) => {
    const key = `${result.response.status}:${result.body.error ?? "OK"}`;
    summary[key] = (summary[key] ?? 0) + 1;
    return summary;
  }, {});
  assert.ok(flood.some((result) => result.response.status === 503), "capacity never failed closed");
  assert.ok(flood.every((result) => [200, 503].includes(result.response.status)), JSON.stringify(floodSummary));
  const nonceDirectory = path.join(workspace, "data", "harvey", "machine-control", "nonces", "doss");
  const nonceFiles = (await fs.readdir(nonceDirectory)).filter((name) => name.endsWith(".json"));
  assert.ok(nonceFiles.length <= 256, `nonce file cap exceeded: ${nonceFiles.length}`);

  const replay = await request(route, { method: "POST", headers: capturedHeaders, body });
  assert.equal(replay.response.status, 409);
  assert.equal(replay.body.error, "REQUEST_REPLAYED");
});

test("expired machine signatures fail closed", async () => {
  const route = "/api/harvey/machines";
  const body = JSON.stringify({ machine: "Doss", hostname: "DOSS", agent_version: "test", capabilities: ["PING"] });
  const timestamp = String(Math.floor(Date.now() / 1000) - 120);
  const headers = signedMachineHeaders({ method: "POST", route, machine: "Doss", secret: "harvey-test-doss-secret", body, timestamp });
  const result = await request(route, { method: "POST", headers, body });
  assert.equal(result.response.status, 401);
  assert.equal(result.body.error, "REQUEST_TIMESTAMP_EXPIRED");
});

test("Harvey read-only status remains available without write credentials", async () => {
  for (const route of ["/api/harvey/machines", "/api/harvey/commands?machine=Doss", "/harvey"]) {
    const response = await fetch(`${base}${route}`);
    assert.equal(response.status, 200, route);
  }
});
