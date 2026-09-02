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
  await page.goto("http://127.0.0.1:3000/bellows/library/company-starter-floor", { waitUntil: "load" });
  await page.getByRole("heading", { name: "Build the floor before you file the paperwork." }).waitFor();
  await page.locator(".launch-floor__count").filter({ hasText: "6areas still open or awaiting review" }).waitFor();
  await page.getByRole("heading", { name: "LLC and S corporation answer different questions." }).waitFor();

  const rows = page.locator(".launch-floor__rows fieldset");
  assert.equal(await rows.count(), 6);
  await rows.nth(0).getByLabel("Status").selectOption("decided");
  await rows.nth(0).getByLabel(/Notes/).fill("Owners and operating state recorded; source checked 2026-08-21.");
  await rows.nth(1).getByLabel("Status").selectOption("review");
  await rows.nth(1).getByLabel(/Notes/).fill("Compare state filing and annual-report rules with counsel.");
  await rows.nth(2).getByLabel("Status").selectOption("decided");
  await rows.nth(2).getByLabel(/Notes/).fill("Current treatment recorded; election question reserved for tax adviser.");
  await page.locator(".launch-floor__count").filter({ hasText: "4areas still open or awaiting review" }).waitFor();
  await page.getByRole("button", { name: "Save on This Device" }).click();
  await page.getByText("Saved on this device. It is not account-saved or shared.").waitFor();

  await page.reload({ waitUntil: "load" });
  await page.getByText("Saved launch board restored from this device. It was not shared.").waitFor();
  assert.equal(await rows.nth(0).getByLabel("Status").inputValue(), "decided");
  assert.match(await rows.nth(0).getByLabel(/Notes/).inputValue(), /source checked/);
  assert.equal(await rows.nth(1).getByLabel("Status").inputValue(), "review");
  await page.locator(".launch-floor__count").filter({ hasText: "4areas still open or awaiting review" }).waitFor();

  await page.getByRole("button", { name: "Clear Device Board" }).click();
  await page.locator(".launch-floor__count").filter({ hasText: "6areas still open or awaiting review" }).waitFor();
  assert.equal(await rows.nth(0).getByLabel("Status").inputValue(), "unknown");
  assert.equal(await rows.nth(0).getByLabel(/Notes/).inputValue(), "");
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);

  console.log("PASS Company Starter Floor browser save/reload/clear walk");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  throw error;
} finally {
  await browser.close();
}
