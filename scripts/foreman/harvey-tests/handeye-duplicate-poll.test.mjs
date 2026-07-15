import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { base, createCommand, secondaryBase } from "./harvey-test-client.mjs";

const runHandeye = (cockpitUrl) => new Promise((resolve, reject) => {
  const child = spawn("powershell.exe", [
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-File",
    path.join(process.cwd(), "scripts", "foreman", "Invoke-HarveyHandeye.ps1"),
    "-MachineName", "Doss", "-CockpitUrl", cockpitUrl, "-Once"
  ], {
    env: { ...process.env, HARVEY_AGENT_SECRET: "harvey-test-doss-secret" },
    windowsHide: true
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
  child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
  child.once("error", reject);
  child.once("exit", (code) => resolve({ code, stdout, stderr }));
});

test("duplicate Handeye polling executes one command exactly once across two servers", async () => {
  const created = await createCommand("Doss", "PING");
  assert.equal(created.response.status, 200);
  const commandId = created.body.command.command_id;
  const [first, second] = await Promise.all([runHandeye(base), runHandeye(secondaryBase)]);
  assert.equal(first.code, 0, first.stderr);
  assert.equal(second.code, 0, second.stderr);

  const readbackResponse = await fetch(`${base}/api/harvey/commands?machine=Doss`);
  const readback = await readbackResponse.json();
  const command = readback.commands.find((item) => item.command_id === commandId);
  assert.equal(command.status, "COMPLETED");
  assert.equal(command.claim.attempt, 1);
  assert.equal(command.receipts.filter((receipt) => receipt.status === "RECEIVED").length, 1);
  assert.equal(command.receipts.filter((receipt) => receipt.status === "COMPLETED").length, 1);

  const reports = [first, second].map((result) => JSON.parse(result.stdout));
  assert.equal(reports.reduce((sum, report) => sum + report.executed, 0), 1);
});
