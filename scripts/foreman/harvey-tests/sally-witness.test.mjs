import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, createHmac, generateKeyPairSync, randomBytes, randomUUID, sign } from "node:crypto";
import { promises as fs } from "node:fs";
import http from "node:http";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";

import { base, json, jsonAt, secondaryBase, signedMachineHeaders, updateCommand, workspace } from "./harvey-test-client.mjs";

const chrome = process.env.HARVEY_CHROME_EXE ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const route = "/api/harvey/witness";
const origin = new URL(base).origin;
const capability = () => randomBytes(32).toString("hex");
const digest = (value) => createHash("sha256").update(value, "utf8").digest("hex");
const stableValue = (value) => Array.isArray(value)
  ? value.map(stableValue)
  : value && typeof value === "object"
    ? Object.keys(value).sort().reduce((result, key) => ({ ...result, [key]: stableValue(value[key]) }), {})
    : value;
const signState = (state) => createHmac("sha256", "harvey-test-operator-token").update(JSON.stringify(stableValue(state)), "utf8").digest("hex");

async function createChallenge() {
  const result = await json(route, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" },
    body: JSON.stringify({ phase: "CREATE" })
  });
  assert.equal(result.response.status, 200);
  return result.body.witness;
}

async function hostReady(challengeId, browserCapability, machine = "Sally", revisionOverride = null) {
  const snapshot = await (await fetch(`${base}/api/harvey/snapshot`, { cache: "no-store" })).json();
  const body = JSON.stringify({ phase: "HOST_READY", challenge_id: challengeId, initial_revision: revisionOverride ?? snapshot.revision, capability_sha256: digest(browserCapability) });
  return json(route, { method: "POST", headers: signedMachineHeaders({ method: "POST", route, machine, body }), body });
}

async function pageReady(challengeId, browserCapability, pageInstanceId = randomUUID().replaceAll("-", ""), cookie = "") {
  const body = JSON.stringify({ phase: "PAGE_READY", challenge_id: challengeId, capability: browserCapability, page_instance_id: pageInstanceId, time_origin: 1000, navigation_count: 1 });
  return json(route, { method: "POST", headers: { "content-type": "application/json", origin, ...(cookie ? { cookie } : {}) }, body });
}

function pairingKey() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  return { privateKey, publicKeyJwk: publicKey.export({ format: "jwk" }) };
}

async function pairingRequest(challengeId, browserCapability, publicKeyJwk, overrides = {}, headers = {}) {
  const snapshot = await (await fetch(`${base}/api/harvey/snapshot`, { cache: "no-store" })).json();
  const body = JSON.stringify({
    phase: "PAIRING_REQUEST",
    challenge_id: challengeId,
    machine: "Sally",
    hostname: "SALLY",
    agent_id: "handeye-sally-sally",
    initial_revision: snapshot.revision,
    capability_sha256: digest(browserCapability),
    public_key_jwk: publicKeyJwk,
    ...overrides
  });
  return json(route, { method: "POST", headers: { "content-type": "application/json", ...headers }, body });
}

async function redeemPairing(challengeId, requestId, browserCapability, privateKey, revisionOverride = null) {
  const snapshot = await (await fetch(`${base}/api/harvey/snapshot`, { cache: "no-store" })).json();
  const initialRevision = revisionOverride ?? snapshot.revision;
  const capabilitySha256 = digest(browserCapability);
  const transcript = [challengeId, requestId, initialRevision, capabilitySha256, "SALLY", "handeye-sally-sally"].join("\n");
  const signature = sign("RSA-SHA256", Buffer.from(transcript, "utf8"), privateKey).toString("base64url");
  const body = JSON.stringify({ phase: "PAIRING_REDEEM", challenge_id: challengeId, request_id: requestId, initial_revision: initialRevision, capability_sha256: capabilitySha256, signature });
  return json(route, { method: "POST", headers: { "content-type": "application/json" }, body });
}

const listen = (server) => new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => resolve(server.address()));
});

const close = (server) => new Promise((resolve) => server.close(resolve));

function runPowerShell(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", ...args], { windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, stdout, stderr }));
  });
}

test("Sally PowerShell pairing exits before network on Doss and its RSA container is explicitly ephemeral", async () => {
  let requestCount = 0;
  const trap = http.createServer((_request, response) => {
    requestCount += 1;
    response.writeHead(500, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: false }));
  });
  const address = await listen(trap);
  try {
    const scriptPath = path.join(workspace, "scripts", "foreman", "Invoke-HarveySallyWitness.ps1");
    const scriptText = await fs.readFile(scriptPath, "utf8");
    assert.match(scriptText, /CreateEphemeralKey/);
    assert.match(scriptText, /PersistKeyInCsp\s*=\s*\$false/);
    assert.match(scriptText, /SALLY_PAIRING_PUBLIC_KEY_FINGERPRINT_MISMATCH/);
    assert.match(scriptText, /SALLY_PAIRING_CODE_MISMATCH/);
    assert.match(scriptText, /hostProof\.pairing_request_id/);
    assert.match(scriptText, /\$rsa\.Clear\(\)/);
    const result = await runPowerShell(["-File", scriptPath, "-ChallengeId", `sally_${"a".repeat(32)}`, "-CockpitUrl", `http://127.0.0.1:${address.port}`]);
    assert.notEqual(result.code, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /HOSTNAME_MISMATCH: expected=SALLY; actual=DOSS/i);
    assert.equal(requestCount, 0);

    const residueProbe = `$ErrorActionPreference='Stop'; $root=Join-Path $env:APPDATA 'Microsoft\\Crypto\\RSA'; $before=@(Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object FullName); $csp=New-Object System.Security.Cryptography.CspParameters; $csp.Flags=[System.Security.Cryptography.CspProviderFlags]::CreateEphemeralKey; $rsa=New-Object System.Security.Cryptography.RSACryptoServiceProvider 2048,$csp; $rsa.PersistKeyInCsp=$false; try { [void]$rsa.ExportParameters($false); [void]$rsa.SignData([Text.Encoding]::UTF8.GetBytes('harvey-ephemeral-proof'),'SHA256') } finally { $rsa.PersistKeyInCsp=$false; $rsa.Clear(); $rsa.Dispose() }; $after=@(Get-ChildItem -LiteralPath $root -Recurse -File -ErrorAction SilentlyContinue | ForEach-Object FullName); $added=@(Compare-Object $before $after | Where-Object SideIndicator -eq '=>'); if($added.Count){ throw 'EPHEMERAL_RSA_RESIDUE_DETECTED' }; 'EPHEMERAL_RSA_NO_RESIDUE'`;
    const residue = await runPowerShell(["-Command", residueProbe]);
    assert.equal(residue.code, 0, residue.stderr);
    assert.match(residue.stdout, /EPHEMERAL_RSA_NO_RESIDUE/);
  } finally {
    await close(trap);
  }
});

test("Sally witness is signed, ordered, idempotent, one-command bounded, and never writes a heartbeat", async () => {
  const witnessRoot = path.join(workspace, "data", "harvey", "machine-control", "sally-witness");
  await fs.rm(witnessRoot, { recursive: true, force: true });
  await fs.mkdir(witnessRoot, { recursive: true });
  const staleLock = path.join(witnessRoot, "active.lock");
  await fs.writeFile(staleLock, JSON.stringify({ owner_id: "dead", pid: 999999, created_at: "2000-01-01T00:00:00.000Z" }));
  await fs.utimes(staleLock, new Date("2000-01-01T00:00:00.000Z"), new Date("2000-01-01T00:00:00.000Z"));
  const heartbeatFile = path.join(workspace, "data", "harvey", "machine-control", "machines", "sally.json");
  await fs.rm(heartbeatFile, { force: true });
  const heartbeatBefore = await fs.readFile(heartbeatFile).catch(() => null);
  const commandsBefore = (await json("/api/harvey/commands?machine=Doss")).body.commands.length;
  const challenge = await createChallenge();
  assert.match(challenge.challenge_id, /^sally_[a-f0-9]{32}$/);
  assert.equal(challenge.sally_live_claimed, false);
  const scriptResponse = await fetch(`${base}${route}?format=script`, { cache: "no-store" });
  const scriptText = await scriptResponse.text();
  const scriptSha256 = digest(scriptText);
  assert.equal(scriptResponse.headers.get("x-harvey-content-sha256"), scriptSha256);
  const packetText = await (await fetch(`${base}${route}?format=packet`, { cache: "no-store" })).text();
  assert.match(packetText, new RegExp(`WITNESS_SCRIPT_SHA256: ${scriptSha256}`));
  assert.match(packetText, /WITNESS_SCRIPT_INTEGRITY_MISMATCH/);
  const scriptPath = path.join(workspace, "scripts", "foreman", "Invoke-HarveySallyWitness.ps1");
  const reviewedScript = await fs.readFile(scriptPath, "utf8");
  try {
    await fs.writeFile(scriptPath, `${reviewedScript}\n# BEAN_UNREVIEWED_BOOTSTRAP_TAMPER\n`, "utf8");
    assert.equal((await fetch(`${base}${route}?format=script`, { cache: "no-store" })).status, 503);
    assert.equal((await fetch(`${base}${route}?format=packet`, { cache: "no-store" })).status, 503);
  } finally {
    await fs.writeFile(scriptPath, reviewedScript, "utf8");
  }

  const cap = capability();
  const queryLeak = await json(`${route}?witness=${cap}`, { method: "POST", headers: { "content-type": "application/json", origin }, body: JSON.stringify({ phase: "PAGE_READY" }) });
  assert.equal(queryLeak.response.status, 400);
  assert.equal(queryLeak.body.error, "SALLY_WITNESS_QUERY_FORBIDDEN");
  const fabricatedRevision = await hostReady(challenge.challenge_id, cap, "Sally", "a".repeat(64));
  assert.equal(fabricatedRevision.response.status, 409);
  assert.equal(fabricatedRevision.body.error, "SALLY_WITNESS_INITIAL_REVISION_NOT_CURRENT");
  const wrongMachine = await hostReady(challenge.challenge_id, cap, "Doss");
  assert.equal(wrongMachine.response.status, 403);
  assert.equal(wrongMachine.body.error, "WITNESS_MACHINE_BINDING_MISMATCH");

  const premature = await pageReady(challenge.challenge_id, cap);
  assert.equal(premature.response.status, 409);
  assert.equal(premature.body.error, "SALLY_WITNESS_HOST_READY_REQUIRED");

  const ready = await hostReady(challenge.challenge_id, cap);
  assert.equal(ready.response.status, 200);
  assert.equal(ready.body.witness.status, "HOST_READY");
  assert.equal(ready.body.witness.evidence_environment, "FIXTURE_ONLY");
  assert.equal((await json("/api/harvey/commands?machine=Doss")).body.commands.length, commandsBefore);

  const conflict = await hostReady(challenge.challenge_id, capability());
  assert.equal(conflict.response.status, 409);
  assert.equal(conflict.body.error, "SALLY_WITNESS_HOST_READY_CONFLICT");

  const crossOrigin = await json(route, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://evil.example" },
    body: JSON.stringify({ phase: "PAGE_READY", challenge_id: challenge.challenge_id, capability: cap, page_instance_id: randomUUID().replaceAll("-", ""), time_origin: 1000, navigation_count: 1 })
  });
  assert.equal(crossOrigin.response.status, 403);

  const pageInstanceId = randomUUID().replaceAll("-", "");
  const attached = await pageReady(challenge.challenge_id, cap, pageInstanceId);
  assert.equal(attached.response.status, 200);
  const cookie = (attached.response.headers.get("set-cookie") ?? "").split(";")[0];
  assert.match(cookie, /^harvey_sally_witness=/);
  assert.equal(attached.body.witness.status, "PING_QUEUED");
  const commandId = attached.body.witness.command.command_id;
  const afterAttach = (await json("/api/harvey/commands?machine=Doss")).body.commands;
  assert.equal(afterAttach.filter((command) => command.workstream_id === attached.body.witness.command.workstream_id).length, 1);

  const replayWithoutSession = await pageReady(challenge.challenge_id, cap, pageInstanceId);
  assert.equal(replayWithoutSession.response.status, 409);
  assert.equal(replayWithoutSession.body.error, "WITNESS_SESSION_ALREADY_BOUND");
  const duplicate = await pageReady(challenge.challenge_id, cap, pageInstanceId, cookie);
  assert.equal(duplicate.response.status, 200);
  assert.equal(duplicate.body.witness.command.command_id, commandId);
  const afterDuplicate = (await json("/api/harvey/commands?machine=Doss")).body.commands;
  assert.equal(afterDuplicate.filter((command) => command.workstream_id === attached.body.witness.command.workstream_id).length, 1);

  const claim = await updateCommand("Doss", { command_id: commandId, status: "RECEIVED", evidence: "Sally witness test received" });
  const completed = await updateCommand("Doss", { command_id: commandId, status: "COMPLETED", claim_id: claim.body.command.claim.claim_id, evidence: "Sally witness test completed" });
  assert.equal(completed.response.status, 200);
  const observed = await (await fetch(`${base}/api/harvey/snapshot`, { cache: "no-store" })).json();
  const fabricatedObserved = await json(route, {
    method: "POST",
    headers: { "content-type": "application/json", origin, cookie },
    body: JSON.stringify({ phase: "BROWSER_COMPLETED", challenge_id: challenge.challenge_id, command_id: commandId, initial_revision: ready.body.witness.host_ready.initial_revision, observed_revision: "b".repeat(64), page_instance_id: pageInstanceId, time_origin: 1000, navigation_count: 1 })
  });
  assert.equal(fabricatedObserved.response.status, 409);
  assert.equal(fabricatedObserved.body.error, "SALLY_WITNESS_REVISION_NOT_CURRENT");
  const completion = await json(route, {
    method: "POST",
    headers: { "content-type": "application/json", origin, cookie },
    body: JSON.stringify({ phase: "BROWSER_COMPLETED", challenge_id: challenge.challenge_id, command_id: commandId, initial_revision: ready.body.witness.host_ready.initial_revision, observed_revision: observed.revision, page_instance_id: pageInstanceId, time_origin: 1000, navigation_count: 1 })
  });
  assert.equal(completion.response.status, 200);
  assert.equal(completion.body.witness.status, "COMPLETED");
  assert.equal(completion.body.witness.sally_live_claimed, false);
  assert.equal(completion.body.witness.browser_completed.command_id, commandId);
  assert.match(completion.response.headers.get("set-cookie") ?? "", /Max-Age=0/i);
  assert.equal(JSON.stringify(completion.body).includes(cap), false);
  assert.equal(JSON.stringify(completion.body).includes(workspace), false);
  const heartbeatAfter = await fs.readFile(heartbeatFile).catch(() => null);
  assert.deepEqual(heartbeatAfter, heartbeatBefore);
  const postTerminalReplay = await pageReady(challenge.challenge_id, cap, pageInstanceId);
  assert.equal(postTerminalReplay.response.status, 409);
  assert.equal((await json(route)).body.witness.status, "COMPLETED");
});

test("Sally first pairing requires exact Doss approval and ephemeral RSA proof without granting machine authority", async () => {
  const witnessRoot = path.join(workspace, "data", "harvey", "machine-control", "sally-witness");
  await fs.rm(witnessRoot, { recursive: true, force: true });
  const heartbeatFile = path.join(workspace, "data", "harvey", "machine-control", "machines", "sally.json");
  await fs.rm(heartbeatFile, { force: true });
  const heartbeatBefore = await fs.readFile(heartbeatFile).catch(() => null);
  const commandsBefore = (await json("/api/harvey/commands?machine=Doss")).body.commands.length;
  const challenge = await createChallenge();
  const cap = capability();
  const legitimate = pairingKey();
  const attacker = pairingKey();

  const browserAttempt = await pairingRequest(challenge.challenge_id, cap, legitimate.publicKeyJwk, {}, { origin: "http://evil.example", referer: "http://evil.example/" });
  assert.equal(browserAttempt.response.status, 403);
  assert.equal(browserAttempt.body.error, "SALLY_PAIRING_BROWSER_REQUEST_FORBIDDEN");
  const wrongHost = await pairingRequest(challenge.challenge_id, cap, legitimate.publicKeyJwk, { hostname: "DOSS" });
  assert.equal(wrongHost.response.status, 403);
  assert.equal(wrongHost.body.error, "WITNESS_MACHINE_BINDING_MISMATCH");

  const requested = await pairingRequest(challenge.challenge_id, cap, legitimate.publicKeyJwk);
  assert.equal(requested.response.status, 200);
  assert.equal(requested.body.pairing.status, "PENDING");
  assert.match(requested.body.pairing.request_id, /^sally_pair_[a-f0-9]{32}$/);
  assert.match(requested.body.pairing.pairing_code, /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/);
  const localFingerprint = digest(["RSA", legitimate.publicKeyJwk.n, legitimate.publicKeyJwk.e].join("\n"));
  assert.equal(requested.body.pairing.public_key_sha256, localFingerprint);
  const localCodeSource = digest(["werkles.harvey-sally-pairing/v1", challenge.challenge_id, localFingerprint, digest(cap)].join("\n")).toUpperCase();
  const locallyDerivedCode = `${localCodeSource.slice(0, 4)}-${localCodeSource.slice(4, 8)}-${localCodeSource.slice(8, 12)}`;
  assert.equal(requested.body.pairing.pairing_code, locallyDerivedCode);
  const duplicate = await pairingRequest(challenge.challenge_id, cap, legitimate.publicKeyJwk);
  assert.equal(duplicate.body.pairing.request_id, requested.body.pairing.request_id);
  const attackerRequest = await pairingRequest(challenge.challenge_id, capability(), attacker.publicKeyJwk);
  assert.equal(attackerRequest.response.status, 200);
  assert.notEqual(attackerRequest.body.pairing.pairing_code, requested.body.pairing.pairing_code);
  assert.notEqual(attackerRequest.body.pairing.pairing_code, locallyDerivedCode);

  const publicPending = await json(route);
  assert.equal(publicPending.body.witness.pairing_status, "PENDING");
  const publicPendingText = JSON.stringify(publicPending.body);
  assert.equal(publicPendingText.includes(requested.body.pairing.request_id), false);
  assert.equal(publicPendingText.includes(requested.body.pairing.pairing_code), false);
  assert.equal(publicPendingText.includes(legitimate.publicKeyJwk.n), false);

  const unauthenticatedDetails = await json(route, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phase: "PAIRING_DETAILS" }) });
  assert.ok([401, 403].includes(unauthenticatedDetails.response.status));
  const details = await json(route, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" }, body: JSON.stringify({ phase: "PAIRING_DETAILS" }) });
  assert.equal(details.response.status, 200);
  assert.equal(details.body.pairings.length, 2);
  assert.equal(details.body.pairings.find((pairing) => pairing.request_id === requested.body.pairing.request_id).pairing_code, requested.body.pairing.pairing_code);

  const beforeApproval = await redeemPairing(challenge.challenge_id, requested.body.pairing.request_id, cap, legitimate.privateKey);
  assert.equal(beforeApproval.response.status, 409);
  assert.equal(beforeApproval.body.error, "SALLY_PAIRING_NOT_APPROVED");
  const wrongApproval = await json(route, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" }, body: JSON.stringify({ phase: "APPROVE_PAIRING", challenge_id: challenge.challenge_id, request_id: `sally_pair_${"f".repeat(32)}`, pairing_code: requested.body.pairing.pairing_code }) });
  assert.equal(wrongApproval.response.status, 404);
  const wrongCodeApproval = await json(route, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" }, body: JSON.stringify({ phase: "APPROVE_PAIRING", challenge_id: challenge.challenge_id, request_id: requested.body.pairing.request_id, pairing_code: "FFFF-FFFF-FFFF" }) });
  assert.equal(wrongCodeApproval.response.status, 409);
  assert.equal(wrongCodeApproval.body.error, "SALLY_PAIRING_CODE_MISMATCH");
  const approvalInit = { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" }, body: JSON.stringify({ phase: "APPROVE_PAIRING", challenge_id: challenge.challenge_id, request_id: requested.body.pairing.request_id, pairing_code: requested.body.pairing.pairing_code }) };
  const [approved, approvedSecondary] = await Promise.all([json(route, approvalInit), jsonAt(secondaryBase, route, approvalInit)]);
  assert.deepEqual([approved.response.status, approvedSecondary.response.status], [200, 200]);
  assert.equal(approved.body.witness.pairing_status, "APPROVED");
  assert.equal(approvedSecondary.body.witness.pairing_status, "APPROVED");
  assert.equal(JSON.stringify(approved.body).includes(legitimate.publicKeyJwk.n), false);
  const approvedEnvelope = JSON.parse(await fs.readFile(path.join(witnessRoot, "active.json"), "utf8"));
  const approvedRequest = approvedEnvelope.state.pairing_requests.find((pairing) => pairing.request_id === requested.body.pairing.request_id);
  assert.match(approvedRequest.approval.receipt_id, /^sally_pair_approval_/);
  assert.equal(approvedEnvelope.state.pairing_requests.filter((pairing) => pairing.status === "APPROVED").length, 1);
  const approvedAgain = await json(route, approvalInit);
  assert.equal(approvedAgain.response.status, 200);
  const approvedAgainEnvelope = JSON.parse(await fs.readFile(path.join(witnessRoot, "active.json"), "utf8"));
  assert.equal(approvedAgainEnvelope.state.pairing_requests.find((pairing) => pairing.request_id === requested.body.pairing.request_id).approval.receipt_id, approvedRequest.approval.receipt_id);
  const postApprovalDetails = await json(route, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" }, body: JSON.stringify({ phase: "PAIRING_DETAILS" }) });
  assert.equal(postApprovalDetails.body.pairings.find((pairing) => pairing.request_id === attackerRequest.body.pairing.request_id).status, "REJECTED");

  const wrongProof = await redeemPairing(challenge.challenge_id, requested.body.pairing.request_id, cap, attacker.privateKey);
  assert.equal(wrongProof.response.status, 403);
  assert.equal(wrongProof.body.error, "SALLY_PAIRING_SIGNATURE_INVALID");
  const snapshot = await (await fetch(`${base}/api/harvey/snapshot`, { cache: "no-store" })).json();
  const capabilitySha256 = digest(cap);
  const transcript = [challenge.challenge_id, requested.body.pairing.request_id, snapshot.revision, capabilitySha256, "SALLY", "handeye-sally-sally"].join("\n");
  const signature = sign("RSA-SHA256", Buffer.from(transcript, "utf8"), legitimate.privateKey).toString("base64url");
  const redeemBody = JSON.stringify({ phase: "PAIRING_REDEEM", challenge_id: challenge.challenge_id, request_id: requested.body.pairing.request_id, initial_revision: snapshot.revision, capability_sha256: capabilitySha256, signature });
  const [redeemA, redeemB] = await Promise.all([
    json(route, { method: "POST", headers: { "content-type": "application/json" }, body: redeemBody }),
    jsonAt(secondaryBase, route, { method: "POST", headers: { "content-type": "application/json" }, body: redeemBody })
  ]);
  assert.deepEqual([redeemA.response.status, redeemB.response.status].sort(), [200, 409]);
  const redeemed = redeemA.response.status === 200 ? redeemA : redeemB;
  assert.equal(redeemed.body.witness.host_ready.proof_kind, "OPERATOR_APPROVED_EPHEMERAL_PAIRING");
  assert.equal(redeemed.body.witness.host_ready.pairing_request_id, requested.body.pairing.request_id);
  assert.equal(redeemed.body.witness.sally_live_claimed, false);
  const replay = await json(route, { method: "POST", headers: { "content-type": "application/json" }, body: redeemBody });
  assert.equal(replay.response.status, 409);
  assert.equal(replay.body.error, "SALLY_PAIRING_ALREADY_REDEEMED");

  const attached = await pageReady(challenge.challenge_id, cap);
  assert.equal(attached.response.status, 200);
  assert.equal(attached.body.witness.status, "PING_QUEUED");
  assert.equal((await json("/api/harvey/commands?machine=Doss")).body.commands.length, commandsBefore + 1);
  assert.deepEqual(await fs.readFile(heartbeatFile).catch(() => null), heartbeatBefore);
  const finalPublicText = JSON.stringify((await json(route)).body);
  assert.equal(finalPublicText.includes(legitimate.publicKeyJwk.n), false);
  assert.equal(finalPublicText.includes(signature), false);
});

test("an enrolled Sally HMAC supersedes unauthenticated pending or approved pairing without queuing work", async () => {
  const witnessRoot = path.join(workspace, "data", "harvey", "machine-control", "sally-witness");
  await fs.rm(witnessRoot, { recursive: true, force: true });
  const commandsBefore = (await json("/api/harvey/commands?machine=Doss")).body.commands.length;

  for (const approveFirst of [false, true]) {
    const challenge = approveFirst
      ? (await json(route, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" }, body: JSON.stringify({ phase: "REISSUE" }) })).body.witness
      : await createChallenge();
    const pairedCap = capability();
    const key = pairingKey();
    const requested = await pairingRequest(challenge.challenge_id, pairedCap, key.publicKeyJwk);
    assert.equal(requested.response.status, 200);
    if (approveFirst) {
      const approval = await json(route, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" }, body: JSON.stringify({ phase: "APPROVE_PAIRING", challenge_id: challenge.challenge_id, request_id: requested.body.pairing.request_id, pairing_code: requested.body.pairing.pairing_code }) });
      assert.equal(approval.response.status, 200);
    }
    const signedReady = await hostReady(challenge.challenge_id, capability());
    assert.equal(signedReady.response.status, 200);
    assert.equal(signedReady.body.witness.host_ready.proof_kind, "SIGNED_LOCAL_SHELL_HOSTNAME");
    const status = await json(route, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phase: "PAIRING_STATUS", challenge_id: challenge.challenge_id, request_id: requested.body.pairing.request_id }) });
    assert.equal(status.response.status, 200);
    assert.equal(status.body.pairing.status, "REJECTED");
    const redeem = await redeemPairing(challenge.challenge_id, requested.body.pairing.request_id, pairedCap, key.privateKey);
    assert.equal(redeem.response.status, 409);
    assert.equal(redeem.body.error, "SALLY_PAIRING_NOT_APPROVED");
  }
  assert.equal((await json("/api/harvey/commands?machine=Doss")).body.commands.length, commandsBefore);
});

test("tampered witness state fails closed without leaking unknown fields", async () => {
  const witnessRoot = path.join(workspace, "data", "harvey", "machine-control", "sally-witness");
  await fs.rm(witnessRoot, { recursive: true, force: true });
  await fs.mkdir(witnessRoot, { recursive: true });
  await fs.writeFile(path.join(witnessRoot, "active.json"), JSON.stringify({
    schema: "werkles.harvey-sally-witness-state-envelope/v1",
    state: { schema: "werkles.harvey-sally-browser-witness/v1", challenge_id: `sally_${"a".repeat(32)}`, status: "COMPLETED", HARVEY_OPERATOR_TOKEN: "BEAN_FAKE_SECRET_MARKER", internal_path: "C:\\Users\\BenLeak\\secrets\\token.txt" },
    hmac_sha256: "0".repeat(64)
  }));
  const result = await json(route);
  assert.equal(result.response.status, 503);
  assert.equal(JSON.stringify(result.body).includes("BEAN_FAKE_SECRET_MARKER"), false);
  assert.equal(JSON.stringify(result.body).includes("BenLeak"), false);
  const recovered = await createChallenge();
  assert.match(recovered.challenge_id, /^sally_[a-f0-9]{32}$/);
  const quarantineRoot = path.join(witnessRoot, "quarantine");
  assert.equal((await fs.readdir(quarantineRoot)).length, 1);
  await fs.rm(witnessRoot, { recursive: true, force: true });
});

test("an expired challenge closes durably with a bounded public receipt", async () => {
  const witnessRoot = path.join(workspace, "data", "harvey", "machine-control", "sally-witness");
  await fs.rm(witnessRoot, { recursive: true, force: true });
  const challenge = await createChallenge();
  const activeFile = path.join(witnessRoot, "active.json");
  const envelope = JSON.parse(await fs.readFile(activeFile, "utf8"));
  envelope.state.expires_at = "2000-01-01T00:00:00.000Z";
  envelope.hmac_sha256 = signState(envelope.state);
  await fs.writeFile(activeFile, `${JSON.stringify(envelope, null, 2)}\n`, "utf8");
  const result = await json(route);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.witness.status, "EXPIRED");
  assert.match(result.body.witness.expired_receipt.receipt_id, /^sally_expired_/);
  assert.equal(await fs.stat(path.join(witnessRoot, "history", `${challenge.challenge_id}.json`)).then(() => true).catch(() => false), true);

  const createExpired = await createChallenge();
  const createExpiredEnvelope = JSON.parse(await fs.readFile(activeFile, "utf8"));
  createExpiredEnvelope.state.expires_at = "2000-01-01T00:00:00.000Z";
  createExpiredEnvelope.hmac_sha256 = signState(createExpiredEnvelope.state);
  await fs.writeFile(activeFile, `${JSON.stringify(createExpiredEnvelope, null, 2)}\n`, "utf8");
  const createdAfterExpiry = await createChallenge();
  assert.notEqual(createdAfterExpiry.challenge_id, createExpired.challenge_id);
  const createHistory = JSON.parse(await fs.readFile(path.join(witnessRoot, "history", `${createExpired.challenge_id}.json`), "utf8"));
  assert.equal(createHistory.state.status, "EXPIRED");
  assert.match(createHistory.state.expired_receipt.receipt_id, /^sally_expired_/);

  const reissueExpiredEnvelope = JSON.parse(await fs.readFile(activeFile, "utf8"));
  reissueExpiredEnvelope.state.expires_at = "2000-01-01T00:00:00.000Z";
  reissueExpiredEnvelope.hmac_sha256 = signState(reissueExpiredEnvelope.state);
  await fs.writeFile(activeFile, `${JSON.stringify(reissueExpiredEnvelope, null, 2)}\n`, "utf8");
  const reissuedAfterExpiry = await json(route, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" }, body: JSON.stringify({ phase: "REISSUE" }) });
  assert.equal(reissuedAfterExpiry.response.status, 200);
  const reissueHistory = JSON.parse(await fs.readFile(path.join(witnessRoot, "history", `${createdAfterExpiry.challenge_id}.json`), "utf8"));
  assert.equal(reissueHistory.state.status, "EXPIRED");
  assert.match(reissueHistory.state.expired_receipt.receipt_id, /^sally_expired_/);
  await fs.rm(witnessRoot, { recursive: true, force: true });
});

test("pending or approved Sally pairing cannot cross challenge expiry", async () => {
  const witnessRoot = path.join(workspace, "data", "harvey", "machine-control", "sally-witness");
  await fs.rm(witnessRoot, { recursive: true, force: true });
  const activeFile = path.join(witnessRoot, "active.json");
  const heartbeatFile = path.join(workspace, "data", "harvey", "machine-control", "machines", "sally.json");
  await fs.rm(heartbeatFile, { force: true });
  const heartbeatBefore = await fs.readFile(heartbeatFile).catch(() => null);
  const commandsBefore = (await json("/api/harvey/commands?machine=Doss")).body.commands.length;

  const pendingChallenge = await createChallenge();
  const pendingCap = capability();
  const pendingKey = pairingKey();
  const pending = await pairingRequest(pendingChallenge.challenge_id, pendingCap, pendingKey.publicKeyJwk);
  const pendingEnvelope = JSON.parse(await fs.readFile(activeFile, "utf8"));
  pendingEnvelope.state.expires_at = "2000-01-01T00:00:00.000Z";
  pendingEnvelope.hmac_sha256 = signState(pendingEnvelope.state);
  await fs.writeFile(activeFile, `${JSON.stringify(pendingEnvelope, null, 2)}\n`, "utf8");
  const lateApproval = await json(route, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" }, body: JSON.stringify({ phase: "APPROVE_PAIRING", challenge_id: pendingChallenge.challenge_id, request_id: pending.body.pairing.request_id, pairing_code: pending.body.pairing.pairing_code }) });
  assert.equal(lateApproval.response.status, 410);
  const expiredPending = await json(route);
  assert.equal(expiredPending.body.witness.status, "EXPIRED");
  assert.equal(expiredPending.body.witness.host_ready, undefined);

  const approvedChallenge = await createChallenge();
  const approvedCap = capability();
  const approvedKey = pairingKey();
  const approvedRequest = await pairingRequest(approvedChallenge.challenge_id, approvedCap, approvedKey.publicKeyJwk);
  const approval = await json(route, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" }, body: JSON.stringify({ phase: "APPROVE_PAIRING", challenge_id: approvedChallenge.challenge_id, request_id: approvedRequest.body.pairing.request_id, pairing_code: approvedRequest.body.pairing.pairing_code }) });
  assert.equal(approval.response.status, 200);
  const approvedEnvelope = JSON.parse(await fs.readFile(activeFile, "utf8"));
  approvedEnvelope.state.expires_at = "2000-01-01T00:00:00.000Z";
  approvedEnvelope.hmac_sha256 = signState(approvedEnvelope.state);
  await fs.writeFile(activeFile, `${JSON.stringify(approvedEnvelope, null, 2)}\n`, "utf8");
  const lateRedeem = await redeemPairing(approvedChallenge.challenge_id, approvedRequest.body.pairing.request_id, approvedCap, approvedKey.privateKey);
  assert.equal(lateRedeem.response.status, 410);
  const expiredApproved = await json(route);
  assert.equal(expiredApproved.body.witness.status, "EXPIRED");
  assert.equal(expiredApproved.body.witness.host_ready, undefined);
  assert.equal((await json("/api/harvey/commands?machine=Doss")).body.commands.length, commandsBefore);
  assert.deepEqual(await fs.readFile(heartbeatFile).catch(() => null), heartbeatBefore);
});

test("an already-open Harvey witness page returns browser completion without reload", async () => {
  const challenge = await createChallenge();
  const cap = capability();
  const ready = await hostReady(challenge.challenge_id, cap);
  assert.equal(ready.response.status, 200);
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  const page = await browser.newPage({ viewport: { width: 360, height: 900 } });
  try {
    const pageErrors = [];
    page.on("pageerror", (reason) => pageErrors.push(reason.message));
    await page.addInitScript(() => {
      Object.defineProperty(window.crypto, "randomUUID", { configurable: true, value: undefined });
    });
    let pageReadyAttempts = 0;
    let witnessGetAttempts = 0;
    await page.route("**/api/harvey/witness", async (intercept) => {
      const request = intercept.request();
      if (request.method() === "GET" && witnessGetAttempts++ === 0) {
        await intercept.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, error: "INJECTED_TRANSIENT_WITNESS_READ_FAILURE" }) });
        return;
      }
      if (request.method() === "POST" && request.postData()?.includes('"phase":"PAGE_READY"') && pageReadyAttempts++ === 0) {
        await intercept.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, error: "INJECTED_TRANSIENT_PAGE_READY_FAILURE" }) });
        return;
      }
      await intercept.continue();
    });
    await page.goto(`${base}/harvey?sally_acceptance=${challenge.challenge_id}#witness=${cap}`, { waitUntil: "domcontentloaded", timeout: 15_000 });
    assert.equal(await page.evaluate(() => typeof window.crypto.randomUUID), "undefined");
    const timeOrigin = await page.evaluate(() => performance.timeOrigin);
    const navigationCount = await page.evaluate(() => performance.getEntriesByType("navigation").length);
    const transientReadAlert = page.getByRole("alert").filter({ hasText: "INJECTED_TRANSIENT_WITNESS_READ_FAILURE" });
    await transientReadAlert.waitFor({ timeout: 8_000 });
    await transientReadAlert.waitFor({ state: "detached", timeout: 8_000 });
    await page.getByTestId("sally-witness-status").getByText("PAGE READY", { exact: true }).waitFor({ timeout: 8_000 });
    await page.getByTestId("sally-witness-status").getByText("PING QUEUED", { exact: true }).waitFor({ timeout: 8_000 });
    const commandId = await page.getByTestId("sally-witness-command").textContent();
    assert.match(commandId, /^harvey_doss_/);
    const claim = await updateCommand("Doss", { command_id: commandId, status: "RECEIVED", evidence: "Sally browser witness received" });
    await page.getByTestId("sally-witness-status").getByText("PING RECEIVED", { exact: true }).waitFor({ timeout: 8_000 });
    await updateCommand("Doss", { command_id: commandId, status: "COMPLETED", claim_id: claim.body.command.claim.claim_id, evidence: "Sally browser witness completed" });
    await page.getByTestId("sally-witness-status").getByText("PING COMPLETED", { exact: true }).waitFor({ timeout: 8_000 });
    await page.getByTestId("sally-witness-status").getByText("BROWSER COMPLETED", { exact: true }).waitFor({ timeout: 10_000 });
    assert.equal(await page.evaluate(() => performance.timeOrigin), timeOrigin);
    assert.equal(await page.evaluate(() => performance.getEntriesByType("navigation").length), navigationCount);
    const boundary = await page.getByTestId("sally-witness-boundary").textContent();
    assert.match(boundary, /Current Sally topology: DISCONNECTED/);
    assert.doesNotMatch(boundary, /Current Sally topology: LIVE/);
    const mobileLayout = await page.evaluate(() => ({
      fits: document.documentElement.scrollWidth <= window.innerWidth,
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      overflow: [...document.querySelectorAll("*")]
        .map((element) => ({ tag: element.tagName, text: (element.textContent ?? "").trim().slice(0, 80), left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }))
        .filter((element) => element.right > window.innerWidth + 1 || element.left < -1 || element.scrollWidth > element.clientWidth + 1)
        .slice(0, 12)
    }));
    assert.equal(mobileLayout.fits, true, JSON.stringify(mobileLayout));
    assert.equal(await page.getByTestId("sally-witness-status").evaluate((element) => element.getBoundingClientRect().top < window.innerHeight), true);
    const publicState = await (await fetch(`${base}/api/harvey/witness`, { cache: "no-store" })).json();
    assert.equal(publicState.witness.status, "COMPLETED");
    assert.equal(publicState.witness.sally_live_claimed, false);
    assert.equal(publicState.witness.command.command_id, commandId);
    const html = await page.content();
    assert.equal(html.includes(cap), false);
    const storage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, hash: location.hash }));
    assert.equal(storage.includes(cap), false);
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
  }
});

test("Harvey witness stays readable and fails closed when browser CSPRNG is unavailable", async () => {
  const commandsBefore = (await json("/api/harvey/commands?machine=Doss")).body.commands.length;
  const challenge = await createChallenge();
  const cap = capability();
  const ready = await hostReady(challenge.challenge_id, cap);
  assert.equal(ready.response.status, 200);
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  const page = await browser.newPage({ viewport: { width: 360, height: 900 } });
  const pageErrors = [];
  let witnessPosts = 0;
  page.on("pageerror", (reason) => pageErrors.push(reason.message));
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === route) witnessPosts += 1;
  });
  try {
    await page.addInitScript(() => {
      Object.defineProperties(window.crypto, {
        randomUUID: { configurable: true, value: undefined },
        getRandomValues: { configurable: true, value: undefined }
      });
    });
    await page.goto(`${base}/harvey?sally_acceptance=${challenge.challenge_id}#witness=${cap}`, { waitUntil: "domcontentloaded", timeout: 15_000 });
    assert.deepEqual(await page.evaluate(() => ({ randomUUID: typeof window.crypto.randomUUID, getRandomValues: typeof window.crypto.getRandomValues })), { randomUUID: "undefined", getRandomValues: "undefined" });
    await page.getByRole("alert").filter({ hasText: "SALLY_WITNESS_CSPRNG_UNAVAILABLE" }).waitFor({ timeout: 8_000 });
    assert.equal(await page.evaluate(() => location.hash), "");
    assert.equal(witnessPosts, 0);
    assert.deepEqual(pageErrors, []);
    const commandsAfter = (await json("/api/harvey/commands?machine=Doss")).body.commands.length;
    assert.equal(commandsAfter, commandsBefore);
  } finally {
    await browser.close();
  }
});

test("Doss Harvey displays distinct pairing codes, cancel mutates nothing, and approval binds the exact selected card", async () => {
  const witnessRoot = path.join(workspace, "data", "harvey", "machine-control", "sally-witness");
  await fs.rm(witnessRoot, { recursive: true, force: true });
  const challenge = await createChallenge();
  const first = await pairingRequest(challenge.challenge_id, capability(), pairingKey().publicKeyJwk);
  const second = await pairingRequest(challenge.challenge_id, capability(), pairingKey().publicKeyJwk);
  assert.notEqual(first.body.pairing.pairing_code, second.body.pairing.pairing_code);
  let approvalCalls = 0;
  let dialogs = 0;
  const bridgeRequests = [];
  const pageErrors = [];
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  const page = await browser.newPage({ viewport: { width: 360, height: 900 } });
  try {
    await page.route("**/*", async (intercept) => {
      const request = intercept.request();
      const url = new URL(request.url());
      if (url.port !== "3002") return intercept.continue();
      bridgeRequests.push(`${request.method()} ${url.pathname}`);
      const cors = { "access-control-allow-origin": origin, "access-control-allow-methods": "POST, OPTIONS, GET", "access-control-allow-headers": "content-type", "content-type": "application/json" };
      if (request.method() === "OPTIONS") return intercept.fulfill({ status: 204, headers: cors, body: "" });
      if (url.pathname === "/health") return intercept.fulfill({ status: 200, headers: cors, body: JSON.stringify({ ok: true, service: "harvey-operator-bridge", bind: "loopback" }) });
      if (url.pathname === "/sally-witness/pairings") {
        const details = await json(route, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" }, body: JSON.stringify({ phase: "PAIRING_DETAILS" }) });
        return intercept.fulfill({ status: details.response.status, headers: cors, body: JSON.stringify(details.body) });
      }
      if (url.pathname === "/sally-witness/approve") {
        approvalCalls += 1;
        const input = request.postDataJSON();
        const approval = await json(route, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" }, body: JSON.stringify({ phase: "APPROVE_PAIRING", ...input }) });
        return intercept.fulfill({ status: approval.response.status, headers: cors, body: JSON.stringify(approval.body) });
      }
      return intercept.fulfill({ status: 404, headers: cors, body: JSON.stringify({ ok: false, error: "TEST_BRIDGE_ROUTE_NOT_FOUND" }) });
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("dialog", async (dialog) => {
      dialogs += 1;
      if (dialogs === 1) await dialog.dismiss();
      else await dialog.accept();
    });
    await page.goto(`${base}/harvey`, { waitUntil: "domcontentloaded", timeout: 15_000 });
    const codes = page.getByTestId("sally-pairing-code");
    for (let attempt = 0; attempt < 80 && await codes.count() === 0; attempt += 1) await page.waitForTimeout(100);
    assert.ok(await codes.count() > 0, JSON.stringify({ href: page.url(), hostname: await page.evaluate(() => window.location.hostname), bridgeRequests, pageErrors, body: (await page.locator("body").innerText()).slice(0, 2000) }));
    assert.equal(await codes.count(), 2);
    const displayedCodes = await codes.allTextContents();
    assert.deepEqual(new Set(displayedCodes), new Set([first.body.pairing.pairing_code, second.body.pairing.pairing_code]));
    const buttons = page.getByRole("button", { name: "APPROVE THIS EXACT SALLY CODE" });
    await buttons.first().click();
    await page.waitForTimeout(200);
    assert.equal(approvalCalls, 0);
    const afterCancel = await json(route, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" }, body: JSON.stringify({ phase: "PAIRING_DETAILS" }) });
    assert.equal(afterCancel.body.pairings.filter((pairing) => pairing.status === "PENDING").length, 2);

    const selectedCode = displayedCodes[1];
    await buttons.nth(1).click();
    for (let attempt = 0; attempt < 40 && approvalCalls === 0; attempt += 1) await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(approvalCalls, 1);
    let afterApproval;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      afterApproval = await json(route, { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" }, body: JSON.stringify({ phase: "PAIRING_DETAILS" }) });
      if (afterApproval.body.pairings.find((pairing) => pairing.pairing_code === selectedCode)?.status === "APPROVED") break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    const selected = afterApproval.body.pairings.find((pairing) => pairing.pairing_code === selectedCode);
    assert.equal(selected.status, "APPROVED");
    assert.equal(afterApproval.body.pairings.find((pairing) => pairing.pairing_code !== selectedCode).status, "REJECTED");
    const mobileApprovalLayout = await page.evaluate(() => ({
      fits: document.documentElement.scrollWidth <= window.innerWidth,
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      overflow: [...document.querySelectorAll("*")]
        .map((element) => ({ tag: element.tagName, text: (element.textContent ?? "").trim().slice(0, 80), left: element.getBoundingClientRect().left, right: element.getBoundingClientRect().right, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth }))
        .filter((element) => element.right > window.innerWidth + 1 || element.left < -1 || element.scrollWidth > element.clientWidth + 1)
        .slice(0, 12)
    }));
    assert.equal(mobileApprovalLayout.fits, true, JSON.stringify(mobileApprovalLayout));
    assert.equal((await json(route)).body.witness.sally_live_claimed, false);
  } finally {
    await browser.close();
  }
});

test("reissue archives the prior challenge and a Doss blocker closes the new witness", async () => {
  const original = await createChallenge();
  const historyRoot = path.join(workspace, "data", "harvey", "machine-control", "sally-witness", "history");
  await fs.mkdir(historyRoot, { recursive: true });
  for (let index = 0; index < 270; index += 1) {
    const oldFile = path.join(historyRoot, `old-${String(index).padStart(3, "0")}.json`);
    await fs.writeFile(oldFile, "{}", "utf8");
    await fs.utimes(oldFile, new Date("2000-01-01T00:00:00.000Z"), new Date("2000-01-01T00:00:00.000Z"));
  }
  const reissued = await json(route, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" },
    body: JSON.stringify({ phase: "REISSUE" })
  });
  assert.equal(reissued.response.status, 200);
  assert.notEqual(reissued.body.witness.challenge_id, original.challenge_id);
  const historyFile = path.join(historyRoot, `${original.challenge_id}.json`);
  assert.equal(await fs.stat(historyFile).then(() => true).catch(() => false), true);
  assert.ok((await fs.readdir(historyRoot)).length <= 256);

  const cap = capability();
  const ready = await hostReady(reissued.body.witness.challenge_id, cap);
  assert.equal(ready.response.status, 200);
  const attached = await pageReady(reissued.body.witness.challenge_id, cap);
  assert.equal(attached.response.status, 200);
  const commandId = attached.body.witness.command.command_id;
  const claim = await updateCommand("Doss", { command_id: commandId, status: "RECEIVED", evidence: "Sally blocker test received" });
  await updateCommand("Doss", { command_id: commandId, status: "BLOCKER", claim_id: claim.body.command.claim.claim_id, evidence: "Sally blocker test terminal" });
  const publicState = await json(route);
  assert.equal(publicState.body.witness.status, "BLOCKER");
  assert.equal(publicState.body.witness.blocker.code, "SALLY_WITNESS_DOSS_PING_BLOCKER");
});
