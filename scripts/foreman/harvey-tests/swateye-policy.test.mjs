import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const repo = path.resolve(import.meta.dirname, "..", "..", "..");
const script = path.join(repo, "scripts", "foreman", "Invoke-HarveySwateyeGitLfsRecovery.ps1");
const rules = path.join(repo, ".codex", "rules", "swateye.rules");

function run(...args) {
  return spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", script, ...args], {
    cwd: repo,
    encoding: "utf8",
    windowsHide: true
  });
}

test("Swateye policy accepts only the fully proven orphan fixture", () => {
  const result = run("-SelfTest");
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.status, "PASS");
  assert.equal(receipt.policy_id, "SWATEYE_SPANZEE_GIT_LFS_ORPHAN_RECOVERY_V1");
  assert.equal(receipt.cases.length, 9);
  assert.deepEqual(receipt.cases.filter((item) => item.eligible).map((item) => item.name), ["proven_orphan"]);
  assert.ok(receipt.cases.every((item) => item.status === "PASS"));
});

test("Swateye execution fails closed off Spanzee without stopping anything", () => {
  const result = run("-Execute");
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  const receipt = JSON.parse(result.stdout);
  assert.equal(receipt.status, "BLOCKER");
  assert.deepEqual(receipt.blockers, ["SPANZEE_HOSTNAME_REQUIRED"]);
  assert.equal(receipt.stopped_count, 0);
  assert.equal(receipt.blanket_name_kill_used, false);
});

test("Spanzee Handeye selects the exact Swateye action and rejects arbitrary shell", () => {
  const handeye = path.join(repo, "scripts", "foreman", "Invoke-HarveyHandeye.ps1");
  const result = spawnSync("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", handeye, "-MachineName", "Spanzee", "-CockpitUrl", "http://127.0.0.1:9", "-SelectionSelfTest"], {
    cwd: repo,
    env: { ...process.env, COMPUTERNAME: "SPANZEE", HARVEY_AGENT_SECRET: "self-test-only" },
    encoding: "utf8",
    windowsHide: true
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /SWATEYE_COMMAND_SELECTION_SELF_TEST_PASS/);
});

test("source and Codex rule never authorize a blanket git-lfs name kill", async () => {
  const [source, rule] = await Promise.all([readFile(script, "utf8"), readFile(rules, "utf8")]);
  assert.doesNotMatch(source, /Stop-Process\s+-Name/i);
  assert.doesNotMatch(source, /Stop-Process\s+-Id/i);
  assert.match(source, /Get-Process\s+-Id\s+\(\[int\]\$candidate\.pid\)[\s\S]*\$processHandle\.Kill\(\)/i);
  assert.match(source, /\$handleCreation\s+-ne\s+\[string\]\$candidate\.creation_time_utc/i);
  assert.match(rule, /Invoke-HarveySwateyeGitLfsRecovery\.ps1/);
  assert.match(rule, /"-Execute"/);
  assert.match(rule, /not_match\s*=\s*\[[\s\S]*Stop-Process -Name git-lfs/i);
  assert.doesNotMatch(rule, /pattern\s*=\s*\[\s*"Stop-Process"/i);
});
