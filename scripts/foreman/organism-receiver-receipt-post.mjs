#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DEFAULT_BASE_URL = process.env.WERKLES_LOCAL_BASE_URL || "http://127.0.0.1:3000";

function slash(value) {
  return value.split(path.sep).join("/");
}

function repoRel(value) {
  return slash(path.relative(ROOT, value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function usage() {
  return [
    "Usage:",
    "  node scripts/foreman/organism-receiver-receipt-post.mjs --receipt <receipt.json> [--base-url http://127.0.0.1:3000] [--detected-by Receiver@Machine]",
    "",
    "Behavior:",
    "  Reads a Harvey/Nerdkle receipt JSON file and POSTs it to /api/organism/contracts/receiver-receipts.",
    "  Exits nonzero on schema-invalid or transport failure. Does not claim downstream completion for the receiver.",
  ].join("\n");
}

function parseArgs(argv) {
  const parsed = {
    receiptPath: "",
    baseUrl: DEFAULT_BASE_URL,
    detectedBy: "organism-receiver-receipt-post-client",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--help" || arg === "-h") {
      console.log(usage());
      process.exit(0);
    }

    if (arg === "--receipt") {
      parsed.receiptPath = next || "";
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

    throw new Error(`UNKNOWN_ARG:${arg}\n${usage()}`);
  }

  if (!parsed.receiptPath.trim()) throw new Error(`RECEIPT_PATH_REQUIRED\n${usage()}`);
  if (!parsed.baseUrl.trim()) throw new Error("BASE_URL_REQUIRED");
  if (!parsed.detectedBy.trim()) throw new Error("DETECTED_BY_REQUIRED");
  return parsed;
}

async function readReceipt(receiptPath) {
  const absolutePath = path.isAbsolute(receiptPath) ? receiptPath : path.join(ROOT, receiptPath);
  const raw = await readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw);
  return {
    absolutePath,
    receipt: parsed?.receipt && typeof parsed.receipt === "object" ? parsed.receipt : parsed,
    sha256: sha256(raw),
  };
}

async function postReceipt({ baseUrl, detectedBy, receipt }) {
  const endpoint = `${baseUrl.replace(/\/+$/g, "")}/api/organism/contracts/receiver-receipts`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      detected_by: detectedBy,
      receipt,
    }),
  });
  const result = await response.json().catch(() => ({ ok: false, error: "NON_JSON_RESPONSE" }));

  if (!response.ok || result.ok !== true) {
    const error = new Error(`RECEIVER_RECEIPT_POST_FAILED:${response.status}:${JSON.stringify(result)}`);
    error.result = result;
    error.statusCode = response.status;
    throw error;
  }

  return {
    endpoint,
    result,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const receiptRead = await readReceipt(args.receiptPath);
  const posted = await postReceipt({
    baseUrl: args.baseUrl,
    detectedBy: args.detectedBy,
    receipt: receiptRead.receipt,
  });

  const artifactPath = posted.result.contract_write?.artifact_path;
  const artifactExists = typeof artifactPath === "string" && existsSync(path.join(ROOT, artifactPath));
  const output = {
    ok: true,
    endpoint: posted.endpoint,
    source_receipt_path: repoRel(receiptRead.absolutePath),
    source_receipt_sha256: receiptRead.sha256,
    detected_by: args.detectedBy,
    receipt_id: posted.result.receipt_id,
    packet_id: posted.result.packet_id,
    receipt_status: posted.result.receipt_status,
    contract_write: posted.result.contract_write,
    local_contract_artifact_exists: artifactExists,
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        status: "BLOCKER",
        error: error instanceof Error ? error.message : String(error),
        result: error?.result,
      },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
