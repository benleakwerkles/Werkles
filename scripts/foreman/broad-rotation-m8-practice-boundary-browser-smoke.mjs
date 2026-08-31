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

  const formationReadout = page.locator(".practice-boundary-readout");
  await formationReadout.getByRole("heading", { name: "Know exactly what is—and is not—in this practice brief." }).waitFor();
  assert.equal(await formationReadout.getByText("Browser-local practice Werkle on this device—not an account-saved record", { exact: true }).count(), 1);
  assert.equal(await formationReadout.getByText("Practice summary—not an agreement", { exact: true }).count(), 1);
  assert.equal(await page.getByText("Practice summary—not an agreement", { exact: true }).count(), 1, "the boundary must not be repeated below the readout");
  assert.equal(await formationReadout.getByText("No identity, funds, payment, phone, or background provider is active here", { exact: true }).count(), 1);
  const formationTextFloor = await formationReadout.locator("dd").first().evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  assert.ok(formationTextFloor >= 16, `Formation boundary text fell below 16px: ${formationTextFloor}`);

  await page.goto(personalBellows, { waitUntil: "load" });
  assert.equal(await page.locator(".practice-boundary-readout").count(), 0, "Personal Bellows must not imply a Brief exists before one is saved");

  await page.goto(formation, { waitUntil: "load" });
  const shared = page.locator(".werkle-merge-canvas__shared");
  await shared.getByRole("button", { name: "Write this together", exact: true }).click();
  await page.locator("#joint-purpose").fill("We will test one reachable customer problem before either person makes a larger promise.");
  await page.locator("#joint-purpose").blur();
  await shared.getByRole("button", { name: "Accept revision 2", exact: true }).click();
  await page.getByRole("button", { name: /Apply .* synthetic response/ }).click();
  await page.getByRole("button", { name: "Build the Operating Brief", exact: true }).click();
  await page.getByRole("button", { name: "Save on this device", exact: true }).click();

  await page.goto(personalBellows, { waitUntil: "load" });
  const bellowsReadout = page.locator(".practice-boundary-readout");
  await bellowsReadout.getByRole("heading", { name: "Know exactly what is—and is not—in this practice brief." }).waitFor();
  assert.equal(await bellowsReadout.getByText("Only wording both practice records accepted", { exact: true }).count(), 1);
  const bellowsTextFloor = await bellowsReadout.locator("dd").first().evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
  assert.ok(bellowsTextFloor >= 16, `Bellows boundary text fell below 16px: ${bellowsTextFloor}`);
  await page.setViewportSize({ width: 390, height: 844 });
  const narrow = await bellowsReadout.evaluate((element) => ({
    textSize: Number.parseFloat(getComputedStyle(element.querySelector("dd")).fontSize),
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }));
  assert.ok(narrow.textSize >= 16, `Narrow Bellows boundary text fell below 16px: ${JSON.stringify(narrow)}`);
  assert.ok(narrow.pageWidth <= narrow.viewportWidth + 1, `Narrow Bellows page overflowed: ${JSON.stringify(narrow)}`);
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("PASS M8 Practice Boundary Readout: conditional Bellows visibility, exact boundaries, 16px floor, and clean console.");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE", page.url());
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 12000));
  throw error;
} finally {
  await browser.close();
}
