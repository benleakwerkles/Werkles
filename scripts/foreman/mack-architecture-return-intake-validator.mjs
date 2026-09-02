#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DEFAULT_INTAKE_PATH = path.join(
  ROOT,
  "foreman",
  "source_material",
  "manuscript_workbench",
  "tinkularity",
  "architecture",
  "MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md",
);
const DEFAULT_RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "MACK_ARCHITECTURE_RETURN_INTAKE_VALIDATOR_RECEIPT_20260706.json",
);
const DEFAULT_NEXT_BUILD_PACKET_PATH = path.join(
  ROOT,
  "foreman",
  "source_material",
  "manuscript_workbench",
  "tinkularity",
  "architecture",
  "MACK_ARCHITECTURE_NEXT_BUILD_PACKET_FROM_RETURN_20260706.md",
);
const INTAKE_PATH = path.resolve(process.env.MACK_ARCHITECTURE_INTAKE_PATH || DEFAULT_INTAKE_PATH);
const RECEIPT_PATH = path.resolve(process.env.MACK_ARCHITECTURE_VALIDATOR_RECEIPT_PATH || DEFAULT_RECEIPT_PATH);
const NEXT_BUILD_PACKET_PATH = path.resolve(
  process.env.MACK_ARCHITECTURE_NEXT_BUILD_PACKET_PATH || DEFAULT_NEXT_BUILD_PACKET_PATH,
);

const REQUIRED_FIELDS = [
  "status",
  "strongest_objection",
  "simplest_viable_architecture",
  "highest_risk_fake_success_path",
  "first_momentum_build",
  "must_change_before_book",
  "optional_later",
  "score_0_to_10",
  "proof_surface_readback",
];

const FIELD_ALIASES = new Map([
  ["bottom_line", "bottom_line"],
  ["status", "status"],
  ["strongest_objection", "strongest_objection"],
  ["simplest_viable_architecture", "simplest_viable_architecture"],
  ["highest_risk_fake_success_path", "highest_risk_fake_success_path"],
  ["first_momentum_build", "first_momentum_build"],
  ["must_change_before_book", "must_change_before_book"],
  ["optional_later", "optional_later"],
  ["score_0_to_10", "score_0_to_10"],
  ["proof_surface_readback", "proof_surface_readback"],
]);

function slash(value) {
  return value.split(path.sep).join("/");
}

function repoRel(value) {
  return slash(path.relative(ROOT, value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function hasFlag(flag) {
  return process.argv.slice(2).includes(flag);
}

function extractMackReturnBlock(markdown) {
  const fencePattern = /```(?:text)?\r?\n([\s\S]*?)```/g;
  let match;
  let candidate = "";

  while ((match = fencePattern.exec(markdown)) !== null) {
    const block = match[1].trim();
    if (block.startsWith("MACK REVIEW RETURN")) {
      candidate = block;
    }
  }

  return candidate;
}

function normalizeFieldName(value) {
  return FIELD_ALIASES.get(String(value || "").trim().toLowerCase()) || "";
}

function parseFields(block) {
  const fields = new Map();
  let current = "";
  const lines = block.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.trim() === "MACK REVIEW RETURN") continue;

    const fieldMatch = /^([a-zA-Z0-9_]+):\s*(.*)$/.exec(line);
    const fieldName = fieldMatch ? normalizeFieldName(fieldMatch[1]) : "";
    if (fieldName) {
      current = fieldName;
      fields.set(current, fieldMatch[2].trim());
      continue;
    }

    if (current) {
      const previous = fields.get(current) || "";
      fields.set(current, previous ? `${previous}\n${line}` : line.trim());
    }
  }

  return Object.fromEntries([...fields.entries()].map(([key, value]) => [key, String(value || "").trim()]));
}

function isPlaceholderValue(value) {
  const normalized = String(value || "").trim();
  return (
    normalized === "" ||
    normalized === "_____" ||
    normalized === "YES | NO" ||
    normalized === "ACCEPT | REVISE | REJECT" ||
    normalized === "NEEDS_NORMALIZATION"
  );
}

function fieldCompleteness(fields) {
  return REQUIRED_FIELDS.map((field) => ({
    field,
    present: Object.prototype.hasOwnProperty.call(fields, field),
    filled: !isPlaceholderValue(fields[field]),
  }));
}

function classifyIntake(markdown, fields) {
  const completeness = fieldCompleteness(fields);
  const missing = completeness.filter((entry) => !entry.present).map((entry) => entry.field);
  const empty = completeness.filter((entry) => entry.present && !entry.filled).map((entry) => entry.field);
  const filledRequiredCount = completeness.filter((entry) => entry.filled).length;
  const waitingMarker = /Status:\s*WAITING_FOR_MACK_RETURN/i.test(markdown);
  const noReviewMarker = /Mack review has not been received yet\./i.test(markdown);
  const status = String(fields.status || "").trim().toUpperCase();
  const statusValid = ["ACCEPT", "REVISE", "REJECT"].includes(status);

  if ((waitingMarker || noReviewMarker) && filledRequiredCount <= 1) {
    return {
      status: "BLOCKER",
      blocker_code: "MACK_RETURN_NOT_RECEIVED",
      missing,
      empty,
      statusValid,
      filledRequiredCount,
      message: "Mack review has not been pasted into the intake file yet.",
    };
  }

  if (missing.length > 0 || empty.length > 0) {
    return {
      status: "BLOCKER",
      blocker_code: "MACK_RETURN_INCOMPLETE",
      missing,
      empty,
      statusValid,
      filledRequiredCount,
      message: "Mack return exists but required fields are missing or empty.",
    };
  }

  if (!statusValid) {
    return {
      status: "BLOCKER",
      blocker_code: "MACK_RETURN_STATUS_INVALID",
      missing,
      empty,
      statusValid,
      filledRequiredCount,
      message: "Mack return status must be ACCEPT, REVISE, or REJECT.",
    };
  }

  return {
    status: "ARTIFACT_READY",
    blocker_code: "",
    missing,
    empty,
    statusValid,
    filledRequiredCount,
    message: "Mack return has the required fields.",
  };
}

function buildNextPacket(fields) {
  return `# Mack-Derived Next Build Packet

Status: DRAFT_PENDING_BEN_ACCEPTANCE
Date: 2026-07-06
Source packet: MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706
Source intake: foreman/source_material/manuscript_workbench/tinkularity/architecture/MACK_ARCHITECTURE_TEAR_APART_RETURN_INTAKE_20260706.md

## Mack Status

${fields.status}

## Strongest Objection

${fields.strongest_objection}

## Simplest Viable Architecture

${fields.simplest_viable_architecture}

## Highest-Risk Fake-Success Path

${fields.highest_risk_fake_success_path}

## First Momentum Build

${fields.first_momentum_build}

## Must Change Before Book

${fields.must_change_before_book}

## Optional Later

${fields.optional_later}

## Score

${fields.score_0_to_10}

## Proof Surface Readback

${fields.proof_surface_readback}

## Bottom Line

${fields.bottom_line || "Mack did not provide a bottom-line sentence."}

## Gate

This packet is generated only after Ben accepts Mack's direction. If this file exists without Ben acceptance, treat it as invalid.
`;
}

async function main() {
  const markdown = await readFile(INTAKE_PATH, "utf8");
  const block = extractMackReturnBlock(markdown);
  const fields = block ? parseFields(block) : {};
  const classification = classifyIntake(markdown, fields);
  const convertRequested = hasFlag("--convert");
  const benAccepted = hasFlag("--ben-accepted");
  let nextBuildPacket = null;

  if (convertRequested && classification.status === "ARTIFACT_READY") {
    if (!benAccepted) {
      classification.status = "BLOCKER";
      classification.blocker_code = "BEN_ACCEPTANCE_GATE_REQUIRED";
      classification.message = "Mack return is complete, but Ben acceptance is required before generating a next build packet.";
    } else {
      const packetText = buildNextPacket(fields);
      await mkdir(path.dirname(NEXT_BUILD_PACKET_PATH), { recursive: true });
      await writeFile(NEXT_BUILD_PACKET_PATH, packetText, "utf8");
      nextBuildPacket = {
        path: repoRel(NEXT_BUILD_PACKET_PATH),
        sha256: sha256(packetText),
      };
    }
  }

  const receipt = {
    schema: "MACK_ARCHITECTURE_RETURN_INTAKE_VALIDATOR_RECEIPT",
    status: classification.status === "ARTIFACT_READY" ? "ARTIFACT" : "BLOCKER",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706",
    receipt_id: "MACK_ARCHITECTURE_RETURN_INTAKE_VALIDATOR_RECEIPT_20260706",
    repo: ROOT,
    command: `node scripts/foreman/mack-architecture-return-intake-validator.mjs${convertRequested ? " --convert" : ""}${benAccepted ? " --ben-accepted" : ""}`,
    intake_path: repoRel(INTAKE_PATH),
    classification,
    parsed_fields: fields,
    field_completeness: fieldCompleteness(fields),
    next_build_packet: nextBuildPacket,
    validation: {
      intake_file_read: true,
      mack_return_block_found: Boolean(block),
      current_state_is_waiting: classification.blocker_code === "MACK_RETURN_NOT_RECEIVED",
      no_fake_mack_receipt_claim: true,
      ben_acceptance_gate_required_for_conversion: true,
      truth_boundary:
        "This validator reads the local Mack intake file. It does not claim Mack has responded unless required return fields are present.",
    },
    file_hashes: [
      {
        path: repoRel(INTAKE_PATH),
        sha256: sha256(markdown),
      },
    ],
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no external send claim",
      "no Mack receipt claim",
    ],
  };

  await mkdir(path.dirname(RECEIPT_PATH), { recursive: true });
  await writeFile(RECEIPT_PATH, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  const finalRaw = await readFile(RECEIPT_PATH, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        status: receipt.status,
        blocker_code: classification.blocker_code || "",
        receipt_path: repoRel(RECEIPT_PATH),
        receipt_sha256: sha256(finalRaw),
        intake_path: repoRel(INTAKE_PATH),
        next_build_packet: nextBuildPacket,
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
