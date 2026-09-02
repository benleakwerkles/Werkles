#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const POST_CLIENT = path.join(ROOT, "scripts", "foreman", "organism-receiver-receipt-post.mjs");

const ALLOWED_STATUSES = new Set([
  "completed",
  "partial",
  "blocked",
  "source_missing",
  "breach_denied",
  "interrupted",
  "superseded",
  "needs_human_gate",
]);

function slash(value) {
  return value.split(path.sep).join("/");
}

function repoRel(value) {
  return slash(path.relative(ROOT, value));
}

function absolutePath(value) {
  return path.isAbsolute(value) ? value : path.join(ROOT, value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function safeFileId(value) {
  return String(value || "receipt")
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function usage() {
  return [
    "Usage:",
    "  node scripts/foreman/organism-receiver-handoff-return.mjs --bundle-dir <handoff-folder> --attempted <text> --changed <path> --proof-readback <text> [--status partial] [--receiver Receiver@Machine] [--post]",
    "",
    "Behavior:",
    "  Reads a receiver handoff bundle, writes returned-receipt.json, and optionally posts it through organism-receiver-receipt-post.mjs.",
    "  Refuses TEMPLATE_NOT_FILLED and refuses non-blocked receipts without proof.",
  ].join("\n");
}

function parseArgs(argv) {
  const parsed = {
    bundleDir: "",
    status: "partial",
    receiver: "",
    attempted: "",
    changed: [],
    proofReadbacks: [],
    blockedReason: "",
    nextSafeAction: "Return this receipt through the canonical organism receiver intake.",
    baseUrl: "",
    detectedBy: "",
    out: "",
    post: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }

    if (arg === "--bundle-dir") {
      parsed.bundleDir = next || "";
      index += 1;
      continue;
    }

    if (arg === "--status") {
      parsed.status = next || "";
      index += 1;
      continue;
    }

    if (arg === "--receiver") {
      parsed.receiver = next || "";
      index += 1;
      continue;
    }

    if (arg === "--attempted") {
      parsed.attempted = next || "";
      index += 1;
      continue;
    }

    if (arg === "--changed") {
      parsed.changed.push(next || "");
      index += 1;
      continue;
    }

    if (arg === "--proof-readback") {
      parsed.proofReadbacks.push(next || "");
      index += 1;
      continue;
    }

    if (arg === "--blocked-reason") {
      parsed.blockedReason = next || "";
      index += 1;
      continue;
    }

    if (arg === "--next-safe-action") {
      parsed.nextSafeAction = next || "";
      index += 1;
      continue;
    }

    if (arg === "--base-url") {
      parsed.baseUrl = next || "";
      index += 1;
      continue;
    }

    if (arg === "--detected-by") {
      parsed.detectedBy = next || "";
      index += 1;
      continue;
    }

    if (arg === "--out") {
      parsed.out = next || "";
      index += 1;
      continue;
    }

    if (arg === "--post") {
      parsed.post = true;
      continue;
    }

    throw new Error(`UNKNOWN_ARG:${arg}\n${usage()}`);
  }

  if (!parsed.bundleDir.trim()) throw new Error(`BUNDLE_DIR_REQUIRED\n${usage()}`);
  if (!ALLOWED_STATUSES.has(parsed.status)) throw new Error(`UNSUPPORTED_STATUS:${parsed.status}`);
  if (!parsed.attempted.trim()) throw new Error("ATTEMPTED_REQUIRED");
  if (parsed.attempted.includes("TEMPLATE_NOT_FILLED")) throw new Error("ATTEMPTED_STILL_TEMPLATE");
  if (parsed.proofReadbacks.some((value) => value.includes("TEMPLATE_NOT_FILLED"))) throw new Error("PROOF_STILL_TEMPLATE");
  if (parsed.status !== "blocked" && parsed.changed.filter(Boolean).length === 0) throw new Error("CHANGED_PATH_REQUIRED_FOR_NON_BLOCKED_RECEIPT");
  if (parsed.status !== "blocked" && parsed.proofReadbacks.filter(Boolean).length === 0) throw new Error("PROOF_READBACK_REQUIRED_FOR_NON_BLOCKED_RECEIPT");
  if ((parsed.status === "blocked" || parsed.status === "source_missing" || parsed.status === "breach_denied") && !parsed.blockedReason.trim()) {
    throw new Error(`BLOCKED_REASON_REQUIRED_FOR_${parsed.status.toUpperCase()}`);
  }
  return parsed;
}

async function readJson(relativePathOrAbsolute) {
  const absolute = absolutePath(relativePathOrAbsolute);
  return JSON.parse(await readFile(absolute, "utf8"));
}

async function readWithHash(relativePathOrAbsolute) {
  const absolute = absolutePath(relativePathOrAbsolute);
  const raw = await readFile(absolute, "utf8");
  return {
    absolute,
    raw,
    sha256: sha256(raw),
  };
}

function uniqueStrings(values) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function receiptFor({ args, manifest, packetCopyHash, receiptTemplate, outPath }) {
  const packetPath = manifest.bundle_paths?.packet;
  if (!packetPath) throw new Error("MANIFEST_PACKET_PATH_MISSING");
  const receiver = args.receiver.trim() || manifest.receiver || receiptTemplate.receiver || packetCopyHash.receiver || "Receiver@Unknown";
  const receiptId = `receiver_handoff_return_${safeFileId(manifest.packet_id)}_${Date.now().toString(36)}`;
  const whatChanged = uniqueStrings([
    ...args.changed,
    repoRel(outPath),
  ]);
  const proof = [
    {
      kind: "artifact_path",
      value: packetPath,
    },
    {
      kind: "hash",
      value: `${packetPath} sha256 ${packetCopyHash.sha256}`,
    },
    ...args.proofReadbacks.map((value) => ({
      kind: "readback",
      value,
    })),
  ];

  return {
    schema: "harvey_nerdkle_receipt_v0",
    receipt_id: receiptId,
    packet_id: manifest.packet_id,
    created_at: new Date().toISOString(),
    receiver,
    status: args.status,
    what_was_attempted: args.attempted.trim(),
    what_changed: whatChanged,
    what_did_not_change: [
      "The packet artifact was not rewritten by the receiver return helper.",
      "No account automation.",
      "No browser credential control.",
      "No deploy.",
      "No push.",
    ],
    proof,
    blocked_reason: args.blockedReason.trim() || null,
    next_safe_action: args.nextSafeAction.trim(),
    source_hashes_used: {
      [packetPath]: packetCopyHash.sha256,
    },
  };
}

function postReceipt({ receiptPath, manifest, args, receiver }) {
  const baseUrl = args.baseUrl.trim() || manifest.base_url || "http://127.0.0.1:3000";
  const detectedBy = args.detectedBy.trim() || receiver;
  const proc = spawnSync(
    process.execPath,
    [
      POST_CLIENT,
      "--receipt",
      receiptPath,
      "--base-url",
      baseUrl,
      "--detected-by",
      detectedBy,
    ],
    {
      cwd: ROOT,
      encoding: "utf8",
    },
  );

  if (proc.status !== 0) {
    throw new Error(`RETURN_RECEIPT_POST_FAILED\nSTDOUT:\n${proc.stdout}\nSTDERR:\n${proc.stderr}`);
  }

  return {
    stdout: proc.stdout.trim(),
    stderr: proc.stderr.trim(),
    result: JSON.parse(proc.stdout),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const bundleDir = absolutePath(args.bundleDir);
  const manifestPath = path.join(bundleDir, "manifest.json");
  const templatePath = path.join(bundleDir, "receipt-template.json");
  const manifest = await readJson(manifestPath);
  const receiptTemplate = await readJson(templatePath);
  const packetCopyPath = manifest.bundle_paths?.packet;
  if (!packetCopyPath) throw new Error("MANIFEST_PACKET_PATH_MISSING");
  const packetCopyHash = await readWithHash(packetCopyPath);
  const outPath = absolutePath(args.out || path.join(bundleDir, "returned-receipt.json"));
  const receipt = receiptFor({ args, manifest, packetCopyHash, receiptTemplate, outPath });

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  const returnedRaw = await readFile(outPath, "utf8");
  const returnedReceiptPath = repoRel(outPath);
  const output = {
    ok: true,
    packet_id: manifest.packet_id,
    receiver: receipt.receiver,
    status: receipt.status,
    receipt_id: receipt.receipt_id,
    returned_receipt_path: returnedReceiptPath,
    returned_receipt_sha256: sha256(returnedRaw),
    template_source_path: repoRel(templatePath),
    manifest_path: repoRel(manifestPath),
    posted: false,
  };

  if (args.post) {
    const post = postReceipt({
      receiptPath: returnedReceiptPath,
      manifest,
      args,
      receiver: receipt.receiver,
    });
    output.posted = true;
    output.post_result = post.result;
    output.local_contract_artifact_exists = existsSync(path.join(ROOT, post.result.contract_write?.artifact_path || ""));
  }

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, status: "BLOCKER", error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
