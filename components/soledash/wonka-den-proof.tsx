"use client";

import { useState } from "react";

type Receipt = {
  verdict: "SWAT";
  command_id: "PROVE_HOSTNAME";
  executed: true;
  machine_hostname: string;
  timestamp: string;
  stdout: string;
  exit_code: 0;
};

function renderReceipt(receipt: Receipt) {
  return [
    `verdict: ${receipt.verdict}`,
    `command_id: ${receipt.command_id}`,
    `executed: ${receipt.executed}`,
    `machine_hostname: ${receipt.machine_hostname}`,
    `timestamp: ${receipt.timestamp}`,
    `stdout: ${receipt.stdout}`,
    `exit_code: ${receipt.exit_code}`,
  ].join("\n");
}

export function WonkaDenProof() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [pending, setPending] = useState(false);

  async function proveDenIsAlive() {
    setPending(true);
    try {
      const response = await fetch("/api/soledash/v1/wonka-den/prove", {
        method: "POST",
      });
      const body = (await response.json()) as Receipt;
      if (!response.ok) {
        throw new Error("proof_failed");
      }
      setReceipt(body);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="wonka-den-proof">
      <button className="wonka-den-proof__button" type="button" onClick={proveDenIsAlive} disabled={pending}>
        Prove Den Is Alive
      </button>
      <aside className="wonka-den-proof__drawer" aria-live="polite" data-open={receipt ? "true" : "false"}>
        {receipt ? <pre>{renderReceipt(receipt)}</pre> : null}
      </aside>
    </div>
  );
}
