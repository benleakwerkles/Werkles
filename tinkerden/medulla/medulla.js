#!/usr/bin/env node

const chokidar = require("chokidar");
const { mkdir, readdir, readFile, writeFile } = require("node:fs/promises");
const { createHash, randomBytes } = require("node:crypto");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const INBOX_DIR = path.join(REPO_ROOT, "tinkerden", "inbox");
const RECEIPTS_DIR = path.join(REPO_ROOT, "tinkerden", "receipts");
const RECOMMENDATION_PATH = path.join(REPO_ROOT, "tinkerden", "recommendations", "recommendation_cards.json");
const DECISION_LEDGER_PATH = path.join(REPO_ROOT, "tinkerden", "feedback", "decision-ledger.jsonl");
const WATCH_GLOB = path.join(INBOX_DIR, "*.json");
const STALE_AFTER_MINUTES = 720;
const KNOWN_AEYE_MACHINE_LANES = new Set([
  "Dink@Betsy",
  "Maker@Betsy",
  "Thufir@Doss",
  "Bean@Spanzee",
  "Ender@Doss",
  "Swanson@Betsy",
  "Skybro@Sally",
  "Petra@ChatGPT"
]);
const VALID_RECEIPT_REQUIREMENTS = new Set(["ACK", "BLOCKER", "ARTIFACT"]);

function slash(value) {
  return value.split(path.sep).join("/");
}

function relativePath(value) {
  return slash(path.relative(REPO_ROOT, value));
}

function now() {
  return new Date().toISOString();
}

function id(prefix) {
  return `${prefix}_${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}_${randomBytes(3).toString("hex")}`;
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function ensureRequiredPaths() {
  await mkdir(INBOX_DIR, { recursive: true });
  await mkdir(RECEIPTS_DIR, { recursive: true });
  await mkdir(path.dirname(RECOMMENDATION_PATH), { recursive: true });
  await mkdir(path.dirname(DECISION_LEDGER_PATH), { recursive: true });

  try {
    await readFile(DECISION_LEDGER_PATH, "utf8");
  } catch {
    await writeFile(DECISION_LEDGER_PATH, "", "utf8");
  }
}

async function readPacket(packetPath) {
  const raw = await readFile(packetPath, "utf8");
  return { raw, parsed: JSON.parse(raw), packet_hash: hash(raw) };
}

function text(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function validatePacket(packet) {
  const errors = [];
  if (!packet || typeof packet !== "object" || Array.isArray(packet)) {
    return ["packet must be a JSON object"];
  }

  const required = ["packet_id", "created_at", "source", "target", "receipt_required"];
  for (const field of required) {
    if (!text(packet[field])) errors.push(`${field} is required`);
  }

  const command = text(packet.command || packet.mission);
  if (!command) errors.push("command or mission is required");

  const receiptRequired = text(packet.receipt_required).toUpperCase();
  if (receiptRequired && !VALID_RECEIPT_REQUIREMENTS.has(receiptRequired)) {
    errors.push("receipt_required must be ACK, BLOCKER, or ARTIFACT");
  }

  const target = text(packet.target);
  if (target && !KNOWN_AEYE_MACHINE_LANES.has(target)) {
    errors.push(`target must be a known Aeye@Machine lane, got ${target}`);
  }

  return errors;
}

async function writeReceipt({ packetPath, packet, packetHash, status, validationErrors }) {
  const timestamp = now();
  const packetId = text(packet?.packet_id) || "UNKNOWN_PACKET";
  const receipt = {
    schema: "tinkerden_medulla_v0_receipt",
    receipt_id: id(status === "ACK" ? "medulla_ack" : "medulla_blocker"),
    packet_id: packetId,
    linked_packet_id: packetId,
    packet_path: relativePath(packetPath),
    packet_hash: packetHash || null,
    producer: "Maker@Betsy",
    stream: "FERAL / TINKERDEN",
    status_guess: status,
    timestamp,
    path: null,
    validation_errors: validationErrors,
    no_shell_execution: true,
    no_autonomous_routing: true,
    note: status === "ACK" ? "Packet parsed and passed Medulla V0 basic schema validation." : "Packet parse or schema validation failed."
  };
  const receiptPath = path.join(RECEIPTS_DIR, `${receipt.receipt_id}.json`);
  receipt.path = relativePath(receiptPath);
  await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  return { receipt, receiptPath };
}

function recommendationCardFromPacket(packet) {
  const createdAt = now();
  const command = text(packet.command || packet.mission);
  const packetId = text(packet.packet_id);
  const target = text(packet.target);

  return {
    card_id: `medulla_card_${packetId}`,
    source_packet_id: packetId,
    target,
    stream: text(packet.stream) || "FERAL / TINKERDEN",
    mission: command,
    recommended_next_action: `Return ACK / BLOCKER / ARTIFACT for ${packetId}.`,
    risk_flags: [
      "NO_SHELL_EXECUTION",
      "NO_AUTONOMOUS_ROUTING",
      "SENDER_WRITE_IS_NOT_DELIVERY_PROOF"
    ],
    created_at: createdAt,
    status: "pending_operator_decision",

    move: command,
    why_now: "A valid inbox packet arrived and needs visible operator-facing handling.",
    recommended_because: "Medulla V0 only surfaces the next inspectable action; it does not execute the packet.",
    scores: {
      momentum_gain: 6,
      mule_labor_reduction: 7,
      cooperation_gain: 6,
      continuity_gain: 7,
      capacity_gain: 5
    },
    composite_score: 62,
    reversibility_gate: "PASS",
    risk_extraction_flag: "LOW",
    swateyes: {
      tier: "GREEN",
      confidence: 0.7
    },
    recommendation: "DEFER",
    scoring_basis: {
      deterministic: true,
      no_ai: true,
      no_hidden_judgment: true,
      formula: "valid_packet ? fixed_placeholder_surface_score : no_card",
      inputs: {
        packet_id: packetId,
        target,
        command_length: command.length
      }
    },
    hidden_judgment: false
  };
}

async function readRecommendationFile() {
  try {
    const raw = await readFile(RECOMMENDATION_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && Array.isArray(parsed.cards) ? parsed : { cards: [] };
  } catch {
    return { cards: [] };
  }
}

async function writeRecommendationCard(card) {
  const existing = await readRecommendationFile();
  const priorCards = existing.cards.filter((candidate) => candidate.card_id !== card.card_id);
  const cards = [card, ...priorCards].slice(0, 3);
  const generatedAt = now();
  const output = {
    schema: "tinkerden_medulla_v0_recommendation_cards",
    generated_at: generatedAt,
    heartbeat: {
      timestamp: generatedAt,
      process: "medulla_v0_chokidar_loop",
      mode: "inbox_packet_to_receipt_and_recommendation_card"
    },
    stale_after_minutes: STALE_AFTER_MINUTES,
    stale_at: new Date(Date.parse(generatedAt) + STALE_AFTER_MINUTES * 60 * 1000).toISOString(),
    stale_warning: `STALE if generated_at is older than ${STALE_AFTER_MINUTES} minutes.`,
    source_rule: "Medulla V0 is one Node process using Chokidar only. It does not call AI, route autonomously, or execute packet commands.",
    current_frontier: {
      title: "Turn inbox packets into receipts and Top 3 Moves.",
      summary: "Medulla watches tinkerden/inbox/*.json, validates packets, writes ACK/BLOCKER receipts, and surfaces pending operator decisions."
    },
    cards
  };

  await writeFile(RECOMMENDATION_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  return output;
}

async function processPacket(packetPath) {
  await ensureRequiredPaths();

  let packet = null;
  let packetHash = null;
  let validationErrors = [];

  try {
    const read = await readPacket(packetPath);
    packet = read.parsed;
    packetHash = read.packet_hash;
    validationErrors = validatePacket(packet);
  } catch (error) {
    validationErrors = [`parse failed: ${error instanceof Error ? error.message : "unknown error"}`];
  }

  if (validationErrors.length > 0) {
    const result = await writeReceipt({
      packetPath,
      packet,
      packetHash,
      status: "BLOCKER",
      validationErrors
    });
    return { status: "BLOCKER", receipt_path: relativePath(result.receiptPath), validation_errors: validationErrors };
  }

  const receiptResult = await writeReceipt({
    packetPath,
    packet,
    packetHash,
    status: "ACK",
    validationErrors: []
  });
  const recommendation = await writeRecommendationCard(recommendationCardFromPacket(packet));

  return {
    status: "ACK",
    receipt_path: relativePath(receiptResult.receiptPath),
    recommendation_cards_path: relativePath(RECOMMENDATION_PATH),
    card_id: recommendation.cards[0].card_id
  };
}

async function watch() {
  await ensureRequiredPaths();
  console.log(`[medulla_v0] watching ${relativePath(WATCH_GLOB)}`);
  const watcher = chokidar.watch(WATCH_GLOB, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 250, pollInterval: 100 }
  });

  watcher.on("add", async (packetPath) => {
    try {
      const result = await processPacket(packetPath);
      console.log(`[medulla_v0] ${result.status} ${relativePath(packetPath)} -> ${result.receipt_path}`);
    } catch (error) {
      console.error("[medulla_v0] packet processing failed", error);
    }
  });
}

async function writeSamplePacket(name, value) {
  const packetPath = path.join(INBOX_DIR, name);
  await writeFile(packetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return packetPath;
}

async function test() {
  await ensureRequiredPaths();
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const validPacket = {
    schema: "tinkerden_command_packet_v0",
    packet_id: `medulla_test_valid_${stamp}`,
    title: "Medulla V0 valid packet test",
    created_at: now(),
    source: "TinkerDen@Betsy",
    target: "Dink@Betsy",
    target_machine: "Betsy",
    stream: "FERAL / TINKERDEN",
    command: "MEDULLA V0 test: produce ACK receipt and pending operator recommendation card.",
    packet_type: "COMMAND",
    receipt_required: "ACK",
    required_return: "ACK / BLOCKER / ARTIFACT"
  };
  const malformedPacket = {
    schema: "tinkerden_command_packet_v0",
    packet_id: `medulla_test_malformed_${stamp}`,
    created_at: now(),
    source: "TinkerDen@Betsy",
    target: "Unknown@Nowhere",
    receipt_required: "MAYBE",
    required_return: "ACK / BLOCKER / ARTIFACT"
  };

  const validPath = await writeSamplePacket(`${validPacket.packet_id}.json`, validPacket);
  const ack = await processPacket(validPath);
  const malformedPath = await writeSamplePacket(`${malformedPacket.packet_id}.json`, malformedPacket);
  const blocker = await processPacket(malformedPath);
  const recommendationRaw = await readFile(RECOMMENDATION_PATH, "utf8");
  JSON.parse(recommendationRaw);

  return {
    ok: true,
    command: "npm run medulla:test",
    valid_packet_path: relativePath(validPath),
    malformed_packet_path: relativePath(malformedPath),
    ack_receipt_path: ack.receipt_path,
    blocker_receipt_path: blocker.receipt_path,
    recommendation_cards_path: relativePath(RECOMMENDATION_PATH),
    recommendation_cards_valid_json: true,
    latest_card_id: ack.card_id,
    decision_ledger_path: relativePath(DECISION_LEDGER_PATH),
    decision_ledger_note: "No operator feedback event appended by this test."
  };
}

async function main() {
  const command = process.argv[2] || "watch";

  if (command === "watch") {
    await watch();
    return;
  }

  if (command === "process") {
    const packetPath = process.argv[3];
    if (!packetPath) throw new Error("process requires a packet path");
    console.log(JSON.stringify(await processPacket(path.resolve(REPO_ROOT, packetPath)), null, 2));
    return;
  }

  if (command === "test") {
    console.log(JSON.stringify(await test(), null, 2));
    return;
  }

  throw new Error("Usage: node medulla.js [watch|process <packet_path>|test]");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

