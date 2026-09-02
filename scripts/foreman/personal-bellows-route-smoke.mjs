import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("app/bellows/personal/page.tsx", "utf8");
const personalClient = fs.readFileSync("components/bellows/account-aware-personal-bellows.tsx", "utf8");
const personalLesson = fs.readFileSync("app/bellows/personal/[slug]/page.tsx", "utf8");
const pathModel = fs.readFileSync("lib/bellows/personal-learning-path.ts", "utf8");

assert.match(page, /loadPublicBellowsRecommendationPageData/);
assert.match(page, /session\.source\?\.mode === "latest_intake"/);
assert.match(page, /AccountAwarePersonalBellows initialSession=\{session\}/);
assert.doesNotMatch(page, /verified|best match|guarantee|monitoring is active/i);
assert.match(personalClient, /artifact\?\.personalHref \?\? recommendation\.lesson\.href/);
assert.match(personalLesson, /AccountAwarePersonalLessonFocus/);
assert.match(personalLesson, /<BellowsLessonContent/);

assert.match(pathModel, /source\?\.mode !== "latest_intake"/);
assert.match(pathModel, /fedDocument\?\.kind !== "member_intake"/);
assert.match(pathModel, /seenLessons\.has\(lesson\.href\)/);
assert.match(pathModel, /buildMemberRecommendationPlan/);
assert.match(pathModel, /!plan\.tailored \|\| plan\.sprint\.length === 0/);
assert.match(pathModel, /plan\.sprint\.slice\(0, 3\)/);
assert.match(pathModel, /if \(steps\.length === 3\) break/);
assert.doesNotMatch(pathModel, /localStorage|sessionStorage|fetch\(|process\.env/);

console.log("Personal Bellows session-bound reading path contract: PASS");
