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
  await page.goto("http://127.0.0.1:3000/dashboard/intros", { waitUntil: "load" });
  await page.getByRole("heading", { name: /useful possibilit/i }).waitFor();

  const choices = page.locator(".ghost-member-lab__person");
  const choiceCount = await choices.count();
  assert.ok(choiceCount >= 2 && choiceCount <= 3, "the deck should show two or three honest, non-duplicate candidates");
  assert.equal(await page.locator(".ghost-member-lab__fit-preview").count(), choiceCount);

  const names = [];
  const helpStatements = [];
  const reasonReadouts = [];
  for (let index = 0; index < choiceCount; index += 1) {
    await choices.nth(index).click();
    names.push((await page.locator(".ghost-member-lab__profile h3").innerText()).trim());
    helpStatements.push((await page.locator(".ghost-member-lab__profile > p").nth(1).innerText()).trim());
    const reasonSection = page.locator(".ghost-member-lab__fit-readout section").first();
    const cautionSection = page.locator(".ghost-member-lab__fit-readout section").last();
    await reasonSection.getByRole("heading", { name: "Why this profile is here" }).waitFor();
    await cautionSection.getByRole("heading", { name: "What could make this wrong" }).waitFor();
    assert.ok(await reasonSection.locator("li").count(), "each ranked candidate should retain at least one reason");
    assert.ok(await cautionSection.locator("li").count(), "each ranked candidate should retain at least one caution");
    reasonReadouts.push((await reasonSection.innerText()).trim());
  }

  assert.equal(new Set(names).size, choiceCount, "the shortlist must contain distinct profiles");
  assert.ok(new Set(helpStatements).size >= 2, "the shortlist should show more than one kind of help");
  assert.ok(new Set(reasonReadouts).size >= 2, "the shortlist should not repeat one reason for every candidate");
  assert.equal(await page.getByText(/\bscore\b|\bpercent\b/i).count(), 0, "raw scoring should stay out of the interactive deck");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "load" });
  await page.getByRole("heading", { name: /useful possibilit/i }).waitFor();
  const mobileWidth = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(mobileWidth.document <= mobileWidth.viewport, `mobile Match Deck overflows: ${JSON.stringify(mobileWidth)}`);
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log(`PASS Match Deck candidate reasons stay distinct (${names.join(" / ")})`);
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 9000));
  throw error;
} finally {
  await browser.close();
}
