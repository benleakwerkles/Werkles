import assert from "node:assert/strict";
import { chromium } from "playwright";

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
  await page.goto("http://127.0.0.1:3000/bellows/personal/proof-before-reliance", { waitUntil: "load" });
  await page.getByRole("heading", { name: "Build an Evidence Brief." }).waitFor();
  await page.getByLabel("Exact claim").fill("A dated supplier quote supports the current equipment-cost estimate.");
  await page.getByRole("button", { name: "Save on This Device" }).click();
  await page.getByText("Saved on this device. It is not account-saved or shared.").waitFor();
  await page.getByRole("link", { name: "Back to My Bellows" }).click();
  await page.waitForURL("**/bellows/personal");
  await page.getByRole("heading", { name: "Pick up a private working draft." }).waitFor();

  const evidenceRow = page.locator(".bellows-draft-shelf li").filter({ hasText: "Evidence Brief" });
  await evidenceRow.getByText("Draft on this device", { exact: true }).waitFor();
  assert.equal(await evidenceRow.getByRole("link", { name: "Open Evidence Brief Draft" }).getAttribute("href"), "/bellows/personal/proof-before-reliance");
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("PASS Personal Bellows work product saves and returns to its personal draft shelf");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_URL", page.url());
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 8000));
  throw error;
} finally {
  await browser.close();
}
