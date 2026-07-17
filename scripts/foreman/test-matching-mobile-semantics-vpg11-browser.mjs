/**
 * Browser proof for VPG11. Requires an explicit non-Production origin.
 * Run: WERKLES_SITE_ORIGIN=http://127.0.0.1:3011 node scripts/foreman/test-matching-mobile-semantics-vpg11-browser.mjs
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

const routes = ["/", "/discovery", "/bellows/intake", "/bellows/recommendations"];
const widths = [320, 390, 640, 1440];
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
const results = [];
const postRequests = [];
const browserIssues = [];

function watchPage(page, label) {
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      browserIssues.push({ label, type: message.type(), text: message.text() });
    }
  });
  page.on("pageerror", (error) => {
    browserIssues.push({ label, type: "pageerror", text: error.message });
  });
}

try {
  const context = await browser.newContext({
    extraHTTPHeaders: bypassSecret ? { "x-vercel-protection-bypass": bypassSecret } : {}
  });
  context.on("request", (request) => {
    if (request.method() === "POST") {
      postRequests.push({ url: request.url(), resourceType: request.resourceType() });
    }
  });

  for (const route of routes) {
    for (const width of widths) {
      const page = await context.newPage();
      watchPage(page, `${route}@${width}`);
      await page.setViewportSize({ width, height: 1000 });
      const response = await page.goto(`${siteOrigin}${route}`, { waitUntil: "domcontentloaded" });
      assert.ok(response?.ok(), `${route} at ${width}px returned ${response?.status()}`);
      await page.waitForLoadState("networkidle");

      const shell = await page.evaluate(() => {
        const rect = (selector) => {
          const element = document.querySelector(selector);
          if (!element) return null;
          const box = element.getBoundingClientRect();
          return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
        };
        const overlaps = (a, b) =>
          Boolean(a && b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
        const headerLinks = [...document.querySelectorAll(".site-header a")];
        const targetHeights = headerLinks.map((link) => link.getBoundingClientRect().height);
        const brand = rect(".site-header .brand");
        const nav = rect(".site-header nav");
        const actions = rect(".site-header__actions");

        return {
          bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
          rootOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          collisions: [overlaps(brand, nav), overlaps(brand, actions), overlaps(nav, actions)],
          minTargetHeight: Math.min(...targetHeights),
          destinationCount: document.querySelectorAll(".site-header nav a").length
        };
      });

      assert.ok(shell.bodyOverflow <= 0, `${route} at ${width}px has body overflow ${shell.bodyOverflow}`);
      assert.ok(shell.rootOverflow <= 0, `${route} at ${width}px has root overflow ${shell.rootOverflow}`);
      assert.ok(shell.collisions.every((collision) => !collision), `${route} at ${width}px has header collisions`);
      assert.equal(shell.destinationCount, 5, `${route} at ${width}px must keep all primary destinations`);
      if (route === "/discovery" && width === 320) {
        const discoveryContainment = await page.evaluate(() => {
          const hero = document.querySelector(".discovery-hero")?.getBoundingClientRect();
          const children = [...document.querySelectorAll(".discovery-hero > *")].map((element) =>
            element.getBoundingClientRect()
          );
          return hero
            ? children.every((child) => child.left >= hero.left && child.right <= hero.right)
            : false;
        });
        assert.ok(discoveryContainment, "Discovery hero children must remain inside the 320px panel");
      }
      if (width <= 820) {
        assert.ok(shell.minTargetHeight >= 44, `${route} at ${width}px has a ${shell.minTargetHeight}px header target`);
        await page.locator(".site-header a").first().focus();
        const focus = await page.locator(".site-header a").first().evaluate((element) => {
          const style = getComputedStyle(element);
          return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
        });
        assert.notEqual(focus.style, "none", `${route} at ${width}px has no visible focus style`);
        assert.ok(focus.width >= 3, `${route} at ${width}px focus outline is thinner than 3px`);
      }

      if (artifactDir && (width === 320 || width === 1440)) {
        const name = `${route === "/" ? "home" : route.slice(1).replaceAll("/", "-")}-${width}.png`;
        await page.screenshot({ path: path.join(artifactDir, name), fullPage: true });
      }

      results.push({ route, width, ...shell });
      await page.close();
    }
  }

  const intake = await context.newPage();
  watchPage(intake, "bellows-intake-interaction");
  await intake.goto(`${siteOrigin}/bellows/intake`, { waitUntil: "domcontentloaded" });
  await intake.waitForLoadState("networkidle");
  const firstTextarea = intake.locator(".concierge-intake__field textarea").first();
  const help = await firstTextarea.getAttribute("aria-describedby");
  assert.equal(help?.split(/\s+/).length, 2);
  for (const id of help.split(/\s+/)) assert.equal(await intake.locator(`#${id}`).count(), 1);
  await firstTextarea.fill("test");
  assert.equal((await intake.locator(".concierge-intake__count").first().textContent())?.trim(), "4/600");
  assert.equal(await intake.locator('.concierge-intake__count[aria-live]').count(), 0);
  await intake.close();

  const recommendations = await context.newPage();
  watchPage(recommendations, "bellows-recommendations-interaction");
  await recommendations.goto(`${siteOrigin}/bellows/recommendations`, { waitUntil: "domcontentloaded" });
  await recommendations.waitForLoadState("networkidle");
  const viewButtons = recommendations.getByRole("group", { name: "Recommendation deck view" }).getByRole("button");
  assert.equal(await viewButtons.count(), 2);
  assert.equal(await viewButtons.nth(0).getAttribute("aria-pressed"), "true");
  assert.equal(await viewButtons.nth(1).getAttribute("aria-pressed"), "false");
  await viewButtons.nth(1).focus();
  await recommendations.keyboard.press("Space");
  assert.equal(await viewButtons.nth(0).getAttribute("aria-pressed"), "false");
  assert.equal(await viewButtons.nth(1).getAttribute("aria-pressed"), "true");
  const selectedCard = recommendations.locator('.squibb-rec-card[aria-pressed="true"]').first();
  assert.equal(await selectedCard.getAttribute("aria-controls"), "squibbRecommendationDetail");
  assert.equal(await recommendations.locator("#squibbRecommendationDetail").count(), 1);
  await assert.doesNotReject(() => recommendations.getByRole("status").filter({ hasText: "Selected recommendation:" }).waitFor());
  await recommendations.close();

  const closedActionPosts = postRequests.filter(({ url }) => {
    const pathname = new URL(url).pathname;
    return /\/api\/(?:discovery\/intake|bellows\/(?:intake|recommendation-packets)|matching(?:\/|$))/.test(pathname);
  });
  assert.deepEqual(closedActionPosts, [], "keyboard and form review must not issue a closed-action POST");
  assert.deepEqual(browserIssues, [], `browser console/page issues: ${JSON.stringify(browserIssues)}`);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ pass: true, siteOrigin, postRequests, browserIssues, viewports: results }, null, 2));
