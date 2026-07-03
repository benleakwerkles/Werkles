"use client";

import { useState } from "react";

type PermissionReceipt = {
  artifact_id: "permission-swatter-v0";
  verdict: "SWAT" | "HUMAN_GATE" | "WATCH" | "STOP";
  disposition: "SWAT_AWAY" | "ESCALATE_TO_BEN" | "HOLD_FOR_REVIEW" | "BLOCK";
  auto_approval_allowed: boolean;
  human_gate: boolean;
  confidence: number;
  rule_id: string;
  rule: string;
  reason: string;
  matched_terms: string[];
  source_authority: string[];
  timestamp: string;
};

const SAMPLE_NON_GATE =
  "Allow command: npm.cmd run typecheck. Justification: run local TypeScript proof inside approved local build lane.";

const SAMPLE_HUMAN_GATE =
  "Allow action: deploy to production and publish release. This may change public state.";

function renderPermissionReceipt(receipt: PermissionReceipt) {
  return [
    `artifact_id: ${receipt.artifact_id}`,
    `verdict: ${receipt.verdict}`,
    `disposition: ${receipt.disposition}`,
    `auto_approval_allowed: ${receipt.auto_approval_allowed}`,
    `human_gate: ${receipt.human_gate}`,
    `confidence: ${receipt.confidence}`,
    `rule_id: ${receipt.rule_id}`,
    `rule: ${receipt.rule}`,
    `reason: ${receipt.reason}`,
    `matched_terms: ${receipt.matched_terms.join("; ") || "(none)"}`,
    `source_authority: ${receipt.source_authority.join("; ")}`,
    `timestamp: ${receipt.timestamp}`,
  ].join("\n");
}

export function PermissionSwatterPanel() {
  const [promptText, setPromptText] = useState(SAMPLE_NON_GATE);
  const [receipt, setReceipt] = useState<PermissionReceipt | null>(null);
  const [pending, setPending] = useState(false);

  async function classifyPrompt(text: string) {
    setPending(true);
    try {
      const response = await fetch("/api/soledash/v1/permission-swatter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt_text: text }),
      });
      setReceipt((await response.json()) as PermissionReceipt);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="permission-swatter">
      <textarea
        aria-label="Permission prompt"
        className="permission-swatter__input"
        onChange={(event) => setPromptText(event.target.value)}
        spellCheck={false}
        value={promptText}
      />
      <div className="permission-swatter__toolbar" aria-label="Permission Swatter checks">
        <button className="permission-swatter__button" disabled={pending} onClick={() => classifyPrompt(promptText)} type="button">
          Classify Permission
        </button>
        <button className="permission-swatter__button" disabled={pending} onClick={() => setPromptText(SAMPLE_NON_GATE)} type="button">
          Non-Gate Sample
        </button>
        <button className="permission-swatter__button" data-tone="danger" disabled={pending} onClick={() => setPromptText(SAMPLE_HUMAN_GATE)} type="button">
          Human Gate Sample
        </button>
      </div>
      <aside className="permission-swatter__drawer" aria-live="polite" data-open={receipt ? "true" : "false"}>
        {receipt ? <pre>{renderPermissionReceipt(receipt)}</pre> : null}
      </aside>
    </div>
  );
}
