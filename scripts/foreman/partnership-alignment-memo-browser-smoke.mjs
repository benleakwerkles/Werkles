import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.setDefaultTimeout(12_000);
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

try {
  await page.goto("http://127.0.0.1:3000/bellows/library/partnership-alignment", { waitUntil: "load", timeout: 15_000 });
  await page.getByRole("heading", { name: "Write your answers before you negotiate the answers." }).waitFor();
  await page.locator(".alignment-workbook__count").filter({ hasText: "10questions still need a written answer" }).waitFor();

  await page.evaluate(() => window.localStorage.setItem("werkles:bellows:partnership-preparation-context:v3", JSON.stringify({
    version: 3,
    synthetic: true,
    profileId: "ghost-browser-1",
    displayName: "Rae Practice",
    roleLabel: "Fabricator",
    offers: ["prototype fabrication"],
    seeks: ["customer discovery"],
    fitReasons: ["Useful overlap: Fabrication touches the named blocker."],
    fitCautions: ["Identity remains unverified."],
    practiceExchanges: [{
      questionId: "carry",
      question: "What could you take responsibility for?",
      answer: "I would take one bounded fabrication task.",
      source: "Built from Rae's stated offer"
    }]
  })));
  await page.reload({ waitUntil: "load", timeout: 15_000 });
  await page.getByRole("heading", { name: "Prepare to compare expectations with Rae Practice." }).waitFor();
  await page.getByText("This is still a synthetic profile—not a real member or introduction.", { exact: false }).waitFor();
  await page.getByText("Fabrication touches the named blocker", { exact: false }).waitFor();
  await page.getByText("Identity remains unverified", { exact: false }).waitFor();
  await page.getByRole("heading", { name: "Practice questions you already explored" }).waitFor();
  await page.getByText("I would take one bounded fabrication task.", { exact: false }).waitFor();

  await page.getByLabel(/What are we building/).fill("A neighborhood tool-rental service; not a construction company.");
  await page.getByLabel(/What cash, equipment/).fill("One person contributes the trailer; both contributions still need a written valuation.");
  await page.locator(".alignment-workbook__count").filter({ hasText: "8questions still need a written answer" }).waitFor();
  await page.getByRole("button", { name: "Save on This Device" }).click();
  await page.getByText("Saved on this device. It is not account-saved or shared.").waitFor();

  await page.reload({ waitUntil: "load", timeout: 15_000 });
  await page.getByText("Saved preparation memo restored from this device. It was not shared.").waitFor();
  assert.equal(await page.getByLabel(/What are we building/).inputValue(), "A neighborhood tool-rental service; not a construction company.");
  assert.equal(await page.getByLabel(/What cash, equipment/).inputValue(), "One person contributes the trailer; both contributions still need a written valuation.");
  await page.locator(".alignment-workbook__count").filter({ hasText: "8questions still need a written answer" }).waitFor();

  await page.getByRole("button", { name: "Clear Device Draft" }).click();
  await page.locator(".alignment-workbook__count").filter({ hasText: "10questions still need a written answer" }).waitFor();
  assert.equal(await page.getByLabel(/What are we building/).inputValue(), "");
  assert.equal(await page.getByRole("heading", { name: "Prepare to compare expectations with Rae Practice." }).count(), 0);
  assert.deepEqual(consoleErrors, [], `browser console errors: ${consoleErrors.join(" | ")}`);

  console.log("PASS partnership alignment memo browser save/reload/clear walk");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(consoleErrors));
  throw error;
} finally {
  await browser.close();
}
