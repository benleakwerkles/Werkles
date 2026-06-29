import { NextResponse } from "next/server";
import { access } from "node:fs/promises";
import { spawn } from "node:child_process";

import { listPacketRelayCards } from "@/lib/tinkerden/packet-relay";
import { createBridgePacketRelayReadyPacket } from "@/lib/tinkerden-return-system-v0/store";

export const dynamic = "force-dynamic";

type PacketRelayBody = {
  card_id?: string;
  operator_selection?: string;
  move?: string;
  recommendation?: string;
  composite_score?: number;
  operator_reason?: string;
  why_now?: string;
  recommended_because?: string;
};

const OPERATOR_SELECTIONS = new Set(["KEEP", "KILL", "STEAL", "MERGE"]);

function run(command: string, args: string[], input?: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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

async function setClipboardText(text: string) {
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
      text
    );
    return { set: true, verified: false, detail: "SET_CLIPBOARD" };
  } catch (error) {
    return {
      set: false,
      verified: false,
      detail: error instanceof Error ? error.message : "CLIPBOARD_SET_FAILED"
    };
  }
}

async function verifyClipboardText(text: string) {
  try {
    const result = await run("powershell.exe", ["-Sta", "-NoProfile", "-NonInteractive", "-Command", "Get-Clipboard -Raw"]);
    const normalize = (value: string) => value.replace(/\r\n/g, "\n").replace(/\n+$/g, "");
    return normalize(result.stdout) === normalize(text);
  } catch {
    return false;
  }
}

async function focusWorkspaceTarget(workspaceTarget: {
  mode?: string;
  target?: string;
  args?: string[];
  window_title?: string;
  configured?: boolean;
  configuration_error?: string;
}) {
  if (!workspaceTarget.configured) {
    return { attempted: false, focused: false, detail: workspaceTarget.configuration_error || "NO_TARGET_CONFIGURED" };
  }

  if (workspaceTarget.mode === "window_title") {
    const title = workspaceTarget.window_title?.trim();
    if (!title) return { attempted: false, focused: false, detail: "NO_WINDOW_TITLE_CONFIGURED" };
    try {
      await run(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-ExecutionPolicy",
          "Bypass",
          "-Command",
          "Add-Type -AssemblyName Microsoft.VisualBasic; $title = [Console]::In.ReadToEnd(); if ([Microsoft.VisualBasic.Interaction]::AppActivate($title.Trim())) { exit 0 }; exit 3"
        ],
        title
      );
      return { attempted: true, focused: true, detail: "WINDOW_FOCUSED" };
    } catch (error) {
      return {
        attempted: true,
        focused: false,
        detail: error instanceof Error ? error.message : "WINDOW_FOCUS_FAILED"
      };
    }
  }

  try {
    const target = workspaceTarget.target?.trim() || "";
    if (!target) return { attempted: false, focused: false, detail: "NO_PROCESS_TARGET_CONFIGURED" };
    await access(target);
    const child = spawn(target, workspaceTarget.args ?? [], {
      detached: true,
      stdio: "ignore",
      windowsHide: false
    });
    child.unref();
    return { attempted: true, focused: true, detail: "TARGET_LAUNCHED" };
  } catch (error) {
    return {
      attempted: true,
      focused: false,
      detail: error instanceof Error ? error.message : "TARGET_LAUNCH_FAILED"
    };
  }
}

export async function GET() {
  try {
    const packets = await listPacketRelayCards();

    return NextResponse.json({
      ok: true,
      count: packets.length,
      packets
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "packet relay packet read failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PacketRelayBody;

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
    const clipboard = await setClipboardText(result.packet_relay_text);
    const verified = await verifyClipboardText(result.packet_relay_text);
    const focus = await focusWorkspaceTarget(result.workspace_target);

    return NextResponse.json({
      ok: true,
      packet_id: result.packet.packet_id,
      relay_id: result.relay_id,
      receipt_id: result.receipt.receipt_id,
      packet: result.packet,
      receipt: result.receipt,
      execution: result.execution,
      packet_path: result.packet_path,
      receipt_path: result.receipt_path,
      execution_path: result.execution_path,
      receipt_pickup_path: result.receipt_pickup_path,
      dispatch_state_path: result.dispatch_state_path,
      event_path: result.event_path,
      relay_event: result.relay_event,
      workspace_target: result.workspace_target,
      workspace_focus: focus,
      clipboard_set: clipboard.set || verified,
      clipboard_verified: verified,
      clipboard_detail: clipboard.detail,
      packet_relay_text: result.packet_relay_text,
      card_status: "RELAY_READY",
      relay_status: "PACKET_RELAY_COMPLETE",
      operator_instruction: focus.focused ? "Relay complete. Target focused. Paste/send now." : "Relay complete. Packet copied. Open target manually, then paste/send.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "RELAY_READY_FAILED" },
      { status: 500 },
    );
  }
}

