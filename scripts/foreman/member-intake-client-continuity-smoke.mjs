import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => readFileSync(path.join(root, file), "utf8");
const auth = read("lib/client-auth.ts");
const form = read("components/squibb/concierge-intake-form.tsx");
const recommendations = read("components/squibb/account-aware-recommendation-surface.tsx");

assert.ok(
  auth.indexOf("hasSupabaseBrowserConfig()") < auth.indexOf('return isLocalRoutePreviewUnlocked()'),
  "A real Supabase session must be checked before the local preview identity."
);
assert.match(auth, /if \(data\.session\?\.access_token\) return data\.session\.access_token/);
assert.match(form, /dirty\?: unknown/);
assert.match(form, /parsed\.dirty === true/);
assert.match(form, /if \(!draftReady \|\| !hasDirtyBrowserDraft\) return/);
assert.match(form, /setHasDirtyBrowserDraft\(true\)/);
assert.match(form, /setHasDirtyBrowserDraft\(false\)/);
assert.doesNotMatch(form, /setHasBrowserDraft/);
assert.match(recommendations, /state: "checking"/);
assert.match(recommendations, /state: "account_error"/);
assert.match(recommendations, /We will not replace it with somebody else&apos;s example/);
assert.match(recommendations, /ledger: \{ intakes: \[\], optionPackets: \[\] \}/);

console.log("Member Intake client continuity contract: PASS");
