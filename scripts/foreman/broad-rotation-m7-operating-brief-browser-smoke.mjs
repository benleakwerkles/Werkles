import assert from "node:assert/strict";
import { chromium } from "playwright";

const formation = "http://127.0.0.1:3000/dashboard/werkles/formation?candidate=ghost_095";
const personalBellows = "http://127.0.0.1:3000/bellows/personal";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();
page.setDefaultTimeout(20_000);
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

try {
  await context.addCookies([{
    name: "werkles_bellows_owner",
    value: "bellows_owner_4185d54c-e055-4929-91a0-6181bf461384",
    url: "http://127.0.0.1:3000"
  }]);
  await page.goto(formation, { waitUntil: "load" });
  await page.evaluate(() => { window.localStorage.clear(); window.sessionStorage.clear(); });
  await page.reload({ waitUntil: "load" });

  const shared = page.locator(".werkle-merge-canvas__shared");
  await shared.getByRole("button", { name: "Write this together", exact: true }).click();
  await page.locator("#joint-purpose").fill("We will test one reachable customer problem before either person makes a larger promise.");
  await page.locator("#joint-purpose").blur();
  await shared.getByRole("button", { name: "Accept revision 2", exact: true }).click();
  await page.getByRole("button", { name: /Apply .* synthetic response/ }).click();
  await page.getByRole("button", { name: "Build the Operating Brief", exact: true }).click();

  await page.getByText("Current brief.", { exact: true }).waitFor();
  assert.equal(await page.getByText("Not yet written by both people.", { exact: true }).count(), 4, "four untouched sections must remain explicitly empty");
  assert.ok(await page.getByText("Still to settle", { exact: true }).count() >= 1, "a partly completed section must show its remaining conversations");
  await page.getByText("First customer or use case", { exact: true }).last().waitFor();
  await page.getByText("First 30-day test", { exact: true }).last().waitFor();

  const openTopicStyle = await page.locator(".werkle-operating-brief__open-topics li small").first().evaluate((element) => ({
    fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
    color: getComputedStyle(element).color
  }));
  assert.ok(openTopicStyle.fontSize >= 16, `open-topic status fell below 16px: ${JSON.stringify(openTopicStyle)}`);
  assert.equal(openTopicStyle.color, "rgb(216, 255, 247)");

  await page.getByRole("button", { name: "Save on this device", exact: true }).click();
  await page.getByLabel("What will you do?").fill("Call two prospective customers and compare the same three questions.");
  await page.getByLabel("Who volunteered?").fill("You");
  await page.getByLabel("When will you check back?").fill("2026-08-30");
  await page.getByLabel("What would count as done?").fill("Two recorded conversations and one written continue, revise, or stop decision.");
  await page.getByRole("button", { name: "Save Proposed Action on This Device", exact: true }).click();

  await page.goto("http://127.0.0.1:3000/dashboard/crucible#match-check-context", { waitUntil: "load" });
  await page.getByRole("heading", { name: "Check only what could change this plan." }).waitFor();
  await page.getByText("Call two prospective customers and compare the same three questions.", { exact: true }).waitFor();

  await page.goto(personalBellows, { waitUntil: "load" });
  await page.getByRole("heading", { name: "Return to the test you were shaping together." }).waitFor();
  await page.getByText("Call two prospective customers and compare the same three questions.", { exact: true }).waitFor();

  await page.goto(formation, { waitUntil: "load" });
  await page.getByText("Current brief.", { exact: true }).waitFor();
  await page.locator("#joint-purpose").fill("A revised purpose that requires both records to accept again.");
  await page.locator("#joint-purpose").blur();
  await page.getByText("The brief is out of date.", { exact: true }).waitFor();
  const deviceState = await page.evaluate(() => ({
    brief: window.localStorage.getItem("werkles:werkle:operating-brief:v1"),
    action: window.localStorage.getItem("werkles:formation:first-shared-action:v1")
  }));
  assert.deepEqual(deviceState, { brief: null, action: null }, "stale accepted wording must invalidate both the device brief and its derived action");

  await page.goto(personalBellows, { waitUntil: "load" });
  assert.equal(await page.getByRole("heading", { name: "Return to the test you were shaping together." }).count(), 0, "Personal Bellows must not resurrect a stale shared action");
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("PASS M7 Formation → Operating Brief → Personal Bellows: partial gaps visible, 16px status floor, exact device return, and stale brief/action invalidation.");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE", await page.url());
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 12000));
  throw error;
} finally {
  await browser.close();
}
