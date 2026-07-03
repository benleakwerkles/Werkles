"use client";

import { useState } from "react";

import { FailureRetryGate } from "@/components/soledash/failure-retry-gate";
import { ProvenanceLabel } from "@/components/soledash/provenance-label";
import { RelayResultPanel } from "@/components/soledash/relay-result-panel";
import { formatRelayReceiptReadable } from "@/lib/soledash/automatica-relay/relay-receipt-format";
import { provenanceFromRelayCard } from "@/lib/soledash/provenance/compute";
import type { RelayArtifact } from "@/lib/soledash/automatica-relay/artifact-types";
import type { RelayCardActionKind } from "@/lib/soledash/automatica-relay/artifact-types";
import type { RelayCardView } from "@/lib/soledash/automatica-relay/types";

const ROUTE_COUSINS = ["MAKER", "DINK", "PETRA", "ENDER", "BEAN"] as const;

function stateClass(state: string): string {
  return state.toLowerCase().replace(/\s+/g, "-");
}

function canApprove(card: RelayCardView): boolean {
  return (
    card.state === "READY" ||
    card.state === "RECEIPT RETURNED" ||
    card.state === "BLOCKED" ||
    card.state === "EXPLODED"
  );
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm} UTC`;
  } catch {
    return iso;
  }
}

function ArtifactProof({ artifact }: { artifact: RelayArtifact }) {
  const kindClass = `sd-relay-artifact--${artifact.kind.replace(/_/g, "-")}`;

  if (artifact.kind === "screenshot" && artifact.thumbnail) {
    const inner = (
      <>
        <img
          src={artifact.thumbnail}
          alt=""
          className="sd-relay-artifact__thumb"
          width={192}
          height={192}
        />
        <span className="sd-relay-artifact__caption">{artifact.value}</span>
      </>
    );
    return artifact.href ? (
      <a href={artifact.href} className={`sd-relay-artifact ${kindClass}`} target="_blank" rel="noreferrer">
        {inner}
      </a>
    ) : (
      <div className={`sd-relay-artifact ${kindClass}`}>{inner}</div>
    );
  }

  if (artifact.kind === "localhost_url" || artifact.kind === "preview_url" || artifact.kind === "url") {
    return (
      <a
        href={artifact.href ?? artifact.value}
        className={`sd-relay-artifact sd-relay-artifact--link ${kindClass}`}
        target="_blank"
        rel="noreferrer"
      >
        <span className="sd-relay-artifact__label">{artifact.label}</span>
        <span className="sd-relay-artifact__value sd-relay-artifact__value--url">{artifact.value}</span>
      </a>
    );
  }

  if (artifact.kind === "commit_hash") {
    return (
      <div className={`sd-relay-artifact ${kindClass}`}>
        <span className="sd-relay-artifact__label">{artifact.label}</span>
        <code className="sd-relay-artifact__hash">{artifact.value}</code>
      </div>
    );
  }

  if (artifact.kind === "diff_summary") {
    return (
      <div className={`sd-relay-artifact ${kindClass}`}>
        <span className="sd-relay-artifact__label">{artifact.label}</span>
        <pre className="sd-relay-artifact__diff">{artifact.value}</pre>
      </div>
    );
  }

  return (
    <div className={`sd-relay-artifact ${kindClass}`}>
      <span className="sd-relay-artifact__label">{artifact.label}</span>
      <code className="sd-relay-artifact__path">{artifact.value}</code>
    </div>
  );
}

export function RelayCardItem({
  card,
  busy,
  onAction,
  onOpenReceipt
}: {
  card: RelayCardView;
  busy: boolean;
  onAction: (cardId: string, action: RelayCardActionKind, cousin?: string) => Promise<void>;
  onOpenReceipt: (card: RelayCardView) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [routePick, setRoutePick] = useState<(typeof ROUTE_COUSINS)[number]>(
    (card.cousin as (typeof ROUTE_COUSINS)[number]) ?? "MAKER"
  );

  return (
    <article
      className={`sd-relay-card sd-relay-card--artifact-first sd-relay-card--${stateClass(card.state)} ${!card.routeConnected ? "sd-relay-card--disconnected" : ""}`}
    >
      <div className="sd-relay-card__head">
        <h3 className="sd-relay-card__title">{card.name}</h3>
        <span className={`sd-relay-card__status sd-relay-card__status--${stateClass(card.state)}`}>
          {card.state}
        </span>
      </div>

      <ProvenanceLabel provenance={provenanceFromRelayCard(card)} compact className="sd-relay-card__prov" />

      <section className="sd-relay-card__artifact-zone" aria-label="Artifact proof">
        <p className="sd-relay-card__zone-label">Artifact</p>
        {card.artifacts.length === 0 ? (
          <p className="sd-relay-artifact__empty">No artifact yet — wired route will produce file or URL proof.</p>
        ) : (
          <div className="sd-relay-artifact__stack">
            {card.artifacts.map((artifact) => (
              <ArtifactProof key={`${artifact.kind}-${artifact.value}`} artifact={artifact} />
            ))}
          </div>
        )}
      </section>

      <RelayResultPanel
        translation={card.resultTranslation}
        canOpenReceipt={Boolean(card.receiptPath && card.packetId)}
        onOpenReceipt={() => onOpenReceipt(card)}
      />

      <section className="sd-relay-card__notes-zone">
        <button
          type="button"
          className="sd-relay-card__notes-toggle"
          aria-expanded={notesOpen}
          onClick={() => setNotesOpen((v) => !v)}
        >
          Notes {notesOpen ? "▾" : "▸"}
        </button>
        {notesOpen ? (
          <dl className="sd-relay-card__notes">
            <div>
              <dt>Owner</dt>
              <dd>{card.notes.owner}</dd>
            </div>
            <div>
              <dt>Machine</dt>
              <dd>{card.notes.machine}</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{card.notes.confidence}</dd>
            </div>
            <div>
              <dt>Expected receipt</dt>
              <dd>{card.notes.expectedReceipt}</dd>
            </div>
            <div>
              <dt>ARTIFACT_REQUIRED</dt>
              <dd>{card.notes.artifactRequired ? "yes" : "no"}</dd>
            </div>
            <div>
              <dt>Artifact gate</dt>
              <dd>{card.notes.artifactGate.passed ? "PASS" : "BLOCKED"}</dd>
            </div>
            <div>
              <dt>Blocker</dt>
              <dd className={card.notes.blocker ? "sd-relay-card__blocker-text" : ""}>
                {card.notes.blocker ?? "—"}
              </dd>
            </div>
            <div>
              <dt>Last update</dt>
              <dd>{formatTime(card.notes.lastUpdate)}</dd>
            </div>
            <div>
              <dt>Next action</dt>
              <dd>{card.notes.nextAction}</dd>
            </div>
            <div className="sd-relay-card__notes-wide">
              <dt>Mission</dt>
              <dd>{card.notes.missionText}</dd>
            </div>
          </dl>
        ) : null}
      </section>

      <div className="sd-relay-card__actions">
        {card.failureContext && canApprove(card) ? (
          <FailureRetryGate
            context={card.failureContext}
            retryLabel="RETRY"
            busyLabel="…"
            busy={busy}
            buttonClassName="sd-relay-card__btn sd-relay-card__btn--approve"
            onRetry={() => void onAction(card.id, "approve")}
          />
        ) : (
          <button
            type="button"
            className="sd-relay-card__btn sd-relay-card__btn--approve"
            disabled={busy || !canApprove(card)}
            onClick={() => void onAction(card.id, "approve")}
          >
            {busy ? "…" : "APPROVE"}
          </button>
        )}
        <button
          type="button"
          className="sd-relay-card__btn sd-relay-card__btn--route"
          disabled={busy}
          onClick={() => setEditOpen((v) => !v)}
        >
          EDIT ROUTE
        </button>
        <button
          type="button"
          className="sd-relay-card__btn sd-relay-card__btn--research"
          disabled={busy}
          onClick={() => void onAction(card.id, "needs_research")}
        >
          NEEDS RESEARCH
        </button>
        <button
          type="button"
          className="sd-relay-card__btn sd-relay-card__btn--kill"
          disabled={busy}
          onClick={() => void onAction(card.id, "kill_test")}
        >
          KILL TEST
        </button>
      </div>

      {editOpen ? (
        <div className="sd-relay-card__edit">
          <label className="sd-relay-card__edit-label" htmlFor={`relay-route-${card.id}`}>
            Route owner
          </label>
          <select
            id={`relay-route-${card.id}`}
            className="sd-relay-card__edit-select"
            value={routePick}
            disabled={busy}
            onChange={(e) => setRoutePick(e.target.value as (typeof ROUTE_COUSINS)[number])}
          >
            {ROUTE_COUSINS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="sd-relay-card__btn sd-relay-card__btn--route"
            disabled={busy}
            onClick={() => {
              setEditOpen(false);
              void onAction(card.id, "edit_route", routePick);
            }}
          >
            Save route
          </button>
        </div>
      ) : null}
    </article>
  );
}

export function RelayCardSurface({
  cards,
  loading,
  busy,
  onAction,
  onOpenReceipt,
  receiptModal,
  onCloseReceipt
}: {
  cards: RelayCardView[];
  loading: boolean;
  busy: boolean;
  onAction: (cardId: string, action: RelayCardActionKind, cousin?: string) => Promise<void>;
  onOpenReceipt: (card: RelayCardView) => void;
  receiptModal: Record<string, unknown> | null;
  onCloseReceipt: () => void;
}) {
  if (loading && cards.length === 0) {
    return (
      <section className="sd-relay-surface" aria-label="Relay cards">
        <p className="sd-relay-surface__loading">Loading relay cards…</p>
      </section>
    );
  }

  return (
    <section className="sd-relay-surface" aria-label="Relay cards">
      <div className="sd-relay-surface__head">
        <p className="sd-relay-surface__eyebrow">Automatica · LightTrip</p>
        <h2 className="sd-relay-surface__title">Relay cards</h2>
        <p className="sd-relay-surface__hint">
          Artifact first — inspect proof (URL, screenshot, commit, diff) before opening Notes.
        </p>
      </div>

      <div className="sd-relay-surface__grid">
        {cards.map((card) => (
          <RelayCardItem
            key={card.id}
            card={card}
            busy={busy}
            onAction={onAction}
            onOpenReceipt={onOpenReceipt}
          />
        ))}
      </div>

      {receiptModal ? (
        <div className="auto-relay__modal-backdrop" role="presentation" onClick={onCloseReceipt}>
          <div
            className="auto-relay__modal sd-relay-surface__modal"
            role="dialog"
            aria-label="Relay receipt"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auto-relay__modal-head">
              <h3>Relay receipt</h3>
              <button type="button" onClick={onCloseReceipt}>
                Close
              </button>
            </div>
            <dl className="auto-relay__receipt-readable">
              {formatRelayReceiptReadable(receiptModal).map((row) => (
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
