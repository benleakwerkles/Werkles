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
  await page.getByRole("button", { name: "Purpose Waiting on someone" }).click();
  await page.getByRole("button", { name: "Write this together", exact: true }).click();
  await page.locator("#joint-purpose").fill("We will test one clear repair offer with three reachable customers.");
  await page.locator("#joint-purpose").blur();
  await page.getByRole("button", { name: "Accept revision 2" }).click();
  await page.getByRole("button", { name: /Apply .* synthetic response/ }).click();
  await page.getByRole("button", { name: "Build the Operating Brief" }).click();

  await page.getByLabel("What will you do?").fill("Explain the repair offer to three likely customers without coaching them.");
  await page.getByLabel("Who volunteered?").fill("Ben");
  await page.getByLabel("When will you check back?").fill("2026-09-03");
  await page.getByLabel("What would count as done?").fill("Three exact listener summaries are recorded.");
  await page.getByRole("button", { name: "Save Proposed Action on This Device" }).click();

  const result = page.locator(".werkle-test-result");
  await result.getByRole("heading", { name: "What happened—and what should you discuss next?" }).waitFor();
  assert.equal(await result.getByLabel("What did you actually observe?").inputValue(), "", "Werkles must not invent a result");
  await result.getByLabel("What did you actually observe?").fill("Two people described the offer correctly; one thought installation was included.");
  await result.getByLabel("What might that mean?").fill("The service boundary may be unclear.");
  await result.getByLabel("What decision should you discuss next?").fill("Decide whether installation belongs in the first offer.");
  await result.getByRole("button", { name: "Save My Result Notes on This Device" }).click();
  await result.getByText(/Result notes saved on this device.*not a mutual decision/).waitFor();

  await page.goto("http://127.0.0.1:3000/bellows/personal", { waitUntil: "networkidle" });
  const returned = page.locator(".bellows-draft-shelf__result");
  await returned.getByRole("heading", { name: "Turn what happened into the next conversation." }).waitFor();
  await returned.getByText("Two people described the offer correctly; one thought installation was included.", { exact: true }).waitFor();
  await returned.getByText("Decide whether installation belongs in the first offer.", { exact: true }).waitFor();
  await returned.getByText(/not the other person's answer.*company decision/).waitFor();
  await page.getByText("Your Intake creates a tailored reading path. Saved Werkle work stays available below whether or not that path is ready.", { exact: true }).waitFor();
  const boundaryHeadingColor = await page.locator(".practice-boundary-readout h3").evaluate((element) => getComputedStyle(element).color);
  assert.equal(boundaryHeadingColor, "rgb(255, 250, 242)", "the Personal Bellows boundary heading must remain legible on its dark surface");
  await page.screenshot({ path: "foreman/evidence/bvpgm-m13-personal-bellows-result.png", fullPage: true });

  await returned.getByRole("link", { name: "Reopen the Werkle Conversation" }).click();
  await page.waitForURL("**/dashboard/werkles/formation?candidate=**");
  await page.getByLabel("What will you do?").fill("Explain a narrower repair offer to three likely customers.");
  await page.getByRole("button", { name: "Save Proposed Action on This Device" }).click();
  await page.getByText(/older result was not loaded/).waitFor();
  await page.goto("http://127.0.0.1:3000/bellows/personal", { waitUntil: "networkidle" });
  assert.equal(await page.locator(".bellows-draft-shelf__result").count(), 0, "Personal Bellows must hide a result tied to an older action");
  await page.getByText("Explain a narrower repair offer to three likely customers.", { exact: true }).waitFor();

  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("PASS BVPGM M13: member records a result, Personal Bellows returns it, and changing the proposed action invalidates the older result without inventing consent or provider work.");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_URL", page.url());
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 9000));
  throw error;
} finally {
  await browser.close();
}
