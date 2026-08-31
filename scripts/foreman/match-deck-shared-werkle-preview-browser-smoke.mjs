import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const mobile = process.env.WERKLES_SMOKE_VIEWPORT === "390";
const context = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1100 },
});
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

try {
  await context.addCookies([{
    name: "werkles_bellows_owner",
    value: "bellows_owner_4185d54c-e055-4929-91a0-6181bf461384",
    url: "http://127.0.0.1:3000"
  }]);
  await page.goto("http://127.0.0.1:3000/dashboard/blueprints", { waitUntil: "load" });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Workshop should not overflow its viewport");
  await page.getByRole("heading", { name: "Turn the tangled version into a plan you can use." }).waitFor();
  await page.getByRole("link", { name: "Build or Review My Action Plan" }).waitFor();
  await page.goto("http://127.0.0.1:3000/dashboard/intros", { waitUntil: "load" });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Match Deck should not overflow its viewport");
  await page.getByRole("heading", { name: /useful possibilit/i }).waitFor();
  await page.getByRole("heading", { name: "People worth a closer look." }).waitFor();

  const selectedName = (await page.locator(".ghost-member-lab__profile h3").textContent())?.trim();
  assert.ok(selectedName, "a selected practice profile should render");
  await page.locator(".ghost-member-lab__questions button").first().click();
  await page.getByRole("button", { name: "Start a Practice Werkle" }).click();
  await page.waitForURL("**/dashboard/werkles/formation?candidate=**");
  await page.getByRole("heading", { name: "Build the company without erasing either person." }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Formation should not overflow its viewport");
  await page.locator('[data-work-location="possible_werkle"]').getByRole("heading", { name: "Possible Werkle" }).waitFor();
  await page.getByRole("link", { name: "Continue This Possible Werkle" }).waitFor();
  await page.getByText("Nothing here contacts a real person", { exact: true }).waitFor();
  await page.getByText("Carried from your Match Deck", { exact: true }).waitFor();
  await page.getByRole("heading", { name: new RegExp(`You answer for you\\. ${selectedName} answers from a fictional profile\\.`) }).waitFor();
  await page.getByText(selectedName, { exact: true }).first().waitFor();
  await page.getByRole("heading", { name: "Only mutual decisions enter this room." }).waitFor();

  await page.getByRole("button", { name: "Purpose Waiting on someone" }).click();
  await page.getByRole("button", { name: "Write this together", exact: true }).click();
  await page.locator("#joint-purpose").fill("Together we will test one repair offer with five reachable customers.");
  await page.locator("#joint-purpose").blur();
  await page.getByRole("button", { name: "Accept revision 2" }).click();
  await page.getByRole("button", { name: new RegExp(`Apply ${selectedName}.*synthetic response`) }).click();
  await page.getByRole("button", { name: "Build the Operating Brief" }).click();
  await page.getByRole("button", { name: "Save on this device", exact: true }).click();
  await page.locator('[data-work-location="existing_werkle"]').getByRole("heading", { name: "Existing Werkle on this device" }).waitFor();
  await page.getByRole("link", { name: "Review the Saved Brief" }).waitFor();
  await page.getByRole("heading", { name: "Plan one action both people can actually review." }).waitFor();
  await page.getByLabel("What will you do?").fill("Interview five potential customers about one repair offer.");
  await page.getByLabel("Who volunteered?").fill("You");
  await page.getByLabel("When will you check back?").fill("2026-09-01");
  await page.getByLabel("What would count as done?").fill("Five interviews are recorded with one clear next decision.");
  await page.getByRole("button", { name: "Save Proposed Action on This Device" }).click();
  await page.getByText(/Saved on this device.*not an assignment or agreement/).waitFor();

  await page.goto("http://127.0.0.1:3000/bellows/personal", { waitUntil: "load" });
  await page.getByRole("heading", { name: "Reopen the work already saved on this device." }).waitFor();
  await page.getByText("Continue existing Werkle", { exact: true }).waitFor();
  await page.getByRole("link", { name: "Continue Existing Werkle" }).waitFor();
  await page.getByText("This browser on this device", { exact: true }).waitFor();
  await page.getByText("No new response or acceptance shown", { exact: true }).waitFor();
  await page.getByRole("heading", { name: "Return to the test you were shaping together." }).waitFor();
  await page.getByText("Interview five potential customers about one repair offer.", { exact: true }).waitFor();
  await page.getByText("Five interviews are recorded with one clear next decision.", { exact: true }).waitFor();

  await page.goto("http://127.0.0.1:3000/dashboard/crucible#match-check-context", { waitUntil: "load" });
  await page.getByRole("heading", { name: "Check only what could change this plan." }).waitFor();
  await page.getByText("Interview five potential customers about one repair offer.", { exact: true }).waitFor();
  await page.getByText(/Provider checks should answer one necessary claim/).waitFor();
  assert.ok(await page.getByText("What happens next", { exact: true }).count() > 0, "Crucible cards should explain their next boundary");
  await page.getByText("Nothing is saved or sent.", { exact: true }).waitFor();

  await page.goto("http://127.0.0.1:3000/dashboard/intros", { waitUntil: "load" });
  await page.getByRole("heading", { name: "Continue that work—or deliberately start another." }).waitFor();
  await page.getByRole("link", { name: "Continue Existing Werkle" }).waitFor();
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);

  console.log(`PASS ${mobile ? "390px " : ""}Match Deck → Formation → shared action → Personal Bellows → Crucible browser walk (${selectedName})`);
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_URL", page.url());
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 6000));
  throw error;
} finally {
  await browser.close();
}
