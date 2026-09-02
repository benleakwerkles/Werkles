import assert from "node:assert/strict";
import { chromium } from "playwright";

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
  await page.goto("http://127.0.0.1:3000/bellows/personal", { waitUntil: "load" });
  await page.getByRole("heading", { name: /Start with/ }).waitFor();
  const firstLessonLink = page.locator(".bellows-personal__path a[href^='/bellows/personal/']").first();
  const expectedHref = await firstLessonLink.getAttribute("href");
  assert.ok(expectedHref, "the first personal lesson should have a personal route");
  await firstLessonLink.click();
  await page.waitForURL(`**${expectedHref}`);

  await page.getByRole("heading", { name: "Why this lesson is here" }).waitFor();
  assert.equal(await page.locator(".bellows-personal-lesson-focus > ol > li").count(), 3);
  await page.getByText("Done when:", { exact: true }).waitFor();
  await page.locator(".bellows-lesson h1").waitFor();
  assert.equal(await page.locator(".constraint-map, .launch-floor, .evidence-brief, .alignment-workbook, .supplier-comparison").count(), 1);
  await page.getByRole("link", { name: "Back to My Bellows" }).waitFor();

  const publicHref = await page.getByRole("link", { name: "Open Public Version" }).getAttribute("href");
  assert.ok(publicHref?.startsWith("/bellows/library/"));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "load" });
  await page.getByRole("heading", { name: "Why this lesson is here" }).waitFor();
  const width = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(width.document <= width.viewport, `personal lesson overflows mobile: ${JSON.stringify(width)}`);

  await page.getByRole("link", { name: "Open Public Version" }).click();
  await page.waitForURL(`**${publicHref}`);
  await page.locator(".bellows-lesson h1").waitFor();
  assert.equal(await page.getByRole("heading", { name: "Why this lesson is here" }).count(), 0, "public lesson must remain non-personal");
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log(`PASS My Bellows → tailored lesson/tool → public boundary (${expectedHref})`);
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_URL", page.url());
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 9000));
  throw error;
} finally {
  await browser.close();
}
