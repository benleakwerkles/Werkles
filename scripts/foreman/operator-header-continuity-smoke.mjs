import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const layout = readFileSync("app/operator/layout.tsx", "utf8");
const providerQueue = readFileSync("app/operator/gate-knockout/provider-queue/page.tsx", "utf8");

assert.match(layout, /LocalAwareSiteHeader/);
assert.match(layout, /<LocalAwareSiteHeader \/>/);
assert.match(layout, /\{children\}/);
assert.match(providerQueue, /aria-label="Provider queue navigation"/);
assert.doesNotMatch(providerQueue, /SiteHeader|LocalAwareSiteHeader/);

console.log("PASS operator header continuity: shared Werkles header plus local operator navigation");
