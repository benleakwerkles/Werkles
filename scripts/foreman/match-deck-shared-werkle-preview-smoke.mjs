import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lab = readFileSync("components/ghost-fleet/ghost-member-interaction-lab.tsx", "utf8");
const formationPage = readFileSync("app/dashboard/werkles/formation/page.tsx", "utf8");
const formationWorkbench = readFileSync("components/werkle/formation-workbench.tsx", "utf8");

assert.match(lab, /Start a Practice Werkle/);
assert.match(lab, /PARTNERSHIP_PREPARATION_CONTEXT_KEY/);
assert.match(lab, /dashboard\/werkles\/formation\?candidate=/);
assert.match(formationPage, /allowedCandidateIds/);
assert.match(formationPage, /synthetic Workshop/);
assert.match(formationWorkbench, /Nothing here contacts a real person/);
assert.match(formationWorkbench, /Only exact wording accepted by both people enters the shared room/);
assert.match(formationWorkbench, /not saved to your Werkles account/);
assert.doesNotMatch(formationWorkbench, /fetch\(|supabase|\/api\//i);

console.log("Match Deck → practice Werkle formation source contract: PASS");
