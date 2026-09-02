import assert from "node:assert/strict";
import fs from "node:fs";

const login = fs.readFileSync("app/login/page.tsx", "utf8");
const callback = fs.readFileSync("app/auth/callback/page.tsx", "utf8");
const css = fs.readFileSync("app/globals.css", "utf8");

assert.match(login, /<SiteHeader \/>/);
assert.doesNotMatch(login, /NarrativeJourneyRail|Act IV|foundryB02FinishedProduct/);
assert.match(login, /Pick up where you left off/);
assert.match(login, /One place to see what changed/);
assert.match(login, /people-bellows-learning\.jpg/);
assert.match(login, /Real work has somewhere to come back to/);
assert.match(login, /Pick up the thread/);
assert.match(login, /See who reached out/);
assert.match(login, /Review what changed/);
assert.match(login, /Continue to Werkles/);
assert.doesNotMatch(login, /local browser walkthrough|browser-only Werkles walkthrough|not a saved account/i);
assert.match(login, /returnDestinationLabel\(nextPath\)/);
assert.match(callback, /<SiteHeader \/>/);

for (const required of [
  ".auth-shell--return",
  ".login-return__grid",
  ".login-return__board",
  ".login-return__updates",
  ".login-return__human",
  "@media (max-width: 860px)",
  "@media (forced-colors: active)"
]) {
  assert.equal(css.includes(required), true, `Missing Login shell rule: ${required}`);
}

assert.doesNotMatch(login, /you have new messages|new matches are waiting|Werkles kept working while/i);

console.log("Login shared-shell and honest return-board contract: PASS");
