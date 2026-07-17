/**
 * Protected Preview browser proof for VPG13. Requires an explicit non-Production origin.
 * Run: WERKLES_SITE_ORIGIN=<preview> node scripts/foreman/test-matching-cockpit-decision-path-vpg13-browser.mjs
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

function rgb(value) {
  const channels = value.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  assert.equal(channels?.length, 3, `expected RGB color, received ${value}`);
  return channels;
}

function relativeLuminance(channels) {
  const linear = channels.map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(first, second) {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

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

  for (const width of [320, 390, 640, 1440]) {
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        browserIssues.push({ width, type: message.type(), text: message.text() });
      }
    });
    page.on("pageerror", (error) => browserIssues.push({ width, type: "pageerror", text: error.message }));
    await page.setViewportSize({ width, height: 1000 });
    const response = await page.goto(`${siteOrigin}/bellows/recommendations`, { waitUntil: "networkidle" });
    assert.ok(response?.ok(), `recommendations at ${width}px returned ${response?.status()}`);

    const geometry = await page.evaluate(() => ({
      bodyOverflow: document.body.scrollWidth - document.body.clientWidth,
      rootOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }));
    assert.ok(geometry.bodyOverflow <= 0 && geometry.rootOverflow <= 0, `page overflow at ${width}px`);

    const heroStyles = await page.locator(".squibb-rec-surface__hero").evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, color: style.color };
    });
    const cardStyles = await page.locator(".squibb-rec-card").nth(1).evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, color: style.color };
    });
    assert.ok(contrast(rgb(heroStyles.background), rgb(heroStyles.color)) >= 4.5);
    assert.ok(contrast(rgb(cardStyles.background), rgb(cardStyles.color)) >= 4.5);

    const copyStyles = await page
      .locator(
        [
          ".squibb-rec-surface__intake-cta h2",
          ".squibb-rec-surface__intake-cta p",
          ".squibb-rec-surface__hero h1",
          ".squibb-rec-surface__intro",
          ".squibb-rec-selection-status",
          ".squibb-rec-surface__stack-title",
          ".squibb-rec-detail__header h2",
          ".squibb-rec-detail__header p:not(.eyebrow)",
          ".squibb-reasoning h3",
          ".squibb-reasoning__list",
          ".squibb-confidence__header h3",
          ".squibb-confidence__why",
          ".squibb-gates h3",
          ".squibb-gates__operator-note",
          ".squibb-evidence h3",
          ".squibb-evidence__lead",
          ".squibb-rec-detail__preview-note",
          ".squibb-rec-ledger__header h2",
          ".squibb-rec-ledger__empty"
        ].join(", ")
      )
      .evaluateAll((elements) =>
        elements.map((element) => ({ selector: element.className || element.tagName, color: getComputedStyle(element).color }))
      );
    assert.ok(copyStyles.length >= 19, `expected representative copy samples at ${width}px`);
    for (const sample of copyStyles) {
      assert.ok(
        contrast(rgb(sample.color), [44, 35, 29]) >= 4.5,
        `copy contrast failed for ${sample.selector} at ${width}px: ${sample.color}`
      );
    }

    const cue = page.locator(".squibb-rec-surface__compare-cue");
    const rail = page.getByRole("region", { name: /recommendation options/ });
    if (width <= 900) {
      assert.equal(await cue.isVisible(), true, `comparison cue hidden at ${width}px`);
      const railGeometry = await rail.evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth
      }));
      assert.ok(railGeometry.scrollWidth > railGeometry.clientWidth, `rail does not overflow at ${width}px`);
    } else {
      assert.equal(await cue.isVisible(), false, "desktop comparison cue should stay quiet");
    }

    const selectedCard = page.locator('.squibb-rec-card[aria-pressed="true"]');
    await selectedCard.focus();
    const focus = await selectedCard.evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.outlineColor, style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) };
    });
    assert.notEqual(focus.style, "none");
    assert.ok(focus.width >= 3);
    assert.ok(contrast(rgb(focus.color), [25, 24, 23]) >= 3, `focus contrast failed at ${width}px`);

    const stateColors = await page.evaluate(() => {
      const background = (selector) => {
        const element = document.querySelector(selector);
        return element ? getComputedStyle(element).backgroundColor : null;
      };
      return {
        selected: background(".squibb-rec-card--selected"),
        review: background(".squibb-rec-card__flag:not(.squibb-rec-card__flag--blocker)"),
        blocker: background(".squibb-gate--blocker, .squibb-rec-card__flag--blocker"),
        missing: background(".squibb-evidence__item--missing"),
        disabled: background(".squibb-rec-detail__buttons .button:disabled")
      };
    });
    assert.ok(Object.values(stateColors).every(Boolean));
    assert.equal(new Set(Object.values(stateColors)).size, Object.values(stateColors).length);

    const order = await page.evaluate(() => {
      const gates = document.querySelector(".squibb-gates");
      const evidence = document.querySelector(".squibb-evidence");
      return Boolean(gates && evidence && (gates.compareDocumentPosition(evidence) & Node.DOCUMENT_POSITION_FOLLOWING));
    });
    assert.equal(order, true, "review boundary must precede evidence");

    if (width === 320) {
      const viewButtons = page.getByRole("group", { name: "Recommendation deck view" }).getByRole("button");
      await viewButtons.nth(1).click();
      const catalogRail = page.getByRole("region", { name: "12 recommendation options" });
      await catalogRail.evaluate((element) => {
        element.scrollLeft = element.scrollWidth;
      });
      assert.ok((await catalogRail.evaluate((element) => element.scrollLeft)) > 0);

      await viewButtons.nth(0).focus();
      await page.keyboard.press("Space");
      assert.equal(await viewButtons.nth(0).getAttribute("aria-pressed"), "true");
      assert.equal(await viewButtons.nth(1).getAttribute("aria-pressed"), "false");
      const rankedRail = page.getByRole("region", { name: "3 recommendation options" });
      await page.waitForFunction(() => {
        const element = document.querySelector('[role="region"][aria-label="3 recommendation options"]');
        return element?.scrollLeft === 0;
      });
      assert.equal(await rankedRail.evaluate((element) => element.scrollLeft), 0);

      const pressedCards = rankedRail.locator('.squibb-rec-card[aria-pressed="true"]');
      assert.equal(await pressedCards.count(), 1);
      const bounds = await pressedCards.first().evaluate((element) => {
        const card = element.getBoundingClientRect();
        const railBox = element.parentElement.getBoundingClientRect();
        return { cardLeft: card.left, cardRight: card.right, railLeft: railBox.left, railRight: railBox.right };
      });
      assert.ok(bounds.cardLeft >= bounds.railLeft && bounds.cardRight <= bounds.railRight + 1);
      const selectedTitle = (await pressedCards.first().locator("h4").textContent())?.trim();
      const detailTitle = (await page.locator("#squibbDetailTitle").textContent())?.trim();
      assert.equal(detailTitle, selectedTitle);
    }

    if (artifactDir && (width === 320 || width === 1440)) {
      await page.screenshot({ path: path.join(artifactDir, `recommendations-${width}.png`), fullPage: true });
    }
    results.push({ width, geometry, heroStyles, cardStyles, copyStyles, focus, stateColors });
    await page.close();
  }

  const closedActionPosts = postRequests.filter((url) =>
    /\/api\/(?:discovery\/intake|bellows\/(?:intake|recommendation-packets)|matching(?:\/|$))/.test(new URL(url).pathname)
  );
  const actionableBrowserIssues = browserIssues.filter(
    ({ text }) => !(text.includes("https://vercel.live/_next-live/feedback/feedback.js") && text.includes("Content Security Policy"))
  );
  assert.deepEqual(closedActionPosts, [], "comparison interactions must not issue a closed-action POST");
  assert.deepEqual(actionableBrowserIssues, [], `browser console/page issues: ${JSON.stringify(actionableBrowserIssues)}`);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ pass: true, siteOrigin, postRequests, browserIssues, results }, null, 2));
