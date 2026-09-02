#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const VALIDATOR = path.join(ROOT, "scripts", "foreman", "mack-architecture-scorecard-return-validator.mjs");
const SMOKE_DIR = path.join(ROOT, "foreman", "tmp", "mack-scorecard-return-validator-smoke");
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_SMOKE_RECEIPT_20260706.json",
);

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

function safeSmokePath(...parts) {
  const target = path.resolve(SMOKE_DIR, ...parts);
  const relative = path.relative(SMOKE_DIR, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`SMOKE_PATH_ESCAPE:${target}`);
  }
  return target;
}

function waitingIntake() {
  return `# Mack Architecture Attack Scorecard Return Intake

Status: WAITING_FOR_MACK_SCORECARD_RETURN

## Current Status

Mack scorecard has not been received yet.

\`\`\`text
MACK SCORECARD RETURN
status: ACCEPT | REVISE | REJECT
overall_score_0_to_36:
central_claim_score:
cooperation_model_score:
custody_spine_score:
contract_canon_score:
gate_model_score:
receiver_proof_score:
boot_context_score:
event_spine_score:
cockpit_readback_score:
secret_and_human_gates_score:
minimal_mvp_score:
manuscript_balance_score:
strongest_objection:
highest_risk_fake_success_path:
first_momentum_build:
must_change_before_book:
optional_later:
\`\`\`
`;
}

function incompleteIntake() {
  return `# Mack Architecture Attack Scorecard Return Intake

Status: RETURN_PASTED

\`\`\`text
MACK SCORECARD RETURN
status: REVISE
overall_score_0_to_36: 18
central_claim_score: 2
cooperation_model_score:
custody_spine_score:
contract_canon_score:
gate_model_score:
receiver_proof_score:
boot_context_score:
event_spine_score:
cockpit_readback_score:
secret_and_human_gates_score:
minimal_mvp_score:
manuscript_balance_score:
strongest_objection: It may rename packet passing as cooperation.
highest_risk_fake_success_path:
first_momentum_build:
must_change_before_book:
optional_later:
\`\`\`
`;
}

function invalidScoreIntake() {
  return completeIntake({ receiver_proof_score: 4, overall_score_0_to_36: 29 });
}

function totalMismatchIntake() {
  return completeIntake({ overall_score_0_to_36: 30 });
}

function completeIntake(overrides = {}) {
  const fields = {
    status: "REVISE",
    overall_score_0_to_36: 28,
    central_claim_score: 3,
    cooperation_model_score: 2,
    custody_spine_score: 2,
    contract_canon_score: 3,
    gate_model_score: 2,
    receiver_proof_score: 2,
    boot_context_score: 2,
    event_spine_score: 2,
    cockpit_readback_score: 2,
    secret_and_human_gates_score: 3,
    minimal_mvp_score: 3,
    manuscript_balance_score: 2,
    strongest_objection: "The architecture still risks confusing auditable packet flow with live cooperative cognition.",
    highest_risk_fake_success_path: "Transport ACK gets counted as receiver completion.",
    first_momentum_build: "Build one cockpit row that joins packet, gate, dispatch event, receiver receipt, artifact hash, and next legal action.",
    must_change_before_book: "Quarantine seamless cooperation language until the proof chain joins by id.",
    optional_later: "Add durable SQL indexing after file-backed proof works.",
    ...overrides,
  };

  return `# Mack Architecture Attack Scorecard Return Intake

Status: RETURN_PASTED

\`\`\`text
MACK SCORECARD RETURN
status: ${fields.status}
overall_score_0_to_36: ${fields.overall_score_0_to_36}
central_claim_score: ${fields.central_claim_score}
cooperation_model_score: ${fields.cooperation_model_score}
custody_spine_score: ${fields.custody_spine_score}
contract_canon_score: ${fields.contract_canon_score}
gate_model_score: ${fields.gate_model_score}
receiver_proof_score: ${fields.receiver_proof_score}
boot_context_score: ${fields.boot_context_score}
event_spine_score: ${fields.event_spine_score}
cockpit_readback_score: ${fields.cockpit_readback_score}
secret_and_human_gates_score: ${fields.secret_and_human_gates_score}
minimal_mvp_score: ${fields.minimal_mvp_score}
manuscript_balance_score: ${fields.manuscript_balance_score}
strongest_objection: ${fields.strongest_objection}
highest_risk_fake_success_path: ${fields.highest_risk_fake_success_path}
first_momentum_build: ${fields.first_momentum_build}
must_change_before_book: ${fields.must_change_before_book}
optional_later: ${fields.optional_later}
\`\`\`
`;
}

async function runValidator(name, intakeText) {
  const scenarioDir = safeSmokePath(name);
  await mkdir(scenarioDir, { recursive: true });
  const intakePath = path.join(scenarioDir, "scorecard-intake.md");
  const receiptPath = path.join(scenarioDir, "receipt.json");
  await writeFile(intakePath, intakeText, "utf8");

  const env = {
    ...process.env,
    MACK_ARCHITECTURE_SCORECARD_INTAKE_PATH: intakePath,
    MACK_ARCHITECTURE_SCORECARD_VALIDATOR_RECEIPT_PATH: receiptPath,
  };

  const result = await new Promise((resolve) => {
    const child = spawn(process.execPath, [VALIDATOR], {
      cwd: ROOT,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });

  assertPass(result.code === 0, `${name}: validator exited ${result.code}: ${result.stderr}`);
  assertPass(existsSync(receiptPath), `${name}: receipt not written`);
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  const stdout = JSON.parse(result.stdout);

  return {
    name,
    stdout,
    receipt_path: repoRel(receiptPath),
    receipt_status: receipt.status,
    blocker_code: receipt.classification?.blocker_code || "",
    classification_status: receipt.classification?.status || "",
    computed_sum: receipt.classification?.score_readback?.computed_sum ?? null,
    total_matches: receipt.classification?.score_readback?.total_matches ?? false,
  };
}

async function main() {
  const resolvedSmokeDir = path.resolve(SMOKE_DIR);
  const expectedPrefix = path.resolve(ROOT, "foreman", "tmp") + path.sep;
  assertPass(resolvedSmokeDir.startsWith(expectedPrefix), `SMOKE_DIR_OUTSIDE_TMP:${resolvedSmokeDir}`);

  await rm(SMOKE_DIR, { recursive: true, force: true });
  await mkdir(SMOKE_DIR, { recursive: true });

  const readbacks = [];
  readbacks.push(await runValidator("waiting", waitingIntake()));
  readbacks.push(await runValidator("incomplete", incompleteIntake()));
  readbacks.push(await runValidator("invalid-score", invalidScoreIntake()));
  readbacks.push(await runValidator("total-mismatch", totalMismatchIntake()));
  readbacks.push(await runValidator("complete", completeIntake()));

  const byName = new Map(readbacks.map((item) => [item.name, item]));
  assertPass(byName.get("waiting")?.blocker_code === "MACK_SCORECARD_RETURN_NOT_RECEIVED", "waiting blocker mismatch");
  assertPass(byName.get("incomplete")?.blocker_code === "MACK_SCORECARD_RETURN_INCOMPLETE", "incomplete blocker mismatch");
  assertPass(byName.get("invalid-score")?.blocker_code === "MACK_SCORECARD_SCORE_INVALID", "invalid score blocker mismatch");
  assertPass(byName.get("total-mismatch")?.blocker_code === "MACK_SCORECARD_TOTAL_MISMATCH", "total mismatch blocker mismatch");
  assertPass(byName.get("complete")?.receipt_status === "ARTIFACT", "complete scorecard did not return ARTIFACT");
  assertPass(byName.get("complete")?.computed_sum === 28, "complete scorecard sum mismatch");
  assertPass(byName.get("complete")?.total_matches === true, "complete scorecard total did not match");

  const validatorSource = await readFile(VALIDATOR, "utf8");
  const smokeSource = await readFile(new URL(import.meta.url), "utf8");
  const receipt = {
    schema: "MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_SMOKE_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706",
    receipt_id: "MACK_ARCHITECTURE_SCORECARD_RETURN_VALIDATOR_SMOKE_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/mack-architecture-scorecard-return-validator-smoke.mjs",
    validation: {
      waiting_scorecard_not_received_blocks: true,
      incomplete_scorecard_blocks: true,
      invalid_dimension_score_blocks: true,
      total_mismatch_blocks: true,
      complete_scorecard_passes: true,
      fixture_paths_used: true,
      canonical_scorecard_intake_not_mutated: true,
      no_next_build_packet_generated: true,
      truth_boundary:
        "This smoke uses temporary fixture scorecard intakes. It proves validator behavior but does not claim Mack returned a real scorecard.",
    },
    readbacks,
    file_hashes: [
      {
        path: repoRel(VALIDATOR),
        sha256: sha256(validatorSource),
      },
      {
        path: "scripts/foreman/mack-architecture-scorecard-return-validator-smoke.mjs",
        sha256: sha256(smokeSource),
      },
    ],
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no external send claim",
      "no Mack review return claim",
      "no Mack scorecard return claim",
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
        receipt_path: repoRel(RECEIPT_PATH),
        receipt_sha256: sha256(finalRaw),
        scenarios: readbacks.map((item) => ({
          name: item.name,
          receipt_status: item.receipt_status,
          blocker_code: item.blocker_code,
          computed_sum: item.computed_sum,
        })),
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
