import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.setDefaultTimeout(15_000);
const errors = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.goto("http://127.0.0.1:3000/bellows/library/assumption-test-design", { waitUntil: "load" });
  await page.getByLabel("Decision this test should change").fill("Whether to offer one paid delivery pilot.");
  await page.getByLabel("Riskiest assumption").fill("Three local shops will pay the stated price.");
  await page.getByRole("button", { name: "Save on This Device" }).click();
  await page.getByText("Saved on this device. It is not account-saved or shared.").waitFor();
  await page.reload({ waitUntil: "load" });
  await page.getByText("Saved Assumption Test restored from this device. It was not shared.").waitFor();
  assert.match(await page.getByLabel("Decision this test should change").inputValue(), /paid delivery pilot/);
  await page.getByRole("button", { name: "Clear Device Test" }).click();
  assert.equal(await page.getByLabel("Decision this test should change").inputValue(), "");

  await page.evaluate(() => window.localStorage.setItem("werkles:bellows:assumption-test:v1", JSON.stringify({
    decision: "x",
    assumption: "x",
    challenge: "x",
    target: "x",
    test: "x",
    threshold: "x",
    limits: "x",
    unknown: "x",
    injected: "must fail"
  })));
  await page.reload({ waitUntil: "load" });
  await page.getByText("The saved device test was invalid and was not restored. Nothing was sent.").waitFor();
  assert.equal(await page.getByLabel("Decision this test should change").inputValue(), "");

  await page.goto("http://127.0.0.1:3000/bellows/library/proof-before-reliance", { waitUntil: "load" });
  await page.evaluate(() => window.localStorage.setItem("werkles:bellows:evidence-brief:v2", JSON.stringify({
    values: {
      claim: "x".repeat(601), decision: "", sources: "", supported: "", inference: "", gap: "", change: "", next: ""
    },
    freshness: "current_for_decision",
    contradiction: "none_identified",
    professionalReview: "not_identified"
  })));
  await page.reload({ waitUntil: "load" });
  await page.getByText("The saved device brief was invalid and was not restored. Nothing was sent.").waitFor();
  assert.equal(await page.getByLabel("Exact claim").inputValue(), "");
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);

  console.log("PASS Bellows artifact save/restore and malformed-draft rejection browser walk");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  throw error;
} finally {
  await browser.close();
}
