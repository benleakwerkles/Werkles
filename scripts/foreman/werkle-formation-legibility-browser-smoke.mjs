import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();
page.setDefaultTimeout(15_000);
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

const route = "http://127.0.0.1:3000/dashboard/werkles/formation?candidate=ghost_095";
const selectors = [
  ".werkle-formation-hero .workshop-eyebrow",
  ".werkle-arrival__people article > span",
  ".werkle-arrival__people small",
  ".werkle-dashboard__counts dt",
  ".werkle-dashboard__readiness small",
  ".werkle-topic-index__button small",
  ".werkle-studio__state > span",
  ".werkle-studio__state small",
  ".werkle-merge-canvas__source > small",
  ".werkle-topic__decisions dt",
  ".werkle-save small"
];

try {
  await context.addCookies([{
    name: "werkles_bellows_owner",
    value: "bellows_owner_4185d54c-e055-4929-91a0-6181bf461384",
    url: "http://127.0.0.1:3000"
  }]);
  await page.goto(route, { waitUntil: "load" });
  await page.evaluate(() => { window.localStorage.clear(); window.sessionStorage.clear(); });
  await page.reload({ waitUntil: "load" });
  await page.getByRole("heading", { name: "Build the company without erasing either person." }).waitFor();

  const desktopWidth = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(desktopWidth.document <= desktopWidth.viewport, `desktop formation overflows: ${JSON.stringify(desktopWidth)}`);

  for (const selector of selectors) {
    const style = await page.locator(selector).first().evaluate((element) => {
      const computed = getComputedStyle(element);
      return { fontSize: Number.parseFloat(computed.fontSize), lineHeight: Number.parseFloat(computed.lineHeight) };
    });
    assert.ok(style.fontSize >= 16, `${selector} fell below 16px: ${style.fontSize}`);
    assert.ok(style.lineHeight >= style.fontSize * 1.4, `${selector} line height is too tight: ${JSON.stringify(style)}`);
  }

  const copper = await page.locator(".werkle-formation-hero .workshop-eyebrow").evaluate((element) => getComputedStyle(element).color);
  assert.equal(copper, "rgb(242, 182, 109)", "the dark hero needs the readable copper formation signal");
  const trustColors = await page.locator(".werkle-trust-rail").evaluate((element) => ({
    heading: getComputedStyle(element.querySelector("strong")).color,
    copy: getComputedStyle(element.querySelector("p")).color
  }));
  assert.deepEqual(trustColors, { heading: "rgb(255, 248, 235)", copy: "rgb(240, 223, 199)" }, "global prose styles must not turn the dark trust rail text brown");
  const darkSurfaceText = await page.evaluate(() => {
    const surfaceSelectors = [".werkle-formation-hero", ".werkle-arrival", ".werkle-dashboard", ".werkle-actor", ".werkle-formation-ledger", ".werkle-topic-index", ".werkle-studio__workspace", ".werkle-floor", ".werkle-history", ".werkle-save", ".werkle-trust-rail"];
    const darkText = new Set(["rgb(68, 54, 44)", "rgb(31, 24, 20)", "rgb(61, 49, 43)"]);
    return surfaceSelectors.flatMap((surfaceSelector) => {
      const surface = document.querySelector(surfaceSelector);
      if (!surface) return [];
      return [...surface.querySelectorAll("h1, h2, h3, p, small, strong, span, dt")]
        .filter((element) => darkText.has(getComputedStyle(element).color))
        .map((element) => ({ surfaceSelector, text: element.textContent?.trim().slice(0, 70), color: getComputedStyle(element).color }));
    });
  });
  assert.deepEqual(darkSurfaceText, [], `dark formation surfaces contain dark text: ${JSON.stringify(darkSurfaceText)}`);
  await page.getByText("Only exact wording accepted by both people enters the shared room.", { exact: true }).waitFor();
  await page.getByText("Not mutual yet", { exact: true }).first().waitFor();
  assert.equal(await page.getByText(/No score means/i).count(), 0, "formation copy must not imply that absent scoring means compatibility");

  await page.getByRole("heading", { name: "Prepare for a real conversation" }).waitFor();
  await page.getByRole("button", { name: "Load a generic rehearsal side" }).click();
  await page.getByRole("button", { name: "Same read" }).click();
  await page.getByText(/Lining up on paper is not the same as agreeing in person/).waitFor();
  assert.equal(await page.locator(".partner-perspective").getByText(/compatibility claim/i).count(), 1, "the expectation exercise needs one visible no-score boundary");
  await page.getByRole("button", { name: "Next conversation" }).click();
  await page.getByRole("heading", { name: "What would make an hour of this worth it?" }).waitFor();

  await page.getByRole("button", { name: "Responsibilities Waiting on someone" }).click();
  await page.getByRole("heading", { name: "Responsibilities", exact: true }).waitFor();
  assert.equal(await page.locator('.werkle-topic-index__button[aria-current="step"] strong').innerText(), "Responsibilities");
  await page.getByRole("button", { name: "Purpose Waiting on someone" }).click();
  await page.getByRole("button", { name: "Write this together", exact: true }).click();
  await page.getByRole("button", { name: "Accept revision 1" }).click();
  const syntheticResponse = page.getByRole("button", { name: /synthetic response/ });
  if (await syntheticResponse.isEnabled()) await syntheticResponse.click();
  await page.locator('.werkle-formation-ledger__track button').filter({ hasText: "Purpose" }).waitFor();
  assert.match(await page.getByRole("button", { name: /Purpose Both accepted/ }).innerText(), /Both accepted/);
  await page.locator("#joint-purpose").fill("A newly revised shared purpose.");
  await page.locator("#joint-purpose").blur();
  await page.getByRole("button", { name: /Purpose Waiting on someone/ }).waitFor();
  assert.equal(await page.locator('.werkle-formation-ledger__track button').filter({ hasText: "Purpose" }).count(), 0, "superseded mutual wording must leave the live ledger");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "load" });
  await page.getByRole("heading", { name: "Build the company without erasing either person." }).waitFor();
  await page.getByRole("heading", { name: "What would make an hour of this worth it?" }).waitFor();
  assert.match(await page.locator(".partner-perspective__progress strong").innerText(), /1 of 3 started/, "tab-session exercise must survive a reload");
  const mobileWidth = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(mobileWidth.document <= mobileWidth.viewport, `mobile formation overflows: ${JSON.stringify(mobileWidth)}`);
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);

  console.log("PASS Werkle formation studio: 16px trust/provenance floor, visible mutuality, indexed two-Workshop-to-one-Werkle canvas, clean console, and no desktop/mobile overflow.");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 9000));
  throw error;
} finally {
  await browser.close();
}
