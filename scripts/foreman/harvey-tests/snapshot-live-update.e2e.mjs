import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";
import { base, json, signedMachineHeaders, updateCommand, workspace } from "./harvey-test-client.mjs";

const chrome = process.env.HARVEY_CHROME_EXE ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

test("an open Harvey page applies heartbeat and receipt truth without navigation", async () => {
  const heartbeatFile = path.join(workspace, "data", "harvey", "machine-control", "machines", "doss.json");
  await fs.unlink(heartbeatFile).catch(() => undefined);
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const snapshotHeaders = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/harvey/snapshot")) snapshotHeaders.push(request.headers());
  });
  try {
    await page.goto(`${base}/harvey`, { waitUntil: "domcontentloaded", timeout: 15_000 });
    const timeOrigin = await page.evaluate(() => performance.timeOrigin);
    const navigationCount = await page.evaluate(() => performance.getEntriesByType("navigation").length);
    await page.getByTestId("machine-Doss-connectivity").getByText("DISCONNECTED", { exact: true }).waitFor();
    await page.getByTestId("workstream-harvey-command-execution").getByText("UNPROVEN", { exact: true }).waitFor();
    assert.equal(await page.getByTestId("controls-Doss").getAttribute("data-proof-enabled"), "false");
    const liveCountWithoutDoss = Number(await page.getByTestId("fleet-controls").getAttribute("data-live-machine-count"));

    const heartbeatRoute = "/api/harvey/machines";
    const heartbeatBody = JSON.stringify({ machine: "Doss", hostname: "DOSS", agent_version: "snapshot-e2e", capabilities: ["PING"] });
    const heartbeatResponse = await fetch(`${base}${heartbeatRoute}`, {
      method: "POST",
      headers: signedMachineHeaders({ method: "POST", route: heartbeatRoute, machine: "Doss", body: heartbeatBody }),
      body: heartbeatBody
    });
    assert.equal(heartbeatResponse.status, 200);
    await page.getByTestId("machine-Doss-connectivity").getByText("LIVE", { exact: true }).waitFor({ timeout: 6_000 });
    assert.equal(await page.getByTestId("controls-Doss").getAttribute("data-proof-enabled"), "true");
    const liveCountWithDoss = Number(await page.getByTestId("fleet-controls").getAttribute("data-live-machine-count"));
    assert.equal(liveCountWithDoss, liveCountWithoutDoss + 1);

    const created = await json("/api/harvey/commands", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer harvey-test-operator-token" },
      body: JSON.stringify({ machine: "Doss", workstream_id: "harvey-command", action: "PING", payload: {} })
    });
    assert.equal(created.response.status, 200);
    const commandId = created.body.command.command_id;
    const claim = await updateCommand("Doss", { command_id: commandId, status: "RECEIVED", evidence: "snapshot e2e received" });
    const completed = await updateCommand("Doss", { command_id: commandId, status: "COMPLETED", claim_id: claim.body.command.claim.claim_id, evidence: "snapshot e2e completed" });
    assert.equal(completed.response.status, 200);
    await page.getByTestId("workstream-harvey-command-execution").getByText("COMMAND COMPLETED", { exact: true }).waitFor({ timeout: 6_000 });

    const heartbeat = JSON.parse(await fs.readFile(heartbeatFile, "utf8"));
    heartbeat.observed_at = new Date(Date.now() - 301_000).toISOString();
    await fs.writeFile(heartbeatFile, `${JSON.stringify(heartbeat, null, 2)}\n`, "utf8");
    await page.getByTestId("machine-Doss-connectivity").getByText("DISCONNECTED", { exact: true }).waitFor({ timeout: 6_000 });
    await page.getByTestId("workstream-harvey-command-execution").getByText("COMMAND COMPLETED", { exact: true }).waitFor();
    assert.equal(await page.getByTestId("controls-Doss").getAttribute("data-proof-enabled"), "false");
    assert.equal(Number(await page.getByTestId("fleet-controls").getAttribute("data-live-machine-count")), liveCountWithDoss - 1);

    const commandFile = path.join(workspace, "data", "harvey", "machine-control", "commands", `${commandId}.json`);
    const corrupted = JSON.parse(await fs.readFile(commandFile, "utf8"));
    corrupted.receipts.at(-1).agent_id = "handeye-sally-sally";
    await fs.writeFile(commandFile, `${JSON.stringify(corrupted, null, 2)}\n`, "utf8");
    await page.getByTestId("machine-Doss-command").getByText("EVIDENCE INVALID", { exact: true }).waitFor({ timeout: 6_000 });
    await page.getByTestId("workstream-harvey-command-execution").getByText("EVIDENCE INVALID", { exact: true }).waitFor();
    assert.equal(await page.getByTestId("machine-Doss-command").textContent(), "EVIDENCE INVALID");

    assert.equal(await page.evaluate(() => performance.timeOrigin), timeOrigin);
    assert.equal(await page.evaluate(() => performance.getEntriesByType("navigation").length), navigationCount);
    assert.ok(snapshotHeaders.length >= 3);
    assert.ok(snapshotHeaders.every((headers) => !headers.authorization && !headers.cookie));
    const browserStorage = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
    for (const secret of ["harvey-test-operator-token", "harvey-test-doss-secret"]) assert.equal(browserStorage.includes(secret), false);
  } finally {
    await browser.close();
  }
});

test("snapshot transport backs off, qualifies last-known truth, fails closed, and recovers without navigation", async () => {
  const heartbeatFile = path.join(workspace, "data", "harvey", "machine-control", "machines", "doss.json");
  await fs.mkdir(path.dirname(heartbeatFile), { recursive: true });
  await fs.writeFile(heartbeatFile, `${JSON.stringify({ machine: "Doss", hostname: "DOSS", agent_id: "handeye-doss-doss", agent_version: "poller-e2e", capabilities: ["PING"], observed_at: new Date().toISOString() })}\n`, "utf8");
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.clock.install({ time: new Date() });
  let failing = true;
  let requestCount = 0;
  let concurrent = 0;
  let maxConcurrent = 0;
  const waitForRequestCount = async (expected) => {
    const deadline = Date.now() + 2_000;
    while (requestCount < expected && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(requestCount, expected);
  };
  await page.route("**/api/harvey/snapshot", async (route) => {
    requestCount += 1;
    concurrent += 1;
    maxConcurrent = Math.max(maxConcurrent, concurrent);
    try {
      if (failing) await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "TEST_TRANSPORT_FAILURE" }) });
      else await route.continue();
    } finally {
      concurrent -= 1;
    }
  });
  try {
    await page.goto(`${base}/harvey`, { waitUntil: "domcontentloaded", timeout: 15_000 });
    const timeOrigin = await page.evaluate(() => performance.timeOrigin);
    const navigationCount = await page.evaluate(() => performance.getEntriesByType("navigation").length);
    await page.getByTestId("machine-Doss-connectivity").getByText("LIVE", { exact: true }).waitFor();

    await page.clock.runFor(2500);
    await page.getByTestId("snapshot-transport").getByText("WAITING", { exact: true }).waitFor();
    await page.getByTestId("machine-Doss-connectivity").getByText("LAST KNOWN LIVE — SNAPSHOT WAITING", { exact: true }).waitFor();
    assert.equal(await page.getByTestId("controls-Doss").getAttribute("data-proof-enabled"), "false");
    assert.equal(requestCount, 1);
    await page.getByTestId("snapshot-next-retry").getByText("proof checks every 5s", { exact: true }).waitFor();

    await page.clock.runFor(4500);
    assert.equal(requestCount, 1);
    await page.clock.runFor(500);
    await waitForRequestCount(2);
    await page.getByTestId("snapshot-next-retry").getByText("proof checks every 10s", { exact: true }).waitFor();
    await page.clock.runFor(9000);
    assert.equal(requestCount, 2);
    await page.clock.runFor(1000);
    await waitForRequestCount(3);
    await page.getByTestId("snapshot-transport").getByText("DISCONNECTED", { exact: true }).waitFor();
    assert.equal(maxConcurrent, 1);
    await page.getByTestId("snapshot-next-retry").getByText("proof checks every 15s", { exact: true }).waitFor();

    failing = false;
    await page.clock.runFor(14_000);
    assert.equal(requestCount, 3);
    await page.clock.runFor(1000);
    await waitForRequestCount(4);
    await page.getByTestId("snapshot-transport").getByText("CURRENT", { exact: true }).waitFor();
    await page.getByTestId("machine-Doss-connectivity").getByText("LIVE", { exact: true }).waitFor();
    assert.equal(await page.getByTestId("controls-Doss").getAttribute("data-proof-enabled"), "true");
    assert.equal(requestCount, 4);
    await page.clock.runFor(2000);
    assert.equal(requestCount, 4);
    await page.clock.runFor(500);
    await waitForRequestCount(5);

    assert.equal(await page.evaluate(() => performance.timeOrigin), timeOrigin);
    assert.equal(await page.evaluate(() => performance.getEntriesByType("navigation").length), navigationCount);
  } finally {
    await page.close();
    assert.equal(concurrent, 0);
    await browser.close();
  }
});
