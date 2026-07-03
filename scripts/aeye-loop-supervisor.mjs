import { spawn } from "node:child_process";
import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const LOG_PATH = join(ROOT, "foreman", "logs", "aeye-loop-supervisor.jsonl");
const STATE_PATH = join(ROOT, "data", "organism", "aeye_loop_supervisor_state.json");
const DEFAULT_INTERVAL_MS = 15000;

const PIPELINE = [
  ["scripts/command-dash-aeye-relay.mjs"],
  ["scripts/local-aeye-daemon.mjs"],
  ["scripts/origin-response-return.mjs"],
  ["scripts/receipt-provenance-scan.mjs"],
  ["scripts/external-aeye-proof-intake.mjs", "--status"],
  ["scripts/build-tinkerpit-packet-inbox.mjs"],
  ["scripts/build-packet-status.mjs"],
  ["scripts/build-packet-inbox-lifecycle.mjs"],
  ["scripts/build-aeye-relay-evidence.mjs"],
];

function parseArgs(argv) {
  const once = argv.includes("--once");
  const intervalArg = argv.find((arg) => arg.startsWith("--interval-ms="));
  const parsed = Number(intervalArg?.split("=")[1] || DEFAULT_INTERVAL_MS);
  return {
    once,
    intervalMs: Number.isInteger(parsed) && parsed >= 1000 ? parsed : DEFAULT_INTERVAL_MS,
  };
}

function runStep(args) {
  return new Promise((resolveStep) => {
    const child = spawn(process.execPath, args, {
      cwd: ROOT,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => {
      resolveStep({
        script: args[0],
        args: args.slice(1),
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });
}

async function appendLog(entry) {
  await mkdir(dirname(LOG_PATH), { recursive: true });
  await appendFile(LOG_PATH, `${JSON.stringify(entry)}\n`, "utf8");
}

async function writeState(entry) {
  await mkdir(dirname(STATE_PATH), { recursive: true });
  await writeFile(STATE_PATH, `${JSON.stringify(entry, null, 2)}\n`, "utf8");
}

async function runPipeline() {
  const startedAt = new Date().toISOString();
  const steps = [];
  for (const args of PIPELINE) {
    const result = await runStep(args);
    steps.push(result);
    if (result.code !== 0) break;
  }
  const entry = {
    event_type: "aeye_loop_supervisor_run",
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    status: steps.every((step) => step.code === 0) ? "PASS" : "FAIL",
    steps,
  };
  await appendLog(entry);
  await writeState(entry);
  console.log(`${entry.finished_at} ${entry.status}`);
  return entry;
}

const options = parseArgs(process.argv.slice(2));
await runPipeline();

if (!options.once) {
  console.log(`Aeye loop supervisor running every ${options.intervalMs}ms`);
  const scheduleNext = () => setTimeout(async () => {
    runPipeline().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    }).finally(scheduleNext);
  }, options.intervalMs);
  scheduleNext();
}
