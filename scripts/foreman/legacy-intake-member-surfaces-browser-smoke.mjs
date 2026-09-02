import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

const surfaces = [
  ["/bellows/recommendations", "What might help from here?"],
  ["/bellows/personal", /Start with/],
  ["/dashboard/intros", "People worth a closer look."],
  ["/dashboard/blueprints", "Turn the tangled version into a plan you can use."]
];

try {
  await context.addCookies([{
    name: "werkles_bellows_owner",
    value: "bellows_owner_4185d54c-e055-4929-91a0-6181bf461384",
    url: "http://127.0.0.1:3000"
  }]);

  for (const [path, heading] of surfaces) {
    const response = await page.goto(`http://127.0.0.1:3000${path}`, { waitUntil: "load" });
    assert.equal(response?.status(), 200, `${path} should return 200`);
    await page.getByRole("heading", { name: heading }).first().waitFor();
    assert.equal(await page.getByText("Something slipped", { exact: false }).count(), 0, `${path} should not hit the error boundary`);
  }

  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("PASS Legacy saved Intake across Recommendations → My Bellows → Match Deck → Workshop");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_URL", page.url());
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 6000));
  throw error;
} finally {
  await browser.close();
}
