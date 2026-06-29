import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const MEMBRANE_ROOT = path.join(REPO_ROOT, "tinkarden", "membrane");
const SPEAKER_ROOT = path.join(REPO_ROOT, "speaker");
const DISPATCH_PACKET_DIR = path.join(REPO_ROOT, "tinkerden", "dispatch", "packets");
const TINKERDEN_RECEIPT_DIR = path.join(REPO_ROOT, "data", "tinkerden", "receipts");
const ORGANISM_EVENTS_PATH = path.join(REPO_ROOT, "data", "organism", "events.jsonl");
const RECEIPT_PICKUP_PATH = path.join(REPO_ROOT, "data", "organism", "receipt_pickup.jsonl");
const SWANSON_RELAY_LOG_PATH = path.join(MEMBRANE_ROOT, "swanson_functional_relays.jsonl");
const SWANSON_RELAY_RECEIPT_DIR = path.join(MEMBRANE_ROOT, "swanson_functional_relays");
const INTERFACE_NOTIFY_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "interface-notify.jsonl");
const OPERATOR_SELECTIONS = new Set(["KEEP", "KILL", "STEAL", "MERGE"]);
const PACKET_RELAY_RULES = [
  "No auto-send.",
  "No account automation.",
  "No browser credential control.",
  "Clipboard packet only unless a verified workspace runner is explicitly available.",
  "Operator must paste/send manually."
];

type JsonRecord = Record<string, unknown>;

type SwansonRelayRequest = {
  optional_packet?: JsonRecord;
  card?: JsonRecord;
  operator_selection?: unknown;
  mode?: unknown;
};

function rel(filePath: string) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join("/");
}

function text(value: unknown, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function stamp(prefix: string) {
  const time = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `${prefix}_${time}_${crypto.randomBytes(3).toString("hex")}`;
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function splitTarget(value: string) {
  const [aeye, machine] = value.split("@").map((part) => part.trim()).filter(Boolean);
  return {
    assigned_to: aeye || value || "Swanson",
    machine: machine || "Betsy"
  };
}

function writeJsonl(filePath: string, value: JsonRecord) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`, "utf8");
}

function readJsonl(filePath: string) {
  try {
    return fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => JSON.parse(line) as JsonRecord);
  } catch {
    return [];
  }
}

function latestRelaysByOptionalPacket() {
  const relays = new Map<string, JsonRecord>();
  for (const relay of readJsonl(SWANSON_RELAY_LOG_PATH)) {
    const sourceId = text(relay.source_optional_packet_id);
    if (!sourceId) continue;
    relays.set(sourceId, relay);
  }
  return Array.from(relays.values());
}

function existingRelayFor(sourcePacketId: string, operatorSelection: string, mode: string) {
  return readJsonl(SWANSON_RELAY_LOG_PATH)
    .reverse()
    .find(
      (relay) =>
        relay.source_optional_packet_id === sourcePacketId &&
        relay.operator_selection === operatorSelection &&
        relay.mode === mode
    ) ?? null;
}

function run(command: string, args: string[], input?: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: REPO_ROOT,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited ${code}: ${stderr || stdout}`.trim()));
    });
    child.stdin.end(input ?? "");
  });
}

async function setClipboardText(value: string) {
  try {
    await run(
      "powershell.exe",
      [
        "-Sta",
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        "$text = [Console]::In.ReadToEnd(); Set-Clipboard -Value $text"
      ],
      value
    );
    return true;
  } catch {
    return false;
  }
}

async function verifyClipboardText(value: string) {
  try {
    const result = await run("powershell.exe", ["-Sta", "-NoProfile", "-NonInteractive", "-Command", "Get-Clipboard -Raw"]);
    const normalize = (textValue: string) => textValue.replace(/\r\n/g, "\n").replace(/\n+$/g, "");
    return normalize(result.stdout) === normalize(value);
  } catch {
    return false;
  }
}

function packetRelayText(params: {
  target: string;
  sourcePacketId: string;
  packetId: string;
  mission: string;
  why: string;
  operatorSelection: string;
  riskClass: string;
}) {
  return [
    `TO: ${params.target}`,
    "FROM: Swanson Functional Relay@Betsy",
    "",
    `MISSION: ${params.mission}`,
    "",
    "SOURCE OPTIONAL PACKET:",
    params.sourcePacketId,
    "",
    "OPERATOR SELECTION:",
    params.operatorSelection,
    "",
    "WHY:",
    params.why,
    "",
    "PACKET:",
    `packet_id: ${params.packetId}`,
    `risk_class: ${params.riskClass}`,
    "return_destination: TinkerDen Intake / Speaker",
    "receipt_required: Y",
    "",
    "RETURN:",
    "Receipt to TinkerDen Intake / Speaker. Include packet_id, source optional packet, and proof path.",
    "",
    "RULES:",
    ...PACKET_RELAY_RULES.map((rule) => `- ${rule}`)
  ].join("\n");
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    relays: latestRelaysByOptionalPacket()
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SwansonRelayRequest;
    const optionalPacket = body.optional_packet || {};
    const card = body.card || {};
    const sourcePacketId = text(optionalPacket.packet_id);
    if (!sourcePacketId) {
      return NextResponse.json({ ok: false, error: "OPTIONAL_PACKET_ID_REQUIRED" }, { status: 400 });
    }

    const operatorSelection = text(body.operator_selection).toUpperCase();
    if (!OPERATOR_SELECTIONS.has(operatorSelection)) {
      return NextResponse.json({ ok: false, error: "KEEP_KILL_STEAL_MERGE_REQUIRED" }, { status: 400 });
    }

    const mode = text(body.mode, "packet_relay");
    const existingRelay = existingRelayFor(sourcePacketId, operatorSelection, mode);
    if (existingRelay) {
      return NextResponse.json({
        ok: true,
        duplicate_ignored: true,
        relay: existingRelay
      });
    }

    const target = text(optionalPacket.target_aeye, text(card.target_aeye, "Swanson@Betsy"));
    const targetParts = splitTarget(target);
    const mission = text(optionalPacket.mission, text(optionalPacket.title, text(card.title, text(card.move, "Untitled relay"))));
    const why = text(optionalPacket.why, text(card.why, text(card.why_now, "No why attached.")));
    const riskClass = text(optionalPacket.risk_class, text(card.risk_class, "UNKNOWN")).toUpperCase();
    const now = new Date().toISOString();
    const relayId = stamp("swanson_relay");
    const packetId = stamp("td_packet_swanson");
    const receiptId = stamp("td_receipt_swanson");
    const relayText = packetRelayText({
      target,
      sourcePacketId,
      packetId,
      mission,
      why,
      operatorSelection,
      riskClass
    });
    const packet = {
      packet_id: packetId,
      created_at: now,
      origin: "Feral Membrane / Swanson Functional Relay",
      assigned_to: targetParts.assigned_to,
      machine: targetParts.machine,
      mission,
      why,
      owner: "Operator@Betsy",
      reviewer: "Swanson",
      return_destination: "TinkerDen Intake / Speaker",
      receipt_required: true,
      receipt_type: "proof",
      due_status: "Packet Relay complete. Operator must paste/send manually.",
      assimilation_destination: "Speaker + TinkerDen Intake",
      status: "RELAY_READY"
    };
    const packetArtifact = {
      schema: "swanson_functional_relay_packet_v0",
      relay_id: relayId,
      source_optional_packet_id: sourcePacketId,
      operator_selection: operatorSelection,
      mode,
      packet,
      relay_text: relayText,
      optional_packet: optionalPacket,
      guardrails: PACKET_RELAY_RULES,
      status: "PACKET_RELAY_COMPLETE"
    };
    const packetPath = path.join(DISPATCH_PACKET_DIR, `${safeName(packetId)}.json`);
    const packetContents = `${JSON.stringify(packetArtifact, null, 2)}\n`;
    const packetHash = sha256(packetContents);

    fs.mkdirSync(DISPATCH_PACKET_DIR, { recursive: true });
    fs.writeFileSync(packetPath, packetContents, "utf8");

    const clipboardSet = await setClipboardText(relayText);
    const clipboardVerified = await verifyClipboardText(relayText);
    const relayEvent = {
      timestamp: now,
      event_type: "swanson_functional_relay",
      relay_id: relayId,
      packet_id: packetId,
      source_optional_packet_id: sourcePacketId,
      source_path: rel(packetPath),
      packet_path: rel(packetPath),
      receipt_id: receiptId,
      relay_status: "PACKET_RELAY_COMPLETE",
      operator_selection: operatorSelection,
      target_aeye: target,
      sha256: packetHash,
      size_bytes: Buffer.byteLength(packetContents, "utf8"),
      clipboard_set: clipboardSet || clipboardVerified,
      clipboard_verified: clipboardVerified,
      no_auto_send: true
    };
    const receipt = {
      schema: "swanson_functional_relay_receipt_v0",
      receipt_id: receiptId,
      packet_id: packetId,
      relay_id: relayId,
      source_optional_packet_id: sourcePacketId,
      status: "PACKET_RELAY_COMPLETE",
      summary: "Swanson functional relay created a dispatch packet and loaded relay text to clipboard. No auto-send performed.",
      packet_path: rel(packetPath),
      event_path: rel(ORGANISM_EVENTS_PATH),
      clipboard_set: clipboardSet || clipboardVerified,
      clipboard_verified: clipboardVerified,
      no_auto_send: true,
      created_at: now
    };
    const receiptPath = path.join(TINKERDEN_RECEIPT_DIR, `${safeName(receiptId)}.json`);
    const membraneReceiptPath = path.join(SWANSON_RELAY_RECEIPT_DIR, `${safeName(relayId)}.json`);
    const pickupRecord = {
      receipt_id: receiptId,
      packet_id: packetId,
      relay_id: relayId,
      source_optional_packet_id: sourcePacketId,
      producer: "Swanson Functional Relay@Betsy",
      status_guess: "PACKET_RELAY_COMPLETE",
      timestamp: now,
      path: rel(receiptPath),
      proof_reference: rel(receiptPath)
    };
    const relayRecord = {
      ...relayEvent,
      receipt_path: rel(receiptPath),
      membrane_receipt_path: rel(membraneReceiptPath),
      relay_log_path: rel(SWANSON_RELAY_LOG_PATH),
      operator_instruction: clipboardVerified
        ? "Swanson packet relay complete. Relay text is verified on clipboard. Paste/send manually."
        : "Swanson packet relay complete. Review clipboard manually before paste/send.",
      awaiting: "OPERATOR_PASTE_SEND"
    };

    fs.mkdirSync(TINKERDEN_RECEIPT_DIR, { recursive: true });
    fs.mkdirSync(SWANSON_RELAY_RECEIPT_DIR, { recursive: true });
    fs.writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
    fs.writeFileSync(membraneReceiptPath, `${JSON.stringify({ ...receipt, relay: relayRecord }, null, 2)}\n`, "utf8");
    writeJsonl(ORGANISM_EVENTS_PATH, relayEvent);
    writeJsonl(RECEIPT_PICKUP_PATH, pickupRecord);
    writeJsonl(SWANSON_RELAY_LOG_PATH, relayRecord);
    writeJsonl(INTERFACE_NOTIFY_LOG_PATH, relayRecord);

    return NextResponse.json({
      ok: true,
      relay: relayRecord
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "SWANSON_FUNCTIONAL_RELAY_FAILED" },
      { status: 500 }
    );
  }
}
