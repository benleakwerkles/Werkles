import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (file) => fs.readFileSync(path.resolve(file), "utf8");

const header = read("components/foundry/site-header.tsx");
const css = read("app/globals.css");

const rooms = [
  ["people", "People"],
  ["bellows", "Public Bellows"],
  ["personal-bellows", "Private Bellows"],
  ["proof", "Proof Workspace"],
  ["membership", "Membership"],
  ["workshop", "Workshop"],
  ["werkle", "Shared Werkle"],
];

assert.match(header, /data-werkles-room=\{room\}/, "shared header must expose one testable room identity");
for (const [room, label] of rooms) {
  assert.ok(header.includes(JSON.stringify(label)), `${room} needs its exact non-color label`);
  assert.ok(css.includes(`.site-header--room-${room}`), `${room} needs a bounded header token`);
}

const routeBindings = [
  ["app/bellows/page.tsx", "route-room--bellows"],
  ["app/bellows/personal/page.tsx", "route-room--personal-bellows"],
  ["app/membership/page.tsx", "route-room--membership"],
  ["app/dashboard/crucible/page.tsx", "route-room--proof"],
  ["app/dashboard/blueprints/page.tsx", "route-room--workshop"],
  ["app/dashboard/intros/page.tsx", "route-room--people"],
  ["app/dashboard/werkles/formation/page.tsx", "route-room--werkle"],
];

for (const [file, token] of routeBindings) {
  assert.ok(read(file).includes(token), `${file} must bind to ${token}`);
}

const customerSource = ["app", "components"]
  .flatMap((root) => walk(path.resolve(root)))
  .filter((file) => /\.(?:ts|tsx)$/.test(file))
  .map(read)
  .join("\n");

assert.doesNotMatch(customerSource, /\bBen\b/, "personal Operator name must not remain in customer-rendering source");
assert.doesNotMatch(customerSource, /What is the heaviest thing you are carrying\??/i, "retired intake line must not return");

console.log("PASS customer language and seven-room mode contract");

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}
