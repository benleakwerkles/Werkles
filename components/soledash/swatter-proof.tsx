"use client";

import { useState } from "react";

type CommandId = "PROBE_SWATTER" | "SWAT_CMD_ERROR_DIALOG" | "SWAT_UNRESPONSIVE_RUSTDESK_VIEWERS";

type Receipt = {
  verdict: "SWAT" | "WATCH" | "STOP";
  command_id: CommandId | "UNKNOWN";
  executed: boolean;
  machine: "SALLY";
  timestamp: string;
  stdout: string;
  stderr: string;
  exit_code: number;
  destructive: boolean;
  safeguards: string[];
  error?: string;
};

const COMMANDS: { command_id: CommandId; label: string; tone: "neutral" | "warn" | "danger" }[] = [
  { command_id: "PROBE_SWATTER", label: "Probe Swatter", tone: "neutral" },
  { command_id: "SWAT_CMD_ERROR_DIALOG", label: "Close cmd.exe Error", tone: "warn" },
  { command_id: "SWAT_UNRESPONSIVE_RUSTDESK_VIEWERS", label: "Swat Frozen RustDesk", tone: "danger" },
];

function renderReceipt(receipt: Receipt) {
  return [
    `verdict: ${receipt.verdict}`,
    `command_id: ${receipt.command_id}`,
    `executed: ${receipt.executed}`,
    `machine: ${receipt.machine}`,
    `timestamp: ${receipt.timestamp}`,
    `destructive: ${receipt.destructive}`,
    `safeguards: ${receipt.safeguards.join("; ")}`,
    `stdout: ${receipt.stdout || "(empty)"}`,
    `stderr: ${receipt.stderr || "(empty)"}`,
    `exit_code: ${receipt.exit_code}`,
    receipt.error ? `error: ${receipt.error}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function SwatterProof() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [pendingCommand, setPendingCommand] = useState<CommandId | null>(null);

  async function runCommand(commandId: CommandId) {
    setPendingCommand(commandId);
    try {
      const response = await fetch("/api/soledash/v1/swatter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command_id: commandId }),
      });
      const body = (await response.json()) as Receipt;
      setReceipt(body);
    } finally {
      setPendingCommand(null);
    }
  }

  return (
    <div className="swatter-proof">
      <div className="swatter-proof__toolbar" aria-label="Swatter commands">
        {COMMANDS.map((command) => (
          <button
            className="swatter-proof__button"
            data-tone={command.tone}
            disabled={Boolean(pendingCommand)}
            key={command.command_id}
            onClick={() => runCommand(command.command_id)}
            type="button"
          >
            {pendingCommand === command.command_id ? "Running..." : command.label}
          </button>
        ))}
      </div>
      <aside className="swatter-proof__drawer" aria-live="polite" data-open={receipt ? "true" : "false"}>
        {receipt ? <pre>{renderReceipt(receipt)}</pre> : null}
      </aside>
    </div>
  );
}
