import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.setDefaultTimeout(15_000);
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.goto("http://127.0.0.1:3000/bellows/library/supplier-comparison", { waitUntil: "load" });
  await page.getByLabel("One requirement every option must meet").fill("Move 3,000 lb pallets through a 7-foot opening.");
  const first = page.locator(".supplier-comparison__grid fieldset").first();
  await first.getByLabel("Name or source").fill("Local Equipment Co.");
  await first.getByLabel("Purchase / lease upfront").fill("4200");
  await first.getByLabel("Delivery").fill("350");
  await first.getByLabel("Setup / installation").fill("500");
  await first.getByLabel("Monthly recurring").fill("75");
  await first.getByLabel("Estimated downtime cost").fill("600");
  await first.getByText("$6550.00").waitFor();
  await page.getByRole("button", { name: "Save on This Device" }).click();
  await page.reload({ waitUntil: "load" });
  await page.getByText("Saved comparison restored from this device.").waitFor();
  assert.equal(await first.getByLabel("Name or source").inputValue(), "Local Equipment Co.");

  await page.evaluate(() => {
    const raw = JSON.parse(window.localStorage.getItem("werkles:bellows:supplier-comparison:v1") || "{}");
    raw.rows[0].injected = "must fail";
    window.localStorage.setItem("werkles:bellows:supplier-comparison:v1", JSON.stringify(raw));
  });
  await page.reload({ waitUntil: "load" });
  await page.getByText("The saved device comparison was invalid and was not restored. Nothing was sent.").waitFor();
  assert.equal(await first.getByLabel("Name or source").inputValue(), "");
  assert.equal(await first.getByText("$0.00").count(), 1);
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);

  console.log("PASS Supplier Comparison valid restore and malformed-draft rejection browser walk");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  throw error;
} finally {
  await browser.close();
}
