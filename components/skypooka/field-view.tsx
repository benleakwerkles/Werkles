"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import type { SkyPookaFieldFeed } from "@/lib/skypooka/feed";

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function simulateFire(name: string) {
  if (
    !window.confirm(
      `FIRE ${name}?\n\nRelay backend is NOT connected on this build — this will NOT actually send.`
    )
  ) {
    return;
  }
  window.alert("SIMULATED: no relay backend connected. Nothing was sent.");
}

export default function SkyPookaFieldView() {
  const [feed, setFeed] = useState<SkyPookaFieldFeed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [held, setHeld] = useState<Record<string, boolean>>({});

  const loadFeed = useCallback(async () => {
    try {
      const response = await fetch("/api/skypooka/feed", { cache: "no-store" });
      const payload = (await response.json()) as SkyPookaFieldFeed | { ok: false; error?: string };
      if (!response.ok || !("ok" in payload) || payload.ok !== true) {
        throw new Error("error" in payload ? payload.error ?? "Feed failed" : "Feed failed");
      }
      setFeed(payload);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Feed failed");
    }
  }, []);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  if (error) {
    return <div className="skypooka-error">SkyPooka feed error: {error}</div>;
  }

  if (!feed) {
    return <div className="skypooka-loading">Loading field feed…</div>;
  }

  return (
    <>
      {!feed.relay_backend_connected ? (
        <div className="skypooka-banner">
          Relay backend not connected — <b>FIRE</b> is <b>SIMULATED</b> on this build (nothing is sent).
        </div>
      ) : null}

      {feed.operator_focus ? (
        <section className="skypooka-focus" aria-label="Operator focus">
          <div className="skypooka-focus-label">Operator focus</div>
          <div className="skypooka-card-name">{feed.operator_focus.next_action}</div>
          <div className="skypooka-meta">
            {feed.operator_focus.object_id} · {feed.operator_focus.stage} · {feed.operator_focus.execution_owner}
          </div>
        </section>
      ) : null}

      {feed.effective_gate ? (
        <div className="skypooka-meta skypooka-meta--muted">Effective gate: {feed.effective_gate}</div>
      ) : null}

      <h2 className="skypooka-section-title">1 · Active relay cards</h2>
      {feed.relay_cards.length === 0 ? (
        <div className="skypooka-empty">No active relay cards.</div>
      ) : (
        feed.relay_cards.map((card) => (
          <article key={card.id} className="skypooka-card skypooka-card--relay">
            <div className="skypooka-card-top">
              <span className="skypooka-card-name">{card.subject}</span>
              <span className="skypooka-chip">{held[card.id] ? "HELD" : card.status}</span>
            </div>
            <div className="skypooka-meta">
              to <b>{card.target}</b> · {formatTime(card.updated_at)}
            </div>
            <div className="skypooka-actions">
              <button
                type="button"
                className="skypooka-btn skypooka-btn--fire"
                onClick={() => simulateFire(card.subject)}
              >
                FIRE
                {!feed.relay_backend_connected ? <span className="skypooka-sim">SIM</span> : null}
              </button>
              <button
                type="button"
                className="skypooka-btn skypooka-btn--hold"
                disabled={held[card.id]}
                onClick={() => setHeld((current) => ({ ...current, [card.id]: true }))}
              >
                {held[card.id] ? "HELD" : "HOLD"}
              </button>
              <Link
                className="skypooka-btn skypooka-btn--open"
                href={`/skypooka/doc?path=${encodeURIComponent(card.path)}`}
              >
                OPEN
              </Link>
            </div>
          </article>
        ))
      )}

      <h2 className="skypooka-section-title">2 · Receipts returned</h2>
      {feed.receipts.length === 0 ? (
        <div className="skypooka-empty">No receipts returned yet.</div>
      ) : (
        feed.receipts.map((card) => (
          <article key={card.id} className="skypooka-card">
            <div className="skypooka-card-top">
              <span className="skypooka-card-name">{card.subject}</span>
              <span className="skypooka-chip">{card.status}</span>
            </div>
            <div className="skypooka-meta">
              from <b>{card.source}</b> · {formatTime(card.updated_at)}
            </div>
            <div className="skypooka-actions">
              <Link
                className="skypooka-btn skypooka-btn--open"
                href={`/skypooka/doc?path=${encodeURIComponent(card.path)}`}
              >
                OPEN
              </Link>
            </div>
          </article>
        ))
      )}

      <h2 className="skypooka-section-title">3 · Human gates</h2>
      {feed.human_gates.length === 0 ? (
        <div className="skypooka-empty">No open human gates.</div>
      ) : (
        feed.human_gates.map((gate) => (
          <article key={gate.id} className="skypooka-card skypooka-card--gate">
            <div className="skypooka-card-top">
              <span className="skypooka-card-name">{gate.title}</span>
              <span className="skypooka-redgate">RED GATE — BEN ONLY</span>
            </div>
            <div className="skypooka-meta">
              {gate.tier} · {gate.status}
            </div>
            <div className="skypooka-meta skypooka-meta--muted">{gate.detail}</div>
          </article>
        ))
      )}

      <h2 className="skypooka-section-title">4 · Blockers</h2>
      {feed.blockers.length === 0 ? (
        <div className="skypooka-empty">No blockers.</div>
      ) : (
        feed.blockers.map((blocker) => (
          <article key={blocker.id} className="skypooka-card skypooka-card--blocker">
            <div className="skypooka-card-name">{blocker.blocker}</div>
            <div className="skypooka-meta">
              owner: <b>{blocker.owner}</b> · {blocker.source}
            </div>
            <div className="skypooka-meta skypooka-meta--muted">next: {blocker.next}</div>
          </article>
        ))
      )}

      <h2 className="skypooka-section-title">5 · Next safe actions</h2>
      {feed.top_actions.length === 0 ? (
        <div className="skypooka-empty">No queued actions.</div>
      ) : (
        feed.top_actions.map((action) => (
          <article key={`${action.object_id}-${action.label}`} className="skypooka-card skypooka-card--action">
            <div className="skypooka-card-top">
              <span className="skypooka-card-name">{action.label}</span>
              <span className="skypooka-chip">{action.priority}</span>
            </div>
            <div className="skypooka-meta">{action.detail}</div>
            <div className="skypooka-meta skypooka-meta--muted">
              {action.object_id} · {action.stage} · {action.execution_owner}
            </div>
          </article>
        ))
      )}

      <p className="skypooka-legend">
        Read-only field view. States are file-derived from repo artifacts. Human gates cannot be approved from mobile.
        Packet inbox: {feed.packet_inbox_count}. Updated {formatTime(feed.generated_at)}.
      </p>
    </>
  );
}
