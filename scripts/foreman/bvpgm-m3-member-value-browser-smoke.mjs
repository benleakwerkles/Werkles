import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.goto("http://127.0.0.1:3000/bellows/personal", { waitUntil: "load" });
  const toolActions = await page.locator(".bellows-draft-shelf a").allTextContents();
  assert.equal(toolActions.some((label) => label.trim() === "Open Tool"), false);
  for (const title of ["Constraint Map", "Company Starter Floor", "Evidence Brief", "Partnership Alignment Memo", "Assumption Test", "Supplier Comparison"]) {
    assert.ok(toolActions.some((label) => label.includes(title)), `missing named Bellows action for ${title}`);
  }

  await page.goto("http://127.0.0.1:3000/dashboard/werkles/formation?candidate=ghost_095", { waitUntil: "load" });
  const pause = page.locator(".werkle-formation-pause");
  await pause.getByText("The keys can wait.", { exact: true }).waitFor();
  const pauseImage = pause.locator("img");
  assert.equal(await pauseImage.getAttribute("alt"), "An empty storefront with keys and a lease waiting on the counter");
  const pauseSize = await pause.evaluate((element) => ({ width: element.clientWidth, height: element.clientHeight }));
  assert.ok(pauseSize.width > 700 && pauseSize.height >= 280, `Formation pause is not a meaningful visual break: ${JSON.stringify(pauseSize)}`);

  await page.goto("http://127.0.0.1:3000/dashboard/crucible", { waitUntil: "load" });
  await page.locator(".crucible-tech-journey > summary").click();
  const stages = page.locator(".crucible-tech-journey__stages > li > details");
  assert.equal(await stages.count(), 4);
  assert.equal(await stages.nth(0).getAttribute("open") !== null, true);
  assert.equal(await stages.nth(1).getAttribute("open"), null);
  assert.equal(await stages.nth(2).getAttribute("open"), null);
  assert.equal(await stages.nth(3).getAttribute("open"), null);
  await stages.nth(2).locator(":scope > summary").click();
  const plaidService = stages.nth(2).locator("li[data-stack-state]").filter({ hasText: "Plaid" });
  await plaidService.getByText("Plaid", { exact: true }).waitFor();
  await plaidService.getByText("What moves this forward", { exact: true }).click();
  const journeyText = await page.locator(".crucible-tech-journey").innerText();
  assert.doesNotMatch(journeyText, /Human gate:|Next build:/);
  assert.match(journeyText, /Before this can go live:/);

  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("PASS BVPGM M3 member value: named Bellows actions, grounded Formation pause, and collapsible plain-language provider journey");
} finally {
  await browser.close();
}
