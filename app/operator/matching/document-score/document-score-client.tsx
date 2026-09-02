"use client";

import { useEffect, useRef, useState } from "react";

import { SquibbRecommendationSurface } from "@/components/squibb/recommendation-surface";
import type { BellowsPacketLedger } from "@/lib/squibb/bellows-ledger";
import type { SquibbRecommendationSession } from "@/lib/squibb/recommendations";

import "./document-score.css";

const EMPTY_LEDGER: BellowsPacketLedger = { intakes: [], optionPackets: [] };

type ScoreboardRow = {
  kind: string;
  rank: number;
  score: number;
  disqualified: boolean;
  confidenceLabel: string;
};

const SAMPLE = `FROM: Jordan Lee — mobile detailing (real paste test)
DATE: 2026-07-16

I need help getting a business loan or a partner who can put up money for a second van and ceramic-coating gear.

I already have:
- One working van and a booked calendar through next month
- Instagram DMs asking for ceramic coating I cannot take yet
- Quote for gear: $6,800–$8,200 from a supplier in town

I do not have:
- Two years of clean P&L exports
- Equipment insurance paperwork ready

I am not trying to hire employees yet. I want the second van first. Geography is fixed — I stay in this metro.`;

export function DocumentScoreClient() {
  const [title, setTitle] = useState("Owner note + equipment quote");
  const [body, setBody] = useState(SAMPLE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SquibbRecommendationSession | null>(null);
  const [scoreboard, setScoreboard] = useState<ScoreboardRow[]>([]);
  const [meta, setMeta] = useState<string | null>(null);
  const resultsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!meta && scoreboard.length === 0 && !session) return;
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [meta, scoreboard, session]);

  async function scoreDocument() {
    setBusy(true);
    setError(null);
    setMeta(null);
    setScoreboard([]);
    setSession(null);
    try {
      const response = await fetch("/api/operator/matching/document-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body })
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        session?: SquibbRecommendationSession;
        run_id?: string;
        persisted?: boolean;
        eligible_count?: number;
        scoreboard?: ScoreboardRow[];
        smoke?: { shadow_top_eligible_path?: string | null };
      };
      if (!response.ok || !result.session) {
        setError(result.error || "Score failed.");
        return;
      }
      setSession(result.session);
      setScoreboard(Array.isArray(result.scoreboard) ? result.scoreboard : []);
      setMeta(
        `Run ${result.run_id} · persisted=${String(result.persisted)} · eligible=${String(
          result.eligible_count ?? result.session.ranked.length
        )} · top=${result.smoke?.shadow_top_eligible_path ?? "none"}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Score failed.");
    } finally {
      setBusy(false);
    }
  }

  const hasResults = Boolean(meta) || scoreboard.length > 0 || Boolean(session);

  return (
    <div className="doc-score">
      <section className="ops-card doc-score__form">
        <div className="card-heading">
          <p>Autonomous Matching</p>
          <h1>Score a real document</h1>
        </div>
        <p className="muted">
          Paste an owner note, quote, or intake. Matching runs ephemerally — nothing is written to Supabase. Results
          appear <strong>on this page only</strong> (below). They do not show on the public recommendations page.
        </p>
        <label className="doc-score__label" htmlFor="doc-score-title">
          Document title
        </label>
        <input
          id="doc-score-title"
          className="doc-score__input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <label className="doc-score__label" htmlFor="doc-score-body">
          Document body
        </label>
        <textarea
          id="doc-score-body"
          className="doc-score__textarea"
          rows={16}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
        <div className="doc-score__actions">
          <button type="button" className="button button-dark" disabled={busy} onClick={scoreDocument}>
            {busy ? "Scoring…" : "Score against Autonomous Matching"}
          </button>
        </div>
        {error ? (
          <p className="doc-score__error" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      {hasResults ? (
        <section className="ops-card doc-score__board" ref={resultsRef} aria-live="polite">
          <div className="card-heading">
            <p>Scoreboard</p>
            <h2>Rules scores from this paste</h2>
          </div>
          {meta ? <p className="doc-score__meta">{meta}</p> : null}
          {scoreboard.length > 0 ? (
            <table className="doc-score__table">
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">Path</th>
                  <th scope="col">Rules score</th>
                  <th scope="col">Band</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.map((row) => (
                  <tr key={row.kind} className={row.disqualified ? "doc-score__row--out" : undefined}>
                    <td>{row.rank}</td>
                    <td>
                      <code>{row.kind}</code>
                    </td>
                    <td>
                      <strong>{Math.round(row.score)} out of 100</strong>
                    </td>
                    <td>{row.confidenceLabel}</td>
                    <td>{row.disqualified ? "Ruled out" : "Eligible"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="doc-score__empty">Matching returned a session but no scoreboard rows.</p>
          )}
          {session && session.ranked.length === 0 ? (
            <p className="doc-score__empty" role="status">
              Every path was ruled out for this paste, so the recommendation cards stay empty. Use the scoreboard above —
              that is still a real Matching result.
            </p>
          ) : null}
        </section>
      ) : null}

      {session && session.ranked.length > 0 ? (
        <div className="doc-score__result squibb-rec-page">
          <SquibbRecommendationSurface session={session} ledger={EMPTY_LEDGER} />
        </div>
      ) : null}
    </div>
  );
}
