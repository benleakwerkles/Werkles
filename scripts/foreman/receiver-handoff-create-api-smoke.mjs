#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const BASE_URL = process.env.WERKLES_LOCAL_BASE_URL || "http://127.0.0.1:3000";
const PACKET_ID = "BOOK_ARCHITECTURE_API_WRITE_PATHS_V0";
const HELPER_BUNDLE_ID = "api_create_helper_smoke_BOOK_ARCHITECTURE_API_WRITE_PATHS_V0";
const LIVE_BUNDLE_ID = "api_create_live_smoke_BOOK_ARCHITECTURE_API_WRITE_PATHS_V0";
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_CREATE_API_V0_RECEIPT_20260706.json",
);
const COMPILE_FILES = [
  "lib/organism/contracts/event.ts",
  "lib/organism/contracts/packet.ts",
  "lib/organism/contracts/receipt.ts",
  "lib/organism/contracts/storage.ts",
  "lib/organism/contracts/receiver-handoff-bundle.ts",
  "lib/organism/contracts/receiver-handoff-index.ts",
];
const HASH_FILES = [
  ...COMPILE_FILES,
  "app/api/organism/contracts/receiver-handoffs/route.ts",
  "scripts/foreman/receiver-handoff-create-api-smoke.mjs",
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

function runTsc(outDir) {
  const tscPath = path.join(ROOT, "node_modules", "typescript", "bin", "tsc");
  const args = [
    tscPath,
    ...COMPILE_FILES,
    "--target",
    "ES2020",
    "--module",
    "commonjs",
    "--moduleResolution",
    "node",
    "--esModuleInterop",
    "--strict",
    "--skipLibCheck",
    "--outDir",
    outDir,
    "--rootDir",
    path.join(ROOT, "lib", "organism", "contracts"),
  ];
  const proc = spawnSync(process.execPath, args, {
    cwd: ROOT,
    encoding: "utf8",
  });

  if (proc.status !== 0) {
    throw new Error(`tsc failed\nSTDOUT:\n${proc.stdout}\nSTDERR:\n${proc.stderr}`);
  }

  return {
    stdout: proc.stdout.trim(),
    stderr: proc.stderr.trim(),
  };
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), "utf8"));
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

async function postLiveBundle() {
  const response = await fetch(`${BASE_URL}/api/organism/contracts/receiver-handoffs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      packet_id: PACKET_ID,
      receiver: "ReceiverCreateApiLiveSmoke@Betsy",
      base_url: BASE_URL,
      bundle_id: LIVE_BUNDLE_ID,
    }),
  });
  const result = await response.json();
  if (!response.ok || result.ok !== true) {
    throw new Error(`live receiver handoff create failed ${response.status}: ${JSON.stringify(result)}`);
  }

  return {
    status: response.status,
    result,
  };
}

async function getHandoffIndex() {
  const response = await fetch(`${BASE_URL}/api/organism/contracts/receiver-handoffs?limit=25`, { cache: "no-store" });
  const result = await response.json();
  if (!response.ok || result.ok !== true) {
    throw new Error(`handoff index failed ${response.status}: ${JSON.stringify(result)}`);
  }
  return result;
}

function assertBundle(result, expectedBundleId, expectedReceiver) {
  assertPass(result.ok === true, `${expectedBundleId} did not return ok`);
  assertPass(result.packet_id === PACKET_ID, `${expectedBundleId} packet mismatch`);
  assertPass(result.receiver === expectedReceiver, `${expectedBundleId} receiver mismatch`);
  assertPass(result.bundle_id === expectedBundleId, `${expectedBundleId} bundle id mismatch`);
  assertPass(result.receipt_template_status === "blocked", `${expectedBundleId} template status mismatch`);
  assertPass(result.receipt_template_blocked_reason === "TEMPLATE_NOT_FILLED", `${expectedBundleId} template blocker mismatch`);
  for (const key of ["bundle_dir", "handoff_path", "packet_path", "receipt_template_path", "manifest_path"]) {
    assertPass(existsSync(path.join(ROOT, result[key])), `${expectedBundleId} ${key} missing`);
  }
}

async function main() {
  const tempRoot = path.join(os.tmpdir(), `werkles-receiver-handoff-create-api-${process.pid}-${Date.now()}`);
  const outDir = path.join(tempRoot, "compiled");
  await mkdir(outDir, { recursive: true });

  try {
    const compile = runTsc(outDir);
    const require = createRequire(import.meta.url);
    const { createReceiverHandoffBundle } = require(path.join(outDir, "receiver-handoff-bundle.js"));
    const helperResult = await createReceiverHandoffBundle({
      packet_id: PACKET_ID,
      receiver: "ReceiverCreateApiHelperSmoke@Betsy",
      base_url: BASE_URL,
      bundle_id: HELPER_BUNDLE_ID,
    });
    assertBundle(helperResult, HELPER_BUNDLE_ID, "ReceiverCreateApiHelperSmoke@Betsy");

    const helperManifest = await readJson(helperResult.manifest_path);
    const helperTemplate = await readJson(helperResult.receipt_template_path);
    assertPass(helperManifest.lane === "Harvey/Nerdkle architecture", "helper manifest lane mismatch");
    assertPass(helperManifest.post_command.includes("organism-receiver-receipt-post.mjs"), "helper manifest post command missing");
    assertPass(helperTemplate.status === "blocked", "helper template not blocked");
    assertPass(helperTemplate.blocked_reason === "TEMPLATE_NOT_FILLED", "helper template blocked reason mismatch");

    const live = await postLiveBundle();
    assertPass(live.status === 201, `live create status ${live.status} is not 201`);
    assertBundle(live.result, LIVE_BUNDLE_ID, "ReceiverCreateApiLiveSmoke@Betsy");

    const liveManifest = await readJson(live.result.manifest_path);
    const liveTemplate = await readJson(live.result.receipt_template_path);
    assertPass(liveManifest.lane === "Harvey/Nerdkle architecture", "live manifest lane mismatch");
    assertPass(liveManifest.endpoint === `${BASE_URL}/api/organism/contracts/receiver-receipts`, "live manifest endpoint mismatch");
    assertPass(liveTemplate.status === "blocked", "live template not blocked");
    assertPass(liveTemplate.blocked_reason === "TEMPLATE_NOT_FILLED", "live template blocked reason mismatch");

    const routeSource = await readFile(path.join(ROOT, "app", "api", "organism", "contracts", "receiver-handoffs", "route.ts"), "utf8");
    assertPass(routeSource.includes("export async function POST"), "receiver handoff route missing POST");
    assertPass(routeSource.includes("createReceiverHandoffBundle"), "receiver handoff route does not call creator");
    assertPass(routeSource.includes("PACKET_ID_REQUIRED"), "receiver handoff route does not validate packet id");

    const index = await getHandoffIndex();
    const helperRecord = index.records.find((record) => record.bundle_id === HELPER_BUNDLE_ID);
    const liveRecord = index.records.find((record) => record.bundle_id === LIVE_BUNDLE_ID);
    assertPass(helperRecord?.state === "pending_receiver", "helper bundle is not pending_receiver in index");
    assertPass(liveRecord?.state === "pending_receiver", "live bundle is not pending_receiver in index");
    assertPass(index.pending_count >= 2, "handoff index pending count did not include created bundles");
    assertPass(index.invalid_count === 0, "handoff index invalid count not zero");
    assertPass(index.malformed_count === 0, "handoff index malformed count not zero");

    const hashes = await fileHashes(HASH_FILES);
    const outputReceipt = {
      schema: "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_CREATE_API_V0_RECEIPT",
      status: "ARTIFACT",
      timestamp: new Date().toISOString(),
      machine: "BETSY",
      agent: "Heimerdinker@Betsy",
      packet_id: PACKET_ID,
      receipt_id: "BOOK_ARCHITECTURE_RECEIVER_HANDOFF_CREATE_API_V0_RECEIPT_20260706",
      repo: ROOT,
      command: "node scripts/foreman/receiver-handoff-create-api-smoke.mjs",
      files_changed: [
        "lib/organism/contracts/receiver-handoff-bundle.ts",
        "app/api/organism/contracts/receiver-handoffs/route.ts",
        "scripts/foreman/receiver-handoff-create-api-smoke.mjs",
        "foreman/receipts/BOOK_ARCHITECTURE_RECEIVER_HANDOFF_CREATE_API_V0_RECEIPT_20260706.json",
      ],
      runtime_artifacts_written: [
        helperResult.packet_path,
        helperResult.receipt_template_path,
        helperResult.handoff_path,
        helperResult.manifest_path,
        live.result.packet_path,
        live.result.receipt_template_path,
        live.result.handoff_path,
        live.result.manifest_path,
      ],
      validation: {
        tsc_compile: "passed",
        helper_create_ok: true,
        live_post_create_ok: true,
        live_post_status: live.status,
        route_has_post: true,
        route_calls_bundle_creator: true,
        route_requires_packet_id: true,
        helper_template_status: helperTemplate.status,
        live_template_status: liveTemplate.status,
        templates_blocked_reason: "TEMPLATE_NOT_FILLED",
        helper_index_state: helperRecord.state,
        live_index_state: liveRecord.state,
        handoff_index_pending_count: index.pending_count,
        handoff_index_invalid_count: index.invalid_count,
        handoff_index_malformed_count: index.malformed_count,
        truth_boundary: "The create API mints pending blocked handoff templates only; it does not claim receiver work or completion.",
      },
      helper_bundle: helperResult,
      live_bundle: live.result,
      live_index_records: [helperRecord, liveRecord],
      file_hashes: hashes,
      compile,
      stop_conditions_respected: [
        "no deploy",
        "no push",
        "no secrets",
        "no production mutation",
        "no receiver receipt posted",
        "no synthetic completion receipt",
      ],
      next_safe_action: "Wire a TinkerDen UI control to create receiver handoff bundles from visible contract packets, or hand the pending API-created bundle to a real separate Aeye.",
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
          helper_bundle_id: helperResult.bundle_id,
          live_bundle_id: live.result.bundle_id,
          live_status: live.status,
          pending_count: index.pending_count,
          validation: outputReceipt.validation,
        },
        null,
        2,
      ),
    );
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, status: "BLOCKER", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
