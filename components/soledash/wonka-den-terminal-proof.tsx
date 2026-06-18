"use client";

import { useState } from "react";

import { PermissionSwatterScoreboard } from "@/components/soledash/permission-swatter-scoreboard";
import { wonkaActionFor, type WonkaActionId } from "@/lib/soledash/wonka-den/action-catalog";
import {
  clickedLine,
  machineDidLine,
  proofHeadline,
  type WonkaReceiptSnapshot
} from "@/lib/soledash/wonka-den/receipt-display";
import { WONKA_PROOF_BUTTONS } from "@/lib/soledash/wonka-den/proof-buttons";
import type { ShakespeareV0Payload } from "@/lib/soledash/shakespeare/types";

type WonkaDenResponse = {
  ok: boolean;
  receipt_path: string | null;
  receipt_paths: Array<string | null>;
  receipts: WonkaReceiptSnapshot[];
};

type ProofCardPhase = "idle" | "working" | "receipt" | "blocked" | "error";

type ProofCardState = {
  phase: ProofCardPhase;
  receipt: WonkaReceiptSnapshot | null;
  receiptPath: string | null;
  error: string | null;
};

const IDLE_CARD: ProofCardState = {
  phase: "idle",
  receipt: null,
  receiptPath: null,
  error: null
};

const SHAKESPEARE_BLOCKED = "Blocked by Shakespeare. Not executed.";

function initialCardStates(): Record<WonkaActionId, ProofCardState> {
  return Object.fromEntries(WONKA_PROOF_BUTTONS.map((button) => [button.id, { ...IDLE_CARD }])) as Record<
    WonkaActionId,
    ProofCardState
  >;
}

function shakespeareAllows(verdict: ShakespeareV0Payload["verdict"] | undefined): boolean {
  return verdict === "SWAT" || verdict === "RECEIPT";
}

function ProofResult({ state }: { state: ProofCardState }) {
  if (state.phase === "idle") return null;

  if (state.phase === "working") {
    return (
      <div className="sd-wonka__proof-result sd-wonka__proof-result--working" role="status">
        <p className="sd-wonka__proof-result-lead">Machine is moving…</p>
        <p className="sd-wonka__proof-result-body">Betsy is running your safe proof. It lands right here.</p>
      </div>
    );
  }

  if (state.phase === "blocked") {
    return (
      <div className="sd-wonka__proof-result sd-wonka__proof-result--blocked" role="status">
        <p className="sd-wonka__proof-result-lead">{SHAKESPEARE_BLOCKED}</p>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div className="sd-wonka__proof-result sd-wonka__proof-result--blocked" role="alert">
        <p className="sd-wonka__proof-result-lead">The Den could not run that.</p>
        {state.error ? <p className="sd-wonka__proof-result-body">{state.error}</p> : null}
      </div>
    );
  }

  const receipt = state.receipt;
  if (!receipt) return null;

  const blockedByDen = receipt.verdict === "STOP" || !receipt.executed;

  return (
    <div
      className={`sd-wonka__proof-result ${blockedByDen ? "sd-wonka__proof-result--blocked" : "sd-wonka__proof-result--receipt"}`}
      role="status"
    >
      <p className="sd-wonka__proof-result-lead">{clickedLine(receipt)}</p>
      <p className="sd-wonka__proof-result-body">{machineDidLine(receipt)}</p>
      {blockedByDen ? (
        <p className="sd-wonka__proof-result-proof">{SHAKESPEARE_BLOCKED}</p>
      ) : (
        <p className="sd-wonka__proof-result-proof">{proofHeadline(receipt)}</p>
      )}
      <dl className="sd-wonka__proof-facts">
        <div>
          <dt>Aeye</dt>
          <dd>{receipt.target_aeye_label}</dd>
        </div>
        <div>
          <dt>Exit</dt>
          <dd>{receipt.exit_code ?? "—"}</dd>
        </div>
      </dl>
      {state.receiptPath ? (
        <p className="sd-wonka__proof-receipt-path">
          Receipt filed: <code>{state.receiptPath}</code>
        </p>
      ) : null}
    </div>
  );
}

export function WonkaDenTerminalProof({
  hideScoreboard = false,
  compact = false
}: {
  hideScoreboard?: boolean;
  compact?: boolean;
}) {
  const [cardStates, setCardStates] = useState(initialCardStates);
  const [activeId, setActiveId] = useState<WonkaActionId | null>(null);

  function patchCard(actionId: WonkaActionId, patch: Partial<ProofCardState>) {
    setCardStates((prev) => ({
      ...prev,
      [actionId]: { ...prev[actionId], ...patch }
    }));
  }

  async function runProof(actionId: WonkaActionId) {
    const button = WONKA_PROOF_BUTTONS.find((entry) => entry.id === actionId);
    const action = wonkaActionFor(actionId);
    if (!button || !action) return;

    setActiveId(actionId);
    patchCard(actionId, { phase: "working", receipt: null, receiptPath: null, error: null });

    try {
      const shRes = await fetch("/api/soledash/v1/shakespeare/verdict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: button.shakespeareIntent })
      });
      const shData = (await shRes.json()) as {
        ok?: boolean;
        payload?: ShakespeareV0Payload;
        error?: string;
      };

      if (!shRes.ok || !shData.payload) {
        patchCard(actionId, {
          phase: "error",
          receipt: null,
          receiptPath: null,
          error: shData.error ?? "Shakespeare verdict failed"
        });
        return;
      }

      if (!shakespeareAllows(shData.payload.verdict)) {
        patchCard(actionId, { phase: "blocked", receipt: null, receiptPath: null, error: null });
        return;
      }

      const res = await fetch("/api/soledash/v1/wonka-den/run-safe-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actions: [{ command_id: actionId, target_aeye: action.defaultAeye }]
        })
      });
      const data = (await res.json()) as WonkaDenResponse | { error?: string };

      if (!res.ok || !("receipts" in data) || !data.receipts[0]) {
        patchCard(actionId, {
          phase: "error",
          receipt: null,
          receiptPath: null,
          error: "error" in data && data.error ? data.error : "Wonka Den safe command failed"
        });
        return;
      }

      const receipt = data.receipts[0];
      const blockedByDen = receipt.verdict === "STOP" || !receipt.executed;

      patchCard(actionId, {
        phase: blockedByDen ? "blocked" : "receipt",
        receipt,
        receiptPath: data.receipt_paths[0] ?? data.receipt_path ?? null,
        error: null
      });
    } catch (err) {
      patchCard(actionId, {
        phase: "error",
        receipt: null,
        receiptPath: null,
        error: err instanceof Error ? err.message : "Wonka Den safe command failed"
      });
    } finally {
      setActiveId(null);
    }
  }

  return (
    <section
      className={`sd-wonka sd-wonka--cozy ${compact ? "sd-wonka--compact" : ""}`}
      aria-label="Wonka Den proofs"
    >
      {hideScoreboard ? null : <PermissionSwatterScoreboard />}

      {compact ? null : (
        <header className="sd-wonka__masthead">
          <div className="sd-wonka__masthead-copy">
            <h2 className="sd-wonka__room-title">Wonka Den</h2>
            <p className="sd-wonka__room-sub">A cozy little room where the machine starts moving.</p>
          </div>
          <div className="sd-wonka__workshop-bits" aria-hidden="true">
            <span className="sd-wonka__bit">⚙</span>
            <span className="sd-wonka__bit">📎</span>
            <span className="sd-wonka__bit">🔧</span>
          </div>
        </header>
      )}

      <div className="sd-wonka__proof-grid" role="group" aria-label="Safe proof commands">
        {WONKA_PROOF_BUTTONS.map((button) => {
          const busy = activeId === button.id;
          const state = cardStates[button.id] ?? IDLE_CARD;

          return (
            <article key={button.id} className="sd-wonka__proof-card">
              <button
                type="button"
                className="sd-wonka__proof-btn"
                disabled={busy}
                onClick={() => void runProof(button.id)}
              >
                {busy ? "Running…" : button.label}
              </button>
              <ProofResult state={state} />
            </article>
          );
        })}
      </div>

      <p className="sd-wonka__proof-note">Allowlisted proofs only — no free-text shell. Receipt lands on the card you clicked.</p>
    </section>
  );
}
