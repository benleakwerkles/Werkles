import "server-only";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type {
  TinkerDenAction,
  TinkerDenActionResult,
  TinkerDenAssimilation,
  TinkerDenEvent,
  TinkerDenPacket,
  TinkerDenReceipt,
  TinkerDenState
} from "./types";
import { writeCanonicalExecutionRecord, type CanonicalExecutionRecord } from "../tinkerden/execution-records";

const ROOT = process.cwd();
const STORE_DIR = path.join(ROOT, "foreman", "soledash", "tinkerden-return-system-v0");
const STORE_PATH = path.join(STORE_DIR, "state.json");
const BRIDGE_PACKET_DIR = path.join(ROOT, "tinkerden", "dispatch", "packets");
const ORGANISM_EVENTS_PATH = path.join(ROOT, "data", "organism", "events.jsonl");
const RECEIPT_PICKUP_PATH = path.join(ROOT, "data", "organism", "receipt_pickup.jsonl");
const TINKERDEN_RECEIPT_DIR = path.join(ROOT, "data", "tinkerden", "receipts");
const AUTOPASTE_CONFIG_PATH = path.join(ROOT, "foreman", "soledash", "POWERToys_AUTOPASTE_HELPER_CONFIG.json");
const PACKET_RELAY_RULES = [
  "No account automation.",
  "No unauthorized auto-send.",
  "No browser credential control.",
  "No fake delivery.",
  "Clipboard + workspace focus only in V0.",
  "Operator must paste/send manually."
];

const REQUIRED_TO_SEND: Array<keyof TinkerDenPacket> = [
  "assigned_to",
  "machine",
  "owner",
  "reviewer",
  "return_destination",
  "receipt_required",
  "assimilation_destination"
];

function nowIso(): string {
  return new Date().toISOString();
}

function stamp(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function seedPacket(): TinkerDenPacket {
  return {
    packet_id: "td_packet_return_system_v0_bean",
    created_at: nowIso(),
    origin: "TinkerDen Inbox",
    assigned_to: "Bean",
    machine: "Sally",
    mission: "Review TINKERDEN_RETURN_SYSTEM_V0 and prove packets cannot disappear.",
    why: "Every packet sent to Bean, Ender, Maker, Dink, Skybro, or Thufir needs a return path, receipt drawer, and assimilation queue.",
    owner: "Maker@Betsy",
    reviewer: "Daemon",
    return_destination: "TinkerDen Inbox",
    receipt_required: true,
    receipt_type: "proof",
    due_status: "Receipt required before assimilation",
    assimilation_destination: "Speaker + TinkerDen Packet Ledger",
    status: "DRAFT"
  };
}

function seedState(): TinkerDenState {
  const packet = seedPacket();
  return {
    schema: "tinkerden_return_system_v0",
    updated_at: nowIso(),
    packets: [packet],
    receipts: [],
    assimilations: [],
    events: [
      {
        event_id: stamp("td_event"),
        packet_id: packet.packet_id,
        event: "DRAFT_CREATED",
        timestamp: packet.created_at,
        details: "Seed packet proves the return system has an outbound packet to move."
      }
    ]
  };
}

type BridgeExecutePacketInput = {
  card_id: string;
  operator_selection: "KEEP" | "KILL" | "STEAL" | "MERGE";
  move: string;
  recommendation: string;
  composite_score: number | null;
  operator_reason: string | null;
  why_now: string;
  recommended_because: string;
};

type BridgePacketRelayPacketInput = BridgeExecutePacketInput;

export type PacketRelayWorkspaceTarget = {
  id: string;
  label: string;
  target: string;
  mode: "none" | "process" | "window_title";
  args: string[];
  window_title: string;
  configured: boolean;
  configuration_error?: string;
};

export type AutopasteWorkspaceTarget = PacketRelayWorkspaceTarget;

async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

async function writeState(state: TinkerDenState): Promise<void> {
  await fs.mkdir(STORE_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function hasReceipt(state: TinkerDenState, packetId: string): boolean {
  return state.receipts.some((receipt) => receipt.packet_id === packetId);
}

function event(packetId: string, name: string, details?: string): TinkerDenEvent {
  return {
    event_id: stamp("td_event"),
    packet_id: packetId,
    event: name,
    timestamp: nowIso(),
    details
  };
}

function sha256(contents: string): string {
  return crypto.createHash("sha256").update(contents).digest("hex");
}

async function appendOrganismRelayEvent(params: {
  packetId: string;
  packetPath: string;
  packetContents: string;
  operatorSelection: "KEEP" | "KILL" | "STEAL" | "MERGE";
}) {
  const sourcePath = path.relative(ROOT, params.packetPath).replace(/\\/g, "/");
  const relayEvent = {
    timestamp: nowIso(),
    event_type: "packet_dispatched",
    source_path: sourcePath,
    file_name: path.basename(params.packetPath),
    detected_by: "Maker@Betsy",
    destination_guess: "tinkerden_dispatch",
    sha256: sha256(params.packetContents),
    size_bytes: Buffer.byteLength(params.packetContents, "utf8"),
    packet_id: params.packetId,
    operator_selection: params.operatorSelection,
  };

  await fs.mkdir(path.dirname(ORGANISM_EVENTS_PATH), { recursive: true });
  await fs.appendFile(ORGANISM_EVENTS_PATH, `${JSON.stringify(relayEvent)}\n`, "utf8");
  return relayEvent;
}

async function appendOrganismPacketRelayEvent(params: {
  relayId: string;
  packetId: string;
  receiptId: string;
  packetPath: string;
  packetContents: string;
  operatorSelection: "KEEP" | "KILL" | "STEAL" | "MERGE";
  workspaceTarget: PacketRelayWorkspaceTarget;
}) {
  const sourcePath = path.relative(ROOT, params.packetPath).replace(/\\/g, "/");
  const relayEvent = {
    timestamp: nowIso(),
    event_type: "packet_relay_ready",
    source_path: sourcePath,
    file_name: path.basename(params.packetPath),
    detected_by: "Maker@Betsy",
    destination_guess: "packet_relay_clipboard",
    sha256: sha256(params.packetContents),
    size_bytes: Buffer.byteLength(params.packetContents, "utf8"),
    packet_id: params.packetId,
    relay_id: params.relayId,
    receipt_id: params.receiptId,
    relay_status: "PACKET_RELAY_COMPLETE",
    operator_selection: params.operatorSelection,
    workspace_target: params.workspaceTarget.label,
    workspace_configured: params.workspaceTarget.configured
  };

  await fs.mkdir(path.dirname(ORGANISM_EVENTS_PATH), { recursive: true });
  await fs.appendFile(ORGANISM_EVENTS_PATH, `${JSON.stringify(relayEvent)}\n`, "utf8");
  return relayEvent;
}

function packetRelayReceiptFor(params: {
  packet: TinkerDenPacket;
  relayId: string;
  packetPath: string;
  relayEvent: Record<string, unknown>;
}): TinkerDenReceipt {
  return {
    receipt_id: String(params.relayEvent.receipt_id ?? stamp("td_receipt_packet_relay")),
    packet_id: params.packet.packet_id,
    returned_by: "PacketRelaySystem@Betsy",
    artifact_link: path.relative(ROOT, params.packetPath).replace(/\\/g, "/"),
    summary: `Packet Relay System completed relay ${params.relayId} for ${params.packet.packet_id}`,
    proof: `Packet Relay event ${params.relayId} landed with sha256 ${String(params.relayEvent.sha256 ?? "UNKNOWN")}.`,
    blockers: "none",
    next_recommended_action: "Trace packet -> relay -> receipt in TinkerDen custody lanes.",
    timestamp: String(params.relayEvent.timestamp ?? nowIso())
  };
}

async function writePacketRelayReceiptArtifact(params: {
  packet: TinkerDenPacket;
  relayId: string;
  packetPath: string;
  receipt: TinkerDenReceipt;
  relayEvent: Record<string, unknown>;
}) {
  const receiptPath = path.join(TINKERDEN_RECEIPT_DIR, `${params.receipt.receipt_id}.json`);
  const receiptRelPath = path.relative(ROOT, receiptPath).replace(/\\/g, "/");
  const packetRelPath = path.relative(ROOT, params.packetPath).replace(/\\/g, "/");
  const artifact = {
    schema: "tinkerden_packet_relay_receipt_v1",
    packet_id: params.packet.packet_id,
    relay_id: params.relayId,
    receipt_id: params.receipt.receipt_id,
    linked_packet_id: params.packet.packet_id,
    mission: params.packet.mission,
    producer: params.receipt.returned_by,
    status_guess: "RECEIPT_ASSIMILATED",
    proof_reference: receiptRelPath,
    packet_path: packetRelPath,
    relay_event_path: path.relative(ROOT, ORGANISM_EVENTS_PATH).replace(/\\/g, "/"),
    timestamp: params.receipt.timestamp,
    receipt: params.receipt,
    evidence: {
      relay_event_type: params.relayEvent.event_type,
      relay_status: params.relayEvent.relay_status,
      relay_timestamp: params.relayEvent.timestamp,
      packet_sha256: params.relayEvent.sha256,
      packet_size_bytes: params.relayEvent.size_bytes,
      operator_selection: params.relayEvent.operator_selection
    }
  };
  const pickupRecord = {
    receipt_id: params.receipt.receipt_id,
    packet_id: params.packet.packet_id,
    linked_packet_id: params.packet.packet_id,
    relay_id: params.relayId,
    mission: params.packet.mission,
    producer: params.receipt.returned_by,
    status_guess: "RECEIPT_ASSIMILATED",
    timestamp: params.receipt.timestamp,
    path: receiptRelPath,
    proof_reference: receiptRelPath
  };

  await fs.mkdir(TINKERDEN_RECEIPT_DIR, { recursive: true });
  await fs.writeFile(receiptPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  await fs.mkdir(path.dirname(RECEIPT_PICKUP_PATH), { recursive: true });
  await fs.appendFile(RECEIPT_PICKUP_PATH, `${JSON.stringify(pickupRecord)}\n`, "utf8");

  return {
    receipt_path: receiptRelPath,
    pickup_path: path.relative(ROOT, RECEIPT_PICKUP_PATH).replace(/\\/g, "/")
  };
}

async function getPacketRelayWorkspaceTarget(): Promise<PacketRelayWorkspaceTarget> {
  const fallbackTarget = path.join(process.env.LOCALAPPDATA || "", "PowerToys", "PowerToys.WorkspacesLauncher.exe");
  try {
    const config = await readJson<{
      default_workspace_target?: unknown;
      workspace_targets?: Record<string, Record<string, unknown>>;
    }>(AUTOPASTE_CONFIG_PATH);
    const targetId = typeof config?.default_workspace_target === "string" ? config.default_workspace_target : "none";
    const target = config?.workspace_targets?.[targetId];
    if (!target) throw new Error("default target missing");
    const mode = target.mode === "window_title" ? "window_title" : target.mode === "none" ? "none" : "process";
    const command = typeof target.command === "string" ? target.command : "";
    const windowTitle = typeof target.window_title === "string" ? target.window_title : "";
    const args = Array.isArray(target.args) ? target.args.map(String) : [];
    const missingWorkspaceId =
      mode === "process" &&
      path.basename(command).toLowerCase() === "powertoys.workspaceslauncher.exe" &&
      args.length === 0;
    return {
      id: targetId,
      label: typeof target.label === "string" ? target.label : targetId,
      target: mode === "process" ? command : "",
      mode,
      args,
      window_title: mode === "window_title" ? windowTitle : "",
      configured: target.enabled !== false && mode !== "none" && Boolean(command || windowTitle) && !missingWorkspaceId,
      configuration_error: missingWorkspaceId
        ? "PowerToys WorkspacesLauncher requires a workspace id argument."
        : undefined
    };
  } catch {
    return {
      id: "maker_betsy_powertoys_workspaces",
      label: "Maker@Betsy PowerToys Workspaces",
      target: fallbackTarget,
      mode: "process",
      args: [],
      window_title: "",
      configured: false,
      configuration_error: "PowerToys WorkspacesLauncher requires a workspace id argument."
    };
  }
}

function bridgePacketRelayText(params: {
  packet: TinkerDenPacket;
  input: BridgePacketRelayPacketInput;
  workspaceTarget: PacketRelayWorkspaceTarget;
}) {
  const { packet, input, workspaceTarget } = params;

  return [
    `TO: ${packet.assigned_to}@${packet.machine}`,
    "FROM: TinkerDen@Betsy",
    "",
    `MISSION: ${packet.mission}`,
    "",
    "OBJECTIVE:",
    input.recommended_because || input.why_now || packet.why,
    "",
    "PACKET:",
    `packet_id: ${packet.packet_id}`,
    `operator_selection: ${input.operator_selection}`,
    `recommendation: ${input.recommendation}`,
    `composite_score: ${input.composite_score ?? "UNKNOWN"}`,
    `return_destination: ${packet.return_destination}`,
    `receipt_required: ${packet.receipt_required ? "Y" : "N"}`,
    "",
    "TASK:",
    packet.why,
    "",
    "WORKSPACE TARGET:",
    `${workspaceTarget.label} (${workspaceTarget.configured ? "configured" : "not configured"})`,
    "",
    "RETURN:",
    "Receipt to TinkerDen Intake / Speaker. Include packet_id and proof path.",
    "",
    "RULES:",
    ...PACKET_RELAY_RULES.map((rule) => `- ${rule}`)
  ].join("\n");
}

function applyWatchdog(state: TinkerDenState): TinkerDenState {
  let changed = false;
  const events = [...state.events];
  const packets = state.packets.map((packet) => {
    if ((packet.status === "SENT" || packet.status === "WORKING") && packet.receipt_required && !hasReceipt(state, packet.packet_id)) {
      changed = true;
      events.unshift(event(packet.packet_id, "WATCHDOG_MISSING_RECEIPT", "No receipt exists for SENT/WORKING packet."));
      return { ...packet, status: "MISSING_RECEIPT" as const, due_status: "Missing receipt escalated by watchdog" };
    }
    return packet;
  });

  return changed ? { ...state, packets, events, updated_at: nowIso() } : state;
}

export async function loadTinkerDenState(): Promise<TinkerDenState> {
  const stored = await readJson<TinkerDenState>(STORE_PATH);
  const state = stored?.schema === "tinkerden_return_system_v0" ? stored : seedState();
  const watched = applyWatchdog(state);
  if (!stored || watched !== state) await writeState(watched);
  return watched;
}

function missingSendFields(packet: TinkerDenPacket): string[] {
  return REQUIRED_TO_SEND.filter((field) => {
    const value = packet[field];
    if (typeof value === "boolean") return value !== true;
    return String(value ?? "").trim().length === 0;
  }).map(String);
}

function receiptFor(packet: TinkerDenPacket): TinkerDenReceipt {
  return {
    receipt_id: stamp("td_receipt"),
    packet_id: packet.packet_id,
    returned_by: `${packet.assigned_to}@${packet.machine}`,
    artifact_link: "foreman/soledash/tinkerden-return-system-v0/state.json",
    summary: `${packet.assigned_to} returned proof for ${packet.mission}`,
    proof: "Receipt attached through TinkerDen Return System V0.",
    blockers: "none",
    next_recommended_action: "Validate receipt, then assimilate into Speaker and TinkerDen ledger.",
    timestamp: nowIso()
  };
}

function bridgeDispatchReceiptFor(params: {
  packet: TinkerDenPacket;
  packetPath: string;
  relayEvent: Record<string, unknown>;
}): TinkerDenReceipt {
  return {
    receipt_id: stamp("td_receipt_bridge_execute"),
    packet_id: params.packet.packet_id,
    returned_by: "TinkerDen@Betsy",
    artifact_link: path.relative(ROOT, params.packetPath).replace(/\\/g, "/"),
    summary: `Dispatch receipt linked to ${params.packet.packet_id}`,
    proof: `Packet was written and packet_dispatched relay event landed with sha256 ${String(params.relayEvent.sha256 ?? "UNKNOWN")}.`,
    blockers: "Receiver-side work receipt still requires Aeye completion proof.",
    next_recommended_action: "Keep packet visible in Receipt Lane until downstream receiver proof lands.",
    timestamp: nowIso()
  };
}

async function writeBridgeDispatchReceiptArtifact(params: {
  packet: TinkerDenPacket;
  packetPath: string;
  receipt: TinkerDenReceipt;
  relayEvent: Record<string, unknown>;
}) {
  const receiptPath = path.join(TINKERDEN_RECEIPT_DIR, `${params.receipt.receipt_id}.json`);
  const receiptRelPath = path.relative(ROOT, receiptPath).replace(/\\/g, "/");
  const packetRelPath = path.relative(ROOT, params.packetPath).replace(/\\/g, "/");
  const artifact = {
    schema: "tinkerden_bridge_dispatch_receipt_v0",
    receipt_id: params.receipt.receipt_id,
    packet_id: params.packet.packet_id,
    linked_packet_id: params.packet.packet_id,
    mission: params.packet.mission,
    producer: params.receipt.returned_by,
    status_guess: "DISPATCH_ACKNOWLEDGED",
    proof_reference: receiptRelPath,
    packet_path: packetRelPath,
    relay_event_path: path.relative(ROOT, ORGANISM_EVENTS_PATH).replace(/\\/g, "/"),
    timestamp: params.receipt.timestamp,
    receipt: params.receipt,
    evidence: {
      relay_event_type: params.relayEvent.event_type,
      relay_timestamp: params.relayEvent.timestamp,
      packet_sha256: params.relayEvent.sha256,
      packet_size_bytes: params.relayEvent.size_bytes,
      operator_selection: params.relayEvent.operator_selection
    }
  };
  const pickupRecord = {
    receipt_id: params.receipt.receipt_id,
    packet_id: params.packet.packet_id,
    linked_packet_id: params.packet.packet_id,
    mission: params.packet.mission,
    producer: params.receipt.returned_by,
    status_guess: "DISPATCH_ACKNOWLEDGED",
    timestamp: params.receipt.timestamp,
    path: receiptRelPath,
    proof_reference: receiptRelPath
  };

  await fs.mkdir(TINKERDEN_RECEIPT_DIR, { recursive: true });
  await fs.writeFile(receiptPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  await fs.mkdir(path.dirname(RECEIPT_PICKUP_PATH), { recursive: true });
  await fs.appendFile(RECEIPT_PICKUP_PATH, `${JSON.stringify(pickupRecord)}\n`, "utf8");

  return {
    receipt_path: receiptRelPath,
    pickup_path: path.relative(ROOT, RECEIPT_PICKUP_PATH).replace(/\\/g, "/")
  };
}

function assimilationFor(receipt: TinkerDenReceipt): TinkerDenAssimilation {
  return {
    assimilation_id: stamp("td_assimilation"),
    receipt_id: receipt.receipt_id,
    speaker_update_required: true,
    doctrine_update_required: false,
    registry_update_required: false,
    change_capsule_required: true,
    affected_organs: ["TinkerDen Inbox", "Packet Ledger", "Receipt Drawer", "Assimilation Queue", "Speaker"],
    final_status: "PENDING"
  };
}

export async function runTinkerDenAction(action: TinkerDenAction, packetId: string): Promise<TinkerDenActionResult> {
  const loaded = await loadTinkerDenState();
  const packet = loaded.packets.find((candidate) => candidate.packet_id === packetId);
  if (!packet) {
    return { ok: false, action, error: "PACKET_NOT_FOUND", state: loaded };
  }

  let state: TinkerDenState = {
    ...loaded,
    packets: loaded.packets.map((candidate) => ({ ...candidate })),
    receipts: loaded.receipts.map((receipt) => ({ ...receipt })),
    assimilations: loaded.assimilations.map((assimilation) => ({ ...assimilation })),
    events: [...loaded.events]
  };
  const target = state.packets.find((candidate) => candidate.packet_id === packetId);
  if (!target) return { ok: false, action, error: "PACKET_NOT_FOUND", state };

  function record(name: string, details?: string) {
    state.events.unshift(event(packetId, name, details));
  }

  switch (action) {
    case "send_packet": {
      const missing = missingSendFields(target);
      if (missing.length > 0) {
        target.status = "BLOCKED";
        target.due_status = `Cannot send. Missing: ${missing.join(", ")}`;
        record("SEND_BLOCKED", target.due_status);
        break;
      }
      target.status = "SENT";
      target.due_status = "Sent. Receipt required.";
      record("PACKET_SENT", `${target.assigned_to}@${target.machine}`);
      break;
    }
    case "mark_working":
      target.status = "WORKING";
      target.due_status = "Recipient marked working. Receipt still required.";
      record("MARKED_WORKING");
      break;
    case "attach_receipt": {
      const existing = state.receipts.find((receipt) => receipt.packet_id === packetId);
      const receipt = existing ?? receiptFor(target);
      if (!existing) state.receipts.unshift(receipt);
      target.status = "RECEIPT_RETURNED";
      target.due_status = "Receipt returned. Awaiting validation.";
      record("RECEIPT_ATTACHED", receipt.receipt_id);
      break;
    }
    case "validate_receipt": {
      const receipt = state.receipts.find((candidate) => candidate.packet_id === packetId);
      if (!receipt) {
        target.status = "MISSING_RECEIPT";
        target.due_status = "Cannot validate. Receipt missing.";
        record("VALIDATION_BLOCKED", "Receipt missing.");
        break;
      }
      target.status = "VALIDATED";
      target.due_status = "Validated. Awaiting assimilation.";
      if (!state.assimilations.some((assimilation) => assimilation.receipt_id === receipt.receipt_id)) {
        state.assimilations.unshift(assimilationFor(receipt));
      }
      record("RECEIPT_VALIDATED", receipt.receipt_id);
      break;
    }
    case "assimilate": {
      const receipt = state.receipts.find((candidate) => candidate.packet_id === packetId);
      if (!receipt) {
        target.status = "MISSING_RECEIPT";
        target.due_status = "Cannot assimilate. Receipt missing.";
        record("ASSIMILATION_BLOCKED", "Receipt missing.");
        break;
      }
      let assimilation = state.assimilations.find((candidate) => candidate.receipt_id === receipt.receipt_id);
      if (!assimilation) {
        assimilation = assimilationFor(receipt);
        state.assimilations.unshift(assimilation);
      }
      assimilation.final_status = "ASSIMILATED";
      target.status = "ASSIMILATED";
      target.due_status = "Assimilated into TinkerDen and Speaker.";
      record("ASSIMILATED", assimilation.assimilation_id);
      break;
    }
    case "escalate_missing":
      target.status = "MISSING_RECEIPT";
      target.due_status = "Missing receipt escalated.";
      record("MISSING_RECEIPT_ESCALATED");
      break;
    case "kill_packet":
      target.status = "KILLED";
      target.due_status = "Killed. Retained in ledger.";
      record("PACKET_KILLED");
      break;
  }

  state = applyWatchdog({ ...state, updated_at: nowIso() });
  await writeState(state);
  return { ok: true, action, state };
}

export async function createBridgeExecutePacket(input: BridgeExecutePacketInput): Promise<{
  packet: TinkerDenPacket;
  receipt: TinkerDenReceipt;
  execution: CanonicalExecutionRecord;
  packet_path: string;
  receipt_path: string;
  execution_path: string;
  receipt_pickup_path: string;
  dispatch_state_path: string;
  event_path: string;
  relay_event: Record<string, unknown>;
  state: TinkerDenState;
}> {
  const timestamp = nowIso();
  const packet: TinkerDenPacket = {
    packet_id: stamp("td_packet_bridge_execute"),
    created_at: timestamp,
    origin: "TinkerDen Bridge",
    assigned_to: "Maker",
    machine: "Betsy",
    mission: input.move,
    why: input.why_now || input.recommended_because || "Bridge recommendation executed by operator.",
    owner: "Maker@Betsy",
    reviewer: "Petra",
    return_destination: "TinkerDen Intake",
    receipt_required: true,
    receipt_type: "proof",
    due_status: "AWAITING_RECEIPT",
    assimilation_destination: "Speaker + TinkerDen Intake",
    status: "DISPATCHED",
  };
  const packetArtifact = {
    schema: "tinkerden_bridge_execute_packet_v0",
    packet,
    bridge_card: {
      card_id: input.card_id,
      operator_selection: input.operator_selection,
      recommendation: input.recommendation,
      composite_score: input.composite_score,
      operator_reason: input.operator_reason,
      why_now: input.why_now,
      recommended_because: input.recommended_because,
    },
    status: "DISPATCHED",
    next_status: "AWAITING_RECEIPT",
  };
  const packetPath = path.join(BRIDGE_PACKET_DIR, `${packet.packet_id}.json`);
  const packetContents = `${JSON.stringify(packetArtifact, null, 2)}\n`;
  const state = await loadTinkerDenState();
  const next: TinkerDenState = {
    ...state,
    updated_at: timestamp,
    packets: [packet, ...state.packets],
    events: [
      event(
        packet.packet_id,
        "PACKET_DISPATCHED_FROM_BRIDGE",
        `Bridge card ${input.card_id} executed as ${input.operator_selection}. AWAITING_RECEIPT.`,
      ),
      ...state.events,
    ],
  };

  await fs.mkdir(BRIDGE_PACKET_DIR, { recursive: true });
  await fs.writeFile(packetPath, packetContents, "utf8");
  await writeState(next);
  const relayEvent = await appendOrganismRelayEvent({
    packetId: packet.packet_id,
    packetPath,
    packetContents,
    operatorSelection: input.operator_selection,
  });
  const receipt = bridgeDispatchReceiptFor({ packet, packetPath, relayEvent });
  const receiptPaths = await writeBridgeDispatchReceiptArtifact({
    packet,
    packetPath,
    receipt,
    relayEvent
  });
  const packetRelPath = path.relative(ROOT, packetPath).replace(/\\/g, "/");
  const execution: CanonicalExecutionRecord = {
    packet_id: packet.packet_id,
    relay_id: String((relayEvent as Record<string, unknown>).relay_id ?? "NO_RELAY"),
    receipt_id: receipt.receipt_id,
    relay_status: "RELAY_DISPATCHED",
    receipt_status: "RECEIPT_LINKED",
    created_at: packet.created_at,
    owner: packet.owner,
    mission: packet.mission,
    artifact_path: receiptPaths.receipt_path,
    packet_path: packetRelPath,
    receipt_path: receiptPaths.receipt_path
  };
  const executionPath = await writeCanonicalExecutionRecord(execution);
  const receiptLinkedState: TinkerDenState = {
    ...next,
    updated_at: receipt.timestamp,
    packets: next.packets.map((candidate) =>
      candidate.packet_id === packet.packet_id
        ? { ...candidate, due_status: "Dispatch receipt linked. Receiver proof still required." }
        : candidate
    ),
    receipts: [receipt, ...next.receipts],
    events: [
      event(packet.packet_id, "DISPATCH_RECEIPT_LINKED", receipt.receipt_id),
      ...next.events,
    ],
  };
  await writeState(receiptLinkedState);

  return {
    packet,
    receipt,
    execution,
    packet_path: packetRelPath,
    receipt_path: receiptPaths.receipt_path,
    execution_path: executionPath,
    receipt_pickup_path: receiptPaths.pickup_path,
    dispatch_state_path: path.relative(ROOT, STORE_PATH).replace(/\\/g, "/"),
    event_path: path.relative(ROOT, ORGANISM_EVENTS_PATH).replace(/\\/g, "/"),
    relay_event: relayEvent,
    state: receiptLinkedState,
  };
}

export async function createBridgePacketRelayReadyPacket(input: BridgePacketRelayPacketInput): Promise<{
  packet: TinkerDenPacket;
  receipt: TinkerDenReceipt;
  execution: CanonicalExecutionRecord;
  relay_id: string;
  packet_path: string;
  receipt_path: string;
  execution_path: string;
  receipt_pickup_path: string;
  dispatch_state_path: string;
  event_path: string;
  relay_event: Record<string, unknown>;
  workspace_target: PacketRelayWorkspaceTarget;
  packet_relay_text: string;
  state: TinkerDenState;
}> {
  const timestamp = nowIso();
  const workspaceTarget = await getPacketRelayWorkspaceTarget() ?? {
    id: "unconfigured",
    label: "No PowerToys Workspace target configured",
    target: "",
    mode: "none",
    args: [],
    window_title: "",
    configured: false
  };
  const operatorInstruction = workspaceTarget.configured
    ? "Relay complete. Target focused. Paste/send now."
    : "Relay complete. Workspace focus not configured. Packet copied only.";
  const packet: TinkerDenPacket = {
    packet_id: stamp("td_packet_relay_ready"),
    created_at: timestamp,
    origin: "TinkerDen Bridge",
    assigned_to: "Maker",
    machine: "Betsy",
    mission: input.move,
    why: input.why_now || input.recommended_because || "Bridge recommendation approved for Packet Relay System.",
    owner: "Maker@Betsy",
    reviewer: "Petra",
    return_destination: "TinkerDen Intake",
    receipt_required: true,
    receipt_type: "proof",
    due_status: operatorInstruction,
    assimilation_destination: "Speaker + TinkerDen Intake",
    status: "RELAY_READY",
  };
  const packetRelayText = bridgePacketRelayText({ packet, input, workspaceTarget });
  const packetArtifact = {
    schema: "tinkerden_bridge_packet_relay_packet_v0",
    packet,
    bridge_card: {
      card_id: input.card_id,
      operator_selection: input.operator_selection,
      recommendation: input.recommendation,
      composite_score: input.composite_score,
      operator_reason: input.operator_reason,
      why_now: input.why_now,
      recommended_because: input.recommended_because,
    },
    workspace_target: workspaceTarget,
    packet_relay_text: packetRelayText,
    status: "RELAY_READY",
    operator_instruction: operatorInstruction,
    guardrails: PACKET_RELAY_RULES,
  };
  const packetPath = path.join(BRIDGE_PACKET_DIR, `${packet.packet_id}.json`);
  const packetContents = `${JSON.stringify(packetArtifact, null, 2)}\n`;
  const relayId = stamp("td_relay");
  const receiptId = stamp("td_receipt_packet_relay");
  const state = await loadTinkerDenState();
  const next: TinkerDenState = {
    ...state,
    updated_at: timestamp,
    packets: [packet, ...state.packets],
    events: [
      event(
        packet.packet_id,
        "RELAY_READY",
        `Bridge card ${input.card_id} approved as ${input.operator_selection}. Packet Relay System relay complete. No auto-send.`,
      ),
      ...state.events,
    ],
  };

  await fs.mkdir(BRIDGE_PACKET_DIR, { recursive: true });
  await fs.writeFile(packetPath, packetContents, "utf8");
  await writeState(next);
  const relayEvent = await appendOrganismPacketRelayEvent({
    relayId,
    packetId: packet.packet_id,
    receiptId,
    packetPath,
    packetContents,
    operatorSelection: input.operator_selection,
    workspaceTarget,
  });
  const receipt = packetRelayReceiptFor({ packet, relayId, packetPath, relayEvent });
  const receiptPaths = await writePacketRelayReceiptArtifact({
    packet,
    relayId,
    packetPath,
    receipt,
    relayEvent
  });
  const packetRelPath = path.relative(ROOT, packetPath).replace(/\\/g, "/");
  const execution: CanonicalExecutionRecord = {
    packet_id: packet.packet_id,
    relay_id: relayId,
    receipt_id: receipt.receipt_id,
    relay_status: "PACKET_RELAY_COMPLETE",
    receipt_status: "RECEIPT_ASSIMILATED",
    created_at: packet.created_at,
    owner: packet.owner,
    mission: packet.mission,
    artifact_path: receiptPaths.receipt_path,
    packet_path: packetRelPath,
    receipt_path: receiptPaths.receipt_path
  };
  const executionPath = await writeCanonicalExecutionRecord(execution);
  const assimilation = {
    ...assimilationFor(receipt),
    final_status: "ASSIMILATED" as const
  };
  const relayReceiptState: TinkerDenState = {
    ...next,
    updated_at: receipt.timestamp,
    packets: next.packets.map((candidate) =>
      candidate.packet_id === packet.packet_id
        ? { ...candidate, due_status: "Packet Relay complete. Receipt created and ready for assimilation." }
        : candidate
    ),
    receipts: [receipt, ...next.receipts],
    assimilations: [assimilation, ...next.assimilations],
    events: [
      event(packet.packet_id, "RECEIPT_ASSIMILATED", assimilation.assimilation_id),
      event(packet.packet_id, "RELAY_RECEIPT_CREATED", `${relayId} -> ${receipt.receipt_id}`),
      ...next.events
    ]
  };
  await writeState(relayReceiptState);

  return {
    packet,
    receipt,
    execution,
    relay_id: relayId,
    packet_path: packetRelPath,
    receipt_path: receiptPaths.receipt_path,
    execution_path: executionPath,
    receipt_pickup_path: receiptPaths.pickup_path,
    dispatch_state_path: path.relative(ROOT, STORE_PATH).replace(/\\/g, "/"),
    event_path: path.relative(ROOT, ORGANISM_EVENTS_PATH).replace(/\\/g, "/"),
    relay_event: relayEvent,
    workspace_target: workspaceTarget,
    packet_relay_text: packetRelayText,
    state: relayReceiptState,
  };
}

export const createBridgeAutopasteReadyPacket = createBridgePacketRelayReadyPacket;

export async function writeTinkerDenMissionReceipt(): Promise<{ receipt: TinkerDenReceipt; state: TinkerDenState }> {
  const state = await loadTinkerDenState();
  const packet = state.packets.find((candidate) => candidate.packet_id === "td_packet_return_system_v0_bean") ?? seedPacket();
  const receipt: TinkerDenReceipt = {
    receipt_id: "td_receipt_tinkerden_return_system_v0",
    packet_id: packet.packet_id,
    returned_by: "Maker@Betsy",
    artifact_link: "app/tinkerden",
    summary: "Built TinkerDen Inbox, Packet Ledger, Receipt Drawer, Assimilation Queue, and Missing Receipt Watchdog.",
    proof: "File-backed state at foreman/soledash/tinkerden-return-system-v0/state.json with API actions and UI columns.",
    blockers: "none",
    next_recommended_action: "Review /tinkerden and send one packet through the full lifecycle.",
    timestamp: nowIso()
  };
  const next: TinkerDenState = {
    ...state,
    packets: state.packets.some((candidate) => candidate.packet_id === packet.packet_id)
      ? state.packets.map((candidate) =>
          candidate.packet_id === packet.packet_id
            ? { ...candidate, status: "RECEIPT_RETURNED", due_status: "System build receipt posted back to TinkerDen Inbox." }
            : candidate
        )
      : [{ ...packet, status: "RECEIPT_RETURNED", due_status: "System build receipt posted back to TinkerDen Inbox." }, ...state.packets],
    receipts: state.receipts.some((candidate) => candidate.receipt_id === receipt.receipt_id)
      ? state.receipts
      : [receipt, ...state.receipts],
    updated_at: nowIso(),
    events: [event(packet.packet_id, "MISSION_RECEIPT_POSTED", receipt.receipt_id), ...state.events]
  };
  await writeState(next);
  return { receipt, state: next };
}
