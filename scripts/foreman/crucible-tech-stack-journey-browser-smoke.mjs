import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const errors = [];

page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));

try {
  await page.goto("http://127.0.0.1:3000/dashboard/crucible", { waitUntil: "load" });
  await page.getByRole("heading", { name: "One member journey. Different tools for different jobs." }).waitFor();
  await page.locator(".crucible-tech-journey > summary").click();

  const stages = page.locator(".crucible-tech-journey__stages > li");
  const services = page.locator(".crucible-tech-journey__stages li[data-stack-state]");
  assert.equal(await stages.count(), 4, "the rendered member journey should contain four stages");
  assert.equal(await services.count(), 8, "the rendered member journey should contain all eight services");

  const stageDetails = stages.locator(":scope > details");
  assert.equal(await stageDetails.nth(0).getAttribute("open") !== null, true, "the account stage should open first");
  for (let index = 1; index < 4; index += 1) {
    await stageDetails.nth(index).locator(":scope > summary").click();
  }

  for (const name of [
    "Supabase Auth",
    "Stripe Billing",
    "Supabase Postgres",
    "Supabase Storage",
    "Stripe Identity",
    "Twilio Verify",
    "Plaid",
    "Checkr"
  ]) {
    await page.getByText(name, { exact: true }).first().waitFor();
  }

  await page.getByText("Test and sandbox activity is not live verification.", { exact: false }).waitFor();
  await page.getByText("Choose a practice check below. Provider tests require a connected test member account.", { exact: true }).waitFor();
  await page.getByText("Sandbox demonstration only", { exact: true }).first().waitFor();
  await page.getByText("Blocked pending legal and provider approval", { exact: true }).waitFor();
  assert.equal(await page.locator(".crucible-tech-journey__custody").count(), 8);
  const plaidService = services.filter({ hasText: "Plaid" });
  await plaidService.getByText("Not live yet: what would happen to the data", { exact: true }).click();
  await plaidService.getByText("not public amounts, balances, bands, transactions, or account numbers", { exact: false }).waitFor();
  await plaidService.getByText("no result becomes shareable until removal is confirmed", { exact: false }).waitFor();

  const hrefs = await page.locator("a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  for (const href of ["/dashboard/profile", "/pricing", "/proof", "/signup", "/membership"] ) {
    assert.ok(hrefs.includes(href), `member-visible journey should link to ${href}`);
  }

  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("PASS Crucible rendered tech-stack journey (4 stages, 8 services, honest states, member routes)");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_URL", page.url());
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 6000));
  throw error;
} finally {
  await browser.close();
}
