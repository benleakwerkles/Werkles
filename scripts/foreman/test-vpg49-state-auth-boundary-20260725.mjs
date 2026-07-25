#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { evaluateVpg49StateBoundary } from "./vpg49-first-contact-boundary-guard-20260725.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixturePath =
  "scripts/foreman/fixtures/vpg49-ender-first-contact-contract-20260725.json";
const fixture = JSON.parse(
  readFileSync(path.join(root, fixturePath), "utf8")
);
const read = (relativePath) =>
  readFileSync(path.join(root, relativePath), "utf8");
const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");
const policy = fixture.statePolicy;

const delivery = read("components/squibb/personal-recommendation-delivery.tsx");
const surface = read("components/squibb/recommendation-surface.tsx");
const bellows = read("app/bellows/page.tsx");
const auth = read("lib/supabase/request.ts");
const personal = read("app/api/bellows/recommendations/personal/route.ts");
const packet = read("app/api/bellows/recommendations/packet/route.ts");
const intake = read("app/api/bellows/intake/route.ts");
const intakeGate = read("lib/squibb/concierge-intake-availability.ts");
const contract = read("lib/matching/personal-recommendation-contract.ts");

function wordCount(value) {
  return (
    value
      .replace(/<[^>]+>/g, " ")
      .replace(/\{[^}]*\}/g, " ")
      .match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) ?? []
  ).length;
}

function between(source, start, end) {
  const startIndex = source.indexOf(start);
  if (startIndex < 0) return "";
  const endIndex = source.indexOf(end, startIndex + start.length);
  return endIndex < 0
    ? source.slice(startIndex)
    : source.slice(startIndex, endIndex);
}

const transientSlices = {
  loading: between(
    delivery,
    'delivery.status === "loading" ? (',
    'delivery.status === "reauth_required"'
  ),
  reauth_required: between(
    delivery,
    'delivery.status === "reauth_required" ? (',
    'delivery.status === "profile_required"'
  ),
  profile_required: between(
    delivery,
    'delivery.status === "profile_required" ? (',
    'delivery.status === "error"'
  ),
  error: between(
    delivery,
    'delivery.status === "error" ? (',
    "</div>"
  )
};
const maximumTransientCopyWordsObserved = Math.max(
  ...Object.values(transientSlices).map(wordCount)
);
const signedOutSlice = delivery.slice(
  delivery.lastIndexOf('delivery.status === "signed_out" ? (')
);

const boundaryHashes = Object.fromEntries(
  Object.keys(policy.boundarySourceHashes).map((relativePath) => [
    relativePath,
    sha256(read(relativePath))
  ])
);
const boundarySourceDrift = Object.entries(
  policy.boundarySourceHashes
)
  .filter(
    ([relativePath, expected]) => boundaryHashes[relativePath] !== expected
  )
  .map(([relativePath]) => relativePath);

const evidence = {
  schema: "werkles.vpg49-state-auth-boundary-evidence/v1",
  states: [
    "loading",
    "signed_out",
    "reauth_required",
    "profile_required",
    "personal",
    "error"
  ].filter(
    (state) =>
      delivery.includes(`status: "${state}"`) &&
      delivery.includes(`delivery.status === "${state}"`)
  ),
  nextSteps: {
    loading:
      transientSlices.loading.includes("<Link") ||
      transientSlices.loading.includes("<button")
        ? "UNEXPECTED_ACTION"
        : "NONE",
    signed_out: signedOutSlice.includes(
      'href="/signup?next=%2Fbellows%2Frecommendations"'
    )
      ? "/signup?next=%2Fbellows%2Frecommendations"
      : "MISSING",
    reauth_required: transientSlices.reauth_required.includes(
      'href="/login?next=%2Fbellows%2Frecommendations"'
    )
      ? "/login?next=%2Fbellows%2Frecommendations"
      : "MISSING",
    profile_required: transientSlices.profile_required.includes(
      'href="/dashboard/profile?next=%2Fbellows%2Frecommendations"'
    )
      ? "/dashboard/profile?next=%2Fbellows%2Frecommendations"
      : "MISSING",
    personal: surface.includes(
      'href="/dashboard/profile?next=%2Fbellows%2Frecommendations"'
    )
      ? "/dashboard/profile?next=%2Fbellows%2Frecommendations"
      : "MISSING",
    error: transientSlices.error.includes(
      'className="squibb-rec-delivery-retry"'
    )
      ? "RETRY"
      : "MISSING"
  },
  maximumTransientCopyWordsObserved,
  signedOutDoorwayWords: wordCount(signedOutSlice),
  exampleFallbackPreserved:
    delivery.includes(
      'const session = delivery.status === "personal" ? delivery.session : exampleSession'
    ) &&
    delivery.includes("<SquibbRecommendationSurface") &&
    delivery.indexOf("<SquibbRecommendationSurface") <
      delivery.lastIndexOf('delivery.status === "signed_out" ? ('),
  closedIntakeTruthPreserved:
    bellows.includes("Intake submission is temporarily closed") &&
    bellows.includes("Review the intake (closed)") &&
    /BELLOWS_INTAKE_SUBMISSION_OPEN\s*=\s*false/.test(intakeGate),
  custodyTruthPreserved:
    delivery.includes("not saved or forwarded") &&
    surface.includes("This is a walkthrough, not your result.") &&
    surface.includes("Nothing is saved from this example.") &&
    surface.includes("This private result was not saved or sent.") &&
    surface.includes("Saving is closed in this beta. Nothing is sent."),
  privateSentinelLeakCount:
    (delivery.match(/PRIVATE_SENTINEL/gi) ?? []).length +
    (surface.match(/PRIVATE_SENTINEL/gi) ?? []).length,
  unsafeReturnCount: [
    ...delivery.matchAll(/href="([^"]+\?next=[^"]+)"/g)
  ].filter(
    (match) =>
      ![
        "/signup?next=%2Fbellows%2Frecommendations",
        "/login?next=%2Fbellows%2Frecommendations",
        "/dashboard/profile?next=%2Fbellows%2Frecommendations"
      ].includes(match[1])
  ).length,
  auth: {
    exactBearer: auth.includes('/^Bearer ([^\\s]+)$/i'),
    getUserValidation:
      auth.includes("supabase.auth.getUser(token)") &&
      auth.includes("if (error || !data.user)"),
    ownerSource: personal.includes('.eq("id", auth.user.id)')
      ? "auth.user.id"
      : "DRIFT",
    missingOrInvalidStatus:
      (auth.match(/\{ status: 401 \}/g) ?? []).length >= 2 ? 401 : 0
  },
  routes: {
    personalMethod:
      /export\s+async\s+function\s+GET\s*\(/.test(personal) &&
      !/export\s+async\s+function\s+(?:POST|PUT|PATCH|DELETE)\s*\(/.test(
        personal
      )
        ? "GET"
        : "DRIFT",
    personalWrongMethodStatus: 405,
    packetPostStatus:
      packet.includes("export async function POST()") &&
      packet.includes("{ status: 403 }")
        ? 403
        : 0,
    intakePostStatus:
      intake.includes("if (!BELLOWS_INTAKE_SUBMISSION_OPEN)") &&
      intake.includes("{ status: 503 }") &&
      intake.indexOf("if (!BELLOWS_INTAKE_SUBMISSION_OPEN)") <
        intake.indexOf(
          "const answers = normalizeAnswers(await request.json())"
        )
        ? 503
        : 0
  },
  response: {
    cacheControl: personal.includes(
      'response.headers.set("Cache-Control", "private, no-store")'
    )
      ? "private, no-store"
      : "DRIFT",
    pragma: personal.includes(
      'response.headers.set("Pragma", "no-cache")'
    )
      ? "no-cache"
      : "DRIFT",
    vary: personal.includes(
      'response.headers.set("Vary", "Authorization")'
    )
      ? "Authorization"
      : "DRIFT",
    persisted:
      (personal.match(/persisted:\s*false/g) ?? []).length === 2 &&
      contract.includes("value.persisted !== false")
        ? false
        : "DRIFT"
  },
  writeCount:
    (personal.match(/\.(?:insert|upsert|update|delete)\s*\(/g) ?? [])
      .length +
    (packet.match(/\.(?:insert|upsert|update|delete)\s*\(/g) ?? [])
      .length,
  directStorageCallCount: (
    delivery.match(/\b(?:localStorage|sessionStorage|Storage\.prototype)\b/g) ??
    []
  ).length,
  absoluteNetworkTargetCount: (
    delivery.match(/\bfetch\s*\(\s*["'`]https?:\/\//g) ?? []
  ).length,
  boundarySourceDrift
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

const canonical = fixture.canonicalStateEvidence;
const attacks = [
  ["missing-state", ["states"], ["loading", "signed_out"], "STATE_COVERAGE_MISMATCH"],
  ["loading-action", ["nextSteps", "loading"], "/signup", "STATE_NEXT_STEP_MISMATCH"],
  ["signed-out-route-drift", ["nextSteps", "signed_out"], "/login", "STATE_NEXT_STEP_MISMATCH"],
  ["error-no-retry", ["nextSteps", "error"], "NONE", "STATE_NEXT_STEP_MISMATCH"],
  ["dense-transient-copy", ["maximumTransientCopyWordsObserved"], 80, "TRANSIENT_COPY_TOO_DENSE"],
  ["dense-signed-out-copy", ["signedOutDoorwayWords"], 120, "SIGNED_OUT_COPY_TOO_DENSE"],
  ["example-removed-on-failure", ["exampleFallbackPreserved"], false, "EXAMPLE_FALLBACK_REQUIRED"],
  ["intake-sounds-open", ["closedIntakeTruthPreserved"], false, "CLOSED_INTAKE_TRUTH_REQUIRED"],
  ["custody-language-removed", ["custodyTruthPreserved"], false, "CUSTODY_TRUTH_REQUIRED"],
  ["private-sentinel-leak", ["privateSentinelLeakCount"], 1, "PRIVATE_SENTINEL_LEAK"],
  ["unsafe-auth-return", ["unsafeReturnCount"], 1, "UNSAFE_RETURN_TARGET"],
  ["bearer-validation-bypass", ["auth", "exactBearer"], false, "AUTH_BEARER_BOUNDARY_WEAKENED"],
  ["owner-from-caller", ["auth", "ownerSource"], "request.ownerId", "OWNER_BINDING_WEAKENED"],
  ["personal-auth-200", ["auth", "missingOrInvalidStatus"], 200, "PERSONAL_AUTH_STATUS_WEAKENED"],
  ["personal-post-open", ["routes", "personalMethod"], "POST", "PERSONAL_METHOD_BOUNDARY_WEAKENED"],
  ["packet-saving-open", ["routes", "packetPostStatus"], 200, "PACKET_GATE_WEAKENED"],
  ["intake-open", ["routes", "intakePostStatus"], 200, "INTAKE_GATE_WEAKENED"],
  ["public-cache", ["response", "cacheControl"], "public, max-age=300", "PRIVATE_CACHE_BOUNDARY_WEAKENED"],
  ["persisted-claim", ["response", "persisted"], true, "PERSISTENCE_BOUNDARY_WEAKENED"],
  ["storage-write", ["directStorageCallCount"], 1, "WRITE_OR_STORAGE_LEAK"],
  ["external-fetch", ["absoluteNetworkTargetCount"], 1, "NETWORK_TARGET_LEAK"],
  ["boundary-drift", ["boundarySourceDrift"], ["lib/supabase/request.ts"], "BOUNDARY_SOURCE_DRIFT"]
].map(([name, pathParts, value, expectedReason]) => ({
  name,
  input: mutate(canonical, pathParts, value),
  expectedReason
}));

const canonicalEvaluation = evaluateVpg49StateBoundary(canonical, policy);
const sourceEvaluation = evaluateVpg49StateBoundary(evidence, policy);
const attackResults = attacks.map((attack) => {
  const evaluation = evaluateVpg49StateBoundary(attack.input, policy);
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
  schema: "werkles.vpg49-ender-state-auth-boundary-result/v1",
  cycleId: fixture.cycleId,
  legacyLabel: fixture.legacyLabel,
  seat: fixture.seat,
  fixture: fixturePath,
  evidence,
  boundaryHashes,
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
