#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateVpg49Topology } from "./vpg49-first-contact-boundary-guard-20260725.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixturePath =
  "scripts/foreman/fixtures/vpg49-ender-first-contact-contract-20260725.json";
const fixture = JSON.parse(
  readFileSync(path.join(root, fixturePath), "utf8")
);
const read = (relativePath) =>
  readFileSync(path.join(root, relativePath), "utf8");
const sources = {
  home: read("app/page.tsx"),
  hero: read("components/foundry/hero-static.tsx"),
  header: read("components/foundry/site-header.tsx"),
  bellows: read("app/bellows/page.tsx"),
  recommendations: read("app/bellows/recommendations/page.tsx"),
  delivery: read("components/squibb/personal-recommendation-delivery.tsx"),
  surface: read("components/squibb/recommendation-surface.tsx"),
  footer: read("components/foundry/public-trust-footer.tsx")
};
const policy = fixture.topologyPolicy;

function count(source, pattern) {
  return (source.match(pattern) ?? []).length;
}

function between(source, start, end) {
  const startIndex = source.indexOf(start);
  if (startIndex < 0) return "";
  const endIndex = source.indexOf(end, startIndex + start.length);
  return endIndex < 0
    ? source.slice(startIndex)
    : source.slice(startIndex, endIndex);
}

function directRoutes(source) {
  return [...source.matchAll(/\bhref="([^"]+)"/g)].map((match) => match[1]);
}

function literalIds(source) {
  return [...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
}

function duplicateCount(values) {
  const seen = new Set();
  let duplicates = 0;
  for (const value of values) {
    if (seen.has(value)) duplicates += 1;
    seen.add(value);
  }
  return duplicates;
}

function headingReferenceErrors(source) {
  const ids = new Set(literalIds(source));
  return [...source.matchAll(/\baria-labelledby="([^"]+)"/g)]
    .flatMap((match) => match[1].split(/\s+/))
    .filter((id) => !ids.has(id)).length;
}

function directLinkNameErrors(source) {
  return [...source.matchAll(/<Link\b[^>]*>([\s\S]*?)<\/Link>/g)].filter(
    (match) => {
      const body = match[1]
        .replace(/<[^>]+>/g, " ")
        .replace(/[{}]/g, " ")
        .trim();
      return body.length === 0;
    }
  ).length;
}

function nestedInteractiveErrors(source) {
  const buttonBlocks = [
    ...source.matchAll(/<button\b[\s\S]*?<\/button>/g)
  ];
  const linkBlocks = [
    ...source.matchAll(/<(?:Link|a)\b[\s\S]*?<\/(?:Link|a)>/g)
  ];
  return (
    buttonBlocks.filter((match) => /<(?:Link|a)\b/.test(match[0])).length +
    linkBlocks.filter((match) => /<button\b/.test(match[0])).length
  );
}

const bellowsRoutes = directRoutes(sources.bellows);
const bellowsDestinationCounts = Object.fromEntries(
  Object.keys(policy.baseline.bellowsDestinationCounts).map((route) => [
    route,
    bellowsRoutes.filter((candidate) => candidate === route).length
  ])
);
const bellowsDuplicateExcess = Object.values(
  bellowsDestinationCounts
).reduce((sum, value) => sum + Math.max(0, value - 1), 0);
const homeAccountTrustRoutes = new Set([
  "/signup",
  "/pricing",
  "/proof",
  "/login",
  "/dashboard",
  "/onboarding"
]);
const homeMainAccountTrustLinkCount = directRoutes(sources.home).filter(
  (route) => homeAccountTrustRoutes.has(route)
).length;

const allDirectRoutes = Object.values(sources).flatMap(directRoutes);
const routePresence = new Set(allDirectRoutes);
if (
  sources.bellows.includes('const foundryAct = getNarrativeAct("/proof")') &&
  sources.bellows.includes("href={foundryAct.slug}")
) {
  routePresence.add("/proof");
}
routePresence.add("/");
routePresence.add("/privacy");
const missingRequiredRoutes = policy.requiredRoutes.filter(
  (route) => !routePresence.has(route)
);
const newRoutes = [...new Set(allDirectRoutes)].filter(
  (route) =>
    route.startsWith("/") &&
    !policy.allowedFirstContactRoutes.includes(route) &&
    route !== "/"
);

const decisionSurfaces = {
  "site-header": {
    primaryCount: count(sources.header, /className="header-cta"/g),
    primaryRoute: sources.header.includes(
      'className="header-cta" href="/bellows/recommendations"'
    )
      ? "/bellows/recommendations"
      : "DRIFT"
  },
  "home-hero": {
    primaryCount: count(
      sources.hero,
      /className="button button-light"/g
    ),
    primaryRoute: sources.hero.includes(
      'className="button button-light" href="/bellows/recommendations"'
    )
      ? "/bellows/recommendations"
      : "DRIFT"
  },
  "bellows-page": {
    primaryCount: count(
      sources.bellows,
      /className="button button-dark"/g
    ),
    primaryRoute: /className="button button-dark"\s+href="\/bellows\/recommendations"|className="button button-dark"[^>]*href="\/bellows\/recommendations"/.test(
      sources.bellows
    )
      ? "/bellows/recommendations"
      : "DRIFT"
  },
  "recommendation-signed-out": {
    primaryCount: count(
      sources.delivery.slice(
        sources.delivery.lastIndexOf(
          'delivery.status === "signed_out" ? ('
        )
      ),
      /className="button button-dark"/g
    ),
    primaryRoute: sources.delivery.includes(
      'className="button button-dark" href="/signup?next=%2Fbellows%2Frecommendations"'
    )
      ? "/signup?next=%2Fbellows%2Frecommendations"
      : "DRIFT"
  }
};

const unsafeReturns = allDirectRoutes.filter(
  (route) =>
    route.includes("next=") &&
    ![
      "/signup?next=%2Fbellows%2Frecommendations",
      "/login?next=%2Fbellows%2Frecommendations",
      "/dashboard/profile?next=%2Fbellows%2Frecommendations"
    ].includes(route)
);
const promotedSecondaryCount = [
  {
    route: "/dashboard/profile?next=%2Fbellows%2Frecommendations",
    source: sources.bellows
  },
  { route: "/bellows/intake", source: sources.bellows },
  { route: "/proof", source: sources.bellows }
].filter(
  ({ route, source }) =>
    new RegExp(
      `className="button (?:button-dark|button-light)"[^>]*href="${route.replace(
        /[?]/g,
        "\\?"
      )}"`
    ).test(source)
).length;

const sourceContractErrors = [];
if (!sources.bellows.includes("<h1>{copy.bellows.headline}</h1>")) {
  sourceContractErrors.push("bellows-h1");
}
if (
  !sources.recommendations.includes(
    '<nav className="squibb-rec-page__nav" aria-label="Bellows">'
  )
) {
  sourceContractErrors.push("recommendation-nav-name");
}
if (
  !sources.delivery.includes(
    'aria-labelledby="personalRecommendationCtaTitle"'
  ) ||
  !sources.delivery.includes('aria-live="polite"')
) {
  sourceContractErrors.push("signed-out-region-semantics");
}
if (
  !sources.surface.includes(
    'role="group" aria-label="Recommendation deck view"'
  ) ||
  !sources.surface.includes(
    'role="group"\n                aria-label="Available recommendation actions"'
  )
) {
  sourceContractErrors.push("recommendation-action-semantics");
}
if (
  !sources.footer.includes(
    '<nav className="site-footer__trust-links" aria-label="Public trust">'
  )
) {
  sourceContractErrors.push("trust-nav-name");
}

const bellowsHero = between(
  sources.bellows,
  '<section className="bellows-hero',
  "</section>"
);
const staleTopologyChecks = {
  vpg17EqualChoiceButtons:
    count(bellowsHero, /className="button button-/g) > 1,
  vpg23ClosedIntakeGhostButton:
    /className="button button-ghost"\s+href="\/bellows\/intake"/.test(
      sources.bellows
    ),
  vpg45ThreeSafeDoorsList:
    sources.home.includes(
      'className="trust-state-strip" role="list" aria-label="Werkles entry paths"'
    ),
  vpg45RequiredAccountGateList:
    sources.home.includes(
      'className="gate-list" role="list" aria-label="Required account gate"'
    )
};
const successorIntentChecks = {
  vpg17OnePrimaryTwoNamedOptionalPaths:
    count(bellowsHero, /className="button button-dark"/g) === 1 &&
    bellowsHero.includes(
      '<nav className="bellows-hero__secondary-links" aria-label="Optional Bellows paths">'
    ) &&
    bellowsHero.includes('href="/bellows/recommendations"') &&
    bellowsHero.includes(
      'href="/dashboard/profile?next=%2Fbellows%2Frecommendations"'
    ) &&
    bellowsHero.includes('href="/bellows/intake"'),
  vpg23ClosedIntakeRemainsNamedSecondary:
    bellowsHero.indexOf('href="/bellows/recommendations"') <
      bellowsHero.indexOf(
        'href="/dashboard/profile?next=%2Fbellows%2Frecommendations"'
      ) &&
    bellowsHero.indexOf(
      'href="/dashboard/profile?next=%2Fbellows%2Frecommendations"'
    ) < bellowsHero.indexOf('href="/bellows/intake"') &&
    bellowsHero.includes("Review the intake (closed)") &&
    bellowsHero.includes("Intake submission is temporarily closed"),
  vpg45HomeHandoffHasNamedSectionAndNav:
    sources.home.includes(
      '<section className="home-account-handoff" aria-labelledby="homeAccountHandoffTitle">'
    ) &&
    sources.home.includes('<h2 id="homeAccountHandoffTitle">') &&
    sources.home.includes(
      '<nav className="home-account-handoff__links" aria-label="Other ways to continue">'
    ),
  vpg45UnrelatedAccessibilityIntentStillCovered:
    sourceContractErrors.length === 0
};

const evidence = {
  schema: "werkles.vpg49-first-contact-topology-evidence/v1",
  bellowsDestinationCounts,
  bellowsDuplicateExcess,
  bellowsPrimaryCount: decisionSurfaces["bellows-page"].primaryCount,
  homeMainAccountTrustLinkCount,
  decisionSurfaces,
  missingRequiredRoutes,
  newRoutes,
  unsafeReturnCount: unsafeReturns.length,
  promotedSecondaryCount,
  closedIntakeTruthCount:
    count(sources.bellows, /Review the intake \(closed\)/g) +
    count(
      sources.bellows,
      /Intake submission is temporarily closed/g
    ),
  accessibleNameErrors:
    Object.values(sources).reduce(
      (sum, source) => sum + directLinkNameErrors(source),
      0
    ) + sourceContractErrors.length,
  headingReferenceErrors: Object.values(sources).reduce(
    (sum, source) => sum + headingReferenceErrors(source),
    0
  ),
  nestedInteractiveErrors: Object.values(sources).reduce(
    (sum, source) => sum + nestedInteractiveErrors(source),
    0
  ),
  duplicateIdErrors: Object.values(sources).reduce(
    (sum, source) => sum + duplicateCount(literalIds(source)),
    0
  ),
  legacySupersession: {
    supersededAssertions: policy.supersededLegacyTopologyAssertions,
    staleTopologyRestoredCount: Object.values(staleTopologyChecks).filter(
      Boolean
    ).length,
    successorIntentFailureCount: Object.values(
      successorIntentChecks
    ).filter((value) => !value).length,
    staleTopologyChecks,
    successorIntentChecks
  }
};

function clone(value) {
  return structuredClone(value);
}

function mutate(source, pathParts, value) {
  const next = clone(source);
  let cursor = next;
  for (const part of pathParts.slice(0, -1)) cursor = cursor[part];
  cursor[pathParts.at(-1)] = value;
  return next;
}

const canonical = fixture.canonicalTopologyEvidence;
const attacks = [
  ["duplicate-recommendation", ["bellowsDestinationCounts", "/bellows/recommendations"], 2, "BELLOWS_DESTINATION_NOT_UNIQUE"],
  ["duplicate-profile", ["bellowsDestinationCounts", "/dashboard/profile?next=%2Fbellows%2Frecommendations"], 2, "BELLOWS_DESTINATION_NOT_UNIQUE"],
  ["duplicate-intake", ["bellowsDestinationCounts", "/bellows/intake"], 2, "BELLOWS_DESTINATION_NOT_UNIQUE"],
  ["duplicate-primary", ["bellowsPrimaryCount"], 2, "BELLOWS_ONE_PRIMARY_REQUIRED"],
  ["home-links-not-reduced", ["homeMainAccountTrustLinkCount"], 9, "HOME_ENTRY_REDUCTION_REQUIRED"],
  ["header-primary-duplicated", ["decisionSurfaces", "site-header", "primaryCount"], 2, "ONE_PRIMARY_HIERARCHY_REQUIRED"],
  ["hero-primary-route-drift", ["decisionSurfaces", "home-hero", "primaryRoute"], "/signup", "PRIMARY_ROUTE_DRIFT"],
  ["bellows-primary-promotes-intake", ["decisionSurfaces", "bellows-page", "primaryRoute"], "/bellows/intake", "PRIMARY_ROUTE_DRIFT"],
  ["signed-out-promotes-login", ["decisionSurfaces", "recommendation-signed-out", "primaryRoute"], "/login", "PRIMARY_ROUTE_DRIFT"],
  ["required-proof-missing", ["missingRequiredRoutes"], ["/proof"], "REQUIRED_ROUTE_MISSING"],
  ["new-route", ["newRoutes"], ["/new-first-contact"], "NEW_FIRST_CONTACT_ROUTE_FORBIDDEN"],
  ["unsafe-return", ["unsafeReturnCount"], 1, "UNSAFE_RETURN_TARGET"],
  ["secondary-promoted", ["promotedSecondaryCount"], 1, "SECONDARY_ACTION_PROMOTED"],
  ["closed-intake-truth-removed", ["closedIntakeTruthCount"], 0, "CLOSED_INTAKE_TRUTH_REQUIRED"],
  ["missing-accessible-name", ["accessibleNameErrors"], 1, "ACCESSIBLE_NAME_REQUIRED"],
  ["broken-heading-reference", ["headingReferenceErrors"], 1, "HEADING_RELATIONSHIP_REQUIRED"],
  ["nested-control", ["nestedInteractiveErrors"], 1, "NESTED_INTERACTIVE_FORBIDDEN"],
  ["duplicate-id", ["duplicateIdErrors"], 1, "DUPLICATE_ID_FORBIDDEN"]
  ,
  ["legacy-map-missing", ["legacySupersession", "supersededAssertions"], [], "LEGACY_SUPERSESSION_MAP_REQUIRED"],
  ["stale-topology-restored", ["legacySupersession", "staleTopologyRestoredCount"], 1, "STALE_TOPOLOGY_RESTORED"],
  ["legacy-intent-lost", ["legacySupersession", "successorIntentFailureCount"], 1, "LEGACY_INTENT_NOT_PRESERVED"]
].map(([name, pathParts, value, expectedReason]) => ({
  name,
  input: mutate(canonical, pathParts, value),
  expectedReason
}));

const canonicalEvaluation = evaluateVpg49Topology(canonical, policy);
const sourceEvaluation = evaluateVpg49Topology(evidence, policy);
const attackResults = attacks.map((attack) => {
  const evaluation = evaluateVpg49Topology(attack.input, policy);
  return {
    name: attack.name,
    blocked: !evaluation.allowed,
    expectedReason: attack.expectedReason,
    reasonObserved: evaluation.reasons.some(
      (reason) => reason.code === attack.expectedReason
    ),
    reasons: evaluation.reasons.map((reason) => reason.code)
  };
});
const failures = [];
if (!canonicalEvaluation.allowed) {
  failures.push({ name: "canonical-policy", reasons: canonicalEvaluation.reasons });
}
if (!sourceEvaluation.allowed) {
  failures.push({ name: "integrated-source", reasons: sourceEvaluation.reasons, evidence });
}
for (const attack of attackResults) {
  if (!attack.blocked || !attack.reasonObserved) failures.push(attack);
}

const result = {
  schema: "werkles.vpg49-ender-first-contact-topology-result/v1",
  cycleId: fixture.cycleId,
  legacyLabel: fixture.legacyLabel,
  seat: fixture.seat,
  fixture: fixturePath,
  evidence,
  bellowsDuplicateReduction:
    policy.baseline.bellowsDuplicateExcess - evidence.bellowsDuplicateExcess,
  homeMainLinkReduction:
    policy.baseline.homeMainAccountTrustLinkCount -
    evidence.homeMainAccountTrustLinkCount,
  attackCount: attackResults.length,
  blockedAttackCount: attackResults.filter(
    (attack) => attack.blocked && attack.reasonObserved
  ).length,
  bypassCount: attackResults.filter(
    (attack) => !attack.blocked || !attack.reasonObserved
  ).length,
  attacks: attackResults,
  failureCount: failures.length,
  failures,
  pass: failures.length === 0
};

console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exitCode = 1;
