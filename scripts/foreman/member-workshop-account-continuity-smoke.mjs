import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");
const state = read("lib/owner-surfaces/owner-state.ts");
const route = read("app/api/bellows/workshop/current/route.ts");
const client = read("components/workshop/account-aware-workshop-state.tsx");
const page = read("app/dashboard/blueprints/page.tsx");

assert.match(state, /export async function buildOwnerSurfaceStateFromAnswers/);
assert.match(state, /return buildOwnerSurfaceStateFromAnswers\(/);
assert.match(route, /requireUser\(request\)/);
assert.match(route, /readLatestMemberIntake\(auth\.supabase, auth\.user\.id\)/);
assert.match(route, /buildOwnerSurfaceStateFromAnswers/);
assert.match(route, /Cache-Control", "private, no-store"/);
assert.match(client, /getClientAccessToken\(\)/);
assert.match(client, /\/api\/bellows\/workshop\/current/);
assert.match(client, /token === "dev-preview-token"/);
assert.match(client, /We will not fill it with another browser&apos;s work/);
assert.match(page, /AccountAwareWorkshopState initialState=\{state\}/);
assert.doesNotMatch(page, /state\.carrying\.map/);

console.log("Member Workshop account continuity contract: PASS");
