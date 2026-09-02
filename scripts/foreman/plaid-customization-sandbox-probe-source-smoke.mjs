import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PLAID_LINK_CUSTOMIZATION_NAME } from "../../lib/plaid/link-config.ts";
import { buildPlaidSandboxLinkTokenRequest } from "../../lib/plaid/link-token-request.ts";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const source = await readFile(
  path.join(repoRoot, "scripts/foreman/plaid-customization-sandbox-probe.mjs"),
  "utf8"
);
const wrapperSource = await readFile(
  path.join(repoRoot, "scripts/foreman/Invoke-PlaidCustomizationSandboxProbe.ps1"),
  "utf8"
);

assert.equal(PLAID_LINK_CUSTOMIZATION_NAME, "default");
assert.deepEqual(
  buildPlaidSandboxLinkTokenRequest({
    ownerUserId: "werkles_customization_probe_20260814",
    linkCustomizationName: PLAID_LINK_CUSTOMIZATION_NAME
  }),
  {
    client_name: "Werkles",
    user: { client_user_id: "werkles_customization_probe_20260814" },
    products: ["assets"],
    country_codes: ["US"],
    language: "en",
    link_customization_name: "default"
  }
);
assert.match(source, /client_name:\s*"Werkles"/);
assert.match(source, /client_user_id:\s*DUMMY_OWNER_ID/);
assert.match(source, /products:\s*Object\.freeze\(\["assets"\]\)/);
assert.match(source, /country_codes:\s*Object\.freeze\(\["US"\]\)/);
assert.match(source, /language:\s*"en"/);
assert.match(source, /link_customization_name:\s*"default"/);

assert.match(source, /process\.env\.PLAID_ENV\s*!==\s*"sandbox"/);
assert.match(source, /redirect:\s*"error"/);
assert.deepEqual(
  source.match(/https:\/\/[^"'`\s]+/g),
  ["https://sandbox.plaid.com/link/token/create"]
);
assert.match(source, /typeof payload\?\.link_token !== "string"/);
assert.match(source, /payload\.link_token\.trim\(\)\.length === 0/);
assert.doesNotMatch(source, /production\.plaid\.com|development\.plaid\.com/);
assert.doesNotMatch(
  source,
  /public_token|access_token|item\/|accounts\/|asset_report|balance\/|transactions\/|identity\//i
);
assert.doesNotMatch(source, /console\.(?:error|warn|debug)|JSON\.stringify\(payload|request_id/);
assert.equal((source.match(/\bfetch\s*\(/g) ?? []).length, 1);
assert.equal((source.match(/console\.log\s*\(/g) ?? []).length, 2);
assert.deepEqual(
  [...source.matchAll(/process\.env\.([A-Z0-9_]+)/g)].map((match) => match[1]).sort(),
  ["PLAID_CLIENT_ID", "PLAID_ENV", "PLAID_SECRET"]
);
assert.match(source, /PLAID_CUSTOMIZATION_PROBE: PASS/);
assert.match(source, /PLAID_CUSTOMIZATION_PROBE: FAIL \$\{category\}/);
assert.match(wrapperSource, /plaid-customization-sandbox-probe\.mjs/);
assert.match(wrapperSource, /exit \$LASTEXITCODE/);
assert.doesNotMatch(wrapperSource, /process\.env|PLAID_CLIENT_ID|PLAID_SECRET|PLAID_ENV/);

const offlineEnv = {
  ...process.env,
  PLAID_ENV: "production",
  PLAID_CLIENT_ID: "offline-dummy-client-id",
  PLAID_SECRET: "offline-dummy-secret"
};
const probePath = path.join(repoRoot, "scripts/foreman/plaid-customization-sandbox-probe.mjs");
const direct = spawnSync(process.execPath, [probePath], {
  cwd: repoRoot,
  env: offlineEnv,
  encoding: "utf8"
});
assert.equal(direct.status, 1);
assert.equal(direct.stdout.trim(), "PLAID_CUSTOMIZATION_PROBE: FAIL environment_not_sandbox");
assert.equal(direct.stderr, "");
assert.doesNotMatch(`${direct.stdout}${direct.stderr}`, /offline-dummy/);

const wrapperPath = path.join(
  repoRoot,
  "scripts/foreman/Invoke-PlaidCustomizationSandboxProbe.ps1"
);
const wrapped = spawnSync(
  "powershell.exe",
  ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", wrapperPath],
  { cwd: repoRoot, env: offlineEnv, encoding: "utf8", timeout: 10_000 }
);
assert.equal(wrapped.error, undefined);
assert.equal(wrapped.status, 1, "wrapper must propagate the probe failure exit code");
assert.equal(wrapped.stdout.trim(), "PLAID_CUSTOMIZATION_PROBE: FAIL environment_not_sandbox");
assert.equal(wrapped.stderr, "");
assert.doesNotMatch(`${wrapped.stdout}${wrapped.stderr}`, /offline-dummy/);

console.log("Plaid customization sandbox probe source contract: PASS");
