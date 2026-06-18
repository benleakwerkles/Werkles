import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { NextResponse } from "next/server";

import {
  AEYE_OPTIONS,
  WONKA_ACTIONS,
  aeyeFor,
  wonkaActionFor,
  type AeyeId,
  type WonkaActionId
} from "@/lib/soledash/wonka-den/action-catalog";

export const dynamic = "force-dynamic";

type Verdict = "RECEIPT" | "STOP";

type Receipt = {
  receipt_id: string;
  command_id: string;
  action_label: string;
  target_aeye: string;
  target_aeye_label: string;
  target_corrected: boolean;
  verdict: Verdict;
  reason: string | null;
  executable_label: string;
  machine: string;
  working_directory: string;
  timestamp: string;
  stdout: string;
  stderr: string;
  exit_code: number | null;
  executed: boolean;
};

type CommandSpec = {
  id: WonkaActionId;
  executable: string;
  args: string[];
  executable_label: string;
};

type ActionRequest = {
  command_id: string;
  target_aeye: string;
};

const REPO_ROOT = process.cwd();
const MACHINE = os.hostname();
const RECEIPTS_DIR = path.join(REPO_ROOT, "foreman", "soledash", "wonka-den", "receipts");
const MAX_OUTPUT_CHARS = 12_000;
const EXEC_TIMEOUT_MS = 10_000;
const MAX_BATCH_SIZE = 20;

const COMMANDS: Record<WonkaActionId, CommandSpec> = {
  PROVE_HOSTNAME: {
    id: "PROVE_HOSTNAME",
    executable: "cmd.exe",
    args: ["/c", "hostname"],
    executable_label: "cmd.exe /c hostname"
  },
  PROVE_WHOAMI: {
    id: "PROVE_WHOAMI",
    executable: "whoami.exe",
    args: [],
    executable_label: "whoami.exe"
  },
  PROVE_NODE_PROCESSES: {
    id: "PROVE_NODE_PROCESSES",
    executable: "tasklist.exe",
    args: ["/FI", "IMAGENAME eq node.exe"],
    executable_label: "tasklist.exe /FI \"IMAGENAME eq node.exe\""
  },
  PROVE_REPO_ROOT: {
    id: "PROVE_REPO_ROOT",
    executable: "cmd.exe",
    args: ["/c", "cd"],
    executable_label: "cmd.exe /c cd"
  },
  PROVE_GIT_STATUS: {
    id: "PROVE_GIT_STATUS",
    executable: "git",
    args: ["status", "--short"],
    executable_label: "git status --short"
  },
  PROVE_GIT_BRANCH: {
    id: "PROVE_GIT_BRANCH",
    executable: "git",
    args: ["branch", "--show-current"],
    executable_label: "git branch --show-current"
  },
  PROVE_GIT_DIFF_STAT: {
    id: "PROVE_GIT_DIFF_STAT",
    executable: "git",
    args: ["diff", "--stat"],
    executable_label: "git diff --stat"
  },
  PROVE_NODE_VERSION: {
    id: "PROVE_NODE_VERSION",
    executable: process.execPath,
    args: ["-v"],
    executable_label: "node -v"
  },
  PROVE_NPM_VERSION: {
    id: "PROVE_NPM_VERSION",
    executable: process.platform === "win32" ? "npm.cmd" : "npm",
    args: ["-v"],
    executable_label: "npm -v"
  },
  PROVE_DIR_FOREMAN: {
    id: "PROVE_DIR_FOREMAN",
    executable: "cmd.exe",
    args: ["/c", "dir", "foreman"],
    executable_label: "cmd.exe /c dir foreman"
  },
  PROVE_DIR_SOLEDASH: {
    id: "PROVE_DIR_SOLEDASH",
    executable: "cmd.exe",
    args: ["/c", "dir", "foreman\\soledash"],
    executable_label: "cmd.exe /c dir foreman\\soledash"
  },
  PROVE_WONKA_RECEIPTS: {
    id: "PROVE_WONKA_RECEIPTS",
    executable: "cmd.exe",
    args: ["/c", "dir", "foreman\\soledash\\wonka-den\\receipts"],
    executable_label: "cmd.exe /c dir foreman\\soledash\\wonka-den\\receipts"
  },
  PROVE_RECEIPT_GRAPH_RECEIPT: {
    id: "PROVE_RECEIPT_GRAPH_RECEIPT",
    executable: "cmd.exe",
    args: ["/c", "dir", "foreman\\soledash\\RECEIPT_GRAPH_ENGINE_RECEIPT.md"],
    executable_label: "cmd.exe /c dir foreman\\soledash\\RECEIPT_GRAPH_ENGINE_RECEIPT.md"
  },
  PROVE_APPROVAL_REGISTRY: {
    id: "PROVE_APPROVAL_REGISTRY",
    executable: "cmd.exe",
    args: ["/c", "dir", "foreman\\soledash\\AUTOMATICA_APPROVALS.json"],
    executable_label: "cmd.exe /c dir foreman\\soledash\\AUTOMATICA_APPROVALS.json"
  },
  PROVE_APPROVAL_SWATTER: {
    id: "PROVE_APPROVAL_SWATTER",
    executable: "cmd.exe",
    args: ["/c", "dir", "scripts\\foreman\\background-approval-swatter-alpha.mjs"],
    executable_label: "cmd.exe /c dir scripts\\foreman\\background-approval-swatter-alpha.mjs"
  },
  PROVE_SHAKESPEARE: {
    id: "PROVE_SHAKESPEARE",
    executable: "cmd.exe",
    args: ["/c", "dir", "scripts\\foreman\\shakespeare-v0.mjs"],
    executable_label: "cmd.exe /c dir scripts\\foreman\\shakespeare-v0.mjs"
  },
  PROVE_HANDOFF_OUTBOX: {
    id: "PROVE_HANDOFF_OUTBOX",
    executable: "cmd.exe",
    args: ["/c", "dir", "foreman\\handoffs\\outbox"],
    executable_label: "cmd.exe /c dir foreman\\handoffs\\outbox"
  },
  PROVE_SCRIPTS_FOREMAN: {
    id: "PROVE_SCRIPTS_FOREMAN",
    executable: "cmd.exe",
    args: ["/c", "dir", "scripts\\foreman"],
    executable_label: "cmd.exe /c dir scripts\\foreman"
  },
  PROVE_PACKAGE_JSON: {
    id: "PROVE_PACKAGE_JSON",
    executable: "cmd.exe",
    args: ["/c", "dir", "package.json"],
    executable_label: "cmd.exe /c dir package.json"
  },
  PROVE_NEXT_CONFIG: {
    id: "PROVE_NEXT_CONFIG",
    executable: "cmd.exe",
    args: ["/c", "dir", "next.config.*"],
    executable_label: "cmd.exe /c dir next.config.*"
  }
};

function truncate(value: string): string {
  return value.length > MAX_OUTPUT_CHARS ? `${value.slice(0, MAX_OUTPUT_CHARS)}\n[truncated]` : value;
}

function commandSpecFor(commandId: string): CommandSpec | null {
  return COMMANDS[commandId as WonkaActionId] ?? null;
}

function executeCommand(spec: CommandSpec): Promise<Pick<Receipt, "stdout" | "stderr" | "exit_code">> {
  return new Promise((resolve) => {
    const child = spawn(spec.executable, spec.args, {
      cwd: REPO_ROOT,
      shell: false,
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      stderr = `${stderr}Command timed out after ${EXEC_TIMEOUT_MS}ms`;
      child.kill();
    }, EXEC_TIMEOUT_MS);

    child.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({
        stdout: truncate(stdout),
        stderr: truncate(`${stderr}${err.message}`),
        exit_code: 1
      });
    });

    child.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      resolve({
        stdout: truncate(stdout),
        stderr: truncate(stderr),
        exit_code: code
      });
    });
  });
}

function coerceString(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 200) : "";
}

function coerceActionRequests(body: unknown): ActionRequest[] {
  const bodyRecord = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const rawActions = Array.isArray(bodyRecord.actions) ? bodyRecord.actions : [bodyRecord];

  return rawActions.slice(0, MAX_BATCH_SIZE).map((raw) => {
    const action = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    return {
      command_id: coerceString(action.command_id),
      target_aeye: coerceString(action.target_aeye)
    };
  });
}

function targetFor(requestedTarget: string, fallbackTarget: AeyeId | null) {
  const requested = aeyeFor(requestedTarget);
  if (requested) {
    return { target: requested, corrected: false };
  }

  const fallback = fallbackTarget ? aeyeFor(fallbackTarget) : null;
  if (fallback) {
    return { target: fallback, corrected: Boolean(requestedTarget) };
  }

  return {
    target: { id: "UNASSIGNED", label: "Unassigned" },
    corrected: Boolean(requestedTarget)
  };
}

async function buildReceipt(actionRequest: ActionRequest): Promise<Receipt> {
  const timestamp = new Date().toISOString();
  const action = wonkaActionFor(actionRequest.command_id);
  const spec = commandSpecFor(actionRequest.command_id);
  const { target, corrected } = targetFor(actionRequest.target_aeye, action?.defaultAeye ?? null);
  const base = {
    receipt_id: `wonka_den_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    command_id: actionRequest.command_id,
    action_label: action?.label ?? "Unknown action",
    target_aeye: target.id,
    target_aeye_label: target.label,
    target_corrected: corrected,
    machine: MACHINE,
    working_directory: REPO_ROOT,
    timestamp
  };

  if (!action || !spec) {
    return {
      ...base,
      verdict: "STOP",
      reason: "UNKNOWN_COMMAND_ID",
      executable_label: "NONE",
      stdout: "",
      stderr: "",
      exit_code: null,
      executed: false
    };
  }

  return {
    ...base,
    verdict: "RECEIPT",
    reason: corrected ? "TARGET_AEYE_CORRECTED_TO_DEFAULT" : null,
    executable_label: spec.executable_label,
    ...(await executeCommand(spec)),
    executed: true
  };
}

async function writeReceipt(receipt: Receipt): Promise<string | null> {
  try {
    await fs.mkdir(RECEIPTS_DIR, { recursive: true });
    const file = path.join(RECEIPTS_DIR, `${receipt.receipt_id}.json`);
    await fs.writeFile(file, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
    return path.relative(REPO_ROOT, file).split(path.sep).join("/");
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let body: unknown = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const actionRequests = coerceActionRequests(body);
  const receipts: Receipt[] = [];
  const receiptPaths: Array<string | null> = [];

  for (const actionRequest of actionRequests) {
    const receipt = await buildReceipt(actionRequest);
    receipts.push(receipt);
    receiptPaths.push(await writeReceipt(receipt));
  }

  return NextResponse.json({
    ok: true,
    receipt: receipts[0] ?? null,
    receipt_path: receiptPaths[0] ?? null,
    receipts,
    receipt_paths: receiptPaths,
    summary: {
      requested: receipts.length,
      executed: receipts.filter((receipt) => receipt.executed).length,
      stopped: receipts.filter((receipt) => receipt.verdict === "STOP").length
    },
    allowlist: WONKA_ACTIONS.map((action) => ({
      command_id: action.id,
      label: action.label,
      category: action.category,
      default_aeye: action.defaultAeye,
      executable_label: action.executableLabel
    })),
    aeyes: AEYE_OPTIONS
  });
}
