import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";

const ORIGIN = process.env.VPG46_BROWSER_ORIGIN;
const EXPECTED_PID = Number(process.env.VPG46_BROWSER_PID || "0");
const EXPECTED_BUILD_ID = process.env.VPG46_BROWSER_BUILD_ID || "";
const BROWSER_EXECUTABLE =
  process.env.VPG46_BROWSER_EXECUTABLE ||
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const RESULT_PATH =
  process.env.VPG46_BROWSER_RESULT ||
  "foreman/receipts/WERKLES_VPG46_LADY_JESSICA_PROFILE_FIRST_SAVE_RESULTS_20260724.json";
const MOCK_SUPABASE_ORIGIN = "https://vpg46-local-only.supabase.co";
const MOCK_AUTH_KEY = "sb-vpg46-local-only-auth-token";
const ACCOUNT_EMAIL = "account@vpg46.invalid";
const CONTACT_EMAIL = "contact@vpg46.invalid";
const USER_ID = "46000000-0000-4000-8000-000000000046";
const CUSTOM_GOAL = "Build a durable worker-owned repair shop";

assert.ok(ORIGIN, "VPG46_BROWSER_ORIGIN is required");
const originUrl = new URL(ORIGIN);
assert.ok(
  ["127.0.0.1", "localhost"].includes(originUrl.hostname),
  "VPG46 browser proof must use a loopback runtime"
);
assert.notEqual(originUrl.port, "3000", "Port 3000 is outside VPG46 custody");
assert.ok(EXPECTED_PID > 0, "VPG46_BROWSER_PID is required");
assert.ok(EXPECTED_BUILD_ID, "VPG46_BROWSER_BUILD_ID is required");

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844, isMobile: true }
];
const expectedProfileColumns = [
  "blueprint_narrative",
  "current_employer",
  "display_name",
  "email",
  "first_name",
  "id",
  "industry_tags",
  "lane",
  "last_name",
  "location_city",
  "location_state",
  "past_roles",
  "phone",
  "primary_goal",
  "profile_depth",
  "show_employer",
  "skills_offered",
  "skills_sought",
  "timeline_to_launch",
  "turf_zip",
  "visibility_mode",
  "work_preference"
].sort();

const result = {
  schema: "werkles.vpg46-lady-jessica-profile-first-save/v1",
  origin: ORIGIN,
  expectedPid: EXPECTED_PID,
  buildId: EXPECTED_BUILD_ID,
  mockSupabaseOrigin: MOCK_SUPABASE_ORIGIN,
  browser: "Microsoft Edge headless via Playwright",
  ideas: [],
  summary: {}
};

function recorder(idea, name) {
  console.log(`[VPG46] START idea=${idea.idea} case=${name}`);
  const testCase = { name, assertions: [], failures: [] };
  idea.cases.push(testCase);
  return {
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

function base64url(value) {
  return Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function syntheticUser() {
  const now = new Date().toISOString();
  return {
    id: USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: ACCOUNT_EMAIL,
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
  };
}

function syntheticSession() {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const user = syntheticUser();
  const accessToken = [
    base64url({ alg: "none", typ: "JWT" }),
    base64url({
      aud: "authenticated",
      exp: nowSeconds + 86400,
      iat: nowSeconds,
      sub: USER_ID,
      email: ACCOUNT_EMAIL,
      role: "authenticated",
      aal: "aal1",
      session_id: "46000000-0000-4000-8000-000000000064"
    }),
    "vpg46-local-signature"
  ].join(".");
  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 86400,
    expires_at: nowSeconds + 86400,
    refresh_token: "vpg46-local-refresh-token",
    user
  };
}

async function installSyntheticSession(context) {
  const session = syntheticSession();
  await context.addInitScript(
    ({ authKey, authSession }) => {
      const writes = [];
      const originalSet = Storage.prototype.setItem;
      const originalRemove = Storage.prototype.removeItem;
      Storage.prototype.setItem = function patchedSet(key, value) {
        writes.push({ operation: "set", key: String(key), length: String(value).length });
        return originalSet.call(this, key, value);
      };
      Storage.prototype.removeItem = function patchedRemove(key) {
        writes.push({ operation: "remove", key: String(key) });
        return originalRemove.call(this, key);
      };
      localStorage.setItem(authKey, JSON.stringify(authSession));
      Object.defineProperty(window, "__vpg46StorageWrites", {
        value: writes,
        configurable: false,
        writable: false
      });
    },
    { authKey: MOCK_AUTH_KEY, authSession: session }
  );
}

function createMockState(profile = null) {
  return {
    profile,
    authSignedIn: true,
    failWritesRemaining: 0,
    writeDelayMs: 0,
    authCalls: 0,
    selectCalls: 0,
    upsertCalls: 0,
    upsertPayloads: [],
    requests: [],
    unexpectedMockRequests: []
  };
}

function jsonHeaders(extra = {}) {
  return {
    "access-control-allow-origin": ORIGIN,
    "access-control-allow-credentials": "true",
    "content-type": "application/json",
    ...extra
  };
}

async function installMockSupabase(context, mock) {
  await context.route(`${ORIGIN}/api/bellows/recommendations/personal`, async (route) => {
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
  await context.route(`${MOCK_SUPABASE_ORIGIN}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    console.log(`[VPG46] MOCK ${request.method()} ${url.pathname}${url.search}`);
    mock.requests.push({ method: request.method(), path: url.pathname, search: url.search });

    if (request.method() === "OPTIONS") {
      const requestedHeaders =
        request.headers()["access-control-request-headers"] ||
        "authorization,apikey,content-profile,prefer,x-client-info";
      await route.fulfill({
        status: 204,
        headers: jsonHeaders({
          "access-control-allow-headers": requestedHeaders,
          "access-control-allow-methods": "GET,POST,OPTIONS"
        }),
        body: ""
      });
      return;
    }

    if (url.pathname === "/auth/v1/user" && request.method() === "GET") {
      mock.authCalls += 1;
      if (!mock.authSignedIn) {
        await route.fulfill({
          status: 401,
          headers: jsonHeaders(),
          body: JSON.stringify({ code: 401, msg: "Synthetic session ended." })
        });
        return;
      }
      await route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(syntheticUser())
      });
      return;
    }

    if (url.pathname === "/auth/v1/token" && request.method() === "POST") {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders(),
        body: JSON.stringify(syntheticSession())
      });
      return;
    }

    if (url.pathname === "/rest/v1/profiles" && request.method() === "GET") {
      mock.selectCalls += 1;
      await route.fulfill({
        status: 200,
        headers: jsonHeaders({ "content-range": mock.profile ? "0-0/1" : "*/0" }),
        body: JSON.stringify(mock.profile ? [mock.profile] : [])
      });
      return;
    }

    if (url.pathname === "/rest/v1/profiles" && request.method() === "POST") {
      mock.upsertCalls += 1;
      const payload = request.postDataJSON();
      mock.upsertPayloads.push(payload);
      console.log(`[VPG46] MOCK upsert=${mock.upsertCalls} failRemaining=${mock.failWritesRemaining}`);
      if (mock.writeDelayMs) {
        await new Promise((resolve) => setTimeout(resolve, mock.writeDelayMs));
      }
      if (mock.failWritesRemaining > 0) {
        mock.failWritesRemaining -= 1;
        await route.fulfill({
          status: 400,
          headers: jsonHeaders(),
          body: JSON.stringify({
            code: "VPG46_MOCK_WRITE_FAILURE",
            details: null,
            hint: null,
            message: "Synthetic profile write failed."
          })
        });
        return;
      }
      mock.profile = { ...payload };
      await route.fulfill({
        status: 201,
        headers: jsonHeaders({ preference_applied: "resolution=merge-duplicates" }),
        body: JSON.stringify([payload])
      });
      return;
    }

    mock.unexpectedMockRequests.push({ method: request.method(), url: request.url() });
    await route.abort("blockedbyclient");
  });

  await context.route("https://fonts.googleapis.com/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "text/css", body: "" });
  });
  await context.route("https://fonts.gstatic.com/**", async (route) => {
    await route.abort("blockedbyclient");
  });
}

function observe(page) {
  const observations = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    externalRequests: [],
    mutatingRequests: []
  };
  page.on("console", (message) => {
    if (message.type() === "error") observations.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => observations.pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const url = new URL(request.url());
    const fontAbort = url.hostname === "fonts.gstatic.com";
    const rscAbort =
      url.origin === ORIGIN &&
      url.searchParams.has("_rsc") &&
      (request.failure()?.errorText || "").includes("ERR_ABORTED");
    observations.failedRequests.push({
      method: request.method(),
      url: request.url(),
      error: request.failure()?.errorText || "unknown",
      expected: fontAbort || rscAbort
    });
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      ![ORIGIN, MOCK_SUPABASE_ORIGIN, "https://fonts.googleapis.com", "https://fonts.gstatic.com"].includes(
        url.origin
      )
    ) {
      observations.externalRequests.push({ method: request.method(), url: request.url() });
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      observations.mutatingRequests.push({ method: request.method(), url: request.url() });
    }
  });
  return observations;
}

async function createCase(browser, viewport, profile = null) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: Boolean(viewport.isMobile),
    hasTouch: Boolean(viewport.isMobile)
  });
  const mock = createMockState(profile);
  await installSyntheticSession(context);
  await installMockSupabase(context, mock);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.setDefaultNavigationTimeout(20000);
  const observations = observe(page);
  return { context, page, mock, observations };
}

async function waitForSignedIn(page) {
  await page.locator("form.profile-grid").waitFor({ state: "visible" });
  await page.locator(".profile-editor").waitFor({ state: "visible" });
}

async function openOptionalDetails(page) {
  const details = page.locator("details.recommendation-profile-optional");
  if ((await details.count()) && (await details.getAttribute("open")) === null) {
    await details.locator("summary").click();
  }
}

async function fillFirstSave(page, { shortRoute = false } = {}) {
  if (shortRoute) await openOptionalDetails(page);
  await page.locator('[name="display_name"]').fill("VPG46 Tester");
  await page.locator('[name="location_city"]').fill("San Juan");
  await page.locator('[name="location_state"]').selectOption("PR");
  await page.locator('[name="contact_email"]').fill(CONTACT_EMAIL);
  await page.locator('[name="lane"]').selectOption("Connector");
  await page.locator('[name="visibility_mode"]').selectOption("alias");
  const goal = page.locator('[name="primary_goal"]');
  await goal.fill("Find an operating partner");
  await goal.fill(CUSTOM_GOAL);
  await page.locator('[name="skills_sought"]').fill("books, permits");
  await page.locator('[name="blueprint_narrative"]').fill(
    "A repair shop needs a steady operating partner."
  );
}

async function storageSnapshot(page) {
  return page.evaluate((authKey) => ({
    localKeys: Object.keys(localStorage),
    sessionKeys: Object.keys(sessionStorage),
    authValuePresent: Boolean(localStorage.getItem(authKey)),
    writes: Array.isArray(window.__vpg46StorageWrites) ? window.__vpg46StorageWrites : []
  }), MOCK_AUTH_KEY);
}

function expectedSyntheticStorage(storage, allowAuthRemoved = false) {
  return (
    (storage.authValuePresent || allowAuthRemoved) &&
    storage.sessionKeys.length === 0 &&
    storage.localKeys.every(
      (key) => key === MOCK_AUTH_KEY || /^lswt-[0-9.]+$/.test(key)
    )
  );
}

function unexpectedFailures(observations) {
  return observations.failedRequests.filter((entry) => !entry.expected);
}

function expectedMutations(observations, count) {
  const mutations = observations.mutatingRequests.filter(
    (entry) => entry.method !== "OPTIONS"
  );
  return (
    mutations.length === count &&
    mutations.every(
      (entry) => entry.method === "POST" && entry.url.startsWith(`${MOCK_SUPABASE_ORIGIN}/rest/v1/profiles`)
    )
  );
}

async function fieldState(page) {
  return {
    accountEmail: await page.getByLabel("Account email").inputValue(),
    accountReadOnly: await page.getByLabel("Account email").getAttribute("readonly"),
    accountName: await page.getByLabel("Account email").getAttribute("name"),
    contactEmail: await page.locator('[name="contact_email"]').inputValue(),
    displayName: await page.locator('[name="display_name"]').inputValue(),
    city: await page.locator('[name="location_city"]').inputValue(),
    state: await page.locator('[name="location_state"]').inputValue(),
    stateLabel: await page
      .locator('[name="location_state"] option:checked')
      .textContent()
      .catch(() => null),
    lane: await page.locator('[name="lane"]').inputValue(),
    laneLabel: await page.locator('[name="lane"] option:checked').textContent(),
    visibility: await page.locator('[name="visibility_mode"]').inputValue(),
    visibilityLabel: await page.locator('[name="visibility_mode"] option:checked').textContent(),
    primaryGoal: await page.locator('[name="primary_goal"]').inputValue()
  };
}

async function formValidity(page) {
  return page.locator("form.profile-grid").evaluate((form) => ({
    valid: form.checkValidity(),
    invalid: [...form.querySelectorAll("input,select,textarea")]
      .filter((field) => !field.checkValidity())
      .map((field) => ({
        name: field.getAttribute("name"),
        type: field.getAttribute("type"),
        value: field.value,
        validationMessage: field.validationMessage
      })),
    activeName: document.activeElement?.getAttribute("name") || null
  }));
}

function assertCommonHealth(
  check,
  observations,
  mock,
  storage,
  expectedWriteCount,
  { allowAuthRemoved = false } = {}
) {
  check("mock received no unknown request", mock.unexpectedMockRequests.length === 0, mock.unexpectedMockRequests);
  check("no live external request escaped interception", observations.externalRequests.length === 0, observations.externalRequests);
  check("no page exception", observations.pageErrors.length === 0, observations.pageErrors);
  check(
    "no unexpected console error",
    observations.consoleErrors.filter(
      (message) =>
        message !== "Failed to load resource: net::ERR_BLOCKED_BY_CLIENT" &&
        !/^Failed to load resource: the server responded with a status of (400|401)\b/.test(message)
    ).length === 0,
    observations.consoleErrors
  );
  check("no unexpected failed request", unexpectedFailures(observations).length === 0, unexpectedFailures(observations));
  check("only expected mocked profile writes occurred", expectedMutations(observations, expectedWriteCount), observations.mutatingRequests);
  check(
    "browser storage contains only the synthetic auth fixture",
    expectedSyntheticStorage(storage, allowAuthRemoved),
    storage
  );
}

async function runHappyRoundTrips(browser) {
  const idea = {
    idea: 1,
    name: "Mocked signed-in first-save and reload truth",
    cases: []
  };
  result.ideas.push(idea);

  for (const viewport of viewports) {
    for (const shortRoute of [false, true]) {
      const routeName = shortRoute ? "recommendation-short" : "ordinary";
      const { check } = recorder(idea, `${viewport.name}-${routeName}-first-save-reload`);
      const { context, page, mock, observations } = await createCase(browser, viewport);
      try {
        const path = shortRoute
          ? "/dashboard/profile?next=%2Fbellows%2Frecommendations"
          : "/dashboard/profile";
        const response = await page.goto(`${ORIGIN}${path}`, { waitUntil: "domcontentloaded" });
        check("Profile Builder route returns 200", response?.status() === 200, response?.status());
        await waitForSignedIn(page);
        if (shortRoute) await openOptionalDetails(page);

        check("privacy notice precedes first collected field", await page.locator("form.profile-grid").evaluate((form) => {
          const notice = form.querySelector(".profile-field-help");
          const field = form.querySelector("input,select,textarea");
          return Boolean(notice && field && (notice.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING));
        }));
        check("state picker has 56 choices plus placeholder", (await page.locator('[name="location_state"] option').count()) === 57);
        check("lane picker has exactly five stable choices", (await page.locator('[name="lane"] option').count()) === 5);
        check("visibility picker has exactly three human choices", (await page.locator('[name="visibility_mode"] option').count()) === 3);
        check("Primary Goal exposes suggestions and custom input", (await page.locator("#primaryGoalSuggestions option").count()) >= 10);

        await fillFirstSave(page, { shortRoute });
        const before = await fieldState(page);
        check("account email is distinct and read-only", before.accountEmail === ACCOUNT_EMAIL && before.accountReadOnly !== null && before.accountName === null, before);
        check("preferred contact email is independently editable", before.contactEmail === CONTACT_EMAIL, before);
        check("territory choice is human-readable", before.state === "PR" && before.stateLabel?.trim() === "Puerto Rico (PR)", before);
        check("stable broad lane is human-readable", before.lane === "Connector" && before.laneLabel?.includes("Connector"), before);
        check("visibility is human-readable", before.visibility === "alias" && before.visibilityLabel?.trim() === "Display name or alias", before);
        check("Primary Goal accepts custom text", before.primaryGoal === CUSTOM_GOAL, before);
        const validity = await formValidity(page);
        check("completed first-save form is natively valid", validity.valid, validity);

        const button = shortRoute
          ? page.getByRole("button", { name: "Save and see my recommendation" })
          : page.getByRole("button", { name: "Save profile" });
        await button.click();
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (mock.upsertCalls === 0) {
          const diagnostic = {
            validity: await formValidity(page),
            status: await page.locator("form.profile-grid .status-line").last().textContent(),
            authCalls: mock.authCalls,
            requests: mock.requests,
            consoleErrors: observations.consoleErrors
          };
          throw new Error(`Submit produced no mock upsert: ${JSON.stringify(diagnostic)}`);
        }
        if (shortRoute) {
          await page.waitForURL(`${ORIGIN}/bellows/recommendations`);
          check("short route returns only to the allowlisted recommendation page", new URL(page.url()).pathname === "/bellows/recommendations");
        } else {
          await page.getByText("Profile saved. Your private recommendation is ready.", { exact: true }).waitFor();
          check("ordinary route reports one successful save", true);
        }

        check("first save performs exactly one upsert", mock.upsertCalls === 1, mock.upsertCalls);
        const saved = mock.upsertPayloads[0];
        check("save row is bound to synthetic auth user", saved?.id === USER_ID, saved?.id);
        check("save row uses only the established profile schema", JSON.stringify(Object.keys(saved || {}).sort()) === JSON.stringify(expectedProfileColumns), Object.keys(saved || {}).sort());
        check("preferred contact email does not overwrite account identity", saved?.email === CONTACT_EMAIL, saved?.email);
        check("requested values are canonical in the write", saved?.location_state === "PR" && saved?.lane === "Connector" && saved?.visibility_mode === "alias" && saved?.primary_goal === CUSTOM_GOAL, saved);
        check("phone stays null without explicit consent", saved?.phone === null, saved?.phone);

        await page.goto(`${ORIGIN}/dashboard/profile`, { waitUntil: "domcontentloaded" });
        await waitForSignedIn(page);
        const after = await fieldState(page);
        check("reload preserves account and preferred contact emails", after.accountEmail === ACCOUNT_EMAIL && after.contactEmail === CONTACT_EMAIL, after);
        check("reload preserves human-readable territory", after.state === "PR" && after.stateLabel?.trim() === "Puerto Rico (PR)", after);
        check("reload preserves broad lane label", after.lane === "Connector" && after.laneLabel?.includes("Connector"), after);
        check("reload preserves visibility label", after.visibility === "alias" && after.visibilityLabel?.trim() === "Display name or alias", after);
        check("reload preserves custom Primary Goal", after.primaryGoal === CUSTOM_GOAL, after);
        check("reload causes no additional upsert", mock.upsertCalls === 1, mock.upsertCalls);

        const storage = await storageSnapshot(page);
        assertCommonHealth(check, observations, mock, storage, 1);
      } catch (error) {
        check("first-save/reload case completes without harness exception", false, error instanceof Error ? error.stack : String(error));
      } finally {
        await context.close();
      }
    }
  }
}

async function waitUntil(predicate, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error("Timed out waiting for mock state");
}

async function runFailureRetryCase(browser, viewport, idea) {
  const { check } = recorder(idea, `${viewport.name}-validation-failure-retry-double-submit`);
  const { context, page, mock, observations } = await createCase(browser, viewport);
  try {
    await page.goto(`${ORIGIN}/dashboard/profile`, { waitUntil: "domcontentloaded" });
    await waitForSignedIn(page);

    await page.getByRole("button", { name: "Save profile" }).click();
    check("required-field validation causes zero write", mock.upsertCalls === 0, mock.upsertCalls);
    check("required-field validation focuses display name", await page.locator('[name="display_name"]').evaluate((field) => field === document.activeElement));

    await fillFirstSave(page);
    mock.failWritesRemaining = 1;
    await page.getByRole("button", { name: "Save profile" }).click();
    await page.getByText("Profile could not be saved. Try again.", { exact: true }).waitFor();
    check("first mocked failure performs one attempted upsert", mock.upsertCalls === 1, mock.upsertCalls);
    check("failure does not redirect", new URL(page.url()).pathname === "/dashboard/profile", page.url());
    const afterFailure = await fieldState(page);
    check("failure preserves every requested value", afterFailure.contactEmail === CONTACT_EMAIL && afterFailure.state === "PR" && afterFailure.lane === "Connector" && afterFailure.visibility === "alias" && afterFailure.primaryGoal === CUSTOM_GOAL, afterFailure);

    mock.writeDelayMs = 350;
    const save = page.getByRole("button", { name: "Save profile" });
    await save.focus();
    await page.keyboard.press("Enter");
    await waitUntil(() => mock.upsertCalls === 2);
    await page.keyboard.press("Enter");
    await page.getByText("Profile saved. Your private recommendation is ready.", { exact: true }).waitFor();
    await new Promise((resolve) => setTimeout(resolve, 450));
    check("rapid repeat activation creates only one retry upsert", mock.upsertCalls === 2, mock.upsertCalls);
    check("successful retry persists the same values", mock.profile?.email === CONTACT_EMAIL && mock.profile?.location_state === "PR" && mock.profile?.primary_goal === CUSTOM_GOAL, mock.profile);

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForSignedIn(page);
    const afterReload = await fieldState(page);
    check("retry result survives reload", afterReload.contactEmail === CONTACT_EMAIL && afterReload.state === "PR" && afterReload.primaryGoal === CUSTOM_GOAL, afterReload);

    const storage = await storageSnapshot(page);
    assertCommonHealth(check, observations, mock, storage, 2);
  } catch (error) {
    check("validation/failure/retry case completes without harness exception", false, error instanceof Error ? error.stack : String(error));
  } finally {
    await context.close();
  }
}

async function runAuthLossCase(browser, viewport, idea) {
  const initialProfile = {
    id: USER_ID,
    display_name: "VPG46 Tester",
    email: ACCOUNT_EMAIL,
    location_city: "Atlanta",
    location_state: "GA",
    lane: "Operator",
    work_preference: "Local Only",
    skills_offered: [],
    skills_sought: [],
    industry_tags: [],
    primary_goal: null,
    visibility_mode: "full_name",
    show_employer: false,
    profile_depth: "quick_weld"
  };
  const { check } = recorder(idea, `${viewport.name}-auth-loss-zero-write`);
  const { context, page, mock, observations } = await createCase(browser, viewport, initialProfile);
  try {
    await page.goto(`${ORIGIN}/dashboard/profile`, { waitUntil: "domcontentloaded" });
    await waitForSignedIn(page);
    mock.authSignedIn = false;
    await page.getByRole("button", { name: "Save profile" }).click();
    await page.getByRole("heading", { name: "Sign in before adding profile details." }).waitFor();
    check("auth loss performs zero profile upsert", mock.upsertCalls === 0, mock.upsertCalls);
    check("auth loss reports signed-out state", await page.getByText("Log in before saving.", { exact: true }).isVisible());
    check("auth loss does not redirect outside Profile Builder", new URL(page.url()).pathname === "/dashboard/profile");
    const storage = await storageSnapshot(page);
    assertCommonHealth(check, observations, mock, storage, 0, { allowAuthRemoved: true });
  } catch (error) {
    check("auth-loss case completes without harness exception", false, error instanceof Error ? error.stack : String(error));
  } finally {
    await context.close();
  }
}

async function runLegacyCase(browser, viewport, idea) {
  const legacyProfile = {
    id: USER_ID,
    display_name: "Legacy VPG46 Tester",
    email: ACCOUNT_EMAIL,
    location_city: "Atlanta",
    location_state: "Georgia",
    lane: "Legacy Operator",
    work_preference: "Local Only",
    skills_offered: [],
    skills_sought: [],
    industry_tags: [],
    primary_goal: "Keep a local shop healthy",
    visibility_mode: "computer_language",
    show_employer: false,
    profile_depth: "quick_weld"
  };
  const { check } = recorder(idea, `${viewport.name}-legacy-state-unknown-enum-custody`);
  const { context, page, mock, observations } = await createCase(browser, viewport, legacyProfile);
  try {
    await page.goto(`${ORIGIN}/dashboard/profile`, { waitUntil: "domcontentloaded" });
    await waitForSignedIn(page);
    const state = await fieldState(page);
    check("legacy full-name state hydrates to canonical code", state.state === "GA" && state.stateLabel?.trim() === "Georgia (GA)", state);
    check("unknown lane does not silently become a valid lane", !["Builder", "Operator", "Backer", "Connector", "Spark"].includes(state.lane), state);
    check("unknown visibility does not silently become a valid visibility", !["full_name", "first_name_only", "alias"].includes(state.visibility), state);
    const formText = await page.locator("form.profile-grid").innerText();
    check(
      "unknown saved values expose explicit review choices",
      state.lane === "" &&
        state.visibility === "" &&
        formText.includes("saved value needs review"),
      { lane: state.lane, visibility: state.visibility, formText }
    );

    await page.getByRole("button", { name: "Save profile" }).click();
    check("unreviewed unknown values cause zero write", mock.upsertCalls === 0, mock.upsertCalls);
    check("unknown enum review focuses a required picker", await page.evaluate(() => ["lane", "visibility_mode"].includes(document.activeElement?.getAttribute("name") || "")));

    await page.locator('[name="lane"]').selectOption("Operator");
    await page.locator('[name="visibility_mode"]').selectOption("first_name_only");
    await page.getByRole("button", { name: "Save profile" }).click();
    await page.getByText("Profile saved. Your private recommendation is ready.", { exact: true }).waitFor();
    check("explicit review performs one upsert", mock.upsertCalls === 1, mock.upsertCalls);
    check("reviewed write canonicalizes state and chosen enums", mock.profile?.location_state === "GA" && mock.profile?.lane === "Operator" && mock.profile?.visibility_mode === "first_name_only", mock.profile);

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForSignedIn(page);
    const afterReload = await fieldState(page);
    check("reviewed legacy values survive reload", afterReload.state === "GA" && afterReload.lane === "Operator" && afterReload.visibility === "first_name_only", afterReload);

    const storage = await storageSnapshot(page);
    assertCommonHealth(check, observations, mock, storage, 1);
  } catch (error) {
    check("legacy custody case completes without harness exception", false, error instanceof Error ? error.stack : String(error));
  } finally {
    await context.close();
  }
}

async function runFailureRetryAdversary(browser) {
  const idea = {
    idea: 2,
    name: "Failure, retry, duplicate-submit, auth-loss, and legacy-value custody",
    cases: []
  };
  result.ideas.push(idea);
  for (const viewport of viewports) {
    await runFailureRetryCase(browser, viewport, idea);
    await runAuthLossCase(browser, viewport, idea);
    await runLegacyCase(browser, viewport, idea);
  }
}

const browser = await chromium.launch({
  headless: true,
  executablePath: BROWSER_EXECUTABLE
});

try {
  await runHappyRoundTrips(browser);
  await runFailureRetryAdversary(browser);
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
  assertionCount: result.ideas.reduce((sum, idea) => sum + idea.assertionCount, 0),
  failureCount: result.ideas.reduce((sum, idea) => sum + idea.failureCount, 0),
  verdict: result.ideas.every((idea) => idea.failureCount === 0) ? "PASS" : "FAIL"
};

writeFileSync(RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result.summary, null, 2));
if (result.summary.failureCount > 0) process.exitCode = 1;
