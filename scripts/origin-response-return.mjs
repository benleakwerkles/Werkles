import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const ANSWER_PICKUP = join(ROOT, "data", "organism", "aeye_answer_pickup.jsonl");
const ORIGIN_BUS = join(ROOT, "data", "organism", "origin_response_bus.jsonl");
const ORIGIN_STATE = join(ROOT, "data", "organism", "origin_response_state.json");
const PACKET_DIR = join(ROOT, "tinkerden", "dispatch", "packets");
const THINKIT_QUESTIONS = join(ROOT, "foreman", "artifacts", "thinkit_questions.json");
const THINKIT_ANSWERS = join(ROOT, "foreman", "artifacts", "thinkit_answers.json");
const COMMAND_DASH_RESPONSES = join(ROOT, "tinkarden", "command_dash", "responses");
const COMMAND_DASH_STATE = join(ROOT, "tinkarden", "command_dash", "dashboard_state.json");
const ORIGIN_RESPONSES = join(ROOT, "foreman", "artifacts", "origin_dash_responses.json");
const RUN_TIME = new Date().toISOString();

function rel(path) {
  return relative(ROOT, path).replace(/\\/g, "/");
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

async function readJsonl(path) {
  const raw = await readFile(path, "utf8").catch(() => "");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { parse_error: true, raw: line };
      }
    });
}

async function writeJsonl(path, rows) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${rows.map((row) => JSON.stringify(row)).join("\n")}${rows.length ? "\n" : ""}`, "utf8");
}

function slug(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96) || "unknown";
}

async function packetFiles() {
  const entries = await readdir(PACKET_DIR, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => join(PACKET_DIR, entry.name))
    .sort();
}

async function packetsById() {
  const packets = new Map();
  for (const file of await packetFiles()) {
    const packet = await readJson(file, null);
    if (packet?.packet_id) packets.set(packet.packet_id, { ...packet, packet_path: rel(file) });
  }
  return packets;
}

function makeResponse(answer, packet) {
  const originSurface = packet?.source_surface || "UNKNOWN";
  const sourceId = packet?.source_id || answer.packet_id;
  const base = {
    response_id: `origin-response-${slug(answer.answer_id || answer.packet_id)}`,
    event_type: "origin_response_delivered",
    evidence_scope: answer.evidence_scope || "UNKNOWN",
    packet_id: answer.packet_id,
    answer_id: answer.answer_id,
    chat_id: answer.chat_id,
    query_id: answer.query_id,
    source_surface: originSurface,
    source_id: sourceId,
    source_path: packet?.source_path || "",
    target_address: answer.target_address,
    delivered_at: RUN_TIME,
    answer_received_at: answer.received_at || "",
    answer: answer.answer || "",
    packet_path: packet?.packet_path || "",
  };

  if (originSurface === "CommandDash") {
    return {
      ...base,
      origin_dash: "CommandDash",
      origin_status: "ANSWERED",
      response_path: rel(join(COMMAND_DASH_RESPONSES, `${slug(sourceId)}.json`)),
      dashboard_state_path: rel(COMMAND_DASH_STATE),
    };
  }

  if (originSurface === "ThinkIt") {
    return {
      ...base,
      origin_dash: "ThinkIt",
      origin_status: "ANSWERED",
      response_path: rel(THINKIT_ANSWERS),
      dashboard_state_path: rel(THINKIT_QUESTIONS),
    };
  }

  return {
    ...base,
    origin_dash: originSurface,
    origin_status: "ANSWERED",
    response_path: rel(ORIGIN_RESPONSES),
    dashboard_state_path: rel(ORIGIN_RESPONSES),
  };
}

async function updateThinkIt(responses) {
  const thinkitResponses = responses.filter((response) => response.source_surface === "ThinkIt");
  if (!thinkitResponses.length) return;

  const questions = await readJson(THINKIT_QUESTIONS, []);
  if (Array.isArray(questions)) {
    const answered = new Set(thinkitResponses.map((response) => response.source_id));
    const updated = questions.map((question) => {
      if (!answered.has(question.question_id)) return question;
      return { ...question, status: "ANSWERED" };
    });
    await writeJson(THINKIT_QUESTIONS, updated);
  }

  const existingAnswers = await readJson(THINKIT_ANSWERS, []);
  const byId = new Map((Array.isArray(existingAnswers) ? existingAnswers : []).map((answer) => [answer.response_id, answer]));
  for (const response of thinkitResponses) {
    byId.set(response.response_id, response);
  }
  await writeJson(THINKIT_ANSWERS, [...byId.values()].sort((left, right) => left.delivered_at.localeCompare(right.delivered_at) || left.response_id.localeCompare(right.response_id)));
}

async function updateCommandDash(responses) {
  const commandResponses = responses.filter((response) => response.source_surface === "CommandDash");
  if (!commandResponses.length) return;

  await mkdir(COMMAND_DASH_RESPONSES, { recursive: true });
  for (const response of commandResponses) {
    await writeJson(join(COMMAND_DASH_RESPONSES, `${slug(response.source_id)}.json`), response);
  }

  const state = {
    artifact_id: "COMMAND_DASH_RESPONSE_STATE_V0",
    updated_at: RUN_TIME,
    response_count: commandResponses.length,
    responses: commandResponses.sort((left, right) => left.source_id.localeCompare(right.source_id)),
  };
  await writeJson(COMMAND_DASH_STATE, state);
}

async function run() {
  const answers = (await readJsonl(ANSWER_PICKUP)).filter((answer) => answer?.event_type === "answer_received" && answer.packet_id);
  const packets = await packetsById();
  const responses = answers.map((answer) => makeResponse(answer, packets.get(answer.packet_id)));

  await updateThinkIt(responses);
  await updateCommandDash(responses);
  await writeJson(ORIGIN_RESPONSES, {
    artifact_id: "ORIGIN_DASH_RESPONSES_V0",
    updated_at: RUN_TIME,
    response_count: responses.length,
    responses,
  });

  const existing = await readJsonl(ORIGIN_BUS);
  const currentIds = new Set(responses.map((response) => response.response_id));
  const kept = existing.filter((row) => !currentIds.has(row.response_id));
  await writeJsonl(ORIGIN_BUS, [...kept, ...responses]);
  await writeJson(ORIGIN_STATE, {
    artifact_id: "ORIGIN_RESPONSE_RETURN_STATE_V0",
    updated_at: RUN_TIME,
    answer_pickup_rows_seen: answers.length,
    origin_responses_written: responses.length,
    origin_bus: rel(ORIGIN_BUS),
    origin_response_index: rel(ORIGIN_RESPONSES),
    thinkit_answers: rel(THINKIT_ANSWERS),
    command_dash_state: rel(COMMAND_DASH_STATE),
  });

  console.log(`returned ${responses.length} Aeye answer${responses.length === 1 ? "" : "s"} to origin dash`);
  console.log(`origin response bus: ${rel(ORIGIN_BUS)}`);
  console.log(`origin response index: ${rel(ORIGIN_RESPONSES)}`);
}

await run();
