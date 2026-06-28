"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const SPEAKER_ROOT = process.env.SPEAKER_ROOT || "C:\\speaker";
const DOCTRINE_STAGED = path.join(SPEAKER_ROOT, "doctrine", "staged");
const RECEIPTS_STAGED = path.join(SPEAKER_ROOT, "receipts", "staged");
const RECEIPT_LOOKUP_DIRS = [
  path.join(SPEAKER_ROOT, "receipts", "staged"),
  path.join(SPEAKER_ROOT, "receipts", "canonical"),
  path.join(SPEAKER_ROOT, "receipts", "quarantine"),
  path.join(SPEAKER_ROOT, "receipts", "incoming"),
  path.join(SPEAKER_ROOT, "receipts", "raw", "inbox"),
];

const dryRunBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["source_anchor_hash", "target_paths", "proposed_delta_vectors"],
  properties: {
    source_anchor_hash: {
      type: "string",
      pattern: "^[A-Fa-f0-9]{32,128}$",
    },
    target_paths: {
      type: "array",
      minItems: 1,
      maxItems: 200,
      items: {
        type: "string",
        minLength: 1,
        maxLength: 300,
      },
    },
    proposed_delta_vectors: {
      type: "array",
      minItems: 1,
      maxItems: 200,
      items: {
        type: "object",
        additionalProperties: true,
      },
    },
  },
};

const shadowMergeBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["dry_run_token", "target_staging_directory"],
  properties: {
    dry_run_token: {
      type: "string",
      pattern: "^DRYRUN_[A-F0-9]{16,64}$",
    },
    target_staging_directory: {
      type: "string",
      minLength: 1,
      maxLength: 260,
    },
  },
};

function sha256Text(value) {
  return crypto.createHash("sha256").update(value).digest("hex").toUpperCase();
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function normalizePathLabel(value) {
  return String(value || "")
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\/c\//i, "c:/")
    .replace(/\/+$/g, "")
    .toLowerCase();
}

function resolveAllowedStagingDirectory(value) {
  const normalized = normalizePathLabel(value);
  const doctrineLabels = new Set([
    "/speaker/doctrine/staged",
    "c:/speaker/doctrine/staged",
    normalizePathLabel(DOCTRINE_STAGED),
  ]);
  const receiptLabels = new Set([
    "/speaker/receipts/staged",
    "c:/speaker/receipts/staged",
    normalizePathLabel(RECEIPTS_STAGED),
  ]);

  if (doctrineLabels.has(normalized)) return DOCTRINE_STAGED;
  if (receiptLabels.has(normalized)) return RECEIPTS_STAGED;
  return null;
}

function safeId(value) {
  return String(value || "").replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 96);
}

function receiptCandidateNames(id) {
  if (/\.(json|md|txt)$/i.test(id)) return [id];
  return [id, `${id}.json`, `${id}.md`, `${id}.txt`];
}

function resolveReceiptFile(id) {
  const names = receiptCandidateNames(id);
  for (const dir of RECEIPT_LOOKUP_DIRS) {
    for (const name of names) {
      const candidate = path.join(dir, name);
      const resolvedDir = path.resolve(dir);
      const resolvedCandidate = path.resolve(candidate);
      if (!resolvedCandidate.toLowerCase().startsWith(`${resolvedDir.toLowerCase()}${path.sep}`)) continue;
      if (fs.existsSync(resolvedCandidate) && fs.statSync(resolvedCandidate).isFile()) {
        return resolvedCandidate;
      }
    }
  }
  return null;
}

function readReceiptFile(filePath) {
  const raw = fs.readFileSync(filePath);
  const text = raw.toString("utf8");
  let parsed = null;
  if (/\.json$/i.test(filePath)) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }
  const stat = fs.statSync(filePath);
  return {
    path: filePath,
    byte_count: raw.length,
    sha256: sha256Text(raw),
    modified_at: stat.mtime.toISOString(),
    parsed_json: parsed,
    text: parsed ? null : text,
  };
}

async function registerFeralContractRoutes(fastify) {
  fastify.post("/v1/action/dry_run", { schema: { body: dryRunBodySchema } }, async (request, reply) => {
    const body = request.body;
    const canonicalInput = {
      source_anchor_hash: body.source_anchor_hash.toUpperCase(),
      target_paths: body.target_paths,
      proposed_delta_vectors: body.proposed_delta_vectors,
    };
    const predictedTreeHash = sha256Text(stableJson({
      contract: "FERAL_TINKERDEN_DRY_RUN_V1",
      ...canonicalInput,
    }));

    return reply
      .header("cache-control", "no-store")
      .send({
        status: "DRY_RUN_PREDICTED",
        side_effects: "NONE",
        source_anchor_hash: canonicalInput.source_anchor_hash,
        target_paths_count: canonicalInput.target_paths.length,
        proposed_delta_vector_count: canonicalInput.proposed_delta_vectors.length,
        predicted_tree_hash: predictedTreeHash,
        dry_run_token: `DRYRUN_${predictedTreeHash.slice(0, 32)}`,
      });
  });

  fastify.post("/v1/action/shadow_merge", { schema: { body: shadowMergeBodySchema } }, async (request, reply) => {
    const targetDirectory = resolveAllowedStagingDirectory(request.body.target_staging_directory);
    if (!targetDirectory) {
      return reply.code(400).send({
        status: "SHADOW_MERGE_BLOCKED",
        error: "target_staging_directory must be /speaker/doctrine/staged/ or /speaker/receipts/staged/",
      });
    }

    fs.mkdirSync(targetDirectory, { recursive: true });
    const createdAt = new Date().toISOString();
    const payload = {
      status: "SHADOW_MERGE_STAGED_INERT",
      contract: "FERAL_TINKERDEN_SHADOW_MERGE_V1",
      created_at: createdAt,
      dry_run_token: request.body.dry_run_token,
      target_staging_directory: targetDirectory,
      inert: true,
      no_execution: true,
      no_git: true,
      no_canonical_status_change: true,
    };
    const fileName = `SHADOW_MERGE_${safeId(request.body.dry_run_token)}_${createdAt.replace(/[-:.TZ]/g, "").slice(0, 14)}.json`;
    const outPath = path.join(targetDirectory, fileName);
    const body = `${JSON.stringify(payload, null, 2)}\n`;
    fs.writeFileSync(outPath, body, "utf8");

    return reply
      .code(201)
      .header("cache-control", "no-store")
      .send({
        status: "SHADOW_MERGE_STAGED",
        artifact_path: outPath,
        byte_count: Buffer.byteLength(body, "utf8"),
        sha256: sha256Text(body),
        target_staging_directory: targetDirectory,
      });
  });

  fastify.get("/v1/receipt/:id", {
    schema: {
      params: {
        type: "object",
        additionalProperties: false,
        required: ["id"],
        properties: {
          id: {
            type: "string",
            pattern: "^[A-Za-z0-9._-]{1,160}$",
          },
        },
      },
    },
  }, async (request, reply) => {
    const receiptId = request.params.id;
    const filePath = resolveReceiptFile(receiptId);
    if (!filePath) {
      return reply.code(404).send({
        status: "RECEIPT_NOT_FOUND",
        receipt_id: receiptId,
        rule: "Literal file-id lookup only. No guessing, fuzzy search, or synthetic receipt.",
      });
    }

    return reply
      .header("cache-control", "no-store")
      .send({
        status: "RECEIPT_FOUND",
        receipt_id: receiptId,
        receipt: readReceiptFile(filePath),
      });
  });
}

module.exports = registerFeralContractRoutes;
