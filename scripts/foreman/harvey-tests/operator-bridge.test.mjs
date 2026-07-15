import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { createHarveyOperatorBridge } from "../../../scripts/foreman/harvey-operator-bridge.mjs";

const listen = (server) => new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => resolve(server.address()));
});

const close = (server) => new Promise((resolve) => server.close(resolve));

test("operator bridge is loopback-only, origin-bound, and keeps the bearer server-side", async () => {
  let observedAuthorization = null;
  const cockpit = http.createServer((request, response) => {
    observedAuthorization = request.headers.authorization ?? null;
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, command: { command_id: "bridge-proof", status: "QUEUED" } }));
  });
  const cockpitAddress = await listen(cockpit);
  const bridge = createHarveyOperatorBridge({
    cockpitUrl: `http://127.0.0.1:${cockpitAddress.port}`,
    operatorToken: "server-only-operator-token",
    allowedOrigins: ["http://127.0.0.1:3000"]
  });
  const bridgeAddress = await listen(bridge);
  try {
    assert.equal(bridgeAddress.address, "127.0.0.1");
    const denied = await fetch(`http://127.0.0.1:${bridgeAddress.port}/commands`, {
      method: "POST",
      headers: { origin: "http://evil.example", "sec-fetch-site": "cross-site", "content-type": "application/json" },
      body: JSON.stringify({ machine: "Doss", action: "PING", payload: {} })
    });
    assert.equal(denied.status, 403);
    assert.equal(observedAuthorization, null);

    await assert.rejects(
      fetch(`http://10.1.10.8:${bridgeAddress.port}/health`, { signal: AbortSignal.timeout(750) }),
      /fetch failed|aborted|timeout/i
    );

    const allowed = await fetch(`http://127.0.0.1:${bridgeAddress.port}/commands`, {
      method: "POST",
      headers: { origin: "http://127.0.0.1:3000", "sec-fetch-site": "same-site", "content-type": "application/json" },
      body: JSON.stringify({ machine: "Doss", action: "PING", payload: {} })
    });
    const body = await allowed.text();
    assert.equal(allowed.status, 200);
    assert.equal(observedAuthorization, "Bearer server-only-operator-token");
    assert.equal(body.includes("server-only-operator-token"), false);
    assert.equal(allowed.headers.get("access-control-allow-origin"), "http://127.0.0.1:3000");
  } finally {
    await close(bridge);
    await close(cockpit);
  }
});

test("operator bridge creates only a fixed Sally witness challenge and strips internal evidence hashes", async () => {
  let observedAuthorization = null;
  let observedPath = null;
  let observedBody = null;
  const cockpit = http.createServer(async (request, response) => {
    observedAuthorization = request.headers.authorization ?? null;
    observedPath = request.url;
    observedBody = await new Promise((resolve) => {
      const chunks = [];
      request.on("data", (chunk) => chunks.push(chunk));
      request.on("end", () => resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))));
    });
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, witness: {
      challenge_id: "sally_0123456789abcdef0123456789abcdef",
      status: "CHALLENGE_ISSUED",
      created_at: "2026-07-14T05:00:00.000Z",
      expires_at: "2026-07-14T05:15:00.000Z",
      sally_live_claimed: false,
      sally_heartbeat_before: "internal-hash-must-not-cross",
      capability_sha256: "internal-capability-hash"
    } }));
  });
  const cockpitAddress = await listen(cockpit);
  const bridge = createHarveyOperatorBridge({
    cockpitUrl: `http://127.0.0.1:${cockpitAddress.port}`,
    operatorToken: "server-only-operator-token",
    allowedOrigins: ["http://127.0.0.1:3000"]
  });
  const bridgeAddress = await listen(bridge);
  try {
    const response = await fetch(`http://127.0.0.1:${bridgeAddress.port}/sally-witness`, {
      method: "POST",
      headers: { origin: "http://127.0.0.1:3000", "sec-fetch-site": "same-site", "content-type": "application/json" },
      body: "{}"
    });
    const text = await response.text();
    assert.equal(response.status, 200);
    assert.equal(observedAuthorization, "Bearer server-only-operator-token");
    assert.equal(observedPath, "/api/harvey/witness");
    assert.deepEqual(observedBody, { phase: "CREATE" });
    assert.equal(text.includes("internal-hash-must-not-cross"), false);
    assert.equal(text.includes("internal-capability-hash"), false);

    observedPath = null;
    const forbidden = await fetch(`http://127.0.0.1:${bridgeAddress.port}/sally-witness`, {
      method: "POST",
      headers: { origin: "http://127.0.0.1:3000", "sec-fetch-site": "same-site", "content-type": "application/json" },
      body: JSON.stringify({ machine: "Sally" })
    });
    assert.equal(forbidden.status, 400);
    assert.equal(observedPath, null);
  } finally {
    await close(bridge);
    await close(cockpit);
  }
});

test("operator bridge exposes exact Sally pairing details and approval only on Doss loopback", async () => {
  const observed = [];
  const requestId = `sally_pair_${"a".repeat(32)}`;
  const challengeId = "sally_0123456789abcdef0123456789abcdef";
  const pairingCode = "ABCD-1234-EF56";
  const cockpit = http.createServer(async (request, response) => {
    const body = await new Promise((resolve) => {
      const chunks = [];
      request.on("data", (chunk) => chunks.push(chunk));
      request.on("end", () => resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))));
    });
    observed.push({ authorization: request.headers.authorization, path: request.url, body });
    response.writeHead(200, { "content-type": "application/json" });
    if (body.phase === "PAIRING_DETAILS") {
      response.end(JSON.stringify({ ok: true, pairings: [{ request_id: requestId, status: "PENDING", pairing_code: pairingCode, public_key_sha256: "b".repeat(64), requested_at: "2026-07-14T05:00:00.000Z", public_key_jwk: { n: "must-not-cross" } }] }));
      return;
    }
    response.end(JSON.stringify({ ok: true, witness: { challenge_id: challengeId, status: "PAIRING_APPROVED", created_at: "2026-07-14T05:00:00.000Z", expires_at: "2026-07-14T05:15:00.000Z", sally_live_claimed: false, pairing_requests: "must-not-cross" } }));
  });
  const cockpitAddress = await listen(cockpit);
  const bridge = createHarveyOperatorBridge({ cockpitUrl: `http://127.0.0.1:${cockpitAddress.port}`, operatorToken: "server-only-operator-token", allowedOrigins: ["http://127.0.0.1:3000"] });
  const bridgeAddress = await listen(bridge);
  try {
    const evil = await fetch(`http://127.0.0.1:${bridgeAddress.port}/sally-witness/approve`, { method: "POST", headers: { origin: "http://evil.example", "sec-fetch-site": "cross-site", "content-type": "application/json" }, body: JSON.stringify({ challenge_id: challengeId, request_id: requestId, pairing_code: pairingCode }) });
    assert.equal(evil.status, 403);
    assert.equal(observed.length, 0);

    const details = await fetch(`http://127.0.0.1:${bridgeAddress.port}/sally-witness/pairings`, { method: "POST", headers: { origin: "http://127.0.0.1:3000", "sec-fetch-site": "same-origin", "content-type": "application/json" }, body: "{}" });
    const detailsText = await details.text();
    assert.equal(details.status, 200);
    assert.equal(observed[0].authorization, "Bearer server-only-operator-token");
    assert.equal(observed[0].path, "/api/harvey/witness");
    assert.deepEqual(observed[0].body, { phase: "PAIRING_DETAILS" });
    assert.equal(detailsText.includes("must-not-cross"), false);
    assert.equal(JSON.parse(detailsText).pairings[0].pairing_code, pairingCode);

    const approval = await fetch(`http://127.0.0.1:${bridgeAddress.port}/sally-witness/approve`, { method: "POST", headers: { origin: "http://127.0.0.1:3000", "sec-fetch-site": "same-origin", "content-type": "application/json" }, body: JSON.stringify({ challenge_id: challengeId, request_id: requestId, pairing_code: pairingCode }) });
    const approvalText = await approval.text();
    assert.equal(approval.status, 200);
    assert.deepEqual(observed[1].body, { phase: "APPROVE_PAIRING", challenge_id: challengeId, request_id: requestId, pairing_code: pairingCode });
    assert.equal(approvalText.includes("must-not-cross"), false);

    const beforeInvalid = observed.length;
    const invalid = await fetch(`http://127.0.0.1:${bridgeAddress.port}/sally-witness/approve`, { method: "POST", headers: { origin: "http://127.0.0.1:3000", "sec-fetch-site": "same-origin", "content-type": "application/json" }, body: JSON.stringify({ challenge_id: challengeId, request_id: "latest", pairing_code: pairingCode }) });
    assert.equal(invalid.status, 400);
    assert.equal(observed.length, beforeInvalid);
  } finally {
    await close(bridge);
    await close(cockpit);
  }
});

test("operator bridge rejects a JSON-escaped bearer echo before it reaches the browser", async () => {
  const operatorToken = 'server-"only\\operator-token';
  let observedAuthorization = null;
  const cockpit = http.createServer((request, response) => {
    observedAuthorization = request.headers.authorization ?? null;
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, command: { command_id: "bridge-escaped-proof", status: "QUEUED", echo: operatorToken } }));
  });
  const cockpitAddress = await listen(cockpit);
  const bridge = createHarveyOperatorBridge({
    cockpitUrl: `http://127.0.0.1:${cockpitAddress.port}`,
    operatorToken,
    allowedOrigins: ["http://127.0.0.1:3000"]
  });
  const bridgeAddress = await listen(bridge);
  try {
    const response = await fetch(`http://127.0.0.1:${bridgeAddress.port}/commands`, {
      method: "POST",
      headers: { origin: "http://127.0.0.1:3000", "sec-fetch-site": "same-site", "content-type": "application/json" },
      body: JSON.stringify({ machine: "Doss", action: "PING", payload: {} })
    });
    const body = await response.json();
    assert.equal(observedAuthorization, `Bearer ${operatorToken}`);
    assert.equal(response.status, 502);
    assert.equal(body.error, "UPSTREAM_SECRET_ECHO_BLOCKED");
    assert.equal(JSON.stringify(body).includes(operatorToken), false);
  } finally {
    await close(bridge);
    await close(cockpit);
  }
});

test("operator bridge rejects contradictory fleet counts from its loopback upstream", async () => {
  const cockpit = http.createServer((request, response) => {
    response.writeHead(200, { "content-type": "application/json" });
    if (request.method === "GET") {
      response.end(JSON.stringify({ ok: true, machines: [{ machine: "Doss", live: true }] }));
      return;
    }
    response.end(JSON.stringify({
      ok: true,
      commands: [{ command_id: "fleet-proof-doss", machine: "Doss", status: "COMPLETED" }],
      fleet: {
        fleet_id: "harvey_fleet_bridge_inconsistent",
        status: "COMPLETED",
        terminal: true,
        addressed_count: 999,
        terminal_count: 0,
        completed_count: 0,
        blocker_count: 0,
        pending_count: 999,
        commands: []
      }
    }));
  });
  const cockpitAddress = await listen(cockpit);
  const bridge = createHarveyOperatorBridge({
    cockpitUrl: `http://127.0.0.1:${cockpitAddress.port}`,
    operatorToken: "server-only-fleet-token",
    allowedOrigins: ["http://127.0.0.1:3000"]
  });
  const bridgeAddress = await listen(bridge);
  try {
    const response = await fetch(`http://127.0.0.1:${bridgeAddress.port}/fleet/knock`, {
      method: "POST",
      headers: { origin: "http://127.0.0.1:3000", "sec-fetch-site": "same-site", "content-type": "application/json" },
      body: "{}"
    });
    assert.equal(response.status, 502);
    assert.equal((await response.json()).error, "OPERATOR_UPSTREAM_SCHEMA_INVALID");
  } finally {
    await close(bridge);
    await close(cockpit);
  }
});

test("operator bridge bounds the loopback upstream response body", async () => {
  const cockpit = http.createServer((_request, response) => {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, command: { command_id: "bridge-oversized", status: "QUEUED" }, padding: "x".repeat(70 * 1024) }));
  });
  const cockpitAddress = await listen(cockpit);
  const bridge = createHarveyOperatorBridge({
    cockpitUrl: `http://127.0.0.1:${cockpitAddress.port}`,
    operatorToken: "server-only-size-token",
    allowedOrigins: ["http://127.0.0.1:3000"]
  });
  const bridgeAddress = await listen(bridge);
  try {
    const response = await fetch(`http://127.0.0.1:${bridgeAddress.port}/commands`, {
      method: "POST",
      headers: { origin: "http://127.0.0.1:3000", "sec-fetch-site": "same-site", "content-type": "application/json" },
      body: JSON.stringify({ machine: "Doss", action: "PING", payload: {} })
    });
    assert.equal(response.status, 502);
    assert.equal((await response.json()).error, "OPERATOR_UPSTREAM_RESPONSE_TOO_LARGE");
  } finally {
    await close(bridge);
    await close(cockpit);
  }
});
