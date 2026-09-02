#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const SCRIPT_PATH = fileURLToPath(import.meta.url);
const BASE_URL = process.env.WERKLES_LOCAL_BASE_URL || "http://127.0.0.1:3000";
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "BOOK_ARCHITECTURE_RECEIVER_PROOF_EVERYWHERE_AUDIT_V0_RECEIPT_20260706.json",
);

const SOURCE_INVARIANTS = [
  {
    surface_id: "organism.receiver_proof_boundary",
    path: "lib/organism/contracts/receiver-proof-boundary.ts",
    required_markers: [
      "harvey_nerdkle_receiver_proof_boundary_v0",
      "organism_receipt_mirrored",
      "transport_receipt_mirrored",
      "transport_ack_only",
      "legacy_object_loop",
      "receiver_work_proof_claimed: false",
    ],
  },
  {
    surface_id: "soledash.aeye_transport_mirror",
    path: "lib/soledash/aeye-inbox-v0/organism-contract-mirror.ts",
    required_markers: [
      "writeSoleDashAeyeTransportPacketRecord",
      "writeSoleDashAeyeTransportReceiptRecord",
      "status: \"partial\"",
      "Transport ACK was not upgraded into completed receiver work proof",
    ],
  },
  {
    surface_id: "soledash.aeye_receiver_handoff_bridge",
    path: "lib/soledash/aeye-inbox-v0/receiver-handoff-bridge.ts",
    required_markers: [
      "createSoleDashAeyeReceiverHandoffBundle",
      "pending_receiver_return",
      "createReceiverHandoffBundle",
      "not completion proof",
    ],
  },
  {
    surface_id: "nerdkle.organism_contract_mirror",
    path: "lib/nerdkle/organism-contract-mirror.ts",
    required_markers: [
      "writeNerdkleOrganismPacketRecord",
      "writeNerdkleOrganismReceiptRecord",
      "source_missing",
      "writeOrganismReceiptRecord",
    ],
  },
  {
    surface_id: "tinkerden.receiver_handoff_bundle",
    path: "lib/organism/contracts/receiver-handoff-bundle.ts",
    required_markers: [
      "TEMPLATE_NOT_FILLED",
      "receipt_template_status: \"blocked\"",
      "A posted template is not completion proof",
      "createReceiverHandoffBundle",
    ],
  },
  {
    surface_id: "tinkerden.receiver_handoff_fill_return",
    path: "lib/organism/contracts/receiver-handoff-return-fill.ts",
    required_markers: [
      "ATTEMPTED_STILL_TEMPLATE",
      "CHANGED_PATH_REQUIRED_FOR_NON_BLOCKED_RECEIPT",
      "EXPLICIT_PROOF_REQUIRED_FOR_NON_BLOCKED_RECEIPT",
      "fill-return wrote a non-template returned-receipt.json",
    ],
  },
  {
    surface_id: "tinkerden.receiver_handoff_post_return",
    path: "lib/organism/contracts/receiver-handoff-return-post.ts",
    required_markers: [
      "RETURNED_RECEIPT_MISSING",
      "RETURNED_PACKET_MISMATCH",
      "TEMPLATE_NOT_FILLED_RETURN_RECEIPT",
      "writeOrganismReceiptRecord",
    ],
  },
  {
    surface_id: "tinkerden.receiver_handoff_index",
    path: "lib/organism/contracts/receiver-handoff-index.ts",
    required_markers: [
      "returned_unposted",
      "template_return_blocked",
      "contract_event_joined",
      "packet_receipted",
      "synthetic_proof",
    ],
  },
  {
    surface_id: "tinkerden.workspace_relay",
    path: "lib/tinkerden/workspace-relay-contract.ts",
    required_markers: [
      "Receiver-side Aeye completion proof was not claimed",
      "Downstream work remains awaiting receiver proof",
      "downstream_receiver_proof=required",
      "writeOrganismReceiptRecord",
    ],
  },
  {
    surface_id: "tinkerden.workspace_relay_receiver_handoff_bridge",
    path: "lib/tinkerden/workspace-relay-receiver-handoff.ts",
    required_markers: [
      "createWorkspaceRelayReceiverHandoffBundle",
      "pending_receiver_return",
      "createReceiverHandoffBundle",
      "runner receipt remains custody proof only",
    ],
  },
  {
    surface_id: "tinkerden.workspace_relay_route",
    path: "app/api/tinkerden/workspace-relay/route.ts",
    required_markers: [
      "createWorkspaceRelayReceiverHandoffBundle",
      "create_receiver_handoff",
      "receiver_handoff",
      "receiver_handoff_bundle_id",
    ],
  },
  {
    surface_id: "tinkerden.workspace_relay_receiver_handoff_bridge_smoke",
    path: "scripts/foreman/workspace-relay-receiver-handoff-bridge-smoke.mjs",
    required_markers: [
      "receiver_handoff_bundle_created",
      "receiver_handoff_template_blocked",
      "receiver_handoff_return_not_created",
      "fixed_bundle_id_prevents_count_growth_on_repeated_runs",
    ],
  },
  {
    surface_id: "tinkerden.bridge_execute",
    path: "app/api/tinkerden/bridge/execute/route.ts",
    required_markers: ["createBridgeExecutePacket", "contract_write", "visible_state: \"RECEIPT_LINKED\""],
  },
  {
    surface_id: "soledash.aeye_loop",
    path: "app/api/soledash/v1/wonka-den/aeye-loop/route.ts",
    required_markers: [
      "verify_sent",
      "receipt_only",
      "ACKNOWLEDGED",
      "dispatchAeyeMessage",
      "writeSoleDashAeyeTransportReceiptRecord",
      "createSoleDashAeyeReceiverHandoffBundle",
      "create_receiver_handoff",
      "organism_contract",
      "receiver_handoff",
      "receiverProofBoundary(\"transport_receipt_mirrored\")",
      "receiverProofBoundary(\"transport_ack_only\")",
    ],
  },
  {
    surface_id: "soledash.aeye_receiver_handoff_bridge_smoke",
    path: "scripts/foreman/soledash-aeye-receiver-handoff-bridge-smoke.mjs",
    required_markers: [
      "receiver_handoff_bundle_created",
      "receiver_handoff_template_blocked",
      "receiver_handoff_return_not_created",
      "fixed_bundle_id_prevents_count_growth_on_repeated_runs",
    ],
  },
  {
    surface_id: "soledash.aeye_transport_mirror_smoke",
    path: "scripts/foreman/soledash-aeye-transport-organism-mirror-smoke.mjs",
    required_markers: [
      "organism_receipt_status_partial_for_transport_ack",
      "receiver_work_completion_not_claimed",
      "packet_receipted_event_joins_packet_id_and_receipt_id",
    ],
  },
  {
    surface_id: "nerdkle.packet",
    path: "app/api/nerdkle/packet/route.ts",
    required_markers: [
      "nerdkle_execution_packet_created",
      "HANDOFF_OUTBOX_DIR",
      "executionPacketBody",
      "writeNerdkleOrganismPacketRecord",
      "organism_contract",
      "receiverProofBoundary(\"canonical_custody_only\")",
    ],
  },
  {
    surface_id: "nerdkle.receipt",
    path: "app/api/nerdkle/receipt/route.ts",
    required_markers: [
      "nerdkle_execution_receipt_recorded",
      "artifact_path",
      "object_hash",
      "writeNerdkleOrganismReceiptRecord",
      "organism_contract",
      "receiverProofBoundary(\"organism_receipt_mirrored\")",
    ],
  },
  {
    surface_id: "nerdkle.organism_receipt_mirror_smoke",
    path: "scripts/foreman/nerdkle-organism-receipt-mirror-smoke.mjs",
    required_markers: [
      "organism_packet_mirror_written",
      "organism_receipt_mirror_written",
      "packet_receipted_event_joins_packet_id_and_receipt_id",
    ],
  },
];

function slash(value) {
  return value.split(path.sep).join("/");
}

function repoRel(value) {
  return slash(path.relative(ROOT, value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function stripBom(value) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function assertPass(condition, message) {
  if (!condition) throw new Error(message);
}

async function readText(relativePath) {
  return stripBom(await readFile(path.join(ROOT, relativePath), "utf8"));
}

async function readJsonl(relativePath) {
  const raw = await readText(relativePath);
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

async function getJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok || result.ok !== true) {
    throw new Error(`GET_JSON_FAILED:${response.status}:${url}:${JSON.stringify(result)}`);
  }
  return result;
}

async function collectSourceInvariants() {
  const readbacks = [];
  const fileHashes = [];

  for (const invariant of SOURCE_INVARIANTS) {
    const absolutePath = path.join(ROOT, invariant.path);
    assertPass(existsSync(absolutePath), `SOURCE_PATH_MISSING:${invariant.path}`);
    const rawBuffer = await readFile(absolutePath);
    const raw = stripBom(rawBuffer.toString("utf8"));
    const missing = invariant.required_markers.filter((marker) => !raw.includes(marker));
    assertPass(missing.length === 0, `SOURCE_INVARIANT_MISSING:${invariant.path}:${missing.join(",")}`);
    readbacks.push({
      surface_id: invariant.surface_id,
      path: invariant.path,
      required_markers_present: invariant.required_markers,
    });
    fileHashes.push({
      path: invariant.path,
      sha256: sha256(rawBuffer),
      bytes: rawBuffer.byteLength,
    });
  }

  const scriptRaw = await readFile(SCRIPT_PATH);
  fileHashes.push({
    path: repoRel(SCRIPT_PATH),
    sha256: sha256(scriptRaw),
    bytes: scriptRaw.byteLength,
  });

  return { readbacks, fileHashes };
}

function verifyHandoffIndex(index) {
  assertPass(index.ok === true, "HANDOFF_INDEX_NOT_OK");
  assertPass(index.invalid_count === 0, "HANDOFF_INDEX_INVALID_COUNT_NOT_ZERO");
  assertPass(index.malformed_count === 0, "HANDOFF_INDEX_MALFORMED_COUNT_NOT_ZERO");
  assertPass(Array.isArray(index.records), "HANDOFF_INDEX_RECORDS_MISSING");

  const posted = index.records.filter((record) => record.state === "posted");
  const pending = index.records.filter((record) => record.state === "pending_receiver");
  const returnedUnposted = index.records.filter((record) => record.state === "returned_unposted");
  const templateBlocked = index.records.filter((record) => record.state === "template_return_blocked");

  for (const record of posted) {
    assertPass(record.returned_receipt_id && record.returned_receipt_id !== "NO_RETURNED_RECEIPT", `POSTED_RETURN_MISSING:${record.bundle_id}`);
    assertPass(record.contract_receipt_path && record.contract_receipt_path !== "NO_CONTRACT_RECEIPT", `POSTED_CONTRACT_RECEIPT_MISSING:${record.bundle_id}`);
    assertPass(record.contract_event_joined === true, `POSTED_EVENT_JOIN_MISSING:${record.bundle_id}`);
  }

  for (const record of pending) {
    assertPass(record.returned_receipt_path === "NO_RETURNED_RECEIPT", `PENDING_HAS_RETURNED_RECEIPT:${record.bundle_id}`);
    assertPass(record.contract_receipt_path === "NO_CONTRACT_RECEIPT", `PENDING_HAS_CONTRACT_RECEIPT:${record.bundle_id}`);
  }

  for (const record of returnedUnposted) {
    assertPass(record.returned_receipt_path !== "NO_RETURNED_RECEIPT", `RETURNED_UNPOSTED_RETURN_MISSING:${record.bundle_id}`);
    assertPass(record.contract_receipt_path === "NO_CONTRACT_RECEIPT", `RETURNED_UNPOSTED_CONTRACT_RECEIPT_PRESENT:${record.bundle_id}`);
    assertPass(record.contract_event_joined === false, `RETURNED_UNPOSTED_EVENT_JOINED:${record.bundle_id}`);
  }

  for (const record of templateBlocked) {
    assertPass(record.returned_receipt_path !== "NO_RETURNED_RECEIPT", `TEMPLATE_BLOCKED_RETURN_MISSING:${record.bundle_id}`);
    assertPass(record.contract_receipt_path === "NO_CONTRACT_RECEIPT", `TEMPLATE_BLOCKED_CONTRACT_RECEIPT_PRESENT:${record.bundle_id}`);
    assertPass(/TEMPLATE_NOT_FILLED|template/i.test(record.truth_boundary), `TEMPLATE_BLOCKED_BOUNDARY_MISSING:${record.bundle_id}`);
  }

  return {
    endpoint: `${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`,
    count: index.count,
    posted_count: index.posted_count,
    pending_count: index.pending_count,
    returned_unposted_count: index.returned_unposted_count,
    template_return_blocked_count: index.template_return_blocked_count,
    invalid_count: index.invalid_count,
    malformed_count: index.malformed_count,
    sampled_records_checked: index.records.length,
    posted_records_event_joined: posted.length,
    pending_records_waiting_for_return: pending.length,
    returned_unposted_records_not_claimed_posted: returnedUnposted.length,
    template_blocked_records_not_claimed_posted: templateBlocked.length,
  };
}

function coverageMatrix() {
  return [
    {
      surface_id: "tinkerden.receiver_handoff",
      coverage_status: "enforced",
      proof_level: "receiver-return-required",
      evidence:
        "Bundle templates are blocked, fill-return rejects template text and requires changed paths plus proof, post-return rejects template or mismatched returns, and the index separates pending, returned_unposted, template_return_blocked, and posted.",
      truth_boundary: "This proves the TinkerDen receiver-handoff lane, not every message path in Werkles.",
    },
    {
      surface_id: "tinkerden.bridge_execute",
      coverage_status: "canonical-custody",
      proof_level: "packet-and-local-receipt-mirrored",
      evidence: "The bridge execute API returns contract_write and RECEIPT_LINKED state from the TinkerDen contract mirror.",
      truth_boundary: "A bridge execution receipt is local dispatch/custody proof; it is not downstream receiver work proof.",
    },
    {
      surface_id: "tinkerden.workspace_relay",
      coverage_status: "custody-with-pending-receiver-handoff",
      proof_level: "runner-receipt-mirrored-plus-receiver-return-template",
      evidence:
        "Workspace relay mirrors the runner receipt into the organism receipt store, explicitly says receiver-side Aeye completion proof was not claimed, and can create a blocked receiver-handoff bundle.",
      truth_boundary:
        "The runner receipt plus blocked receiver-handoff template is still pending receiver work until a non-template returned receipt is filled and posted.",
    },
    {
      surface_id: "soledash.aeye_loop",
      coverage_status: "transport-receipt-mirrored-plus-pending-handoff",
      proof_level: "transport-ack-to-organism-contract-plus-receiver-return-template",
      evidence:
        "The Aeye loop mirrors send and receipt_only ACKs into canonical organism packet/receipt/event records and can create a blocked receiver-handoff bundle when create_receiver_handoff is requested.",
      truth_boundary:
        "A mirrored transport ACK plus blocked receiver-handoff template is still pending receiver work until a non-template returned receipt is filled and posted.",
    },
    {
      surface_id: "nerdkle.packet_receipt",
      coverage_status: "organism-receipt-mirrored",
      proof_level: "legacy-object-receipt-to-organism-contract",
      evidence:
        "Nerdkle packet creation mirrors a canonical organism packet, and Nerdkle receipt creation mirrors a canonical organism receipt/event joined to the packet id.",
      truth_boundary:
        "Nerdkle now has canonical organism packet/receipt/event proof, but cross-Aeye work should still use receiver-handoff bundles when handoff-return semantics are required.",
    },
  ];
}

async function verifyNerdkleMirrorSmokeReceipt() {
  const receiptPath = "foreman/receipts/BOOK_ARCHITECTURE_NERDKLE_ORGANISM_RECEIPT_MIRROR_V0_RECEIPT_20260706.json";
  const receipt = JSON.parse(await readText(receiptPath));
  assertPass(receipt.status === "ARTIFACT", "Nerdkle mirror smoke receipt is not ARTIFACT");
  assertPass(receipt.validation?.organism_packet_mirror_written === true, "Nerdkle mirror smoke missing packet mirror proof");
  assertPass(receipt.validation?.organism_receipt_mirror_written === true, "Nerdkle mirror smoke missing receipt mirror proof");
  assertPass(
    receipt.validation?.packet_receipted_event_joins_packet_id_and_receipt_id === true,
    "Nerdkle mirror smoke missing packet_receipted event join proof",
  );
  assertPass(
    receipt.validation?.organism_receipt_status_completed_when_artifact_exists === true,
    "Nerdkle mirror smoke missing completed-when-artifact-exists proof",
  );

  const contractPacket = JSON.parse(await readText(receipt.fixture_readback.organism_packet_path));
  const contractReceipt = JSON.parse(await readText(receipt.fixture_readback.organism_receipt_path));
  assertPass(contractPacket.schema === "harvey_nerdkle_packet_v0", "Nerdkle mirrored packet schema drifted");
  assertPass(contractReceipt.schema === "harvey_nerdkle_receipt_v0", "Nerdkle mirrored receipt schema drifted");
  assertPass(contractReceipt.packet_id === contractPacket.packet_id, "Nerdkle mirrored packet/receipt id mismatch");
  assertPass(contractReceipt.receipt_id === receipt.fixture_readback.organism_receipt_id, "Nerdkle mirrored receipt id mismatch");

  const events = await readJsonl("data/organism/contracts/events.jsonl");
  const receiptEvent = events.find(
    (event) =>
      event.event_id === receipt.fixture_readback.receipt_event_id &&
      event.event_type === "packet_receipted" &&
      event.packet_id === contractPacket.packet_id &&
      event.receipt_id === contractReceipt.receipt_id,
  );
  assertPass(Boolean(receiptEvent), "Nerdkle mirror packet_receipted event missing from event log");

  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "lib/nerdkle/organism-contract-mirror.ts",
    "lib/organism/contracts/receiver-proof-boundary.ts",
    "app/api/nerdkle/packet/route.ts",
    "app/api/nerdkle/receipt/route.ts",
    "scripts/foreman/nerdkle-organism-receipt-mirror-smoke.mjs",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `NERDKLE_MIRROR_SMOKE_HASH_STALE:${relativePath}`);
  }

  return {
    status: receipt.status,
    object_id: receipt.fixture_readback.object_id,
    organism_packet_id: receipt.fixture_readback.organism_packet_id,
    organism_receipt_id: receipt.fixture_readback.organism_receipt_id,
    receipt_event_id: receipt.fixture_readback.receipt_event_id,
    current_script_hashes_match_receipt: true,
    packet_receipted_event_still_joins: true,
  };
}

async function verifySoleDashMirrorSmokeReceipt() {
  const receiptPath = "foreman/receipts/BOOK_ARCHITECTURE_SOLEDASH_AEYE_TRANSPORT_MIRROR_V0_RECEIPT_20260706.json";
  const receipt = JSON.parse(await readText(receiptPath));
  assertPass(receipt.status === "ARTIFACT", "SoleDash mirror smoke receipt is not ARTIFACT");
  assertPass(receipt.validation?.organism_packet_mirror_written === true, "SoleDash mirror smoke missing packet mirror proof");
  assertPass(receipt.validation?.organism_receipt_mirror_written === true, "SoleDash mirror smoke missing receipt mirror proof");
  assertPass(
    receipt.validation?.organism_receipt_status_partial_for_transport_ack === true,
    "SoleDash mirror smoke did not prove transport ACK remains partial",
  );
  assertPass(
    receipt.validation?.receiver_work_completion_not_claimed === true,
    "SoleDash mirror smoke did not preserve no receiver completion claim",
  );
  assertPass(
    receipt.validation?.packet_receipted_event_joins_packet_id_and_receipt_id === true,
    "SoleDash mirror smoke missing packet_receipted event join proof",
  );

  const contractPacket = JSON.parse(await readText(receipt.fixture_readback.organism_packet_path));
  const contractReceipt = JSON.parse(await readText(receipt.fixture_readback.organism_receipt_path));
  assertPass(contractPacket.schema === "harvey_nerdkle_packet_v0", "SoleDash mirrored packet schema drifted");
  assertPass(contractReceipt.schema === "harvey_nerdkle_receipt_v0", "SoleDash mirrored receipt schema drifted");
  assertPass(contractReceipt.status === "partial", "SoleDash mirrored transport receipt no longer partial");
  assertPass(contractReceipt.packet_id === contractPacket.packet_id, "SoleDash mirrored packet/receipt id mismatch");

  const events = await readJsonl("data/organism/contracts/events.jsonl");
  const receiptEvent = events.find(
    (event) =>
      event.event_id === receipt.fixture_readback.receipt_event_id &&
      event.event_type === "packet_receipted" &&
      event.packet_id === contractPacket.packet_id &&
      event.receipt_id === contractReceipt.receipt_id,
  );
  assertPass(Boolean(receiptEvent), "SoleDash mirror packet_receipted event missing from event log");

  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "lib/soledash/aeye-inbox-v0/organism-contract-mirror.ts",
    "lib/organism/contracts/receiver-proof-boundary.ts",
    "app/api/soledash/v1/wonka-den/aeye-loop/route.ts",
    "scripts/foreman/soledash-aeye-transport-organism-mirror-smoke.mjs",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `SOLEDASH_MIRROR_SMOKE_HASH_STALE:${relativePath}`);
  }

  return {
    status: receipt.status,
    message_packet_id: receipt.fixture_readback.message_packet_id,
    organism_packet_id: receipt.fixture_readback.organism_packet_id,
    organism_receipt_id: receipt.fixture_readback.organism_receipt_id,
    receipt_event_id: receipt.fixture_readback.receipt_event_id,
    current_script_hashes_match_receipt: true,
    packet_receipted_event_still_joins: true,
    transport_ack_remains_partial: true,
  };
}

async function verifySoleDashReceiverHandoffBridgeSmokeReceipt(handoffIndex) {
  const receiptPath = "foreman/receipts/BOOK_ARCHITECTURE_SOLEDASH_AEYE_RECEIVER_HANDOFF_BRIDGE_V0_RECEIPT_20260706.json";
  const receipt = JSON.parse(await readText(receiptPath));
  assertPass(receipt.status === "ARTIFACT", "SoleDash receiver handoff bridge receipt is not ARTIFACT");
  assertPass(receipt.validation?.receiver_handoff_bundle_created === true, "SoleDash bridge did not prove bundle creation");
  assertPass(receipt.validation?.receiver_handoff_template_blocked === true, "SoleDash bridge did not prove blocked template");
  assertPass(receipt.validation?.receiver_handoff_template_not_filled === true, "SoleDash bridge did not prove TEMPLATE_NOT_FILLED");
  assertPass(receipt.validation?.receiver_handoff_return_not_created === true, "SoleDash bridge created or claimed a returned receipt");
  assertPass(receipt.validation?.receiver_work_completion_not_claimed === true, "SoleDash bridge claimed receiver work completion");

  const template = JSON.parse(await readText(receipt.fixture_readback.receipt_template_path));
  assertPass(template.status === "blocked", "SoleDash bridge template status drifted");
  assertPass(template.blocked_reason === "TEMPLATE_NOT_FILLED", "SoleDash bridge template blocked reason drifted");
  assertPass(template.what_changed.includes("TEMPLATE_NOT_FILLED"), "SoleDash bridge template missing TEMPLATE_NOT_FILLED marker");
  assertPass(!existsSync(path.join(ROOT, receipt.fixture_readback.returned_receipt_path)), "SoleDash bridge returned receipt now exists unexpectedly");

  const record = (handoffIndex.records || []).find((entry) => entry.bundle_id === receipt.fixture_readback.bundle_id);
  assertPass(Boolean(record), "SoleDash bridge bundle missing from handoff index");
  assertPass(record.state === "pending_receiver", "SoleDash bridge bundle is not pending_receiver");
  assertPass(record.returned_receipt_path === "NO_RETURNED_RECEIPT", "SoleDash bridge bundle has returned receipt");
  assertPass(record.contract_receipt_path === "NO_CONTRACT_RECEIPT", "SoleDash bridge bundle has contract receipt");
  assertPass(record.packet_id === receipt.fixture_readback.organism_packet_id, "SoleDash bridge index packet id mismatch");

  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "lib/soledash/aeye-inbox-v0/receiver-handoff-bridge.ts",
    "lib/soledash/aeye-inbox-v0/organism-contract-mirror.ts",
    "lib/organism/contracts/receiver-handoff-bundle.ts",
    "app/api/soledash/v1/wonka-den/aeye-loop/route.ts",
    "scripts/foreman/soledash-aeye-receiver-handoff-bridge-smoke.mjs",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `SOLEDASH_HANDOFF_BRIDGE_HASH_STALE:${relativePath}`);
  }

  return {
    status: receipt.status,
    source_message_packet_id: receipt.fixture_readback.source_message_packet_id,
    organism_packet_id: receipt.fixture_readback.organism_packet_id,
    organism_receipt_id: receipt.fixture_readback.organism_receipt_id,
    bundle_id: receipt.fixture_readback.bundle_id,
    receipt_template_path: receipt.fixture_readback.receipt_template_path,
    current_script_hashes_match_receipt: true,
    indexed_state: record.state,
    returned_receipt_exists: false,
  };
}

async function verifyWorkspaceRelayReceiverHandoffBridgeSmokeReceipt(handoffIndex) {
  const receiptPath = "foreman/receipts/BOOK_ARCHITECTURE_WORKSPACE_RELAY_RECEIVER_HANDOFF_BRIDGE_V0_RECEIPT_20260706.json";
  const receipt = JSON.parse(await readText(receiptPath));
  assertPass(receipt.status === "ARTIFACT", "Workspace Relay receiver handoff bridge receipt is not ARTIFACT");
  assertPass(receipt.validation?.receiver_handoff_bundle_created === true, "Workspace Relay bridge did not prove bundle creation");
  assertPass(receipt.validation?.receiver_handoff_template_blocked === true, "Workspace Relay bridge did not prove blocked template");
  assertPass(receipt.validation?.receiver_handoff_template_not_filled === true, "Workspace Relay bridge did not prove TEMPLATE_NOT_FILLED");
  assertPass(receipt.validation?.receiver_handoff_return_not_created === true, "Workspace Relay bridge created or claimed a returned receipt");
  assertPass(receipt.validation?.receiver_work_completion_not_claimed === true, "Workspace Relay bridge claimed receiver work completion");

  const template = JSON.parse(await readText(receipt.fixture_readback.receipt_template_path));
  assertPass(template.status === "blocked", "Workspace Relay bridge template status drifted");
  assertPass(template.blocked_reason === "TEMPLATE_NOT_FILLED", "Workspace Relay bridge template blocked reason drifted");
  assertPass(template.what_changed.includes("TEMPLATE_NOT_FILLED"), "Workspace Relay bridge template missing TEMPLATE_NOT_FILLED marker");
  assertPass(!existsSync(path.join(ROOT, receipt.fixture_readback.returned_receipt_path)), "Workspace Relay bridge returned receipt now exists unexpectedly");

  const record = (handoffIndex.records || []).find((entry) => entry.bundle_id === receipt.fixture_readback.bundle_id);
  assertPass(Boolean(record), "Workspace Relay bridge bundle missing from handoff index");
  assertPass(record.state === "pending_receiver", "Workspace Relay bridge bundle is not pending_receiver");
  assertPass(record.returned_receipt_path === "NO_RETURNED_RECEIPT", "Workspace Relay bridge bundle has returned receipt");
  assertPass(record.contract_receipt_path === "NO_CONTRACT_RECEIPT", "Workspace Relay bridge bundle has contract receipt");
  assertPass(record.packet_id === receipt.fixture_readback.organism_packet_id, "Workspace Relay bridge index packet id mismatch");

  const receiptHashes = new Map(
    (receipt.file_hashes || []).map((entry) => [entry.path, String(entry.sha256 || "").toLowerCase()]),
  );
  for (const relativePath of [
    "lib/tinkerden/workspace-relay-receiver-handoff.ts",
    "app/api/tinkerden/workspace-relay/route.ts",
    "lib/organism/contracts/receiver-handoff-bundle.ts",
    "scripts/foreman/workspace-relay-receiver-handoff-bridge-smoke.mjs",
  ]) {
    const raw = await readFile(path.join(ROOT, relativePath));
    assertPass(receiptHashes.get(relativePath) === sha256(raw).toLowerCase(), `WORKSPACE_RELAY_HANDOFF_BRIDGE_HASH_STALE:${relativePath}`);
  }

  return {
    status: receipt.status,
    relay_id: receipt.fixture_readback.relay_id,
    organism_packet_id: receipt.fixture_readback.organism_packet_id,
    bundle_id: receipt.fixture_readback.bundle_id,
    receipt_template_path: receipt.fixture_readback.receipt_template_path,
    current_script_hashes_match_receipt: true,
    indexed_state: record.state,
    returned_receipt_exists: false,
  };
}

async function main() {
  const source = await collectSourceInvariants();
  const handoffIndex = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=250`);
  const handoffReadback = verifyHandoffIndex(handoffIndex);
  const nerdkleMirror = await verifyNerdkleMirrorSmokeReceipt();
  const soledashMirror = await verifySoleDashMirrorSmokeReceipt();
  const soledashBridge = await verifySoleDashReceiverHandoffBridgeSmokeReceipt(handoffIndex);
  const workspaceRelayBridge = await verifyWorkspaceRelayReceiverHandoffBridgeSmokeReceipt(handoffIndex);
  const matrix = coverageMatrix();
  const blockers = [
    "Universal receiver proof is not implemented across every Werkles message path.",
    "SoleDash Aeye ACKs now mirror into the organism contract and can open a pending receiver-handoff return lane, but completion still requires a non-template returned receipt.",
    "Nerdkle now mirrors legacy receipts into the organism contract, but cross-Aeye handoff-return semantics still require receiver-handoff bundles.",
    "Workspace relay receipts intentionally preserve downstream_receiver_proof=required and can open a pending receiver-handoff return lane, but completion still requires a non-template returned receipt.",
  ];

  const receipt = {
    schema: "BOOK_ARCHITECTURE_RECEIVER_PROOF_EVERYWHERE_AUDIT_V0",
    status: "ARTIFACT_WITH_BLOCKERS",
    timestamp: new Date().toISOString(),
    machine: process.env.COMPUTERNAME || "UNKNOWN_MACHINE",
    agent: "Heimerdinker@Betsy",
    packet_id: "BOOK_ARCHITECTURE_RECEIVER_PROOF_EVERYWHERE_AUDIT_V0",
    receipt_id: "BOOK_ARCHITECTURE_RECEIVER_PROOF_EVERYWHERE_AUDIT_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/receiver-proof-everywhere-audit.mjs",
    validation: {
      non_mutating_audit: true,
      receiver_handoff_lane_enforced: true,
      posted_handoffs_require_contract_receipt_and_packet_receipted_event: true,
      pending_handoffs_not_claimed_as_posted: true,
      returned_unposted_handoffs_not_claimed_as_posted: true,
      template_return_blocked_handoffs_not_claimed_as_posted: true,
      workspace_relay_truthfully_marks_downstream_receiver_proof_required: true,
      non_proof_routes_self_label_receiver_boundary: true,
      nerdkle_receipts_mirror_to_organism_contract: true,
      nerdkle_mirror_packet_receipted_event_joins_packet_id_and_receipt_id: true,
      soledash_transport_acks_mirror_to_organism_contract: true,
      soledash_mirror_packet_receipted_event_joins_packet_id_and_receipt_id: true,
      soledash_transport_ack_remains_partial_not_completed_work: true,
      soledash_receiver_handoff_bridge_creates_pending_template: true,
      soledash_receiver_handoff_bridge_does_not_claim_completion: true,
      workspace_relay_receiver_handoff_bridge_creates_pending_template: true,
      workspace_relay_receiver_handoff_bridge_does_not_claim_completion: true,
      soledash_ack_is_not_receiver_work_proof: true,
      nerdkle_cross_aeye_handoff_still_requires_receiver_handoff_bundle: true,
      universal_receiver_proof_claimed: false,
      blockers_remain: blockers.length > 0,
    },
    live_receiver_handoff_readback: handoffReadback,
    nerdkle_mirror_readback: nerdkleMirror,
    soledash_mirror_readback: soledashMirror,
    soledash_receiver_handoff_bridge_readback: soledashBridge,
    workspace_relay_receiver_handoff_bridge_readback: workspaceRelayBridge,
    source_invariant_readbacks: source.readbacks,
    coverage_matrix: matrix,
    blockers,
    truth_boundary:
      "Receiver proof is enforced in the TinkerDen receiver-handoff lane. SoleDash and Workspace Relay can now open pending receiver-return lanes, but completion still requires non-template returned receipts.",
    file_hashes: source.fileHashes,
    stop_conditions_respected: ["no bundle creation", "no returned receipt creation", "no canonical receipt post", "no external send", "no deploy", "no push"],
    next_safe_action:
      "Fill and post real receiver returns for the pending handoff bundles before claiming receiver proof everywhere.",
  };

  await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
  await writeFile(RECEIPT_PATH, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  const finalRaw = await readFile(RECEIPT_PATH, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        status: receipt.status,
        receipt_path: repoRel(RECEIPT_PATH),
        receipt_sha256: sha256(finalRaw),
        receiver_handoff_lane_enforced: receipt.validation.receiver_handoff_lane_enforced,
        universal_receiver_proof_claimed: receipt.validation.universal_receiver_proof_claimed,
        blockers: receipt.blockers,
        counts: receipt.live_receiver_handoff_readback,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, status: "BLOCKER", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
