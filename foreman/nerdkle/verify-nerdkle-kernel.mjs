#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

const REQUIRED_SPEAKER_FILES = [
  "foreman/speaker/SPEAKER_CHARTER.md",
  "foreman/speaker/SPEAKER_DOCTRINE.md",
  "foreman/speaker/CAUSAL_LEDGER.md",
  "foreman/speaker/AEYE_ROLE_REGISTRY.md",
  "foreman/speaker/GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md",
];

const REQUIRED_LOOP_EVENTS = [
  "packet_left_relay_boundary",
  "aeye_chat_created",
  "nerdkle_prompt_activity",
  "aeye_query_sent",
  "aeye_query_visible",
  "aeye_receipt_ack",
  "aeye_answer_observed",
  "answer_received",
];

const OUTPUT_PATH = "foreman/artifacts/nerdkle_kernel_v0_status.json";
const THREAD_CLAIMS_STATUS_PATH = "foreman/artifacts/thread_identity_claims_status.json";
const GITHUB_SOURCE_STATUS_PATH = "foreman/artifacts/nerdkle_github_source_material_status.json";
const MATERIALIZED_SOURCE_STATUS_PATH = "foreman/artifacts/nerdkle_materialized_source_status.json";
const SOURCE_WORK_QUEUE_PATH = "foreman/artifacts/nerdkle_source_work_queue.json";
const NMCLR_SANDBOX_STATUS_PATH = "foreman/artifacts/nmclr_sandbox_execution_status.json";

function abs(relPath) {
  return path.join(ROOT, relPath);
}

function exists(relPath) {
  return fs.existsSync(abs(relPath));
}

function readText(relPath) {
  return fs.readFileSync(abs(relPath), "utf8");
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

function readJsonl(relPath) {
  if (!exists(relPath)) return [];
  return readText(relPath)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        const err = new Error(`${relPath}:${index + 1} is not valid JSONL: ${error.message}`);
        err.code = "BAD_JSONL";
        throw err;
      }
    });
}

function listFiles(relDir) {
  if (!exists(relDir)) return [];
  return fs.readdirSync(abs(relDir), { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(relDir, entry.name).replace(/\\/g, "/"));
}

function statusCheck(id, status, evidence = [], missing = []) {
  return { id, status, evidence, missing };
}

function validateSpeakerReceipt(receipt) {
  const missing = [];
  for (const field of ["receipt_id", "receipt_type", "created_at", "source", "payload", "metadata"]) {
    if (!Object.prototype.hasOwnProperty.call(receipt, field)) missing.push(field);
  }

  if (receipt.receipt_type && !["DECISION", "ARTIFACT"].includes(receipt.receipt_type)) {
    missing.push("valid_receipt_type");
  }
  if (!receipt.source || receipt.source.machine !== "Sally") missing.push("source.machine=Sally");
  if (!receipt.source || !/^[a-f0-9]{64}$/.test(receipt.source.content_sha256 || "")) {
    missing.push("source.content_sha256");
  }
  if (!receipt.payload || !Array.isArray(receipt.payload.flags)) missing.push("payload.flags");
  if (!receipt.metadata || receipt.metadata.schema_id !== "speaker.receipt.schema.v1") {
    missing.push("metadata.schema_id");
  }

  return missing;
}

function eventTime(event) {
  return event.observed_at
    || event.created_at
    || event.sent_at
    || event.received_at
    || event.answered_at
    || event.delivered_at
    || "";
}

function groupByPacket(events) {
  const grouped = new Map();
  for (const event of events) {
    if (!event.packet_id) continue;
    const group = grouped.get(event.packet_id) || [];
    group.push(event);
    grouped.set(event.packet_id, group);
  }
  return grouped;
}

function summarizeLoop(packetId, events, originResponses) {
  const types = new Set(events.map((event) => event.event_type));
  const missingEvents = REQUIRED_LOOP_EVENTS.filter((eventType) => !types.has(eventType));
  const originResponse = originResponses.find((event) => event.packet_id === packetId);
  const targetAddress = events.find((event) => event.target_address)?.target_address || originResponse?.target_address || "UNKNOWN";
  const answerEvent = events.find((event) => event.event_type === "aeye_answer_observed");

  return {
    packet_id: packetId,
    target_address: targetAddress,
    status: missingEvents.length === 0 && originResponse ? "PASS_LOCAL" : "PARTIAL_LOCAL",
    missing: [
      ...missingEvents,
      ...(originResponse ? [] : ["origin_response_delivered"]),
    ],
    evidence: {
      event_types: [...types].sort(),
      origin_response_id: originResponse?.response_id || null,
      answer_id: answerEvent?.answer_id || originResponse?.answer_id || null,
      chat_id: answerEvent?.chat_id || originResponse?.chat_id || null,
      latest_observed_at: events.map(eventTime).filter(Boolean).sort().at(-1) || null,
    },
  };
}

function main() {
  const checks = [];

  const speakerMissing = REQUIRED_SPEAKER_FILES.filter((relPath) => !exists(relPath));
  const ledgerText = exists("foreman/speaker/CAUSAL_LEDGER.md")
    ? readText("foreman/speaker/CAUSAL_LEDGER.md")
    : "";
  const ledgerEntryCount = (ledgerText.match(/DRAFT_20[0-9]{6}/g) || []).length;
  checks.push(statusCheck(
    "speaker_causal_memory_office",
    speakerMissing.length || ledgerEntryCount === 0 ? "FAIL" : "PASS_LOCAL",
    REQUIRED_SPEAKER_FILES.filter(exists),
    [
      ...speakerMissing,
      ...(ledgerEntryCount === 0 ? ["causal_ledger_entries"] : []),
    ],
  ));

  const registry = readJson("foreman/nerdkle/thread_registry.json");
  const targetAddresses = new Set((registry.targets || []).map((target) => target.address));
  const routeMissing = ["Dink@Sally", "Thufir@Sally", "Bean@Sally", "Ender@Betsy"]
    .filter((address) => !targetAddresses.has(address));
  const missingExternalThreads = (registry.targets || [])
    .filter((target) => target.external_thread_id == null)
    .map((target) => target.address);
  checks.push(statusCheck(
    "thread_registry_local_routes",
    routeMissing.length ? "FAIL" : "PASS_LOCAL",
    ["foreman/nerdkle/thread_registry.json"],
    routeMissing.map((address) => `missing_route:${address}`),
  ));

  const threadClaimStatus = exists(THREAD_CLAIMS_STATUS_PATH)
    ? readJson(THREAD_CLAIMS_STATUS_PATH)
    : null;
  const acceptedThreadClaims = Number(threadClaimStatus?.accepted_count || 0);
  const acceptedExternalThreadClaims = Number(threadClaimStatus?.accepted_external_count || 0);
  const claimMissingExternalThreads = Array.isArray(threadClaimStatus?.missing_external_thread_ids)
    ? threadClaimStatus.missing_external_thread_ids
    : missingExternalThreads;
  checks.push(statusCheck(
    "thread_identity_claim_intake",
    acceptedThreadClaims > 0 ? "PASS_LOCAL" : "PARTIAL_LOCAL",
    threadClaimStatus ? [THREAD_CLAIMS_STATUS_PATH] : [],
    threadClaimStatus
      ? acceptedThreadClaims > 0 ? [] : ["accepted_thread_identity_claim"]
      : [THREAD_CLAIMS_STATUS_PATH],
  ));
  checks.push(statusCheck(
    "thread_registry_external_identity",
    claimMissingExternalThreads.length ? "PARTIAL_LOCAL" : "PASS_EXTERNAL",
    [
      "foreman/nerdkle/thread_registry.json",
      ...(threadClaimStatus ? [THREAD_CLAIMS_STATUS_PATH] : []),
    ],
    claimMissingExternalThreads.map((address) => `missing_external_thread_id:${address}`),
  ));

  const githubSourceStatus = exists(GITHUB_SOURCE_STATUS_PATH)
    ? readJson(GITHUB_SOURCE_STATUS_PATH)
    : null;
  const verifiedGithubSourceCount = Number(githubSourceStatus?.verified_count || 0);
  const requiredGithubSourceIds = [
    "github-book-architecture-stream-split-v0-20260627",
    "github-nerdkle-nervous-system-organs-v0-20260627",
    "github-nmclr-proof-body-preserve-v0-20260627",
    "github-receipt-crawler-v0-20260627",
  ];
  const verifiedGithubSourceIds = new Set(githubSourceStatus?.source_ids || []);
  const missingGithubSourceIds = requiredGithubSourceIds
    .filter((sourceId) => !verifiedGithubSourceIds.has(sourceId));
  checks.push(statusCheck(
    "github_source_material_intake",
    verifiedGithubSourceCount > 0 ? "PASS_LOCAL" : "PARTIAL_LOCAL",
    githubSourceStatus ? [GITHUB_SOURCE_STATUS_PATH] : [],
    githubSourceStatus
      ? verifiedGithubSourceCount > 0 ? [] : ["verified_github_source_material"]
      : [GITHUB_SOURCE_STATUS_PATH],
  ));
  checks.push(statusCheck(
    "github_nerdkle_review_sources",
    missingGithubSourceIds.length ? "PARTIAL_LOCAL" : "PASS_LOCAL",
    githubSourceStatus ? [GITHUB_SOURCE_STATUS_PATH] : [],
    missingGithubSourceIds.map((sourceId) => `missing_github_source:${sourceId}`),
  ));
  checks.push(statusCheck(
    "github_source_promotion_boundary",
    githubSourceStatus && Number(githubSourceStatus.canonical_count || 0) === 0 ? "PASS_LOCAL" : "PARTIAL_LOCAL",
    githubSourceStatus ? [GITHUB_SOURCE_STATUS_PATH] : [],
    githubSourceStatus
      ? Number(githubSourceStatus.canonical_count || 0) === 0
        ? []
        : ["review_sources_marked_canonical_without_human_promotion_gate"]
      : [GITHUB_SOURCE_STATUS_PATH],
  ));

  const materializedSourceStatus = exists(MATERIALIZED_SOURCE_STATUS_PATH)
    ? readJson(MATERIALIZED_SOURCE_STATUS_PATH)
    : null;
  const materializedSourceCount = Number(materializedSourceStatus?.materialized_count || 0);
  checks.push(statusCheck(
    "github_source_materialized_snapshots",
    materializedSourceCount > 0 ? "PASS_LOCAL" : "PARTIAL_LOCAL",
    materializedSourceStatus ? [MATERIALIZED_SOURCE_STATUS_PATH] : [],
    materializedSourceStatus
      ? materializedSourceCount > 0 ? [] : ["materialized_github_source_snapshots"]
      : [MATERIALIZED_SOURCE_STATUS_PATH],
  ));

  const sourceWorkQueue = exists(SOURCE_WORK_QUEUE_PATH)
    ? readJson(SOURCE_WORK_QUEUE_PATH)
    : null;
  const readyQueueCount = Number(sourceWorkQueue?.ready_count || 0);
  checks.push(statusCheck(
    "github_source_work_queue",
    readyQueueCount > 0 ? "PASS_LOCAL" : "PARTIAL_LOCAL",
    sourceWorkQueue ? [SOURCE_WORK_QUEUE_PATH] : [],
    sourceWorkQueue
      ? readyQueueCount > 0 ? [] : ["ready_source_work_queue_item"]
      : [SOURCE_WORK_QUEUE_PATH],
  ));

  const nmclrSandboxStatus = exists(NMCLR_SANDBOX_STATUS_PATH)
    ? readJson(NMCLR_SANDBOX_STATUS_PATH)
    : null;
  const nmclrSandboxPass = nmclrSandboxStatus?.status === "PASS_NMCLR_SANDBOX_EXECUTION_PROOF"
    && nmclrSandboxStatus?.causal_chain?.pass === true
    && nmclrSandboxStatus?.movement_chain?.pass === true;
  checks.push(statusCheck(
    "nmclr_sandbox_execution_proof",
    nmclrSandboxPass ? "PASS_LOCAL" : "PARTIAL_LOCAL",
    nmclrSandboxPass ? [NMCLR_SANDBOX_STATUS_PATH] : [],
    nmclrSandboxPass ? [] : [NMCLR_SANDBOX_STATUS_PATH],
  ));

  const aeyeEvents = readJsonl("data/organism/aeye_events.jsonl");
  const originResponses = readJsonl("data/organism/origin_response_bus.jsonl");
  checks.push(statusCheck(
    "organism_event_bus",
    aeyeEvents.length && originResponses.length ? "PASS_LOCAL" : "FAIL",
    [
      aeyeEvents.length ? "data/organism/aeye_events.jsonl" : null,
      originResponses.length ? "data/organism/origin_response_bus.jsonl" : null,
    ].filter(Boolean),
    [
      ...(aeyeEvents.length ? [] : ["aeye_events"]),
      ...(originResponses.length ? [] : ["origin_response_bus"]),
    ],
  ));

  const grouped = groupByPacket(aeyeEvents);
  const loops = [...grouped.entries()]
    .map(([packetId, events]) => summarizeLoop(packetId, events, originResponses))
    .sort((left, right) => String(right.evidence.latest_observed_at).localeCompare(String(left.evidence.latest_observed_at)));
  const completeLoops = loops.filter((loop) => loop.status === "PASS_LOCAL");
  checks.push(statusCheck(
    "local_aeye_return_loop",
    completeLoops.length ? "PASS_LOCAL" : loops.length ? "PARTIAL_LOCAL" : "FAIL",
    completeLoops.slice(0, 3).map((loop) => loop.packet_id),
    completeLoops.length ? [] : ["complete_local_return_loop"],
  ));

  const receiptPaths = listFiles("speaker/receipts/raw/inbox").filter((file) => file.endsWith(".json"));
  const receiptResults = receiptPaths.map((receiptPath) => {
    const receipt = readJson(receiptPath);
    return {
      path: receiptPath,
      receipt_id: receipt.receipt_id || null,
      missing: validateSpeakerReceipt(receipt),
    };
  });
  const validReceipts = receiptResults.filter((receipt) => receipt.missing.length === 0);
  checks.push(statusCheck(
    "speaker_schema_valid_receipts",
    validReceipts.length ? "PASS_LOCAL" : "FAIL",
    validReceipts.map((receipt) => receipt.path),
    validReceipts.length ? [] : ["schema_valid_speaker_receipt"],
  ));

  const speakerConsultedInRelay = aeyeEvents.some((event) => event.event_type === "speaker_context_consulted");
  checks.push(statusCheck(
    "speaker_consulted_before_relay",
    speakerConsultedInRelay ? "PASS_LOCAL" : "PARTIAL_LOCAL",
    speakerConsultedInRelay ? ["data/organism/aeye_events.jsonl:speaker_context_consulted"] : [],
    speakerConsultedInRelay ? [] : ["speaker_context_consulted_event"],
  ));

  const failureStatuses = new Set(["FAIL", "BLOCKED"]);
  const hasFailure = checks.some((check) => failureStatuses.has(check.status));
  const hasPartial = checks.some((check) => check.status === "PARTIAL_LOCAL");
  const overallStatus = hasFailure
    ? "FAIL"
    : hasPartial
      ? "PASS_LOCAL_WITH_EXTERNAL_BLOCKERS"
      : "PASS_LOCAL";

  const report = {
    artifact_id: "NERDKLE_KERNEL_V0_STATUS",
    generated_at: new Date().toISOString(),
    overall_status: overallStatus,
    rule: "Evidence-only. Missing proof is reported, not inferred.",
    checks,
    latest_complete_loop: completeLoops[0] || null,
    loop_count: loops.length,
    complete_loop_count: completeLoops.length,
    receipt_count: receiptResults.length,
    valid_receipt_count: validReceipts.length,
    thread_identity_claim_status: threadClaimStatus
      ? {
        status: threadClaimStatus.status,
        accepted_count: acceptedThreadClaims,
        accepted_external_count: acceptedExternalThreadClaims,
        missing_external_thread_ids: claimMissingExternalThreads,
      }
      : null,
    github_source_material_status: githubSourceStatus
      ? {
        status: githubSourceStatus.status,
        verified_count: githubSourceStatus.verified_count,
        blocked_count: githubSourceStatus.blocked_count,
        canonical_count: githubSourceStatus.canonical_count,
        review_branch_count: githubSourceStatus.review_branch_count,
        source_ids: githubSourceStatus.source_ids,
        remaining_boundaries: githubSourceStatus.remaining_boundaries,
      }
      : null,
    materialized_source_status: materializedSourceStatus
      ? {
        status: materializedSourceStatus.status,
        materialized_count: materializedSourceStatus.materialized_count,
        materialized_root: materializedSourceStatus.materialized_root,
        materialized: materializedSourceStatus.materialized,
      }
      : null,
    source_work_queue_status: sourceWorkQueue
      ? {
        status: sourceWorkQueue.status,
        next_recommended_queue_id: sourceWorkQueue.next_recommended_queue_id,
        ready_count: sourceWorkQueue.ready_count,
        blocked_count: sourceWorkQueue.blocked_count,
      }
      : null,
    nmclr_sandbox_execution_status: nmclrSandboxStatus
      ? {
        status: nmclrSandboxStatus.status,
        run_id: nmclrSandboxStatus.run_id,
        causal_chain: nmclrSandboxStatus.causal_chain,
        movement_chain: nmclrSandboxStatus.movement_chain,
      }
      : null,
    loops,
  };

  fs.mkdirSync(abs(path.dirname(OUTPUT_PATH)), { recursive: true });
  fs.writeFileSync(abs(OUTPUT_PATH), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`${overallStatus}: wrote ${OUTPUT_PATH}`);
  console.log(`complete_loop_count=${completeLoops.length} valid_receipt_count=${validReceipts.length}`);

  if (hasFailure) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
