import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const crucible = await readFile("lib/crucible.ts", "utf8");
const card = await readFile("components/crucible/verification-card.tsx", "utf8");

assert.match(crucible, /providerReadinessFor\(check\.key\)/);
assert.match(crucible, /route: providerReadiness\.route/);
assert.doesNotMatch(crucible, /check\.key === "identity"[\s\S]{0,180}\/api\/verification\/identity/);
assert.match(card, /resolveProviderReadiness\(check\.providerReadiness/);
assert.match(card, /data-provider-readiness=\{providerReadiness\.status\}/);
assert.match(card, /providerReadiness\.label/);
assert.match(card, /providerReadiness\.detail/);

console.log("Crucible provider readiness integration: PASS");
