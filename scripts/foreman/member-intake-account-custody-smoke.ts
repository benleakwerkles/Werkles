import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");

const migration = read("supabase/migrations/20260820073346_member_concierge_intakes.sql");
const custody = read("lib/squibb/member-intake-custody.ts");
const intakeRoute = read("app/api/bellows/intake/route.ts");
const currentRoute = read("app/api/bellows/intake/current/route.ts");
const recommendationRoute = read("app/api/bellows/recommendations/current/route.ts");
const form = read("components/squibb/concierge-intake-form.tsx");
const owner = read("lib/squibb/bellows-owner-session.ts");

assert.match(migration, /create table if not exists public\.member_concierge_intakes/);
assert.match(migration, /user_id uuid not null default auth\.uid\(\) references auth\.users\(id\) on delete cascade/);
assert.match(migration, /captured_at timestamptz not null default now\(\)/);
assert.match(migration, /unique \(user_id, client_submission_id\)/);
assert.match(migration, /enable row level security/);
assert.match(migration, /to authenticated[\s\S]*using \(\(select auth\.uid\(\)\) is not null and \(select auth\.uid\(\)\) = user_id\)/);
assert.match(migration, /revoke all on public\.member_concierge_intakes from anon/);
assert.match(migration, /revoke all on public\.member_concierge_intakes from authenticated/);
assert.match(migration, /grant select, delete on public\.member_concierge_intakes to authenticated/);
assert.match(migration, /grant insert \(client_submission_id, intake_id, answers\)/);
assert.doesNotMatch(migration, /grant insert \([^)]*user_id|grant insert \([^)]*captured_at/);
assert.match(migration, /answers_string_values/);
assert.match(migration, /answers_bounded/);
assert.match(migration, /member_concierge_intakes_at_least_one_answer/);
assert.doesNotMatch(migration, /grant[^;]*update/);
assert.doesNotMatch(migration, /for update/);
assert.doesNotMatch(migration, /\bpacket jsonb\b|\banswered_count integer\b|\bupdated_at timestamptz\b/);
assert.doesNotMatch(migration, /service_role/);

assert.match(custody, /\.eq\("user_id", userId\)/);
assert.match(custody, /\.insert\(\{/);
assert.match(custody, /const answers = exactAnswers\(input\.answers\)/);
assert.match(custody, /Intake answers are invalid/);
const insertBlock = custody.slice(custody.indexOf(".insert({"), custody.indexOf(".select(MEMBER_INTAKE_COLUMNS)"));
assert.doesNotMatch(insertBlock, /user_id|captured_at/);
assert.doesNotMatch(custody, /\.upsert\(/);
assert.match(custody, /error\?\.code !== "23505"/);
assert.match(custody, /sameAnswers\(prior\.answers, answers\)/);
assert.match(custody, /already used for different answers/);
assert.doesNotMatch(custody, /packet,\s*answered_count|updated_at:/);
assert.doesNotMatch(custody, /getSupabaseService|SUPABASE_SERVICE_ROLE_KEY/);
assert.match(intakeRoute, /requireUser\(request\)/);
assert.match(intakeRoute, /storeMemberIntake/);
assert.match(currentRoute, /requireUser\(request\)/);
assert.match(recommendationRoute, /requireUser\(request\)/);
assert.match(recommendationRoute, /runEphemeralMatchingFromConcierge/);
assert.match(form, /clientSubmissionId/);
assert.match(form, /\/api\/bellows\/intake\/current/);
assert.match(form, /Account saving is on/);
assert.match(owner, /isLocalWalkthroughSessionCookie/);
assert.match(owner, /return "member_dev-preview-user"/);

console.log("Member Intake account custody contract: PASS");
