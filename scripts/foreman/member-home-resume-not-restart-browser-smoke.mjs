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
  await page.goto("http://127.0.0.1:3000/dashboard", { waitUntil: "load" });
  await page.getByRole("heading", { name: "Your Intake is here. Keep moving." }).waitFor();
  for (const label of ["Open Recommendations", "Open My Bellows", "Open Match Deck", "Review Intake", "Workshop", "Crucible", "Profile", "Log out"]) {
    await page.getByRole(label === "Log out" ? "button" : "link", { name: label, exact: true }).first().waitFor();
  }
  const text = await page.locator("body").innerText();
  for (const stale of ["demo + saved intake", "concierge walkthrough", "Secondary: what Werkles is", "Walk through an example"]) assert.ok(!text.includes(stale), stale);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), "member home must fit 390px");
  const newContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await newContext.addCookies([{ name: "werkles_dev_preview_session", value: JSON.stringify({ userId: "new-preview-user", email: "new@werkles.local" }), url: "http://127.0.0.1:3000" }]);
  const newPage = await newContext.newPage();
  await newPage.goto("http://127.0.0.1:3000/dashboard", { waitUntil: "load" });
  await newPage.getByRole("heading", { name: "Start with one real piece of work." }).waitFor();
  await newPage.getByRole("link", { name: "Start Intake", exact: true }).waitFor();
  await newContext.close();
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("PASS saved member resumes; new member starts Intake; both at 390px");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 7000));
  throw error;
} finally {
  await browser.close();
}
