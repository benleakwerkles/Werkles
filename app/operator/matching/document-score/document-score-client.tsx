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

type SuccessfulDocumentScoreResponse = {
  success: true;
  session: SquibbRecommendationSession;
  run_id: string;
  persisted: false;
  not_ruled_out_count: number;
  scoreboard: ScoreboardRow[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isScoreboardRow(value: unknown): value is ScoreboardRow {
  return (
    isRecord(value) &&
    typeof value.kind === "string" &&
    typeof value.label === "string" &&
    Number.isInteger(value.rank) &&
    typeof value.score === "number" &&
    Number.isFinite(value.score) &&
    typeof value.disqualified === "boolean" &&
    (value.ruleSupportBand === "low" || value.ruleSupportBand === "medium" || value.ruleSupportBand === "high") &&
    typeof value.why === "string"
  );
}

function isSuccessfulDocumentScore(value: unknown): value is SuccessfulDocumentScoreResponse {
  if (!isRecord(value) || !isRecord(value.session)) return false;
  const session = value.session as unknown as SquibbRecommendationSession;
  const rows = value.scoreboard;
  return (
    value.success === true &&
    value.persisted === false &&
    typeof value.run_id === "string" &&
    value.run_id.length > 0 &&
    typeof value.not_ruled_out_count === "number" &&
    Number.isInteger(value.not_ruled_out_count) &&
    value.not_ruled_out_count >= 0 &&
    Array.isArray(rows) &&
    rows.every(isScoreboardRow) &&
    session.version === "v1" &&
    Array.isArray(session.ranked) &&
    Array.isArray(session.catalog) &&
    session.source?.mode === "ephemeral_document" &&
    !session.source.fedDocument &&
    value.not_ruled_out_count === session.ranked.length &&
    value.not_ruled_out_count === rows.filter((row) => !row.disqualified).length
  );
}

function responseError(value: unknown) {
  return isRecord(value) && typeof value.error === "string" ? value.error : null;
}

function attachLocalDocument(
  session: SquibbRecommendationSession,
  runId: string,
  title: string,
  body: string
): SquibbRecommendationSession {
  if (!session.source) return session;
  return {
    ...session,
    source: {
      ...session.source,
      fedDocument: {
        id: runId,
        title: title.trim() || "Pasted document",
        kind: "uploaded_document",
        summary: "The redacted document used for this one-time score.",
        body,
        excerpts: []
      }
    }
  };
}

const SAMPLE = `FROM: Mobile detailing owner (example paste)
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
  const [custodyConfirmed, setCustodyConfirmed] = useState(false);
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
        body: JSON.stringify({ title, body, custody_confirmed: custodyConfirmed })
      });
      const result: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(responseError(result) || "The document could not be scored.");
        return;
      }
      if (!isSuccessfulDocumentScore(result)) {
        setError("The score response failed its privacy check. No result was displayed.");
        return;
      }

      const localSession = attachLocalDocument(result.session, result.run_id, title, body);
      setSession(localSession);
      setScoreboard(result.scoreboard);
      setMeta({
        runId: result.run_id,
        notRuledOutCount: result.not_ruled_out_count
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
          Paste a redacted owner note, quote, or intake. Your paste is sent to this internal Werkles endpoint for a
          one-time in-memory score. This feature does not persist it or forward it to an AI provider or external
          recipient.
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
            onChange={(event) => {
              setTitle(event.target.value);
              setCustodyConfirmed(false);
            }}
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
            onChange={(event) => {
              setBody(event.target.value);
              setCustodyConfirmed(false);
            }}
          />
          <p className="doc-score__custody-warning">
            Remove names and contact details, credentials or tokens, government IDs, account or card numbers, and
            medical, immigration, background-report, or provider identity records before scoring.
          </p>
          <label className="doc-score__custody-check">
            <input
              type="checkbox"
              checked={custodyConfirmed}
              required
              onChange={(event) => setCustodyConfirmed(event.target.checked)}
            />
            <span>I am authorized to use this document and removed sensitive identifiers.</span>
          </label>
          <div className="doc-score__actions">
            <button
              type="submit"
              className="button button-dark"
              disabled={busy || body.trim().length < 40 || !custodyConfirmed}
            >
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
        <section className="ops-card doc-score__board" ref={resultsRef}>
          <div className="card-heading">
            <p>Scoreboard</p>
            <h2>What the rules found</h2>
          </div>
          {meta ? (
            <p className="doc-score__meta" role="status" aria-live="polite">
              Not saved · {meta.notRuledOutCount} paths not ruled out by these rules · run <code>{meta.runId}</code>
            </p>
          ) : null}
          <p className="doc-score__limit" role="note">
            These scores show how strongly the current rules react to this paste. They are not probabilities, accuracy
            ratings, eligibility decisions, verification, or predicted outcomes. A path not ruled out still requires
            the human and proof checks shown below.
          </p>
          <p id="docScoreTableHelp" className="doc-score__key">
            <strong>How to read it:</strong> Rank is the relative rule order. Score and support band show the strength
            of the rules reaction. The filter says whether a hard rule stopped the path; ruled-out rows remain visible
            for review.
          </p>
          <p id="docScoreScrollCue" className="doc-score__scroll-cue">
            Scroll sideways to see every column.
          </p>
          {scoreboard.length > 0 ? (
            <div
              className="doc-score__table-wrap"
              role="region"
              aria-label="Document score table"
              aria-describedby="docScoreTableHelp docScoreScrollCue"
              tabIndex={0}
            >
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
                      <th scope="row" className="doc-score__path">
                        {row.label}
                      </th>
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
