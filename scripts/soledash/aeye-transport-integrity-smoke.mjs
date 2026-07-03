const baseUrl = process.env.SOLEDASH_BASE_URL ?? "http://127.0.0.1:3000";
const runId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

async function post(body) {
  const res = await fetch(`${baseUrl}/api/soledash/v1/wonka-den/aeye-loop`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { http_status: res.status, json };
}

function assertCase(name, actual, predicate) {
  const pass = predicate(actual);
  return {
    name,
    pass,
    actual
  };
}

const duplicatePacketId = `packet_integrity_duplicate_${runId}`;
const mismatchPacketId = `packet_integrity_sender_${runId}`;

const blank = await post({ task_text: "   " });
const unknownAeye = await post({ packet_id: `packet_unknown_${runId}`, task_text: "ping", target_aeye: "NotAnAeye" });
const unavailable = await post({
  packet_id: `packet_unavailable_${runId}`,
  task_text: "ping",
  target_aeye: "Dink",
  target_machine: "Spanzee"
});
const duplicateFirst = await post({ packet_id: duplicatePacketId, task_text: "ping Dink" });
const duplicateSecond = await post({ packet_id: duplicatePacketId, task_text: "ping Dink again" });
const orphanReceipt = await post({
  mode: "receipt_only",
  packet_id: `packet_orphan_${runId}`,
  from_aeye: "Dink",
  from_machine: "Betsy",
  receipt_message: "orphan receipt attempt"
});
const mismatchFirst = await post({ packet_id: mismatchPacketId, task_text: "ping Dink" });
const senderMismatch = await post({
  mode: "receipt_only",
  packet_id: mismatchPacketId,
  receipt_id: `receipt_sender_mismatch_${runId}`,
  from_aeye: "Petra",
  from_machine: "Betsy",
  receipt_message: "wrong sender attempt"
});
const missingOutbox = await post({ mode: "verify_sent", packet_id: `packet_missing_outbox_${runId}` });

const results = [
  assertCase("blank task", blank, (r) => r.json.verdict === "STOP" && r.json.reason === "EMPTY_PAYLOAD"),
  assertCase("unknown aeye", unknownAeye, (r) => r.json.verdict === "STOP" && r.json.reason === "UNKNOWN_AEYE"),
  assertCase(
    "unavailable machine",
    unavailable,
    (r) =>
      r.json.verdict === "STOP" &&
      r.json.reason === "MACHINE_UNAVAILABLE" &&
      r.json.status === "PENDING_RECIPIENT_AVAILABILITY" &&
      r.json.packet?.status === "PENDING_RECIPIENT_AVAILABILITY"
  ),
  assertCase("duplicate setup send", duplicateFirst, (r) => r.json.ok === true && r.json.message_packet?.status === "SENT"),
  assertCase("duplicate packet_id", duplicateSecond, (r) => r.json.verdict === "STOP" && r.json.reason === "DUPLICATE_PACKET_ID"),
  assertCase("orphan receipt", orphanReceipt, (r) => r.json.verdict === "STOP" && r.json.reason === "ORPHAN_RECEIPT"),
  assertCase("sender mismatch setup send", mismatchFirst, (r) => r.json.ok === true && r.json.message_packet?.status === "SENT"),
  assertCase("response from wrong aeye", senderMismatch, (r) => r.json.verdict === "STOP" && r.json.reason === "SENDER_MISMATCH"),
  assertCase("sent without outbox file", missingOutbox, (r) => r.json.verdict === "STOP" && r.json.reason === "OUTBOX_FILE_MISSING")
];

const failed = results.filter((result) => !result.pass);
const report = {
  ok: failed.length === 0,
  base_url: baseUrl,
  run_id: runId,
  results
};

console.log(JSON.stringify(report, null, 2));
if (failed.length > 0) process.exit(1);
