import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
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
  await page.goto("http://127.0.0.1:3000/dashboard/intros", { waitUntil: "load" });
  await page.getByRole("heading", { name: /useful possibilit/i }).waitFor();
  await page.getByRole("heading", { name: "Your answers choose the people. Their profile shapes the questions." }).waitFor();
  await page.getByText("Built from", { exact: false }).first().waitFor();
  await page.getByText("What would another person see about me?", { exact: true }).click();
  await page.getByText("Right now, nobody else sees a generated conversation about you", { exact: false }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileLayout = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    sourceFontSize: Number.parseFloat(getComputedStyle(document.querySelector(".ghost-member-lab__questions button small")).fontSize)
  }));
  assert.ok(mobileLayout.scrollWidth <= mobileLayout.clientWidth + 1, `mobile overflow ${JSON.stringify(mobileLayout)}`);
  assert.ok(mobileLayout.sourceFontSize >= 13, `question provenance is too small ${JSON.stringify(mobileLayout)}`);
  await page.setViewportSize({ width: 1440, height: 1100 });

  const selectedName = (await page.locator(".ghost-member-lab__profile h3").textContent())?.trim();
  assert.ok(selectedName, "a selected practice profile should render");
  await page.locator(".ghost-member-lab__questions button").first().click();
  await page.getByRole("button", { name: "Prepare for a Real Conversation" }).click();
  await page.waitForURL("**/bellows/personal/partnership-alignment");
  await page.getByRole("heading", { name: `Prepare to compare expectations with ${selectedName}.` }).waitFor();
  await page.getByText("synthetic profile—not a real member or introduction", { exact: false }).waitFor();
  await page.getByText("Why Werkles put them here", { exact: true }).waitFor();
  await page.getByText("What could make the fit wrong", { exact: true }).waitFor();
  await page.getByRole("heading", { name: "Practice questions you already explored" }).waitFor();
  assert.equal(await page.getByLabel(/What are we building/).inputValue(), "", "match context must never auto-answer the member's memo");
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);

  console.log(`PASS Match Deck → Alignment memo browser walk (${selectedName})`);
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 4000));
  throw error;
} finally {
  await browser.close();
}
