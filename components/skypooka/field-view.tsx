"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useSkyPookaRefreshRegistration } from "@/components/skypooka/refresh-context";
import { fetchSkyPookaFeed } from "@/lib/skypooka/client-feed";
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

async function queueRelayAction(input: {
  action: "fire" | "hold";
  card: { id: string; subject: string; target: string; path: string };
  mode: "queue" | "simulated";
}) {
  if (input.mode === "simulated") {
    if (
      !window.confirm(
        `${input.action.toUpperCase()} ${input.card.subject}?\n\nRelay queue is unavailable on this build — this will NOT queue or send.`
      )
    ) {
      return false;
    }
    window.alert("SIMULATED: relay queue unavailable. Nothing was queued or sent.");
    return false;
  }

  const response = await fetch("/api/skypooka/fire-queue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: input.action,
      card_id: input.card.id,
      subject: input.card.subject,
      target: input.card.target,
      path: input.card.path
    })
  });
  const payload = (await response.json()) as { ok?: boolean; queue_path?: string; error?: string };
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error ?? "Queue failed");
  }
  return true;
}

export default function SkyPookaFieldView() {
  const [feed, setFeed] = useState<SkyPookaFieldFeed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [held, setHeld] = useState<Record<string, boolean>>({});

  const loadFeed = useCallback(async () => {
    const result = await fetchSkyPookaFeed({ offlineFallback: true });
    if (result.feed) {
      setFeed(result.feed);
      setStale(result.stale);
      setError(result.stale ? `Using cached feed — ${result.error}` : null);
      return;
    }
    setFeed(null);
    setStale(false);
    setError(result.error ?? "Feed failed");
  }, []);

  useSkyPookaRefreshRegistration("field-view", loadFeed);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  if (error && !feed) {
    return <div className="skypooka-error">SkyPooka feed error: {error}</div>;
  }

  if (!feed) {
    return <div className="skypooka-loading">Loading field feed…</div>;
  }

  return (
    <>
      {stale ? <div className="skypooka-banner">{error ?? "Showing cached field feed."}</div> : null}

      {feed.relay_status.mobile_fire_mode === "queue" ? (
        <div className="skypooka-banner">{feed.relay_status.note}</div>
      ) : (
        <div className="skypooka-banner">
          Relay queue unavailable — <b>FIRE</b> and <b>HOLD</b> stay <b>SIMULATED</b> on this build.
        </div>
      )}

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
                onClick={() => {
                  void queueRelayAction({
                    action: "fire",
                    card: { id: card.id, subject: card.subject, target: card.target, path: card.path },
                    mode: feed.relay_status.mobile_fire_mode
                  }).then((queued) => {
                    if (queued) {
                      setHeld((current) => ({ ...current, [card.id]: true }));
                      void loadFeed();
                    }
                  }).catch((queueError) => {
                    window.alert(queueError instanceof Error ? queueError.message : "Queue failed");
                  });
                }}
              >
                FIRE
                {feed.relay_status.mobile_fire_mode === "simulated" ? (
                  <span className="skypooka-sim">SIM</span>
                ) : null}
              </button>
              <button
                type="button"
                className="skypooka-btn skypooka-btn--hold"
                disabled={held[card.id] || card.status === "QUEUED"}
                onClick={() => {
                  void queueRelayAction({
                    action: "hold",
                    card: { id: card.id, subject: card.subject, target: card.target, path: card.path },
                    mode: feed.relay_status.mobile_fire_mode
                  }).then((queued) => {
                    if (queued) {
                      setHeld((current) => ({ ...current, [card.id]: true }));
                      void loadFeed();
                    }
                  }).catch((queueError) => {
                    window.alert(queueError instanceof Error ? queueError.message : "Queue failed");
                  });
                }}
              >
                {held[card.id] || card.status === "QUEUED" ? "QUEUED" : "HOLD"}
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

      <h2 className="skypooka-section-title">2 · Packet inbox</h2>
      {feed.packet_inbox.length === 0 ? (
        <div className="skypooka-empty">No packets in TinkerPit inbox.</div>
      ) : (
        feed.packet_inbox.map((packet) => (
          <article key={packet.packet_id} className="skypooka-card">
            <div className="skypooka-card-top">
              <span className="skypooka-card-name">{packet.action}</span>
              <span className="skypooka-chip">{packet.status}</span>
            </div>
            <div className="skypooka-meta">
              {packet.packet_id} · {formatTime(packet.created_at)}
            </div>
          </article>
        ))
      )}

      <h2 className="skypooka-section-title">3 · Receipts returned</h2>
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

      <h2 className="skypooka-section-title">4 · Human gates</h2>
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

      <h2 className="skypooka-section-title">5 · Blockers</h2>
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

      <h2 className="skypooka-section-title">6 · Next safe actions</h2>
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
        Packet inbox: {feed.packet_inbox_count}. Queued mobile actions: {feed.counts.queued_actions}. Updated{" "}
        {formatTime(feed.generated_at)}.
      </p>
    </>
  );
}
