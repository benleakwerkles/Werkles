import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const form = readFileSync("components/squibb/concierge-intake-form.tsx", "utf8");
const page = readFileSync("app/bellows/intake/page.tsx", "utf8");
const storage = readFileSync("lib/squibb/concierge-intake-storage.ts", "utf8");
const login = readFileSync("app/login/page.tsx", "utf8");

assert.match(form, /werkles_concierge_intake_draft_v1/);
assert.match(form, /window\.localStorage\.setItem/);
assert.match(form, /Your unfinished browser draft is back/);
assert.match(form, /window\.localStorage\.removeItem\(INTAKE_DRAFT_KEY\)/);
assert.match(page, /readBellowsOwnerIdFromCookies/);
assert.match(page, /initialAnswers=\{initialAnswers\}/);
assert.match(page, /ownerId\s*\? await readLatestSpeakerIntakeForOwner\(ownerId\)/);
assert.match(storage, /activateStoredSpeakerIntakeForOwner/);
assert.match(storage, /row\.ownerId === ownerId && row\.intakeId === intakeId/);
assert.match(storage, /testRun\) return null/);
assert.match(login, /Continue as gimprobotester/);
assert.match(login, /!authConfigured && localPreviewAvailable/);

console.log("Member identity → Intake continuity contract: PASS");
