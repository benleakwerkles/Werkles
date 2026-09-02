import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.setDefaultTimeout(15_000);
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.goto("http://127.0.0.1:3000/bellows/library/pitch-is-not-the-plan", { waitUntil: "load" });
  await page.getByRole("heading", { name: "Name the stop. Keep three causes alive." }).waitFor();
  await page.locator(".constraint-map__count").filter({ hasText: "14fields still unresolved" }).waitFor();

  await page.getByLabel("The work stops when…").fill("Approved jobs wait more than five days before equipment can be scheduled.");
  const first = page.locator(".constraint-map__causes fieldset").first();
  await first.getByLabel("Cause to test").fill("The equipment is already committed to other jobs.");
  await first.getByLabel("Evidence for it").fill("Three dated schedule conflicts in the last month.");
  await first.getByLabel("Evidence against it").fill("Two delays happened while the equipment was idle.");
  await first.getByLabel("Cheapest honest check").fill("Compare job approval times with the equipment calendar for thirty days.");
  await page.getByLabel("Finish the first check by").fill("2026-09-15");
  await page.locator(".constraint-map__count").filter({ hasText: "8fields still unresolved" }).waitFor();
  await page.getByRole("button", { name: "Save on This Device" }).click();
  await page.getByText("Saved on this device. It is not account-saved or shared.").waitFor();

  await page.reload({ waitUntil: "load" });
  await page.getByText("Saved Constraint Map restored from this device. It was not shared.").waitFor();
  assert.match(await page.getByLabel("The work stops when…").inputValue(), /Approved jobs wait/);
  assert.match(await first.getByLabel("Evidence against it").inputValue(), /equipment was idle/);
  await page.locator(".constraint-map__count").filter({ hasText: "8fields still unresolved" }).waitFor();

  await page.getByRole("button", { name: "Clear Device Map" }).click();
  await page.locator(".constraint-map__count").filter({ hasText: "14fields still unresolved" }).waitFor();
  assert.equal(await page.getByLabel("The work stops when…").inputValue(), "");
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);

  console.log("PASS Constraint Map browser save/reload/clear walk");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  throw error;
} finally {
  await browser.close();
}
