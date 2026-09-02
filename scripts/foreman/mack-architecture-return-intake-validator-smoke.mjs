#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const VALIDATOR = path.join(ROOT, "scripts", "foreman", "mack-architecture-return-intake-validator.mjs");
const SMOKE_DIR = path.join(ROOT, "foreman", "tmp", "mack-return-intake-validator-smoke");
const RECEIPT_PATH = path.join(
  ROOT,
  "foreman",
  "receipts",
  "MACK_ARCHITECTURE_RETURN_INTAKE_VALIDATOR_SMOKE_RECEIPT_20260706.json",
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
  return `# Mack Architecture Tear-Apart Return Intake

Status: WAITING_FOR_MACK_RETURN

## Current Status

Mack review has not been received yet.

## Paste Mack Return Below

\`\`\`text
MACK REVIEW RETURN
status:

strongest_objection:

simplest_viable_architecture:

highest_risk_fake_success_path:

first_momentum_build:

must_change_before_book:

optional_later:

score_0_to_10:

proof_surface_readback:
- bridge_operator_scope_seen:
- receipts_operator_scope_seen:
- all_synthetic_scope_needed:
- notes:

bottom_line:
\`\`\`
`;
}

function incompleteIntake() {
  return `# Mack Architecture Tear-Apart Return Intake

Status: RETURN_PASTED

\`\`\`text
MACK REVIEW RETURN
status: REVISE

strongest_objection: The architecture still risks renaming packet passing as cooperation.

simplest_viable_architecture:

highest_risk_fake_success_path:

first_momentum_build:

must_change_before_book:

optional_later:

score_0_to_10:

proof_surface_readback:
- bridge_operator_scope_seen: YES
- receipts_operator_scope_seen: YES
- all_synthetic_scope_needed: NO
- notes: operator scope seen

bottom_line:
\`\`\`
`;
}

function completeIntake() {
  return `# Mack Architecture Tear-Apart Return Intake

Status: RETURN_PASTED

\`\`\`text
MACK REVIEW RETURN
status: REVISE

strongest_objection: The architecture still risks pretending packeted cooperation is the same as shared live cognition.

simplest_viable_architecture: Keep packet custody, receiver proof, event joins, and one cockpit. Delay everything else.

highest_risk_fake_success_path: Sender-side file custody gets counted as delivery before receiver proof lands.

first_momentum_build: Build the event join spine that shows packet to event to receipt to cockpit readback in one row.

must_change_before_book: Stop saying seamless until the proof chain joins by id.

optional_later: Add durable SQL indexing after the local file proof works.

score_0_to_10: 7

proof_surface_readback:
- bridge_operator_scope_seen: YES
- receipts_operator_scope_seen: YES
- all_synthetic_scope_needed: NO
- notes: operator view is enough for review

bottom_line: If you build only one thing next, build the event join spine because it turns the claim into falsifiable proof.
\`\`\`
`;
}

async function runValidator(name, intakeText, args = []) {
  const scenarioDir = safeSmokePath(name);
  await mkdir(scenarioDir, { recursive: true });
  const intakePath = path.join(scenarioDir, "intake.md");
  const receiptPath = path.join(scenarioDir, "receipt.json");
  const nextPacketPath = path.join(scenarioDir, "next-build.md");
  await writeFile(intakePath, intakeText, "utf8");

  const env = {
    ...process.env,
    MACK_ARCHITECTURE_INTAKE_PATH: intakePath,
    MACK_ARCHITECTURE_VALIDATOR_RECEIPT_PATH: receiptPath,
    MACK_ARCHITECTURE_NEXT_BUILD_PACKET_PATH: nextPacketPath,
  };

  const result = await new Promise((resolve) => {
    const child = spawn(process.execPath, [VALIDATOR, ...args], {
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
  const receiptRaw = await readFile(receiptPath, "utf8");
  const receipt = JSON.parse(receiptRaw);
  let nextPacket = null;
  if (existsSync(nextPacketPath)) {
    const nextRaw = await readFile(nextPacketPath, "utf8");
    nextPacket = {
      path: repoRel(nextPacketPath),
      sha256: sha256(nextRaw),
      containsGate: nextRaw.includes("DRAFT_PENDING_BEN_ACCEPTANCE") && nextRaw.includes("Ben accepts Mack's direction"),
    };
  }

  return {
    name,
    args,
    stdout: JSON.parse(result.stdout),
    receipt_path: repoRel(receiptPath),
    receipt_status: receipt.status,
    blocker_code: receipt.classification?.blocker_code || "",
    classification_status: receipt.classification?.status || "",
    next_packet_exists: Boolean(nextPacket),
    next_packet: nextPacket,
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
  readbacks.push(await runValidator("complete-no-ben-gate", completeIntake(), ["--convert"]));
  readbacks.push(await runValidator("complete-with-ben-gate", completeIntake(), ["--convert", "--ben-accepted"]));

  const waiting = readbacks.find((item) => item.name === "waiting");
  const incomplete = readbacks.find((item) => item.name === "incomplete");
  const noBen = readbacks.find((item) => item.name === "complete-no-ben-gate");
  const withBen = readbacks.find((item) => item.name === "complete-with-ben-gate");

  assertPass(waiting?.receipt_status === "BLOCKER", "waiting did not return BLOCKER");
  assertPass(waiting?.blocker_code === "MACK_RETURN_NOT_RECEIVED", "waiting blocker mismatch");
  assertPass(incomplete?.receipt_status === "BLOCKER", "incomplete did not return BLOCKER");
  assertPass(incomplete?.blocker_code === "MACK_RETURN_INCOMPLETE", "incomplete blocker mismatch");
  assertPass(noBen?.receipt_status === "BLOCKER", "complete without Ben gate did not return BLOCKER");
  assertPass(noBen?.blocker_code === "BEN_ACCEPTANCE_GATE_REQUIRED", "Ben gate blocker mismatch");
  assertPass(noBen?.next_packet_exists === false, "complete without Ben gate wrote next packet");
  assertPass(withBen?.receipt_status === "ARTIFACT", "complete with Ben gate did not return ARTIFACT");
  assertPass(withBen?.next_packet_exists === true, "complete with Ben gate did not write next packet");
  assertPass(withBen?.next_packet?.containsGate === true, "next packet missing gate language");

  const validatorSource = await readFile(VALIDATOR, "utf8");
  const smokeSource = await readFile(new URL(import.meta.url), "utf8");
  const receipt = {
    schema: "MACK_ARCHITECTURE_RETURN_INTAKE_VALIDATOR_SMOKE_RECEIPT",
    status: "ARTIFACT",
    timestamp: new Date().toISOString(),
    machine: "BETSY",
    agent: "Heimerdinker@Betsy",
    packet_id: "MACK_HARVEY_NERDKLE_ARCHITECTURE_TEAR_APART_20260706",
    receipt_id: "MACK_ARCHITECTURE_RETURN_INTAKE_VALIDATOR_SMOKE_RECEIPT_20260706",
    repo: ROOT,
    command: "node scripts/foreman/mack-architecture-return-intake-validator-smoke.mjs",
    validation: {
      waiting_return_not_received_blocks: true,
      incomplete_return_blocks: true,
      complete_return_without_ben_gate_blocks: true,
      complete_return_with_ben_gate_generates_next_packet: true,
      fixture_paths_used: true,
      canonical_intake_not_mutated: true,
      truth_boundary:
        "This smoke uses temporary fixture intakes. It proves validator behavior but does not claim Mack has returned a real review.",
    },
    readbacks,
    file_hashes: [
      {
        path: repoRel(VALIDATOR),
        sha256: sha256(validatorSource),
      },
      {
        path: "scripts/foreman/mack-architecture-return-intake-validator-smoke.mjs",
        sha256: sha256(smokeSource),
      },
    ],
    stop_conditions_respected: [
      "no deploy",
      "no push",
      "no secrets",
      "no production mutation",
      "no external send claim",
      "no Mack receipt claim",
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
          next_packet_exists: item.next_packet_exists,
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
