import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const ORIGIN = process.env.VPG48_BROWSER_ORIGIN;
const EXPECTED_PID = Number(process.env.VPG48_BROWSER_PID || "0");
const EXPECTED_BUILD_ID = process.env.VPG48_BROWSER_BUILD_ID || "";
const BROWSER_EXECUTABLE =
  process.env.VPG48_BROWSER_EXECUTABLE ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const RESULT_PATH =
  process.env.VPG48_BROWSER_RESULT ||
  "foreman/receipts/WERKLES_VPG48_LADY_JESSICA_BROWSER_ACCEPTANCE_RESULTS_20260725.json";
const MOCK_SUPABASE_ORIGIN = "https://vpg46-local-only.supabase.co";
const MOCK_AUTH_KEY = "sb-vpg46-local-only-auth-token";
const SYNTHETIC_USER_ID = "48000000-0000-4000-8000-000000000048";

assert.ok(ORIGIN, "VPG48_BROWSER_ORIGIN is required");
const originUrl = new URL(ORIGIN);
assert.ok(
  ["127.0.0.1", "localhost"].includes(originUrl.hostname),
  "VPG48 browser proof must use a loopback runtime"
);
assert.notEqual(originUrl.port, "3000", "Port 3000 is outside VPG48 custody");
assert.ok(EXPECTED_PID > 0, "VPG48_BROWSER_PID is required");
assert.ok(EXPECTED_BUILD_ID, "VPG48_BROWSER_BUILD_ID is required");

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844, isMobile: true }
];

const results = {
  schema: "werkles.vpg48-lady-jessica-current-browser-acceptance/v1",
  generatedAt: new Date().toISOString(),
  cycleId: "WERKLES-FLOCK-20260725-013031-ET-BETSY-01",
  seat: "LadyJessica@Betsy",
  origin: ORIGIN,
  expectedPid: EXPECTED_PID,
  expectedBuildId: EXPECTED_BUILD_ID,
  mockSupabaseOrigin: MOCK_SUPABASE_ORIGIN,
  mockAuthKey: MOCK_AUTH_KEY,
  viewports,
  ideas: [],
  runtimeCustody: {},
  summary: {}
};

function makeRecorder(idea, caseName) {
  const testCase = {
    case: caseName,
    assertions: [],
    failures: [],
    expectedNetworkFailures: []
  };
  idea.cases.push(testCase);

  return {
    testCase,
    check(label, condition, evidence = undefined) {
      const passed = Boolean(condition);
      testCase.assertions.push({ label, passed, ...(evidence === undefined ? {} : { evidence }) });
      if (!passed) testCase.failures.push(label);
    }
  };
}

function installObservation(page, expectedPersonalFailures = false) {
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
  page.on("requestfailed", (request) => {
    const entry = {
      method: request.method(),
      url: request.url(),
      error: request.failure()?.errorText || "unknown"
    };
    const requestUrl = new URL(request.url());
    if (
      request.method() === "GET" &&
      requestUrl.origin === ORIGIN &&
      requestUrl.searchParams.has("_rsc") &&
      entry.error.includes("ERR_ABORTED")
    ) {
      observations.requestFailures.push({ ...entry, expected: true });
      return;
    }
    if (
      expectedPersonalFailures &&
      request.url().includes("/api/bellows/recommendations/personal")
    ) {
      observations.requestFailures.push({ ...entry, expected: true });
      return;
    }
    observations.requestFailures.push({ ...entry, expected: false });
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

async function browserIntegritySnapshot(page, scope = "body") {
  return page.locator(scope).evaluate((root) => {
    const all = [...root.querySelectorAll("*")];
    const ids = all.map((element) => element.id).filter(Boolean);
    const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
    const controlsWithoutTargets = all
      .filter((element) => element.hasAttribute("aria-controls"))
      .filter((element) => {
        const targets = (element.getAttribute("aria-controls") || "").split(/\s+/).filter(Boolean);
        return targets.some((id) => !document.getElementById(id));
      })
      .map((element) => element.getAttribute("aria-controls"));
    const imagesWithoutAlt = all
      .filter((element) => element instanceof HTMLImageElement && !element.hasAttribute("alt"))
      .length;
    const unlabeledInteractive = all
      .filter((element) =>
        element.matches("button, a[href], input:not([type=hidden]), select, textarea")
      )
      .filter((element) => {
        const id = element.id;
        const explicitLabel = id
          ? [...document.querySelectorAll("label")].some(
              (label) => label.getAttribute("for") === id
            )
          : false;
        const wrappedLabel = Boolean(element.closest("label"));
        const labelledBy = (element.getAttribute("aria-labelledby") || "")
          .split(/\s+/)
          .filter(Boolean)
          .some((labelId) => Boolean(document.getElementById(labelId)?.textContent?.trim()));
        const text = element.textContent?.trim();
        const alt = element.querySelector("img[alt]")?.getAttribute("alt")?.trim();
        return !(
          text ||
          alt ||
          element.getAttribute("aria-label")?.trim() ||
          labelledBy ||
          element.getAttribute("title")?.trim() ||
          explicitLabel ||
          wrappedLabel
        );
      })
      .length;

    return {
      duplicateIds,
      controlsWithoutTargets,
      imagesWithoutAlt,
      unlabeledInteractive,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      overlay: Boolean(
        document.querySelector(
          '[data-nextjs-dialog], .vite-error-overlay, #webpack-dev-server-client-overlay'
        )
      ),
      bodyTextLength: document.body.innerText.trim().length
    };
  });
}

async function storageSnapshot(page) {
  return page.evaluate(() => ({
    localKeys: Object.keys(localStorage),
    sessionKeys: Object.keys(sessionStorage),
    writes: Array.isArray(window.__vpg48StorageWrites)
      ? window.__vpg48StorageWrites
      : []
  }));
}

function onlySelfDeletingStorageProbes(storage) {
  if (storage.writes.length === 0) return true;
  const byKey = new Map();
  for (const write of storage.writes) {
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

async function executeFullJourney(browser) {
  const idea = {
    idea: 1,
    name: "Headless desktop/mobile/keyboard/accessibility full journey",
    cases: []
  };
  results.ideas.push(idea);

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: Boolean(viewport.isMobile),
      hasTouch: Boolean(viewport.isMobile)
    });
    const page = await context.newPage();
    const observations = installObservation(page);
    const { check } = makeRecorder(idea, `${viewport.name}-full-journey`);

    try {
      const homeResponse = await page.goto(`${ORIGIN}/`, { waitUntil: "networkidle" });
      check("home returns 200", homeResponse?.status() === 200, homeResponse?.status());
      check(
        "home explains worked-example entry",
        await page.getByText("See the worked example", { exact: true }).first().isVisible()
      );
      let integrity = await browserIntegritySnapshot(page);
      check("home is not blank", integrity.bodyTextLength > 500, integrity.bodyTextLength);
      check("home has no framework error overlay", !integrity.overlay);
      check("home has no page-level horizontal overflow", !integrity.horizontalOverflow);

      const bellowsLink = page.getByRole("link", { name: "Bellows", exact: true }).first();
      await bellowsLink.focus();
      await page.keyboard.press("Enter");
      await page.waitForURL(`${ORIGIN}/bellows`);
      check("keyboard navigation reaches Bellows", new URL(page.url()).pathname === "/bellows");
      check(
        "Bellows recommendation doorway is visible",
        await page.getByRole("link", { name: "See recommendations", exact: true }).first().isVisible()
      );

      const recommendationsLink = page
        .getByRole("link", { name: "See recommendations", exact: true })
        .first();
      await recommendationsLink.focus();
      await page.keyboard.press("Enter");
      await page.waitForURL(`${ORIGIN}/bellows/recommendations`);
      await page
        .getByRole("heading", { name: "One possible next move, explained.", exact: true })
        .waitFor();
      check(
        "Bellows doorway reaches recommendations",
        new URL(page.url()).pathname === "/bellows/recommendations"
      );
      check(
        "example custody is explicit",
        await page.getByRole("note", { name: "Example mode" }).isVisible()
      );
      check(
        "example is not misrepresented as private",
        (await page.getByText("Private account result", { exact: true }).count()) === 0
      );

      const catalogButton = page.getByRole("button", { name: /^All options/ });
      await catalogButton.focus();
      await page.keyboard.press("Enter");
      check(
        "keyboard switches to all-options view",
        (await catalogButton.getAttribute("aria-pressed")) === "true"
      );

      const cards = page.locator(".squibb-rec-card");
      const cardCount = await cards.count();
      check("all-options view exposes multiple choices", cardCount > 1, cardCount);
      const secondCard = cards.nth(1);
      const secondTitle = (await secondCard.locator(".squibb-rec-card__title").innerText()).trim();
      await secondCard.focus();
      await page.keyboard.press("Enter");
      check(
        "keyboard selects a different recommendation",
        (await secondCard.getAttribute("aria-pressed")) === "true"
      );
      check(
        "selection updates the detail heading",
        (await page.locator("#squibbDetailTitle").innerText()).trim() === secondTitle,
        secondTitle
      );
      check(
        "selection announces the updated detail",
        (await page.getByRole("status").filter({ hasText: "Details updated for" }).count()) === 1
      );

      const proofButton = page.getByRole("button", { name: "Check proof and gaps", exact: true });
      await proofButton.focus();
      await page.keyboard.press("Enter");
      check(
        "proof disclosure opens from keyboard",
        await page.locator("#squibbRecommendationEvidence").evaluate((element) => element.open)
      );
      check(
        "proof disclosure moves focus to its summary",
        await page.locator("#squibbRecommendationEvidence summary").evaluate(
          (element) => element === document.activeElement
        )
      );

      await page
        .locator("#personalRecommendationDoorway")
        .waitFor({ state: "visible", timeout: 10_000 });
      const continuation = page.getByRole("link", { name: "Get my own result", exact: true });
      await continuation.focus();
      await page.keyboard.press("Enter");
      check(
        "continuation keeps the user on the recommendation page",
        new URL(page.url()).pathname === "/bellows/recommendations"
      );
      check(
        "continuation focuses the account doorway",
        await page.locator("#personalRecommendationDoorway").evaluate(
          (element) => element === document.activeElement
        )
      );

      const profileResponse = await page.goto(
        `${ORIGIN}/dashboard/profile?next=%2Fbellows%2Frecommendations`,
        { waitUntil: "networkidle" }
      );
      await page.getByText("Profile Builder", { exact: true }).first().waitFor();
      const profileUrl = new URL(page.url());
      check("profile return route returns 200", profileResponse?.status() === 200, profileResponse?.status());
      check(
        "profile return path remains allowlisted",
        profileUrl.pathname === "/dashboard/profile" &&
          profileUrl.searchParams.get("next") === "/bellows/recommendations"
      );
      check(
        "profile route explains its auth state",
        (await page.getByText(/Sign in before adding profile details|Profile Builder is unavailable/).count()) === 1
      );

      await page.goto(`${ORIGIN}/bellows/recommendations`, { waitUntil: "networkidle" });
      await page
        .getByRole("heading", { name: "One possible next move, explained.", exact: true })
        .waitFor();
      integrity = await browserIntegritySnapshot(page, ".squibb-rec-surface");
      const storage = await storageSnapshot(page);
      check("recommendation surface has no duplicate IDs", integrity.duplicateIds.length === 0, integrity.duplicateIds);
      check(
        "recommendation aria-controls targets exist",
        integrity.controlsWithoutTargets.length === 0,
        integrity.controlsWithoutTargets
      );
      check("recommendation images have alt attributes", integrity.imagesWithoutAlt === 0);
      check("recommendation controls have accessible names", integrity.unlabeledInteractive === 0);
      check("recommendation surface has no error overlay", !integrity.overlay);
      check("recommendation page has no horizontal overflow", !integrity.horizontalOverflow);
      check("journey caused no mutating request", observations.mutatingRequests.length === 0, observations.mutatingRequests);
      check(
        "journey caused no unexpected failed request",
        observations.requestFailures.filter((entry) => !entry.expected).length === 0,
        observations.requestFailures
      );
      check("journey caused no page exception", observations.pageErrors.length === 0, observations.pageErrors);
      check("journey caused no console error", observations.consoleErrors.length === 0, observations.consoleErrors);
      check(
        "journey left browser storage empty",
        storage.localKeys.length === 0 && storage.sessionKeys.length === 0,
        storage
      );
    } catch (error) {
      check("journey completes without harness exception", false, error instanceof Error ? error.message : String(error));
    } finally {
      await context.close();
    }
  }
}

function base64url(value) {
  return Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function syntheticSession() {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const accessToken = [
    base64url({ alg: "none", typ: "JWT" }),
    base64url({
      aud: "authenticated",
      exp: nowSeconds + 86400,
      iat: nowSeconds,
      sub: SYNTHETIC_USER_ID,
      email: "lady-jessica-vpg48@example.invalid",
      role: "authenticated",
      aal: "aal1",
      session_id: "48000000-0000-4000-8000-000000000084"
    }),
    "vpg48-local-signature"
  ].join(".");
  const now = new Date().toISOString();
  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 86400,
    expires_at: nowSeconds + 86400,
    refresh_token: "vpg48-local-refresh-token",
    user: {
      id: SYNTHETIC_USER_ID,
      aud: "authenticated",
      role: "authenticated",
      email: "lady-jessica-vpg48@example.invalid",
      email_confirmed_at: now,
      phone: "",
      confirmed_at: now,
      last_sign_in_at: now,
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      identities: [],
      created_at: now,
      updated_at: now,
      is_anonymous: false
    }
  };
}

const SYNTHETIC_SESSION = syntheticSession();

async function installSyntheticSession(context) {
  await context.addInitScript(
    ({ authKey, authSession }) => {
      const originalSet = Storage.prototype.setItem;
      const originalRemove = Storage.prototype.removeItem;
      originalSet.call(localStorage, authKey, JSON.stringify(authSession));
      const writes = [];
      Object.defineProperty(window, "__vpg48StorageWrites", {
        value: writes,
        configurable: false,
        writable: false
      });
      Object.defineProperty(window, "__vpg48ClearSyntheticAuth", {
        value: () => originalRemove.call(localStorage, authKey),
        configurable: false,
        writable: false
      });
      Storage.prototype.setItem = function instrumentedSet(key, value) {
        writes.push({ operation: "set", key: String(key) });
        return originalSet.call(this, key, value);
      };
      Storage.prototype.removeItem = function instrumentedRemove(key) {
        writes.push({ operation: "remove", key: String(key) });
        return originalRemove.call(this, key);
      };
    },
    { authKey: MOCK_AUTH_KEY, authSession: SYNTHETIC_SESSION }
  );
}

async function clearSyntheticSessionFixture(page) {
  await page.evaluate(() => window.__vpg48ClearSyntheticAuth());
}

function createSupportedSeamState() {
  return {
    personalRequests: [],
    mockSupabaseRequests: [],
    unexpectedMockSupabaseRequests: [],
    compiledChunkInterceptionCount: 0
  };
}

function mockSupabaseHeaders() {
  return {
    "access-control-allow-origin": ORIGIN,
    "access-control-allow-credentials": "true",
    "content-type": "application/json"
  };
}

async function installSupportedPersonalDeliverySeam(context, seam, responder) {
  await context.route(`${MOCK_SUPABASE_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    seam.mockSupabaseRequests.push({
      method: request.method(),
      path: url.pathname,
      search: url.search
    });
    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: {
          ...mockSupabaseHeaders(),
          "access-control-allow-headers":
            request.headers()["access-control-request-headers"] ||
            "authorization,apikey,x-client-info",
          "access-control-allow-methods": "GET,POST,OPTIONS"
        }
      });
      return;
    }
    if (request.method() === "GET" && url.pathname === "/auth/v1/user") {
      await route.fulfill({
        status: 200,
        headers: mockSupabaseHeaders(),
        body: JSON.stringify(SYNTHETIC_SESSION.user)
      });
      return;
    }
    seam.unexpectedMockSupabaseRequests.push({
      method: request.method(),
      path: url.pathname,
      search: url.search
    });
    await route.fulfill({
      status: 418,
      headers: mockSupabaseHeaders(),
      body: JSON.stringify({ error: "Unexpected VPG48 synthetic Supabase request" })
    });
  });

  await context.route(`${ORIGIN}/api/bellows/recommendations/personal`, async (route) => {
    const request = route.request();
    seam.personalRequests.push({
      method: request.method(),
      url: request.url(),
      authorization: request.headers().authorization || ""
    });
    await responder(route);
  });
}

function supportedSeamEvidence(seam, expectedRequestCount) {
  const expectedAuthorization = `Bearer ${SYNTHETIC_SESSION.access_token}`;
  return {
    mockSupabaseOrigin: MOCK_SUPABASE_ORIGIN,
    mockAuthKey: MOCK_AUTH_KEY,
    personalRequestCount: seam.personalRequests.length,
    expectedRequestCount,
    personalRequestMethods: seam.personalRequests.map((request) => request.method),
    bearerCredentialMatches: seam.personalRequests.map(
      (request) => request.authorization === expectedAuthorization
    ),
    mockSupabaseRequestCount: seam.mockSupabaseRequests.length,
    unexpectedMockSupabaseRequests: seam.unexpectedMockSupabaseRequests,
    compiledChunkInterceptionCount: seam.compiledChunkInterceptionCount,
    buildId: results.runtimeCustody.buildId,
    pid: results.runtimeCustody.owningProcess
  };
}

function supportedSeamPassed(seam, expectedRequestCount) {
  const evidence = supportedSeamEvidence(seam, expectedRequestCount);
  return (
    evidence.personalRequestCount === expectedRequestCount &&
    evidence.personalRequestMethods.every((method) => method === "GET") &&
    evidence.bearerCredentialMatches.every(Boolean) &&
    evidence.unexpectedMockSupabaseRequests.length === 0 &&
    evidence.compiledChunkInterceptionCount === 0 &&
    evidence.buildId === EXPECTED_BUILD_ID &&
    evidence.pid === EXPECTED_PID
  );
}

async function executeDeliveryAdversary(browser) {
  const idea = {
    idea: 2,
    name: "Personal-delivery failure, fallback, retry, custody, and no-write adversary",
    cases: []
  };
  results.ideas.push(idea);

  const cases = [
    {
      name: "slow-profile-required",
      run: async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            persisted: false,
            status: "profile_required"
          })
        });
      },
      expectedText: "Your profile needs a goal or project detail.",
      initialText: "Looking for your profile."
    },
    {
      name: "aborted-request",
      run: (route) => route.abort("failed"),
      expectedText: "We could not load your result, so the example stays here."
    },
    {
      name: "401-private-sentinel",
      run: (route) =>
        route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "PRIVATE_SENTINEL_VPG44" })
        }),
      expectedText: "Your session ended."
    },
    {
      name: "500-private-sentinel",
      run: (route) =>
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "PRIVATE_SENTINEL_VPG44" })
        }),
      expectedText: "We could not load your result, so the example stays here."
    },
    {
      name: "malformed-json",
      run: (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: '{"success":true,"status":'
        }),
      expectedText: "We could not load your result, so the example stays here."
    }
  ];

  for (const viewport of viewports) {
    for (const adversary of cases) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: Boolean(viewport.isMobile),
        hasTouch: Boolean(viewport.isMobile)
      });
      await installSyntheticSession(context);
      const seam = createSupportedSeamState();
      await installSupportedPersonalDeliverySeam(context, seam, adversary.run);
      const page = await context.newPage();
      const observations = installObservation(page, adversary.name === "aborted-request");
      const { check, testCase } = makeRecorder(
        idea,
        `${viewport.name}-${adversary.name}`
      );

      try {
        const navigation = page.goto(`${ORIGIN}/bellows/recommendations`, {
          waitUntil: "domcontentloaded"
        });
        if (adversary.initialText) {
          await page.getByText(adversary.initialText, { exact: false }).waitFor();
          check("slow response exposes non-blocking loading state", true);
        }
        const response = await navigation;
        check("recommendation shell returns 200", response?.status() === 200, response?.status());
        await page.getByText(adversary.expectedText, { exact: false }).waitFor({ timeout: 10_000 });
        check("expected recovery state renders", true, adversary.expectedText);
        const seamEvidence = supportedSeamEvidence(seam, 1);
        check(
          "supported synthetic auth seam carries GET bearer request without compiled-chunk interception",
          supportedSeamPassed(seam, 1),
          seamEvidence
        );
        check(
          "personal endpoint was requested exactly once",
          seam.personalRequests.length === 1,
          seam.personalRequests.length
        );
        check(
          "example fallback remains visible",
          await page.getByRole("note", { name: "Example mode" }).isVisible()
        );
        check(
          "private custody never renders",
          (await page.getByText("Private account result", { exact: true }).count()) === 0
        );
        check(
          "private sentinel never leaks",
          !(await page.locator("body").innerText()).includes("PRIVATE_SENTINEL_VPG44")
        );
        const integrity = await browserIntegritySnapshot(page);
        check("failure state has no framework overlay", !integrity.overlay);
        check("failure state remains nonblank", integrity.bodyTextLength > 500, integrity.bodyTextLength);
        await clearSyntheticSessionFixture(page);
        const storage = await storageSnapshot(page);
        check(
          "failure state leaves real browser storage empty",
          storage.localKeys.length === 0 && storage.sessionKeys.length === 0,
          storage
        );
        check(
          "storage writes are limited to self-deleting capability probes",
          onlySelfDeletingStorageProbes(storage),
          storage.writes
        );
        check(
          "failure state causes no mutating request",
          observations.mutatingRequests.length === 0,
          observations.mutatingRequests
        );
        check("failure state causes no page exception", observations.pageErrors.length === 0, observations.pageErrors);
        const unexpectedFailures = observations.requestFailures.filter((entry) => !entry.expected);
        check("failure state causes no unexpected request failure", unexpectedFailures.length === 0, unexpectedFailures);
        const unexpectedConsoleErrors = observations.consoleErrors.filter(
          (message) => !message.includes("Failed to load resource")
        );
        check(
          "failure state causes no unexpected console error",
          unexpectedConsoleErrors.length === 0,
          unexpectedConsoleErrors
        );
        testCase.expectedNetworkFailures = observations.requestFailures.filter((entry) => entry.expected);
      } catch (error) {
        check("adversarial case completes without harness exception", false, error instanceof Error ? error.message : String(error));
      } finally {
        await context.close();
      }
    }
  }

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: Boolean(viewport.isMobile),
      hasTouch: Boolean(viewport.isMobile)
    });
    await installSyntheticSession(context);
    const seam = createSupportedSeamState();
    await installSupportedPersonalDeliverySeam(context, seam, async (route) => {
      if (seam.personalRequests.length === 1) {
        await route.abort("failed");
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          persisted: false,
          status: "profile_required"
        })
      });
    });
    const page = await context.newPage();
    const observations = installObservation(page, true);
    const { check, testCase } = makeRecorder(
      idea,
      `${viewport.name}-abort-then-retry-recovery`
    );

    try {
      const response = await page.goto(`${ORIGIN}/bellows/recommendations`, {
        waitUntil: "domcontentloaded"
      });
      check("recovery shell returns 200", response?.status() === 200, response?.status());
      await page
        .getByText("We could not load your result, so the example stays here.", { exact: false })
        .waitFor();
      check("first failure preserves example fallback", await page.getByRole("note", { name: "Example mode" }).isVisible());
      const retry = page.getByRole("button", { name: "Try again", exact: true });
      await retry.focus();
      await page.keyboard.press("Enter");
      await page.getByText("Your profile needs a goal or project detail.", { exact: false }).waitFor();
      check("retry reaches profile-required recovery", true);
      const seamEvidence = supportedSeamEvidence(seam, 2);
      check(
        "supported synthetic auth recovery seam carries GET bearer requests without compiled-chunk interception",
        supportedSeamPassed(seam, 2),
        seamEvidence
      );
      check(
        "retry makes exactly two personal requests",
        seam.personalRequests.length === 2,
        seam.personalRequests.length
      );
      check(
        "retry focuses the delivery status",
        await page.locator(".squibb-rec-delivery-status").evaluate(
          (element) => element === document.activeElement
        )
      );
      check(
        "recovered state offers Profile Builder",
        await page.getByRole("link", { name: "Open Profile Builder", exact: true }).isVisible()
      );
      check(
        "recovery never renders private custody",
        (await page.getByText("Private account result", { exact: true }).count()) === 0
      );
      await clearSyntheticSessionFixture(page);
      const storage = await storageSnapshot(page);
      check(
        "recovery leaves real browser storage empty",
        storage.localKeys.length === 0 && storage.sessionKeys.length === 0,
        storage
      );
      check(
        "recovery storage writes are limited to self-deleting capability probes",
        onlySelfDeletingStorageProbes(storage),
        storage.writes
      );
      check("recovery causes no mutating request", observations.mutatingRequests.length === 0, observations.mutatingRequests);
      check("recovery causes no page exception", observations.pageErrors.length === 0, observations.pageErrors);
      check(
        "recovery causes no unexpected failed request",
        observations.requestFailures.filter((entry) => !entry.expected).length === 0,
        observations.requestFailures
      );
      const unexpectedConsoleErrors = observations.consoleErrors.filter(
        (message) => !message.includes("Failed to load resource")
      );
      check(
        "recovery causes no unexpected console error",
        unexpectedConsoleErrors.length === 0,
        unexpectedConsoleErrors
      );
      testCase.expectedNetworkFailures = observations.requestFailures.filter((entry) => entry.expected);
    } catch (error) {
      check("retry recovery completes without harness exception", false, error instanceof Error ? error.message : String(error));
    } finally {
      await context.close();
    }
  }
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
  assert.equal(
    processEvidence.owningProcess,
    EXPECTED_PID,
    "The isolated runtime listener must be owned by the expected PID"
  );
  assert.match(
    processEvidence.commandLine || "",
    /next[\\/]dist[\\/]bin[\\/]next.*start/i,
    "The isolated listener must be the expected Next start runtime"
  );

  const buildManifestUrl = `${ORIGIN}/_next/static/${EXPECTED_BUILD_ID}/_buildManifest.js`;
  const buildManifestResponse = await fetch(buildManifestUrl, { cache: "no-store" });
  assert.equal(
    buildManifestResponse.status,
    200,
    "The isolated runtime must serve the expected build manifest"
  );

  return {
    port,
    owningProcess: processEvidence.owningProcess,
    processName: processEvidence.processName,
    commandLine: processEvidence.commandLine,
    buildId: EXPECTED_BUILD_ID,
    buildManifestUrl,
    buildManifestStatus: buildManifestResponse.status,
    port3000Touched: false
  };
}

results.runtimeCustody = await verifyRuntimeCustody();

const browser = await chromium.launch({
  headless: true,
  executablePath: BROWSER_EXECUTABLE
});
try {
  await executeFullJourney(browser);
  await executeDeliveryAdversary(browser);
} finally {
  await browser.close();
}

for (const idea of results.ideas) {
  idea.caseCount = idea.cases.length;
  idea.assertionCount = idea.cases.reduce((sum, testCase) => sum + testCase.assertions.length, 0);
  idea.failureCount = idea.cases.reduce((sum, testCase) => sum + testCase.failures.length, 0);
}

results.summary = {
  ideaCount: results.ideas.length,
  viewportCount: viewports.length,
  caseCount: results.ideas.reduce((sum, idea) => sum + idea.caseCount, 0),
  assertionCount: results.ideas.reduce((sum, idea) => sum + idea.assertionCount, 0),
  failureCount: results.ideas.reduce((sum, idea) => sum + idea.failureCount, 0),
  verdict: results.ideas.every((idea) => idea.failureCount === 0) ? "PASS" : "FAIL"
};

writeFileSync(RESULT_PATH, `${JSON.stringify(results, null, 2)}\n`, "utf8");
console.log(JSON.stringify(results, null, 2));
if (results.summary.failureCount > 0) process.exitCode = 1;
