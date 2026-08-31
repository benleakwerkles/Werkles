import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const client = readFileSync("components/bellows/account-aware-personal-bellows.tsx", "utf8");
const page = readFileSync("app/bellows/personal/page.tsx", "utf8");

assert.match(client, /getClientAccessToken\(\)/);
assert.match(client, /\/api\/bellows\/recommendations\/current/);
assert.match(client, /will not replace it with an example or another browser&apos;s Intake/);
assert.match(client, /recommendation\.exercises\.map/);
assert.match(client, /Leave with:/);
assert.match(page, /AccountAwarePersonalBellows initialSession=\{session\}/);

console.log("Personal Bellows account continuity contract: PASS");
