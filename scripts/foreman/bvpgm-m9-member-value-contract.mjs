import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const workshop = read("app/dashboard/blueprints/page.tsx");
const workshopState = read("components/workshop/account-aware-workshop-state.tsx");
const personal = read("app/bellows/personal/page.tsx");
const recommendation = read("components/squibb/recommendation-work-path.tsx");
const evidence = read("components/bellows/evidence-brief-builder.tsx");
const crucible = read("app/dashboard/crucible/page.tsx");

const checks = [
  [workshop.includes("Review My Plan") && workshop.includes("Open My Drafts") && workshop.includes("Open Match Deck") && workshop.includes("Practice a Werkle"), "Workshop exposes four usable doors"],
  [!workshop.includes("Preview—not built yet") && !workshop.includes("future shelf") && !workshop.includes("future place"), "Workshop removes dead-preview furniture"],
  [workshopState.includes("Your Intake is in") && workshopState.includes("Review or Change My Intake") && !workshopState.includes("state.carrying.map"), "Workshop acknowledges Intake without replaying every answer"],
  [workshopState.includes("Turn one path into useful work") && !workshopState.includes("Current hypothesis"), "Workshop replaces weak hypothesis display with an actionable bridge"],
  [personal.includes("One useful working draft.") && personal.includes("One clear next check."), "Personal Bellows uses ordinary work language"],
  [recommendation.includes("Finish the working draft") && !recommendation.includes("Make the artifact"), "Recommendations removes internal artifact instruction"],
  [evidence.includes("Not needed for this decision") && !evidence.includes("bounded check"), "Evidence Brief removes bounded-check jargon"],
  [/do\s+not make someone a better match or rank one person above another/.test(crucible) && crucible.includes("No wealth leaderboard"), "Crucible forbids verification ranking"],
];

const failed = checks.filter(([pass]) => !pass);
if (failed.length) {
  for (const [, label] of failed) console.error(`FAIL ${label}`);
  process.exit(1);
}

console.log(`PASS BVPGM M9 member value and provider continuity: ${checks.length}/${checks.length}`);
