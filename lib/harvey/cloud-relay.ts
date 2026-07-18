import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";

import type { HarveyOperatorActor } from "./machine-control";
import { HarveyControlError } from "./machine-control";
import {
  normalizeWorkOrderInstruction,
  normalizeWorkOrderSubmissionId,
  normalizeWorkOrderTarget,
  normalizeWorkOrderVerb
} from "./work-orders";
import { getSupabaseService } from "@/lib/supabase/server";

type MonitorAeye = {
  id: string;
  name: string;
  seat: string;
  intended_machine: string;
  current_work?: string;
};

type MonitorWall = { aeyes: MonitorAeye[] };
type DirectBinding = {
  binding_id: string;
  label: string;
  seat?: string;
  machine: string;
  provider: string;
  thread_id: string;
  state: string;
};
type DirectBindings = { bindings: DirectBinding[] };

type RelayRecipient = {
  recipient_id: string;
  label: string;
  seat: string;
  machine: string;
  provider: string;
  route_kind: "HARVEY_INBOX";
  route_state: "BOUND_PROVEN";
  accepts_broadcast: true;
  metadata: Record<string, unknown>;
  updated_at: string;
};

type EnqueueResult = {
  command_id: string;
  command_status: string;
  recipient_count: number;
  queued_count: number;
  awaiting_receiver_count: number;
};

const MONITOR_WALL_PATH = path.join(process.cwd(), "foreman", "harvey", "HARVEY_AEYE_MONITOR_WALL_20260713.json");
const DIRECT_BINDINGS_PATH = path.join(process.cwd(), "foreman", "relay", "HARVEY_DIRECT_TASK_BINDINGS_20260717.json");
const MACHINE_NAMES = new Set(["Doss", "Betsy", "Spanzee", "Medullina", "Sally"]);

function relayError(code: string, status = 500) {
  return new HarveyControlError(code, status);
}

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await fs.readFile(file, "utf8")) as T;
}

function providerFromSeat(seat: string) {
  const lower = seat.toLowerCase();
  if (lower.includes("chatgpt work")) return "ChatGPT Work";
  if (lower.includes("codex")) return "Codex";
  if (lower.includes("cursor") || lower.includes("maker")) return "Cursor/Maker";
  return "Harvey Flock";
}

async function relayRecipients() {
  const [wall, direct] = await Promise.all([
    readJson<MonitorWall>(MONITOR_WALL_PATH),
    readJson<DirectBindings>(DIRECT_BINDINGS_PATH).catch(() => ({ bindings: [] }))
  ]);
  const now = new Date().toISOString();
  const recipients = new Map<string, RelayRecipient>();
  for (const aeye of wall.aeyes) {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(aeye.id) || !MACHINE_NAMES.has(aeye.intended_machine)) continue;
    recipients.set(aeye.id, {
      recipient_id: aeye.id,
      label: aeye.name,
      seat: aeye.seat,
      machine: aeye.intended_machine,
      provider: providerFromSeat(aeye.seat),
      route_kind: "HARVEY_INBOX",
      route_state: "BOUND_PROVEN",
      accepts_broadcast: true,
      metadata: {
        inbox_truth: "DURABLE_HARVEY_INBOX_ONLY",
        receiver_truth: "CLAIM_REQUIRED_BEFORE_RECEIVED",
        current_work: aeye.current_work ?? null
      },
      updated_at: now
    });
  }
  for (const binding of direct.bindings.filter((item) => item.state === "BOUND_PROVEN")) {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(binding.binding_id) || !MACHINE_NAMES.has(binding.machine)) continue;
    recipients.set(binding.binding_id, {
      recipient_id: binding.binding_id,
      label: binding.label,
      seat: binding.seat ?? `${binding.label}@${binding.machine}`,
      machine: binding.machine,
      provider: binding.provider,
      route_kind: "HARVEY_INBOX",
      route_state: "BOUND_PROVEN",
      accepts_broadcast: true,
      metadata: {
        inbox_truth: "DURABLE_HARVEY_INBOX_ONLY",
        receiver_truth: "EXACT_TASK_BINDING_EXISTS_ON_DOSS_BUT_REQUIRES_A_CLOUD_COURIER",
        thread_id: binding.thread_id
      },
      updated_at: now
    });
  }
  if (!recipients.size) throw relayError("HARVEY_RELAY_RECIPIENT_REGISTRY_EMPTY", 503);
  return [...recipients.values()];
}

async function synchronizeRecipients() {
  const recipients = await relayRecipients();
  const service = getSupabaseService();
  const { error } = await service.from("harvey_relay_recipients").upsert(recipients, { onConflict: "recipient_id" });
  if (error) throw relayError(`HARVEY_RELAY_RECIPIENT_SYNC_FAILED:${error.code ?? "UNKNOWN"}`, 503);
  return recipients;
}

function selectRecipients(target: string, recipients: RelayRecipient[]) {
  const lower = target.toLowerCase();
  if (lower === "all aeyes" || lower === "harvey crew") return recipients.filter((recipient) => recipient.accepts_broadcast);
  if ([...MACHINE_NAMES].some((machine) => machine.toLowerCase() === lower)) {
    return recipients.filter((recipient) => recipient.machine.toLowerCase() === lower);
  }
  const exact = recipients.filter((recipient) => recipient.recipient_id === lower);
  if (exact.length) return exact;
  throw relayError("HARVEY_RELAY_TARGET_UNBOUND", 409);
}

export async function enqueueHarveyCloudCommand(input: Record<string, unknown>, actor: HarveyOperatorActor) {
  if (actor.role !== "operator") throw relayError("OPERATOR_AUTH_REQUIRED", 403);
  const submissionId = normalizeWorkOrderSubmissionId(input.submission_id);
  const verb = normalizeWorkOrderVerb(input.verb);
  const target = normalizeWorkOrderTarget(input.target);
  const instruction = normalizeWorkOrderInstruction(input.instruction);
  const recipients = await synchronizeRecipients();
  const selected = selectRecipients(target, recipients);
  const service = getSupabaseService();
  const { data, error } = await service.rpc("harvey_enqueue_command", {
    p_submission_id: submissionId,
    p_verb: verb,
    p_target: target,
    p_instruction: instruction,
    p_created_by: actor.operator_id,
    p_recipient_ids: selected.map((recipient) => recipient.recipient_id)
  });
  if (error) {
    const databaseMessage = String(error.message ?? "");
    if (databaseMessage.includes("HARVEY_SUBMISSION_CONFLICT")) throw relayError("HARVEY_SUBMISSION_CONFLICT", 409);
    if (databaseMessage.includes("HARVEY_COMMAND_RATE_LIMIT")) throw relayError("HARVEY_COMMAND_RATE_LIMIT", 429);
    throw relayError(`HARVEY_RELAY_ENQUEUE_FAILED:${error.code ?? "UNKNOWN"}`, error.code === "23505" ? 409 : 503);
  }
  const result = (Array.isArray(data) ? data[0] : data) as EnqueueResult | null;
  if (!result?.command_id) throw relayError("HARVEY_RELAY_ENQUEUE_RESULT_INVALID", 502);
  return {
    schema: "werkles.harvey-cloud-command/v1" as const,
    work_order_id: `harvey_cloud_${result.command_id}`,
    command_id: result.command_id,
    submission_id: submissionId,
    verb,
    target,
    instruction,
    status: result.command_status,
    recipient_count: result.recipient_count,
    queued_count: result.queued_count,
    awaiting_receiver_count: result.awaiting_receiver_count,
    claimed_count: 0,
    working_count: 0,
    terminal_count: 0,
    truth: "QUEUED means delivered to the named Harvey inbox. It does not mean the Aeye read, claimed, or completed it.",
    created_by: actor.operator_id
  };
}

export async function readHarveyCloudCommand(commandId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(commandId)) {
    throw relayError("HARVEY_RELAY_COMMAND_ID_INVALID", 400);
  }
  const service = getSupabaseService();
  const [{ data: command, error: commandError }, { data: deliveries, error: deliveryError }] = await Promise.all([
    service.from("harvey_relay_commands").select("command_id,submission_id,verb,target,status,created_at,updated_at").eq("command_id", commandId).maybeSingle(),
    service.from("harvey_relay_deliveries").select("delivery_id,recipient_id,state,receiver_id,claimed_at,completed_at,error_code,updated_at").eq("command_id", commandId).order("created_at", { ascending: true })
  ]);
  if (commandError || deliveryError) throw relayError(`HARVEY_RELAY_STATUS_READ_FAILED:${commandError?.code ?? deliveryError?.code ?? "UNKNOWN"}`, 503);
  if (!command) throw relayError("HARVEY_RELAY_COMMAND_NOT_FOUND", 404);
  const rows = deliveries ?? [];
  const count = (states: string[]) => rows.filter((delivery) => states.includes(delivery.state)).length;
  return {
    schema: "werkles.harvey-cloud-command-status/v1" as const,
    command,
    deliveries: rows,
    counts: {
      total: rows.length,
      queued: count(["QUEUED"]),
      claimed: count(["CLAIMED"]),
      working: count(["WORKING", "REPLIED"]),
      completed: count(["COMPLETED"]),
      blocked: count(["BLOCKED"]),
      awaiting_receiver: count(["AWAITING_RECEIVER"])
    },
    truth: "QUEUED is inbox delivery; CLAIMED is receiver pickup; COMPLETED/BLOCKED require receiver receipts."
  };
}
