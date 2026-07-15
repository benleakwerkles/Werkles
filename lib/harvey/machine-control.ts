import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const HARVEY_MACHINES = ["Doss", "Betsy", "Spanzee", "Medullina", "Sally"] as const;
export type HarveyMachine = (typeof HARVEY_MACHINES)[number];
export type HarveyCommandStatus = "QUEUED" | "RECEIVED" | "COMPLETED" | "BLOCKER";
export type HarveyTerminalCommandStatus = "COMPLETED" | "BLOCKER";

export const HARVEY_MACHINE_HOSTNAMES: Record<HarveyMachine, string> = {
  Doss: "DOSS",
  Betsy: "BETSY",
  Spanzee: "SPANZEE",
  Medullina: "COURTNEY",
  Sally: "SALLY"
};

export type HarveyOperatorActor = {
  role: "operator";
  operator_id: string;
};

export type HarveyMachineActor = {
  role: "machine";
  machine: HarveyMachine;
  hostname: string;
  agent_id: string;
};

export type HarveyWriteActor = HarveyOperatorActor | HarveyMachineActor;

export class HarveyControlError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "HarveyControlError";
    this.status = status;
  }
}

export type MachineHeartbeat = {
  machine: HarveyMachine;
  hostname: string;
  agent_id: string;
  agent_version: string;
  capabilities: string[];
  observed_at: string;
};

export type HarveyCommand = {
  command_id: string;
  fleet_id?: string;
  workstream_id?: string;
  machine: HarveyMachine;
  action: "OPEN_URL" | "PING" | "KNOCK";
  payload: { url?: string };
  status: HarveyCommandStatus;
  created_at: string;
  updated_at: string;
  claim_reclaimable?: boolean;
  claim?: {
    claim_id: string;
    machine: HarveyMachine;
    hostname: string;
    agent_id: string;
    claimed_at: string;
    lease_expires_at: string;
    attempt: number;
  };
  receipts: Array<{
    receipt_id: string;
    command_id: string;
    status: Exclude<HarveyCommandStatus, "QUEUED">;
    machine: HarveyMachine;
    hostname: string;
    agent_id: string;
    claim_id: string;
    evidence: string;
    observed_at: string;
  }>;
  receipt?: {
    hostname: string;
    agent_id: string;
    evidence: string;
  };
};

const root = () => path.join(process.cwd(), "data", "harvey", "machine-control");
const machineDir = () => path.join(root(), "machines");
const commandDir = () => path.join(root(), "commands");
const fleetDir = () => path.join(root(), "fleets");
const writeQueues = new Map<string, Promise<unknown>>();
const COMMAND_LOCK_STALE_MS = 30_000;
const COMMAND_LOCK_ATTEMPTS = 250;
const MAX_ACTIVE_COMMANDS_PER_MACHINE = 64;
const MAX_TERMINAL_COMMANDS_PER_MACHINE = 256;
const TERMINAL_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_TERMINAL_FLEET_LEDGERS = 256;
const FLEET_TERMINAL_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_RECEIPT_EVIDENCE_BYTES = 4096;

async function ensureRoots() {
  await Promise.all([fs.mkdir(machineDir(), { recursive: true }), fs.mkdir(commandDir(), { recursive: true }), fs.mkdir(fleetDir(), { recursive: true })]);
}

export function normalizeMachine(value: unknown): HarveyMachine {
  const match = HARVEY_MACHINES.find((machine) => machine.toLowerCase() === String(value ?? "").toLowerCase());
  if (!match) throw new HarveyControlError("UNKNOWN_MACHINE");
  return match;
}

function machineFile(machine: HarveyMachine) {
  return path.join(machineDir(), `${machine.toLowerCase()}.json`);
}

function commandFile(commandId: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(commandId)) throw new Error("INVALID_COMMAND_ID");
  return path.join(commandDir(), `${commandId}.json`);
}

function fleetFile(fleetId: string) {
  if (!/^harvey_fleet_[a-zA-Z0-9_-]+$/.test(fleetId)) throw new HarveyControlError("INVALID_FLEET_ID");
  return path.join(fleetDir(), `${fleetId}.json`);
}

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function queueFileOperation<T>(file: string, operation: () => Promise<T>) {
  const previous = writeQueues.get(file) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  writeQueues.set(file, current);
  try { return await current; }
  finally {
    if (writeQueues.get(file) === current) writeQueues.delete(file);
  }
}

async function writeJsonAtomicUnlocked(file: string, value: unknown) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    for (let attempt = 0; ; attempt += 1) {
      try {
        await fs.rename(temporary, file);
        break;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (attempt >= 5 || !["EPERM", "EACCES", "EBUSY"].includes(code ?? "")) throw error;
        await wait(15 * (attempt + 1));
      }
    }
  } finally {
    await fs.unlink(temporary).catch(() => undefined);
  }
}

async function writeJsonAtomic(file: string, value: unknown) {
  return queueFileOperation(file, () => writeJsonAtomicUnlocked(file, value));
}

type HarveyLockRecord = { owner_id?: string; pid?: number; created_at?: string };

function lockOwnerIsAlive(pid: unknown) {
  if (!Number.isInteger(pid) || Number(pid) <= 0) return false;
  try {
    process.kill(Number(pid), 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code !== "ESRCH";
  }
}

async function releaseOwnedLock(lockPath: string, ownerId: string) {
  try {
    const current = JSON.parse(await fs.readFile(lockPath, "utf8")) as HarveyLockRecord;
    if (current.owner_id === ownerId) await fs.unlink(lockPath).catch(() => undefined);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

async function withExclusiveFileLock<T>(target: string, operation: () => Promise<T>) {
  const lockPath = `${target}.lock`;
  const ownerId = randomUUID().replaceAll("-", "");
  await fs.mkdir(path.dirname(lockPath), { recursive: true });
  for (let attempt = 0; attempt < COMMAND_LOCK_ATTEMPTS; attempt += 1) {
    let handle;
    try {
      handle = await fs.open(lockPath, "wx");
      await handle.writeFile(`${JSON.stringify({ owner_id: ownerId, pid: process.pid, created_at: new Date().toISOString() })}\n`, "utf8");
      await handle.close();
      handle = undefined;
      try { return await operation(); }
      finally { await releaseOwnedLock(lockPath, ownerId); }
    } catch (error) {
      await handle?.close().catch(() => undefined);
      const lockCode = (error as NodeJS.ErrnoException).code;
      if (!["EEXIST", "EPERM", "EACCES"].includes(lockCode ?? "")) throw error;
      try {
        const observedText = await fs.readFile(lockPath, "utf8");
        let observed: HarveyLockRecord = {};
        try { observed = JSON.parse(observedText) as HarveyLockRecord; } catch {}
        const lockAge = Date.now() - (await fs.stat(lockPath)).mtimeMs;
        if (lockAge > COMMAND_LOCK_STALE_MS && !lockOwnerIsAlive(observed.pid)) {
          const currentText = await fs.readFile(lockPath, "utf8");
          if (currentText === observedText) await fs.unlink(lockPath).catch(() => undefined);
        }
      } catch (statError) {
        const statCode = (statError as NodeJS.ErrnoException).code;
        if (!["ENOENT", "EPERM", "EACCES"].includes(statCode ?? "")) throw statError;
      }
      await wait(8 + (attempt % 7));
    }
  }
  throw new HarveyControlError("COMMAND_LOCK_TIMEOUT", 503);
}

export async function writeHeartbeat(input: Record<string, unknown>, actor: HarveyWriteActor) {
  await ensureRoots();
  if (actor.role !== "machine") throw new HarveyControlError("MACHINE_AUTH_REQUIRED", 403);
  const machine = normalizeMachine(input.machine);
  if (machine !== actor.machine) throw new HarveyControlError("MACHINE_CREDENTIAL_SCOPE_MISMATCH", 403);
  const requestedHostname = String(input.hostname ?? "").trim();
  if (!requestedHostname || requestedHostname.toUpperCase() !== actor.hostname) {
    throw new HarveyControlError("MACHINE_BINDING_MISMATCH", 403);
  }
  const heartbeat: MachineHeartbeat = {
    machine,
    hostname: actor.hostname,
    agent_id: actor.agent_id,
    agent_version: String(input.agent_version ?? "0.1.0").trim(),
    capabilities: Array.isArray(input.capabilities) ? input.capabilities.map(String) : [],
    observed_at: new Date().toISOString()
  };
  if (!heartbeat.agent_id) throw new HarveyControlError("HEARTBEAT_IDENTITY_REQUIRED");
  await writeJsonAtomic(machineFile(machine), heartbeat);
  return heartbeat;
}

export async function listHeartbeats() {
  await ensureRoots();
  return Promise.all(HARVEY_MACHINES.map(async (machine) => {
    try {
      const heartbeat = JSON.parse(await fs.readFile(machineFile(machine), "utf8")) as MachineHeartbeat;
      const age_ms = Date.now() - Date.parse(heartbeat.observed_at);
      return { ...heartbeat, age_ms, live: age_ms <= 90_000 };
    } catch {
      return { machine, live: false, age_ms: null };
    }
  }));
}

function validatePreviewUrl(value: unknown) {
  const url = new URL(String(value ?? ""));
  const allowedHost = ["10.1.10.8:3000", "127.0.0.1:3000", "localhost:3000"].includes(url.host);
  if (url.protocol !== "http:" || !allowedHost || url.pathname !== "/harvey") throw new Error("URL_NOT_ALLOWLISTED");
  return url.toString();
}

function commandLeaseMs() {
  const configured = Number(process.env.HARVEY_COMMAND_LEASE_MS ?? "90000");
  return Number.isFinite(configured) && configured >= 250 && configured <= 300_000 ? configured : 90_000;
}

function validateAction(input: Record<string, unknown>) {
  const action = String(input.action ?? "") as HarveyCommand["action"];
  if (!["OPEN_URL", "PING", "KNOCK"].includes(action)) throw new Error("ACTION_NOT_ALLOWLISTED");
  return action;
}

function validateWorkstreamId(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const workstreamId = String(value);
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(workstreamId)) throw new HarveyControlError("WORKSTREAM_ID_INVALID");
  return workstreamId;
}

async function readCommandFiles() {
  const entries = await fs.readdir(commandDir(), { withFileTypes: true });
  return Promise.all(entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map(async (entry) => {
    try { return JSON.parse(await fs.readFile(path.join(commandDir(), entry.name), "utf8")) as HarveyCommand; }
    catch { return null; }
  }));
}

async function enforceCommandRetention(machine: HarveyMachine, requireActiveCapacity: boolean) {
  const commands = (await readCommandFiles()).filter((command): command is HarveyCommand => Boolean(command) && command?.machine === machine);
  const active = commands.filter((command) => command.status === "QUEUED" || command.status === "RECEIVED");
  if (requireActiveCapacity && active.length >= MAX_ACTIVE_COMMANDS_PER_MACHINE) {
    throw new HarveyControlError("ACTIVE_COMMAND_CAPACITY_EXCEEDED", 429);
  }
  const terminal = commands
    .filter((command) => command.status === "COMPLETED" || command.status === "BLOCKER")
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at) || right.command_id.localeCompare(left.command_id));
  const cutoff = Date.now() - TERMINAL_RETENTION_MS;
  const expired = terminal.filter((command, index) => index >= MAX_TERMINAL_COMMANDS_PER_MACHINE || Date.parse(command.updated_at) < cutoff);
  await Promise.all(expired.map((command) => fs.unlink(commandFile(command.command_id)).catch(() => undefined)));
}

function buildCommand(input: Record<string, unknown>, machine: HarveyMachine, fleetId?: string): HarveyCommand {
  const action = validateAction(input);
  const workstreamId = validateWorkstreamId(input.workstream_id);
  const now = new Date().toISOString();
  return {
    command_id: `harvey_${machine.toLowerCase()}_${Date.now()}_${randomUUID().slice(0, 8)}`,
    ...(fleetId ? { fleet_id: fleetId } : {}),
    ...(workstreamId ? { workstream_id: workstreamId } : {}),
    machine,
    action,
    payload: action === "OPEN_URL" ? { url: validatePreviewUrl((input.payload as Record<string, unknown> | undefined)?.url) } : {},
    status: "QUEUED",
    created_at: now,
    updated_at: now,
    receipts: []
  };
}

async function persistNewCommand(command: HarveyCommand) {
  const capacityLock = path.join(commandDir(), `.capacity-${command.machine.toLowerCase()}`);
  await withExclusiveFileLock(capacityLock, async () => {
    await enforceCommandRetention(command.machine, true);
    await writeJsonAtomic(commandFile(command.command_id), command);
  });
}

async function withMachineCapacityLocks<T>(machines: HarveyMachine[], operation: () => Promise<T>, index = 0): Promise<T> {
  const ordered = [...machines].sort();
  if (index >= ordered.length) return operation();
  const capacityLock = path.join(commandDir(), `.capacity-${ordered[index].toLowerCase()}`);
  return withExclusiveFileLock(capacityLock, () => withMachineCapacityLocks(ordered, operation, index + 1));
}

export async function createCommand(input: Record<string, unknown>, actor: HarveyWriteActor) {
  await ensureRoots();
  if (actor.role !== "operator") throw new HarveyControlError("OPERATOR_AUTH_REQUIRED", 403);
  const machine = normalizeMachine(input.machine);
  const command = buildCommand(input, machine);
  await persistNewCommand(command);
  return command;
}

export type HarveyFleetSummary = {
  fleet_id: string;
  status: HarveyCommandStatus;
  terminal: boolean;
  addressed_count: number;
  terminal_count: number;
  completed_count: number;
  blocker_count: number;
  pending_count: number;
  commands: Array<{ command_id: string; machine: HarveyMachine; status: HarveyCommandStatus }>;
};

type HarveyFleetMember = {
  command_id: string;
  machine: HarveyMachine;
  status: HarveyCommandStatus;
  updated_at: string;
  receipt?: HarveyCommand["receipt"];
};

type HarveyFleetLedger = {
  schema: "werkles.harvey-fleet-ledger/v1";
  fleet_id: string;
  action: HarveyCommand["action"];
  created_at: string;
  updated_at: string;
  members: HarveyFleetMember[];
};

function fleetLedgerIsTerminal(ledger: HarveyFleetLedger) {
  return Array.isArray(ledger.members)
    && ledger.members.length > 0
    && ledger.members.every((member) => member.status === "COMPLETED" || member.status === "BLOCKER");
}

function summarizeFleetMembers(members: HarveyFleetMember[], fleetId: string): HarveyFleetSummary {
  if (!members.length) throw new HarveyControlError("FLEET_NOT_FOUND", 404);
  const terminalCount = members.filter((command) => command.status === "COMPLETED" || command.status === "BLOCKER").length;
  const completedCount = members.filter((command) => command.status === "COMPLETED").length;
  const blockerCount = members.filter((command) => command.status === "BLOCKER").length;
  const terminal = terminalCount === members.length;
  const status: HarveyCommandStatus = terminal
    ? (members.some((command) => command.status === "BLOCKER") ? "BLOCKER" : "COMPLETED")
    : (members.every((command) => command.status === "QUEUED") ? "QUEUED" : "RECEIVED");
  return {
    fleet_id: fleetId,
    status,
    terminal,
    addressed_count: members.length,
    terminal_count: terminalCount,
    completed_count: completedCount,
    blocker_count: blockerCount,
    pending_count: members.length - terminalCount,
    commands: members.map((command) => ({ command_id: command.command_id, machine: command.machine, status: command.status }))
  };
}

export function summarizeFleet(commands: HarveyCommand[], fleetId: string): HarveyFleetSummary {
  return summarizeFleetMembers(commands.filter((command) => command.fleet_id === fleetId), fleetId);
}

async function updateFleetLedger(command: HarveyCommand) {
  if (!command.fleet_id) return;
  const file = fleetFile(command.fleet_id);
  await queueFileOperation(file, () => withExclusiveFileLock(file, async () => {
    let ledger: HarveyFleetLedger;
    try { ledger = JSON.parse(await fs.readFile(file, "utf8")) as HarveyFleetLedger; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new HarveyControlError("FLEET_LEDGER_NOT_FOUND", 500);
      throw error;
    }
    const member = ledger.members.find((candidate) => candidate.command_id === command.command_id && candidate.machine === command.machine);
    if (!member) throw new HarveyControlError("FLEET_MEMBER_BINDING_MISMATCH", 500);
    member.status = command.status;
    member.updated_at = command.updated_at;
    member.receipt = command.receipt;
    ledger.updated_at = command.updated_at;
    await writeJsonAtomicUnlocked(file, ledger);
  }));
}

async function enforceFleetLedgerRetention() {
  const retentionLock = path.join(fleetDir(), ".retention");
  await withExclusiveFileLock(retentionLock, async () => {
    const names = (await fs.readdir(fleetDir()))
      .filter((name) => /^harvey_fleet_[a-zA-Z0-9_-]+\.json$/.test(name))
      .sort();
    const terminal: Array<{ file: string; ledger: HarveyFleetLedger; timestamp: number }> = [];
    for (const name of names) {
      const file = path.join(fleetDir(), name);
      try {
        const ledger = JSON.parse(await fs.readFile(file, "utf8")) as HarveyFleetLedger;
        const timestamp = Date.parse(ledger.updated_at);
        if (ledger.schema === "werkles.harvey-fleet-ledger/v1" && fleetLedgerIsTerminal(ledger) && Number.isFinite(timestamp)) {
          terminal.push({ file, ledger, timestamp });
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") continue;
      }
    }
    terminal.sort((left, right) => right.timestamp - left.timestamp || right.ledger.fleet_id.localeCompare(left.ledger.fleet_id));
    const cutoff = Date.now() - FLEET_TERMINAL_RETENTION_MS;
    const obsolete = terminal.filter((entry, index) => entry.timestamp < cutoff || index >= MAX_TERMINAL_FLEET_LEDGERS);
    for (const entry of obsolete) {
      await withExclusiveFileLock(entry.file, async () => {
        try {
          const current = JSON.parse(await fs.readFile(entry.file, "utf8")) as HarveyFleetLedger;
          if (current.fleet_id === entry.ledger.fleet_id && fleetLedgerIsTerminal(current)) await fs.unlink(entry.file);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        }
      });
    }
  });
}

export async function readFleetSummary(fleetIdValue: unknown) {
  await ensureRoots();
  const fleetId = String(fleetIdValue ?? "").trim();
  const file = fleetFile(fleetId);
  return queueFileOperation(file, () => withExclusiveFileLock(file, async () => {
    let ledger: HarveyFleetLedger;
    try { ledger = JSON.parse(await fs.readFile(file, "utf8")) as HarveyFleetLedger; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new HarveyControlError("FLEET_NOT_FOUND", 404);
      throw error;
    }
    let repaired = false;
    for (const member of ledger.members) {
      try {
        const command = JSON.parse(await fs.readFile(commandFile(member.command_id), "utf8")) as HarveyCommand;
        if (command.fleet_id !== fleetId || command.machine !== member.machine) throw new HarveyControlError("FLEET_MEMBER_BINDING_MISMATCH", 500);
        if (command.updated_at > member.updated_at || command.status !== member.status) {
          member.status = command.status;
          member.updated_at = command.updated_at;
          member.receipt = command.receipt;
          repaired = true;
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    if (repaired) {
      ledger.updated_at = new Date().toISOString();
      await writeJsonAtomicUnlocked(file, ledger);
    }
    return summarizeFleetMembers(ledger.members, fleetId);
  }));
}

export async function createFleetCommands(input: Record<string, unknown>, actor: HarveyWriteActor) {
  await ensureRoots();
  if (actor.role !== "operator") throw new HarveyControlError("OPERATOR_AUTH_REQUIRED", 403);
  const requested = Array.isArray(input.machines) ? input.machines : [];
  const machines = [...new Set(requested.map(normalizeMachine))];
  if (!machines.length || machines.length > HARVEY_MACHINES.length) throw new HarveyControlError("FLEET_MACHINE_SET_INVALID");
  const fleetId = `harvey_fleet_${Date.now()}_${randomUUID().slice(0, 8)}`;
  const commands = machines.map((machine) => buildCommand(input, machine, fleetId));
  await withMachineCapacityLocks(machines, async () => {
    for (const machine of machines) await enforceCommandRetention(machine, true);
    const persisted: HarveyCommand[] = [];
    const ledger: HarveyFleetLedger = {
      schema: "werkles.harvey-fleet-ledger/v1",
      fleet_id: fleetId,
      action: commands[0].action,
      created_at: commands[0].created_at,
      updated_at: commands[0].updated_at,
      members: commands.map((command) => ({ command_id: command.command_id, machine: command.machine, status: command.status, updated_at: command.updated_at }))
    };
    try {
      await writeJsonAtomic(fleetFile(fleetId), ledger);
      for (const command of commands) {
        await writeJsonAtomic(commandFile(command.command_id), command);
        persisted.push(command);
      }
    } catch (error) {
      await Promise.all(persisted.map((command) => fs.unlink(commandFile(command.command_id)).catch(() => undefined)));
      await fs.unlink(fleetFile(fleetId)).catch(() => undefined);
      throw error;
    }
  });
  return { commands, fleet: summarizeFleetMembers(commands, fleetId) };
}

export async function listCommands(machineValue?: unknown, fleetValue?: unknown) {
  await ensureRoots();
  const machine = machineValue ? normalizeMachine(machineValue) : null;
  const fleetId = String(fleetValue ?? "").trim();
  const commands = await readCommandFiles();
  return commands
    .filter((command): command is HarveyCommand => Boolean(command) && (!machine || command?.machine === machine) && (!fleetId || command?.fleet_id === fleetId))
    .map((command) => ({
      ...command,
      claim_reclaimable: command.status === "RECEIVED" && Boolean(command.claim) && Date.parse(command.claim!.lease_expires_at) <= Date.now()
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at) || b.command_id.localeCompare(a.command_id));
}

export async function updateCommand(input: Record<string, unknown>, actor: HarveyWriteActor) {
  await ensureRoots();
  if (actor.role !== "machine") throw new HarveyControlError("MACHINE_AUTH_REQUIRED", 403);
  const commandId = String(input.command_id ?? "");
  const status = String(input.status ?? "") as HarveyCommandStatus;
  const evidence = String(input.evidence ?? "").trim();
  if (!evidence) throw new HarveyControlError("RECEIPT_EVIDENCE_REQUIRED");
  if (Buffer.byteLength(evidence, "utf8") > MAX_RECEIPT_EVIDENCE_BYTES) throw new HarveyControlError("RECEIPT_EVIDENCE_TOO_LARGE", 413);
  if (!["RECEIVED", "COMPLETED", "BLOCKER"].includes(status)) throw new HarveyControlError("INVALID_STATUS_TRANSITION", 409);
  const file = commandFile(commandId);
  const updated = await queueFileOperation(file, () => withExclusiveFileLock(file, async () => {
    let command: HarveyCommand;
    try { command = JSON.parse(await fs.readFile(file, "utf8")) as HarveyCommand; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new HarveyControlError("COMMAND_NOT_FOUND", 404);
      throw error;
    }
    command.receipts = Array.isArray(command.receipts) ? command.receipts : [];
    if (command.machine !== actor.machine) throw new HarveyControlError("COMMAND_MACHINE_BINDING_MISMATCH", 403);
    if (command.status === "COMPLETED" || command.status === "BLOCKER") throw new HarveyControlError("COMMAND_ALREADY_TERMINAL", 409);
    const now = new Date();
    let claim = command.claim;

    if (status === "RECEIVED") {
      const reclaim = input.reclaim_expired === true;
      if (command.status === "RECEIVED") {
        const expired = !claim || Date.parse(claim.lease_expires_at) <= now.getTime();
        if (!expired) throw new HarveyControlError("COMMAND_ALREADY_CLAIMED", 409);
        if (!reclaim) throw new HarveyControlError("COMMAND_CLAIM_EXPIRED_RECLAIM_REQUIRED", 409);
      } else if (command.status !== "QUEUED") {
        throw new HarveyControlError("INVALID_STATUS_TRANSITION", 409);
      }
      const claimId = randomUUID().replaceAll("-", "");
      claim = {
        claim_id: claimId,
        machine: actor.machine,
        hostname: actor.hostname,
        agent_id: actor.agent_id,
        claimed_at: now.toISOString(),
        lease_expires_at: new Date(now.getTime() + commandLeaseMs()).toISOString(),
        attempt: (command.claim?.attempt ?? 0) + 1
      };
      command.status = "RECEIVED";
      command.claim = claim;
    } else {
      if (command.status !== "RECEIVED" || !claim) throw new HarveyControlError("INVALID_STATUS_TRANSITION", 409);
      if (Date.parse(claim.lease_expires_at) <= now.getTime()) throw new HarveyControlError("COMMAND_CLAIM_EXPIRED", 409);
      if (String(input.claim_id ?? "") !== claim.claim_id) throw new HarveyControlError("COMMAND_CLAIM_MISMATCH", 409);
      if (claim.machine !== actor.machine || claim.hostname !== actor.hostname || claim.agent_id !== actor.agent_id) {
        throw new HarveyControlError("COMMAND_CLAIM_ACTOR_MISMATCH", 403);
      }
      command.status = status as HarveyTerminalCommandStatus;
    }

    const receiptStatus = status as Exclude<HarveyCommandStatus, "QUEUED">;
    command.updated_at = now.toISOString();
    command.receipt = { hostname: actor.hostname, agent_id: actor.agent_id, evidence };
    command.receipts.push({
      receipt_id: `harvey_receipt_${randomUUID().replaceAll("-", "")}`,
      command_id: command.command_id,
      status: receiptStatus,
      machine: actor.machine,
      hostname: actor.hostname,
      agent_id: actor.agent_id,
      claim_id: claim.claim_id,
      evidence,
      observed_at: now.toISOString()
    });
    await writeJsonAtomicUnlocked(file, command);
    return command;
  }));
  await updateFleetLedger(updated);
  if (updated.fleet_id && (updated.status === "COMPLETED" || updated.status === "BLOCKER")) {
    await enforceFleetLedgerRetention();
  }
  if (updated.status === "COMPLETED" || updated.status === "BLOCKER") {
    const capacityLock = path.join(commandDir(), `.capacity-${updated.machine.toLowerCase()}`);
    await withExclusiveFileLock(capacityLock, () => enforceCommandRetention(updated.machine, false));
  }
  return updated;
}
