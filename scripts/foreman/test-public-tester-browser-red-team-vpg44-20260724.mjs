import { chromium } from "playwright";

const ORIGIN = process.env.VPG44_BROWSER_ORIGIN || "http://127.0.0.1:31245";
const EXPECTED_PID = Number(process.env.VPG44_BROWSER_PID || "38940");
const BROWSER_EXECUTABLE =
  process.env.VPG44_BROWSER_EXECUTABLE ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844, isMobile: true }
];

const results = {
  schema: "werkles.vpg44-lady-jessica-browser-red-team/v1",
  origin: ORIGIN,
  expectedPid: EXPECTED_PID,
  viewports,
  ideas: [],
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
    writes: Array.isArray(window.__vpg44StorageWrites)
      ? window.__vpg44StorageWrites
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

function syntheticSessionInitScript() {
  const syntheticSession = {
    access_token:
      "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ2cGc0NC1icm93c2VyLXRlc3QiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwicm9sZSI6ImF1dGhlbnRpY2F0ZWQiLCJleHAiOjQxMDI0NDQ4MDB9.",
    refresh_token: "vpg44-local-headless-refresh",
    expires_in: 2_000_000_000,
    expires_at: 4_102_444_800,
    token_type: "bearer",
    user: {
      id: "vpg44-browser-test",
      aud: "authenticated",
      role: "authenticated",
      email: "vpg44-browser-test@example.invalid",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      identities: [],
      created_at: "2026-07-24T00:00:00.000Z"
    }
  };

  const originalGetItem = Storage.prototype.getItem;
  const originalSetItem = Storage.prototype.setItem;
  const originalRemoveItem = Storage.prototype.removeItem;
  const writes = [];
  Object.defineProperty(window, "__vpg44StorageWrites", {
    value: writes,
    configurable: false
  });

  Storage.prototype.getItem = function getItem(key) {
    if (
      this === window.localStorage &&
      typeof key === "string" &&
      /^sb-.+-auth-token$/.test(key)
    ) {
      return JSON.stringify(syntheticSession);
    }
    return originalGetItem.call(this, key);
  };
  Storage.prototype.setItem = function setItem(key, value) {
    writes.push({ operation: "set", key: String(key) });
    if (
      this === window.localStorage &&
      typeof key === "string" &&
      /^sb-.+-auth-token$/.test(key)
    ) {
      return;
    }
    return originalSetItem.call(this, key, value);
  };
  Storage.prototype.removeItem = function removeItem(key) {
    writes.push({ operation: "remove", key: String(key) });
    if (
      this === window.localStorage &&
      typeof key === "string" &&
      /^sb-.+-auth-token$/.test(key)
    ) {
      return;
    }
    return originalRemoveItem.call(this, key);
  };
}

async function installPersonalDeliveryTestInstrumentation(page, instrumentation) {
  await page.route(
    "**/_next/static/chunks/app/bellows/recommendations/page-*.js",
    async (route) => {
      const response = await route.fetch();
      const source = await response.text();
      let patched = source;
      const configNeedle = 'if(!(0,b.J)()){e&&i({status:"signed_out"});return}';
      const sessionNeedle =
        "let{data:t}=await (0,b.n)().auth.getSession(),s=null==(n=t.session)?void 0:n.access_token;";
      const sessionReplacement =
        'let{data:t}=await Promise.resolve({data:{session:{access_token:"vpg44-headless-test-token"}}}),s=null==(n=t.session)?void 0:n.access_token;';

      if (patched.includes(configNeedle)) {
        patched = patched.replace(configNeedle, 'if(!1){e&&i({status:"signed_out"});return}');
        instrumentation.configBypassCount += 1;
      }
      if (patched.includes(sessionNeedle)) {
        patched = patched.replace(sessionNeedle, sessionReplacement);
        instrumentation.sessionBypassCount += 1;
      }

      const headers = { ...response.headers() };
      delete headers["content-length"];
      await route.fulfill({ response, headers, body: patched });
    }
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

  for (const adversary of cases) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addInitScript(syntheticSessionInitScript);
    const page = await context.newPage();
    const observations = installObservation(page, adversary.name === "aborted-request");
    const { check, testCase } = makeRecorder(idea, adversary.name);
    let personalRequestCount = 0;
    const instrumentation = { configBypassCount: 0, sessionBypassCount: 0 };

    await installPersonalDeliveryTestInstrumentation(page, instrumentation);
    await page.route("**/api/bellows/recommendations/personal", async (route) => {
      personalRequestCount += 1;
      await adversary.run(route);
    });

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
      check(
        "headless-only delivery instrumentation activated",
        instrumentation.configBypassCount === 1 && instrumentation.sessionBypassCount === 1,
        instrumentation
      );
      check("personal endpoint was requested exactly once", personalRequestCount === 1, personalRequestCount);
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

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(syntheticSessionInitScript);
  const page = await context.newPage();
  const observations = installObservation(page, true);
  const { check, testCase } = makeRecorder(idea, "abort-then-retry-recovery");
  let attempt = 0;
  const instrumentation = { configBypassCount: 0, sessionBypassCount: 0 };
  await installPersonalDeliveryTestInstrumentation(page, instrumentation);
  await page.route("**/api/bellows/recommendations/personal", async (route) => {
    attempt += 1;
    if (attempt === 1) {
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
    check(
      "headless-only recovery instrumentation activated",
      instrumentation.configBypassCount === 1 && instrumentation.sessionBypassCount === 1,
      instrumentation
    );
    check("retry makes exactly two personal requests", attempt === 2, attempt);
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

console.log(JSON.stringify(results, null, 2));
if (results.summary.failureCount > 0) process.exitCode = 1;
