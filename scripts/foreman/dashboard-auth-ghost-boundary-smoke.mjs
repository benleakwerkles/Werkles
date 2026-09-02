import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const guard = await readFile(
  path.join(root, "components/foundry/dashboard-auth-guard.tsx"),
  "utf8"
);
const cruciblePage = await readFile(
  path.join(root, "app/dashboard/crucible/page.tsx"),
  "utf8"
);

assert.doesNotMatch(
  guard,
  /NEXT_PUBLIC_GHOST_FLEET_UI/,
  "a public build-time flag must not authorize an unauthenticated member surface"
);
assert.match(guard, /allowGhostWalkthrough\?: boolean/);
assert.match(guard, /const ghostWalkthrough = allowGhostWalkthrough/);
assert.match(guard, /\[ghostWalkthrough, next\]/);
assert.match(cruciblePage, /const fleetOn = isGhostFleetEnabled\(\)/);
assert.match(
  cruciblePage,
  /<DashboardAuthGuard next="\/dashboard\/crucible" allowGhostWalkthrough=\{fleetOn\}>/,
  "the server's production-closed Ghost Fleet decision must own the bypass"
);
assert.match(cruciblePage, /<CruciblePanel showGhostPractice=\{fleetOn\} \/>/);
assert.doesNotMatch(cruciblePage, /walkthroughReadOnly=\{fleetOn\}/);

console.log("Dashboard auth Ghost Fleet server boundary: PASS");
