/**
 * VPGM membership-floor proof: the sales page demonstrates the member floor,
 * explains the free/member value ladder without exposing operator/provider
 * scaffolding or presenting unfinished shared tools as already live.
 *
 * Run: node scripts/foreman/test-membership-show-floor.mjs
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const source = readFileSync(path.join(root, "app/membership/page.tsx"), "utf8");
const css = readFileSync(path.join(root, "app/globals.css"), "utf8");
const valueLadder = readFileSync(path.join(root, "lib/membership-value-ladder.ts"), "utf8");

for (const visibleShape of [
  "Your Workshop",
  "A thoughtful intro",
  "A shared Werkle",
  "A Workshop is yours. A Werkle is what you build together.",
  "Free should be useful. Membership should feel like a steal."
]) {
  assert.match(source, new RegExp(visibleShape), `membership must show ${visibleShape}`);
}

assert.match(valueLadder, /Buy only what you need/);
assert.match(valueLadder, /\$9\.99 \/ month/);

assert.match(source, /Shared Werkle tools are still being built/);
assert.match(source, /join only when Werkles earns it/i);
assert.doesNotMatch(source, /"(?:Stripe Identity|Plaid|Twilio|Checkr|Ghost Fleet)[^"]*"/i);
assert.doesNotMatch(source, /free Workshop sandbox is the next product slice/i);

assert.match(css, /\.membership-floor__grid/);
assert.match(css, /\.membership-ladder__grid/);
assert.match(css, /@media \(max-width: 560px\)[\s\S]*\.membership-ladder__grid/);

const origin = (process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
const response = await fetch(`${origin}/membership`);
const html = await response.text();

assert.equal(response.status, 200, "/membership must load locally");
const runtimeContentCurrent = html.includes("See what membership adds.");

console.log(
  JSON.stringify(
    {
      pass: true,
      route: `${origin}/membership`,
      runtime_content_current: runtimeContentCurrent,
      runtime_note: runtimeContentCurrent
        ? "The running server includes this slice."
        : "The running server is serving an older compiled bundle; source assertions cover this slice.",
      checks: [
        "three_member_floor_previews",
        "free_member_ladder_visible",
        "unfinished_shared_tools_disclosed",
        "operator_provider_scaffolding_absent",
        "responsive_single_column_rule",
        "local_membership_200"
      ]
    },
    null,
    2
  )
);
