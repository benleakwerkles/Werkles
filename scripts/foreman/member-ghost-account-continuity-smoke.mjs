import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");
const client = read("components/ghost-fleet/account-aware-ghost-member-lab.tsx");
const page = read("app/dashboard/intros/page.tsx");
const route = read("app/api/ghost-fleet/intros/current/route.ts");
const continuation = read("components/ghost-fleet/account-aware-people-continuation.tsx");
const recommendationsPage = read("app/bellows/recommendations/page.tsx");
const readout = read("components/ghost-fleet/account-aware-intros-readout.tsx");

assert.match(page, /fleetOn \? <AccountAwareGhostMemberLab initialMembers=\{interactionMembers\}/);
assert.match(client, /"checking" \| "ready" \| "account_error"/);
assert.match(client, /if \(Array\.isArray\(result\.members\)\) setMembers\(result\.members\)/);
assert.match(client, /setMembers\(\[\]\);[\s\S]*setLoadState\("account_error"\)/);
assert.match(client, /will not substitute practice matches from another browser session/);
assert.match(route, /readLatestMemberIntake\(auth\.supabase, auth\.user\.id\)/);
assert.match(route, /\.from\("profiles"\)/);
assert.match(continuation, /\/api\/ghost-fleet\/intros\/current/);
assert.match(continuation, /Array\.isArray\(result\?\.members\)/);
assert.match(continuation, /will not substitute another browser&apos;s practice matches/);
assert.match(recommendationsPage, /AccountAwarePeopleContinuation initialBridge=\{ghostFleetBridge\}/);
assert.match(route, /buildRecommendationViewFromAnswers\(intake\.intakeId, intake\.answers\)/);
assert.match(readout, /\/api\/ghost-fleet\/intros\/current/);
assert.match(readout, /Werkles will not replace it with a browser-session verdict/);
assert.match(page, /AccountAwareIntrosReadout initialView=\{view\}/);

console.log("Member Ghost account continuity contract: PASS");
