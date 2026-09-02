import assert from "node:assert/strict";
import { chromium } from "playwright";

const formation = "http://127.0.0.1:3000/dashboard/werkles/formation?candidate=ghost_095";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await context.newPage();
page.setDefaultTimeout(25_000);
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));

try {
  await context.addCookies([{
    name: "werkles_bellows_owner",
    value: "bellows_owner_4185d54c-e055-4929-91a0-6181bf461384",
    url: "http://127.0.0.1:3000"
  }]);
  await page.goto(formation, { waitUntil: "load" });
  await page.evaluate(() => window.sessionStorage.clear());
  await page.reload({ waitUntil: "load" });

  const exercise = page.locator(".partner-perspective");
  await exercise.getByRole("heading", { name: "Prepare for a real conversation" }).waitFor();
  const answer = exercise.locator("#perspective-scope");
  assert.ok((await answer.inputValue()).trim().length > 0, "Scope must begin with the latest mapped Intake purpose rather than asking from zero.");
  assert.equal(await exercise.getByText(/Generated practice data — not supplied by/).count(), 0);
  assert.equal(await exercise.locator(".partner-perspective__layup").count(), 0);
  for (const label of ["Same read", "Close, with a step", "Not the same thing yet"]) {
    assert.equal(await exercise.getByText(label, { exact: true }).count(), 0, `${label} must not render while the partner/practice side is empty.`);
  }

  const durableText = "We need to decide whether one paid customer will use the smaller service before we buy equipment.";
  await answer.fill(durableText);
  const storedBeforeReload = await page.evaluate(() => Object.fromEntries(Object.entries(sessionStorage)));
  assert.ok(JSON.stringify(storedBeforeReload).includes(durableText), `typed value was not synchronously stored: ${JSON.stringify(storedBeforeReload)}`);
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction((expected) => document.querySelector("#perspective-scope")?.value === expected, durableText);
  assert.equal(await exercise.locator("#perspective-scope").inputValue(), durableText, "member text must survive reload");
  assert.equal(await exercise.getByText(/Generated practice data — not supplied by/).count(), 0, "reload must not invent a partner side");

  await exercise.getByRole("button", { name: "Load a generated practice side" }).click();
  assert.equal(await exercise.getByText(/Generated practice data — not supplied by/).count(), 1, "generated provenance must be at point of use");
  assert.equal(await exercise.locator(".partner-perspective__layup").count(), 0, "practice text alone must not produce a verdict");

  await page.setViewportSize({ width: 390, height: 844 });
  for (const label of ["Same read", "Close, with a step", "Not the same thing yet"]) {
    await exercise.getByRole("button", { name: new RegExp(`^${label}`) }).click();
    const layup = exercise.locator(".partner-perspective__layup");
    await layup.waitFor();
    assert.ok((await layup.getAttribute("class")).includes(label === "Same read" ? "--same" : label.startsWith("Close") ? "--step" : "--different"));
  }

  await exercise.getByRole("button", { name: "Next conversation" }).click();
  await exercise.getByRole("button", { name: "Previous" }).click();
  assert.equal(await exercise.locator("#perspective-scope").inputValue(), durableText, "back/forward must be non-destructive");

  const geometry = await exercise.evaluate((element) => ({
    pageWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    minTarget: Math.min(...Array.from(element.querySelectorAll("button, a")).map((node) => node.getBoundingClientRect().height).filter(Boolean)),
    textareaHeight: element.querySelector("textarea")?.getBoundingClientRect().height ?? 0
  }));
  assert.ok(geometry.pageWidth <= geometry.viewportWidth + 1, `390px page overflow: ${JSON.stringify(geometry)}`);
  assert.ok(geometry.minTarget >= 44, `action target below 44px: ${JSON.stringify(geometry)}`);
  assert.ok(geometry.textareaHeight >= 150, `long answers need vertical room: ${JSON.stringify(geometry)}`);
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);
  console.log("PASS BVPGM M18 Formation: Intake prefill, empty-state honesty, generated provenance, reload durability, three grayscale geometries, and 390px targets.");
} catch (error) {
  console.error("BROWSER_ERRORS", JSON.stringify(errors));
  console.error("PAGE", page.url());
  console.error("PAGE_TEXT", (await page.locator("body").innerText()).slice(0, 12000));
  throw error;
} finally {
  await browser.close();
}
