import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const ORIGIN = process.env.VPG45_BROWSER_ORIGIN;
const EXPECTED_PID = Number(process.env.VPG45_BROWSER_PID || "0");
const BROWSER_EXECUTABLE =
  process.env.VPG45_BROWSER_EXECUTABLE ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const RESULT_PATH =
  process.env.VPG45_BROWSER_RESULT ||
  "foreman/receipts/WERKLES_VPG45_LADY_JESSICA_ACCESSIBLE_FONT_RESULTS_20260724.json";

assert.ok(ORIGIN, "VPG45_BROWSER_ORIGIN is required");
const originUrl = new URL(ORIGIN);
assert.ok(
  ["127.0.0.1", "localhost"].includes(originUrl.hostname),
  "VPG45 browser proof must use a loopback runtime"
);
assert.notEqual(originUrl.port, "3000", "Port 3000 is outside VPG45 custody");
assert.ok(EXPECTED_PID > 0, "VPG45_BROWSER_PID is required");

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844, isMobile: true }
];

const result = {
  schema: "werkles.vpg45-lady-jessica-accessible-font-resilience/v1",
  origin: ORIGIN,
  expectedPid: EXPECTED_PID,
  browser: "Microsoft Edge headless via Playwright/CDP",
  ideas: [],
  summary: {}
};

function recorder(idea, name) {
  const testCase = { name, assertions: [], failures: [] };
  idea.cases.push(testCase);
  return {
    testCase,
    check(label, condition, evidence = undefined) {
      const passed = Boolean(condition);
      testCase.assertions.push({
        label,
        passed,
        ...(evidence === undefined ? {} : { evidence })
      });
      if (!passed) testCase.failures.push(label);
    }
  };
}

async function installStorageProbe(context) {
  await context.addInitScript(() => {
    const writes = [];
    const originalSet = Storage.prototype.setItem;
    const originalRemove = Storage.prototype.removeItem;
    Storage.prototype.setItem = function patchedSetItem(key, value) {
      writes.push({ operation: "set", key: String(key), length: String(value).length });
      return originalSet.call(this, key, value);
    };
    Storage.prototype.removeItem = function patchedRemoveItem(key) {
      writes.push({ operation: "remove", key: String(key) });
      return originalRemove.call(this, key);
    };
    Object.defineProperty(window, "__vpg45StorageWrites", {
      value: writes,
      configurable: false,
      writable: false
    });
  });
}

function observe(page, { fontFailureExpected = false } = {}) {
  const observations = {
    consoleErrors: [],
    pageErrors: [],
    requestFailures: [],
    mutatingRequests: []
  };
  page.on("console", (message) => {
    if (message.type() === "error") observations.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => observations.pageErrors.push(error.message));
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      observations.mutatingRequests.push({
        method: request.method(),
        url: request.url()
      });
    }
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    const requestUrl = new URL(url);
    const rscAbort =
      request.method() === "GET" &&
      requestUrl.origin === ORIGIN &&
      requestUrl.searchParams.has("_rsc") &&
      (request.failure()?.errorText || "").includes("ERR_ABORTED");
    const fontAbort =
      fontFailureExpected &&
      ["fonts.googleapis.com", "fonts.gstatic.com"].includes(requestUrl.hostname);
    observations.requestFailures.push({
      method: request.method(),
      url,
      error: request.failure()?.errorText || "unknown",
      expected: rscAbort || fontAbort
    });
  });
  return observations;
}

async function domSnapshot(page) {
  return page.locator("body").evaluate((body) => {
    const all = [...body.querySelectorAll("*")];
    const ids = all.map((element) => element.id).filter(Boolean);
    const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    const interactiveSelector =
      'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';
    const interactives = [...body.querySelectorAll(interactiveSelector)].filter((element) => {
      const style = getComputedStyle(element);
      return (
        !element.hasAttribute("disabled") &&
        element.getAttribute("aria-hidden") !== "true" &&
        style.display !== "none" &&
        style.visibility !== "hidden"
      );
    });
    const nameFor = (element) => {
      const labelledBy = (element.getAttribute("aria-labelledby") || "")
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent?.trim() || "")
        .filter(Boolean)
        .join(" ");
      return (
        element.getAttribute("aria-label")?.trim() ||
        labelledBy ||
        element.textContent?.trim() ||
        element.querySelector("img[alt]")?.getAttribute("alt")?.trim() ||
        element.getAttribute("title")?.trim() ||
        ""
      );
    };
    const controlsWithoutTargets = all
      .filter((element) => element.hasAttribute("aria-controls"))
      .filter((element) =>
        (element.getAttribute("aria-controls") || "")
          .split(/\s+/)
          .filter(Boolean)
          .some((id) => !document.getElementById(id))
      )
      .map((element) => element.getAttribute("aria-controls"));
    const clippedText = all
      .filter((element) => element.children.length === 0 && (element.textContent || "").trim())
      .filter((element) => {
        const style = getComputedStyle(element);
        const hiddenX = ["hidden", "clip"].includes(style.overflowX);
        const hiddenY = ["hidden", "clip"].includes(style.overflowY);
        return (
          (hiddenX && element.scrollWidth > element.clientWidth + 1) ||
          (hiddenY && element.scrollHeight > element.clientHeight + 1)
        );
      })
      .slice(0, 20)
      .map((element) => ({
        tag: element.tagName,
        className: element.className,
        text: (element.textContent || "").trim().slice(0, 80)
      }));
    const headings = [...body.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((heading) => ({
      level: Number(heading.tagName.slice(1)),
      text: (heading.textContent || "").trim()
    }));
    const headingSkips = headings
      .slice(1)
      .filter((heading, index) => heading.level > headings[index].level + 1);
    const nestedInteractive = interactives
      .filter((element) => element.parentElement?.closest("a[href], button, summary"))
      .map((element) => element.outerHTML.slice(0, 160));
    const rects = interactives.map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        name: nameFor(element).slice(0, 120),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        left: Math.round(rect.left),
        right: Math.round(rect.right)
      };
    });
    return {
      title: document.title,
      bodyTextLength: document.body.innerText.trim().length,
      mainCount: body.querySelectorAll("main").length,
      h1Count: body.querySelectorAll("h1").length,
      headings,
      headingSkips,
      duplicateIds,
      controlsWithoutTargets,
      nestedInteractive,
      imagesWithoutAlt: [...body.querySelectorAll("img")].filter(
        (image) => !image.hasAttribute("alt")
      ).length,
      unlabeledInteractive: interactives.filter((element) => !nameFor(element)).length,
      controlNames: interactives.map((element) => nameFor(element).replace(/\s+/g, " ").trim()),
      rects,
      zeroSizeControls: rects.filter((rect) => rect.width <= 0 || rect.height <= 0),
      horizontallyOffscreenControls: interactives
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          if (!(rect.right < 0 || rect.left > window.innerWidth)) return false;
          let ancestor = element.parentElement;
          while (ancestor && ancestor !== body) {
            const style = getComputedStyle(ancestor);
            if (
              ancestor.scrollWidth > ancestor.clientWidth + 1 &&
              ["auto", "scroll"].includes(style.overflowX)
            ) {
              return false;
            }
            ancestor = ancestor.parentElement;
          }
          return true;
        })
        .map((element) => ({
          name: nameFor(element).slice(0, 120),
          html: element.outerHTML.slice(0, 160)
        })),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      clippedText,
      overlay: Boolean(
        document.querySelector(
          '[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay'
        )
      ),
      fontFamilies: {
        body: getComputedStyle(document.body).fontFamily,
        h1: body.querySelector("h1")
          ? getComputedStyle(body.querySelector("h1")).fontFamily
          : null,
        brand: body.querySelector(".brand-word")
          ? getComputedStyle(body.querySelector(".brand-word")).fontFamily
          : null
      },
      storage: {
        localKeys: Object.keys(localStorage),
        sessionKeys: Object.keys(sessionStorage),
        writes: Array.isArray(window.__vpg45StorageWrites)
          ? window.__vpg45StorageWrites
          : []
      }
    };
  });
}

async function axSnapshot(context, page) {
  const session = await context.newCDPSession(page);
  const { nodes } = await session.send("Accessibility.getFullAXTree");
  await session.detach();
  const exposed = nodes.filter((node) => !node.ignored);
  const roleCounts = {};
  for (const node of exposed) {
    const role = node.role?.value || "unknown";
    roleCounts[role] = (roleCounts[role] || 0) + 1;
  }
  const namedControls = exposed
    .filter((node) =>
      ["button", "link", "textbox", "combobox", "checkbox", "radio", "DisclosureTriangle"].includes(
        node.role?.value
      )
    )
    .map((node) => `${node.role?.value}:${node.name?.value || ""}`)
    .sort();
  const headings = exposed
    .filter((node) => node.role?.value === "heading")
    .map((node) => node.name?.value || "");
  return {
    nodeCount: exposed.length,
    roleCounts,
    namedControls,
    headings,
    unnamedControls: namedControls.filter((entry) => entry.endsWith(":"))
  };
}

async function focusSequence(page, limit = 12) {
  await page.locator("body").click({ position: { x: 1, y: 1 } });
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  const sequence = [];
  for (let index = 0; index < limit; index += 1) {
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || element === document.body) return null;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const labelledBy = (element.getAttribute("aria-labelledby") || "")
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent?.trim() || "")
        .filter(Boolean)
        .join(" ");
      const name =
        element.getAttribute("aria-label")?.trim() ||
        labelledBy ||
        element.textContent?.trim() ||
        element.getAttribute("title")?.trim() ||
        "";
      const visibleIndicator =
        style.outlineStyle !== "none" ||
        parseFloat(style.outlineWidth) > 0 ||
        style.boxShadow !== "none" ||
        style.borderColor !== "rgba(0, 0, 0, 0)";
      return {
        tag: element.tagName.toLowerCase(),
        name: name.replace(/\s+/g, " ").trim().slice(0, 120),
        href: element instanceof HTMLAnchorElement ? element.getAttribute("href") : null,
        visible:
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden",
        visibleIndicator
      };
    });
    if (focused) sequence.push(focused);
  }
  return sequence;
}

function unexpectedFailures(observations) {
  return observations.requestFailures.filter((entry) => !entry.expected);
}

function safeStorage(snapshot) {
  if (snapshot.storage.localKeys.length || snapshot.storage.sessionKeys.length) return false;
  const writes = snapshot.storage.writes;
  if (!writes.length) return true;
  const byKey = new Map();
  for (const write of writes) {
    if (!/^lswt-[0-9.]+$/.test(write.key)) return false;
    const operations = byKey.get(write.key) || [];
    operations.push(write.operation);
    byKey.set(write.key, operations);
  }
  return [...byKey.values()].every(
    (operations) =>
      operations.length === 2 &&
      operations[0] === "set" &&
      operations[1] === "remove"
  );
}

function assertSemanticSnapshot(check, dom, ax, label) {
  check(`${label}: exactly one main landmark`, dom.mainCount === 1, dom.mainCount);
  check(`${label}: exactly one h1`, dom.h1Count === 1, dom.headings);
  check(`${label}: heading outline has no skipped levels`, dom.headingSkips.length === 0, dom.headingSkips);
  check(`${label}: no duplicate IDs`, dom.duplicateIds.length === 0, dom.duplicateIds);
  check(
    `${label}: all aria-controls targets exist`,
    dom.controlsWithoutTargets.length === 0,
    dom.controlsWithoutTargets
  );
  check(`${label}: no nested interactive controls`, dom.nestedInteractive.length === 0, dom.nestedInteractive);
  check(`${label}: all images expose alt attributes`, dom.imagesWithoutAlt === 0, dom.imagesWithoutAlt);
  check(
    `${label}: all interactive controls have names`,
    dom.unlabeledInteractive === 0 && ax.unnamedControls.length === 0,
    { dom: dom.unlabeledInteractive, ax: ax.unnamedControls }
  );
  check(`${label}: content is nonblank`, dom.bodyTextLength > 150, dom.bodyTextLength);
  check(`${label}: no horizontal page overflow`, !dom.horizontalOverflow);
  check(`${label}: no clipped leaf text`, dom.clippedText.length === 0, dom.clippedText);
  check(`${label}: no zero-size controls`, dom.zeroSizeControls.length === 0, dom.zeroSizeControls);
  check(
    `${label}: no horizontally offscreen controls`,
    dom.horizontallyOffscreenControls.length === 0,
    dom.horizontallyOffscreenControls
  );
  check(`${label}: no framework error overlay`, !dom.overlay);
  check(`${label}: AX tree exposes headings`, ax.headings.length > 0, ax.headings);
}

async function runAccessibleJourney(browser) {
  const idea = {
    idea: 1,
    name: "Desktop/mobile keyboard and assistive-semantics public journey",
    cases: []
  };
  result.ideas.push(idea);

  for (const viewport of viewports) {
    const { check } = recorder(idea, `${viewport.name}-keyboard-ax-journey`);
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: Boolean(viewport.isMobile),
      hasTouch: Boolean(viewport.isMobile)
    });
    await installStorageProbe(context);
    const page = await context.newPage();
    const observations = observe(page);

    try {
      const homeResponse = await page.goto(`${ORIGIN}/`, { waitUntil: "networkidle" });
      check("home returns 200", homeResponse?.status() === 200, homeResponse?.status());
      const homeDom = await domSnapshot(page);
      const homeAx = await axSnapshot(context, page);
      assertSemanticSnapshot(check, homeDom, homeAx, "home");
      const homeFocus = await focusSequence(page, 16);
      check("home Tab sequence reaches multiple named controls", new Set(homeFocus.map((item) => item.name)).size >= 8, homeFocus);
      check("home focused controls remain visible", homeFocus.every((item) => item.visible), homeFocus);
      check(
        "home focus has a visible indicator",
        homeFocus.every((item) => item.visibleIndicator),
        homeFocus
      );

      const bellowsLink = page.getByRole("link", { name: "Bellows", exact: true }).first();
      await bellowsLink.focus();
      await page.keyboard.press("Enter");
      await page.waitForURL(`${ORIGIN}/bellows`);
      check("keyboard opens Bellows", new URL(page.url()).pathname === "/bellows");
      const bellowsDom = await domSnapshot(page);
      const bellowsAx = await axSnapshot(context, page);
      assertSemanticSnapshot(check, bellowsDom, bellowsAx, "Bellows");

      const recommendationLink = page
        .getByRole("link", { name: "See recommendations", exact: true })
        .first();
      await recommendationLink.focus();
      await page.keyboard.press("Enter");
      await page.waitForURL(`${ORIGIN}/bellows/recommendations`);
      check("keyboard opens recommendations", new URL(page.url()).pathname === "/bellows/recommendations");
      const recommendationDom = await domSnapshot(page);
      const recommendationAx = await axSnapshot(context, page);
      assertSemanticSnapshot(check, recommendationDom, recommendationAx, "recommendations");

      const allOptions = page.getByRole("button", { name: /^All options \(\d+\)$/ });
      await allOptions.focus();
      await page.keyboard.press("Enter");
      check("keyboard activates all-options deck", (await allOptions.getAttribute("aria-pressed")) === "true");
      const cards = page.locator(".squibb-rec-card");
      check("all-options deck exposes more than one recommendation", (await cards.count()) > 1, await cards.count());
      const secondCard = cards.nth(1);
      await secondCard.focus();
      await page.keyboard.press("Enter");
      check("keyboard selects a recommendation card", (await secondCard.getAttribute("aria-pressed")) === "true");
      check(
        "selection status is an atomic live status",
        (await page.locator(".squibb-rec-selection-status").getAttribute("role")) === "status" &&
          (await page.locator(".squibb-rec-selection-status").getAttribute("aria-atomic")) === "true"
      );
      const reasoning = page.getByText("Why this option", { exact: true }).first();
      await reasoning.focus();
      await page.keyboard.press(" ");
      check("keyboard opens native reasoning disclosure", await reasoning.locator("..").getAttribute("open") !== null);
      const proof = page.getByText("Proof and gaps", { exact: true }).first();
      await proof.focus();
      await page.keyboard.press(" ");
      check("keyboard opens native proof disclosure", await proof.locator("..").getAttribute("open") !== null);

      const profileResponse = await page.goto(
        `${ORIGIN}/dashboard/profile?next=%2Fbellows%2Frecommendations`,
        { waitUntil: "networkidle" }
      );
      check("Profile Builder return route returns 200", profileResponse?.status() === 200, profileResponse?.status());
      check(
        "Profile Builder return target stays allowlisted",
        new URL(page.url()).searchParams.get("next") === "/bellows/recommendations"
      );
      const profileDom = await domSnapshot(page);
      const profileAx = await axSnapshot(context, page);
      assertSemanticSnapshot(check, profileDom, profileAx, "Profile Builder");
      check(
        "Profile Builder exposes truthful auth or availability state",
        (await page.getByText(/Sign in before adding profile details|Profile Builder is unavailable/).count()) === 1
      );

      const finalStorage = await domSnapshot(page);
      check("journey causes no mutating request", observations.mutatingRequests.length === 0, observations.mutatingRequests);
      check("journey leaves no persistent browser storage", safeStorage(finalStorage), finalStorage.storage);
      check("journey causes no page exception", observations.pageErrors.length === 0, observations.pageErrors);
      check("journey causes no console error", observations.consoleErrors.length === 0, observations.consoleErrors);
      check("journey causes no unexpected request failure", unexpectedFailures(observations).length === 0, unexpectedFailures(observations));
    } catch (error) {
      check("journey completes without harness exception", false, error instanceof Error ? error.stack : String(error));
    } finally {
      await context.close();
    }
  }
}

const fontRoutes = [
  { name: "home", path: "/" },
  { name: "Bellows", path: "/bellows" },
  { name: "recommendations", path: "/bellows/recommendations" },
  {
    name: "Profile Builder",
    path: "/dashboard/profile?next=%2Fbellows%2Frecommendations"
  }
];

async function runFontMode(browser, viewport, mode) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: Boolean(viewport.isMobile),
    hasTouch: Boolean(viewport.isMobile)
  });
  await installStorageProbe(context);
  if (mode === "simulated-delivery") {
    await context.route("https://fonts.googleapis.com/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/css",
        body:
          '@font-face{font-family:"DM Sans";font-style:normal;font-weight:700 800;src:local("Arial")}@font-face{font-family:"Fraunces";font-style:normal;font-weight:700 800;src:local("Georgia")}'
      });
    });
    await context.route("https://fonts.gstatic.com/**", async (route) => {
      await route.abort("blockedbyclient");
    });
  } else {
    await context.route("https://fonts.googleapis.com/**", async (route) => {
      await route.abort("failed");
    });
    await context.route("https://fonts.gstatic.com/**", async (route) => {
      await route.abort("failed");
    });
  }

  const page = await context.newPage();
  const observations = observe(page, { fontFailureExpected: mode === "hard-failure" });
  const routeResults = {};
  for (const route of fontRoutes) {
    const response = await page.goto(`${ORIGIN}${route.path}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    routeResults[route.name] = {
      status: response?.status() || null,
      dom: await domSnapshot(page),
      ax: await axSnapshot(context, page),
      focus: await focusSequence(page, 10)
    };
  }
  await context.close();
  return { routeResults, observations };
}

function stableStrings(values) {
  return [...values].sort();
}

async function runFontFailure(browser) {
  const idea = {
    idea: 2,
    name: "External-font hard-failure self-containment and geometry comparison",
    cases: []
  };
  result.ideas.push(idea);

  for (const viewport of viewports) {
    const { check } = recorder(idea, `${viewport.name}-font-delivery-vs-hard-failure`);
    try {
      const baseline = await runFontMode(browser, viewport, "simulated-delivery");
      const fallback = await runFontMode(browser, viewport, "hard-failure");
      for (const route of fontRoutes) {
        const before = baseline.routeResults[route.name];
        const after = fallback.routeResults[route.name];
        check(`${route.name}: simulated font delivery returns 200`, before.status === 200, before.status);
        check(`${route.name}: hard font failure still returns 200`, after.status === 200, after.status);
        assertSemanticSnapshot(check, before.dom, before.ax, `${route.name} baseline`);
        assertSemanticSnapshot(check, after.dom, after.ax, `${route.name} fallback`);
        check(
          `${route.name}: font failure preserves visible control names`,
          JSON.stringify(stableStrings(after.dom.controlNames)) ===
            JSON.stringify(stableStrings(before.dom.controlNames)),
          { before: before.dom.controlNames, after: after.dom.controlNames }
        );
        check(
          `${route.name}: font failure preserves AX named controls`,
          JSON.stringify(after.ax.namedControls) === JSON.stringify(before.ax.namedControls),
          { before: before.ax.namedControls, after: after.ax.namedControls }
        );
        check(
          `${route.name}: font failure preserves heading content`,
          JSON.stringify(after.ax.headings) === JSON.stringify(before.ax.headings),
          { before: before.ax.headings, after: after.ax.headings }
        );
        check(
          `${route.name}: font failure preserves keyboard focus order`,
          JSON.stringify(after.focus.map(({ tag, name, href }) => ({ tag, name, href }))) ===
            JSON.stringify(before.focus.map(({ tag, name, href }) => ({ tag, name, href }))),
          { before: before.focus, after: after.focus }
        );
        check(
          `${route.name}: fallback controls remain visible and focus-indicated`,
          after.focus.every((item) => item.visible && item.visibleIndicator),
          after.focus
        );
        check(`${route.name}: fallback storage remains empty`, safeStorage(after.dom), after.dom.storage);
      }
      check(
        "simulated delivery makes no live provider request failure",
        unexpectedFailures(baseline.observations).length === 0,
        unexpectedFailures(baseline.observations)
      );
      check(
        "hard font failures are the only expected external failures",
        unexpectedFailures(fallback.observations).length === 0,
        fallback.observations.requestFailures
      );
      check(
        "font comparison causes no mutating request",
        baseline.observations.mutatingRequests.length === 0 &&
          fallback.observations.mutatingRequests.length === 0,
        {
          baseline: baseline.observations.mutatingRequests,
          fallback: fallback.observations.mutatingRequests
        }
      );
      check(
        "font comparison causes no page exception",
        baseline.observations.pageErrors.length === 0 &&
          fallback.observations.pageErrors.length === 0,
        {
          baseline: baseline.observations.pageErrors,
          fallback: fallback.observations.pageErrors
        }
      );
      const unexpectedFallbackConsole = fallback.observations.consoleErrors.filter(
        (message) => message !== "Failed to load resource: net::ERR_FAILED"
      );
      check(
        "font comparison causes no unexpected console error",
        baseline.observations.consoleErrors.length === 0 &&
          unexpectedFallbackConsole.length === 0,
        {
          baseline: baseline.observations.consoleErrors,
          fallback: unexpectedFallbackConsole
        }
      );
    } catch (error) {
      check("font comparison completes without harness exception", false, error instanceof Error ? error.stack : String(error));
    }
  }
}

const browser = await chromium.launch({
  headless: true,
  executablePath: BROWSER_EXECUTABLE
});

try {
  await runAccessibleJourney(browser);
  await runFontFailure(browser);
} finally {
  await browser.close();
}

for (const idea of result.ideas) {
  idea.caseCount = idea.cases.length;
  idea.assertionCount = idea.cases.reduce((sum, testCase) => sum + testCase.assertions.length, 0);
  idea.failureCount = idea.cases.reduce((sum, testCase) => sum + testCase.failures.length, 0);
}

result.summary = {
  ideaCount: result.ideas.length,
  viewportCount: viewports.length,
  caseCount: result.ideas.reduce((sum, idea) => sum + idea.caseCount, 0),
  routeSnapshots: 2 * 2 * fontRoutes.length,
  assertionCount: result.ideas.reduce((sum, idea) => sum + idea.assertionCount, 0),
  failureCount: result.ideas.reduce((sum, idea) => sum + idea.failureCount, 0),
  verdict: result.ideas.every((idea) => idea.failureCount === 0) ? "PASS" : "FAIL"
};

writeFileSync(RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result.summary, null, 2));
if (result.summary.failureCount > 0) process.exitCode = 1;
