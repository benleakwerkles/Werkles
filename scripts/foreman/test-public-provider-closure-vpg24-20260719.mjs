import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const boundary = read("lib/app-infra-preview.ts");
const profile = read("app/dashboard/profile/page.tsx");
const routes = [
  {
    name: "identity",
    source: read("app/api/verification/identity/route.ts"),
    providerCall: "createStripeIdentityVerificationSession("
  },
  {
    name: "funds",
    source: read("app/api/verification/funds/route.ts"),
    providerCall: "createPlaidLinkToken("
  },
  {
    name: "funds exchange",
    source: read("app/api/verification/funds/exchange/route.ts"),
    providerCall: "exchangePlaidPublicToken("
  }
];

assert.match(boundary, /export const PUBLIC_TEST_PROVIDER_ACTIONS_OPEN = false;/);
assert.match(
  boundary,
  /export const PUBLIC_TEST_PROVIDER_ACTIONS_CLOSED_MESSAGE =\s*\n\s*"Verification provider actions are unavailable during public testing\.";/
);
assert.match(
  boundary,
  /PUBLIC_TEST_PROVIDER_ACTIONS_OPEN\s*&&\s*\n\s*CRUCIBLE_PROVIDER_TEST_ENABLED/,
  "provider banner/helper gate must remain closed with the public-test flag"
);
assert.match(
  boundary,
  /return isCruciblePreview\(\) \|\| !PUBLIC_TEST_PROVIDER_ACTIONS_OPEN;/,
  "Crucible actions must render disabled while public-test provider actions are closed"
);

const closedPrefixes = [];

for (const route of routes) {
  const postStart = route.source.indexOf("export async function POST");
  const bodyStart = route.source.indexOf("{", postStart);
  const legacyGate = route.source.indexOf("if (isCruciblePreview())", bodyStart);

  assert.ok(postStart > -1, `${route.name}: POST handler missing`);
  assert.ok(bodyStart > postStart, `${route.name}: POST body missing`);
  assert.ok(legacyGate > bodyStart, `${route.name}: existing Crucible gate missing`);

  const closedPrefix = route.source.slice(bodyStart + 1, legacyGate).trim();
  closedPrefixes.push(closedPrefix.replace(/\s+/g, " "));

  assert.match(closedPrefix, /if \(!PUBLIC_TEST_PROVIDER_ACTIONS_OPEN\)/);
  assert.match(closedPrefix, /error: PUBLIC_TEST_PROVIDER_ACTIONS_CLOSED_MESSAGE/);
  assert.match(closedPrefix, /state: "Closed"/);
  assert.match(closedPrefix, /\{ status: 503 \}/);
  assert.match(closedPrefix, /response\.headers\.set\("Cache-Control", "no-store"\)/);
  assert.match(closedPrefix, /return response;/);

  const handlerBody = route.source.slice(bodyStart + 1);
  const guardIndex = handlerBody.indexOf("if (!PUBLIC_TEST_PROVIDER_ACTIONS_OPEN)");
  const authIndex = handlerBody.indexOf("await requireUser(");
  const providerIndex = handlerBody.indexOf(route.providerCall);
  const serviceIndex = handlerBody.indexOf("getSupabaseService()");
  const bodyParseIndex = handlerBody.indexOf("request.json(");

  assert.equal(guardIndex, handlerBody.search(/\S/), `${route.name}: closure must be the first handler action`);
  assert.ok(authIndex > guardIndex, `${route.name}: auth must remain behind closure`);
  assert.ok(providerIndex > guardIndex, `${route.name}: provider call must remain behind closure`);
  assert.ok(serviceIndex > guardIndex, `${route.name}: service access must remain behind closure`);
  if (bodyParseIndex > -1) {
    assert.ok(bodyParseIndex > guardIndex, `${route.name}: body parsing must remain behind closure`);
  }
}

assert.equal(new Set(closedPrefixes).size, 1, "all provider routes must return the same closed response");
assert.match(profile, /PUBLIC_TEST_PROVIDER_ACTIONS_OPEN \? \(/);
assert.match(profile, /type="button" disabled>\s*ID Check — closed/);
assert.match(profile, /type="button" disabled>\s*Asset Check — closed/);
assert.match(profile, /No provider session will start and no verification status will change\./);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "public_test_provider_actions_default_closed",
        "generic_message_is_shared",
        "crucible_ui_and_provider_helpers_are_closed",
        "identity_closes_before_auth_provider_and_service",
        "funds_closes_before_auth_provider_and_service",
        "funds_exchange_closes_before_auth_body_provider_and_service",
        "all_routes_return_identical_503_no_store_contract",
        "profile_provider_controls_are_disabled_and_honest"
      ]
    },
    null,
    2
  )
);
