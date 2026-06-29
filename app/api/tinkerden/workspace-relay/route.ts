import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import { createBridgePacketRelayReadyPacket } from "@/lib/tinkerden-return-system-v0/store";

export const dynamic = "force-dynamic";

type WorkspaceRelayBody = {
  card_id?: string;
  operator_selection?: string;
  move?: string;
  recommendation?: string;
  composite_score?: number;
  operator_reason?: string;
  why_now?: string;
  recommended_because?: string;
};

type WorkspaceDestination = {
  id?: string;
  aeye?: string;
  machine?: string;
  endpoint?: string;
  verified?: boolean;
};

type RunnerResult = {
  ok: true;
  runner_mode: "http" | "cli";
  runner_request_path?: string;
  packet_id: string;
  receipt_id: string;
  status: string;
  clipboard_set: boolean;
  clipboard_verified: boolean;
  workspace_focused: boolean;
  receipt_path: string;
  runner_receipt_path: string;
  event_path: string;
  pickup_path: string;
  [key: string]: unknown;
};

const ROOT = process.cwd();
const OPERATOR_SELECTIONS = new Set(["KEEP", "KILL", "STEAL", "MERGE"]);
const DESTINATION_DIRECTORY_PATH = path.join(ROOT, "foreman", "messages", "WORKSPACE_DESTINATION_DIRECTORY.json");
const RUNNER_SCRIPT_PATH = path.join(ROOT, "tools", "tinkerden_machine_runner", "src", "index.mjs");
const RUNNER_REQUEST_DIR = path.join(ROOT, "tinkerden", "machine-runner", "requests");

function slash(value: string) {
  return value.split(path.sep).join("/");
}

function repoRel(fullPath: string) {
  return slash(path.relative(ROOT, fullPath));
}

function run(command: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      windowsHide: true,
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
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(`${command} exited ${code}: ${stderr || stdout}`.trim()));
    });
  });
}

async function readVerifiedDestination(aeye: string, machine: string) {
  const raw = await readFile(DESTINATION_DIRECTORY_PATH, "utf8");
  const parsed = JSON.parse(raw) as { destinations?: WorkspaceDestination[] };
  const destination = (parsed.destinations ?? []).find(
    (candidate) =>
      candidate.verified === true &&
      candidate.aeye?.toLowerCase() === aeye.toLowerCase() &&
      candidate.machine?.toLowerCase() === machine.toLowerCase(),
  );

  if (!destination?.endpoint) {
    throw new Error(`VERIFIED_WORKSPACE_DESTINATION_NOT_FOUND:${aeye}@${machine}`);
  }

  return destination;
}

async function postToRunner(endpoint: string, payload: Record<string, unknown>) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1200);

  try {
    const response = await fetch(`${endpoint.replace(/\/+$/g, "")}/packets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const result = (await response.json()) as Record<string, unknown>;
    if (!response.ok || result.ok !== true) throw new Error(String(result.error || "RUNNER_HTTP_FAILED"));
    return { ...result, runner_mode: "http" } as RunnerResult;
  } finally {
    clearTimeout(timer);
  }
}

async function callRunnerCli(payload: Record<string, unknown>) {
  await mkdir(RUNNER_REQUEST_DIR, { recursive: true });
  const packetId = String(payload.packet_id || `workspace_relay_${Date.now()}`);
  const requestPath = path.join(RUNNER_REQUEST_DIR, `${packetId}.json`);
  await writeFile(requestPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  const result = await run(process.execPath, [RUNNER_SCRIPT_PATH, "handle", "--request", requestPath]);
  const parsed = JSON.parse(result.stdout) as Record<string, unknown>;
  if (parsed.ok !== true) throw new Error(String(parsed.error || "RUNNER_CLI_FAILED"));
  return { ...parsed, runner_mode: "cli", runner_request_path: repoRel(requestPath) } as RunnerResult;
}

async function callRunner(endpoint: string, payload: Record<string, unknown>): Promise<RunnerResult> {
  try {
    return await postToRunner(endpoint, payload);
  } catch {
    return callRunnerCli(payload);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WorkspaceRelayBody;

    if (!body.card_id?.trim()) {
      return NextResponse.json({ ok: false, error: "CARD_ID_REQUIRED" }, { status: 400 });
    }

    if (!body.move?.trim()) {
      return NextResponse.json({ ok: false, error: "MOVE_REQUIRED" }, { status: 400 });
    }

    const operatorSelection = body.operator_selection?.trim().toUpperCase();
    if (!operatorSelection || !OPERATOR_SELECTIONS.has(operatorSelection)) {
      return NextResponse.json({ ok: false, error: "KEEP_KILL_STEAL_MERGE_REQUIRED" }, { status: 400 });
    }

    const result = await createBridgePacketRelayReadyPacket({
      card_id: body.card_id.trim(),
      operator_selection: operatorSelection as "KEEP" | "KILL" | "STEAL" | "MERGE",
      move: body.move.trim(),
      recommendation: body.recommendation?.trim() || "unknown",
      composite_score: Number.isFinite(body.composite_score) ? body.composite_score! : null,
      operator_reason: body.operator_reason?.trim() || null,
      why_now: body.why_now?.trim() || "",
      recommended_because: body.recommended_because?.trim() || "",
    });

    const targetAeye = result.packet.assigned_to;
    const targetMachine = result.packet.machine;
    const destination = await readVerifiedDestination(targetAeye, targetMachine);
    const runner = await callRunner(destination.endpoint!, {
      schema: "tinkerden_workspace_relay_request_v0",
      packet_id: result.packet.packet_id,
      relay_id: result.relay_id,
      target_aeye: targetAeye,
      target_machine: targetMachine,
      mission: result.packet.mission,
      packet_path: result.packet_path,
      packet: result.packet,
      workspace_target: result.workspace_target,
      packet_text: result.packet_relay_text,
    });

    return NextResponse.json({
      ok: true,
      packet_id: result.packet.packet_id,
      relay_id: result.relay_id,
      packet_relay_receipt_id: result.receipt.receipt_id,
      receipt_id: runner.receipt_id,
      packet_path: result.packet_path,
      packet_relay_receipt_path: result.receipt_path,
      receipt_path: runner.receipt_path,
      runner_receipt_path: runner.runner_receipt_path,
      runner_request_path: runner.runner_request_path,
      event_path: runner.event_path,
      receipt_pickup_path: runner.pickup_path,
      workspace_target: result.workspace_target,
      destination,
      runner,
      clipboard_set: runner.clipboard_set,
      clipboard_verified: runner.clipboard_verified,
      workspace_focused: runner.workspace_focused,
      card_status: "WORKSPACE_RELAY_READY",
      relay_status: runner.status || "READY_FOR_AEYE",
      operator_instruction:
        runner.workspace_focused === true
          ? "Workspace Relay complete. Clipboard set and Betsy workspace focused."
          : "Workspace Relay produced a receipt, but workspace focus needs review.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "WORKSPACE_RELAY_FAILED" },
      { status: 500 },
    );
  }
}
