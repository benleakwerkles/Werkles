"use client";

import { useCallback, useEffect, useState } from "react";

import type { SkyPookaFieldFeed } from "@/lib/skypooka/feed";

export default function SkyPookaGatesView() {
  const [feed, setFeed] = useState<SkyPookaFieldFeed | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    return <div className="skypooka-error">SkyPooka gates error: {error}</div>;
  }

  if (!feed) {
    return <div className="skypooka-loading">Loading gates…</div>;
  }

  return (
    <>
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
