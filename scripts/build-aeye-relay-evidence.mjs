import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUTPUT = join(ROOT, "foreman", "artifacts", "aeye_relay_evidence.json");
const MANIFEST = join(ROOT, "foreman", "artifacts", "aeye_relay_manifest.json");
const PACKET_INBOX = join(ROOT, "foreman", "artifacts", "packet_inbox.json");
const DISPATCH_LOG = join(ROOT, "data", "organism", "aeye_dispatch.jsonl");
const AEYE_EVENTS = join(ROOT, "data", "organism", "aeye_events.jsonl");
const EXTERNAL_EVENTS = join(ROOT, "data", "organism", "aeye_external_events.jsonl");
const ANSWER_PICKUP = join(ROOT, "data", "organism", "aeye_answer_pickup.jsonl");
const ORIGIN_BUS = join(ROOT, "data", "organism", "origin_response_bus.jsonl");
const ORIGIN_RESPONSES = join(ROOT, "foreman", "artifacts", "origin_dash_responses.json");
const GENERATED_AT = new Date().toISOString();

const CRITERIA = [
  {
    id: "A",
    requirement: "A new chat exists in any Aeye anywhere.",
    required_events: ["aeye_chat_created"],
    missing: "No external Aeye chat id, URL, thread id, or window proof is recorded.",
  },
  {
    id: "B",
    requirement: "A new query was submitted to an Aeye.",
    required_events: ["aeye_query_sent"],
    missing: "No query submission event from ChatGPT, Claude, Perplexity, DeepSeek, Gemini, Codex, Cursor, or another Aeye is recorded.",
  },
  {
    id: "C",
    requirement: "Activity originated from Nerdkle Organism prompting.",
    required_events: ["nerdkle_prompt_activity"],
    missing: "No external activity is tied to a Nerdkle Organism prompt origin.",
  },
  {
    id: "D",
    requirement: "A packet left the local Command Dash / TinkerDen relay.",
    required_events: ["packet_left_relay_boundary", "packet_left_local_system", "aeye_query_sent"],
    missing: "Only local file dispatch exists; no proof shows the packet crossed a relay boundary into an Aeye receiver.",
  },
  {
    id: "E",
    requirement: "The packet was received by an Aeye.",
    required_events: ["aeye_receipt_ack", "aeye_query_visible"],
    missing: "No external Aeye receipt, visible query, chat transcript, or platform acknowledgement is recorded.",
  },
  {
    id: "F",
    requirement: "The Aeye answered.",
    required_events: ["aeye_answer_observed"],
    missing: "No answer from an Aeye is recorded.",
  },
  {
    id: "G",
    requirement: "The answer was received back into the organism.",
    required_events: ["answer_received"],
    missing: "No answer pickup, receipt import, or ledger ingestion event is recorded.",
  },
];

function rel(path) {
  return relative(ROOT, path).replace(/\\/g, "/");
}

async function readJson(path, fallback) {
  const raw = await readFile(path, "utf8").catch(() => "");
  if (!raw.trim()) return fallback;
  return JSON.parse(raw);
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

function eventsFor(events, types) {
  return events.filter((event) => types.includes(event.event_type));
}

function eventScopeRank(event) {
  if (event.evidence_scope === "external_platform") return 3;
  if (event.evidence_scope === "local_daemon") return 2;
  return 1;
}

function criterionStatus(criterion, events) {
  const evidence = eventsFor(events, criterion.required_events);
  const strongestScope = evidence.reduce((best, event) => Math.max(best, eventScopeRank(event)), 0);
  const status = strongestScope === 3
    ? "PASS_EXTERNAL_PLATFORM"
    : strongestScope === 2
      ? "PASS_LOCAL_DAEMON"
      : evidence.length > 0
        ? "PASS_UNSCOPED"
        : "FAIL";

  return {
    id: criterion.id,
    requirement: criterion.requirement,
    status,
    required_events: criterion.required_events,
    evidence,
    missing: status === "FAIL" ? criterion.missing : "",
  };
}

const [manifest, packetInbox, dispatchEvents, aeyeEvents, externalEvents, answerPickup, originBus, originResponses] = await Promise.all([
  readJson(MANIFEST, {}),
  readJson(PACKET_INBOX, []),
  readJsonl(DISPATCH_LOG),
  readJsonl(AEYE_EVENTS),
  readJsonl(EXTERNAL_EVENTS),
  readJsonl(ANSWER_PICKUP),
  readJsonl(ORIGIN_BUS),
  readJson(ORIGIN_RESPONSES, { responses: [] }),
]);

const allEvents = [...aeyeEvents, ...externalEvents];
const criteria = CRITERIA.map((criterion) => criterionStatus(criterion, allEvents));
const allExternalPass = criteria.every((criterion) => criterion.status === "PASS_EXTERNAL_PLATFORM");
const allLocalPass = criteria.every((criterion) => criterion.status === "PASS_LOCAL_DAEMON" || criterion.status === "PASS_EXTERNAL_PLATFORM");
const anyPass = criteria.some((criterion) => criterion.status.startsWith("PASS"));
const answerPacketIds = new Set(answerPickup.filter((row) => row?.event_type === "answer_received").map((row) => row.packet_id));
const originPacketIds = new Set(originBus.filter((row) => row?.event_type === "origin_response_delivered").map((row) => row.packet_id));
const originResponseRows = Array.isArray(originResponses?.responses) ? originResponses.responses : [];
const originReturnedAll = answerPacketIds.size > 0 && [...answerPacketIds].every((packetId) => originPacketIds.has(packetId));
const originReturnStatus = originReturnedAll ? "PASS_ORIGIN_DASH_RETURN_PROVEN" : "FAIL_ORIGIN_DASH_RETURN_NOT_PROVEN";

const evidence = {
  artifact_id: "AEYE_RELAY_EVIDENCE_V0",
  generated_at: GENERATED_AT,
  overall_status: allExternalPass
    ? originReturnedAll
      ? "PASS_EXTERNAL_PLATFORM_FULL_RETURN_LOOP_PROVEN"
      : "PASS_EXTERNAL_PLATFORM_AEYE_LOOP_PROVEN"
    : allLocalPass
      ? originReturnedAll
        ? "PASS_LOCAL_DAEMON_FULL_RETURN_LOOP_PROVEN"
        : "PASS_LOCAL_DAEMON_AEYE_LOOP_PROVEN"
      : "FAIL_NO_COMPLETE_AEYE_LOOP_PROOF",
  success_definition: "External platform proof requires A-G evidence_scope=external_platform. Local daemon proof requires A-G evidence_scope=local_daemon or stronger. Full return proof also requires every answer pickup to be delivered back to its origin dash artifact.",
  criteria,
  local_only_activity: {
    status: anyPass
      ? "LOCAL_AEYE_DAEMON_ACTIVITY"
      : dispatchEvents.length > 0 && Array.isArray(packetInbox) && packetInbox.length > 0
        ? "LOCAL_FILES_ONLY"
        : "NO_LOCAL_PACKET_ACTIVITY",
    packet_inbox_entries: Array.isArray(packetInbox) ? packetInbox.length : 0,
    dispatch_log_rows: dispatchEvents.length,
    aeye_event_rows: aeyeEvents.length,
    external_event_rows: externalEvents.length,
    answer_pickup_rows: answerPickup.length,
    manifest_packets_written: Number(manifest?.packets_written || 0),
    note: allExternalPass
      ? "External platform loop is proven by recorded A-G events."
      : allLocalPass
        ? "Local Aeye daemon loop is proven. This still does not prove a third-party Aeye platform chat."
        : "This proves local packet serialization and indexing only. It does not prove any Aeye saw, answered, or returned the packet.",
  },
  origin_return: {
    status: originReturnStatus,
    answer_pickup_packet_count: answerPacketIds.size,
    origin_response_packet_count: originPacketIds.size,
    origin_response_index_count: originResponseRows.length,
    origin_response_bus_rows: originBus.length,
    returned_packet_ids: [...originPacketIds].sort(),
    missing_packet_ids: [...answerPacketIds].filter((packetId) => !originPacketIds.has(packetId)).sort(),
    note: originReturnedAll
      ? "Every answer pickup row has a delivered response back to its origin dash artifact."
      : "At least one answer pickup row has not been delivered back to an origin dash artifact.",
  },
  source_files: {
    manifest: rel(MANIFEST),
    packet_inbox: rel(PACKET_INBOX),
    dispatch_log: rel(DISPATCH_LOG),
    aeye_events: rel(AEYE_EVENTS),
    external_events: rel(EXTERNAL_EVENTS),
    answer_pickup: rel(ANSWER_PICKUP),
    origin_response_bus: rel(ORIGIN_BUS),
    origin_responses: rel(ORIGIN_RESPONSES),
  },
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
console.log(`wrote Aeye relay evidence to ${rel(OUTPUT)} with status ${evidence.overall_status}`);
