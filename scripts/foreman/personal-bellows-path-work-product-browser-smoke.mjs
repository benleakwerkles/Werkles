import assert from "node:assert/strict";
import { chromium } from "playwright";

const keys = [
  "werkles:bellows:constraint-map:v1",
  "werkles:bellows:company-starter-floor:v1",
  "werkles:bellows:evidence-brief:v2",
  "werkles:bellows:partnership-alignment:v1",
  "werkles:bellows:assumption-test:v1",
  "werkles:bellows:supplier-comparison:v1"
];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
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
  await page.goto("http://127.0.0.1:3000/bellows/library", { waitUntil: "load" });
  await page.evaluate((artifactKeys) => artifactKeys.forEach((key) => window.localStorage.setItem(key, "{}")), keys);
  await page.goto("http://127.0.0.1:3000/bellows/personal", { waitUntil: "load" });
  await page.getByRole("heading", { name: /Start with/ }).waitFor();

  const cards = page.locator(".bellows-personal__path > ol > li");
  const cardCount = await cards.count();
  assert.ok(cardCount > 0 && cardCount <= 3, "a current personal path should contain one to three lessons");
  assert.equal(await page.getByText("Device draft found—checked when opened.", { exact: true }).count(), cardCount);
  assert.equal(await page.locator(".bellows-personal__path a[href^='/bellows/personal/']").count(), cardCount);
  const workingReads = await page.locator(".bellows-personal__lesson-description").allTextContents();
  assert.equal(new Set(workingReads).size, cardCount, "different recommendations must not reuse one generic working read");
  const exerciseSets = await page.locator(".bellows-personal__exercise-list").allTextContents();
  assert.equal(new Set(exerciseSets).size, cardCount, "different work products must not reuse one generic exercise set");
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log(`PASS Personal Bellows path → ${cardCount} named device work products`);
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 6000));
  throw error;
} finally {
  await browser.close();
}
