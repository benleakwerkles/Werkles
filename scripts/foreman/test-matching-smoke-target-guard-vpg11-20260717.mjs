/**
 * Focused proof that the mutating Matching smoke harness cannot infer or silently select Production.
 * Run: node scripts/foreman/test-matching-smoke-target-guard-vpg11-20260717.mjs
 */
import assert from "node:assert/strict";

import { resolveSiteOrigin } from "./test-matching-shadow-smoke.Inner.mjs";

let fetchCount = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  fetchCount += 1;
  throw new Error("fetch must not run during origin resolution");
};

try {
  assert.throws(() => resolveSiteOrigin({}), /WERKLES_SITE_ORIGIN is required/);
  assert.equal(resolveSiteOrigin({ WERKLES_SITE_ORIGIN: "http://localhost:3000/" }), "http://localhost:3000");
  assert.throws(
    () => resolveSiteOrigin({ WERKLES_SITE_ORIGIN: "https://werkles.com" }),
    /Production mutation refused/
  );
  assert.throws(
    () => resolveSiteOrigin({ WERKLES_SITE_ORIGIN: "https://www.werkles.com" }),
    /Production mutation refused/
  );
  assert.equal(
    resolveSiteOrigin({
      WERKLES_SITE_ORIGIN: "https://werkles.com",
      WERKLES_ALLOW_PRODUCTION_SMOKE_MUTATION: "I_UNDERSTAND_THIS_WRITES_PRODUCTION"
    }),
    "https://werkles.com"
  );
  assert.throws(
    () => resolveSiteOrigin({ WERKLES_SITE_ORIGIN: "https://preview.example/path" }),
    /must be an origin/
  );
  assert.equal(fetchCount, 0);
} finally {
  globalThis.fetch = originalFetch;
}

console.log(
  JSON.stringify(
    {
      pass: true,
      fetchCount,
      checks: [
        "origin_is_explicit",
        "localhost_is_allowed",
        "production_is_rejected_by_default",
        "production_requires_deliberate_mutation_override",
        "origin_resolution_never_probes_or_posts"
      ]
    },
    null,
    2
  )
);
