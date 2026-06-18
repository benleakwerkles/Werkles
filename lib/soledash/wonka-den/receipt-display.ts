export type WonkaReceiptPhase = "idle" | "sent" | "working" | "receipt" | "blocked";

export type WonkaReceiptSnapshot = {
  receipt_id: string;
  command_id: string;
  action_label: string;
  target_aeye_label: string;
  machine: string;
  executable_label: string;
  verdict: "RECEIPT" | "STOP";
  reason: string | null;
  executed: boolean;
  exit_code: number | null;
  stdout: string;
  stderr: string;
  timestamp: string;
};

export function receiptPhaseFor(
  busy: boolean,
  sent: boolean,
  receipt: WonkaReceiptSnapshot | null
): WonkaReceiptPhase {
  if (busy) return sent ? "working" : "working";
  if (!receipt) return sent ? "sent" : "idle";
  if (receipt.verdict === "STOP" || !receipt.executed) return "blocked";
  return "receipt";
}

export function receiptPhaseLabel(phase: WonkaReceiptPhase): string {
  switch (phase) {
    case "sent":
      return "Sent";
    case "working":
      return "Working";
    case "receipt":
      return "Receipt";
    case "blocked":
      return "Blocked";
    default:
      return "Waiting";
  }
}

export function proofLine(stdout: string, stderr: string): string {
  const out = stdout.trim();
  if (out) return out.split(/\r?\n/)[0]?.trim() || out;
  const err = stderr.trim();
  if (err) return err.split(/\r?\n/)[0]?.trim() || err;
  return "Command finished — open receipt for full output.";
}

export function clickedLine(receipt: WonkaReceiptSnapshot): string {
  return `You clicked: ${receipt.action_label}`;
}

export function machineDidLine(receipt: WonkaReceiptSnapshot): string {
  if (receipt.verdict === "STOP" || !receipt.executed) {
    return `${receipt.machine} blocked this before it ran.`;
  }
  return `${receipt.machine} ran: ${receipt.executable_label}`;
}

export function proofHeadline(receipt: WonkaReceiptSnapshot): string {
  return `Here is proof: ${proofLine(receipt.stdout, receipt.stderr)}`;
}
