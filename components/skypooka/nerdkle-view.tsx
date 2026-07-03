"use client";

import { useCallback, useEffect, useState } from "react";

import type { SkyPookaFieldFeed } from "@/lib/skypooka/feed";

type NerdkleSummary = {
  object_count: number;
  receipt_count: number;
  stages: Record<string, number>;
  events_path: string;
};

export default function SkyPookaNerdkleView() {
  const [feed, setFeed] = useState<SkyPookaFieldFeed | null>(null);
  const [summary, setSummary] = useState<NerdkleSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [feedResponse, summaryResponse] = await Promise.all([
        fetch("/api/skypooka/feed", { cache: "no-store" }),
        fetch("/api/nerdkle/snapshot", { cache: "no-store" })
      ]);
      const feedPayload = (await feedResponse.json()) as SkyPookaFieldFeed | { ok: false; error?: string };
      const summaryPayload = (await summaryResponse.json()) as {
        ok?: boolean;
        counts?: { objects: number; receipts: number };
        stages?: Record<string, number>;
      };

      if (!feedResponse.ok || !("ok" in feedPayload) || feedPayload.ok !== true) {
        throw new Error("error" in feedPayload ? feedPayload.error ?? "Feed failed" : "Feed failed");
      }

      setFeed(feedPayload);
      setSummary({
        object_count: summaryPayload.counts?.objects ?? 0,
        receipt_count: summaryPayload.counts?.receipts ?? 0,
        stages: summaryPayload.stages ?? {},
        events_path: "data/organism/nerdkle/events.jsonl"
      });
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) {
    return <div className="skypooka-error">SkyPooka Nerdkle error: {error}</div>;
  }

  if (!feed || !summary) {
    return <div className="skypooka-loading">Loading Nerdkle…</div>;
  }

  return (
    <>
      {feed.operator_focus ? (
        <section className="skypooka-focus" aria-label="Operator focus">
          <div className="skypooka-focus-label">Operator focus</div>
          <div className="skypooka-card-name">{feed.operator_focus.next_action}</div>
          <div className="skypooka-meta">
            {feed.operator_focus.object_id} · {feed.operator_focus.stage}
          </div>
        </section>
      ) : null}

      <dl className="skypooka-stat-grid" aria-label="Nerdkle counts">
        <div className="skypooka-stat">
          <dt>Objects</dt>
          <dd>{summary.object_count}</dd>
        </div>
        <div className="skypooka-stat">
          <dt>Receipts</dt>
          <dd>{summary.receipt_count}</dd>
        </div>
      </dl>

      <h2 className="skypooka-section-title">Stages</h2>
      {Object.keys(summary.stages).length === 0 ? (
        <div className="skypooka-empty">No Nerdkle objects yet.</div>
      ) : (
        Object.entries(summary.stages).map(([stage, count]) => (
          <article key={stage} className="skypooka-card">
            <div className="skypooka-card-top">
              <span className="skypooka-card-name">{stage.replace(/_/g, " ")}</span>
              <span className="skypooka-chip">{count}</span>
            </div>
          </article>
        ))
      )}

      <h2 className="skypooka-section-title">Top actions</h2>
      {feed.top_actions.length === 0 ? (
        <div className="skypooka-empty">No queued actions.</div>
      ) : (
        feed.top_actions.slice(0, 4).map((action) => (
          <article key={`${action.object_id}-${action.label}`} className="skypooka-card skypooka-card--action">
            <div className="skypooka-card-top">
              <span className="skypooka-card-name">{action.label}</span>
              <span className="skypooka-chip">{action.priority}</span>
            </div>
            <div className="skypooka-meta">{action.detail}</div>
          </article>
        ))
      )}

      <p className="skypooka-legend">
        Full Nerdkle console remains at <code>/nerdkle</code>. SkyPooka keeps the mobile operator slice read-only and
        file-derived.
      </p>
    </>
  );
}
