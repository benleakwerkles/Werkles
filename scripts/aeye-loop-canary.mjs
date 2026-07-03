import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const COMMAND_DASH_INBOX = join(ROOT, "tinkarden", "command_dash", "inbox");
const ORIGIN_RESPONSES = join(ROOT, "foreman", "artifacts", "origin_dash_responses.json");
const CANARY_OUTPUT = join(ROOT, "foreman", "artifacts", "aeye_loop_canary.json");
const RUN_TIME = new Date().toISOString();

const PIPELINE = [
  ["scripts/command-dash-aeye-relay.mjs"],
  ["scripts/local-aeye-daemon.mjs"],
  ["scripts/origin-response-return.mjs"],
  ["scripts/build-tinkerpit-packet-inbox.mjs"],
  ["scripts/build-packet-status.mjs"],
  ["scripts/build-packet-inbox-lifecycle.mjs"],
  ["scripts/build-aeye-relay-evidence.mjs"],
];

function rel(path) {
  return relative(ROOT, path).replace(/\\/g, "/");
}

function stamp() {
  return RUN_TIME.replace(/[-:.TZ]/g, "").slice(0, 14);
}

async function readJson(path, fallback) {
  const raw = await readFile(path, "utf8").catch(() => "");
  if (!raw.trim()) return fallback;
  return JSON.parse(raw);
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
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
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });
}

async function createCanary() {
  const id = `command-dash-canary-${stamp()}`;
  const path = join(COMMAND_DASH_INBOX, `${id}.json`);
  const canary = {
    command_id: id,
    title: "Fresh Aeye loop canary",
    action: "Prove a fresh Command Dash packet returns to origin dash",
    body: `Fresh canary generated at ${RUN_TIME}. This packet must leave Command Dash, reach a local Aeye daemon, receive an answer, and return to Command Dash.`,
    lane: "Relay Verification",
    tags: ["command-dash", "relay", "canary", "freshness"],
    target_address: "Thufir@Sally",
    created_at: RUN_TIME,
    status: "NEW",
  };
  await writeJson(path, canary);
  return { id, path: rel(path), canary };
}

async function runPipeline() {
  const runs = [];
  for (const args of PIPELINE) {
    const run = await runStep(args);
    runs.push(run);
    if (run.code !== 0) break;
  }
  return runs;
}

async function verifyReturn(sourceId) {
  const index = await readJson(ORIGIN_RESPONSES, { responses: [] });
  const responses = Array.isArray(index.responses) ? index.responses : [];
  return responses.find((response) => response.source_id === sourceId && response.origin_status === "ANSWERED") || null;
}

const created = await createCanary();
const runs = await runPipeline();
const response = await verifyReturn(created.id);
const passed = runs.every((run) => run.code === 0) && Boolean(response);

const result = {
  artifact_id: "AEYE_LOOP_CANARY_V0",
  generated_at: RUN_TIME,
  status: passed ? "PASS_FRESH_ORIGIN_RETURN" : "FAIL_FRESH_ORIGIN_RETURN",
  canary_id: created.id,
  source_path: created.path,
  response_id: response?.response_id || "",
  packet_id: response?.packet_id || "",
  origin_dash: response?.origin_dash || "",
  response_path: response?.response_path || "",
  returned_at: response?.delivered_at || "",
  runs,
};

await writeJson(CANARY_OUTPUT, result);
console.log(`${result.status}: ${created.id}`);
console.log(`canary artifact: ${rel(CANARY_OUTPUT)}`);
