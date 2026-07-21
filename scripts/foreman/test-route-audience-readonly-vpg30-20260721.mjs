import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(new URL("../../", import.meta.url).pathname.slice(1));
const receiptPath = path.join(repoRoot, "foreman/receipts/WERKLES_INTERNAL_EXTERNAL_ROUTE_BOUNDARY_20260712.json");
const before = readFileSync(receiptPath, "utf8");

const output = execFileSync(
  process.execPath,
  ["scripts/foreman/test-werkles-route-audience-boundary.mjs"],
  { cwd: repoRoot, encoding: "utf8" }
);

const after = readFileSync(receiptPath, "utf8");
assert.equal(after, before, "default route-audience regression run must not rewrite its tracked receipt");
assert.match(output, /INTERNAL_EXTERNAL_BOUNDARY=PASS/);
assert.match(output, /RECEIPT=not-written \(pass --write-receipt to refresh\)/);

const source = readFileSync(path.join(repoRoot, "scripts/foreman/test-werkles-route-audience-boundary.mjs"), "utf8");
assert.match(source, /process\.argv\.includes\("--write-receipt"\)/);
assert.match(source, /if \(writeReceipt\) \{[\s\S]*fs\.writeFile/);

console.log(
  JSON.stringify(
    {
      pass: true,
      checks: [
        "default_route_audience_regression_passes",
        "default_regression_does_not_rewrite_tracked_receipt",
        "receipt_refresh_requires_explicit_write_flag"
      ]
    },
    null,
    2
  )
);
