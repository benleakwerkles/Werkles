import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const eslintCli = path.join(root, "node_modules", "eslint", "bin", "eslint.js");
const fixture = "scripts/foreman/fixtures/vpg32-invalid-hook.tsx";

const lintOutput = process.platform === "win32"
  ? execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npm.cmd run lint"], {
      cwd: root,
      encoding: "utf8"
    })
  : execFileSync("npm", ["run", "lint"], { cwd: root, encoding: "utf8" });
assert.doesNotMatch(lintOutput, /How would you like to configure ESLint|Strict \(recommended\)|Cancel/);

let fixtureFailed = false;
try {
  execFileSync(process.execPath, [eslintCli, fixture], { cwd: root, encoding: "utf8", stdio: "pipe" });
} catch (error) {
  fixtureFailed = error.status !== 0 && /react-hooks\/rules-of-hooks/.test(`${error.stdout ?? ""}${error.stderr ?? ""}`);
}
assert.equal(fixtureFailed, true, "invalid conditional-hook fixture must fail closed");

console.log(JSON.stringify({
  pass: true,
  checks: [
    "candidate_lint_runs_noninteractively",
    "candidate_lint_has_zero_warnings",
    "invalid_hook_fixture_fails_closed"
  ]
}, null, 2));
