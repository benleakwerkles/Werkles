import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve("scripts/foreman");
const entries = await fs.readdir(root, { withFileTypes: true });
const files = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".ps1")).map((entry) => entry.name).sort();

const callPattern = /(?:^|[|&]\s*)op\s+(?:item|vault|run|inject|read|account|whoami)\b|&\s*\$(?:op|OpExe)\b/gm;
const guardPattern = /OP_SERVICE_ACCOUNT_TOKEN|OP_SESSION|Get-WerklesOnePasswordServiceToken|Get-WerklesOnePasswordAutomationSecret|Invoke-WerklesOp|BLOCKED_NONINTERACTIVE_1PASSWORD_AUTH_MISSING/;
const visibleHumanDiagnostics = new Set(["Test-1PasswordCliDesktopIntegration.ps1"]);

const results = [];
for (const file of files) {
  const fullPath = path.join(root, file);
  const text = await fs.readFile(fullPath, "utf8");
  const calls = [...text.matchAll(callPattern)].map((match) => text.slice(0, match.index).split(/\r?\n/).length);
  if (!calls.length) continue;

  const classification = visibleHumanDiagnostics.has(file)
    ? "VISIBLE_HUMAN_DIAGNOSTIC"
    : guardPattern.test(text)
      ? "NONINTERACTIVE_AUTH_GUARDED"
      : "UNSAFE_PROMPT_RISK";
  results.push({ file: `scripts/foreman/${file}`, lines: calls, classification, pass: classification !== "UNSAFE_PROMPT_RISK" });
}

const receipt = {
  schema: "werkles_onepassword_prompt_risk_audit_v1",
  created_at: new Date().toISOString(),
  scope: "static names-and-line-numbers audit; op was not executed",
  pass: results.every((result) => result.pass),
  raw_op_callers: results.length,
  unsafe_prompt_risks: results.filter((result) => !result.pass),
  results,
  policy: "Automation must use non-interactive service-account/session auth or fail before op. Desktop integration is human-diagnostic only."
};

const output = path.resolve("foreman/receipts/WERKLES_ONEPASSWORD_PROMPT_RISK_AUDIT_20260712.json");
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");

console.log(`ONEPASSWORD_PROMPT_RISK_AUDIT=${receipt.pass ? "PASS" : "FAIL"}`);
console.log(`RAW_OP_CALLERS=${receipt.raw_op_callers}`);
for (const result of results) console.log(`${result.pass ? "PASS" : "FAIL"} ${result.classification} ${result.file}:${result.lines.join(",")}`);
console.log(`RECEIPT=${output}`);
process.exitCode = receipt.pass ? 0 : 1;
