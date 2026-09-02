import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");
const profile = read("app/dashboard/profile/page.tsx");
const crucible = read("components/crucible/crucible-panel.tsx");
const matchContext = read("components/crucible/match-check-context.tsx");
const intros = read("components/ghost-fleet/account-aware-intros-readout.tsx");
const css = read("app/globals.css");

assert.match(profile, /Profile saving is temporarily unavailable\. Nothing on this page was sent or changed\./);
assert.match(crucible, /className="crucible-check-catalog"/);
assert.match(crucible, /if \(!window\.location\.hash\.startsWith\("#check-"\)\) return/);
assert.match(crucible, /open=\{catalogOpen\}/);
assert.match(matchContext, /werkles:open-check-catalog/);
for (const check of ["identity", "phone", "funds"]) {
  assert.match(intros, new RegExp(`/dashboard/crucible#check-${check}`));
}
assert.match(intros, /Choose a Check for This Match/);
assert.match(intros, /<details className="ops-card recview__reasons">/);
assert.match(css, /@media \(max-width: 760px\)[\s\S]*?\.ghost-provider-walkthrough__grid \{ grid-template-columns: 1fr; \}/);

console.log("BVPGM M42 identity and trust continuity contract: PASS");
