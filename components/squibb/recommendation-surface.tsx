"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { BellowsLedgerOptionRow, BellowsPacketLedger } from "@/lib/squibb/bellows-ledger";
import type { SquibbRecommendationSession } from "@/lib/squibb/recommendations";
import { ConfidenceMeter } from "./confidence-meter";
import { EvidenceSection } from "./evidence-section";
import { HumanGateStrip } from "./human-gate-strip";
import { ReasoningPanel } from "./reasoning-panel";
import { RecommendationCard } from "./recommendation-card";

type SquibbRecommendationSurfaceProps = {
  session: SquibbRecommendationSession;
  ledger: BellowsPacketLedger;
};

type RecommendationPacketState =
  | { status: "idle"; message: string }
  | { status: "closed"; message: string }
  | { status: "error"; message: string };

/** Closed until authenticated owner binding exists. Server still returns 403. */
const SAVE_CLOSED_BETA = true;

const SAVE_CLOSED_MESSAGE =
  "Saving is unavailable during this beta. Nothing is sent to another person or organization from these controls.";

export function SquibbRecommendationSurface({ session, ledger }: SquibbRecommendationSurfaceProps) {
  const [selectedId, setSelectedId] = useState(session.ranked[0]?.id ?? session.catalog[0]?.id);
  const [view, setView] = useState<"ranked" | "catalog">("ranked");
  const [optionPackets] = useState<BellowsLedgerOptionRow[]>(ledger.optionPackets);
  const [packetState, setPacketState] = useState<RecommendationPacketState>({
    status: "closed",
    message: SAVE_CLOSED_MESSAGE
  });
  const source = session.source ?? {
    mode: "demo",
    label: "Demo scenario",
    detail: "No saved intake was found."
  };

  const activeList = view === "ranked" ? session.ranked : session.catalog;

  const selected = useMemo(
    () => activeList.find((r) => r.id === selectedId) ?? session.ranked[0] ?? session.catalog[0],
    [activeList, selectedId, session.catalog, session.ranked]
  );

  function switchView(next: "ranked" | "catalog") {
    setView(next);
    const first = next === "ranked" ? session.ranked[0] : session.catalog[0];
    if (first) setSelectedId(first.id);
    setPacketState({
      status: "closed",
      message: SAVE_CLOSED_MESSAGE
    });
  }

  function selectRecommendation(id: string) {
    setSelectedId(id);
    setPacketState({
      status: "closed",
      message: SAVE_CLOSED_MESSAGE
    });
  }

  if (!selected) return null;

  const showIntakePrompt = source.mode === "demo" || ledger.intakes.length === 0;

  return (
    <div className="squibb-rec-surface">
      {showIntakePrompt ? (
        <section className="squibb-rec-surface__intake-cta panel" aria-labelledby="squibbIntakeCtaTitle">
          <p className="eyebrow">Start with what is real</p>
          <h2 id="squibbIntakeCtaTitle">See how recommendations work.</h2>
          <p>
            The options below are an example. You can still complete an intake, but this public beta will not connect it
            to this page yet.
          </p>
          <div className="member-selected-surface__actions">
            <Link className="button button-dark" href="/bellows/intake">
              Start concierge intake
            </Link>
            <Link className="button button-outline" href="/bellows/recommendations/test-case-0">
              See an example
            </Link>
          </div>
        </section>
      ) : null}

      <header className="squibb-rec-surface__hero panel">
        <p className="eyebrow">Werkles recommendations</p>
        <h1>What should you do next?</h1>
        <p className="squibb-rec-surface__intro">{session.squibbIntro}</p>
        <dl className="squibb-rec-surface__context">
          <div>
            <dt>What you need</dt>
            <dd>{session.statedNeed}</dd>
          </div>
          <div>
            <dt>What matters here</dt>
            <dd>{session.operatorContext}</dd>
          </div>
          <div>
            <dt>What this is based on</dt>
            <dd>
              {source.label}
              <small>{source.detail}</small>
            </dd>
          </div>
        </dl>
        <p className="squibb-rec-surface__squibb-note" role="note">
          {selected.squibbNote}
        </p>
      </header>

      {source.mode === "latest_intake" && source.symptomBlock ? (
        <section className="squibb-rec-source panel" aria-labelledby="squibbSourceTitle">
          <p className="eyebrow">What we heard</p>
          <h2 id="squibbSourceTitle">Your latest intake</h2>
          <pre>{source.symptomBlock}</pre>
        </section>
      ) : null}

      <div className="squibb-rec-surface__tabs" role="tablist" aria-label="Recommendation deck">
        <button
          type="button"
          role="tab"
          aria-selected={view === "ranked"}
          className={view === "ranked" ? "squibb-rec-tab squibb-rec-tab--active" : "squibb-rec-tab"}
          onClick={() => switchView("ranked")}
        >
          Best next steps ({session.ranked.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "catalog"}
          className={view === "catalog" ? "squibb-rec-tab squibb-rec-tab--active" : "squibb-rec-tab"}
          onClick={() => switchView("catalog")}
        >
          All options ({session.catalog.length})
        </button>
      </div>

      <div className="squibb-rec-surface__layout">
        <aside className="squibb-rec-surface__stack" aria-label="Recommendation cards">
          <h2 className="squibb-rec-surface__stack-title">
            {view === "ranked" ? "Best fits right now" : "Everything you can consider"}
          </h2>
          <div className="squibb-rec-stack">
            {activeList.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                selected={rec.id === selected.id}
                compact={view === "catalog"}
                onSelect={selectRecommendation}
              />
            ))}
          </div>
        </aside>

        <article className="squibb-rec-surface__detail panel" aria-labelledby="squibbDetailTitle">
          <header className="squibb-rec-detail__header">
            <p className="eyebrow">Selected recommendation</p>
            <h2 id="squibbDetailTitle">{selected.title}</h2>
            <p>{selected.headline}</p>
          </header>

          <ReasoningPanel reasoning={selected.reasoning} />
          <ConfidenceMeter
            score={selected.confidence.score}
            label={selected.confidence.label}
            why={selected.confidence.why}
            variant="rules_score"
          />
          <EvidenceSection items={selected.evidence} />
          <HumanGateStrip gates={selected.humanGates} />

          <footer className="squibb-rec-detail__actions">
            <dl className="squibb-rec-detail__dispatch">
              <div>
                <dt>Suggested support</dt>
                <dd>{selected.suggestedAgent}</dd>
              </div>
              {selected.suggestedTool ? (
                <div>
                  <dt>Verification</dt>
                  <dd>{selected.suggestedTool}</dd>
                </div>
              ) : null}
            </dl>
            <div
              className="squibb-rec-detail__buttons"
              role="group"
              aria-label="Recommendation actions"
              aria-describedby="squibbRecommendationSavingStatus"
            >
              <button type="button" className="button button-dark" disabled={SAVE_CLOSED_BETA} aria-disabled="true">
                Save this option
              </button>
              <button type="button" className="button button-outline" disabled={SAVE_CLOSED_BETA} aria-disabled="true">
                {selected.keepOriginalPathLabel}
              </button>
              <button type="button" className="button button-ghost" disabled={SAVE_CLOSED_BETA} aria-disabled="true">
                Ask what proof is needed
              </button>
            </div>
            <p
              id="squibbRecommendationSavingStatus"
              className="squibb-rec-detail__preview-note"
              data-status={packetState.status}
              role="status"
            >
              {packetState.message}
            </p>
          </footer>
        </article>
      </div>

      <section className="squibb-rec-ledger panel" aria-labelledby="squibbLedgerTitle">
        <header className="squibb-rec-ledger__header">
          <p className="eyebrow">Saved activity</p>
          <h2 id="squibbLedgerTitle">Your recent intake and saved options</h2>
        </header>
        <div className="squibb-rec-ledger__grid">
          <div>
            <h3>Recent intakes</h3>
            {ledger.intakes.length > 0 ? (
              <ol className="squibb-rec-ledger__list">
                {ledger.intakes.map((intake) => (
                  <li key={intake.intakeId} className="squibb-rec-ledger__item">
                    <strong>{intake.state}</strong>
                    <span>
                      {intake.answeredCount} of {intake.totalQuestions} fields answered
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="squibb-rec-ledger__empty">
                No saved intakes yet.{" "}
                <Link href="/bellows/intake">Start an intake</Link> to create the first one.
              </p>
            )}
          </div>
          <div>
            <h3>Saved options</h3>
            {optionPackets.length > 0 ? (
              <ol className="squibb-rec-ledger__list">
                {optionPackets.map((packet) => (
                  <li key={packet.packetId} className="squibb-rec-ledger__item">
                    <strong>{packet.title}</strong>
                    <span>Rules score: {packet.confidence} out of 100</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="squibb-rec-ledger__empty">No recommendation options saved yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
