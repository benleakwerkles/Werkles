#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fixturePath =
  "scripts/foreman/fixtures/vpg48-ender-supported-seam-auth-data-contract-20260725.json";
const fixture = JSON.parse(
  readFileSync(path.join(root, fixturePath), "utf8")
);
const read = (relativePath) =>
  readFileSync(path.join(root, relativePath), "utf8");
const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");

const sources = Object.fromEntries(
  Object.keys(fixture.productSources).map((relativePath) => [
    relativePath,
    read(relativePath)
  ])
);
const hashesBefore = Object.fromEntries(
  Object.entries(sources).map(([relativePath, source]) => [
    relativePath,
    sha256(source)
  ])
);
const checks = [];
const failures = [];

function check(name, pass, detail = null) {
  const entry = { name, pass: Boolean(pass), detail };
  checks.push(entry);
  if (!entry.pass) failures.push(entry);
}

function exportedMethods(source) {
  return [...source.matchAll(/export\s+async\s+function\s+([A-Z]+)\s*\(/g)]
    .map((match) => match[1])
    .sort();
}

function parseBearer(authorization) {
  const match = /^Bearer ([^\s]+)$/i.exec(authorization ?? "");
  return match?.[1] ?? null;
}

function personalDecision(input) {
  if (input.method !== "GET") return { status: 405, writeCount: 0 };
  const token = parseBearer(input.authorization);
  if (!token || input.authAccepted !== true || !input.authenticatedUserId) {
    return { status: 401, writeCount: 0 };
  }
  return {
    status: 200,
    ownerId: input.authenticatedUserId,
    persisted: false,
    writeCount: 0,
    headers: {
      "cache-control": "private, no-store",
      pragma: "no-cache",
      vary: "Authorization"
    }
  };
}

function packetDecision(method) {
  return method === "POST"
    ? { status: 403, writeCount: 0 }
    : { status: 405, writeCount: 0 };
}

function intakeDecision(method) {
  return method === "POST"
    ? { status: 503, writeCount: 0 }
    : { status: 405, writeCount: 0 };
}

const authSource = sources["lib/supabase/request.ts"];
const clientSource = sources["lib/supabase/client.ts"];
const personalSource =
  sources["app/api/bellows/recommendations/personal/route.ts"];
const packetSource =
  sources["app/api/bellows/recommendations/packet/route.ts"];
const intakeSource = sources["app/api/bellows/intake/route.ts"];
const intakeGateSource =
  sources["lib/squibb/concierge-intake-availability.ts"];
const deliverySource =
  sources["components/squibb/personal-recommendation-delivery.tsx"];
const responseContractSource =
  sources["lib/matching/personal-recommendation-contract.ts"];

for (const [relativePath, expectedHash] of Object.entries(
  fixture.productSources
)) {
  check(
    `source_hash_bound:${relativePath}`,
    hashesBefore[relativePath] === expectedHash,
    { expected: expectedHash, actual: hashesBefore[relativePath] }
  );
}

check(
  "auth_requires_exact_single_bearer_token",
  authSource.includes('/^Bearer ([^\\s]+)$/i') &&
    authSource.includes("if (!token)") &&
    authSource.includes('{ status: 401 }')
);
check(
  "auth_validates_token_with_getUser",
  authSource.includes("supabase.auth.getUser(token)") &&
    authSource.includes("if (error || !data.user)") &&
    authSource.includes("persistSession: false")
);
check(
  "personal_route_exports_get_only",
  JSON.stringify(exportedMethods(personalSource)) === JSON.stringify(["GET"]),
  exportedMethods(personalSource)
);
check(
  "personal_owner_comes_only_from_validated_user",
  personalSource.includes('import { requireUser }') &&
    personalSource.includes("const auth = await requireUser(request)") &&
    personalSource.includes('.eq("id", auth.user.id)') &&
    !/\b(?:nextUrl|searchParams|request\.json|request\.formData)\b/.test(
      personalSource
    )
);
check(
  "personal_route_is_read_only",
  personalSource.includes('.from("profiles")') &&
    personalSource.includes(".select(PROFILE_MATCHING_COLUMNS)") &&
    !/\.(?:insert|upsert|update|delete)\s*\(/.test(personalSource)
);
check(
  "personal_response_is_private_no_store",
  personalSource.includes(
    'response.headers.set("Cache-Control", "private, no-store")'
  ) &&
    personalSource.includes('response.headers.set("Pragma", "no-cache")') &&
    personalSource.includes('response.headers.set("Vary", "Authorization")')
);
check(
  "personal_response_never_claims_persistence",
  (personalSource.match(/persisted:\s*false/g) ?? []).length === 2 &&
    responseContractSource.includes("value.persisted !== false")
);
check(
  "packet_saving_is_fixed_closed",
  JSON.stringify(exportedMethods(packetSource)) === JSON.stringify(["POST"]) &&
    packetSource.includes("export async function POST()") &&
    packetSource.includes("{ status: 403 }") &&
    !/\.(?:from|insert|upsert|update|delete)\s*\(/.test(packetSource)
);
check(
  "intake_submission_gate_is_false",
  /BELLOWS_INTAKE_SUBMISSION_OPEN\s*=\s*false/.test(intakeGateSource)
);
check(
  "intake_gate_precedes_parse_and_storage",
  intakeSource.indexOf("if (!BELLOWS_INTAKE_SUBMISSION_OPEN)") >= 0 &&
    intakeSource.indexOf("if (!BELLOWS_INTAKE_SUBMISSION_OPEN)") <
      intakeSource.indexOf(
        "const answers = normalizeAnswers(await request.json())"
      ) &&
    intakeSource.indexOf("if (!BELLOWS_INTAKE_SUBMISSION_OPEN)") <
      intakeSource.indexOf("const stored = await storeSpeakerIntake") &&
    intakeSource.includes("{ status: 503 }")
);
check(
  "delivery_uses_same_origin_read_only_fetch",
  deliverySource.includes(
    'fetch("/api/bellows/recommendations/personal", {'
  ) &&
    deliverySource.includes('method: "GET"') &&
    deliverySource.includes('cache: "no-store"') &&
    deliverySource.includes('credentials: "same-origin"') &&
    deliverySource.includes("Authorization: `Bearer ${token}`")
);
check(
  "delivery_has_auth_loss_and_retry_without_storage_calls",
  deliverySource.includes("if (response.status === 401)") &&
    deliverySource.includes("controller.abort()") &&
    deliverySource.includes("setAttempt((current) => current + 1)") &&
    !/\b(?:localStorage|sessionStorage|Storage\.prototype)\b/.test(
      deliverySource
    )
);
check(
  "delivery_has_no_absolute_network_target",
  !/\bfetch\s*\(\s*["'`]https?:\/\//.test(deliverySource)
);
check(
  "browser_client_uses_public_anon_config_only",
  clientSource.includes("NEXT_PUBLIC_SUPABASE_URL") &&
    clientSource.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY") &&
    !/(?:SERVICE_ROLE|service_role|SUPABASE_SECRET)/.test(clientSource)
);
check(
  "boundary_sources_contain_no_provider_or_service_secret",
  !Object.values(sources).some((source) =>
    /(?:OPENAI_API_KEY|MATCHING_LLM_API_KEY|SUPABASE_SERVICE_ROLE_KEY)/.test(
      source
    )
  )
);

const hostileInputs = [
  {
    name: "missing-bearer",
    input: {
      method: "GET",
      authorization: null,
      authAccepted: false,
      authenticatedUserId: null
    },
    expectedStatus: 401
  },
  {
    name: "empty-bearer",
    input: {
      method: "GET",
      authorization: "Bearer ",
      authAccepted: false,
      authenticatedUserId: null
    },
    expectedStatus: 401
  },
  {
    name: "bearer-with-extra-token",
    input: {
      method: "GET",
      authorization: "Bearer token extra",
      authAccepted: false,
      authenticatedUserId: null
    },
    expectedStatus: 401
  },
  {
    name: "basic-credential",
    input: {
      method: "GET",
      authorization: "Basic token",
      authAccepted: false,
      authenticatedUserId: null
    },
    expectedStatus: 401
  },
  {
    name: "auth-loss-after-shaped-token",
    input: {
      method: "GET",
      authorization: "Bearer expired-token",
      authAccepted: false,
      authenticatedUserId: null
    },
    expectedStatus: 401
  },
  {
    name: "query-owner-injection",
    input: {
      method: "GET",
      authorization: "Bearer synthetic-token",
      authAccepted: true,
      authenticatedUserId: "auth-owner",
      queryOwnerId: "victim-owner"
    },
    expectedStatus: 200,
    expectedOwner: "auth-owner"
  },
  {
    name: "body-owner-injection",
    input: {
      method: "GET",
      authorization: "Bearer synthetic-token",
      authAccepted: true,
      authenticatedUserId: "auth-owner",
      bodyOwnerId: "victim-owner"
    },
    expectedStatus: 200,
    expectedOwner: "auth-owner"
  },
  {
    name: "header-owner-injection",
    input: {
      method: "GET",
      authorization: "Bearer synthetic-token",
      authAccepted: true,
      authenticatedUserId: "auth-owner",
      headerOwnerId: "victim-owner"
    },
    expectedStatus: 200,
    expectedOwner: "auth-owner"
  },
  ...["POST", "PUT", "PATCH", "DELETE"].map((method) => ({
    name: `personal-wrong-method-${method.toLowerCase()}`,
    input: {
      method,
      authorization: "Bearer synthetic-token",
      authAccepted: true,
      authenticatedUserId: "auth-owner"
    },
    expectedStatus: 405
  }))
];

const hostileResults = hostileInputs.map((attack) => {
  const decision = personalDecision(attack.input);
  const pass =
    decision.status === attack.expectedStatus &&
    decision.writeCount === 0 &&
    (attack.expectedOwner === undefined ||
      decision.ownerId === attack.expectedOwner) &&
    (decision.status !== 200 ||
      (decision.persisted === false &&
        decision.headers?.["cache-control"] === "private, no-store" &&
        decision.headers?.pragma === "no-cache" &&
        decision.headers?.vary === "Authorization"));
  check(`hostile_personal:${attack.name}`, pass, decision);
  return { name: attack.name, pass, decision };
});

for (const method of ["POST", "GET", "PUT", "PATCH", "DELETE"]) {
  const packet = packetDecision(method);
  check(
    `packet_matrix:${method}`,
    packet.status === (method === "POST" ? 403 : 405) &&
      packet.writeCount === 0,
    packet
  );
  const intake = intakeDecision(method);
  check(
    `intake_matrix:${method}`,
    intake.status === (method === "POST" ? 503 : 405) &&
      intake.writeCount === 0,
    intake
  );
}

const retry = [
  personalDecision({
    method: "GET",
    authorization: "Bearer expired-token",
    authAccepted: false,
    authenticatedUserId: null
  }),
  personalDecision({
    method: "GET",
    authorization: "Bearer synthetic-token",
    authAccepted: true,
    authenticatedUserId: "auth-owner"
  })
];
check(
  "auth_loss_retry_is_two_reads_zero_writes",
  retry[0].status === 401 &&
    retry[1].status === 200 &&
    retry.every((attempt) => attempt.writeCount === 0) &&
    retry[1].ownerId === "auth-owner" &&
    retry[1].persisted === false,
  retry
);

const hashesAfter = Object.fromEntries(
  Object.keys(fixture.productSources).map((relativePath) => [
    relativePath,
    sha256(read(relativePath))
  ])
);
const changedPaths = Object.keys(hashesBefore).filter(
  (relativePath) => hashesBefore[relativePath] !== hashesAfter[relativePath]
);
check("relevant_product_hashes_unchanged_during_test", changedPaths.length === 0, {
  changedPaths
});

const result = {
  schema: "werkles.vpg48-ender-auth-data-boundary-freeze-result/v1",
  cycleId: fixture.cycleId,
  legacyLabel: fixture.legacyLabel,
  seat: fixture.seat,
  fixture: fixturePath,
  sourceCount: Object.keys(sources).length,
  hashesBefore,
  hashesAfter,
  changedPaths,
  hostileCaseCount: hostileResults.length,
  hostileBypassCount: hostileResults.filter((entry) => !entry.pass).length,
  checkCount: checks.length,
  failureCount: failures.length,
  failures,
  checks,
  pass: failures.length === 0
};

console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exitCode = 1;
