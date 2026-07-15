import assert from "node:assert/strict";
import { createHash, createHmac, randomUUID } from "node:crypto";
import test from "node:test";

const base = process.env.HARVEY_TEST_BASE_URL;
assert.ok(base, "HARVEY_TEST_BASE_URL is required");

const canonicalHostnames = { Doss: "DOSS", Betsy: "BETSY", Spanzee: "SPANZEE", Medullina: "COURTNEY", Sally: "SALLY" };
const canonicalAgent = (machine) => `handeye-${machine.toLowerCase()}-${canonicalHostnames[machine].toLowerCase()}`;
const machineHeaders = ({ method, route, machine, secret, body, agent = canonicalAgent(machine), timestamp, nonce }) => {
  const requestTimestamp = timestamp ?? String(Math.floor(Date.now() / 1000));
  const requestNonce = nonce ?? randomUUID().replaceAll("-", "");
  const bodyHash = createHash("sha256").update(body, "utf8").digest("hex");
  const canonical = [method, route, machine, agent, requestTimestamp, requestNonce, bodyHash].join("\n");
  const signature = createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
  return {
    "content-type": "application/json",
    "x-harvey-machine": machine,
    "x-harvey-agent-id": agent,
    "x-harvey-timestamp": requestTimestamp,
    "x-harvey-nonce": requestNonce,
    "x-harvey-signature": signature
  };
};

async function json(route, init) {
  const response = await fetch(`${base}${route}`, init);
  const responseBody = await response.json();
  return { response, body: responseBody };
}

test("server rejects wrong hostname for the authenticated machine", async () => {
  const route = "/api/harvey/machines";
  const body = JSON.stringify({ machine: "Sally", hostname: "DOSS", agent_version: "test", capabilities: ["PING"] });
  const result = await json(route, {
    method: "POST",
    headers: machineHeaders({ method: "POST", route, machine: "Sally", secret: "harvey-test-sally-secret", body }),
    body
  });
  assert.equal(result.response.status, 403);
  assert.equal(result.body.error, "MACHINE_BINDING_MISMATCH");
});

test("machine secret cannot claim another machine", async () => {
  const route = "/api/harvey/machines";
  const body = JSON.stringify({ machine: "Doss", hostname: "DOSS", agent_version: "test", capabilities: ["PING"] });
  const result = await json(route, {
    method: "POST",
    headers: machineHeaders({ method: "POST", route, machine: "Doss", secret: "harvey-test-sally-secret", body }),
    body
  });
  assert.equal(result.response.status, 401);
  assert.equal(result.body.error, "INVALID_MACHINE_SIGNATURE");
});

test("machine identity rejects a caller-selected agent id", async () => {
  const route = "/api/harvey/machines";
  const body = JSON.stringify({ machine: "Sally", hostname: "SALLY", agent_version: "test", capabilities: ["PING"] });
  const result = await json(route, {
    method: "POST",
    headers: machineHeaders({ method: "POST", route, machine: "Sally", secret: "harvey-test-sally-secret", body, agent: "forged-agent" }),
    body
  });
  assert.equal(result.response.status, 403);
  assert.equal(result.body.error, "AGENT_BINDING_MISMATCH");
});

test("authenticated Sally heartbeat uses the canonical Sally binding", async () => {
  const route = "/api/harvey/machines";
  const body = JSON.stringify({ machine: "Sally", hostname: "SALLY", agent_version: "test", capabilities: ["PING"] });
  const result = await json(route, {
    method: "POST",
    headers: machineHeaders({ method: "POST", route, machine: "Sally", secret: "harvey-test-sally-secret", body }),
    body
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.heartbeat.machine, "Sally");
  assert.equal(result.body.heartbeat.hostname, "SALLY");
  assert.equal(result.body.heartbeat.agent_id, "handeye-sally-sally");
});

test("authenticated Medullina heartbeat binds to COURTNEY", async () => {
  const route = "/api/harvey/machines";
  const body = JSON.stringify({ machine: "Medullina", hostname: "COURTNEY", agent_version: "test", capabilities: ["PING"] });
  const result = await json(route, {
    method: "POST",
    headers: machineHeaders({ method: "POST", route, machine: "Medullina", secret: "harvey-test-medullina-secret", body }),
    body
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.heartbeat.machine, "Medullina");
  assert.equal(result.body.heartbeat.hostname, "COURTNEY");
  assert.equal(result.body.heartbeat.agent_id, "handeye-medullina-courtney");
});

test("Sally agent cannot advance a Doss command", async () => {
  const created = await json("/api/harvey/commands", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" },
    body: JSON.stringify({ machine: "Doss", action: "PING", payload: {} })
  });
  assert.equal(created.response.status, 200);
  const route = "/api/harvey/commands";
  const body = JSON.stringify({ command_id: created.body.command.command_id, status: "RECEIVED", evidence: "wrong machine" });
  const patched = await json(route, {
    method: "PATCH",
    headers: machineHeaders({ method: "PATCH", route, machine: "Sally", secret: "harvey-test-sally-secret", body }),
    body
  });
  assert.equal(patched.response.status, 403);
  assert.equal(patched.body.error, "COMMAND_MACHINE_BINDING_MISMATCH");
});
