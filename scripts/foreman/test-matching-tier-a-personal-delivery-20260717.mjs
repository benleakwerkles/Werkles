import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");

const requestAuth = read("lib/supabase/request.ts");
const personalRoute = read("app/api/bellows/recommendations/personal/route.ts");
const personalBuilder = read("lib/matching/profile-recommendation.ts");
const signals = read("lib/matching/signals.ts");
const delivery = read("components/squibb/personal-recommendation-delivery.tsx");
const surface = read("components/squibb/recommendation-surface.tsx");
const publicLoader = read("lib/squibb/public-recommendation-session-server.ts");
const packetRoute = read("app/api/bellows/recommendations/packet/route.ts");

// Authentication is server-validated; missing and invalid bearer tokens fail closed.
assert.match(requestAuth, /if \(!token\)[\s\S]*status: 401/);
assert.match(requestAuth, /supabase\.auth\.getUser\(token\)/);
assert.match(requestAuth, /if \(error \|\| !data\.user\)[\s\S]*status: 401/);

// Ownership is derived only from the validated user and the user-scoped client.
const authIndex = personalRoute.indexOf("await requireUser(request)");
const profileIndex = personalRoute.indexOf('.from("profiles")');
assert.ok(authIndex > -1 && profileIndex > authIndex, "auth must precede the profile query");
assert.match(personalRoute, /\.eq\("id", auth\.user\.id\)/);
assert.doesNotMatch(personalRoute, /request\.(?:json|text|formData|body|nextUrl)/);
assert.doesNotMatch(personalRoute, /\b(?:ownerId|userId|profileId|intakeId|email)\b/);
assert.doesNotMatch(personalRoute, /service[_-]?role|SUPABASE_SERVICE/i);
assert.doesNotMatch(personalRoute, /\.from\("(?:discovery_intakes|matching_shadow_runs|recommendation_packets)"\)/);
assert.doesNotMatch(personalRoute, /\.(?:insert|update|upsert|delete)\(/);

// The response is private and contains either a safe empty state or the sanitized session.
assert.match(personalRoute, /Cache-Control", "private, no-store"/);
assert.match(personalRoute, /Vary", "Authorization"/);
assert.match(personalRoute, /status: "profile_required"/);
assert.match(personalRoute, /status: "personal", session/);
assert.doesNotMatch(personalRoute, /status: "personal", (?:data|profile)/);

// Allowed self-reported fields feed the existing deterministic path in memory.
for (const field of [
  "primary_goal",
  "blueprint_narrative",
  "skills_offered",
  "skills_sought",
  "industry_tags",
  "lane",
  "work_preference",
  "location_city",
  "location_state",
  "timeline_to_launch"
]) {
  assert.match(personalRoute, new RegExp(`"${field}"`));
  assert.match(signals, new RegExp(`${field}\\?: unknown`));
}
assert.doesNotMatch(signals, /(?:email|first_name|last_name|display_name)\?: unknown/);
for (const step of ["runLayer0", "evaluateNotMatch", "scorePaths", "buildMatchingReadout", "shadowRunToRecommendationSession"]) {
  assert.match(personalBuilder, new RegExp(`${step}\\(`));
}
assert.match(personalBuilder, /memberCausalDraft: null/);
assert.match(personalBuilder, /llmUsed: false/);
assert.match(personalBuilder, /receiptPath: ""/);
assert.match(personalBuilder, /mode: "authenticated_profile"/);
assert.match(personalBuilder, /Private to this signed-in account/);
assert.match(personalBuilder, /Nothing is saved or sent/);
assert.doesNotMatch(personalBuilder, /persistShadowRun|writeFile|fetch\s*\(/);

// Browser delivery keeps the anonymous example until an authenticated personal response succeeds.
assert.match(delivery, /getSupabaseBrowser\(\)\.auth\.getSession\(\)/);
assert.match(delivery, /Authorization: `Bearer \$\{token\}`/);
assert.match(delivery, /cache: "no-store"/);
assert.match(delivery, /delivery\.status === "personal" \? delivery\.session : exampleSession/);
assert.match(delivery, /You are viewing an example/);
assert.match(delivery, /Open Profile Builder/);
assert.match(delivery, /page below is still an example/);
assert.doesNotMatch(delivery, /console\.|localStorage|sessionStorage/);

// Anonymous custody, empty activity, heading order, and saving remain unchanged and closed.
assert.match(publicLoader, /mode: "demo"/);
assert.match(publicLoader, /intakes: \[\][\s\S]*optionPackets: \[\]/);
assert.equal(surface.match(/<h1>/g)?.length, 1);
assert.match(surface, /const isPersonal = source\.mode === "authenticated_profile"/);
assert.match(surface, /showActivityLedger = hasRecordedActivity \|\| \(!isExample && !isPersonal\)/);
assert.match(surface, /const SAVE_CLOSED_BETA = true/);
assert.equal(surface.match(/disabled=\{SAVE_CLOSED_BETA\}/g)?.length, 3);
assert.match(packetRoute, /export async function POST\(\)[\s\S]*status: 403/);
assert.doesNotMatch(packetRoute, /request\.(?:json|text|formData|body)/);

console.log("PASS matching Tier A personal delivery owner-binding contract");
