import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const memberWalkthroughSources = [
  "app/dashboard/member-dashboard-client.tsx",
  "app/dashboard/profile/page.tsx",
  "app/dashboard/blueprints/page.tsx",
  "app/dashboard/blueprints/[id]/page.tsx",
  "app/dashboard/intros/page.tsx",
  "app/dashboard/crucible/page.tsx",
  "app/dashboard/billing/page.tsx",
  "app/onboarding/page.tsx",
  "app/bellows/page.tsx",
  "app/bellows/intake/page.tsx",
  "app/bellows/recommendations/page.tsx",
  "app/bellows/recommendations/test-case-0/page.tsx",
  "components/squibb/concierge-intake-form.tsx"
];
const memberRouteProducerSources = [
  "lib/recommendation-view/model.ts",
  "lib/owner-surfaces/owner-state.ts"
];

function routePagePath(href) {
  const pathname = href.split(/[?#]/, 1)[0] || "/";
  return pathname === "/" ? "app/page.tsx" : `app${pathname}/page.tsx`;
}

const literalLinks = [];
for (const sourcePath of memberWalkthroughSources) {
  const source = await readFile(path.join(repoRoot, sourcePath), "utf8");
  for (const match of source.matchAll(/href\s*=\s*["'](?<href>\/[^"']*)["']/g)) {
    literalLinks.push({ sourcePath, href: match.groups.href });
  }
}

assert.ok(literalLinks.length > 0, "member walkthrough inventory must not be empty");
for (const link of literalLinks) {
  assert.notEqual(link.href, "#", `${link.sourcePath} contains a literal dead link`);
  if (link.href.startsWith("/#")) continue;
  const target = routePagePath(link.href);
  await assert.doesNotReject(
    access(path.join(repoRoot, target)),
    `${link.sourcePath} points to missing route ${link.href} (${target})`
  );
}

const producerLinks = [];
for (const sourcePath of memberRouteProducerSources) {
  const source = await readFile(path.join(repoRoot, sourcePath), "utf8");
  for (const match of source.matchAll(/href\s*:\s*["'](?<href>\/[^"']*)["']/g)) {
    producerLinks.push({ sourcePath, href: match.groups.href });
  }
}
for (const link of producerLinks) {
  const target = routePagePath(link.href);
  await assert.doesNotReject(
    access(path.join(repoRoot, target)),
    `${link.sourcePath} produces missing route ${link.href} (${target})`
  );
}

const uniqueDestinations = [...new Set(literalLinks.map(({ href }) => href))].sort();
const expectedCoreDestinations = [
  "/bellows",
  "/bellows/intake",
  "/bellows/recommendations",
  "/bellows/recommendations/test-case-0",
  "/dashboard",
  "/dashboard/blueprints",
  "/dashboard/crucible",
  "/dashboard/intros",
  "/dashboard/profile",
  "/proof"
];
for (const destination of expectedCoreDestinations) {
  assert.ok(uniqueDestinations.includes(destination), `core walkthrough destination missing: ${destination}`);
}

const pageZeroPath = "app/bellows/recommendations/test-case-0/page.tsx";
const pageZeroSource = await readFile(path.join(repoRoot, pageZeroPath), "utf8");
const walkthroughSource = await readFile(
  path.join(repoRoot, "components/squibb/concierge-walkthrough.tsx"),
  "utf8"
);
const flowSource = await readFile(
  path.join(repoRoot, "lib/squibb/concierge-walkthrough-test-case-0.ts"),
  "utf8"
);

assert.match(pageZeroSource, /loadConciergeUser0Flow\(\)/);
assert.match(pageZeroSource, /loadSpeakerHumanReadTestCase0\(\)/);
assert.match(pageZeroSource, /<ConciergeWalkthrough walkthrough=\{walkthrough\} speakerRead=\{speakerRead\}/);
assert.match(pageZeroSource, /href="\/bellows"/);
assert.match(pageZeroSource, /href="\/bellows\/intake"/);
assert.match(pageZeroSource, /import "\.\/concierge-walkthrough\.css"/);
assert.equal((walkthroughSource.match(/<FlowCard\s/g) ?? []).length, 5);
for (const label of ["Your symptom", "Squibb's read", "Why", "Prove wrong", "Your test"]) {
  assert.match(walkthroughSource, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}
assert.match(walkthroughSource, /No matching\. No candidate list\./);
assert.match(flowSource, /version:\s*"user-0"/);
assert.match(flowSource, /testCaseId:\s*"0"/);
assert.equal((flowSource.match(/question:\s*"/g) ?? []).length, 3);

const semanticFindings = [];
const introsSource = await readFile(path.join(repoRoot, "app/dashboard/intros/page.tsx"), "utf8");
if (/href=\{action\.href\s*\?\?\s*"#"\}/.test(introsSource)) {
  semanticFindings.push("enabled_action_hash_fallback");
}
if (
  /title:\s*"Concierge User #0/.test(pageZeroSource) ||
  /User #\{walkthrough\.testCaseId\}/.test(walkthroughSource)
) {
  semanticFindings.push("page_zero_internal_identity_public");
}
assert.match(pageZeroSource, /title:\s*"Worked Recommendation Example \| Bellows"/);
assert.match(walkthroughSource, /Squibb · worked example · 60-second read/);
for (const route of ["blueprints", "blueprints/[id]", "intros"]) {
  const source = await readFile(path.join(repoRoot, `app/dashboard/${route}/page.tsx`), "utf8");
  if (!/DashboardAuthGuard|auth\.getUser|requireUser|redirect\(|notFound\(/.test(source)) {
    semanticFindings.push(`auth_guard_absent:${route}`);
  }
}

console.log(
  `Member walkthrough route inventory: PASS (${literalLinks.length} UI links, ${producerLinks.length} model links, ${uniqueDestinations.length} destinations, ${semanticFindings.length} review findings)`
);
console.log(`Review findings: ${semanticFindings.join(", ") || "none"}`);
