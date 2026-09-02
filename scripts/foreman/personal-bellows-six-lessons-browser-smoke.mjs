import assert from "node:assert/strict";
import { chromium } from "playwright";

const lessons = [
  ["pitch-is-not-the-plan", ".constraint-map"],
  ["company-starter-floor", ".launch-floor"],
  ["proof-before-reliance", ".evidence-brief"],
  ["partnership-alignment", ".alignment-workbook"],
  ["assumption-test-design", ".assumption-test-card"],
  ["supplier-comparison", ".supplier-comparison"]
];
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
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
  for (const [slug, toolSelector] of lessons) {
    const response = await page.goto(`http://127.0.0.1:3000/bellows/personal/${slug}`, { waitUntil: "load" });
    assert.equal(response?.status(), 200, `${slug} should render`);
    await page.locator(".bellows-personal-lesson-focus").waitFor();
    await page.locator(".bellows-lesson h1").waitFor();
    assert.equal(await page.locator(toolSelector).count(), 1, `${slug} should render its one work product`);
    assert.equal(await page.getByRole("link", { name: "Open Public Version" }).getAttribute("href"), `/bellows/library/${slug}`);
  }
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("PASS all six Personal Bellows lesson/work-product routes");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_URL", page.url());
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 7000));
  throw error;
} finally {
  await browser.close();
}
