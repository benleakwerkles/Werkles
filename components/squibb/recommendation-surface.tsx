"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

import type { BellowsLedgerOptionRow, BellowsPacketLedger } from "@/lib/squibb/bellows-ledger";
import { getRecommendationPageState } from "@/lib/squibb/recommendation-page-state";
import type { RecommendationKind, SquibbRecommendationSession } from "@/lib/squibb/recommendations";
import { memberFacingRecommendationSummary } from "@/lib/squibb/member-facing-recommendation-summary";
import { ConfidenceMeter } from "./confidence-meter";
import { EvidenceSection } from "./evidence-section";
import { HumanGateStrip } from "./human-gate-strip";
import { ReasoningPanel } from "./reasoning-panel";
import { RecommendationCard, recommendationIconId } from "./recommendation-card";
import { RecommendationWorkPath } from "./recommendation-work-path";
import { SiteIcon } from "@/components/foundry/site-icon";

type SquibbRecommendationSurfaceProps = {
  session: SquibbRecommendationSession;
  ledger: BellowsPacketLedger;
  initialKind?: RecommendationKind;
};

const SAVE_CLOSED_MESSAGE =
  "This page can build, save on this device, and copy your working draft. It does not contact a provider, submit an application, or start an introduction.";

export function SquibbRecommendationSurface({ session, ledger, initialKind }: SquibbRecommendationSurfaceProps) {
  const hasRankedRecommendations = session.ranked.length > 0;
  const requestedRanked = initialKind ? session.ranked.find((item) => item.kind === initialKind) : undefined;
  const requestedCatalog = initialKind ? session.catalog.find((item) => item.kind === initialKind) : undefined;
  const initialView = requestedRanked || (!requestedCatalog && hasRankedRecommendations) ? "ranked" : "catalog";
  const [selectedId, setSelectedId] = useState(
    requestedRanked?.id ?? requestedCatalog?.id ?? (hasRankedRecommendations ? session.ranked[0]?.id : session.catalog[0]?.id)
  );
  const [view, setView] = useState<"ranked" | "catalog">(initialView);
  const [optionPackets] = useState<BellowsLedgerOptionRow[]>(ledger.optionPackets);
  const visibleIntakes = useMemo(
    () => ledger.intakes.filter(
      (row, index, rows) => rows.findIndex((candidate) => candidate.intakeId === row.intakeId) === index
    ),
    [ledger.intakes]
  );
  const source = session.source ?? {
    mode: "demo",
    label: "Demo scenario",
    detail: "No saved intake was found."
  };

  const activeList = view === "ranked" ? session.ranked : session.catalog;
  const isRankedView = view === "ranked";

  const selected = useMemo(
    () => activeList.find((r) => r.id === selectedId) ?? activeList[0],
    [activeList, selectedId]
  );

  function switchView(next: "ranked" | "catalog") {
    if (next === "ranked" && !hasRankedRecommendations) return;
    setView(next);
    const first = next === "ranked" ? session.ranked[0] : session.catalog[0];
    if (first) setSelectedId(first.id);
  }

  const pageState = getRecommendationPageState({
    source,
    rankedCount: session.ranked.length,
    hasPublishedSourceDocument: Boolean(source.fedDocument)
  });
  const showLedger = visibleIntakes.length > 0 || optionPackets.length > 0;
  const selectedAnswerExcerpts = selected && source.fedDocument
    ? source.fedDocument.excerpts
        .filter(
          (excerpt) =>
            excerpt.feeds.includes(selected.kind) &&
            excerpt.text.trim().length > 0 &&
            excerpt.text !== "Not answered"
        )
        .slice(0, 4)
    : [];
  const selectedSummary = selected
    ? memberFacingRecommendationSummary(selected, selectedAnswerExcerpts)
    : null;
  const selectedPathSupport = selected
    ? source.opportunityCase?.paths.find((path) => path.kind === selected.kind)
    : null;

  return (
    <div className="squibb-rec-surface">
      <header className="squibb-rec-surface__hero panel">
        <div className="squibb-rec-hero__topline">
          <div className="squibb-rec-hero__copy">
            <p className="eyebrow">Recommendations</p>
            <h1>{isRankedView ? "Here's the strongest place to start." : "Compare another possible path."}</h1>
            <p className="squibb-rec-surface__intro">{session.squibbIntro}</p>
          </div>
          <div className="squibb-rec-hero__visual">
            <figure className="squibb-rec-hero__photo">
              <Image
                src="/assets/draft/people-v1/people-partners-cafe.png"
                alt="Two people comparing ideas together at a cafe table"
                width={900}
                height={600}
                priority
              />
              <figcaption>A useful recommendation should become a plan—not another page to study.</figcaption>
            </figure>
          </div>
        </div>

        <aside className="squibb-rec-surface__state" data-state={pageState.state} aria-label="Recommendation status">
          <div>
            <strong>{pageState.eyebrow}</strong>
            {pageState.body ? <p>{pageState.body}</p> : null}
          </div>
          <Link className="squibb-rec-surface__state-action" href="/bellows/intake">
            {pageState.actionLabel}
          </Link>
        </aside>

        {source.mode !== "latest_intake" ? (
          <p className="squibb-rec-surface__meta">
            <>
              <span><strong>Need:</strong> {session.statedNeed}</span>
              <span>
                <strong>Based on:</strong> {source.label}
                {source.detail ? <small> — {source.detail}</small> : null}
              </span>
            </>
          </p>
        ) : null}

        {selected && source.mode !== "latest_intake" ? (
          <p className="squibb-rec-surface__squibb-note" role="note">
            {selected.squibbNote}
          </p>
        ) : null}
      </header>

      {source.mode === "latest_intake" && source.symptomBlock && !source.fedDocument ? (
        <details className="squibb-rec-source panel">
          <summary className="squibb-rec-source__summary">
            <span className="eyebrow">What we heard</span>
            <strong>Your latest intake</strong>
          </summary>
          <pre>{source.symptomBlock}</pre>
        </details>
      ) : null}

      <div className="squibb-rec-surface__tabs" role="group" aria-label="Recommendation deck view">
        <button
          type="button"
          aria-pressed={view === "ranked"}
          aria-disabled={!hasRankedRecommendations}
          disabled={!hasRankedRecommendations}
          className={view === "ranked" ? "squibb-rec-tab squibb-rec-tab--active" : "squibb-rec-tab"}
          onClick={() => switchView("ranked")}
        >
          Recommended ({session.ranked.length})
        </button>
        <button
          type="button"
          aria-pressed={view === "catalog"}
          className={view === "catalog" ? "squibb-rec-tab squibb-rec-tab--active" : "squibb-rec-tab"}
          onClick={() => switchView("catalog")}
        >
          All options ({session.catalog.length})
        </button>
      </div>

      {!hasRankedRecommendations ? (
        <p className="squibb-rec-surface__deck-truth" role="status">
          <strong>Why personalized options are empty:</strong> this browser has not submitted a Werkles conversation yet.
          “All options” is the unranked catalog—not a personalized result.
        </p>
      ) : null}

      <div className="squibb-rec-surface__layout">
        <aside className="squibb-rec-surface__stack" aria-label="Recommendation cards">
          <div className="squibb-rec-stack">
            {activeList.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                selected={rec.id === selected.id}
                compact={view === "catalog"}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        </aside>

        {selected ? (
          <article
            className="squibb-rec-surface__detail squibb-rec-surface__detail--selected panel"
            aria-labelledby="squibbDetailTitle"
          >
          <header className="squibb-rec-detail__header">
            <span className="squibb-rec-detail__medallion" aria-hidden="true">
              <SiteIcon icon={recommendationIconId(selected.kind)} size="lg" />
            </span>
            <div>
              <p className="eyebrow">{isRankedView ? "Start here" : "Option to compare"}</p>
              <h2 id="squibbDetailTitle">{selected.title}</h2>
              <p>{selected.headline}</p>
              <p className="squibb-rec-detail__input-boundary">
                Based on {source.mode === "latest_intake" ? "your latest saved Intake" : source.label.toLowerCase()}.
                These inputs have not been independently verified.
              </p>
            </div>
          </header>

          {selectedSummary ? (
            <section className="squibb-rec-detail__next-steps" aria-labelledby="selectedOptionSummaryTitle">
              <h3 id="selectedOptionSummaryTitle">
                {isRankedView ? "Why this came first" : "How this option could help"}
              </h3>
              <dl>
                <div>
                  <dt>What points here</dt>
                  <dd>{selectedSummary.why}</dd>
                </div>
                <div>
                  <dt>What could change the order</dt>
                  <dd>{selectedSummary.caution}</dd>
                </div>
                <div>
                  <dt>First move</dt>
                  <dd>{selectedSummary.nextAction}</dd>
                </div>
                {selectedPathSupport ? (
                  <>
                    <div>
                      <dt>How your answers support it</dt>
                      <dd>{opportunitySupportLabel(selectedPathSupport.support)}</dd>
                    </div>
                    <div>
                      <dt>What we still do not know</dt>
                      <dd>{selectedPathSupport.loweredBy[0] ?? "Nothing in your answers ruled this out. Check the evidence before you rely on it."}</dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </section>
          ) : null}

          {selectedAnswerExcerpts.length > 0 ? (
            <details className="squibb-rec-detail__answer-trace">
              <summary id="selectedAnswerTraceTitle">Why this appeared</summary>
              <ul>
                {selectedAnswerExcerpts.map((excerpt, index) => (
                  <li key={`${excerpt.id}-${index}`}>
                    <strong>{excerpt.label}</strong>
                    <q>{excerpt.text}</q>
                  </li>
                ))}
              </ul>
              <p>Your answers can move, add, or remove options when you submit them again.</p>
            </details>
          ) : null}

          <RecommendationWorkPath
            key={selected.id}
            kind={selected.kind}
            title={selected.title}
            intakeFacts={source.fedDocument?.kind === "member_intake" ? source.fedDocument.excerpts : []}
          />

          {isRankedView ? (
            <ConfidenceMeter
              score={selected.confidence.score}
              label={selected.confidence.label}
              why={selected.confidence.why}
              variant="rules_score"
            />
          ) : null}
          <HumanGateStrip gates={selected.humanGates} />

          <ReasoningPanel reasoning={selected.reasoning} />
          <EvidenceSection items={selected.evidence} />

          <footer className="squibb-rec-detail__actions">
            <p
              id="squibbRecommendationSavingStatus"
              className="squibb-rec-detail__preview-note"
              data-status="closed"
              role="note"
            >
              <strong>Draft custody:</strong> {SAVE_CLOSED_MESSAGE}
            </p>
          </footer>
          </article>
        ) : (
          <section className="squibb-rec-surface__detail panel" aria-labelledby="squibbEmptyTitle">
            <header className="squibb-rec-detail__header">
              <p className="eyebrow">No readout yet</p>
              <h2 id="squibbEmptyTitle">No recommendation options are available</h2>
              <p>Complete or update your Werkles answers, then return here for personalized options.</p>
            </header>
          </section>
        )}
      </div>

      <section className="squibb-rec-next panel" aria-labelledby="squibbRecNextTitle">
        <div>
          <p className="eyebrow">Next: make it usable</p>
          <h2 id="squibbRecNextTitle">
            {isRankedView ? "Put your strongest idea in your Workshop." : "Put an idea you want to test in your Workshop."}
          </h2>
          <p>Turn it into a plan you can keep, change, and bring into a real conversation.</p>
        </div>
        <div className="squibb-rec-next__actions">
          <Link className="button button-dark" href="/dashboard/blueprints">Open My Workshop</Link>
        </div>
      </section>

      {showLedger ? (
        <details className="squibb-rec-ledger panel">
          <summary className="squibb-rec-ledger__header">
            <p className="eyebrow">Saved to your account</p>
            <h2 id="squibbLedgerTitle">
              {visibleIntakes.length > 1 ? `${visibleIntakes.length} recent Intakes` : "Your recent Intake"}
            </h2>
            <span>Review account history</span>
          </summary>
          <div className="squibb-rec-ledger__body" aria-labelledby="squibbLedgerTitle">
            <p><strong>Your Intake history is account-saved.</strong> Working recommendation drafts stay on this device and are not part of your account history yet.</p>
            <div className="squibb-rec-ledger__grid">
              <div>
                <h3>Recent intakes</h3>
                {visibleIntakes.length > 0 ? (
                  <ol className="squibb-rec-ledger__list">
                    {visibleIntakes.map((intake) => (
                      <li key={`${intake.intakeId}-${intake.createdAt}`} className="squibb-rec-ledger__item">
                        <strong>{intake.state}</strong>
                        <span>{intake.answeredCount} of {intake.totalQuestions} fields answered</span>
                      </li>
                    ))}
                  </ol>
                ) : <p className="squibb-rec-ledger__empty">No saved intakes yet.</p>}
              </div>
              {optionPackets.length > 0 ? (
                <div>
                  <h3>Earlier saved options</h3>
                  <ol className="squibb-rec-ledger__list">
                    {optionPackets.map((packet) => (
                      <li key={packet.packetId} className="squibb-rec-ledger__item">
                        <strong>{packet.title}</strong>
                        <span>Rules score: {packet.confidence} out of 100</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );
}

function opportunitySupportLabel(
  support: "directly_supported" | "partial_support" | "needs_more_information" | "excluded_by_rules"
) {
  if (support === "directly_supported") return "Directly supported by at least two things you told Werkles.";
  if (support === "partial_support") return "Partly supported. A relevant answer exists, but the path is not fully grounded yet.";
  if (support === "excluded_by_rules") return "Excluded by your answer or by a safety rule.";
  return "Needs more information before it should influence a decision.";
}
