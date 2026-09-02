import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const personalRoute = readFileSync("app/bellows/personal/[slug]/page.tsx", "utf8");
const publicRoute = readFileSync("app/bellows/library/[slug]/page.tsx", "utf8");
const focus = readFileSync("components/bellows/account-aware-personal-lesson-focus.tsx", "utf8");
const sharedLesson = readFileSync("components/bellows/bellows-lesson-content.tsx", "utf8");
const personalIndex = readFileSync("components/bellows/account-aware-personal-bellows.tsx", "utf8");

assert.match(personalRoute, /generateStaticParams/);
assert.match(personalRoute, /loadPublicBellowsRecommendationPageData/);
assert.match(personalRoute, /<AccountAwarePersonalLessonFocus/);
assert.match(personalRoute, /<BellowsLessonContent/);
assert.match(personalRoute, /returnHref="\/bellows\/personal"/);
assert.match(publicRoute, /<BellowsLessonContent/);
assert.doesNotMatch(publicRoute, /AccountAwarePersonalLessonFocus|recommendations\/current/);
assert.match(focus, /getClientAccessToken\(\)/);
assert.match(focus, /\/api\/bellows\/recommendations\/current/);
assert.match(focus, /buildPersonalBellowsLearningPath/);
assert.match(focus, /Why this lesson is here/);
assert.match(focus, /The lesson and tool below remain general education and do not receive or display your verbatim Intake answers/);
assert.match(focus, /will not substitute another browser&apos;s lesson/);
assert.match(personalIndex, /artifact\?\.personalHref \?\? recommendation\.lesson\.href/);
for (const component of [
  "ConstraintMapCard",
  "CompanyStarterFloorBoard",
  "EvidenceBriefBuilder",
  "PartnershipAlignmentMemo",
  "AssumptionTestCard",
  "SupplierComparisonCard"
]) assert.match(sharedLesson, new RegExp(component));

console.log("Personal Bellows lesson-workspace source contract: PASS");
