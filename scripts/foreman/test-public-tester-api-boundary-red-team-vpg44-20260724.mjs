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

class HeaderBag {
  constructor(initial = {}) {
    this.values = new Map(
      Object.entries(initial).map(([key, value]) => [key.toLowerCase(), String(value)])
    );
  }

  get(key) {
    return this.values.get(String(key).toLowerCase());
  }

  set(key, value) {
    this.values.set(String(key).toLowerCase(), String(value));
  }
}

const NextResponse = {
  json(body, init = {}) {
    return {
      body,
      status: init.status ?? 200,
      headers: new HeaderBag(init.headers)
    };
  }
};

function hostileRequest({
  authorization,
  contentType = "application/json",
  method = "GET",
  url = "http://localhost/api/bellows/recommendations/personal?id=victim&user_id=victim"
} = {}) {
  let bodyReads = 0;
  const headers = new HeaderBag({
    ...(authorization === undefined ? {} : { authorization }),
    "content-type": contentType,
    "x-user-id": "victim",
    "x-forwarded-user": "victim"
  });

  return {
    method,
    url,
    headers,
    async json() {
      bodyReads += 1;
      throw new Error("HOSTILE_BODY_MUST_NOT_BE_READ");
    },
    async text() {
      bodyReads += 1;
      throw new Error("HOSTILE_BODY_MUST_NOT_BE_READ");
    },
    async formData() {
      bodyReads += 1;
      throw new Error("HOSTILE_BODY_MUST_NOT_BE_READ");
    },
    bodyReadCount() {
      return bodyReads;
    }
  };
}

const clientEvents = [];
function createClient(_url, _key, options = {}) {
  const forwarded = options.global?.headers?.Authorization ?? "";
  const forwardedToken = forwarded.replace(/^Bearer /, "");
  const event = {
    forwarded,
    authTokens: [],
    selects: [],
    ownerFilters: [],
    mutationCalls: 0
  };
  clientEvents.push(event);

  return {
    auth: {
      async getUser(token) {
        event.authTokens.push(token);
        return token === "valid-token"
          ? { data: { user: { id: "owner-user" } }, error: null }
          : { data: { user: null }, error: new Error("invalid") };
      }
    },
    from(table) {
      assert.equal(table, "profiles");
      return {
        select(columns) {
          event.selects.push(columns);
          return {
            eq(column, value) {
              event.ownerFilters.push([column, value]);
              return {
                async maybeSingle() {
                  return {
                    data: {
                      primary_goal: "Find a safe next step",
                      location_state: "VA"
                    },
                    error: null
                  };
                }
              };
            }
          };
        },
        insert() {
          event.mutationCalls += 1;
          throw new Error("MUTATION_SENTINEL");
        },
        update() {
          event.mutationCalls += 1;
          throw new Error("MUTATION_SENTINEL");
        },
        upsert() {
          event.mutationCalls += 1;
          throw new Error("MUTATION_SENTINEL");
        },
        delete() {
          event.mutationCalls += 1;
          throw new Error("MUTATION_SENTINEL");
        }
      };
    }
  };
}

const requestBoundary = loadTs(read("lib/supabase/request.ts"), (specifier) => {
  if (specifier === "next/server") return { NextResponse };
  if (specifier === "@supabase/supabase-js") return { createClient };
  if (specifier === "./env") return { requireEnv: (name) => `sentinel-${name}` };
  return {};
});

const personalSession = {
  version: "v1",
  statedNeed: "Find a safe next step",
  operatorContext: "Rules only",
  squibbIntro: "Review before acting",
  source: {
    mode: "authenticated_profile",
    label: "Private",
    detail: "Not saved"
  },
  ranked: [],
  catalog: []
};

let profileInput = null;
const personalRoute = loadTs(
  read("app/api/bellows/recommendations/personal/route.ts"),
  (specifier) => {
    if (specifier === "next/server") return { NextResponse };
    if (specifier === "@/lib/supabase/request") {
      return { requireUser: requestBoundary.requireUser };
    }
    if (specifier === "@/lib/matching/profile-recommendation") {
      return {
        recommendationSessionFromMemberProfile(profile) {
          profileInput = profile;
          return personalSession;
        }
      };
    }
    return {};
  }
);

function assertPrivate(response) {
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(response.headers.get("pragma"), "no-cache");
  assert.equal(response.headers.get("vary"), "Authorization");
}

const authCases = [];
for (const testCase of [
  { name: "missing", authorization: undefined, expected: 401 },
  { name: "basic", authorization: "Basic valid-token", expected: 401 },
  { name: "missing_token", authorization: "Bearer", expected: 401 },
  { name: "double_space", authorization: "Bearer  valid-token", expected: 401 },
  { name: "tab_separator", authorization: "Bearer\tvalid-token", expected: 401 },
  { name: "invalid_token", authorization: "Bearer invalid-token", expected: 401 },
  { name: "trailing_segment", authorization: "Bearer valid-token attacker-controlled", expected: 401 },
  { name: "case_insensitive_valid", authorization: "bearer valid-token", expected: 200 }
]) {
  const before = clientEvents.length;
  const request = hostileRequest({
    authorization: testCase.authorization,
    contentType: "text/plain",
    method: "GET"
  });
  const response = await personalRoute.GET(request);
  assertPrivate(response);
  assert.equal(request.bodyReadCount(), 0);
  authCases.push({
    name: testCase.name,
    expected: testCase.expected,
    actual: response.status,
    client_created: clientEvents.length > before
  });
}

const authBypasses = authCases.filter(({ expected, actual }) => expected !== actual);

const validRequest = hostileRequest({
  authorization: "Bearer valid-token",
  contentType: "application/x-www-form-urlencoded",
  method: "GET",
  url: "http://localhost/api/bellows/recommendations/personal?id=victim&user_id=victim"
});
const validResponse = await personalRoute.GET(validRequest);
assert.equal(validResponse.status, 200);
assertPrivate(validResponse);
assert.equal(validRequest.bodyReadCount(), 0);
assert.deepEqual(profileInput, {
  primary_goal: "Find a safe next step",
  location_state: "VA"
});
const validEvent = clientEvents.at(-1);
assert.deepEqual(validEvent.ownerFilters, [["id", "owner-user"]]);
assert.equal(validEvent.mutationCalls, 0);
assert.equal(validResponse.body.persisted, false);

let storageCalls = 0;
let pipelineCalls = 0;
const intakeRoute = loadTs(read("app/api/bellows/intake/route.ts"), (specifier) => {
  if (specifier === "next/server") return { NextResponse };
  if (specifier === "@/lib/squibb/concierge-intake-v0") {
    return {
      CONCIERGE_INTAKE_QUESTIONS: [{ id: "need" }],
      EMPTY_INTAKE_ANSWERS: { need: "" }
    };
  }
  if (specifier === "@/lib/squibb/concierge-intake-availability") {
    return {
      BELLOWS_INTAKE_SUBMISSION_OPEN: false,
      BELLOWS_INTAKE_CLOSED_MESSAGE: "Closed"
    };
  }
  if (specifier === "@/lib/squibb/concierge-intake-storage") {
    return {
      async storeSpeakerIntake() {
        storageCalls += 1;
        throw new Error("STORAGE_SENTINEL");
      }
    };
  }
  if (specifier === "@/lib/matching/shadow-pipeline") {
    return {
      async runShadowMatchingFromConcierge() {
        pipelineCalls += 1;
        throw new Error("PIPELINE_SENTINEL");
      },
      shadowRunSmokeSummary: () => {
        pipelineCalls += 1;
        throw new Error("PIPELINE_SENTINEL");
      }
    };
  }
  if (specifier === "@/lib/matching/feature-flags") {
    return {
      isMatchingPublicEnabled: () => {
        pipelineCalls += 1;
        throw new Error("FEATURE_SENTINEL");
      },
      matchingPublicModeLabel: () => {
        pipelineCalls += 1;
        throw new Error("FEATURE_SENTINEL");
      }
    };
  }
  return {};
});

const packetRoute = loadTs(
  read("app/api/bellows/recommendations/packet/route.ts"),
  (specifier) => (specifier === "next/server" ? { NextResponse } : {})
);

const closedBoundaryCases = [];
for (const contentType of [
  "application/json",
  "text/plain",
  "application/x-www-form-urlencoded",
  "multipart/form-data; boundary=hostile",
  "application/octet-stream"
]) {
  const intakeRequest = hostileRequest({
    authorization: "Bearer valid-token",
    contentType,
    method: "POST",
    url: "http://localhost/api/bellows/intake?owner=victim"
  });
  const intakeResponse = await intakeRoute.POST(intakeRequest);
  assert.equal(intakeResponse.status, 503);
  assert.equal(intakeResponse.body.state, "Closed");
  assert.equal(intakeRequest.bodyReadCount(), 0);
  assert.doesNotMatch(JSON.stringify(intakeResponse.body), /victim|script|hostile/i);

  const packetRequest = hostileRequest({
    authorization: "Bearer valid-token",
    contentType,
    method: "POST",
    url: "http://localhost/api/bellows/recommendations/packet?owner=victim"
  });
  const packetResponse = await packetRoute.POST(packetRequest);
  assert.equal(packetResponse.status, 403);
  assert.equal(packetResponse.body.state, "Blocked");
  assert.equal(packetRequest.bodyReadCount(), 0);
  assert.doesNotMatch(JSON.stringify(packetResponse.body), /victim|script|hostile/i);
  closedBoundaryCases.push(contentType);
}
assert.equal(storageCalls, 0);
assert.equal(pipelineCalls, 0);

const exportedMethods = (route) =>
  Object.entries(route)
    .filter(([name, value]) => typeof value === "function" && /^[A-Z]+$/.test(name))
    .map(([name]) => name)
    .sort();
assert.deepEqual(exportedMethods(personalRoute), ["GET"]);
assert.deepEqual(exportedMethods(intakeRoute), ["POST"]);
assert.deepEqual(exportedMethods(packetRoute), ["POST"]);

const result = {
  pass: authBypasses.length === 0,
  idea: "hostile_api_boundary_matrix",
  cases: {
    auth: authCases,
    content_type_closed_before_parse: closedBoundaryCases,
    declared_methods: {
      personal: exportedMethods(personalRoute),
      intake: exportedMethods(intakeRoute),
      packet: exportedMethods(packetRoute)
    }
  },
  invariants: {
    spoofed_owner_ignored: true,
    valid_owner_filter: validEvent.ownerFilters,
    request_body_reads: 0,
    storage_calls: storageCalls,
    pipeline_or_provider_calls: pipelineCalls,
    mutation_calls: clientEvents.reduce((sum, event) => sum + event.mutationCalls, 0),
    private_cache_headers: "private, no-store; Pragma no-cache; Vary Authorization"
  },
  proven_bypasses: authBypasses
};

console.log(JSON.stringify(result, null, 2));
if (!result.pass) process.exitCode = 2;
