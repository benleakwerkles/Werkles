import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";
import { chromium } from "playwright";

const chrome = process.env.HARVEY_CHROME_EXE ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

test("Doss localhost Harvey issues a command without exposing operator credentials or reloading", async () => {
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const browserAuthorizationHeaders = [];
  page.on("request", (request) => {
    const authorization = request.headers().authorization;
    if (authorization) browserAuthorizationHeaders.push({ url: request.url(), authorization });
  });
  try {
    await page.goto("http://127.0.0.1:3000/harvey", { waitUntil: "domcontentloaded", timeout: 15_000 });
    const timeOrigin = await page.evaluate(() => performance.timeOrigin);
    const initialRevision = await page.getByTestId("snapshot-revision").textContent();
    const initialLiveAnnouncement = await page.getByTestId("snapshot-live-announcement").textContent();
    const doss = page.locator("article").filter({ hasText: "Doss" }).filter({ has: page.getByRole("button", { name: "PING" }) }).first();
    const ping = doss.getByRole("button", { name: "PING" });
    await ping.waitFor({ state: "visible" });
    await page.waitForFunction(() => {
      const button = [...document.querySelectorAll("button")].find((item) => item.textContent === "PING");
      return button instanceof HTMLButtonElement && !button.disabled;
    }, { timeout: 10_000 });
    assert.equal(await ping.isEnabled(), true);
    await doss.getByText("DOSS LOCAL · OPERATOR BRIDGE CONNECTED").waitFor({ state: "visible" });
    await ping.click();
    await doss.getByText(/COMPLETED/).waitFor({ state: "visible", timeout: 15_000 });
    await page.getByTestId("workstream-harvey-command-execution").getByText("COMMAND COMPLETED", { exact: true }).waitFor({ state: "visible", timeout: 6_000 });
    await page.waitForFunction((before) => document.querySelector('[data-testid="snapshot-revision"]')?.textContent !== before, initialRevision, { timeout: 6_000 });
    assert.equal(await page.getByTestId("snapshot-live-announcement").textContent(), initialLiveAnnouncement);
    assert.equal(await page.evaluate(() => performance.timeOrigin), timeOrigin);
    assert.deepEqual(browserAuthorizationHeaders, []);
    const output = path.join(process.cwd(), "outputs", "harvey-tests", "HARVEY_DOSS_ACTIONABLE_UI.png");
    await fs.mkdir(path.dirname(output), { recursive: true });
    await page.screenshot({ path: output, fullPage: true });
  } finally {
    await browser.close();
  }
});

test("Harvey reached over the LAN stays read-only and cannot call the Doss operator bridge", async () => {
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const bridgeRequests = [];
  page.on("request", (request) => {
    if (new URL(request.url()).port === "3002") bridgeRequests.push(request.url());
  });
  try {
    await page.goto("http://10.1.10.8:3000/harvey", { waitUntil: "domcontentloaded", timeout: 15_000 });
    await page.getByText("READ ONLY · Doss localhost operator bridge is not connected on this browser").waitFor({ state: "visible" });
    const doss = page.locator("article").filter({ hasText: "Doss" }).filter({ has: page.getByRole("button", { name: "PING" }) }).first();
    assert.equal(await doss.getByRole("button", { name: "PING" }).isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "KNOCK ALL LIVE" }).isDisabled(), true);
    assert.deepEqual(bridgeRequests, []);
  } finally {
    await browser.close();
  }
});
