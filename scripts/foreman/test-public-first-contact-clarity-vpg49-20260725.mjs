#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const ORIGIN = process.env.VPG49_BROWSER_ORIGIN;
const EXPECTED_PID = Number(process.env.VPG49_BROWSER_PID || "0");
const EXPECTED_BUILD_ID = process.env.VPG49_BROWSER_BUILD_ID || "";
const RESULT_PATH =
  process.env.VPG49_BROWSER_RESULT ||
  "foreman/receipts/WERKLES_VPG49_LADY_JESSICA_FIRST_CONTACT_RESULTS_20260725.json";
const BROWSER_EXECUTABLE =
  process.env.VPG49_BROWSER_EXECUTABLE ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

if (!ORIGIN) throw new Error("VPG49_BROWSER_ORIGIN is required");
const originUrl = new URL(ORIGIN);
if (!["127.0.0.1", "localhost"].includes(originUrl.hostname)) {
  throw new Error("VPG49 browser proof must use loopback");
}
if (originUrl.port === "3000") throw new Error("Port 3000 is outside VPG49 custody");
if (!(EXPECTED_PID > 0)) throw new Error("VPG49_BROWSER_PID is required");
if (!EXPECTED_BUILD_ID) throw new Error("VPG49_BROWSER_BUILD_ID is required");

const read = (path) => readFileSync(path, "utf8");
const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844, isMobile: true }
];
const result = {
  schema: "werkles.vpg49-lady-jessica-public-first-contact/v1",
  generatedAt: new Date().toISOString(),
  cycleId: "WERKLES-FLOCK-20260725-015952-ET-BETSY-01",
  seat: "LadyJessica@Betsy",
  origin: ORIGIN,
  expectedPid: EXPECTED_PID,
  expectedBuildId: EXPECTED_BUILD_ID,
  runtimeCustody: {},
  sourceBoundaryHashes: {},
  ideas: [],
  summary: {}
};

function makeIdea(idea, name) {
  const entry = { idea, name, cases: [] };
  result.ideas.push(entry);
  return entry;
}

function makeCase(idea, name) {
  const entry = { case: name, assertions: [], failures: [] };
  idea.cases.push(entry);
  return {
    entry,
    check(label, condition, evidence = undefined) {
      const passed = Boolean(condition);
      entry.assertions.push({
        label,
        passed,
        ...(evidence === undefined ? {} : { evidence })
      });
      if (!passed) entry.failures.push(label);
    }
  };
}

function installObservations(page) {
  const observations = {
    consoleErrors: [],
    pageErrors: [],
    unexpectedRequestFailures: [],
    mutatingRequests: []
  };
  page.on("console", (message) => {
    if (message.type() === "error") observations.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => observations.pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const failure = {
      method: request.method(),
      url: request.url(),
      error: request.failure()?.errorText || "unknown"
    };
    const url = new URL(request.url());
    const expected =
      (url.origin === ORIGIN &&
        url.searchParams.has("_rsc") &&
        failure.error.includes("ERR_ABORTED")) ||
      (["fonts.googleapis.com", "fonts.gstatic.com"].includes(url.hostname) &&
        failure.error.includes("ERR_BLOCKED_BY_CLIENT"));
    if (!expected) observations.unexpectedRequestFailures.push(failure);
  });
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      observations.mutatingRequests.push({
        method: request.method(),
        url: request.url()
      });
    }
  });
  return observations;
}

async function installExternalFontStub(context) {
  await context.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "text/css", body: "" })
  );
  await context.route("https://fonts.gstatic.com/**", (route) =>
    route.fulfill({ status: 204, body: "" })
  );
}

async function pageHealth(page) {
  return page.evaluate(() => {
    const interactive = [
      ...document.querySelectorAll("a[href], button, input:not([type=hidden]), select, textarea")
    ];
    const unnamed = interactive
      .filter((element) => {
        const text = element.textContent?.trim();
        const label = element.getAttribute("aria-label")?.trim();
        const labelledBy = (element.getAttribute("aria-labelledby") || "")
          .split(/\s+/)
          .filter(Boolean)
          .some((id) => document.getElementById(id)?.textContent?.trim());
        return !(text || label || labelledBy);
      })
      .map((element) => element.outerHTML);
    const headings = [...document.querySelectorAll("h1, h2, h3")].map((heading) => ({
      level: Number(heading.tagName.slice(1)),
      text: heading.textContent?.trim() || ""
    }));
    return {
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      unnamed,
      headings,
      imageCount: document.querySelectorAll("img").length,
      imagesWithoutAlt: document.querySelectorAll("img:not([alt])").length,
      bodyTextLength: document.body.innerText.trim().length,
      overlay: Boolean(
        document.querySelector(
          '[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay'
        )
      ),
      storage: {
        localKeys: Object.keys(localStorage),
        sessionKeys: Object.keys(sessionStorage)
      }
    };
  });
}

function headingOrderIsValid(headings) {
  let previous = 0;
  for (const heading of headings) {
    if (previous && heading.level > previous + 1) return false;
    previous = heading.level;
  }
  return headings.filter((heading) => heading.level === 1).length === 1;
}

async function verifyRuntimeCustody() {
  const port = Number(originUrl.port);
  const command = [
    `$listener = Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction Stop | Select-Object -First 1`,
    "$process = Get-CimInstance Win32_Process -Filter \"ProcessId = $($listener.OwningProcess)\"",
    "[ordered]@{ owningProcess = [int]$listener.OwningProcess; processName = $process.Name; commandLine = $process.CommandLine } | ConvertTo-Json -Compress"
  ].join("; ");
  const processEvidence = JSON.parse(
    execFileSync("powershell.exe", ["-NoProfile", "-Command", command], {
      encoding: "utf8"
    }).trim()
  );
  const buildManifestUrl = `${ORIGIN}/_next/static/${EXPECTED_BUILD_ID}/_buildManifest.js`;
  const buildManifestResponse = await fetch(buildManifestUrl, { cache: "no-store" });
  return {
    port,
    owningProcess: processEvidence.owningProcess,
    processName: processEvidence.processName,
    commandLine: processEvidence.commandLine,
    pidMatches: processEvidence.owningProcess === EXPECTED_PID,
    commandMatches: /next[\\/]dist[\\/]bin[\\/]next.*start/i.test(
      processEvidence.commandLine || ""
    ),
    buildId: EXPECTED_BUILD_ID,
    buildManifestUrl,
    buildManifestStatus: buildManifestResponse.status,
    port3000Touched: false
  };
}

const home = read("app/page.tsx");
const bellows = read("app/bellows/page.tsx");
const css = read("app/globals.css");
const hero = read("components/foundry/hero-static.tsx");
const publicLoader = read("lib/squibb/public-recommendation-session-server.ts");
const delivery = read("components/squibb/personal-recommendation-delivery.tsx");
const personalRoute = read("app/api/bellows/recommendations/personal/route.ts");
const bellowsHeroSource = bellows.slice(
  bellows.indexOf('<section className="bellows-hero'),
  bellows.indexOf("</section>", bellows.indexOf('<section className="bellows-hero'))
);

const idea1 = makeIdea(1, "Warm concise homepage hierarchy");
{
  const { check } = makeCase(idea1, "source-contract");
  check(
    "worked example remains the hero primary route",
    /className="button button-light" href="\/bellows\/recommendations"/.test(hero)
  );
  check("repeated Three safe doors card is removed", !/Three safe doors/.test(home));
  check(
    "homepage has exactly one quiet account handoff",
    (home.match(/className="home-account-handoff"/g) || []).length === 1
  );
  check(
    "account handoff has exactly one button",
    (home.slice(home.indexOf('className="home-account-handoff"')).match(/className="button /g) || [])
      .length === 1
  );
  check(
    "account creation preserves recommendation return",
    /href="\/signup\?next=%2Fbellows%2Frecommendations"/.test(home)
  );
  for (const destination of ["/login", "/pricing", "/dashboard", "/onboarding", "/proof"]) {
    check(
      `subordinate homepage destination remains ${destination}`,
      home.includes(`href="${destination}"`)
    );
  }
  check(
    "home account handoff has a named subordinate navigation",
    /<nav className="home-account-handoff__links" aria-label="Other ways to continue">/.test(
      home
    )
  );
  check(
    "existing homepage narrative imagery remains wired",
    /<HeroStatic \/>[\s\S]*<LanesDocumentarySection \/>[\s\S]*<SquibbStoryBeat \/>[\s\S]*<VisualStorySection \/>/.test(
      home
    )
  );
  check(
    "homepage handoff has desktop and mobile layout contracts",
    /\.home-account-handoff__band \.workshop-band__panel[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(280px, 0\.72fr\)/.test(
      css
    ) &&
      /@media \(max-width: 900px\)[\s\S]*\.home-account-handoff__band \.workshop-band__panel\s*\{\s*grid-template-columns: 1fr/.test(
        css
      )
  );
}

const idea2 = makeIdea(2, "One illustrated Bellows bridge to the example");
{
  const { check } = makeCase(idea2, "source-and-boundary-contract");
  check(
    "Bellows has one recommendation route",
    (bellows.match(/href="\/bellows\/recommendations"/g) || []).length === 1
  );
  check(
    "Bellows has one Profile Builder route with sanitized return",
    (
      bellows.match(
        /href="\/dashboard\/profile\?next=%2Fbellows%2Frecommendations"/g
      ) || []
    ).length === 1
  );
  check(
    "Bellows has one closed-intake route",
    (bellows.match(/href="\/bellows\/intake"/g) || []).length === 1
  );
  check(
    "recommendations-first truth is in the illustrated hero",
    bellows.indexOf("Recommendations first. Your profile makes them personal.") <
      bellows.indexOf('className="bellows-hero__squibb"')
  );
  check(
    "only recommendations is styled as the prominent Bellows action",
    (bellowsHeroSource.match(/className="button /g) || []).length === 1 &&
      /className="button button-dark" href="\/bellows\/recommendations"/.test(
        bellowsHeroSource
      )
  );
  check(
    "Profile Builder and closed intake are named subordinate links",
    /<nav className="bellows-hero__secondary-links" aria-label="Optional Bellows paths">/.test(
      bellows
    )
  );
  check(
    "all three Bellows images and captions remain",
    (bellows.match(/<Image\b/g) || []).length === 3 &&
      (bellows.match(/<figcaption>/g) || []).length === 3
  );
  check(
    "Bellows stacks copy before imagery on mobile",
    /@media \(max-width: 900px\)[\s\S]*\.bellows-hero--wired[\s\S]*grid-template-columns: 1fr/.test(
      css
    )
  );
  check("public recommendation loader remains demo-only", /mode: "demo"/.test(publicLoader));
  check(
    "personal delivery remains authenticated same-origin GET only",
    /method: "GET"/.test(delivery) &&
      /credentials: "same-origin"/.test(delivery) &&
      /Authorization: `Bearer \$\{token\}`/.test(delivery) &&
      !/localStorage|sessionStorage/.test(delivery)
  );
  check(
    "personal API remains owner-bound private and unsaved",
    /\.eq\("id", auth\.user\.id\)/.test(personalRoute) &&
      /private, no-store/.test(personalRoute) &&
      /persisted: false/.test(personalRoute)
  );
}

result.sourceBoundaryHashes = {
  "lib/squibb/public-recommendation-session-server.ts": sha256(
    "lib/squibb/public-recommendation-session-server.ts"
  ),
  "components/squibb/personal-recommendation-delivery.tsx": sha256(
    "components/squibb/personal-recommendation-delivery.tsx"
  ),
  "app/api/bellows/recommendations/personal/route.ts": sha256(
    "app/api/bellows/recommendations/personal/route.ts"
  )
};

result.runtimeCustody = await verifyRuntimeCustody();
{
  const { check } = makeCase(idea1, "isolated-runtime-custody");
  check(
    "runtime listener is the expected isolated PID",
    result.runtimeCustody.pidMatches,
    result.runtimeCustody
  );
  check(
    "runtime command is Next start",
    result.runtimeCustody.commandMatches,
    result.runtimeCustody.commandLine
  );
  check(
    "runtime serves the exact expected build manifest",
    result.runtimeCustody.buildManifestStatus === 200,
    result.runtimeCustody
  );
}

const browser = await chromium.launch({
  headless: true,
  executablePath: BROWSER_EXECUTABLE
});
try {
  for (const viewport of viewports) {
    {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: Boolean(viewport.isMobile),
        hasTouch: Boolean(viewport.isMobile)
      });
      await installExternalFontStub(context);
      const page = await context.newPage();
      const observations = installObservations(page);
      const { check } = makeCase(idea1, `${viewport.name}-homepage`);
      try {
        const response = await page.goto(`${ORIGIN}/`, { waitUntil: "networkidle" });
        check("homepage returns 200", response?.status() === 200, response?.status());
        const main = page.locator("main");
        check(
          "main has one prominent worked-example action",
          (await main
            .getByRole("link", { name: "See the worked example", exact: true })
            .count()) === 1
        );
        check(
          "repeated entry card is absent",
          (await main.getByText("Three safe doors into Werkles.", { exact: true }).count()) === 0
        );
        const handoff = main.locator(".home-account-handoff");
        check("quiet account handoff renders", await handoff.isVisible());
        check(
          "handoff has one button-style link",
          (await handoff.locator("a.button").count()) === 1
        );
        check(
          "handoff has five subordinate routes",
          (await handoff.locator("nav a").count()) === 5
        );
        const health = await pageHealth(page);
        check("homepage has one h1 and valid heading order", headingOrderIsValid(health.headings), health.headings);
        check("homepage has no horizontal overflow", !health.horizontalOverflow);
        check("homepage controls have accessible names", health.unnamed.length === 0, health.unnamed);
        check("homepage imagery remains substantial", health.imageCount >= 10, health.imageCount);
        check("homepage images have alt attributes", health.imagesWithoutAlt === 0);
        check("homepage has no framework overlay", !health.overlay);
        check("homepage remains nonblank", health.bodyTextLength > 1000, health.bodyTextLength);
        check(
          "homepage leaves browser storage empty",
          health.storage.localKeys.length === 0 && health.storage.sessionKeys.length === 0,
          health.storage
        );
        const primary = main.getByRole("link", {
          name: "See the worked example",
          exact: true
        });
        await primary.focus();
        check("homepage primary action accepts keyboard focus", await primary.evaluate((element) => element === document.activeElement));
        await page.keyboard.press("Enter");
        await page.waitForURL(`${ORIGIN}/bellows/recommendations`);
        check(
          "homepage keyboard action reaches the public example",
          new URL(page.url()).pathname === "/bellows/recommendations"
        );
        check("homepage journey makes no mutating request", observations.mutatingRequests.length === 0, observations.mutatingRequests);
        check("homepage journey has no page error", observations.pageErrors.length === 0, observations.pageErrors);
        check(
          "homepage journey has no unexpected request failure",
          observations.unexpectedRequestFailures.length === 0,
          observations.unexpectedRequestFailures
        );
        check("homepage journey has no console error", observations.consoleErrors.length === 0, observations.consoleErrors);
      } catch (error) {
        check(
          "homepage browser case completes without harness exception",
          false,
          error instanceof Error ? error.stack : String(error)
        );
      } finally {
        await context.close();
      }
    }

    {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: Boolean(viewport.isMobile),
        hasTouch: Boolean(viewport.isMobile)
      });
      await installExternalFontStub(context);
      const page = await context.newPage();
      const observations = installObservations(page);
      const { check } = makeCase(idea2, `${viewport.name}-bellows`);
      try {
        const response = await page.goto(`${ORIGIN}/bellows`, { waitUntil: "networkidle" });
        check("Bellows returns 200", response?.status() === 200, response?.status());
        const main = page.locator("main");
        const hero = main.locator(".bellows-hero");
        check(
          "Bellows has one prominent recommendation action",
          (await hero.locator("a.button").count()) === 1 &&
            (await hero
              .getByRole("link", { name: "See recommendations", exact: true })
              .count()) === 1
        );
        check(
          "Bellows renders one recommendation Profile Builder and intake route",
          (await main.locator('a[href="/bellows/recommendations"]').count()) === 1 &&
            (await main
              .locator('a[href="/dashboard/profile?next=%2Fbellows%2Frecommendations"]')
              .count()) === 1 &&
            (await main.locator('a[href="/bellows/intake"]').count()) === 1
        );
        check(
          "Bellows recommendations-first truth is visible",
          await hero
            .getByText("Recommendations first. Your profile makes them personal.", {
              exact: true
            })
            .isVisible()
        );
        check(
          "Bellows optional paths are visibly subordinate",
          (await hero.locator(".bellows-hero__secondary-links a.button").count()) === 0 &&
            (await hero.locator(".bellows-hero__secondary-links a").count()) === 2
        );
        const images = hero.locator("img").or(main.locator(".bellows-squibb-gallery img"));
        check("Bellows keeps three Squibb images", (await main.locator("img").count()) === 3);
        check(
          "Bellows keeps three visible image captions",
          (await main.locator("figcaption").count()) === 3
        );
        const health = await pageHealth(page);
        check("Bellows has one h1 and valid heading order", headingOrderIsValid(health.headings), health.headings);
        check("Bellows has no horizontal overflow", !health.horizontalOverflow);
        check("Bellows controls have accessible names", health.unnamed.length === 0, health.unnamed);
        check("Bellows images have alt attributes", health.imagesWithoutAlt === 0);
        check("Bellows has no framework overlay", !health.overlay);
        check("Bellows remains nonblank", health.bodyTextLength > 500, health.bodyTextLength);
        check(
          "Bellows leaves browser storage empty",
          health.storage.localKeys.length === 0 && health.storage.sessionKeys.length === 0,
          health.storage
        );
        if (viewport.isMobile) {
          const heroStyle = await hero.evaluate((element) => ({
            columns: getComputedStyle(element).gridTemplateColumns,
            copyTop: element.querySelector(".bellows-hero__copy")?.getBoundingClientRect().top,
            imageTop: element.querySelector(".bellows-hero__squibb")?.getBoundingClientRect().top
          }));
          check(
            "mobile Bellows uses one column with copy before image",
            !heroStyle.columns.includes(" ") &&
              Number(heroStyle.copyTop) < Number(heroStyle.imageTop),
            heroStyle
          );
        } else {
          const heroStyle = await hero.evaluate((element) => ({
            columns: getComputedStyle(element).gridTemplateColumns
          }));
          check(
            "desktop Bellows keeps balanced copy and image columns",
            heroStyle.columns.split(" ").length === 2,
            heroStyle
          );
        }
        const primary = hero.getByRole("link", {
          name: "See recommendations",
          exact: true
        });
        await primary.focus();
        check("Bellows primary action accepts keyboard focus", await primary.evaluate((element) => element === document.activeElement));
        await page.keyboard.press("Enter");
        await page.waitForURL(`${ORIGIN}/bellows/recommendations`);
        check(
          "Bellows keyboard action reaches recommendations",
          new URL(page.url()).pathname === "/bellows/recommendations"
        );
        check(
          "recommendations remain public example-first",
          await page.getByRole("note", { name: "Example mode" }).isVisible()
        );
        check("Bellows journey makes no mutating request", observations.mutatingRequests.length === 0, observations.mutatingRequests);
        check("Bellows journey has no page error", observations.pageErrors.length === 0, observations.pageErrors);
        check(
          "Bellows journey has no unexpected request failure",
          observations.unexpectedRequestFailures.length === 0,
          observations.unexpectedRequestFailures
        );
        check("Bellows journey has no console error", observations.consoleErrors.length === 0, observations.consoleErrors);
      } catch (error) {
        check(
          "Bellows browser case completes without harness exception",
          false,
          error instanceof Error ? error.stack : String(error)
        );
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}

for (const idea of result.ideas) {
  idea.caseCount = idea.cases.length;
  idea.assertionCount = idea.cases.reduce(
    (sum, testCase) => sum + testCase.assertions.length,
    0
  );
  idea.failureCount = idea.cases.reduce(
    (sum, testCase) => sum + testCase.failures.length,
    0
  );
}
result.summary = {
  ideaCount: result.ideas.length,
  viewportCount: viewports.length,
  caseCount: result.ideas.reduce((sum, idea) => sum + idea.caseCount, 0),
  assertionCount: result.ideas.reduce((sum, idea) => sum + idea.assertionCount, 0),
  failureCount: result.ideas.reduce((sum, idea) => sum + idea.failureCount, 0),
  verdict: result.ideas.every((idea) => idea.failureCount === 0) ? "PASS" : "FAIL"
};

writeFileSync(RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result, null, 2));
if (result.summary.failureCount > 0) process.exitCode = 1;
