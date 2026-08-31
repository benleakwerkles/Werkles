import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1360, height: 1050 } });
const page = await context.newPage();
page.setDefaultTimeout(20_000);
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.goto("http://127.0.0.1:3000/dashboard/werkles/formation?candidate=ghost_095", { waitUntil: "networkidle" });
  const experiment = page.locator(".werkle-topic-experiment");
  await experiment.getByRole("heading", { name: "Try the one-sentence test" }).waitFor();
  await experiment.getByText(/explains the company in one sentence to three likely customers/).waitFor();
  await experiment.getByText(/what each listener thinks the company does/).waitFor();
  assert.equal(await experiment.getByRole("link", { name: "Choose a Narrow Outside Check" }).count(), 0, "ordinary conversation tests must not funnel members into provider checks");
  const boundaryHeadingColor = await page.locator(".practice-boundary-readout h3").evaluate((element) => getComputedStyle(element).color);
  assert.equal(boundaryHeadingColor, "rgb(255, 255, 255)", "the Formation boundary heading must remain legible on its dark surface");
  await page.screenshot({ path: "foreman/evidence/bvpgm-m12-formation-topic-test.png", fullPage: true });

  await page.getByRole("button", { name: "Purpose Waiting on someone" }).click();
  await page.getByRole("button", { name: "Write this together", exact: true }).click();
  await page.locator("#joint-purpose").fill("We will test one clear repair offer with three reachable customers.");
  await page.locator("#joint-purpose").blur();
  await page.getByRole("button", { name: "Accept revision 2" }).click();
  const partnerToggle = page.getByRole("button", { name: /Apply .* synthetic response/ });
  await partnerToggle.click();
  await page.getByRole("button", { name: "Build the Operating Brief" }).click();

  const planner = page.locator(".werkle-first-action");
  await planner.getByText("A useful starting shape", { exact: true }).waitFor();
  await planner.getByText(/explains the company in one sentence to three likely customers/).waitFor();
  assert.equal(await page.getByLabel("What will you do?").inputValue(), "", "test guidance must not fill a member answer");
  assert.equal(await planner.getByRole("link", { name: "Choose a Narrow Outside Check" }).count(), 0, "the accepted purpose test must stay provider-free");

  await page.getByLabel("What will you do?").fill("Explain our offer to three likely customers without coaching them.");
  await page.getByLabel("Who volunteered?").fill("Ben");
  await page.getByLabel("When will you check back?").fill("2026-09-02");
  await page.getByLabel("What would count as done?").fill("Three exact listener summaries are recorded for comparison.");
  await page.getByRole("button", { name: "Save Proposed Action on This Device" }).click();
  await page.getByText(/Accepted source and proposed action saved on this device.*not an assignment or agreement/).waitFor();

  await page.goto("http://127.0.0.1:3000/bellows/personal", { waitUntil: "networkidle" });
  const returned = page.locator(".bellows-draft-shelf__action");
  await returned.getByText("Explain our offer to three likely customers without coaching them.", { exact: true }).waitFor();
  await returned.getByText("Compare the result with the original test", { exact: true }).waitFor();
  await returned.getByText(/what each listener thinks the company does/).waitFor();
  await returned.getByRole("link", { name: "Open the Relevant Conversation Guide" }).waitFor();

  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("PASS BVPGM M12: unresolved topic becomes an observable test, member fields stay empty, and the saved result returns through Personal Bellows without unnecessary provider work.");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_URL", page.url());
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 9000));
  throw error;
} finally {
  await browser.close();
}
