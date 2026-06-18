"use client";

import { useState } from "react";

import type {
  ActionLifecycle,
  DecisionButton,
  DecisionReceipt,
  HumanGate,
  ReceiptCenterEntry,
  ReceiptCenterStatus
} from "@/protocol/index";

import { formatRelayReceiptReadable } from "@/lib/soledash/automatica-relay/relay-receipt-format";
import { useRelayCards } from "@/lib/soledash/automatica-relay/use-relay-cards";
import { RelayCardSurface } from "@/components/soledash/relay-card-surface";
import type { GateTier } from "@/lib/soledash/human-gate/types";
import type { ReactionEntry } from "@/lib/soledash/options-deck/types";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm} UTC`;
  } catch {
    return iso;
  }
}

function statusSlug(status: ReceiptCenterStatus): string {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function MobileFrontierPanel({
  frontierCode,
  frontierTitle,
  proposalSummary,
  evidenceStatus,
  waitingGatesCount,
  waitingGatesHint,
  blockerHeadline,
  reactions
}: {
  frontierCode: string;
  frontierTitle: string;
  proposalSummary: string | null;
  evidenceStatus: string | null;
  waitingGatesCount: number;
  waitingGatesHint: string | null;
  blockerHeadline: string | null;
  reactions: ReactionEntry[];
}) {
  const moved = reactions.slice(0, 3);

  return (
    <section className="sd-mfc-frontier" aria-label="Current frontier">
      <p className="sd-mfc-frontier__eyebrow">Active mission</p>
      <p className="sd-mfc-frontier__code">{frontierCode}</p>
      <h2 className="sd-mfc-frontier__title">{frontierTitle}</h2>
      {evidenceStatus ? (
        <p className="sd-mfc-frontier__evidence">{evidenceStatus.replace(/_/g, " ")}</p>
      ) : null}
      {proposalSummary ? (
        <p className="sd-mfc-frontier__summary">{proposalSummary}</p>
      ) : null}
      {waitingGatesCount > 0 ? (
        <div className="sd-mfc-frontier__gates sd-mfc-frontier__gates--alert">
          <span className="sd-mfc-frontier__gates-num">{waitingGatesCount}</span>
          <span>{waitingGatesHint ?? "Human gate waiting"}</span>
        </div>
      ) : null}
      {blockerHeadline ? (
        <p className="sd-mfc-frontier__blocker" role="alert">
          Blocker: {blockerHeadline}
        </p>
      ) : null}
      {moved.length > 0 ? (
        <div className="sd-mfc-frontier__moved" aria-label="What moved since last check">
          <p className="sd-mfc-frontier__moved-label">Moved since last check</p>
          <ul className="sd-mfc-frontier__moved-list">
            {moved.map((r) => (
              <li key={r.id} className={`sd-mfc-frontier__moved-item sd-mfc-frontier__moved-item--${r.tone}`}>
                <span className="sd-mfc-frontier__moved-head">{r.headline}</span>
                <span className="sd-mfc-frontier__moved-detail">{r.detail}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function MobileCommandActions({
  busy,
  activeAction,
  gateTier,
  routeButtons,
  onYea,
  onNay,
  onRouteAction
}: {
  busy: boolean;
  activeAction: string | null;
  gateTier: GateTier;
  routeButtons: DecisionButton[];
  onYea: () => void;
  onNay: () => void;
  onRouteAction: (actionId: string) => void;
}) {
  const routes = routeButtons.filter((b) => b.enabled);

  return (
    <section className="sd-mfc-actions" aria-label="Frontier actions">
      <p className="sd-mfc-actions__label">Command</p>
      {gateTier !== "red" ? (
        <div className="sd-mfc-actions__yea-nay">
          <button
            type="button"
            className="sd-mfc-actions__btn sd-mfc-actions__btn--yea"
            disabled={busy}
            onClick={onYea}
          >
            {busy && activeAction === "yea" ? "Sending…" : "YEA"}
          </button>
          <button
            type="button"
            className="sd-mfc-actions__btn sd-mfc-actions__btn--nay"
            disabled={busy}
            onClick={onNay}
          >
            {busy && activeAction === "nay" ? "Declining…" : "NAY"}
          </button>
        </div>
      ) : (
        <p className="sd-mfc-actions__red-hint">Use Human Gate card above to approve or reject.</p>
      )}
      {gateTier === "blue" ? (
        <p className="sd-mfc-actions__blue-hint">Receipt appears after execution.</p>
      ) : null}
      {routes.length > 0 ? (
        <div className="sd-mfc-actions__routes">
          {routes.map((slot) => (
            <button
              key={slot.id}
              type="button"
              className={`sd-mfc-actions__btn sd-mfc-actions__btn--route sd-mfc-actions__btn--${slot.id.replace(/_/g, "-")}`}
              disabled={busy || !slot.enabled}
              title={slot.reason_disabled ?? (slot.route_owner ? `Routes to ${slot.route_owner}` : undefined)}
              onClick={() => onRouteAction(slot.id)}
            >
              {busy && activeAction === slot.id ? "…" : slot.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function MobileLatestReceipt({
  entries,
  lifecycle,
  receipt,
  gateTier
}: {
  entries: ReceiptCenterEntry[];
  lifecycle: ActionLifecycle;
  receipt: DecisionReceipt;
  gateTier: GateTier;
}) {
  const latest = entries[0];
  const hasLifecycle = lifecycle.phase !== "idle" && lifecycle.phase !== "resolved";
  const hasReceipt = Boolean(receipt.last_action || receipt.outcome || latest);

  if (!hasLifecycle && !hasReceipt) return null;

  return (
    <section className="sd-mfc-latest" aria-label="Latest receipt">
      <p className="sd-mfc-latest__label">
        {gateTier === "blue" ? "Latest · receipt after execution" : "Latest"}
      </p>
      {hasLifecycle ? (
        <p className={`sd-mfc-latest__phase sd-mfc-latest__phase--${lifecycle.phase}`}>
          {lifecycle.message}
        </p>
      ) : null}
      {receipt.outcome ? <p className="sd-mfc-latest__outcome">{receipt.outcome}</p> : null}
      {latest ? (
        <p className="sd-mfc-latest__row">
          <span className={`sd-mfc-receipts__status sd-mfc-receipts__status--${statusSlug(latest.status)}`}>
            {latest.status}
          </span>
          <span className="sd-mfc-latest__target">{latest.target}</span>
          <span className="sd-mfc-latest__time">{formatTime(latest.last_update)}</span>
        </p>
      ) : null}
    </section>
  );
}

function RelayReceiptModal({
  receipt,
  onClose
}: {
  receipt: Record<string, unknown>;
  onClose: () => void;
}) {
  return (
    <div className="auto-relay__modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="auto-relay__modal sd-mfc-relay__modal"
        role="dialog"
        aria-label="Relay receipt"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="auto-relay__modal-head">
          <h3>Relay receipt</h3>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <dl className="auto-relay__receipt-readable">
          {formatRelayReceiptReadable(receipt).map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export function MobileRelayCardList({ onRefresh }: { onRefresh?: () => void | Promise<void> }) {
  const { cards, loading, busyId, runAction, fetchReceipt } = useRelayCards(onRefresh);
  const [receiptModal, setReceiptModal] = useState<Record<string, unknown> | null>(null);

  return (
    <RelayCardSurface
      cards={cards}
      loading={loading}
      busy={busyId !== null}
      onAction={async (cardId, action, cousin) => {
        await runAction(cardId, action, cousin);
      }}
      onOpenReceipt={(card) => {
        if (!card.packetId) return;
        void fetchReceipt(card.packetId).then((r) => r && setReceiptModal(r));
      }}
      receiptModal={receiptModal}
      onCloseReceipt={() => setReceiptModal(null)}
    />
  );
}

export type MobileHandAction = "yea" | "nay" | "needs_research" | "kill_test";

export function MobileHandsPanel({
  humanGate,
  busy,
  activeAction,
  yeaPendingConfirm,
  routeButtons,
  unavailable,
  onApprove,
  onReject,
  onNeedsResearch,
  onKillTest,
  onYeaConfirm,
  onYeaCancel
}: {
  humanGate: HumanGate;
  busy: boolean;
  activeAction: string | null;
  yeaPendingConfirm: boolean;
  routeButtons: DecisionButton[];
  unavailable: boolean;
  onApprove: (reason: string) => void;
  onReject: (reason: string) => void;
  onNeedsResearch: (reason: string) => void;
  onKillTest: (reason: string) => void;
  onYeaConfirm: (reason: string) => void;
  onYeaCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const needsResearch = routeButtons.find((b) => b.id === "needs_research");
  const killTest = routeButtons.find((b) => b.id === "kill_test");

  if (yeaPendingConfirm) {
    return (
      <section className="sd-mfc-hands sd-mfc-hands--confirm" aria-label="Confirm approve">
        <p className="sd-mfc-hands__prompt">Approve frontier action?</p>
        {reason.trim() ? <p className="sd-mfc-hands__reason-preview">Reason: {reason.trim()}</p> : null}
        <div className="sd-mfc-hands__row">
          <button
            type="button"
            className="sd-mfc-hands__btn sd-mfc-hands__btn--approve"
            disabled={busy}
            onClick={() => onYeaConfirm(reason)}
          >
            {busy && activeAction === "yea" ? "Sending…" : "Confirm approve"}
          </button>
          <button
            type="button"
            className="sd-mfc-hands__btn sd-mfc-hands__btn--ghost"
            disabled={busy}
            onClick={onYeaCancel}
          >
            Cancel
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="sd-mfc-hands" aria-label="Human gate hands">
      <div className="sd-mfc-hands__head">
        <p className="sd-mfc-hands__label">Hands</p>
        <p className="sd-mfc-hands__prompt">{humanGate.operator_prompt}</p>
      </div>
      <label className="sd-mfc-hands__reason-label" htmlFor="sd-mfc-reason">
        Short reason (optional)
      </label>
      <input
        id="sd-mfc-reason"
        type="text"
        className="sd-mfc-hands__reason"
        placeholder="Why approve, reject, or route…"
        value={reason}
        disabled={busy || unavailable}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="sd-mfc-hands__grid">
        <button
          type="button"
          className="sd-mfc-hands__btn sd-mfc-hands__btn--approve"
          disabled={busy || unavailable}
          title={unavailable ? "Live payload unavailable" : undefined}
          onClick={() => onApprove(reason)}
        >
          {busy && activeAction === "yea" ? "…" : "Approve"}
        </button>
        <button
          type="button"
          className="sd-mfc-hands__btn sd-mfc-hands__btn--reject"
          disabled={busy || unavailable}
          onClick={() => onReject(reason)}
        >
          {busy && activeAction === "nay" ? "…" : "Reject"}
        </button>
        <button
          type="button"
          className="sd-mfc-hands__btn sd-mfc-hands__btn--research"
          disabled={busy || unavailable || !needsResearch?.enabled}
          title={needsResearch?.reason_disabled ?? undefined}
          onClick={() => onNeedsResearch(reason)}
        >
          {busy && activeAction === "needs_research" ? "…" : "Needs research"}
        </button>
        <button
          type="button"
          className="sd-mfc-hands__btn sd-mfc-hands__btn--kill"
          disabled={busy || unavailable || !killTest?.enabled}
          title={killTest?.reason_disabled ?? undefined}
          onClick={() => onKillTest(reason)}
        >
          {busy && activeAction === "kill_test" ? "…" : "Kill test"}
        </button>
      </div>
      {!needsResearch?.enabled && needsResearch?.reason_disabled ? (
        <p className="sd-mfc-hands__disabled-hint">{needsResearch.reason_disabled}</p>
      ) : null}
    </section>
  );
}

function receiptRows(entry: ReceiptCenterEntry): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [
    { label: "Target", value: entry.target },
    { label: "Status", value: entry.status },
    { label: "Action ID", value: entry.action_id },
    { label: "Owner", value: entry.owner ?? "—" },
    { label: "Updated", value: formatTime(entry.last_update) },
    { label: "Created", value: formatTime(entry.created_at) }
  ];
  if (entry.receipt_link) rows.push({ label: "Receipt path", value: entry.receipt_link });
  if (entry.simulated) rows.push({ label: "Transport", value: "SIMULATED (file-backed)" });
  else if (entry.mock_test) rows.push({ label: "Transport", value: "MOCK TEST" });
  else if (entry.mock) rows.push({ label: "Transport", value: "MOCK" });
  else rows.push({ label: "Transport", value: "LIVE" });
  return rows;
}

export function MobileReceiptList({ entries }: { entries: ReceiptCenterEntry[] }) {
  const [open, setOpen] = useState<ReceiptCenterEntry | null>(null);
  const list = entries.slice(0, 12);

  return (
    <section className="sd-mfc-receipts" aria-label="Receipts">
      <div className="sd-mfc-receipts__head">
        <h2 className="sd-mfc-receipts__title">Receipts</h2>
        <span className="sd-mfc-receipts__count">{entries.length}</span>
      </div>
      {list.length === 0 ? (
        <p className="sd-mfc-receipts__empty">No receipts yet — fire a relay card or dispatch frontier.</p>
      ) : (
        <ul className="sd-mfc-receipts__list">
          {list.map((entry) => (
            <li key={entry.action_id}>
              <button
                type="button"
                className={`sd-mfc-receipts__row sd-mfc-receipts__row--${statusSlug(entry.status)}`}
                onClick={() => setOpen(entry)}
              >
                <span className={`sd-mfc-receipts__status sd-mfc-receipts__status--${statusSlug(entry.status)}`}>
                  {entry.status}
                </span>
                <span className="sd-mfc-receipts__target">{entry.target}</span>
                <span className="sd-mfc-receipts__time">{formatTime(entry.last_update)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className="auto-relay__modal-backdrop" role="presentation" onClick={() => setOpen(null)}>
          <div
            className="auto-relay__modal sd-mfc-receipts__modal"
            role="dialog"
            aria-label="Receipt detail"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auto-relay__modal-head">
              <h3>Receipt</h3>
              <button type="button" onClick={() => setOpen(null)}>
                Close
              </button>
            </div>
            <dl className="auto-relay__receipt-readable">
              {receiptRows(open).map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      ) : null}
    </section>
  );
}
