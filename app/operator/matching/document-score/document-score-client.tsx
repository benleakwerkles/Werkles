"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { SquibbRecommendationSurface } from "@/components/squibb/recommendation-surface";
import type { BellowsPacketLedger } from "@/lib/squibb/bellows-ledger";
import type { SquibbRecommendationSession } from "@/lib/squibb/recommendations";

import "./document-score.css";

const EMPTY_LEDGER: BellowsPacketLedger = { intakes: [], optionPackets: [] };

type ScoreboardRow = {
  kind: string;
  label: string;
  rank: number;
  score: number;
  disqualified: boolean;
  ruleSupportBand: string;
  why: string;
};

type DocumentScoreResponse = {
  error?: string;
  session?: SquibbRecommendationSession;
  run_id?: string;
  persisted?: boolean;
  not_ruled_out_count?: number;
  scoreboard?: ScoreboardRow[];
};

const SAMPLE = `FROM: Jordan Lee - mobile detailing (example paste)
DATE: 2026-07-16

I need help getting a small business loan or a partner who can put up money for a second van and ceramic-coating gear.

I already have:
- One working van and a booked calendar through next month
- Instagram messages asking for ceramic coating I cannot take yet
- A local supplier quote for $6,800-$8,200

I do not have:
- Two years of clean profit-and-loss exports
- Equipment insurance paperwork ready

I am not trying to hire employees yet. I want the second van first. I am staying in this metro.`;

export function DocumentScoreClient() {
  const [title, setTitle] = useState("Owner note + equipment quote");
  const [body, setBody] = useState(SAMPLE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SquibbRecommendationSession | null>(null);
  const [scoreboard, setScoreboard] = useState<ScoreboardRow[]>([]);
  const [meta, setMeta] = useState<{ runId: string; notRuledOutCount: number } | null>(null);
  const resultsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!meta && scoreboard.length === 0 && !session) return;
    resultsRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
  }, [meta, scoreboard, session]);

  async function scoreDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      const result = (await response.json().catch(() => ({}))) as DocumentScoreResponse;

      if (!response.ok || !result.session) {
        setError(result.error || "The document could not be scored.");
        return;
      }

      const rows = Array.isArray(result.scoreboard) ? result.scoreboard : [];
      setSession(result.session);
      setScoreboard(rows);
      setMeta({
        runId: result.run_id || "local",
        notRuledOutCount: result.not_ruled_out_count ?? result.session.ranked.length
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The document could not be scored.");
    } finally {
      setBusy(false);
    }
  }

  const hasResults = Boolean(meta) || scoreboard.length > 0 || Boolean(session);

  return (
    <div className="doc-score">
      <section className="ops-card doc-score__form">
        <div className="card-heading">
          <p>Matching rules</p>
          <h1>Score a document</h1>
        </div>
        <p className="muted">
          Paste an owner note, quote, or intake. You will see the rules scores below. Nothing is saved.
        </p>
        <form onSubmit={scoreDocument} aria-busy={busy}>
          <label className="doc-score__label" htmlFor="doc-score-title">
            Document title
          </label>
          <input
            id="doc-score-title"
            className="doc-score__input"
            value={title}
            maxLength={200}
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
            minLength={40}
            maxLength={20_000}
            required
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="doc-score__actions">
            <button type="submit" className="button button-dark" disabled={busy || body.trim().length < 40}>
              {busy ? "Scoring..." : "Score this document"}
            </button>
          </div>
        </form>
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
            <h2>What the rules found</h2>
          </div>
          {meta ? (
            <p className="doc-score__meta">
              Not saved · {meta.notRuledOutCount} paths not ruled out by these rules · run <code>{meta.runId}</code>
            </p>
          ) : null}
          <p className="doc-score__limit" role="note">
            These scores show how strongly the current rules react to this paste. They are not probabilities, accuracy
            ratings, eligibility decisions, verification, or predicted outcomes. A path not ruled out still requires
            the human and proof checks shown below.
          </p>
          {scoreboard.length > 0 ? (
            <div className="doc-score__table-wrap">
              <table className="doc-score__table">
                <caption className="sr-only">Rules scores and limits for the pasted document</caption>
                <thead>
                  <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">Path</th>
                    <th scope="col">Rules score</th>
                    <th scope="col">Rule-support band</th>
                    <th scope="col">Rule filter</th>
                    <th scope="col">Why this row</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreboard.map((row) => (
                    <tr key={row.kind} className={row.disqualified ? "doc-score__row--out" : undefined}>
                      <td>{row.rank}</td>
                      <td>{row.label}</td>
                      <td>
                        <strong>{Math.round(row.score)} out of 100</strong>
                      </td>
                      <td>{row.ruleSupportBand}</td>
                      <td>{row.disqualified ? "Ruled out" : "Not ruled out"}</td>
                      <td className="doc-score__why">{row.why}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="doc-score__empty">No score rows were returned.</p>
          )}
          {session && session.ranked.length === 0 ? (
            <p className="doc-score__empty" role="status">
              Every path was ruled out by these rules. The scoreboard above is still the complete result.
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
