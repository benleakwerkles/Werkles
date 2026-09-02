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
  await context.addCookies([{ name: "werkles_bellows_owner", value: "bellows_owner_4185d54c-e055-4929-91a0-6181bf461384", url: "http://127.0.0.1:3000" }]);
  await page.goto("http://127.0.0.1:3000/dashboard/intros", { waitUntil: "load" });
  await page.getByRole("heading", { name: /useful possibilit/i }).waitFor();
  const selectedName = (await page.locator(".ghost-member-lab__profile h3").innerText()).trim();
  const reasonItem = page.locator(".ghost-member-lab__fit-readout section").first().locator("li").first();
  const reason = `${(await reasonItem.locator("strong").innerText()).trim()}: ${(await reasonItem.locator("span").innerText()).trim()}`;
  const caution = (await page.locator(".ghost-member-lab__fit-readout section").last().locator("li").first().innerText()).trim();
  await page.locator(".ghost-member-lab__questions button").first().click();
  await page.getByRole("button", { name: "Decide What Needs Checking" }).click();
  await page.waitForURL(/\/dashboard\/crucible#match-check-context$/);
  await page.getByRole("heading", { name: `What would you actually need to know about ${selectedName}?` }).waitFor();
  await page.getByText(reason, { exact: true }).waitFor();
  await page.getByText(caution, { exact: true }).waitFor();
  const claimSection = page.locator("#match-check-context");
  await claimSection.getByRole("button", { name: "Use This Question Below" }).click();
  await claimSection.getByText("Name the exact claim that would change your decision first.", { exact: true }).waitFor();
  await claimSection.locator("textarea").fill("Can this person legally perform the licensed work they offered in this state?");
  await claimSection.getByRole("button", { name: "Use This Question Below" }).click();
  await claimSection.getByText("Question ready. Ask the person first; compare the checks below only if outside evidence is necessary.", { exact: true }).waitFor();
  assert.equal(await claimSection.getByRole("link", { name: "Prepare the Conversation" }).getAttribute("href"), "/bellows/personal/partnership-alignment");
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "claim handoff must fit 390px");

  await page.evaluate(() => window.localStorage.setItem("werkles:bellows:partnership-preparation-context:v3", JSON.stringify({ version: 3, synthetic: true, displayName: "Injected" })));
  await page.reload({ waitUntil: "load" });
  await page.getByRole("heading", { name: "Choose a profile before choosing a check." }).waitFor();
  assert.equal(await page.getByText("Injected", { exact: true }).count(), 0);
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log(`PASS ${selectedName}: Match Deck → claim-first Crucible handoff → malformed context rejection`);
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 10000));
  throw error;
} finally {
  await browser.close();
}
