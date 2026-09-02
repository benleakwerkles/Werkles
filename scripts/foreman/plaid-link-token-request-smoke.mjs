import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildPlaidSandboxLinkTokenRequest } from "../../lib/plaid/link-token-request.ts";
import {
  PLAID_LINK_CUSTOMIZATION_NAME
} from "../../lib/plaid/link-config.ts";

assert.equal(PLAID_LINK_CUSTOMIZATION_NAME, "default");

const minimal = buildPlaidSandboxLinkTokenRequest({
  ownerUserId: "owner_123"
});

assert.deepEqual(minimal, {
  client_name: "Werkles",
  user: { client_user_id: "owner_123" },
  products: ["assets"],
  country_codes: ["US"],
  language: "en"
});
assert.equal(minimal.client_name.length >= 1 && minimal.client_name.length <= 30, true);
assert.equal("link_customization_name" in minimal, false);

assert.deepEqual(
  buildPlaidSandboxLinkTokenRequest({
    ownerUserId: "owner_123",
    linkCustomizationName: PLAID_LINK_CUSTOMIZATION_NAME
  }),
  { ...minimal, link_customization_name: "default" }
);

for (const ownerUserId of ["", " ", " owner_123", "owner 123", "owner@example.com"]) {
  assert.throws(
    () => buildPlaidSandboxLinkTokenRequest({ ownerUserId }),
    /opaque owner identifier/
  );
}

for (const linkCustomizationName of ["", " ", " custom", "custom name", "custom/name", "x".repeat(101)]) {
  assert.throws(
    () => buildPlaidSandboxLinkTokenRequest({
      ownerUserId: "owner_123",
      linkCustomizationName
    }),
    /linkCustomizationName/
  );
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const builderSource = await readFile(
  path.join(repoRoot, "lib/plaid/link-token-request.ts"),
  "utf8"
);
assert.doesNotMatch(builderSource, /\bfetch\s*\(/);
assert.doesNotMatch(builderSource, /console\.|process\.env/);
assert.doesNotMatch(builderSource, /client_id|\bsecret\b|credentials/i);
assert.equal("client_id" in minimal, false);
assert.equal("secret" in minimal, false);

const providerSource = await readFile(path.join(repoRoot, "lib/crucible-providers.ts"), "utf8");
const linkConfigSource = await readFile(path.join(repoRoot, "lib/plaid/link-config.ts"), "utf8");
const fundsRouteSource = await readFile(
  path.join(repoRoot, "app/api/verification/funds/route.ts"),
  "utf8"
);
assert.match(providerSource, /buildPlaidSandboxLinkTokenRequest/);
assert.match(providerSource, /^import "server-only";/);
assert.doesNotMatch(providerSource, /products:\s*\["assets"\]/);
assert.match(providerSource, /linkCustomizationName:\s*typeof PLAID_LINK_CUSTOMIZATION_NAME/);
assert.match(
  providerSource,
  /input\.linkCustomizationName\s*!==\s*PLAID_LINK_CUSTOMIZATION_NAME/
);
assert.match(providerSource, /linkCustomizationName:\s*input\.linkCustomizationName/);
assert.match(providerSource, /JSON\.stringify\(\{\s*client_id: clientId,\s*secret,\s*\.\.\.publicRequest/s);
assert.match(fundsRouteSource, /linkCustomizationName:\s*PLAID_LINK_CUSTOMIZATION_NAME/);
assert.doesNotMatch(fundsRouteSource, /client_id|PLAID_SECRET|\bsecret\b/);
assert.doesNotMatch(linkConfigSource, /process\.env|client_id|PLAID_SECRET|\bsecret\b/i);

console.log("Plaid sandbox Link-token request contract: PASS");
