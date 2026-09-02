import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync("app/bellows/recommendations/page.tsx", "utf8");
const surface = fs.readFileSync("components/squibb/recommendation-surface.tsx", "utf8");
const workPath = fs.readFileSync("components/squibb/recommendation-work-path.tsx", "utf8");
const shelf = fs.readFileSync("components/bellows/bellows-device-draft-shelf.tsx", "utf8");
const custody = fs.readFileSync("lib/squibb/recommendation-device-drafts.ts", "utf8");

for (const marker of ["isRecommendationKind(requestedOption)", "initialKind={initialKind}"]) assert.ok(page.includes(marker), marker);
for (const marker of ["requestedRanked", "requestedCatalog", "initialKind?: RecommendationKind"]) assert.ok(surface.includes(marker), marker);
for (const marker of ["Open My Bellows Lesson", "Open Public Version", "lessonArtifact?.personalHref", "maxLength={RECOMMENDATION_DRAFT_MAX_FIELD_LENGTH}"]) assert.ok(workPath.includes(marker), marker);
assert.ok(!workPath.includes("Your Personal Bellows lesson is not built"));
for (const marker of ["Recommendation drafts on this device", "Open Exact Option", "?option=${kind}", "parseRecommendationDraft(kind, raw)"]) assert.ok(shelf.includes(marker), marker);
for (const marker of ["MAX_RAW_LENGTH", "RECOMMENDATION_DRAFT_MAX_FIELD_LENGTH", "Object.keys(parsed).some", "Object.freeze(normalized)"]) assert.ok(custody.includes(marker), marker);

console.log("Recommendation draft → Personal Bellows continuity source contract: PASS");
