import assert from "node:assert/strict";
import fs from "node:fs";

const shelf = fs.readFileSync("components/bellows/bellows-device-draft-shelf.tsx", "utf8");
const personal = fs.readFileSync("app/bellows/personal/page.tsx", "utf8");
const catalog = fs.readFileSync("lib/bellows/device-artifact-catalog.ts", "utf8");

assert.equal((catalog.match(/key: "werkles:bellows:/g) ?? []).length, 6);
assert.match(shelf, /BELLOWS_DEVICE_ARTIFACTS/);
assert.match(shelf, /Pick up a private working draft/);
assert.match(shelf, /Checking this device/);
assert.match(shelf, /Each tool validates its own device draft before showing it/);
assert.match(shelf, /Nothing here is account-saved or shared/);
assert.doesNotMatch(shelf, />Open Tool</, "Personal Bellows controls must name the tool they open");
for (const title of ["Constraint Map", "Company Starter Floor", "Evidence Brief", "Partnership Alignment Memo", "Assumption Test", "Supplier Comparison"]) {
  assert.match(catalog, new RegExp(`title: "${title}"`));
}
assert.match(shelf, /isWerkleFirstSharedActionCurrent\(parsedAction, currentFormationId, currentSharedStep\)/, "a stale action must not reappear without the current accepted Operating Brief source");
assert.match(shelf, /localStorage\.getItem/);
assert.doesNotMatch(shelf, /localStorage\.setItem|localStorage\.removeItem|\bfetch\s*\(/);
assert.match(personal, /<BellowsDeviceDraftShelf \/>/);

console.log("PASS Personal Bellows device draft shelf source contract");
