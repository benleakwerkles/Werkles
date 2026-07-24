"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";

import type { BellowsLedgerOptionRow, BellowsPacketLedger } from "@/lib/squibb/bellows-ledger";
import { followContinuationTarget } from "@/lib/squibb/continuation-focus";
import type { SquibbRecommendationSession } from "@/lib/squibb/recommendations";
import { recommendationSelectionUpdate } from "@/lib/squibb/recommendation-selection";
import { ConfidenceMeter } from "./confidence-meter";
import { EvidenceSection } from "./evidence-section";
import { HumanGateStrip } from "./human-gate-strip";
import { ReasoningPanel } from "./reasoning-panel";
import { RecommendationCard } from "./recommendation-card";
import { SourceDocumentPanel } from "./source-document-panel";

type SquibbRecommendationSurfaceProps = {
  session: SquibbRecommendationSession;
  ledger: BellowsPacketLedger;
  continuationAction?: {
    label: string;
    href: string;
    focusTargetId?: string;
  };
};

const SAVE_CLOSED_MESSAGE = "Saving is closed in this beta. Nothing is sent.";

const RECOMMENDATION_COLLECTION_ID = "squibbRecommendationCollection";
const RECOMMENDATION_COLLECTION_TITLE_ID = "squibbRecommendationCollectionTitle";
const RECOMMENDATION_DETAIL_ID = "squibbRecommendationDetail";
const RECOMMENDATION_EVIDENCE_ID = "squibbRecommendationEvidence";

export function SquibbRecommendationSurface({
  session,
  ledger,
  continuationAction
}: SquibbRecommendationSurfaceProps) {
  const [selectedId, setSelectedId] = useState(session.ranked[0]?.id ?? session.catalog[0]?.id);
  const [view, setView] = useState<"ranked" | "catalog">("ranked");
  const [selectionAnnouncement, setSelectionAnnouncement] = useState("");
  const recommendationRailRef = useRef<HTMLDivElement>(null);
  const evidenceDetailsRef = useRef<HTMLDetailsElement>(null);
  const [optionPackets] = useState<BellowsLedgerOptionRow[]>(ledger.optionPackets);
  const source = session.source ?? {
    mode: "demo",
    label: "Demo scenario",
    detail: "No saved intake was found."
  };
  const isExample = source.mode === "demo";
  const isPersonal = source.mode === "authenticated_profile";
  const isEphemeralDocument = source.mode === "ephemeral_document";
  const savingStatusMessage = isPersonal
    ? "This private result was not saved or sent."
    : SAVE_CLOSED_MESSAGE;
  const hasRecordedActivity = ledger.intakes.length > 0 || optionPackets.length > 0;
  const showActivityLedger =
    !isEphemeralDocument && (hasRecordedActivity || (!isExample && !isPersonal));

  const activeList = view === "ranked" ? session.ranked : session.catalog;

  const selected = useMemo(
    () => activeList.find((r) => r.id === selectedId) ?? session.ranked[0] ?? session.catalog[0],
    [activeList, selectedId, session.catalog, session.ranked]
  );

  function switchView(next: "ranked" | "catalog") {
    const nextList = next === "ranked" ? session.ranked : session.catalog;
    const selectedStillAvailable = nextList.some((recommendation) => recommendation.id === selectedId);
    setView(next);
    setSelectionAnnouncement("");
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
  }

  function selectRecommendation(id: string) {
    const update = recommendationSelectionUpdate(selected.id, id, activeList);
    if (!update) return;
    setSelectedId(update.id);
    setSelectionAnnouncement(update.announcement);
  }

  function reviewProofAndGaps() {
    const details = evidenceDetailsRef.current;
    if (!details) return;
    details.open = true;
    const summary = details.querySelector<HTMLElement>("summary");
    summary?.focus({ preventScroll: true });
    details.scrollIntoView({ behavior: "auto", block: "nearest" });
  }

  function followContinuation(event: MouseEvent<HTMLAnchorElement>) {
    followContinuationTarget(continuationAction?.focusTargetId, event);
  }

  if (!selected) return null;

  return (
    <div className="squibb-rec-surface">
      <header className="squibb-rec-surface__hero panel">
        {isPersonal ? (
          <div className="squibb-rec-surface__personal-custody" role="note" aria-label="Private recommendation">
            <p className="eyebrow">Private account result</p>
            <p>
              <strong>Built from your saved profile.</strong> Loaded only after this account was confirmed. This result was
              not saved or sent.
            </p>
          </div>
        ) : null}
        {isExample ? (
          <div className="squibb-rec-surface__example-custody" role="note" aria-label="Example mode">
            <p className="eyebrow">Example mode</p>
            <p>
              <strong>This is a walkthrough, not your result.</strong>{" "}
              {hasRecordedActivity
                ? "Recorded example activity appears below. Nothing is sent to another person or organization."
                : "Nothing is saved from this example. Nothing is sent to another person or organization."}
            </p>
          </div>
        ) : null}
        <p className="eyebrow">{isPersonal ? "Private, rules-based result" : "Werkles recommendations"}</p>
        <h1>{isPersonal ? "Your private recommendation" : "One possible next move, explained."}</h1>
        <p className="squibb-rec-surface__intro">{session.squibbIntro}</p>
        <dl className="squibb-rec-surface__context">
          <div>
            <dt>{isExample ? "Example situation" : "Your situation"}</dt>
            <dd>
              {session.statedNeed}
              <small>{session.operatorContext}</small>
            </dd>
          </div>
          <div>
            <dt>Based on</dt>
            <dd>
              {source.label}
              <small className={isPersonal ? "squibb-rec-surface__private-custody" : undefined}>
                {source.detail}
              </small>
            </dd>
          </div>
        </dl>
      </header>

      {source.fedDocument ? <SourceDocumentPanel source={source} selectedKind={selected.kind} /> : null}

      {source.mode === "latest_intake" && source.symptomBlock && !source.fedDocument ? (
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

      <p className="squibb-rec-selection-status" role="status" aria-atomic="true">
        {selectionAnnouncement}
      </p>

      <div className="squibb-rec-surface__layout">
        <aside
          id={RECOMMENDATION_COLLECTION_ID}
          className="squibb-rec-surface__stack"
          aria-labelledby={RECOMMENDATION_COLLECTION_TITLE_ID}
        >
          <h2 id={RECOMMENDATION_COLLECTION_TITLE_ID} className="squibb-rec-surface__stack-title">
            {view === "ranked" ? "Best fits right now" : "Everything you can consider"}
          </h2>
          <p id="squibbRecommendationCompareCue" className="squibb-rec-surface__compare-cue">
            Swipe or scroll, then pick one to explore.
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
            <p className="eyebrow">Selected</p>
            <h2 id="squibbDetailTitle">{selected.title}</h2>
            <p>{selected.headline}</p>
            <p className="squibb-rec-surface__squibb-note" role="note">
              {selected.squibbNote}
            </p>
          </header>

          <ConfidenceMeter
            score={selected.confidence.score}
            label={selected.confidence.label}
            why={selected.confidence.why}
            variant="rules_score"
            isExample={isExample}
          />
          <ReasoningPanel reasoning={selected.reasoning} isExample={isExample} />
          <div className="squibb-rec-detail__proof-grid">
            <HumanGateStrip gates={selected.humanGates} />
            <EvidenceSection
              items={selected.evidence}
              detailsId={RECOMMENDATION_EVIDENCE_ID}
              detailsRef={evidenceDetailsRef}
            />
          </div>

          <footer className="squibb-rec-detail__actions">
            <dl className="squibb-rec-detail__dispatch">
              <div>
                <dt>Start with</dt>
                <dd>{selected.suggestedAgent}</dd>
              </div>
              {selected.suggestedTool ? (
                <div>
                  <dt>Helpful check or prep</dt>
                  <dd>{selected.suggestedTool}</dd>
                </div>
              ) : null}
            </dl>
            {isPersonal ? (
              <div className="squibb-rec-detail__buttons" aria-label="Private recommendation actions">
                <Link
                  className="button button-dark"
                  href="/dashboard/profile?next=%2Fbellows%2Frecommendations"
                >
                  Update my profile
                </Link>
              </div>
            ) : (
              <div
                className="squibb-rec-detail__buttons"
                role="group"
                aria-label="Available recommendation actions"
              >
                {continuationAction ? (
                  <a className="button button-dark" href={continuationAction.href} onClick={followContinuation}>
                    {continuationAction.label}
                  </a>
                ) : null}
                <button
                  type="button"
                  className="button button-ghost"
                  aria-controls={RECOMMENDATION_EVIDENCE_ID}
                  onClick={reviewProofAndGaps}
                >
                  Check proof and gaps
                </button>
              </div>
            )}
            <p
              id="squibbRecommendationSavingStatus"
              className="squibb-rec-detail__preview-note"
              role="note"
            >
              {savingStatusMessage}
            </p>
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
