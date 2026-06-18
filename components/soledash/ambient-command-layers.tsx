"use client";

import { useState, type ReactNode } from "react";

import type {
  ActionLifecycle,
  DecisionReceipt,
  FleetMachineCard,
  FrontierQueueItem,
  Proposal,
  ReceiptCenterEntry
} from "@/protocol/index";
import type { RealityMode } from "@/lib/soledash/decision-surface/reality-mode";
import {
  fleetHealthLabel,
  fleetHealthSlug,
  normalizeFleetHealth
} from "@/lib/soledash/megawork-home/fleet-health";
import {
  LEAVE_REASON_LABELS,
  loadLeavePoints,
  saveLeavePoint,
  type LeavePointEntry,
  type LeavePointReason
} from "@/lib/soledash/megawork-home/leave-points";

function realitySlug(mode: RealityMode): string {
  return mode.toLowerCase().replace(/\s+/g, "-");
}

export function MonitorDoctrineStrip() {
  return (
    <div className="sd-doctrine" aria-label="Primary monitor doctrine">
      <p className="sd-doctrine__primary">
        <span className="sd-doctrine__tag">STARSHIP EXPLODE</span>
        <span className="sd-doctrine__owns">COMPANY OPTIONS · YOUR CALL</span>
      </p>
      <p className="sd-doctrine__secondary">Not a vacuum — every play costs attention; the dash reinforms after impact</p>
    </div>
  );
}

export function AmbientLayer({
  mission,
  realityMode,
  proposal,
  frontier,
  fleet,
  receiptCount,
  queueCount,
  hasBlocker,
  blockerHeadline,
  postureTone,
  onOpenCommand,
  leavePoints,
  refreshing,
  onRefresh
}: {
  mission: string;
  realityMode: RealityMode;
  proposal: Proposal | null;
  frontier: FrontierQueueItem | null;
  fleet: FleetMachineCard[];
  receiptCount: number;
  queueCount: number;
  hasBlocker: boolean;
  blockerHeadline: string | null;
  postureTone: "ok" | "warn" | "bad";
  onOpenCommand: () => void;
  leavePoints: LeavePointEntry[];
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const frontierLabel = frontier?.action_code ?? proposal?.action_code ?? "—";
  const frontierTitle = frontier?.title ?? proposal?.title ?? "No frontier";
  const activeCousins = fleet
    .map((m) => (m.active_cousins && m.active_cousins !== "UNKNOWN" ? `${m.label}: ${m.active_cousins}` : null))
    .filter(Boolean);

  return (
    <section className="sd-ambient" aria-label="Ambient porch">
      <div className={`sd-ambient__reality sd-ambient__reality--${realitySlug(realityMode)}`}>
        <span className="sd-ambient__reality-mode">{realityMode}</span>
        <button type="button" className="sd-ambient__refresh" disabled={refreshing} onClick={onRefresh}>
          {refreshing ? "…" : "↻"}
        </button>
      </div>

      <MonitorDoctrineStrip />

      <div className="sd-ambient__hero">
        <p className="sd-ambient__hero-label">What needs Ben</p>
        <p className="sd-ambient__hero-code">{frontierLabel}</p>
        <p className="sd-ambient__hero-title">{frontierTitle}</p>
        <p className={`sd-ambient__posture sd-ambient__posture--${postureTone}`}>
          {postureTone === "ok" ? "Thread OK" : postureTone === "warn" ? "Attention" : "Blocked"}
        </p>
      </div>

      <div className="sd-ambient__counts" aria-label="Status counts">
        <div className="sd-ambient__count">
          <span className="sd-ambient__count-num">{queueCount}</span>
          <span className="sd-ambient__count-label">queue</span>
        </div>
        <div className="sd-ambient__count">
          <span className="sd-ambient__count-num">{receiptCount}</span>
          <span className="sd-ambient__count-label">receipts</span>
        </div>
        <div className={`sd-ambient__count ${hasBlocker ? "sd-ambient__count--alert" : ""}`}>
          <span className="sd-ambient__count-num">{hasBlocker ? 1 : 0}</span>
          <span className="sd-ambient__count-label">blocker</span>
        </div>
      </div>

      <div className="sd-ambient__fleet" aria-label="Fleet health">
        {fleet.map((m) => {
          const health = normalizeFleetHealth(m.status);
          return (
            <div
              key={m.id}
              className={`sd-ambient__silhouette ${m.is_local ? "sd-ambient__silhouette--local" : ""}`}
              title={`${m.label} · ${health} (${fleetHealthLabel(health)})`}
            >
              <span className={`sd-ambient__dot sd-ambient__dot--${fleetHealthSlug(health)}`} />
              <span className="sd-ambient__sil-name">{m.label.slice(0, 1)}</span>
              <span className="sd-ambient__sil-health">{health}</span>
            </div>
          );
        })}
      </div>

      {activeCousins.length > 0 ? (
        <div className="sd-ambient__cousins" aria-label="Active cousins">
          <p className="sd-ambient__cousins-label">Active cousins</p>
          {activeCousins.map((line) => (
            <p key={line} className="sd-ambient__cousins-line">
              {line}
            </p>
          ))}
        </div>
      ) : null}

      {hasBlocker && blockerHeadline ? (
        <p className="sd-ambient__blocker" aria-label="Current blocker">
          Blocker · {blockerHeadline}
        </p>
      ) : null}

      <p className="sd-ambient__mission">{mission}</p>

      {leavePoints.length > 0 ? (
        <div className="sd-ambient__leave-feed" aria-label="Recent leave points">
          <p className="sd-ambient__leave-feed-label">Phase 0 food</p>
          {leavePoints.slice(0, 3).map((lp) => (
            <p key={lp.id} className="sd-ambient__leave-item">
              {LEAVE_REASON_LABELS[lp.reason]}
              {lp.note ? ` · ${lp.note}` : ""}
            </p>
          ))}
        </div>
      ) : null}

      <button type="button" className="sd-ambient__open-cmd" onClick={onOpenCommand}>
        Open Command
      </button>
    </section>
  );
}

export function LeavePointTracker({
  open,
  onSubmit,
  onSkip
}: {
  open: boolean;
  onSubmit: (reason: LeavePointReason, note: string) => void;
  onSkip: () => void;
}) {
  const [note, setNote] = useState("");

  if (!open) return null;

  return (
    <section className="sd-leave" aria-label="Leave point tracker">
      <h2 className="sd-leave__title">Why did Ben leave SoleDash?</h2>
      <p className="sd-leave__hint">Every leave-point becomes Phase 0 food.</p>
      <div className="sd-leave__reasons">
        {(Object.keys(LEAVE_REASON_LABELS) as LeavePointReason[]).map((reason) => (
          <button
            key={reason}
            type="button"
            className="sd-leave__reason-btn"
            onClick={() => onSubmit(reason, note)}
          >
            {LEAVE_REASON_LABELS[reason]}
          </button>
        ))}
      </div>
      <input
        type="text"
        className="sd-leave__note"
        placeholder="Optional note…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button type="button" className="sd-leave__skip" onClick={onSkip}>
        Skip
      </button>
    </section>
  );
}

export function CommandLayerShell({
  children,
  onReturnToPorch
}: {
  children: ReactNode;
  onReturnToPorch: () => void;
}) {
  return (
    <section className="sd-command" aria-label="Command layer">
      <div className="sd-command__head">
        <p className="sd-command__label">Command</p>
        <button type="button" className="sd-command__return" onClick={onReturnToPorch}>
          Return to porch
        </button>
      </div>
      {children}
    </section>
  );
}

export function DirectYeaNay({
  busy,
  activeAction,
  onYea,
  onNay
}: {
  busy: boolean;
  activeAction: string | null;
  onYea: () => void;
  onNay: () => void;
}) {
  return (
    <div className="sd-guard sd-guard--idle" aria-label="Decision buttons">
      <button
        type="button"
        className="sd-guard__btn sd-guard__btn--yea"
        disabled={busy}
        onClick={onYea}
      >
        {busy && activeAction === "yea" ? "Sending…" : "YEA"}
      </button>
      <button
        type="button"
        className="sd-guard__btn sd-guard__btn--nay"
        disabled={busy}
        onClick={onNay}
      >
        {busy && activeAction === "nay" ? "Declining…" : "NAY"}
      </button>
    </div>
  );
}

export function GuardedYeaNay({
  busy,
  activeAction,
  yeaPendingConfirm,
  onYeaClick,
  onYeaConfirm,
  onYeaCancel,
  onNay
}: {
  busy: boolean;
  activeAction: string | null;
  yeaPendingConfirm: boolean;
  onYeaClick: () => void;
  onYeaConfirm: () => void;
  onYeaCancel: () => void;
  onNay: () => void;
}) {
  if (yeaPendingConfirm) {
    return (
      <div className="sd-guard" aria-label="Guarded YEA confirm">
        <p className="sd-guard__warn">Send YEA? This dispatches frontier action.</p>
        <div className="sd-guard__actions">
          <button type="button" className="sd-guard__btn sd-guard__btn--yea" disabled={busy} onClick={onYeaConfirm}>
            {busy && activeAction === "yea" ? "Sending…" : "Confirm YEA"}
          </button>
          <button type="button" className="sd-guard__btn sd-guard__btn--cancel" disabled={busy} onClick={onYeaCancel}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sd-guard sd-guard--idle" aria-label="Decision buttons">
      <button
        type="button"
        className="sd-guard__btn sd-guard__btn--yea"
        disabled={busy}
        onClick={onYeaClick}
      >
        {busy && activeAction === "yea" ? "Sending…" : "YEA"}
      </button>
      <button
        type="button"
        className="sd-guard__btn sd-guard__btn--nay"
        disabled={busy}
        onClick={onNay}
      >
        {busy && activeAction === "nay" ? "Declining…" : "NAY"}
      </button>
    </div>
  );
}

export function CompactReceiptRail({
  entries,
  lifecycle,
  receipt
}: {
  entries: ReceiptCenterEntry[];
  lifecycle: ActionLifecycle;
  receipt: DecisionReceipt;
}) {
  const latest = entries[0];
  return (
    <div className="sd-rail" aria-label="Receipt and action rail">
      {lifecycle.phase !== "idle" ? (
        <p className="sd-rail__action">
          {lifecycle.action?.toUpperCase()} · {lifecycle.phase}
          {lifecycle.simulated ? " · SIM" : ""}
        </p>
      ) : null}
      {latest ? (
        <p className="sd-rail__receipt">
          {latest.status} · {latest.target.slice(0, 48)}
        </p>
      ) : null}
      {receipt.outcome ? <p className="sd-rail__outcome">{receipt.outcome}</p> : null}
    </div>
  );
}

export { loadLeavePoints, saveLeavePoint, type LeavePointEntry, type LeavePointReason };
