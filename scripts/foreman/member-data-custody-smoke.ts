import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { MEMBER_DATA_CUSTODY, MEMBER_DATA_CUSTODY_STATES } from "../../lib/member-data-custody.ts";

assert.equal(MEMBER_DATA_CUSTODY.length, 5);
assert.equal(new Set(MEMBER_DATA_CUSTODY.map((entry) => entry.id)).size, 5);
assert.ok(MEMBER_DATA_CUSTODY.every((entry) => Object.isFrozen(entry)));
assert.ok(Object.isFrozen(MEMBER_DATA_CUSTODY));
assert.ok(MEMBER_DATA_CUSTODY.every((entry) => MEMBER_DATA_CUSTODY_STATES.includes(entry.state)));
assert.ok(MEMBER_DATA_CUSTODY.every((entry) => entry.storedWhere.length > 35 && entry.boundary.length > 35));

const answers = MEMBER_DATA_CUSTODY.find((entry) => entry.id === "answers");
const files = MEMBER_DATA_CUSTODY.find((entry) => entry.id === "workshop_files");
const results = MEMBER_DATA_CUSTODY.find((entry) => entry.id === "check_results");
assert.equal(answers?.state, "browser_only");
assert.match(answers?.boundary ?? "", /do not travel with your account/i);
assert.equal(files?.state, "not_connected");
assert.match(files?.storedWhere ?? "", /No member file bucket/i);
assert.equal(results?.state, "status_only");
assert.match(results?.boundary ?? "", /receipt, expiry, dispute, revocation/i);

const component = readFileSync("components/profile/member-data-custody-map.tsx", "utf8");
const profile = readFileSync("app/dashboard/profile/page.tsx", "utf8");
assert.match(component, /What saves where — and what does not/);
assert.match(component, /Production providers are off/);
assert.match(component, /data-custody-state=\{entry\.state\}/);
assert.match(profile, /<MemberDataCustodyMap \/>/);
assert.match(profile, /id="profile-form"/);
assert.doesNotMatch(profile, /Proof doctrine|Foundry Dues/);
assert.doesNotMatch(profile, /triggerVerification|\/api\/verification\/|Prepare ID Check|Prepare Asset Check/);
assert.match(profile, /A check confirms one narrow fact/);
assert.match(profile, /does not rank your worth/);
assert.match(profile, /href="\/dashboard\/crucible"/);

console.log("Member data custody map: PASS");
