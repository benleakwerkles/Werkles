import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { spawn } from "node:child_process";
import http from "node:http";
import { fileURLToPath } from "node:url";
import test from "node:test";

const courier = fileURLToPath(new URL("../Invoke-HarveyCloudTaskCourier.ps1", import.meta.url));
const secret = "harvey-test-cloud-courier-secret";
const operatorToken = "harvey-test-local-operator-token";

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function send(response, status, body) {
  response.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  response.end(JSON.stringify(body));
}

function assertSigned(request, rawBody) {
  assert.equal(request.headers["x-harvey-machine"], "Doss");
  assert.equal(request.headers["x-harvey-agent-id"], "handeye-doss-doss");
  const audience = String(request.headers["x-harvey-audience"] ?? "");
  assert.match(audience, /^http:\/\/127\.0\.0\.1:\d+$/);
  const timestamp = String(request.headers["x-harvey-timestamp"] ?? "");
  const nonce = String(request.headers["x-harvey-nonce"] ?? "");
  assert.match(timestamp, /^\d{10}$/);
  assert.match(nonce, /^[a-f0-9]{32}$/);
  const bodyHash = createHash("sha256").update(rawBody, "utf8").digest("hex");
  const canonical = [request.method, new URL(request.url, "http://localhost").pathname, "Doss", "handeye-doss-doss", timestamp, nonce, bodyHash, audience].join("\n");
  const expected = createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
  assert.equal(request.headers["x-harvey-signature"], expected);
}

function runCourier(baseUrl) {
  return new Promise((resolve, reject) => {
    const child = spawn("powershell.exe", [
      "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", courier,
      "-CloudUrl", baseUrl,
      "-LocalCockpitUrl", baseUrl,
      "-PollSeconds", "1",
      "-TaskTimeoutSeconds", "30",
      "-Once"
    ], {
      env: {
        ...process.env,
        COMPUTERNAME: "DOSS",
        HARVEY_AGENT_SECRET: secret,
        HARVEY_OPERATOR_TOKEN: operatorToken,
        HARVEY_CLOUD_COURIER_TEST_MODE: "1"
      },
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("exit", (code) => resolve({ code, stdout, stderr }));
  });
}

test("signed Doss courier turns one cloud VPG command into a visible Codex reply", async () => {
  const receipts = [];
  let localDispatchBody = null;
  const server = http.createServer(async (request, response) => {
    const pathname = new URL(request.url, "http://localhost").pathname;
    if (request.method === "POST" && pathname === "/api/harvey/relay/claim") {
      const raw = await readBody(request);
      assertSigned(request, raw);
      assert.deepEqual(JSON.parse(raw), { limit: 1 });
      send(response, 200, { ok: true, claim: { deliveries: [{
        delivery_id: "11111111-1111-4111-8111-111111111111",
        claim_token: "22222222-2222-4222-8222-222222222222",
        command_id: "33333333-3333-4333-8333-333333333333",
        recipient_id: "shakespeare-doss",
        verb: "VERIFY",
        target: "All Aeyes",
        instruction: "Tell Ben whether VPG can talk.",
        created_at: new Date().toISOString(),
        lease_expires_at: new Date(Date.now() + 900_000).toISOString()
      }] } });
      return;
    }
    if (request.method === "POST" && pathname === "/api/harvey/relay/receipt") {
      const raw = await readBody(request);
      assertSigned(request, raw);
      receipts.push(JSON.parse(raw));
      send(response, 200, { ok: true, receipt: { delivery_state: receipts.at(-1).state } });
      return;
    }
    if (request.method === "POST" && pathname === "/api/harvey/task-bridge") {
      assert.equal(request.headers.authorization, `Bearer ${operatorToken}`);
      localDispatchBody = JSON.parse(await readBody(request));
      send(response, 202, { ok: true, dispatch: { dispatch_id: "harvey_dispatch_test", thread_id: "019f719e-1b67-77c0-a9be-6ca901377747" } });
      return;
    }
    if (request.method === "GET" && pathname === "/api/harvey/task-bridge") {
      assert.equal(request.headers.authorization, `Bearer ${operatorToken}`);
      send(response, 200, { ok: true, bridge: { dispatches: [{
        dispatch_id: "harvey_dispatch_test",
        state: "COMPLETED",
        reply: "VPG can talk through the signed Doss courier.",
        error: null
      }] } });
      return;
    }
    send(response, 404, { ok: false, error: "NOT_FOUND" });
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const result = await runCourier(baseUrl);
    assert.equal(result.code, 0, result.stderr || result.stdout);
    assert.deepEqual(receipts.map((receipt) => receipt.state), ["WORKING", "REPLIED", "COMPLETED"]);
    assert.equal(receipts[1].reply, "VPG can talk through the signed Doss courier.");
    assert.equal(localDispatchBody.binding_id, "shakespeare-doss");
    assert.match(localDispatchBody.body, /VPG VERB: VERIFY/);
    assert.match(localDispatchBody.body, /Tell Ben whether VPG can talk/);
    assert.doesNotMatch(result.stdout + result.stderr, new RegExp(secret));
    assert.match(result.stdout, /"status":"POLL_COMPLETE"/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
