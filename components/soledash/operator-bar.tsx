"use client";

import { type RefObject } from "react";

import { COUSIN_TARGETS, type OperatorCousinTarget } from "@/lib/soledash/options-deck/cousins";

export type { OperatorCousinTarget } from "@/lib/soledash/options-deck/cousins";
export type DispatchStatus = {
  label: string;
  detail: string | null;
  tone: "idle" | "busy" | "ok" | "warn" | "bad";
};

export function OperatorBar({
  frontierCode,
  frontierTitle,
  waitingGatesCount,
  waitingGatesHint,
  chatInput,
  chatPlaceholder,
  chatDisabled,
  chatDisabledReason,
  busy,
  dispatchStatus,
  onChatInputChange,
  onSendChat,
  onSendToCousin,
  onOpenCommand,
  inputRef
}: {
  frontierCode: string;
  frontierTitle: string;
  waitingGatesCount: number;
  waitingGatesHint: string | null;
  chatInput: string;
  chatPlaceholder: string;
  chatDisabled: boolean;
  chatDisabledReason: string | null;
  busy: boolean;
  dispatchStatus: DispatchStatus;
  onChatInputChange: (value: string) => void;
  onSendChat: () => void;
  onSendToCousin: (cousin: OperatorCousinTarget) => void;
  onOpenCommand?: () => void;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
}) {
  const noText = !chatInput.trim();
  const cousinDisabled = busy || chatDisabled || noText;
  const cousinDisabledReason = chatDisabledReason
    ? chatDisabledReason
    : noText
      ? "Enter message first"
      : null;

  return (
    <footer className="sd-operator-bar" aria-label="Operator bar">
      <div className="sd-operator-bar__status-row">
        <div className="sd-operator-bar__chip sd-operator-bar__chip--frontier">
          <span className="sd-operator-bar__chip-label">Frontier</span>
          <span className="sd-operator-bar__chip-code">{frontierCode}</span>
          <span className="sd-operator-bar__chip-detail" title={frontierTitle}>
            {frontierTitle}
          </span>
        </div>

        {waitingGatesCount > 0 ? (
          <div
            className="sd-operator-bar__chip sd-operator-bar__chip--gates sd-operator-bar__chip--alert"
            title={waitingGatesHint ?? undefined}
          >
            <span className="sd-operator-bar__chip-label">Waiting gates</span>
            <span className="sd-operator-bar__chip-num">{waitingGatesCount}</span>
          </div>
        ) : null}

        <div className={`sd-operator-bar__dispatch sd-operator-bar__dispatch--${dispatchStatus.tone}`}>
          <span className="sd-operator-bar__dispatch-label">Dispatch</span>
          <span className="sd-operator-bar__dispatch-value">{dispatchStatus.label}</span>
          {dispatchStatus.detail ? (
            <span className="sd-operator-bar__dispatch-detail" title={dispatchStatus.detail}>
              {dispatchStatus.detail}
            </span>
          ) : null}
        </div>

        {onOpenCommand ? (
          <button type="button" className="sd-operator-bar__cmd-link" onClick={onOpenCommand}>
            Command
          </button>
        ) : null}
      </div>

      <div className="sd-operator-bar__compose">
        <label className="sd-operator-bar__compose-label" htmlFor="sd-operator-chat">
          Talk to the machine
        </label>
        <textarea
          id="sd-operator-chat"
          ref={inputRef}
          className="sd-operator-bar__input"
          rows={2}
          placeholder={chatPlaceholder}
          value={chatInput}
          disabled={busy && !chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!chatDisabled && chatInput.trim()) onSendChat();
            }
          }}
        />
        <button
          type="button"
          className="sd-operator-bar__send"
          disabled={busy || chatDisabled || noText}
          title={chatDisabledReason ?? undefined}
          onClick={onSendChat}
        >
          {busy ? "…" : "Send"}
        </button>
      </div>

      <div className="sd-operator-bar__cousins" aria-label="Send packet to cousin">
        {COUSIN_TARGETS.map((cousin) => (
          <button
            key={cousin.id}
            type="button"
            className="sd-operator-bar__cousin-btn"
            disabled={cousinDisabled}
            title={cousinDisabled ? (cousinDisabledReason ?? undefined) : `Send packet to ${cousin.label}`}
            onClick={() => onSendToCousin(cousin.id)}
          >
            {busy ? "…" : cousin.label}
          </button>
        ))}
      </div>
    </footer>
  );
}
