import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  checkPlaidSandboxSafety,
  checkStripeIdentityTestSafety
} from "../../lib/crucible-provider-safety.ts";
import {
  PLAID_LINK_CLIENT_NAME,
  PLAID_LINK_CUSTOMIZATION_NAME
} from "../../lib/plaid/link-config.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

assert.equal(PLAID_LINK_CLIENT_NAME, "Werkles");
assert.ok(PLAID_LINK_CLIENT_NAME.length >= 1 && PLAID_LINK_CLIENT_NAME.length <= 30);
assert.equal(PLAID_LINK_CUSTOMIZATION_NAME, "default");

assert.deepEqual(
  checkPlaidSandboxSafety({ providerTestEnabled: true, plaidEnv: "sandbox" }),
  { ok: true }
);
assert.equal(
  checkPlaidSandboxSafety({ providerTestEnabled: true, plaidEnv: "production" }).ok,
  false
);
assert.equal(
  checkPlaidSandboxSafety({ providerTestEnabled: true, plaidEnv: "development" }).ok,
  false
);
assert.equal(
  checkPlaidSandboxSafety({ providerTestEnabled: true, plaidEnv: undefined }).ok,
  false
);
assert.equal(
  checkPlaidSandboxSafety({ providerTestEnabled: true, plaidEnv: "  " }).ok,
  false
);
assert.equal(
  checkPlaidSandboxSafety({ providerTestEnabled: false, plaidEnv: "sandbox" }).ok,
  false
);

assert.equal(
  checkStripeIdentityTestSafety({
    providerTestEnabled: true,
    secretKey: "sk_test_contract_only"
  }).ok,
  true
);
assert.equal(
  checkStripeIdentityTestSafety({
    providerTestEnabled: true,
    secretKey: "rk_test_contract_only"
  }).ok,
  true
);
assert.equal(
  checkStripeIdentityTestSafety({
    providerTestEnabled: true,
    secretKey: "sk_live_must_never_run_here"
  }).ok,
  false
);
assert.equal(
  checkStripeIdentityTestSafety({ providerTestEnabled: true, secretKey: undefined }).ok,
  false
);

const vercelConfig = JSON.parse(await readFile(path.join(repoRoot, "vercel.json"), "utf8"));
const csp = vercelConfig.headers[0].headers.find(
  (header) => header.key === "Content-Security-Policy"
)?.value;
assert.match(csp, /script-src[^;]*https:\/\/cdn\.plaid\.com/);
assert.match(csp, /frame-src[^;]*https:\/\/cdn\.plaid\.com/);
assert.match(csp, /connect-src[^;]*https:\/\/sandbox\.plaid\.com/);
assert.doesNotMatch(csp, /production\.plaid\.com/);

const nextConfig = await readFile(path.join(repoRoot, "next.config.ts"), "utf8");
assert.match(nextConfig, /script-src[^;]*https:\/\/cdn\.plaid\.com/);
assert.match(nextConfig, /frame-src[^;]*https:\/\/cdn\.plaid\.com/);
assert.match(nextConfig, /connect-src[^;]*https:\/\/sandbox\.plaid\.com/);
assert.doesNotMatch(nextConfig, /production\.plaid\.com/);

const fundsRoute = await readFile(
  path.join(repoRoot, "app/api/verification/funds/route.ts"),
  "utf8"
);
const exchangeRoute = await readFile(
  path.join(repoRoot, "app/api/verification/funds/exchange/route.ts"),
  "utf8"
);
const identityRoute = await readFile(
  path.join(repoRoot, "app/api/verification/identity/route.ts"),
  "utf8"
);
const providerSource = await readFile(
  path.join(repoRoot, "lib/crucible-providers.ts"),
  "utf8"
);
const cruciblePanel = await readFile(
  path.join(repoRoot, "components/crucible/crucible-panel.tsx"),
  "utf8"
);
const plaidLauncher = await readFile(
  path.join(repoRoot, "components/crucible/plaid-link-launcher.ts"),
  "utf8"
);

assert.doesNotMatch(fundsRoute, /sandbox_asset_report_/);
assert.doesNotMatch(fundsRoute, /funds_status/);
assert.match(fundsRoute, /plaid_link_configuration_invalid/);
assert.match(fundsRoute, /linkCustomizationName:\s*PLAID_LINK_CUSTOMIZATION_NAME/);
assert.doesNotMatch(exchangeRoute, /public_token/);
assert.doesNotMatch(exchangeRoute, /exchangePlaidPublicToken/);
assert.doesNotMatch(exchangeRoute, /getSupabaseService/);
assert.match(exchangeRoute, /providerFundsCustodyRequired/);
assert.doesNotMatch(providerSource, /item\/public_token\/exchange/);
assert.doesNotMatch(providerSource, /production\.plaid\.com/);
assert.doesNotMatch(providerSource, /development\.plaid\.com/);
assert.match(providerSource, /buildPlaidSandboxLinkTokenRequest/);
assert.match(providerSource, /typeof payload\.link_token !== "string"/);
assert.match(providerSource, /payload\.link_token\.trim\(\)\.length === 0/);
assert.match(providerSource, /linkCustomizationName:\s*input\.linkCustomizationName/);
assert.match(
  providerSource,
  /input\.linkCustomizationName\s*!==\s*PLAID_LINK_CUSTOMIZATION_NAME/
);
assert.doesNotMatch(cruciblePanel, /public_token/);
assert.doesNotMatch(cruciblePanel, /completePlaidExchange/);
assert.match(plaidLauncher, /onSuccess: \(\) => void/);
assert.match(plaidLauncher, /onSuccess: \(_publicToken, \.\.\._discardedSdkValues\) =>/);
assert.match(plaidLauncher, /complete\("completed-not-saved", onSuccess\)/);
assert.doesNotMatch(plaidLauncher, /onSuccess\(_publicToken\)|onLifecycle\?\.\(_/);
assert.doesNotMatch(plaidLauncher, /fetch\(|localStorage|sessionStorage/);
assert.doesNotMatch(identityRoute, /sandbox_identity_/);
assert.doesNotMatch(identityRoute, /sandbox_stub/);

console.log("Crucible provider safety contract: PASS");
