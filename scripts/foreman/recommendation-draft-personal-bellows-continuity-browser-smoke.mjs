import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

try {
  await context.addCookies([{
    name: "werkles_bellows_owner",
    value: "bellows_owner_4185d54c-e055-4929-91a0-6181bf461384",
    url: "http://127.0.0.1:3000"
  }]);
  await page.goto("http://127.0.0.1:3000/bellows/recommendations?option=find_equipment", { waitUntil: "load" });
  const form = page.locator(".squibb-work-path__form");
  await form.getByRole("heading", { name: "Equipment comparison brief" }).waitFor();
  await form.locator("textarea").first().fill("Move 3,000 lb pallets through a seven-foot opening by October 1.");
  await form.getByRole("button", { name: "Save in this browser" }).click();
  await page.getByText("Saved only in this browser profile. Clearing browser data removes it, and another browser or device will not have it.", { exact: true }).waitFor();

  await page.evaluate(() => window.localStorage.setItem("werkles:recommendation-work:v2:find_partner", '{"role":[]}'));
  await page.goto("http://127.0.0.1:3000/bellows/personal", { waitUntil: "load" });
  await page.getByText("Equipment comparison brief", { exact: true }).waitFor();
  assert.equal(await page.getByText("Partner test brief", { exact: true }).count(), 0, "malformed drafts must stay off the shelf");
  const exactLink = page.getByRole("link", { name: "Open Exact Option" });
  assert.equal(await exactLink.count(), 1);
  assert.match(await exactLink.getAttribute("href"), /option=find_equipment/);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "My Bellows must fit 390px");
  await exactLink.click();
  await page.waitForURL(/option=find_equipment/);
  await form.getByRole("heading", { name: "Equipment comparison brief" }).waitFor();
  assert.match(await form.locator("textarea").first().inputValue(), /3,000 lb pallets/);
  await page.getByRole("link", { name: "Open My Bellows Lesson" }).waitFor();
  await page.getByRole("link", { name: "Open Public Version" }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Recommendations must fit 390px");
  await page.goto("http://127.0.0.1:3000/bellows/recommendations?option=not-a-real-option", { waitUntil: "load" });
  await page.locator(".squibb-work-path__form").waitFor();
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("PASS Recommendation save → My Bellows shelf → exact option reopen at 390px");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 7000));
  throw error;
} finally {
  await browser.close();
}
