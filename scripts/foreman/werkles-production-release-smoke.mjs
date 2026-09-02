#!/usr/bin/env node

const argIndex = process.argv.indexOf("--base-url");
const baseUrl = (argIndex >= 0 ? process.argv[argIndex + 1] : "http://127.0.0.1:3000")?.replace(/\/$/, "");
if (!baseUrl) throw new Error("Missing --base-url value");
const internalModeIndex = process.argv.indexOf("--internal-mode");
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(baseUrl);
const internalMode = internalModeIndex >= 0 ? process.argv[internalModeIndex + 1] : isLocal ? "open" : "blocked";
if (!['open', 'blocked'].includes(internalMode)) throw new Error("--internal-mode must be open or blocked");

const memberRoutes = [
  "/",
  "/login",
  "/bellows/intake",
  "/bellows/recommendations",
  "/dashboard/blueprints",
  "/dashboard/intros",
  "/dashboard/crucible",
  "/dashboard/werkles/formation?candidate=ghost_095",
  "/bellows/personal",
  "/membership"
];

const internalRoutes = [
  "/tinkerden",
  "/tinkerden/inbox",
  "/thinkit",
  "/operator/gate-knockout/provider-queue",
  "/soledash",
  "/nerdkle",
  "/api/tinkerden/receipts",
  "/api/thinkit/elwood/status"
];

async function inspect(route, expectedStatus, internal = false) {
  const response = await fetch(`${baseUrl}${route}`, { redirect: "manual", signal: AbortSignal.timeout(20_000) });
  const body = await response.text();
  const result = {
    route,
    status: response.status,
    expectedStatus,
    pass: response.status === expectedStatus
  };

  if (!internal) {
    result.stylesheet = /rel=["']stylesheet["']/i.test(body);
    result.nextErrorOverlay = /nextjs-container-errors-header|missing required error components/i.test(body);
    result.pass &&= result.stylesheet && !result.nextErrorOverlay;
  } else {
    result.noStore = (response.headers.get("cache-control") || "").toLowerCase().includes("no-store");
    const robots = (response.headers.get("x-robots-tag") || "").toLowerCase();
    result.noIndex = robots.includes("noindex");
    result.pass &&= result.noStore && result.noIndex;
  }

  return result;
}

const results = [];
for (const route of memberRoutes) results.push(await inspect(route, 200, false));
for (const route of internalRoutes) {
  if (internalMode === "blocked") results.push(await inspect(route, 404, true));
  else {
    const result = await inspect(route, 200, false);
    // Local diagnostic APIs need not render HTML or carry a stylesheet.
    if (route.startsWith("/api/")) {
      result.pass = result.status === 200;
      delete result.stylesheet;
      delete result.nextErrorOverlay;
    }
    results.push(result);
  }
}

const failures = results.filter((result) => !result.pass);
console.log(
  JSON.stringify(
    {
      baseUrl,
      internalMode,
      status: failures.length ? "FAIL" : "PASS",
      memberRoutes: `${memberRoutes.length - failures.filter((item) => memberRoutes.includes(item.route)).length}/${memberRoutes.length}`,
      internalRoutes: `${internalRoutes.length - failures.filter((item) => internalRoutes.includes(item.route)).length}/${internalRoutes.length}`,
      failures,
      results
    },
    null,
    2
  )
);

if (failures.length) process.exitCode = 1;
