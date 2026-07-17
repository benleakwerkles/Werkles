/**
 * Protected Preview browser proof for VPG12. Requires an explicit non-Production origin.
 * Run: WERKLES_SITE_ORIGIN=<preview> node scripts/foreman/test-matching-example-custody-intake-clarity-vpg12-browser.mjs
 */
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const siteOrigin = (process.env.WERKLES_SITE_ORIGIN || "").replace(/\/$/, "");
assert.ok(siteOrigin, "WERKLES_SITE_ORIGIN is required; this proof never infers a target");
const siteUrl = new URL(siteOrigin);
assert.ok(
  siteUrl.hostname !== "werkles.com" && siteUrl.hostname !== "www.werkles.com",
  "Production is forbidden for this browser proof"
);

const artifactDir = process.env.WERKLES_BROWSER_ARTIFACT_DIR
  ? path.resolve(process.env.WERKLES_BROWSER_ARTIFACT_DIR)
  : null;
const bypassSecret = (
  process.env.WERKLES_VERCEL_PROTECTION_BYPASS_SECRET ||
  process.env.VERCEL_AUTOMATION_BYPASS_SECRET ||
  ""
).trim();
if (artifactDir) mkdirSync(artifactDir, { recursive: true });

let browser;
try {
  browser = await chromium.launch({ headless: true });
} catch (error) {
  if (!String(error).includes("Executable doesn't exist")) throw error;
  browser = await chromium.launch({ channel: "msedge", headless: true });
}

const postRequests = [];
const browserIssues = [];
const results = [];

try {
  const context = await browser.newContext({
    extraHTTPHeaders: bypassSecret ? { "x-vercel-protection-bypass": bypassSecret } : {}
  });
  context.on("request", (request) => {
    if (request.method() === "POST") postRequests.push(request.url());
  });

  for (const width of [320, 1440]) {
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        browserIssues.push({ route: "/bellows/recommendations", width, type: message.type(), text: message.text() });
      }
    });
    page.on("pageerror", (error) => {
      browserIssues.push({ route: "/bellows/recommendations", width, type: "pageerror", text: error.message });
    });
    await page.setViewportSize({ width, height: 1000 });
    const response = await page.goto(`${siteOrigin}/bellows/recommendations`, { waitUntil: "networkidle" });
    assert.ok(response?.ok(), `recommendations at ${width}px returned ${response?.status()}`);
    const surface = page.locator(".squibb-rec-surface");
    const rankedText = await surface.innerText();
    assert.doesNotMatch(rankedText, /You said|what you entered|Your intake|on file/i);
    assert.match(rankedText, /Example mode/i);
    assert.match(rankedText, /Example need/i);
    assert.match(rankedText, /Example scenario/i);
    assert.match(rankedText, /based on the information in this example/);
    assert.doesNotMatch(rankedText, /Start an intake|create the first one/i);

    const catalogButton = page.getByRole("button", { name: /All options/ });
    await catalogButton.click();
    assert.equal(await catalogButton.getAttribute("aria-pressed"), "true");
    assert.doesNotMatch(await surface.innerText(), /You said|what you entered|Your intake|on file/i);

    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth - document.body.clientWidth,
      root: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }));
    assert.ok(overflow.body <= 0 && overflow.root <= 0, `recommendations overflow at ${width}px`);
    if (artifactDir) await page.screenshot({ path: path.join(artifactDir, `recommendations-${width}.png`), fullPage: true });
    results.push({ route: "/bellows/recommendations", width, overflow });
    await page.close();
  }

  for (const width of [320, 1440]) {
    const page = await context.newPage();
    await page.setViewportSize({ width, height: 1000 });
    const response = await page.goto(`${siteOrigin}/bellows/intake`, { waitUntil: "networkidle" });
    assert.ok(response?.ok(), `Bellows intake at ${width}px returned ${response?.status()}`);
    const headings = await page.locator("main h1, main h2").evaluateAll((elements) =>
      elements.map((element) => ({ tag: element.tagName, text: element.textContent?.trim() }))
    );
    assert.equal(headings.filter(({ tag }) => tag === "H1").length, 1);
    assert.deepEqual(headings.slice(0, 2).map(({ tag }) => tag), ["H1", "H2"]);
    assert.equal(await page.getByRole("form", { name: "Review the questions before you share anything." }).count(), 1);
    assert.equal(await page.getByRole("button", { name: "Submission temporarily closed" }).isDisabled(), true);
    if (artifactDir) await page.screenshot({ path: path.join(artifactDir, `bellows-intake-${width}.png`), fullPage: true });
    results.push({ route: "/bellows/intake", width, headings: headings.slice(0, 2) });
    await page.close();
  }

  const discovery = await context.newPage();
  const response = await discovery.goto(`${siteOrigin}/discovery`, { waitUntil: "networkidle" });
  assert.ok(response?.ok(), `Discovery returned ${response?.status()}`);
  const email = discovery.getByRole("textbox", { name: "Email" });
  assert.equal(await email.getAttribute("type"), "email");
  assert.equal(await email.getAttribute("inputmode"), "email");
  assert.equal(await email.getAttribute("autocomplete"), "email");
  await email.fill("preview@example.com");
  await email.press("Enter");
  assert.equal(await discovery.getByRole("button", { name: "Submission temporarily closed" }).isDisabled(), true);
  await discovery.close();

  const closedActionPosts = postRequests.filter((url) =>
    /\/api\/(?:discovery\/intake|bellows\/(?:intake|recommendation-packets)|matching(?:\/|$))/.test(new URL(url).pathname)
  );
  const actionableBrowserIssues = browserIssues.filter(
    ({ text }) => !(text.includes("https://vercel.live/_next-live/feedback/feedback.js") && text.includes("Content Security Policy"))
  );
  assert.deepEqual(closedActionPosts, [], "review interactions must not issue a closed-action POST");
  assert.deepEqual(actionableBrowserIssues, [], `browser console/page issues: ${JSON.stringify(actionableBrowserIssues)}`);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ pass: true, siteOrigin, postRequests, browserIssues, results }, null, 2));
