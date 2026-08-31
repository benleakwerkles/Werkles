import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.setDefaultTimeout(15_000);
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.goto("http://127.0.0.1:3000/bellows/library", { waitUntil: "load" });
  await page.evaluate(() => {
    window.localStorage.setItem("werkles:bellows:constraint-map:v1", "{}");
    window.localStorage.setItem("werkles:bellows:assumption-test:v1", "{}");
  });
  await page.goto("http://127.0.0.1:3000/bellows/personal", { waitUntil: "load" });
  await page.getByRole("heading", { name: "Pick up a private working draft." }).waitFor();
  assert.equal(await page.getByText("Draft on this device", { exact: true }).count(), 2);
  assert.equal(await page.getByText("No device draft", { exact: true }).count(), 5);
  await page.getByRole("link", { name: "Open Constraint Map Draft" }).waitFor();
  await page.getByRole("link", { name: "Open Assumption Test Draft" }).waitFor();
  assert.equal(await page.getByRole("link", { name: /^Start / }).count(), 5);
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("PASS Personal Bellows device draft shelf browser walk");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  throw error;
} finally {
  await browser.close();
}
