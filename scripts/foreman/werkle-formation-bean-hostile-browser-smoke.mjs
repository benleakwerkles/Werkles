import assert from "node:assert/strict";
import { chromium } from "playwright";

const route = "http://127.0.0.1:3000/dashboard/werkles/formation?candidate=ghost_095";
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
  await page.goto(route, { waitUntil: "load" });
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload({ waitUntil: "load" });

  // Bean P0: the current exercise is self-only and any second side stays generic.
  await page.getByRole("heading", { name: /You answer for you\..*answers from a fictional profile/ }).waitFor();
  await page.getByText(/Any extra practice answer here is generic and is never presented as something .* said/).waitFor();
  await page.getByText(/No additional reply from .* is invented here/).waitFor();
  assert.equal(await page.getByRole("button", { name: /Answer as|Try .* side/ }).count(), 0, "the member must not be offered an impersonation control");

  const shared = page.locator(".werkle-merge-canvas__shared");

  // Bean P0: the rehearsal stays session-only and never enters Formation local storage.
  await page.locator("#perspective-scope").fill("SELF_ONLY_REHEARSAL_SENTINEL");
  await page.getByRole("button", { name: "Load a generic rehearsal side", exact: true }).click();
  await page.getByLabel("Generated practice answer").waitFor();
  await page.getByText(/Generated practice data — not supplied by/).waitFor();
  await page.getByRole("button", { name: /^Close, with a step/ }).click();
  const storageProof = await page.evaluate(() => ({
    formation: Object.keys(window.localStorage)
      .filter((key) => key.startsWith("werkles:formation:"))
      .map((key) => window.localStorage.getItem(key) ?? "")
      .join("\n"),
    perspective: Object.keys(window.sessionStorage)
      .filter((key) => key.startsWith("werkles:partner-perspective:"))
      .map((key) => window.sessionStorage.getItem(key) ?? "")
      .join("\n")
  }));
  assert.match(storageProof.perspective, /SELF_ONLY_REHEARSAL_SENTINEL/, "self-only rehearsal should remain in tab-session custody");
  assert.doesNotMatch(storageProof.formation, /SELF_ONLY_REHEARSAL_SENTINEL/, "self-only rehearsal must not enter the Formation ledger");
  await page.getByRole("button", { name: "Clear my exercise", exact: true }).click();
  const clearedPerspective = await page.evaluate(() => Object.keys(window.sessionStorage).filter((key) => key.startsWith("werkles:partner-perspective:")));
  assert.deepEqual(clearedPerspective, [], "clear must remove the session-only rehearsal artifact");

  // Reset, then prove unilateral acceptance stays out and a rewrite invalidates mutual wording.
  await page.getByRole("button", { name: "Reset this practice formation", exact: true }).click();
  await shared.getByRole("button", { name: "Write this together", exact: true }).click();
  assert.equal(await page.locator(".werkle-floor__statement").filter({ hasText: "Purpose" }).count(), 0, "a matching choice without current exact-text acceptance must stay out of the shared floor");
  await shared.getByRole("button", { name: "Accept revision 1", exact: true }).click();
  await page.locator(".werkle-floor__statement").filter({ hasText: "Purpose" }).waitFor();
  await page.locator("#joint-purpose").fill("A revised purpose that requires both people again.");
  await page.locator("#joint-purpose").blur();
  assert.equal(await page.locator(".werkle-floor__statement").filter({ hasText: "Purpose" }).count(), 0, "rewriting exact wording must invalidate both previous approvals");

  const trustCopy = [
    await page.locator(".werkle-trust-rail").innerText(),
    await page.locator(".werkle-actor").innerText(),
    await page.locator(".werkle-save").innerText()
  ].join("\n");
  assert.doesNotMatch(trustCopy, /upgrade to save|paid members can|unlock to save|subscribe to save/i, "trust and save-scope copy must not become scarcity copy");
  assert.deepEqual(errors, [], `browser console errors: ${errors.join(" | ")}`);

  console.log("PASS Bean hostile Formation walk: explicit synthetic identity, no impersonation control, session-only self rehearsal, exact-text mutuality, rewrite invalidation, and neutral save-scope copy.");
} finally {
  await browser.close();
}
