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
  await context.addCookies([
    { name: "werkles_dev_preview_session", value: JSON.stringify({ userId: "dev-preview-user", email: "gimprobotester@werkles.local" }), url: "http://127.0.0.1:3000" },
    { name: "werkles_bellows_owner", value: "bellows_owner_4185d54c-e055-4929-91a0-6181bf461384", url: "http://127.0.0.1:3000" }
  ]);
  await page.goto("http://127.0.0.1:3000/dashboard/crucible", { waitUntil: "load" });
  await page.getByText("Choose a practice check below. Provider tests require a connected test member account.", { exact: true }).waitFor();
  const body = await page.locator("body").innerText();
  assert.equal((body.match(/Each check answers one narrow question/g) ?? []).length, 1, "the principle should appear once, not twice");
  for (const stale of ["DRAFT VISUAL", "preview placeholders", "Ghost Fleet walkthrough is read-only", "Ghost provider practice", "Walkthrough only", "Sign-in required for provider checks"]) assert.ok(!body.includes(stale), stale);
  assert.ok(await page.getByRole("button", { name: "Connected test account required" }).first().isDisabled());
  await page.getByRole("button", { name: "Start identity practice" }).click();
  await page.getByText("A real identity flow would now ask for consent and provider-managed evidence.", { exact: true }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "Crucible must fit 390px");
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("PASS local member gets practice + honest provider gate at 390px");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 9000));
  throw error;
} finally {
  await browser.close();
}
