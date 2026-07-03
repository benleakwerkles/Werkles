"use client";

import type { DecisionButton } from "@/protocol/index";
import { DirectYeaNay } from "@/components/soledash/ambient-command-layers";
import { ProvenanceLabel } from "@/components/soledash/provenance-label";
import type { GateTier } from "@/lib/soledash/human-gate/types";
import type { Provenance } from "@/lib/soledash/provenance/types";

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
  gateTier,
  routeButtons,
  unavailable,
  onYeaClick,
  onNay,
  onRouteAction,
  onSendPacket,
  hidePacket = false,
  provenance
}: {
  busy: boolean;
  activeAction: string | null;
  gateTier: GateTier;
  routeButtons: DecisionButton[];
  unavailable: boolean;
  onYeaClick: () => void;
  onNay: () => void;
  onRouteAction: (actionId: string, routeOwner: string | null) => void;
  onSendPacket: () => void;
  hidePacket?: boolean;
  provenance?: Provenance;
}) {
  const packetDisabled = unavailable;
  const packetReason = unavailable ? "Live payload unavailable" : null;

  return (
    <section className="sd-cmd-actions" aria-label="Command actions">
      <p className="sd-cmd-actions__label">Command</p>
      {provenance ? <ProvenanceLabel provenance={provenance} compact className="sd-cmd-actions__prov" /> : null}
      {gateTier === "red" ? null : (
        <div className="sd-cmd-actions__approve" aria-label="Approve or reject">
          {gateTier === "green" ? (
            <DirectYeaNay busy={busy} activeAction={activeAction} onYea={onYeaClick} onNay={onNay} />
          ) : (
            <>
              <DirectYeaNay busy={busy} activeAction={activeAction} onYea={onYeaClick} onNay={onNay} />
              <p className="sd-cmd-actions__blue-hint">Receipt appears after execution — no pre-approval card.</p>
            </>
          )}
        </div>
      )}

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

      {!hidePacket ? (
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
      ) : null}
    </section>
  );
}
