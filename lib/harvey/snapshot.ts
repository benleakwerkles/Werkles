import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { HarveyCommand, HarveyMachine, MachineHeartbeat } from "./machine-control";

const HARVEY_MACHINES = ["Doss", "Betsy", "Spanzee", "Medullina", "Sally"] as const satisfies readonly HarveyMachine[];

export type HarveyConnectivity = "LIVE" | "STALE" | "DISCONNECTED";
export type HarveyReceiptFreshness = "FRESH" | "AGING" | "STALE" | "UNKNOWN";

export type HarveySnapshotMachine = {
  machine: HarveyMachine;
  connectivity: HarveyConnectivity;
  heartbeat_observed_at: string | null;
  heartbeat_age_ms: number | null;
  heartbeat_error?: "HEARTBEAT_TIMESTAMP_INVALID" | "HEARTBEAT_IDENTITY_INVALID" | "HEARTBEAT_CREDENTIAL_INVALID" | "HEARTBEAT_CREDENTIAL_EXPIRED" | "HEARTBEAT_CAPABILITIES_INVALID";
  auth_mode: "HMAC_SHA256_V1" | "EPHEMERAL_RSA_V1" | null;
  credential_expires_at: string | null;
  capabilities: Array<"PING" | "KNOCK" | "OPEN_URL" | "SWATEYE_GIT_LFS_RECOVERY">;
  latest_command: null | {
    command_id: string;
    action: HarveyCommand["action"];
    status: HarveyCommand["status"];
    updated_at: string;
    workstream_id?: string;
    evidence_state: "VALID" | "INVALID";
  };
};

export type HarveySnapshotWorkstream = {
  workstream_id: string;
  name: string;
  machine: string;
  source_kind: "HISTORICAL_OPERATOR_REPORT";
  reported_status: string;
  reported_updated_at: string | null;
  execution_status: "UNPROVEN" | "EVIDENCE_INVALID" | "COMMAND_COMPLETED" | "COMMAND_BLOCKER";
  receipt_freshness: HarveyReceiptFreshness;
  latest_command_id: string | null;
  latest_command_machine: HarveyMachine | null;
  latest_receipt_at: string | null;
};

export type HarveySnapshot = {
  schema: "werkles.harvey-snapshot/v1";
  revision: string;
  generated_at: string;
  degraded: boolean;
  errors: string[];
  poll_after_ms: 2500;
  machines: HarveySnapshotMachine[];
  workstreams: HarveySnapshotWorkstream[];
};

type WorkstreamReport = {
  updated_at?: unknown;
  workstreams?: unknown;
};

type SnapshotInput = {
  heartbeats?: unknown[];
  commands?: unknown[];
  workstreams?: WorkstreamReport;
  sourceErrors?: string[];
};

type EvidenceResult = {
  valid: boolean;
  terminalReceipt?: HarveyCommand["receipts"][number];
};

type HeartbeatFreshness = {
  connectivity: HarveyConnectivity;
  observedAt: string | null;
  ageMs: number | null;
  authMode: HarveySnapshotMachine["auth_mode"];
  credentialExpiresAt: string | null;
  capabilities: HarveySnapshotMachine["capabilities"];
  error?: HarveySnapshotMachine["heartbeat_error"];
};

const LIVE_MAX_MS = 90_000;
const STALE_MAX_MS = 300_000;
const RECEIPT_FRESH_MAX_MS = 30 * 60 * 1000;
const RECEIPT_AGING_MAX_MS = 120 * 60 * 1000;
const MAX_SOURCE_FILE_BYTES = 256 * 1024;
const MAX_COMMAND_FILES = 2048;
const WORKSTREAM_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const COMMAND_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const COMMAND_STATUSES = new Set(["QUEUED", "RECEIVED", "COMPLETED", "BLOCKER"]);
const COMMAND_ACTIONS = new Set(["OPEN_URL", "PING", "KNOCK", "SWATEYE_GIT_LFS_RECOVERY"]);
const HEARTBEAT_CAPABILITIES = new Set(["HEARTBEAT", "OPEN_URL", "PING", "KNOCK", "KNOCK_COCKPIT_V1", "SWATEYE_GIT_LFS_RECOVERY"]);
const MACHINE_AUTH_MODES = new Set(["HMAC_SHA256_V1", "EPHEMERAL_RSA_V1"]);
const EPHEMERAL_CREDENTIAL_ID_PATTERN = /^betsy_pair_[a-f0-9]{32}$/;
const REPORTED_STATUSES = new Set(["ACTIVE_LOCAL_PROOF", "ACTIVE_OPERATOR_REPORTED", "STARTED_OPERATOR_REPORTED", "READY_MINIMAL_RESIDUE_REPORTED", "EXTERNAL_PROTECTED_LANE"]);
const WORKSTREAM_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 &'’:+.,()-]{0,79}$/;
const CANONICAL_IDENTITY: Record<HarveyMachine, { hostname: string; agent_id: string }> = {
  Doss: { hostname: "DOSS", agent_id: "handeye-doss-doss" },
  Betsy: { hostname: "BETSY", agent_id: "handeye-betsy-betsy" },
  Spanzee: { hostname: "SPANZEE", agent_id: "handeye-spanzee-spanzee" },
  Medullina: { hostname: "COURTNEY", agent_id: "handeye-medullina-courtney" },
  Sally: { hostname: "SALLY", agent_id: "handeye-sally-sally" }
};

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((result, key) => {
    const item = (value as Record<string, unknown>)[key];
    if (item !== undefined) result[key] = stableValue(item);
    return result;
  }, {});
}

function stableSerialize(value: unknown) {
  return JSON.stringify(stableValue(value));
}

function snapshotRevision(input: Omit<HarveySnapshot, "revision" | "generated_at">) {
  const machines = input.machines.map(({ heartbeat_age_ms: _age, ...machine }) => machine);
  return createHash("sha256").update(stableSerialize({ ...input, machines }), "utf8").digest("hex");
}

function isMachine(value: unknown): value is HarveyMachine {
  return HARVEY_MACHINES.includes(value as HarveyMachine);
}

function parseTimestamp(value: unknown) {
  const timestamp = typeof value === "string" ? Date.parse(value) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : null;
}

function connectivityForHeartbeat(machine: HarveyMachine, heartbeat: unknown, nowMs: number): HeartbeatFreshness {
  const disconnected: HeartbeatFreshness = { connectivity: "DISCONNECTED", observedAt: null, ageMs: null, authMode: null, credentialExpiresAt: null, capabilities: [] };
  if (!heartbeat || typeof heartbeat !== "object") return disconnected;
  const record = heartbeat as Record<string, unknown>;
  const observedAt = String(record.observed_at ?? "");
  const identity = CANONICAL_IDENTITY[machine];
  if (record.machine !== machine || record.hostname !== identity.hostname || record.agent_id !== identity.agent_id) {
    return { ...disconnected, observedAt: observedAt || null, error: "HEARTBEAT_IDENTITY_INVALID" as const };
  }
  const timestamp = parseTimestamp(observedAt);
  if (timestamp === null || timestamp > nowMs) {
    return { ...disconnected, observedAt: observedAt || null, error: "HEARTBEAT_TIMESTAMP_INVALID" as const };
  }
  const authMode = String(record.auth_mode ?? "");
  const credentialId = String(record.credential_id ?? "");
  const credentialExpiresAt = record.credential_expires_at === null ? null : String(record.credential_expires_at ?? "");
  if (
    !MACHINE_AUTH_MODES.has(authMode)
    || (authMode === "HMAC_SHA256_V1" && (credentialId !== identity.agent_id || credentialExpiresAt !== null))
    || (authMode === "EPHEMERAL_RSA_V1" && (machine !== "Betsy" || identity.agent_id !== "handeye-betsy-betsy" || !EPHEMERAL_CREDENTIAL_ID_PATTERN.test(credentialId) || parseTimestamp(credentialExpiresAt) === null))
  ) {
    return { ...disconnected, observedAt, error: "HEARTBEAT_CREDENTIAL_INVALID" as const };
  }
  if (authMode === "EPHEMERAL_RSA_V1" && (parseTimestamp(credentialExpiresAt) ?? Number.NEGATIVE_INFINITY) <= nowMs) {
    return { ...disconnected, observedAt, authMode: "EPHEMERAL_RSA_V1" as const, credentialExpiresAt, error: "HEARTBEAT_CREDENTIAL_EXPIRED" as const };
  }
  if (!Array.isArray(record.capabilities) || record.capabilities.some((capability) => typeof capability !== "string" || !HEARTBEAT_CAPABILITIES.has(capability)) || new Set(record.capabilities).size !== record.capabilities.length) {
    return { ...disconnected, observedAt, error: "HEARTBEAT_CAPABILITIES_INVALID" as const };
  }
  if (machine !== "Spanzee" && record.capabilities.includes("SWATEYE_GIT_LFS_RECOVERY")) {
    return { ...disconnected, observedAt, error: "HEARTBEAT_CAPABILITIES_INVALID" as const };
  }
  if (authMode === "EPHEMERAL_RSA_V1" && (record.capabilities.length !== 1 || record.capabilities[0] !== "PING")) {
    return { ...disconnected, observedAt, error: "HEARTBEAT_CAPABILITIES_INVALID" as const };
  }
  const capabilities = record.capabilities.filter((capability): capability is HarveySnapshotMachine["capabilities"][number] => COMMAND_ACTIONS.has(capability)).sort();
  const ageMs = nowMs - timestamp;
  const connectivity: HarveyConnectivity = ageMs <= LIVE_MAX_MS ? "LIVE" : ageMs <= STALE_MAX_MS ? "STALE" : "DISCONNECTED";
  return {
    connectivity,
    observedAt,
    ageMs,
    authMode: authMode as HarveySnapshotMachine["auth_mode"],
    credentialExpiresAt,
    capabilities
  };
}

function validCredentialBinding(
  value: { auth_mode?: unknown; credential_id?: unknown; credential_expires_at?: unknown },
  machine: HarveyMachine,
  identity: { agent_id: string },
  notBefore: number,
  notAfter: number
) {
  const authMode = String(value.auth_mode ?? "");
  const credentialId = String(value.credential_id ?? "");
  if (authMode === "HMAC_SHA256_V1") {
    return credentialId === identity.agent_id && value.credential_expires_at === null;
  }
  if (authMode !== "EPHEMERAL_RSA_V1" || machine !== "Betsy" || identity.agent_id !== "handeye-betsy-betsy" || !EPHEMERAL_CREDENTIAL_ID_PATTERN.test(credentialId)) return false;
  const expiresAt = parseTimestamp(value.credential_expires_at);
  return expiresAt !== null && expiresAt >= notBefore && notAfter <= expiresAt;
}

function receiptFreshness(receipt: HarveyCommand["receipts"][number] | undefined, nowMs: number): HarveyReceiptFreshness {
  if (!receipt) return "UNKNOWN";
  const timestamp = parseTimestamp(receipt.observed_at);
  if (timestamp === null || timestamp > nowMs) return "UNKNOWN";
  const age = nowMs - timestamp;
  return age <= RECEIPT_FRESH_MAX_MS ? "FRESH" : age <= RECEIPT_AGING_MAX_MS ? "AGING" : "STALE";
}

function commandTimestamp(command: Record<string, unknown>) {
  return parseTimestamp(command.updated_at) ?? parseTimestamp(command.created_at) ?? Number.NEGATIVE_INFINITY;
}

function validateCommandEvidence(value: unknown, nowMs: number): EvidenceResult {
  if (!value || typeof value !== "object") return { valid: false };
  const command = value as HarveyCommand;
  if (!COMMAND_ID_PATTERN.test(String(command.command_id ?? "")) || !isMachine(command.machine) || !COMMAND_ACTIONS.has(command.action) || !COMMAND_STATUSES.has(command.status)) return { valid: false };
  if (command.workstream_id !== undefined && !WORKSTREAM_ID_PATTERN.test(String(command.workstream_id))) return { valid: false };
  const createdAt = parseTimestamp(command.created_at);
  const updatedAt = parseTimestamp(command.updated_at);
  if (createdAt === null || updatedAt === null || createdAt > updatedAt || updatedAt > nowMs) return { valid: false };
  if (!Array.isArray(command.receipts)) return { valid: false };
  if (command.status === "QUEUED") return { valid: command.receipts.length === 0 && !command.claim };
  const identity = CANONICAL_IDENTITY[command.machine];
  const claimedAt = parseTimestamp(command.claim?.claimed_at);
  const leaseExpiresAt = parseTimestamp(command.claim?.lease_expires_at);
  if (
    !command.claim
    || !COMMAND_ID_PATTERN.test(String(command.claim.claim_id ?? ""))
    || command.claim.machine !== command.machine
    || command.claim.hostname !== identity.hostname
    || command.claim.agent_id !== identity.agent_id
    || claimedAt === null
    || leaseExpiresAt === null
    || createdAt > claimedAt
    || claimedAt > updatedAt
    || leaseExpiresAt < claimedAt
    || !Number.isInteger(command.claim.attempt)
    || command.claim.attempt < 1
    || !validCredentialBinding(command.claim, command.machine, identity, claimedAt ?? Number.POSITIVE_INFINITY, updatedAt)
  ) return { valid: false };
  const receiptIds = command.receipts.map((receipt) => String(receipt?.receipt_id ?? ""));
  if (receiptIds.some((receiptId) => !COMMAND_ID_PATTERN.test(receiptId)) || new Set(receiptIds).size !== receiptIds.length) return { valid: false };
  const receiptGroups = new Map<string, HarveyCommand["receipts"]>();
  let previousReceiptAt = Number.NEGATIVE_INFINITY;
  for (const receipt of command.receipts) {
    const observedAt = parseTimestamp(receipt.observed_at);
    if (
      receipt.command_id !== command.command_id
      || receipt.machine !== command.machine
      || receipt.hostname !== identity.hostname
      || receipt.agent_id !== identity.agent_id
      || !COMMAND_ID_PATTERN.test(String(receipt.claim_id ?? ""))
      || observedAt === null
      || observedAt < createdAt
      || observedAt < previousReceiptAt
      || observedAt > updatedAt
      || observedAt > nowMs
      || !["RECEIVED", "COMPLETED", "BLOCKER"].includes(receipt.status)
      || !validCredentialBinding(receipt, command.machine, identity, observedAt ?? Number.POSITIVE_INFINITY, observedAt ?? Number.POSITIVE_INFINITY)
    ) return { valid: false };
    previousReceiptAt = observedAt;
    const group = receiptGroups.get(receipt.claim_id) ?? [];
    group.push(receipt);
    receiptGroups.set(receipt.claim_id, group);
  }
  const activeReceipts = receiptGroups.get(command.claim.claim_id) ?? [];
  if (activeReceipts.some((receipt) => receipt.auth_mode !== command.claim?.auth_mode || receipt.credential_id !== command.claim?.credential_id || receipt.credential_expires_at !== command.claim?.credential_expires_at)) return { valid: false };
  const historicalGroups = [...receiptGroups.entries()].filter(([claimId]) => claimId !== command.claim?.claim_id);
  if (receiptGroups.size !== command.claim.attempt) return { valid: false };
  if (historicalGroups.some(([, group]) => group.length !== 1 || group[0].status !== "RECEIVED" || (parseTimestamp(group[0].observed_at) ?? Number.POSITIVE_INFINITY) > claimedAt)) return { valid: false };
  if (command.status === "RECEIVED") {
    const receivedAt = parseTimestamp(activeReceipts[0]?.observed_at);
    return { valid: activeReceipts.length === 1 && activeReceipts[0].status === "RECEIVED" && receivedAt !== null && receivedAt >= claimedAt && receivedAt <= updatedAt };
  }
  const receivedAt = parseTimestamp(activeReceipts[0]?.observed_at);
  const terminalAt = parseTimestamp(activeReceipts[1]?.observed_at);
  const validTerminal = activeReceipts.length === 2
    && activeReceipts[0].status === "RECEIVED"
    && activeReceipts[1].status === command.status
    && receivedAt !== null
    && terminalAt !== null
    && receivedAt >= claimedAt
    && terminalAt >= receivedAt
    && terminalAt <= updatedAt
    && terminalAt <= leaseExpiresAt;
  return validTerminal ? { valid: true, terminalReceipt: activeReceipts[1] } : { valid: false };
}

function normalizeCommands(values: unknown[], nowMs: number, errors: string[]) {
  return values
    .filter((value): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value))
    .map((command) => {
      const commandId = String(command.command_id ?? "INVALID_COMMAND");
      const evidence = validateCommandEvidence(command, nowMs);
      if (!evidence.valid) errors.push(`COMMAND_EVIDENCE_INVALID:${COMMAND_ID_PATTERN.test(commandId) ? commandId : "INVALID_COMMAND"}`);
      return { command: command as unknown as HarveyCommand, timestamp: commandTimestamp(command), evidence };
    })
    .sort((left, right) => right.timestamp - left.timestamp || String(right.command.command_id).localeCompare(String(left.command.command_id)));
}

function normalizeWorkstreams(report: WorkstreamReport | undefined, commands: ReturnType<typeof normalizeCommands>, nowMs: number, errors: string[]) {
  const reportTimestamp = parseTimestamp(report?.updated_at);
  const reportedUpdatedAt = typeof report?.updated_at === "string" && reportTimestamp !== null && reportTimestamp <= nowMs ? report.updated_at : null;
  if (report?.updated_at !== undefined && reportedUpdatedAt === null) errors.push("WORKSTREAM_REPORT_TIMESTAMP_INVALID");
  const raw = Array.isArray(report?.workstreams) ? report.workstreams : [];
  const normalized = raw
    .filter((value): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value))
    .map<HarveySnapshotWorkstream>((stream) => {
      const workstreamId = String(stream.id ?? "");
      if (!WORKSTREAM_ID_PATTERN.test(workstreamId)) errors.push("WORKSTREAM_ID_INVALID");
      const rawName = String(stream.name ?? "");
      const rawStatus = String(stream.status ?? "");
      if (!WORKSTREAM_NAME_PATTERN.test(rawName)) errors.push(`WORKSTREAM_NAME_INVALID:${WORKSTREAM_ID_PATTERN.test(workstreamId) ? workstreamId : "INVALID_WORKSTREAM"}`);
      if (!REPORTED_STATUSES.has(rawStatus)) errors.push(`WORKSTREAM_STATUS_INVALID:${WORKSTREAM_ID_PATTERN.test(workstreamId) ? workstreamId : "INVALID_WORKSTREAM"}`);
      if (!isMachine(stream.machine)) errors.push(`WORKSTREAM_MACHINE_INVALID:${WORKSTREAM_ID_PATTERN.test(workstreamId) ? workstreamId : "INVALID_WORKSTREAM"}`);
      const expectedMachine = isMachine(stream.machine) ? stream.machine : null;
      const terminalCommands = commands.filter(({ command }) => command.workstream_id === workstreamId && (command.status === "COMPLETED" || command.status === "BLOCKER"));
      const latest = terminalCommands[0];
      const machineMatches = Boolean(latest && expectedMachine && latest.command.machine === expectedMachine);
      if (expectedMachine && terminalCommands.some(({ command }) => command.machine !== expectedMachine)) {
        errors.push(`WORKSTREAM_COMMAND_MACHINE_MISMATCH:${WORKSTREAM_ID_PATTERN.test(workstreamId) ? workstreamId : "INVALID_WORKSTREAM"}`);
      }
      const terminalReceipt = latest?.evidence.terminalReceipt;
      const executionStatus: HarveySnapshotWorkstream["execution_status"] = !latest
        ? "UNPROVEN"
        : !machineMatches || !latest.evidence.valid || !terminalReceipt
          ? "EVIDENCE_INVALID"
          : latest.command.status === "COMPLETED" ? "COMMAND_COMPLETED" : "COMMAND_BLOCKER";
      return {
        workstream_id: WORKSTREAM_ID_PATTERN.test(workstreamId) ? workstreamId : "invalid-workstream",
        name: WORKSTREAM_NAME_PATTERN.test(rawName) ? rawName : "UNTRUSTED WORKSTREAM",
        machine: isMachine(stream.machine) ? stream.machine : "UNASSIGNED",
        source_kind: "HISTORICAL_OPERATOR_REPORT",
        reported_status: REPORTED_STATUSES.has(rawStatus) ? rawStatus : "UNTRUSTED_REPORT",
        reported_updated_at: reportedUpdatedAt,
        execution_status: executionStatus,
        receipt_freshness: executionStatus === "COMMAND_COMPLETED" || executionStatus === "COMMAND_BLOCKER" ? receiptFreshness(terminalReceipt, nowMs) : "UNKNOWN",
        latest_command_id: latest ? String(latest.command.command_id) : null,
        latest_command_machine: latest && isMachine(latest.command.machine) ? latest.command.machine : null,
        latest_receipt_at: machineMatches ? terminalReceipt?.observed_at ?? null : null
      };
    })
    .sort((left, right) => left.workstream_id.localeCompare(right.workstream_id));
  const counts = new Map<string, number>();
  for (const stream of normalized) counts.set(stream.workstream_id, (counts.get(stream.workstream_id) ?? 0) + 1);
  const seen = new Set<string>();
  return normalized
    .filter((stream) => {
      if (seen.has(stream.workstream_id)) return false;
      seen.add(stream.workstream_id);
      return true;
    })
    .map((stream) => {
      if ((counts.get(stream.workstream_id) ?? 0) < 2) return stream;
      errors.push(`WORKSTREAM_ID_DUPLICATE:${stream.workstream_id}`);
      return { ...stream, execution_status: "EVIDENCE_INVALID" as const, receipt_freshness: "UNKNOWN" as const, latest_command_id: null, latest_command_machine: null, latest_receipt_at: null };
    });
}

export function buildHarveySnapshot(input: SnapshotInput, nowValue: number | Date = Date.now()): HarveySnapshot {
  const nowMs = nowValue instanceof Date ? nowValue.getTime() : nowValue;
  if (!Number.isFinite(nowMs)) throw new Error("HARVEY_SNAPSHOT_TIME_INVALID");
  const errors = [...(input.sourceErrors ?? [])];
  const commands = normalizeCommands(input.commands ?? [], nowMs, errors);
  const heartbeatByMachine = new Map<HarveyMachine, unknown>();
  for (const heartbeat of input.heartbeats ?? []) {
    if (!heartbeat || typeof heartbeat !== "object" || !isMachine((heartbeat as Record<string, unknown>).machine)) {
      errors.push("HEARTBEAT_MACHINE_INVALID");
      continue;
    }
    const machine = (heartbeat as Record<string, unknown>).machine as HarveyMachine;
    const current = heartbeatByMachine.get(machine) as Record<string, unknown> | undefined;
    if (!current || (parseTimestamp((heartbeat as Record<string, unknown>).observed_at) ?? Number.NEGATIVE_INFINITY) > (parseTimestamp(current.observed_at) ?? Number.NEGATIVE_INFINITY)) {
      heartbeatByMachine.set(machine, heartbeat);
    }
  }

  const machines = HARVEY_MACHINES.map<HarveySnapshotMachine>((machine) => {
    const freshness = connectivityForHeartbeat(machine, heartbeatByMachine.get(machine), nowMs);
    if (freshness.error) errors.push(`${freshness.error}:${machine}`);
    const latest = commands.find(({ command }) => command.machine === machine);
    return {
      machine,
      connectivity: freshness.connectivity,
      heartbeat_observed_at: freshness.observedAt,
      heartbeat_age_ms: freshness.ageMs,
      ...(freshness.error ? { heartbeat_error: freshness.error } : {}),
      auth_mode: freshness.authMode,
      credential_expires_at: freshness.credentialExpiresAt,
      capabilities: freshness.capabilities,
      latest_command: latest && COMMAND_ID_PATTERN.test(String(latest.command.command_id)) && COMMAND_ACTIONS.has(latest.command.action) && COMMAND_STATUSES.has(latest.command.status)
        ? {
            command_id: latest.command.command_id,
            action: latest.command.action,
            status: latest.command.status,
            updated_at: latest.command.updated_at,
            ...(latest.command.workstream_id && WORKSTREAM_ID_PATTERN.test(latest.command.workstream_id) ? { workstream_id: latest.command.workstream_id } : {}),
            evidence_state: latest.evidence.valid ? "VALID" : "INVALID"
          }
        : null
    };
  });
  const workstreams = normalizeWorkstreams(input.workstreams, commands, nowMs, errors);
  const uniqueErrors = [...new Set(errors)].sort();
  const revisionInput: Omit<HarveySnapshot, "revision" | "generated_at"> = {
    schema: "werkles.harvey-snapshot/v1",
    degraded: uniqueErrors.length > 0,
    errors: uniqueErrors,
    poll_after_ms: 2500,
    machines,
    workstreams
  };
  return {
    ...revisionInput,
    revision: snapshotRevision(revisionInput),
    generated_at: new Date(nowMs).toISOString()
  };
}

async function readBoundedJson(file: string) {
  const stat = await fs.stat(file);
  if (stat.size > MAX_SOURCE_FILE_BYTES) throw new Error("SOURCE_FILE_TOO_LARGE");
  return JSON.parse(await fs.readFile(file, "utf8")) as unknown;
}

export async function readHarveySnapshot(nowValue: number | Date = Date.now()) {
  const workspace = process.cwd();
  const controlRoot = path.join(workspace, "data", "harvey", "machine-control");
  const errors: string[] = [];
  const heartbeats: MachineHeartbeat[] = [];
  for (const machine of HARVEY_MACHINES) {
    try {
      const heartbeat = await readBoundedJson(path.join(controlRoot, "machines", `${machine.toLowerCase()}.json`));
      heartbeats.push(heartbeat as MachineHeartbeat);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") errors.push(`HEARTBEAT_FILE_INVALID:${machine}`);
    }
  }

  const commands: unknown[] = [];
  try {
    const directory = path.join(controlRoot, "commands");
    const names = (await fs.readdir(directory)).filter((name) => /^[a-zA-Z0-9_-]+\.json$/.test(name)).sort();
    if (names.length > MAX_COMMAND_FILES) errors.push("COMMAND_SET_TOO_LARGE");
    else {
      for (const name of names) {
        try { commands.push(await readBoundedJson(path.join(directory, name))); }
        catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") errors.push(`COMMAND_FILE_INVALID:${name.slice(0, -5)}`);
        }
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") errors.push("COMMAND_DIRECTORY_UNAVAILABLE");
  }

  let workstreams: WorkstreamReport = {};
  try {
    workstreams = await readBoundedJson(path.join(workspace, "foreman", "harvey", "HARVEY_WORKSTREAMS_20260713.json")) as WorkstreamReport;
  } catch {
    errors.push("WORKSTREAM_REPORT_INVALID");
  }
  return buildHarveySnapshot({ heartbeats, commands, workstreams, sourceErrors: errors }, nowValue);
}
