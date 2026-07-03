import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const EXTERNAL_EVENTS = join(ROOT, "data", "organism", "aeye_external_events.jsonl");
const TEMPLATE = join(ROOT, "foreman", "artifacts", "external_aeye_proof_template.json");
const STATUS = join(ROOT, "foreman", "artifacts", "external_aeye_proof_intake_status.json");
const ALLOWED_EVENTS = new Set([
  "aeye_chat_created",
  "aeye_query_sent",
  "nerdkle_prompt_activity",
  "packet_left_relay_boundary",
  "packet_left_local_system",
  "aeye_query_visible",
  "aeye_receipt_ack",
  "aeye_answer_observed",
  "answer_received",
]);

function rel(path) {
  return relative(ROOT, path).replace(/\\/g, "/");
}

function repoPath(path) {
  const fullPath = resolve(ROOT, path);
  if (fullPath !== ROOT && !fullPath.startsWith(`${ROOT}\\`) && !fullPath.startsWith(`${ROOT}/`)) {
    throw new Error("input path escapes workspace root");
  }
  return fullPath;
}

async function readJson(path) {
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

async function readJsonl(path) {
  const raw = await readFile(path, "utf8").catch(() => "");
  return raw.split(/\r?\n/).filter(Boolean).flatMap((line) => {
    try {
      return [JSON.parse(line)];
    } catch {
      return [];
    }
  });
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function templateRows() {
  const base = {
    evidence_scope: "external_platform",
    platform: "REPLACE_WITH_PLATFORM",
    packet_id: "REPLACE_WITH_PACKET_ID",
    target_address: "REPLACE_WITH_AEYE",
    proof_ref: "REPLACE_WITH_CHAT_URL_SCREENSHOT_PATH_THREAD_ID_OR_TRANSCRIPT_PATH",
    observed_at: new Date().toISOString(),
  };
  return [
    { ...base, event_type: "aeye_chat_created", chat_id: "REPLACE_WITH_CHAT_ID" },
    { ...base, event_type: "aeye_query_sent", query_id: "REPLACE_WITH_QUERY_ID" },
    { ...base, event_type: "nerdkle_prompt_activity", prompt_origin: "Nerdkle Organism" },
    { ...base, event_type: "packet_left_local_system" },
    { ...base, event_type: "aeye_query_visible" },
    { ...base, event_type: "aeye_receipt_ack" },
    { ...base, event_type: "aeye_answer_observed", answer: "REPLACE_WITH_OBSERVED_ANSWER" },
    { ...base, event_type: "answer_received", answer: "REPLACE_WITH_RECEIVED_ANSWER" },
  ];
}

function validateEvent(event) {
  const errors = [];
  if (!ALLOWED_EVENTS.has(event?.event_type)) errors.push(`invalid event_type ${event?.event_type || ""}`);
  if (event?.evidence_scope !== "external_platform") errors.push("evidence_scope must be external_platform");
  for (const key of ["platform", "packet_id", "proof_ref"]) {
    if (typeof event?.[key] !== "string" || !event[key].trim() || event[key].startsWith("REPLACE_WITH")) {
      errors.push(`${key} is required`);
    }
  }
  return errors;
}

function parseArgs(argv) {
  return {
    template: argv.includes("--template"),
    status: argv.includes("--status"),
    input: argv.find((arg) => arg.startsWith("--input="))?.split("=").slice(1).join("="),
  };
}

async function writeStatus(extra = {}) {
  const rows = await readJsonl(EXTERNAL_EVENTS);
  const status = {
    artifact_id: "EXTERNAL_AEYE_PROOF_INTAKE_STATUS_V0",
    updated_at: new Date().toISOString(),
    status: rows.length ? "EXTERNAL_PROOF_ROWS_PRESENT" : "WAITING_FOR_EXTERNAL_PROOF",
    external_event_rows: rows.length,
    external_events: rel(EXTERNAL_EVENTS),
    template: rel(TEMPLATE),
    accepted_event_types: [...ALLOWED_EVENTS].sort(),
    ...extra,
  };
  await writeJson(STATUS, status);
  return status;
}

const args = parseArgs(process.argv.slice(2));

if (args.template) {
  await writeJson(TEMPLATE, templateRows());
  const status = await writeStatus({ last_action: "template_written" });
  console.log(`wrote external proof template to ${rel(TEMPLATE)}`);
  console.log(status.status);
} else if (args.input) {
  const parsed = await readJson(repoPath(args.input));
  const events = Array.isArray(parsed) ? parsed : [parsed];
  const errors = events.flatMap((event, index) => validateEvent(event).map((error) => `row ${index + 1}: ${error}`));
  if (errors.length) {
    await writeStatus({ last_action: "input_rejected", errors });
    console.error(errors.join("\n"));
    process.exit(1);
  }
  await mkdir(dirname(EXTERNAL_EVENTS), { recursive: true });
  await appendFile(EXTERNAL_EVENTS, `${events.map((event) => JSON.stringify(event)).join("\n")}\n`, "utf8");
  const status = await writeStatus({ last_action: "input_accepted", accepted_rows: events.length });
  console.log(`accepted ${events.length} external proof row${events.length === 1 ? "" : "s"}`);
  console.log(status.status);
} else {
  const status = await writeStatus({ last_action: args.status ? "status_refreshed" : "status_refreshed" });
  if (!(await readFile(TEMPLATE, "utf8").catch(() => "")).trim()) await writeJson(TEMPLATE, templateRows());
  console.log(status.status);
}
