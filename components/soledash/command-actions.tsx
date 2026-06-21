"use client";

import type { DecisionButton } from "@/protocol/index";
import { GuardedYeaNay } from "@/components/soledash/ambient-command-layers";

function buttonVariant(slot: DecisionButton): string {
  switch (slot.id) {
    case "yea":
      return "fm-btn--yea";
    case "nay":
      return "fm-btn--nay";
    case "needs_research":
      return "fm-btn--research";
    case "kill_test":
      return "fm-btn--kill";
    case "human_reality":
      return "fm-btn--ender";
    default:
      return "fm-btn--neutral";
  }
}

function busyLabelFor(slot: DecisionButton): string {
  if (slot.id === "yea") return "Dispatching YEA…";
  if (slot.id === "nay") return "Recording NAY…";
  return `${slot.label}…`;
}

function RouteButton({
  slot,
  busy,
  activeAction,
  onClick
}: {
  slot: DecisionButton;
  busy: boolean;
  activeAction: string | null;
  onClick: () => void;
}) {
  const variant = buttonVariant(slot);
  const isActive = busy && activeAction === slot.id;
  const disabled = busy || !slot.enabled;

  return (
    <button
      type="button"
      className={`fm-btn ${variant} ${isActive ? "fm-btn--active" : ""} ${!slot.enabled ? "fm-btn--protocol-off" : ""}`}
      disabled={disabled}
      title={slot.reason_disabled ?? (slot.route_owner ? `Routes to ${slot.route_owner}` : undefined)}
      onClick={onClick}
    >
      {isActive ? busyLabelFor(slot) : slot.label}
    </button>
  );
}

export function CommandActionsPanel({
  busy,
  activeAction,
  yeaPendingConfirm,
  routeButtons,
  unavailable,
  onYeaClick,
  onYeaConfirm,
  onYeaCancel,
  onNay,
  onRouteAction,
  onSendPacket
}: {
  busy: boolean;
  activeAction: string | null;
  yeaPendingConfirm: boolean;
  routeButtons: DecisionButton[];
  unavailable: boolean;
  onYeaClick: () => void;
  onYeaConfirm: () => void;
  onYeaCancel: () => void;
  onNay: () => void;
  onRouteAction: (actionId: string, routeOwner: string | null) => void;
  onSendPacket: () => void;
}) {
  const packetDisabled = unavailable;
  const packetReason = unavailable ? "Live payload unavailable" : null;

  return (
    <section className="sd-cmd-actions" aria-label="Command actions">
      <p className="sd-cmd-actions__label">Command</p>
      <div className="sd-cmd-actions__approve" aria-label="Approve or reject">
        <GuardedYeaNay
          busy={busy}
          activeAction={activeAction}
          yeaPendingConfirm={yeaPendingConfirm}
          onYeaClick={onYeaClick}
          onYeaConfirm={onYeaConfirm}
          onYeaCancel={onYeaCancel}
          onNay={onNay}
        />
      </div>

      <div className="sd-cmd-actions__routes" aria-label="Route to cousin">
        {routeButtons.map((slot) => (
          <RouteButton
            key={slot.id}
            slot={slot}
            busy={busy}
            activeAction={activeAction}
            onClick={() => onRouteAction(slot.id, slot.route_owner ?? null)}
          />
        ))}
      </div>

      {!routeButtons.some((b) => b.enabled) && !unavailable ? (
        <p className="sd-cmd-actions__hint">
          Route buttons disabled — Dink must enable NEEDS RESEARCH, KILL TEST, or HUMAN REALITY in protocol.
        </p>
      ) : null}

      <div className="sd-cmd-actions__packet">
        <button
          type="button"
          className="fm-btn fm-btn--accent"
          disabled={busy || packetDisabled}
          title={packetReason ?? "Focus operator bar — enter text and pick a cousin"}
          onClick={onSendPacket}
        >
          Send packet
        </button>
        <p className="sd-cmd-actions__packet-hint">
          Enter text in the operator bar, then Send to Maker / Dink / Ender / Bean / Thufir / Skybro.
        </p>
      </div>
    </section>
  );
}
