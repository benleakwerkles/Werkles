import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const bellows = read("app/bellows/page.tsx");
const discovery = read("app/discovery/page.tsx");
const discoveryForm = read("app/discovery/discovery-intake-form.tsx");
const membership = read("app/membership/page.tsx");
const pricingPage = read("app/pricing/page.tsx");
const pricing = read("lib/pricing.ts");
const copy = read("lib/copy.ts");
const checkoutRoute = read("app/api/membership/checkout/route.ts");
const bellowsCopy = copy.slice(copy.indexOf("bellows: {"), copy.indexOf("onboarding: {"));

const bellowsHeroActions = bellows.slice(
  bellows.indexOf('<section className="bellows-hero'),
  bellows.indexOf("</section>", bellows.indexOf('<section className="bellows-hero'))
);
assert.equal((bellowsHeroActions.match(/<Link\b/g) || []).length, 2);
assert.match(bellowsHeroActions, /Review the intake/);
assert.match(bellowsHeroActions, /See recommendations/);
assert.match(bellows, /<Image/);
assert.match(bellows, /href="\/proof"/);
assert.doesNotMatch(
  `${bellows}\n${bellowsCopy}`,
  /route shell|draft exploration|not canonical|manual cutout path|public\/assets|Speaker-readable|curriculum direction/i
);

assert.doesNotMatch(discovery, /discoveryStateValues|discovery-state-strip|Layer 0/);
assert.match(discovery, /Your starting point/);
assert.match(discovery, /Tell us where things stand\./);
assert.match(discovery, /See what a reviewer returns/);
assert.match(discovery, /Nothing you type\s+here is saved or sent\./);
assert.match(discoveryForm, /Nothing you type here is saved or sent\./);
assert.match(discoveryForm, /disabled=\{!DISCOVERY_INTAKE_SUBMISSION_OPEN/);

for (const publicCommerceSource of [membership, pricingPage]) {
  assert.doesNotMatch(
    publicCommerceSource,
    /\/operator|productGate|operator (?:setup|payment)|test-mode|live keys|APP_INFRA|Mock checkout|pricing\.source|company\/PRICING/i
  );
}
assert.doesNotMatch(membership, /RouteUnlockBanner|membership-preflight|Payments paused/);
assert.equal((membership.match(/role="status"/g) || []).length, 1);
assert.equal((pricingPage.match(/aria-label="Pricing note"/g) || []).length, 1);
assert.match(membership, /No live payment is taken; live payments remain behind a human gate/);
assert.match(pricingPage, /No live payment is taken; live payments remain behind a human gate/);

assert.match(membership, /pricing\.foundryDues\.monthly\.displayPrice/);
assert.match(membership, /pricing\.foundryDues\.annual\.displayPrice/);
assert.match(pricing, /displayPrice: "\$9\.99\/month"/);
assert.match(pricing, /displayPrice: "\$99\/year"/);
assert.match(copy, /price: "\$0"/);
assert.match(membership, /href="\/onboarding"/);
assert.match(membership, /copy\.membership\.disclaimer/);
assert.match(copy, /Foundry Dues do not guarantee verification, background clearance, funding, legal approval, partner quality, or business outcomes/);

const uiPausedGuard = membership.indexOf("if (paymentsPaused)");
const uiBlockedGuard = membership.indexOf("if (previewBlocked)");
const uiToken = membership.indexOf("getClientAccessToken()");
const uiFetch = membership.indexOf('fetch("/api/membership/checkout"');
assert.ok(uiPausedGuard >= 0 && uiPausedGuard < uiToken && uiPausedGuard < uiFetch);
assert.ok(uiBlockedGuard >= 0 && uiBlockedGuard < uiToken && uiBlockedGuard < uiFetch);

const apiBlock = checkoutRoute.indexOf("if (isAuthStripeTestBlocked())");
for (const sensitiveStep of ["requireUser(request)", "request.json()", "getSupabaseService()", "getStripe()"]) {
  const position = checkoutRoute.indexOf(sensitiveStep);
  assert.ok(apiBlock >= 0 && position > apiBlock, `${sensitiveStep} must remain after the API block`);
}

console.log(JSON.stringify({
  pass: true,
  checks: [
    "bellows_two_choice_human_language",
    "discovery_internal_state_removed_fail_closed",
    "public_commerce_plumbing_removed",
    "single_availability_message_per_page",
    "prices_free_path_and_non_guarantee_preserved",
    "ui_and_api_checkout_guards_precede_sensitive_work"
  ]
}, null, 2));
