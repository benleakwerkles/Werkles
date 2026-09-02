import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const form = await readFile("components/squibb/concierge-intake-form.tsx", "utf8");
const route = await readFile("app/api/bellows/intake/route.ts", "utf8");

assert.match(form, /Walkthrough storage only\./);
assert.match(form, /not saved to your Werkles account yet/i);
assert.match(form, /Signing in does not make it portable/i);
assert.match(form, /Submit local walkthrough/);
assert.match(route, /not (?:saved to your Werkles account|Werkles account storage)/i);
assert.doesNotMatch(form, /(?:will be|is) saved to your (?:Werkles )?account/i);

console.log("Concierge Intake storage truth: PASS");
