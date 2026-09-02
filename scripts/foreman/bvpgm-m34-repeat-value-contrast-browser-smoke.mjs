import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const captureDir = path.resolve("foreman/receipts/browser-capture/m34");
fs.mkdirSync(captureDir, { recursive: true });

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

  await page.goto("http://127.0.0.1:3000/dashboard/intros", { waitUntil: "load" });
  await page.getByRole("heading", { name: /useful possibilit/i }).waitFor();
  const save = page.getByRole("button", { name: "Save for Comparison" });
  assert.ok(await save.count(), "a selected match must be saveable");
  await save.click();
  await page.getByRole("heading", { name: "Profiles you chose to revisit." }).waitFor();
  assert.equal(await page.locator(".ghost-member-lab__review-shelf-grid article").count(), 1);
  const storedBeforeReload = await page.evaluate(() => localStorage.getItem("werkles:match-deck:review-shelf:v1"));
  assert.ok(storedBeforeReload && JSON.parse(storedBeforeReload).length === 1);
  await page.reload({ waitUntil: "load" });
  await page.getByRole("heading", { name: /useful possibilit/i }).waitFor();
  await page.locator(".ghost-member-lab__review-shelf-grid article").waitFor();
  assert.equal(await page.locator(".ghost-member-lab__review-shelf-grid article").count(), 1, "saved profile must survive reload");
  const matchComparisonColors = await page.evaluate(() => {
    const order = document.querySelector(".ghost-member-lab__comparison-grid article p");
    const explanation = document.querySelector(".ghost-member-lab__comparison-heading > p");
    return [order, explanation].map((node) => node ? getComputedStyle(node).color : null);
  });
  assert.deepEqual(matchComparisonColors, ["rgb(255, 248, 233)", "rgb(255, 248, 233)"]);
  await page.screenshot({ path: path.join(captureDir, "match-deck-review-shelf.png"), fullPage: true, caret: "initial" });
  await page.locator(".ghost-member-lab__review-shelf-grid article").getByRole("button", { name: "Remove" }).click();
  await page.getByText("Nothing saved yet.").waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem("werkles:match-deck:review-shelf:v1")), null);

  await page.goto("http://127.0.0.1:3000/bellows/personal", { waitUntil: "load" });
  const bellowsColors = await page.locator(".bellows-plan-check-in").evaluate((panel) => {
    const heading = panel.querySelector("h2");
    const copy = panel.querySelector(".bellows-plan-check-in__heading > p");
    return [heading, copy].map((node) => node ? getComputedStyle(node).color : null);
  });
  assert.deepEqual(bellowsColors, ["rgb(255, 248, 233)", "rgb(255, 248, 233)"]);
  await page.screenshot({ path: path.join(captureDir, "personal-bellows-contrast-repaired.png"), fullPage: true, caret: "initial" });

  await page.goto("http://127.0.0.1:3000/dashboard/crucible", { waitUntil: "load" });
  const crucibleColors = await page.evaluate(() => {
    const body = document.querySelector(".crucible-tech-journey__roadmap li p");
    const label = document.querySelector(".crucible-tech-journey__roadmap li p strong");
    const stageSummary = document.querySelector(".crucible-tech-journey__stages > li > details > summary p");
    const truth = document.querySelector(".crucible-tech-journey__truth");
    return [body, label, stageSummary, truth].map((node) => node ? getComputedStyle(node).color : null);
  });
  assert.deepEqual(crucibleColors, Array(4).fill("rgb(239, 228, 209)"));
  await page.screenshot({ path: path.join(captureDir, "crucible-contrast-repaired.png"), fullPage: true, caret: "initial" });

  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("BVPGM M34 browser save/reload/remove and contrast: PASS");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 9000));
  throw error;
} finally {
  await browser.close();
}
