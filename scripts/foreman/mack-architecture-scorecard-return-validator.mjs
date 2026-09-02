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
  "MACK_ARCHITECTURE_ATTACK_SCORECARD_RETURN_INTAKE_20260706.md",
);
const DEFAULT_RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_RECEIPT_20260706.json",
);

const INTAKE_PATH = path.resolve(process.env.MACK_ARCHITECTURE_SCORECARD_INTAKE_PATH || DEFAULT_INTAKE_PATH);
const RECEIPT_PATH = path.resolve(process.env.MACK_ARCHITECTURE_SCORECARD_VALIDATOR_RECEIPT_PATH || DEFAULT_RECEIPT_PATH);

const SCORE_FIELDS = [
  "central_claim_score",
  "cooperation_model_score",
  "custody_spine_score",
  "contract_canon_score",
  "gate_model_score",
  "receiver_proof_score",
  "boot_context_score",
  "event_spine_score",
  "cockpit_readback_score",
  "secret_and_human_gates_score",
  "minimal_mvp_score",
  "manuscript_balance_score",
];

const REQUIRED_FIELDS = [
  "status",
  "overall_score_0_to_36",
  ...SCORE_FIELDS,
  "strongest_objection",
  "highest_risk_fake_success_path",
  "first_momentum_build",
  "must_change_before_book",
  "optional_later",
];

const FIELD_ALIASES = new Map(REQUIRED_FIELDS.map((field) => [field, field]));

function slash(value) {
  return value.split(path.sep).join("/");
}

function repoRel(value) {
  return slash(path.relative(ROOT, value));
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function extractScorecardBlock(markdown) {
  const fencePattern = /```(?:text)?\r?\n([\s\S]*?)```/g;
  let match;
  let candidate = "";

  while ((match = fencePattern.exec(markdown)) !== null) {
    const block = match[1].trim();
    if (block.startsWith("MACK SCORECARD RETURN")) {
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
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (line.trim() === "MACK SCORECARD RETURN") continue;

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
  return normalized === "" || normalized === "_____" || normalized === "TBD" || normalized === "ACCEPT | REVISE | REJECT";
}

function fieldCompleteness(fields) {
  return REQUIRED_FIELDS.map((field) => ({
    field,
    present: Object.prototype.hasOwnProperty.call(fields, field),
    filled: !isPlaceholderValue(fields[field]),
  }));
}

function parseIntegerField(fields, field) {
  const raw = String(fields[field] || "").trim();
  if (!/^-?\d+$/.test(raw)) {
    return { field, valid: false, value: null, raw };
  }
  return { field, valid: true, value: Number.parseInt(raw, 10), raw };
}

function scoreReadback(fields) {
  const dimensionScores = SCORE_FIELDS.map((field) => parseIntegerField(fields, field));
  const overall = parseIntegerField(fields, "overall_score_0_to_36");
  const invalidScores = dimensionScores.filter((entry) => !entry.valid || entry.value < 0 || entry.value > 3);
  const sum = dimensionScores.every((entry) => entry.valid) ? dimensionScores.reduce((total, entry) => total + entry.value, 0) : null;
  const totalMatches = overall.valid && sum !== null && overall.value === sum;
  return {
    overall,
    dimension_scores: dimensionScores,
    invalid_scores: invalidScores,
    computed_sum: sum,
    total_matches: totalMatches,
  };
}

function classifyIntake(markdown, fields) {
  const completeness = fieldCompleteness(fields);
  const missing = completeness.filter((entry) => !entry.present).map((entry) => entry.field);
  const empty = completeness.filter((entry) => entry.present && !entry.filled).map((entry) => entry.field);
  const filledRequiredCount = completeness.filter((entry) => entry.filled).length;
  const waitingMarker = /Status:\s*WAITING_FOR_MACK_SCORECARD_RETURN/i.test(markdown);
  const noScorecardMarker = /Mack scorecard has not been received yet\./i.test(markdown);
  const status = String(fields.status || "").trim().toUpperCase();
  const statusValid = ["ACCEPT", "REVISE", "REJECT"].includes(status);

  if ((waitingMarker || noScorecardMarker) && filledRequiredCount <= 1) {
    return {
      status: "BLOCKER",
      blocker_code: "MACK_SCORECARD_RETURN_NOT_RECEIVED",
      missing,
      empty,
      status_valid: statusValid,
      score_readback: scoreReadback(fields),
      filled_required_count: filledRequiredCount,
      message: "Mack scorecard has not been pasted into the scorecard intake file yet.",
    };
  }

  if (missing.length > 0 || empty.length > 0) {
    return {
      status: "BLOCKER",
      blocker_code: "MACK_SCORECARD_RETURN_INCOMPLETE",
      missing,
      empty,
      status_valid: statusValid,
      score_readback: scoreReadback(fields),
      filled_required_count: filledRequiredCount,
      message: "Mack scorecard return exists but required fields are missing or empty.",
    };
  }

  if (!statusValid) {
    return {
      status: "BLOCKER",
      blocker_code: "MACK_SCORECARD_STATUS_INVALID",
      missing,
      empty,
      status_valid: statusValid,
      score_readback: scoreReadback(fields),
      filled_required_count: filledRequiredCount,
      message: "Mack scorecard status must be ACCEPT, REVISE, or REJECT.",
    };
  }

  const scores = scoreReadback(fields);
  if (scores.invalid_scores.length > 0 || !scores.overall.valid || scores.overall.value < 0 || scores.overall.value > 36) {
    return {
      status: "BLOCKER",
      blocker_code: "MACK_SCORECARD_SCORE_INVALID",
      missing,
      empty,
      status_valid: statusValid,
      score_readback: scores,
      filled_required_count: filledRequiredCount,
      message: "Mack scorecard scores must be integers in range: dimensions 0-3, overall 0-36.",
    };
  }

  if (!scores.total_matches) {
    return {
      status: "BLOCKER",
      blocker_code: "MACK_SCORECARD_TOTAL_MISMATCH",
      missing,
      empty,
      status_valid: statusValid,
      score_readback: scores,
      filled_required_count: filledRequiredCount,
      message: "Mack scorecard overall score must equal the sum of the 12 dimension scores.",
    };
  }

  return {
    status: "ARTIFACT_READY",
    blocker_code: "",
    missing,
    empty,
    status_valid: statusValid,
    score_readback: scores,
    filled_required_count: filledRequiredCount,
    message: "Mack scorecard return has the required fields and valid score math.",
  };
}

async function main() {
  const markdown = await readFile(INTAKE_PATH, "utf8");
  const block = extractScorecardBlock(markdown);
  const fields = block ? parseFields(block) : {};
  const classification = classifyIntake(markdown, fields);

  const receipt = {
    schema: "MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_RECEIPT",
    status: classification.status === "ARTIFACT_READY" ? "ARTIFACT" : "BLOCKER",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706",
    receipt_id: "MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/mack-architecture-scorecard-return-validator.mjs",
    intake_path: repoRel(INTAKE_PATH),
    classification,
    parsed_fields: fields,
    field_completeness: fieldCompleteness(fields),
    validation: {
      intake_file_read: true,
      mack_scorecard_return_block_found: Boolean(block),
      current_state_is_waiting: classification.blocker_code === "MACK_SCORECARD_RETURN_NOT_RECEIVED",
      score_math_valid: classification.status === "ARTIFACT_READY",
      no_fake_mack_scorecard_return_claim: true,
      no_fake_mack_review_return_claim: true,
      ben_acceptance_gate_required_for_conversion: true,
      truth_boundary:
        "This validator reads the local Mack scorecard intake file. It does not claim Mack returned a scorecard unless required fields and score math are present.",
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
      "no Mack review return claim",
      "no Mack scorecard return claim when intake is waiting",
      "no canonical next-build packet generated",
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
        computed_sum: classification.score_readback?.computed_sum ?? null,
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
