#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const GITHUB_STATUS_PATH = "foreman/artifacts/nerdkle_github_source_material_status.json";
const MATERIALIZED_STATUS_PATH = "foreman/artifacts/nerdkle_materialized_source_status.json";
const NMCLR_SANDBOX_STATUS_PATH = "foreman/artifacts/nmclr_sandbox_execution_status.json";
const OUTPUT_PATH = "foreman/artifacts/nerdkle_source_work_queue.json";

const EXPECTED_REAL_INPUTS = {
  circulation_db: [
    "C:\\tinkarden\\server\\circulation.db",
    "C:\\tinkarden\\circulation.db",
    "C:\\Users\\benle\\Documents\\Werkles\\data\\organism\\circulation.db",
    "C:\\Users\\benle\\Documents\\Werkles\\circulation.db",
  ],
  world_state_json: [
    "C:\\tinkarden\\world_state.json",
    "C:\\Users\\benle\\Documents\\Werkles\\data\\organism\\world_state.json",
  ],
  speaker_queue: [
    "C:\\tinkarden\\intake\\speaker_queue",
    "C:\\Users\\benle\\Documents\\Werkles\\tinkarden\\intake\\speaker_queue",
  ],
};

function abs(relPath) {
  return path.join(ROOT, relPath);
}

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(abs(relPath), "utf8"));
}

function readJsonIfExists(relPath) {
  return fs.existsSync(abs(relPath)) ? readJson(relPath) : null;
}

function existsAny(paths) {
  return paths
    .filter((candidate) => fs.existsSync(candidate))
    .map((candidate) => {
      const stat = fs.statSync(candidate);
      return {
        path: candidate,
        kind: stat.isDirectory() ? "directory" : "file",
        byte_count: stat.isFile() ? stat.size : null,
        last_write_time: stat.mtime.toISOString(),
      };
    });
}

function activePathStatus(relPaths) {
  return relPaths.map((relPath) => ({
    path: relPath,
    exists: fs.existsSync(abs(relPath)),
  }));
}

function materializedById(materializedStatus) {
  return new Map((materializedStatus.materialized || []).map((item) => [item.source_id, item]));
}

function sourceById(githubStatus) {
  return new Map((githubStatus.sources || []).map((item) => [item.source_id, item]));
}

function queueItem({
  queueId,
  source,
  materialized,
  priority,
  queueState,
  recommendedNextStep,
  proofNeeded,
  blockers = [],
  forbidden = [],
  activeChecks = [],
}) {
  return {
    queue_id: queueId,
    source_id: source.source_id,
    title: source.title,
    source_type: source.source_type,
    priority,
    queue_state: queueState,
    source_status: source.source_status,
    canonicality: source.canonicality,
    proof_boundary: source.proof_boundary,
    materialized_manifest: materialized?.manifest_path || null,
    recommended_next_step: recommendedNextStep,
    proof_needed: proofNeeded,
    blockers,
    forbidden,
    active_checks: activeChecks,
  };
}

function main() {
  const githubStatus = readJson(GITHUB_STATUS_PATH);
  const materializedStatus = readJson(MATERIALIZED_STATUS_PATH);
  const nmclrSandboxStatus = readJsonIfExists(NMCLR_SANDBOX_STATUS_PATH);
  const nmclrSandboxPass = nmclrSandboxStatus?.status === "PASS_NMCLR_SANDBOX_EXECUTION_PROOF"
    && nmclrSandboxStatus?.causal_chain?.pass === true
    && nmclrSandboxStatus?.movement_chain?.pass === true;
  const sources = sourceById(githubStatus);
  const materialized = materializedById(materializedStatus);

  const realInputs = {
    circulation_db: existsAny(EXPECTED_REAL_INPUTS.circulation_db),
    world_state_json: existsAny(EXPECTED_REAL_INPUTS.world_state_json),
    speaker_queue: existsAny(EXPECTED_REAL_INPUTS.speaker_queue),
  };

  const items = [];

  const nmclr = sources.get("github-nmclr-proof-body-preserve-v0-20260627");
  if (nmclr) {
    items.push(queueItem({
      queueId: "Q1_NMCLR_SANDBOX_EXECUTION_PROOF",
      source: nmclr,
      materialized: materialized.get(nmclr.source_id),
      priority: 1,
      queueState: nmclrSandboxPass ? "COMPLETE_LOCAL_PROOF" : "READY_LOCAL_BUILD",
      recommendedNextStep: nmclrSandboxPass
        ? "Completed. Keep this as sandbox proof unless Ben opens a human promotion gate."
        : "Run a branch-specific NMCLR execution proof inside the materialized snapshot and capture packet -> work -> artifact receipts without promoting it to canon.",
      proofNeeded: nmclrSandboxPass
        ? []
        : [
          "node --check against materialized NMCLR scripts",
          "execution output under foreman/artifacts or materialized snapshot receipts",
          "receipt proving packet -> work -> artifact",
        ],
      forbidden: [
        "Do not call the branch canonical.",
        "Do not move NMCLR into live root until human promotion exists.",
      ],
      activeChecks: activePathStatus([
        "NMCLR/spec/build/nmclr-first-slice.mjs",
        "foreman/nerdkle/source_intake/materialized/github-nmclr-proof-body-preserve-v0-20260627/files/NMCLR/spec/build/nmclr-first-slice.mjs",
      ]),
    }));
  }

  const nervous = sources.get("github-nerdkle-nervous-system-organs-v0-20260627");
  if (nervous) {
    const missingRealInputs = [
      realInputs.circulation_db.length ? null : "real_circulation_db",
      realInputs.world_state_json.length ? null : "real_world_state_json",
    ].filter(Boolean);
    items.push(queueItem({
      queueId: "Q2_NERVOUS_SYSTEM_INPUT_LOCATOR",
      source: nervous,
      materialized: materialized.get(nervous.source_id),
      priority: 2,
      queueState: missingRealInputs.length ? "READY_LOCAL_PREP_BLOCKED_REAL_INPUTS" : "READY_PRODUCTION_READBACK_DRY_RUN",
      recommendedNextStep: "Build a read-only production-input locator for Swateyes, Fleyes, and Ender apoptosis before copying any organ into live paths.",
      proofNeeded: [
        "real action payload from Medulla or Fastify",
        "real circulation.db containing shadow_cache",
        "real Wormeyes world_state.json",
        "dry-run readback with file paths, byte counts, and SHA256 hashes",
      ],
      blockers: missingRealInputs,
      forbidden: [
        "Do not delete doctrine.",
        "Do not call no-input NO_FRICTION_DETECTED a healthy organism.",
        "Do not mutate production DB rows.",
      ],
      activeChecks: activePathStatus([
        "tinkarden/nervous_system/fleyes.js",
        "tinkarden/nervous_system/swateyes.js",
        "tinkarden/nervous_system/ender_apoptosis.js",
      ]),
    }));
  }

  const receiptCrawler = sources.get("github-receipt-crawler-v0-20260627");
  if (receiptCrawler) {
    const missing = [
      realInputs.circulation_db.length ? null : "real_circulation_db",
      realInputs.speaker_queue.length ? null : "speaker_queue",
    ].filter(Boolean);
    items.push(queueItem({
      queueId: "Q3_RECEIPT_CRAWLER_READ_ONLY_LEDGER_AUDIT",
      source: receiptCrawler,
      materialized: materialized.get(receiptCrawler.source_id),
      priority: 3,
      queueState: missing.length ? "BLOCKED_REAL_LEDGER" : "READY_READ_ONLY_LEDGER_AUDIT",
      recommendedNextStep: "Build a read-only ledger audit that reports LiveReceipt schema and candidate rows before any crawler movement proof.",
      proofNeeded: [
        "LiveReceipt table exists",
        "status and ASSIMILATED columns exist",
        "candidate SUCCESS / unassimilated row exists",
      ],
      blockers: missing,
      forbidden: [
        "Do not update ASSIMILATED in this prep step.",
        "Do not delete SQLite history rows.",
        "Do not call DB_MISSING a successful receipt move.",
      ],
      activeChecks: activePathStatus([
        "scripts/foreman/crawler.js",
        "foreman/nerdkle/source_intake/materialized/github-receipt-crawler-v0-20260627/files/scripts/foreman/crawler.js",
      ]),
    }));
  }

  const book = sources.get("github-book-architecture-stream-split-v0-20260627");
  if (book) {
    items.push(queueItem({
      queueId: "Q4_BOOK_BOUNDARY_REFERENCE",
      source: book,
      materialized: materialized.get(book.source_id),
      priority: 4,
      queueState: "READY_REFERENCE_ONLY",
      recommendedNextStep: "Use the stream-split manuscript as a boundary reference in future receipts and reports, not as implementation proof.",
      proofNeeded: [
        "human merge decision before canon",
        "quoted boundary language only when relevant",
      ],
      blockers: ["human_merge_decision_for_canon"],
      forbidden: [
        "Do not use manuscript doctrine as automation proof.",
        "Do not mark Feral, NMCLR, TinkerDen, Dink, or Maker artifacts as working because this manuscript exists.",
      ],
      activeChecks: activePathStatus([
        "foreman/nerdkle/source_intake/materialized/github-book-architecture-stream-split-v0-20260627/files/book/architecture/STREAM_SPLIT_AND_PROOF_BOUNDARIES_V0.md",
      ]),
    }));
  }

  const readyItems = items.filter((item) => item.queue_state.startsWith("READY"));
  const blockedItems = items.filter((item) => item.queue_state.includes("BLOCKED") || item.blockers.length);
  const report = {
    artifact_id: "NERDKLE_SOURCE_WORK_QUEUE",
    generated_at: new Date().toISOString(),
    status: readyItems.length ? "PASS_SOURCE_WORK_QUEUE" : "BLOCKED_SOURCE_WORK_QUEUE",
    rule: "Queue recommends local next slices from verified GitHub source material without promoting review branches or mutating production inputs.",
    next_recommended_queue_id: readyItems[0]?.queue_id || null,
    ready_count: readyItems.length,
    blocked_count: blockedItems.length,
    real_input_probe: realInputs,
    items,
  };

  fs.mkdirSync(abs(path.dirname(OUTPUT_PATH)), { recursive: true });
  fs.writeFileSync(abs(OUTPUT_PATH), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`${report.status}: wrote ${OUTPUT_PATH}`);
  console.log(`next=${report.next_recommended_queue_id || "NONE"} ready=${report.ready_count} blocked=${report.blocked_count}`);
  if (!readyItems.length) process.exit(1);
}

try {
  main();
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}
