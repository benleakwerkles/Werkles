import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const login = fs.readFileSync(path.join(root, "app/login/page.tsx"), "utf8");
const signup = fs.readFileSync(path.join(root, "app/signup/page.tsx"), "utf8");
const route = fs.readFileSync(
  path.join(root, "app/api/auth-first/dev-preview-login/route.ts"),
  "utf8"
);
const syncRoute = fs.readFileSync(
  path.join(root, "app/api/auth-first/sync-bellows-owner/route.ts"),
  "utf8"
);
const ownerSession = fs.readFileSync(
  path.join(root, "lib/squibb/bellows-owner-session.ts"),
  "utf8"
);
const intakeStorage = fs.readFileSync(
  path.join(root, "lib/squibb/concierge-intake-storage.ts"),
  "utf8"
);
const copy = fs.readFileSync(path.join(root, "lib/copy.ts"), "utf8");
const truth = fs.readFileSync(
  path.join(root, "lib/local-auth-preview-truth.ts"),
  "utf8"
);
const workshopLayout = fs.readFileSync(
  path.join(root, "app/dashboard/blueprints/layout.tsx"),
  "utf8"
);
const crucibleLayout = fs.readFileSync(
  path.join(root, "app/dashboard/crucible/layout.tsx"),
  "utf8"
);
const profileLayout = fs.readFileSync(
  path.join(root, "app/dashboard/profile/layout.tsx"),
  "utf8"
);

assert.match(login, /Continue to Werkles/);
assert.match(login, /Continue as gimprobotester/);
assert.match(login, /useLocalTestAccount/);
assert.match(login, /does not check or change your real password/);
assert.match(login, /minHeight: 44/);
assert.match(login, /params\.get\("walkthrough"\) === "1"/);
assert.match(login, /hasSupabaseBrowserConfig/);
assert.match(login, /signInWithPassword/);
assert.match(login, /\/api\/auth-first\/sync-bellows-owner/);
assert.match(login, /Open my last saved Intake/);
assert.match(login, /Your password was not rejected/);
assert.match(login, /setPassword\(""\)/);
assert.doesNotMatch(login, /disabled=\{previewBlocked \|\| !authConfigured\}/);
assert.doesNotMatch(login, /browser-only Werkles walkthrough/i);
assert.doesNotMatch(login, /not a saved account/i);
assert.doesNotMatch(login, /does not\s+sync to another browser/i);
assert.doesNotMatch(login, /signInDevPreview/);
assert.doesNotMatch(login, /shouldUseRuntimePreviewAuth/);
assert.match(login, /safeLocalNextPath\(params\.get\("next"\)\)/);
assert.match(login, /value\.startsWith\("\/\/"\)/);
assert.match(login, /value\.includes\("\\\\"\)/);
assert.match(login, /target\.origin === localOrigin/);
assert.doesNotMatch(login, /setNextPath\(params\.get\("next"\) \|\| "\/dashboard"\)/);

assert.match(signup, /Open the local walkthrough/);
assert.match(signup, /Real account creation is not connected on this machine/);
assert.match(signup, /Continue browser walkthrough/);
assert.match(signup, /action="\/api\/auth-first\/dev-preview-login"/);
assert.doesNotMatch(signup, /signInDevPreview|shouldUseDevPreviewAuth/);

assert.match(route, /BELLOWS_OWNER_COOKIE/);
assert.match(route, /member_dev-preview-user/);
assert.match(route, /bellowsOwnerCookieOptions/);
assert.match(route, /werkles_dev_preview_session/);
assert.match(route, /value\.startsWith\("\/\/"\)/);
assert.match(route, /value\.includes\("\\\\"\)/);
assert.match(route, /target\.origin === new URL\(requestUrl\)\.origin/);
assert.match(route, /bellowsOwnerCookieOptions\(60 \* 60 \* 24\)/);

assert.match(syncRoute, /requireUser\(request\)/);
assert.match(syncRoute, /member_dev-preview-user/);
assert.match(syncRoute, /VERCEL_ENV !== "production"/);
assert.match(syncRoute, /isGhostFleetEnabled\(\)/);
assert.match(syncRoute, /BELLOWS_OWNER_COOKIE/);
assert.match(syncRoute, /Cache-Control/);
assert.match(syncRoute, /adoptLatestSpeakerIntakeForOwner/);
assert.match(ownerSession, /setCookie: request\.cookies\.get\(BELLOWS_OWNER_COOKIE\)\?\.value !== ownerId/);
assert.match(intakeStorage, /adoptLatestSpeakerIntakeForOwner/);

assert.match(truth, /Local browser walkthrough/);
assert.match(truth, /no Werkles account/i);
assert.doesNotMatch(truth, /mock sign-in active|create a mock account/i);

assert.doesNotMatch(login, /copy\.localPreview\.loginIdle/);
assert.doesNotMatch(copy, /Local browser walkthrough/);

assert.match(workshopLayout, /title: "Your Workshop"/);
assert.match(crucibleLayout, /title: "Crucible Checks"/);
assert.match(profileLayout, /title: "Your Profile"/);

console.log("Login browser-walkthrough continuity contract: PASS");
