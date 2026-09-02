import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { isLocalWalkthroughSessionCookie } from "../../lib/local-walkthrough-header.ts";

assert.equal(isLocalWalkthroughSessionCookie(undefined), false);
assert.equal(isLocalWalkthroughSessionCookie("not-json"), false);
assert.equal(isLocalWalkthroughSessionCookie(JSON.stringify({
  email: "walker@example.test",
  userId: "some-real-looking-user"
})), false);
assert.equal(isLocalWalkthroughSessionCookie(JSON.stringify({
  email: "",
  userId: "dev-preview-user"
})), false);
assert.equal(isLocalWalkthroughSessionCookie(JSON.stringify({
  email: "walker@example.test",
  userId: "dev-preview-user"
})), true);

const header = fs.readFileSync(
  path.join(process.cwd(), "components/foundry/site-header.tsx"),
  "utf8"
);
const wrapper = fs.readFileSync(
  path.join(process.cwd(), "components/foundry/local-aware-site-header.tsx"),
  "utf8"
);

for (const marker of [
  'aria-label="Primary navigation"',
  'aria-label="Member navigation"',
  '>Your Werkles</span>',
  '"/dashboard"',
  '"Member Home"',
  '"Update Intake"'
]) {
  assert.ok(header.includes(marker), `Missing local header continuity marker: ${marker}`);
}

for (const marker of [
  'shouldUseRuntimePreviewAuth()',
  'get(DEV_PREVIEW_COOKIE)',
  '<SiteHeader localWalkthrough={localWalkthrough} />'
]) {
  assert.ok(wrapper.includes(marker), `Missing server-owned local header marker: ${marker}`);
}

assert.equal(header.includes('next/headers'), false, "Shared header must remain usable by client routes");

for (const forbidden of [
  "Signed in",
  "Member account",
  "Saved profile",
  "Synced session"
]) {
  assert.equal(header.includes(forbidden), false, `Header launders local preview into account state: ${forbidden}`);
}

console.log("Site header local walkthrough continuity: PASS");
