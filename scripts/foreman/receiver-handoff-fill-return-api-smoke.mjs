#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const BASE_URL = process.env.WERKLES_LOCAL_BASE_URL || "http://127.0.0.1:3000";
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_FILL_RETURN_API_V0_RECEIPT_20260706.json",
);
const RECEIVER = "ReceiverFillReturnApiSmoke@Betsy";
const HASH_FILES = [
  "lib/organism/contracts/receiver-handoff-return-fill.ts",
  "app/api/organism/contracts/receiver-handoffs/fill-return/route.ts",
  "lib/organism/contracts/receiver-handoff-index.ts",
  "scripts/foreman/receiver-handoff-fill-return-api-smoke.mjs",
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

function assertPass(condition, message) {
  if (!condition) throw new Error(message);
}

async function getJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok || result.ok !== true) {
    throw new Error(`GET_JSON_FAILED:${response.status}:${url}:${JSON.stringify(result)}`);
  }
  return result;
}

async function postJson(url, body, expectedStatus = 200) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (response.status !== expectedStatus || result.ok !== true) {
    throw new Error(`POST_JSON_FAILED:${response.status}:${url}:${JSON.stringify(result)}`);
  }
  return { status: response.status, result };
}

async function postJsonExpectFailure(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({ ok: false, error: "NON_JSON_RESPONSE" }));
  assertPass(response.status >= 400, `expected failure from ${url}, got ${response.status}`);
  assertPass(result.ok !== true, `expected failed result from ${url}`);
  return { status: response.status, result };
}

async function fileHashes(files) {
  const entries = [];
  for (const relativePath of files) {
    const raw = await readFile(path.join(ROOT, relativePath), "utf8");
    entries.push({
      path: relativePath,
      sha256: sha256(raw),
      bytes: Buffer.byteLength(raw, "utf8"),
    });
  }
  return entries;
}

async function selectPacketId() {
  const index = await getJson(`${BASE_URL}/api/organism/contracts/index?limit=50`);
  const records = Array.isArray(index.records) ? index.records : [];
  const tinkerden = records.find((record) => typeof record?.lane === "string" && record.lane.startsWith("TinkerDen "));
  const selected = tinkerden || records[0];
  assertPass(selected?.packet_id, "no contract packet available for fill-return smoke");
  return selected.packet_id;
}

async function createBundle(packetId, bundleId) {
  const create = await postJson(
    `${BASE_URL}/api/organism/contracts/receiver-handoffs`,
    {
      packet_id: packetId,
      receiver: RECEIVER,
      base_url: BASE_URL,
      bundle_id: bundleId,
    },
    201,
  );
  assertPass(create.result.bundle_id === bundleId, `${bundleId} created bundle id mismatch`);
  assertPass(create.result.receipt_template_blocked_reason === "TEMPLATE_NOT_FILLED", `${bundleId} template blocker mismatch`);
  return create.result;
}

async function main() {
  const helperSource = await readFile(path.join(ROOT, "lib", "organism", "contracts", "receiver-handoff-return-fill.ts"), "utf8");
  const routeSource = await readFile(
    path.join(ROOT, "app", "api", "organism", "contracts", "receiver-handoffs", "fill-return", "route.ts"),
    "utf8",
  );
  assertPass(helperSource.includes("RETURNED_RECEIPT_ALREADY_EXISTS"), "fill helper missing duplicate-write refusal");
  assertPass(helperSource.includes("ATTEMPTED_STILL_TEMPLATE"), "fill helper missing attempted template refusal");
  assertPass(routeSource.includes("fillReceiverHandoffReturn"), "fill route missing helper call");

  const packetId = await selectPacketId();
  const stamp = Date.now().toString(36);
  const successBundleId = `fill_return_api_smoke_${stamp}`;
  const templateBlockerBundleId = `fill_return_template_blocker_${stamp}`;
  const before = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=150`);

  const successBundle = await createBundle(packetId, successBundleId);
  const fill = await postJson(
    `${BASE_URL}/api/organism/contracts/receiver-handoffs/fill-return`,
    {
      bundle_id: successBundleId,
      status: "partial",
      receiver: RECEIVER,
      attempted: "Filled a returned receipt from explicit API smoke proof fields.",
      changed: [successBundle.handoff_path],
      proof_readbacks: [
        `Read back handoff bundle ${successBundleId} before filling returned-receipt.json.`,
        `Packet ${packetId} stayed in the receiver handoff bundle; fill-return did not post canonically.`,
      ],
      next_safe_action: "Post this returned receipt through the post-return endpoint after receiver review.",
    },
    201,
  );
  assertPass(fill.result.returned_receipt_path.endsWith("returned-receipt.json"), "fill result missing returned receipt path");
  assertPass(fill.result.proof_count >= 4, "fill result proof count too low");
  assertPass(existsSync(path.join(ROOT, fill.result.returned_receipt_path)), "returned receipt was not written on disk");
  const returned = JSON.parse(await readFile(path.join(ROOT, fill.result.returned_receipt_path), "utf8"));
  assertPass(returned.receipt_id === fill.result.receipt_id, "returned receipt id mismatch");
  assertPass(returned.status === "partial", "returned receipt status mismatch");
  assertPass(!JSON.stringify(returned).includes("TEMPLATE_NOT_FILLED"), "returned receipt still contains template text");

  const duplicateFill = await postJsonExpectFailure(`${BASE_URL}/api/organism/contracts/receiver-handoffs/fill-return`, {
    bundle_id: successBundleId,
    status: "partial",
    receiver: RECEIVER,
    attempted: "Attempt to overwrite an existing returned receipt.",
    changed: [successBundle.handoff_path],
    proof_readbacks: ["This should not overwrite the existing returned receipt."],
  });
  assertPass(duplicateFill.status === 409, `duplicate fill status ${duplicateFill.status} was not 409`);
  assertPass(duplicateFill.result.error === "RETURNED_RECEIPT_ALREADY_EXISTS", "duplicate fill error mismatch");

  const templateBundle = await createBundle(packetId, templateBlockerBundleId);
  const templateFill = await postJsonExpectFailure(`${BASE_URL}/api/organism/contracts/receiver-handoffs/fill-return`, {
    bundle_id: templateBlockerBundleId,
    status: "partial",
    receiver: RECEIVER,
    attempted: "TEMPLATE: replace this with actual receiver work.",
    changed: [templateBundle.handoff_path],
    proof_readbacks: ["Readback is intentionally non-template so attempted field is the blocker."],
  });
  assertPass(templateFill.status === 400, `template fill status ${templateFill.status} was not 400`);
  assertPass(templateFill.result.error === "ATTEMPTED_STILL_TEMPLATE", "template fill error mismatch");

  const after = await getJson(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=150`);
  const successRecord = after.records.find((record) => record.bundle_id === successBundleId);
  const templateRecord = after.records.find((record) => record.bundle_id === templateBlockerBundleId);
  assertPass(successRecord?.state === "returned_unposted", `success bundle state mismatch: ${successRecord?.state}`);
  assertPass(successRecord?.contract_receipt_path === "NO_CONTRACT_RECEIPT", "fill-return wrote canonical contract receipt");
  assertPass(templateRecord?.state === "pending_receiver", `template blocker bundle state mismatch: ${templateRecord?.state}`);
  assertPass(after.posted_count === before.posted_count, "fill-return changed posted count");
  assertPass(after.invalid_count === 0, "handoff index invalid count not zero after fill-return smoke");
  assertPass(after.malformed_count === 0, "handoff index malformed count not zero after fill-return smoke");

  const hashes = await fileHashes(HASH_FILES);
  const outputReceipt = {
    schema: "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_FILL_RETURN_API_V0_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: packetId,
    receipt_id: "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_FILL_RETURN_API_V0_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/receiver-handoff-fill-return-api-smoke.mjs",
    files_changed: [
      "lib/organism/contracts/receiver-handoff-return-fill.ts",
      "app/api/organism/contracts/receiver-handoffs/fill-return/route.ts",
      "scripts/foreman/receiver-handoff-fill-return-api-smoke.mjs",
      "foreman/receipts/BOOK_ARCHITECTURE_RECEIVER_HANDOFF_FILL_RETURN_API_V0_RECEIPT_20260706.json",
    ],
    runtime_artifacts_written: [
      successBundle.packet_path,
      successBundle.receipt_template_path,
      successBundle.handoff_path,
      successBundle.manifest_path,
      fill.result.returned_receipt_path,
      templateBundle.packet_path,
      templateBundle.receipt_template_path,
      templateBundle.handoff_path,
      templateBundle.manifest_path,
    ],
    validation: {
      route_calls_fill_helper: true,
      helper_rejects_duplicate_write: true,
      helper_rejects_template_attempted_text: true,
      fill_status: fill.status,
      fill_bundle_state_after: successRecord.state,
      fill_returned_receipt_path: fill.result.returned_receipt_path,
      fill_contract_receipt_path_after: successRecord.contract_receipt_path,
      duplicate_fill_status: duplicateFill.status,
      duplicate_fill_error: duplicateFill.result.error,
      template_fill_status: templateFill.status,
      template_fill_error: templateFill.result.error,
      template_blocker_bundle_state: templateRecord.state,
      posted_count_before: before.posted_count,
      posted_count_after: after.posted_count,
      invalid_count_after: after.invalid_count,
      malformed_count_after: after.malformed_count,
      truth_boundary: "fill-return creates a local non-template returned-receipt.json from explicit receiver fields, refuses placeholder and duplicate writes, and does not post canonical receipts.",
    },
    success_bundle: successBundle,
    fill_result: fill.result,
    success_index_record: successRecord,
    duplicate_fill_result: duplicateFill.result,
    template_bundle: templateBundle,
    template_fill_result: templateFill.result,
    template_index_record: templateRecord,
    file_hashes: hashes,
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no canonical receipt posted by fill-return",
      "no overwrite of existing returned receipt",
      "no template placeholder returned receipt written by fill-return",
    ],
    next_safe_action: "Wire a browser-visible fill-return form for pending receiver handoff bundles, then keep post-return as a separate explicit action.",
  };

  await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
  await writeFile(RECEIPT_PATH, `${JSON.stringify(outputReceipt, null, 2)}\n`, "utf8");
  const finalRaw = await readFile(RECEIPT_PATH, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        receipt_path: repoRel(RECEIPT_PATH),
        receipt_sha256: sha256(finalRaw),
        packet_id: packetId,
        success_bundle_id: successBundleId,
        success_state: successRecord.state,
        returned_receipt_path: fill.result.returned_receipt_path,
        duplicate_error: duplicateFill.result.error,
        template_error: templateFill.result.error,
        posted_count_before: before.posted_count,
        posted_count_after: after.posted_count,
        validation: outputReceipt.validation,
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
