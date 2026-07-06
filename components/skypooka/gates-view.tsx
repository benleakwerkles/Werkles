"use client";

import { useCallback, useEffect, useState } from "react";

import { useSkyPookaRefreshRegistration } from "@/components/skypooka/refresh-context";
import { fetchSkyPookaFeed } from "@/lib/skypooka/client-feed";
import type { SkyPookaFieldFeed } from "@/lib/skypooka/feed";

export default function SkyPookaGatesView() {
  const [feed, setFeed] = useState<SkyPookaFieldFeed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

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

  useSkyPookaRefreshRegistration("gates-view", loadFeed);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  if (error && !feed) {
    return <div className="skypooka-error">SkyPooka gates error: {error}</div>;
  }

  if (!feed) {
    return <div className="skypooka-loading">Loading gates…</div>;
  }

  return (
    <>
      {stale ? <div className="skypooka-banner">{error ?? "Showing cached gate feed."}</div> : null}

      <div className="skypooka-banner">
        Mobile is read-only for human gates. Approval requires Ben&apos;s exact phrase on a desktop gate surface.
      </div>

      {feed.effective_gate ? (
        <section className="skypooka-focus" aria-label="Effective gate">
          <div className="skypooka-focus-label">Effective gate</div>
          <div className="skypooka-card-name">{feed.effective_gate}</div>
        </section>
      ) : null}

      {feed.human_gates.length === 0 ? (
        <div className="skypooka-empty">No open human gates in the active queue.</div>
      ) : (
        feed.human_gates.map((gate) => (
          <article key={gate.id} className="skypooka-card skypooka-card--gate">
            <div className="skypooka-card-top">
              <span className="skypooka-card-name">{gate.title}</span>
              <span className="skypooka-redgate">BEN ONLY</span>
            </div>
            <div className="skypooka-meta">
              {gate.tier} · {gate.status}
            </div>
            <div className="skypooka-meta skypooka-meta--muted">{gate.detail}</div>
          </article>
        ))
      )}
    </>
  );
}
