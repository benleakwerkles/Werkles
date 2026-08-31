import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const catalog = readFileSync("lib/bellows/device-artifact-catalog.ts", "utf8");
const personal = readFileSync("components/bellows/account-aware-personal-bellows.tsx", "utf8");
const shelf = readFileSync("components/bellows/bellows-device-draft-shelf.tsx", "utf8");

assert.equal((catalog.match(/key: "werkles:bellows:/g) ?? []).length, 6);
assert.equal((catalog.match(/href: "\/bellows\/library\//g) ?? []).length, 6);
assert.match(personal, /bellowsDeviceArtifactForHref/);
assert.match(personal, /Device draft found—checked when opened/);
assert.match(personal, /Not started on this device/);
assert.match(personal, /Open \$\{artifact\.title\}/);
assert.doesNotMatch(personal, /localStorage\.setItem|localStorage\.removeItem/);
assert.match(shelf, /BELLOWS_DEVICE_ARTIFACTS/);

console.log("Personal Bellows path → named work product source contract: PASS");
