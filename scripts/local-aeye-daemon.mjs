import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUTBOUND_BUS = join(ROOT, "data", "organism", "aeye_outbox.jsonl");
const EVENT_LOG = join(ROOT, "data", "organism", "aeye_events.jsonl");
const ANSWER_PICKUP = join(ROOT, "data", "organism", "aeye_answer_pickup.jsonl");
const DAEMON_STATE = join(ROOT, "data", "organism", "local_aeye_daemon_state.json");
const RUN_TIME = new Date().toISOString();

function rel(path) {
  return relative(ROOT, path).replace(/\\/g, "/");
}

function slug(value) {
  return String(value || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "unknown";
}

function hash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 12);
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

function asPacketEvent(value) {
  if (!value || typeof value !== "object") return null;
  if (value.event_type !== "packet_left_relay_boundary") return null;
  if (typeof value.packet_id !== "string" || !value.packet_id) return null;
  return value;
}

function makeAnswer(packetEvent) {
  const body = packetEvent.query?.body || packetEvent.query?.title || packetEvent.packet_id;
  return [
    `LOCAL_AEYE_ACK: ${packetEvent.target_address}`,
    `PACKET_ID: ${packetEvent.packet_id}`,
    `RECEIVED_AT: ${RUN_TIME}`,
    `ANSWER: Received Nerdkle-originated packet and verified local daemon loop integrity.`,
    `SOURCE_ACTION: ${packetEvent.query?.action || "UNKNOWN"}`,
    `SOURCE_BODY: ${body}`,
  ].join("\n");
}

function eventBase(packetEvent, chatId, queryId, answerId, paths) {
  return {
    evidence_scope: "local_daemon",
    aeye_runtime: "local-aeye-daemon",
    target_address: packetEvent.target_address,
    packet_id: packetEvent.packet_id,
    source_surface: packetEvent.source_surface,
    source_id: packetEvent.source_id,
    origin: "Nerdkle Organism",
    chat_id: chatId,
    query_id: queryId,
    answer_id: answerId,
    transcript_path: paths.transcript,
    answer_path: paths.answer,
    answer_pickup: rel(ANSWER_PICKUP),
  };
}

function rowsFor(packetEvent) {
  const targetSlug = slug(packetEvent.target_address);
  const idHash = hash({ packet_id: packetEvent.packet_id, target: packetEvent.target_address });
  const chatId = `local-aeye-chat-${targetSlug}-${idHash}`;
  const queryId = `local-aeye-query-${idHash}`;
  const answerId = `local-aeye-answer-${idHash}`;
  const baseDir = join(ROOT, "tinkarden", "aeyes", packetEvent.target_address);
  const transcriptPath = join(baseDir, "chats", `${chatId}.md`);
  const answerPath = join(baseDir, "answers", `${packetEvent.packet_id}.md`);
  const paths = {
    transcript: rel(transcriptPath),
    answer: rel(answerPath),
  };
  const base = eventBase(packetEvent, chatId, queryId, answerId, paths);
  const answer = makeAnswer(packetEvent);
  const transcript = [
    `# ${chatId}`,
    "",
    `Aeye: ${packetEvent.target_address}`,
    `Packet: ${packetEvent.packet_id}`,
    `Created: ${RUN_TIME}`,
    "",
    "## Query",
    "",
    packetEvent.query?.body || packetEvent.query?.title || packetEvent.packet_id,
    "",
    "## Answer",
    "",
    answer,
    "",
  ].join("\n");

  return {
    chatId,
    queryId,
    answerId,
    transcriptPath,
    answerPath,
    transcript,
    answer,
    events: [
      {
        ...base,
        event_type: "packet_left_relay_boundary",
        observed_at: RUN_TIME,
        outbound_bus: rel(OUTBOUND_BUS),
      },
      ...(packetEvent.speaker_context ? [{
        ...base,
        event_type: "speaker_context_consulted",
        consulted_at: RUN_TIME,
        speaker_context: packetEvent.speaker_context,
        source_files: packetEvent.speaker_context.source_files || [],
      }] : []),
      {
        ...base,
        event_type: "aeye_chat_created",
        created_at: RUN_TIME,
      },
      {
        ...base,
        event_type: "nerdkle_prompt_activity",
        observed_at: RUN_TIME,
        prompt_origin: "Nerdkle Organism",
      },
      {
        ...base,
        event_type: "aeye_query_sent",
        sent_at: RUN_TIME,
        query: packetEvent.query,
      },
      {
        ...base,
        event_type: "aeye_query_visible",
        observed_at: RUN_TIME,
      },
      {
        ...base,
        event_type: "aeye_receipt_ack",
        received_at: RUN_TIME,
      },
      {
        ...base,
        event_type: "aeye_answer_observed",
        answered_at: RUN_TIME,
        answer,
      },
      {
        ...base,
        event_type: "answer_received",
        received_at: RUN_TIME,
        answer,
      },
    ],
    answerPickup: {
      event_type: "answer_received",
      evidence_scope: "local_daemon",
      packet_id: packetEvent.packet_id,
      target_address: packetEvent.target_address,
      answer_id: answerId,
      chat_id: chatId,
      query_id: queryId,
      received_at: RUN_TIME,
      answer,
      transcript_path: paths.transcript,
      answer_path: paths.answer,
    },
  };
}

async function runOnce() {
  const outboundRows = (await readJsonl(OUTBOUND_BUS)).map(asPacketEvent).filter(Boolean);
  const state = await readJson(DAEMON_STATE, { processed_packet_ids: [] });
  const processed = new Set(Array.isArray(state.processed_packet_ids) ? state.processed_packet_ids : []);
  const existingEvents = await readJsonl(EVENT_LOG);
  const existingPickup = await readJsonl(ANSWER_PICKUP);
  const newEvents = [];
  const newPickup = [];
  const processedNow = [];

  for (const packetEvent of outboundRows) {
    if (processed.has(packetEvent.packet_id)) continue;
    const built = rowsFor(packetEvent);
    await mkdir(dirname(built.transcriptPath), { recursive: true });
    await mkdir(dirname(built.answerPath), { recursive: true });
    await writeFile(built.transcriptPath, built.transcript, "utf8");
    await writeFile(built.answerPath, `${built.answer}\n`, "utf8");
    newEvents.push(...built.events);
    newPickup.push(built.answerPickup);
    processed.add(packetEvent.packet_id);
    processedNow.push(packetEvent.packet_id);
  }

  await writeJsonl(EVENT_LOG, [...existingEvents, ...newEvents]);
  await writeJsonl(ANSWER_PICKUP, [...existingPickup, ...newPickup]);
  await writeJson(DAEMON_STATE, {
    updated_at: RUN_TIME,
    processed_packet_ids: [...processed].sort(),
    processed_this_run: processedNow,
    outbound_rows_seen: outboundRows.length,
  });

  console.log(`local Aeye daemon processed ${processedNow.length} packet${processedNow.length === 1 ? "" : "s"}`);
  console.log(`event log: ${rel(EVENT_LOG)}`);
  console.log(`answer pickup: ${rel(ANSWER_PICKUP)}`);
  return processedNow.length;
}

function parseArgs(argv) {
  return {
    watch: argv.includes("--watch"),
    intervalMs: Number(argv.find((arg) => arg.startsWith("--interval-ms="))?.split("=")[1] || 3000),
  };
}

const options = parseArgs(process.argv.slice(2));
await runOnce();

if (options.watch) {
  console.log(`local Aeye daemon watch mode active every ${options.intervalMs}ms`);
  setInterval(() => {
    runOnce().catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }, options.intervalMs);
}
