"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

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

const RECOMMENDATION_COLLECTION_ID = "squibbRecommendationCollection";
const RECOMMENDATION_DETAIL_ID = "squibbRecommendationDetail";

export function SquibbRecommendationSurface({ session, ledger }: SquibbRecommendationSurfaceProps) {
  const [selectedId, setSelectedId] = useState(session.ranked[0]?.id ?? session.catalog[0]?.id);
  const [view, setView] = useState<"ranked" | "catalog">("ranked");
  const recommendationRailRef = useRef<HTMLDivElement>(null);
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
  const isExample = source.mode === "demo";
  const isPersonal = source.mode === "authenticated_profile";
  const hasRecordedActivity = ledger.intakes.length > 0 || optionPackets.length > 0;
  const showActivityLedger = hasRecordedActivity || (!isExample && !isPersonal);

  const activeList = view === "ranked" ? session.ranked : session.catalog;

  const selected = useMemo(
    () => activeList.find((r) => r.id === selectedId) ?? session.ranked[0] ?? session.catalog[0],
    [activeList, selectedId, session.catalog, session.ranked]
  );

  function switchView(next: "ranked" | "catalog") {
    const nextList = next === "ranked" ? session.ranked : session.catalog;
    const selectedStillAvailable = nextList.some((recommendation) => recommendation.id === selectedId);
    setView(next);
    if (!selectedStillAvailable) {
      const first = nextList[0];
      if (first) setSelectedId(first.id);
    }
    requestAnimationFrame(() => {
      const rail = recommendationRailRef.current;
      const selectedCard = rail?.querySelector<HTMLElement>('.squibb-rec-card[aria-pressed="true"]');
      if (selectedCard) {
        selectedCard.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
      } else {
        rail?.scrollTo({ left: 0, behavior: "auto" });
      }
    });
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

  return (
    <div className="squibb-rec-surface">
      <header className="squibb-rec-surface__hero panel">
        {isExample ? (
          <div className="squibb-rec-surface__example-custody" role="note" aria-label="Example mode">
            <div>
              <p className="eyebrow">Example mode</p>
              <p>
                <strong>This is a walkthrough, not your result.</strong>{" "}
                {hasRecordedActivity
                  ? "Recorded example activity appears below. Nothing is sent to another person or organization."
                  : "Nothing is saved from this example. Nothing is sent to another person or organization."}
              </p>
            </div>
            <Link className="button button-dark" href="/bellows/intake">
              Review the closed intake questions
            </Link>
          </div>
        ) : null}
        <p className="eyebrow">Werkles recommendations</p>
        <h1>One possible next move, explained.</h1>
        <p className="squibb-rec-surface__intro">{session.squibbIntro}</p>
        <dl className="squibb-rec-surface__context">
          <div>
            <dt>{isExample ? "Example need" : "What you need"}</dt>
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
              <small className={isPersonal ? "squibb-rec-surface__private-custody" : undefined}>
                {source.detail}
              </small>
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

      <div className="squibb-rec-surface__tabs" role="group" aria-label="Recommendation deck view">
        <button
          type="button"
          aria-pressed={view === "ranked"}
          aria-controls={RECOMMENDATION_COLLECTION_ID}
          className={view === "ranked" ? "squibb-rec-tab squibb-rec-tab--active" : "squibb-rec-tab"}
          onClick={() => switchView("ranked")}
        >
          Best next steps ({session.ranked.length})
        </button>
        <button
          type="button"
          aria-pressed={view === "catalog"}
          aria-controls={RECOMMENDATION_COLLECTION_ID}
          className={view === "catalog" ? "squibb-rec-tab squibb-rec-tab--active" : "squibb-rec-tab"}
          onClick={() => switchView("catalog")}
        >
          All options ({session.catalog.length})
        </button>
      </div>

      <p className="squibb-rec-selection-status" role="status">
        Selected recommendation: {selected.title}
      </p>

      <div className="squibb-rec-surface__layout">
        <aside
          id={RECOMMENDATION_COLLECTION_ID}
          className="squibb-rec-surface__stack"
          aria-label="Recommendation cards"
        >
          <h2 className="squibb-rec-surface__stack-title">
            {view === "ranked" ? "Best fits right now" : "Everything you can consider"}
          </h2>
          <p id="squibbRecommendationCompareCue" className="squibb-rec-surface__compare-cue">
            Scroll sideways to compare options. Selecting one updates the details below.
          </p>
          <div
            ref={recommendationRailRef}
            className="squibb-rec-stack"
            role="region"
            aria-label={`${activeList.length} recommendation options`}
            aria-describedby="squibbRecommendationCompareCue"
            tabIndex={0}
          >
            {activeList.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                selected={rec.id === selected.id}
                compact={view === "catalog"}
                detailId={RECOMMENDATION_DETAIL_ID}
                onSelect={selectRecommendation}
              />
            ))}
          </div>
        </aside>

        <article
          id={RECOMMENDATION_DETAIL_ID}
          className="squibb-rec-surface__detail panel"
          aria-labelledby="squibbDetailTitle"
        >
          <header className="squibb-rec-detail__header">
            <p className="eyebrow">Selected recommendation</p>
            <h2 id="squibbDetailTitle">{selected.title}</h2>
            <p>{selected.headline}</p>
          </header>

          <ReasoningPanel reasoning={selected.reasoning} isExample={isExample} />
          <ConfidenceMeter
            score={selected.confidence.score}
            label={selected.confidence.label}
            why={selected.confidence.why}
            variant="rules_score"
            isExample={isExample}
          />
          <div className="squibb-rec-detail__proof-grid">
            <HumanGateStrip gates={selected.humanGates} />
            <EvidenceSection items={selected.evidence} />
          </div>

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
              id="squibbRecommendationSavingStatus"
              className="squibb-rec-detail__preview-note"
              data-status={packetState.status}
              role="status"
            >
              {packetState.message}
            </div>
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
          </footer>
        </article>
      </div>

      {showActivityLedger ? (
        <section className="squibb-rec-ledger panel" aria-labelledby="squibbLedgerTitle">
          <header className="squibb-rec-ledger__header">
            <p className="eyebrow">Account activity</p>
            <h2 id="squibbLedgerTitle">
              {isExample ? "Recorded activity attached to this example." : "Recent activity tied to this intake."}
            </h2>
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
                  {isExample ? "No saved intakes are part of this example. " : "No saved intakes are available here. "}
                  <Link href="/bellows/intake">Review the closed intake questions</Link>.
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
      ) : null}
    </div>
  );
}
