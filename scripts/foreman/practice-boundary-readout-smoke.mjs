import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readout = readFileSync("components/werkle/practice-boundary-readout.tsx", "utf8");
const formation = readFileSync("components/werkle/formation-workbench.tsx", "utf8");
const bellows = readFileSync("components/bellows/bellows-device-draft-shelf.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");

for (const exact of [
  "Browser-local practice Werkle on this device—not an account-saved record",
  "Only wording both practice records accepted",
  "Private notes, predictions, proposals, objections, and parked or withdrawn material",
  "Shown again only when it still matches the current accepted wording",
  "Practice summary—not an agreement",
  "No identity, funds, payment, phone, or background provider is active here"
]) assert.ok(readout.includes(exact), `missing boundary: ${exact}`);

assert.match(formation, /<PracticeBoundaryReadout titleId="formation-practice-boundary-title" \/>/);
assert.doesNotMatch(formation, /<strong>Practice summary—not an agreement\.<\/strong>/, "the former boundary paragraph must not duplicate the readout");
assert.match(bellows, /operatingBrief \? <PracticeBoundaryReadout titleId="bellows-practice-boundary-title" \/> : null/);
assert.match(bellows, /setOperatingBrief\(stored\.brief\)/);
assert.match(styles, /\.practice-boundary-readout dd[\s\S]*?font-size: 1rem/);
assert.match(styles, /\.practice-boundary-readout dt[\s\S]*?font-size: 1rem/);
assert.doesNotMatch(readout, /synced across devices|verified member|legal agreement/i);

console.log("PASS Practice Boundary Readout source contract");
