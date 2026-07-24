import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relativePath) => readFileSync(path.join(root, relativePath), "utf8");
const require = createRequire(import.meta.url);
const ts = require("typescript");

function loadTs(source, localRequire = () => ({})) {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    }
  }).outputText;
  const loaded = { exports: {} };
  new Function("require", "exports", "module", output)(localRequire, loaded.exports, loaded);
  return loaded.exports;
}

const safeReturnSource = read("lib/safe-member-return.ts");
const safeReturn = loadTs(safeReturnSource).safeMemberReturnPath;

for (const allowed of ["/dashboard", "/dashboard/profile", "/bellows/recommendations"]) {
  assert.equal(safeReturn(allowed), allowed);
}
for (const rejected of [
  "https://example.com",
  "//example.com/path",
  "\\example.com\\path",
  "/operator",
  "/operator/matching/shadow",
  "/api/bellows/recommendations/personal",
  "/dashboard?next=/operator",
  "/dashboard#operator",
  "/dashboard/../operator",
  ""
]) {
  assert.equal(safeReturn(rejected), "/dashboard");
}
assert.equal(safeReturn("/operator", "/bellows/recommendations"), "/bellows/recommendations");
assert.equal(safeReturn("/operator", "https://example.com"), "/dashboard");

const dashboard = read("app/dashboard/member-dashboard-client.tsx");
const login = read("app/login/page.tsx");
const previewLogin = read("app/api/auth-first/dev-preview-login/route.ts");
const profile = read("app/dashboard/profile/page.tsx");
const delivery = read("components/squibb/personal-recommendation-delivery.tsx");
const surface = read("components/squibb/recommendation-surface.tsx");
const personalRoute = read("app/api/bellows/recommendations/personal/route.ts");
const profileBuilder = read("lib/matching/profile-recommendation.ts");
const converterSource = read("lib/matching/shadow-to-recommendations.ts");

assert.doesNotMatch(dashboard, /Start intake|saved intake/i);
assert.equal(dashboard.match(/href="\/bellows\/intake"/g)?.length, 1);
assert.match(dashboard, /href="\/bellows\/intake">\s*Closed intake walkthrough/);
const nextMove = dashboard.slice(
  dashboard.indexOf('aria-label="Your next move"'),
  dashboard.indexOf('aria-label="Member work queue"')
);
assert.ok(nextMove.indexOf('href="/dashboard/profile"') > -1);
const workQueue = dashboard.slice(
  dashboard.indexOf('aria-label="Member work queue"'),
  dashboard.indexOf("<details")
);
assert.ok(workQueue.indexOf('href="/dashboard/profile"') < workQueue.indexOf('href="/bellows/recommendations"'));
assert.doesNotMatch(dashboard, /fetch\s*\(|\.(?:insert|update|upsert|delete)\s*\(/);

for (const caller of [login, previewLogin]) {
  assert.match(caller, /safeMemberReturnPath/);
  assert.doesNotMatch(caller, /next\.startsWith\("\/"\)|params\.get\("next"\) \|\|/);
}
assert.match(delivery, /\/login\?next=%2Fbellows%2Frecommendations/);
assert.match(delivery, /\/dashboard\/profile\?next=%2Fbellows%2Frecommendations/);
assert.match(profile, /safeMemberReturnPath\(params\.get\("next"\), "\/bellows\/recommendations"\)/);
assert.match(profile, /hasUsableMemberProfileSignal\(loadedProfile\)/);
assert.match(profile, /hasUsableMemberProfileSignal\(row\)/);
assert.match(profile, /recommendationReady \? \(/);
assert.match(profile, /See my private recommendation/);
assert.match(profile, /if \(isRecommendationJourney && isRecommendationReady\) \{\s*window\.location\.assign\(recommendationReturnPath\);/);
assert.doesNotMatch(profile, /router\.(?:push|replace)|window\.location\.(?:href|replace)/);

const recommendationTypes = loadTs(read("lib/squibb/recommendations.ts"));
const baseSession = recommendationTypes.loadSquibbRecommendationSession();
const personalSession = {
  ...baseSession,
  source: {
    mode: "authenticated_profile",
    label: "Private to this signed-in account",
    detail: "Result-only custody test."
  }
};
const contract = loadTs(read("lib/matching/personal-recommendation-contract.ts"));
const validResponse = {
  success: true,
  persisted: false,
  status: "personal",
  session: personalSession
};

assert.equal(contract.isPersonalRecommendationResponse(validResponse), true);
assert.equal(
  contract.isPersonalRecommendationResponse({ success: true, persisted: false, status: "profile_required" }),
  true
);

const invalidResponses = [
  {},
  { ...validResponse, success: false },
  { ...validResponse, persisted: true },
  { ...validResponse, status: "other" },
  { ...validResponse, session: { ...personalSession, version: "v2" } },
  {
    ...validResponse,
    session: { ...personalSession, source: { ...personalSession.source, mode: "latest_intake" } }
  },
  { ...validResponse, session: { ...personalSession, ranked: undefined } },
  { ...validResponse, session: { ...personalSession, catalog: undefined } },
  {
    ...validResponse,
    session: {
      ...personalSession,
      ranked: [{ ...personalSession.ranked[0], reasoning: { rationale: [] } }]
    }
  },
  { success: true, persisted: false, status: "profile_required", session: personalSession }
];
for (const invalid of invalidResponses) {
  assert.equal(contract.isPersonalRecommendationResponse(invalid), false);
}

assert.match(delivery, /const payload: unknown = await response\.json\(\)\.catch\(\(\) => null\)/);
assert.match(delivery, /classifyPersonalRecommendationResponse/);
assert.ok(
  delivery.indexOf("response.status === 401") <
    delivery.indexOf("await response.json()")
);
assert.match(delivery, /method: "GET"/);
assert.match(delivery, /cache: "no-store"/);
assert.match(delivery, /credentials: "same-origin"/);
assert.match(delivery, /signal: controller\.signal/);
assert.match(delivery, /setAttempt\(\(current\) => current \+ 1\)/);
assert.match(delivery, /\}, \[attempt\]\);/);
assert.doesNotMatch(delivery, /method: "POST"|body:/);
assert.match(delivery, /delivery\.status === "personal" \? delivery\.session : exampleSession/);
assert.match(delivery, /example stays here/);
assert.match(delivery, /Try again/);

const friendlyCategoryByColumn = {
  primary_goal: "goal",
  blueprint_narrative: "project details",
  skills_offered: "offered and sought skills",
  skills_sought: "offered and sought skills",
  industry_tags: "industry",
  lane: "lane",
  work_preference: "work preference",
  location_city: "location",
  location_state: "location",
  timeline_to_launch: "timeline"
};
for (const [column, friendly] of Object.entries(friendlyCategoryByColumn)) {
  assert.match(personalRoute, new RegExp(`"${column}"`));
  assert.equal(typeof friendly, "string");
}
assert.match(surface, /Built from your saved profile/);
assert.match(surface, /This result was[\s\S]*not saved or sent/);
assert.match(profileBuilder, /existing saved profile/);
assert.match(profileBuilder, /result itself was not saved or forwarded to a provider or external recipient/);

const fakeGates = [
  {
    id: "gate-review",
    label: "Human review",
    kind: "operator_approval",
    severity: "warning",
    reason: "A human decides.",
    benMustApprove: true
  }
];
const converter = loadTs(converterSource, (specifier) => {
  if (specifier === "@/lib/matching/public-recommendation-gates") {
    return {
      eligiblePublicMatchingPaths: (paths) => paths,
      publicMatchingHumanGates: () => fakeGates
    };
  }
  if (specifier === "@/lib/squibb/recommendations") {
    return {
      RECOMMENDATION_KIND_LABELS: {
        find_equipment: "Find equipment",
        find_partner: "Find partner"
      }
    };
  }
  return {};
});
const scoredPaths = [
  { kind: "find_equipment", rank: 1, score: 71, confidenceLabel: "high", rationale: ["Equipment first."] },
  { kind: "find_partner", rank: 2, score: 42, confidenceLabel: "low", rationale: ["Partner later."] }
];
const converted = converter.shadowRunToRecommendationSession({
  source: "member_profile",
  intakeId: "private-in-memory",
  createdAt: "1970-01-01T00:00:00.000Z",
  signals: { statedNeed: "Get a second van." },
  readout: {
    primaryBottleneck: "Equipment is the nearer need.",
    scoredPaths,
    facts: [],
    recommendationCard: {
      whatYouAskedFor: "Get a second van.",
      whatWeHeardUnderneath: "Equipment before expansion.",
      visibleReasons: ["A quote exists."]
    }
  }
});
assert.deepEqual(converted.ranked.map((item) => item.rank), [1, 2]);
assert.deepEqual(converted.ranked.map((item) => item.confidence.score), [71, 42]);
assert.deepEqual(converted.ranked.map((item) => item.humanGates), [fakeGates, fakeGates]);
assert.match(converted.ranked.map((item) => item.squibbNote).join(" "), /not ruled out by the current rules/i);
assert.doesNotMatch(converted.ranked.map((item) => item.squibbNote).join(" "), /eligible path/i);
assert.match(converted.ranked[0].confidence.why, /not a probability of success or eligibility/);

let routeSession = personalSession;
const route = loadTs(personalRoute, (specifier) => {
  if (specifier === "next/server") {
    return {
      NextResponse: {
        json(body, init = {}) {
          const values = new Map(Object.entries(init.headers ?? {}));
          return {
            body,
            status: init.status ?? 200,
            headers: {
              set: (key, value) => values.set(key, value),
              get: (key) => values.get(key)
            }
          };
        }
      }
    };
  }
  if (specifier === "@/lib/supabase/request") {
    return {
      requireUser: async () => ({
        user: { id: "user-a" },
        supabase: {
          from: () => ({
            select: () => ({
              eq: () => ({ maybeSingle: async () => ({ data: {}, error: null }) })
            })
          })
        }
      })
    };
  }
  if (specifier === "@/lib/matching/profile-recommendation") {
    return { recommendationSessionFromMemberProfile: () => routeSession };
  }
  return {};
});

let routeResponse = await route.GET({});
assert.equal(routeResponse.status, 200);
assert.deepEqual(routeResponse.body, validResponse);
assert.equal(routeResponse.headers.get("Cache-Control"), "private, no-store");
assert.equal(routeResponse.headers.get("Pragma"), "no-cache");
assert.equal(routeResponse.headers.get("Vary"), "Authorization");
routeSession = null;
routeResponse = await route.GET({});
assert.deepEqual(routeResponse.body, {
  success: true,
  persisted: false,
  status: "profile_required"
});

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "exact_member_return_allowlist",
        "client_and_server_login_share_return_policy",
        "dashboard_profile_first_path_and_closed_intake_truth",
        "profile_completion_link_uses_matching_readiness",
        "personal_response_contract_fails_closed",
        "personal_retry_is_get_only_and_abort_safe",
        "saved_profile_and_ephemeral_result_are_distinct",
        "friendly_input_categories_match_fixed_profile_columns",
        "delivered_language_does_not_claim_eligibility",
        "ranks_scores_and_human_gates_are_unchanged",
        "personal_route_returns_private_explicit_envelope"
      ]
    },
    null,
    2
  )
);
