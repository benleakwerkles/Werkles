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

type RecommendationPacketAction = "pursue_path" | "keep_original_path" | "request_more_proof";

type RecommendationPacketState =
  | { status: "idle"; message: string }
  | { status: "saving"; message: string }
  | {
      status: "saved";
      message: string;
      packetId: string;
      packetPath: string;
      speakerEntryPath: string;
    }
  | { status: "error"; message: string };

export function SquibbRecommendationSurface({ session, ledger }: SquibbRecommendationSurfaceProps) {
  const [selectedId, setSelectedId] = useState(session.ranked[0]?.id ?? session.catalog[0]?.id);
  const [view, setView] = useState<"ranked" | "catalog">("ranked");
  const [optionPackets, setOptionPackets] = useState<BellowsLedgerOptionRow[]>(ledger.optionPackets);
  const [packetState, setPacketState] = useState<RecommendationPacketState>({
    status: "idle",
    message: "Pick an option to stage an operator packet. No matching, intros, or money moves happen here."
  });
  const source = session.source ?? {
    mode: "demo",
    label: "Demo scenario",
    detail: "No Bellows intake packet was found."
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
      status: "idle",
      message: "Pick an option to stage an operator packet. No matching, intros, or money moves happen here."
    });
  }

  function selectRecommendation(id: string) {
    setSelectedId(id);
    setPacketState({
      status: "idle",
      message: "Pick an option to stage an operator packet. No matching, intros, or money moves happen here."
    });
  }

  async function stagePacket(action: RecommendationPacketAction) {
    if (!selected) return;

    setPacketState({ status: "saving", message: "Staging optional packet for operator review." });

    try {
      const response = await fetch("/api/bellows/recommendations/packet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendationId: selected.id, action })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setPacketState({
          status: "error",
          message: String(result.error || "Could not stage this optional packet.")
        });
        return;
      }

      setPacketState({
        status: "saved",
        message: String(result.meaning || "Optional packet staged for operator review."),
        packetId: String(result.packetId || ""),
        packetPath: String(result.packetPath || ""),
        speakerEntryPath: String(result.speakerEntryPath || "")
      });
      const nextPacket: BellowsLedgerOptionRow = {
        packetId: String(result.packetId || ""),
        state: "StagedForOperator",
        action,
        createdAt: String(result.createdAt || new Date().toISOString()),
        recommendationId: selected.id,
        title: selected.title,
        confidence: selected.confidence.score,
        packetPath: String(result.packetPath || ""),
        speakerEntryPath: String(result.speakerEntryPath || ""),
        sourceMode: source.mode,
        sourceIntakeId: source.intakeId ?? null,
        sourcePacketPath: source.packetPath ?? null,
        sourceSpeakerEntryPath: source.speakerEntryPath ?? null,
        meaning: String(result.meaning || "Optional packet staged for operator review.")
      };

      setOptionPackets((prev) => [
        nextPacket,
        ...prev.filter((packet) => packet.packetId !== String(result.packetId || ""))
      ].slice(0, 5));
    } catch (error) {
      setPacketState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not stage this optional packet."
      });
    }
  }

  if (!selected) return null;

  const showIntakePrompt = source.mode === "demo" || ledger.intakes.length === 0;

  return (
    <div className="squibb-rec-surface">
      {showIntakePrompt ? (
        <section className="squibb-rec-surface__intake-cta panel" aria-labelledby="squibbIntakeCtaTitle">
          <p className="eyebrow">Better with real symptoms</p>
          <h2 id="squibbIntakeCtaTitle">Start intake to ground these recommendations.</h2>
          <p>
            The deck below is a demo scenario until Bellows has a saved intake packet. Name what you are carrying first,
            then return here to compare ranked options against your actual symptom block.
          </p>
          <div className="member-selected-surface__actions">
            <Link className="button button-dark" href="/bellows/intake">
              Start concierge intake
            </Link>
            <Link className="button button-outline" href="/bellows/recommendations/test-case-0">
              Walk through test case #0
            </Link>
          </div>
        </section>
      ) : null}

      <header className="squibb-rec-surface__hero panel">
        <p className="eyebrow">Squibb · Recommendation Surface · {session.version}</p>
        <h1>What should you do next?</h1>
        <p className="squibb-rec-surface__intro">{session.squibbIntro}</p>
        <dl className="squibb-rec-surface__context">
          <div>
            <dt>Stated need</dt>
            <dd>{session.statedNeed}</dd>
          </div>
          <div>
            <dt>Context</dt>
            <dd>{session.operatorContext}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>
              {source.label}
              <small>{source.detail}</small>
              {source.packetPath ? <code>{source.packetPath}</code> : null}
            </dd>
          </div>
        </dl>
        <p className="squibb-rec-surface__squibb-note" role="note">
          {selected.squibbNote}
        </p>
      </header>

      {source.mode === "latest_intake" && source.symptomBlock ? (
        <section className="squibb-rec-source panel" aria-labelledby="squibbSourceTitle">
          <p className="eyebrow">Source symptoms</p>
          <h2 id="squibbSourceTitle">Latest Bellows intake source</h2>
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
          Ranked next steps ({session.ranked.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "catalog"}
          className={view === "catalog" ? "squibb-rec-tab squibb-rec-tab--active" : "squibb-rec-tab"}
          onClick={() => switchView("catalog")}
        >
          Recommendation catalog ({session.catalog.length})
        </button>
      </div>

      <div className="squibb-rec-surface__layout">
        <aside className="squibb-rec-surface__stack" aria-label="Recommendation cards">
          <h2 className="squibb-rec-surface__stack-title">
            {view === "ranked" ? "Top ranked options" : "All recommendation types"}
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
          />
          <EvidenceSection items={selected.evidence} />
          <HumanGateStrip gates={selected.humanGates} />

          <footer className="squibb-rec-detail__actions">
            <dl className="squibb-rec-detail__dispatch">
              <div>
                <dt>Agent / crew</dt>
                <dd>{selected.suggestedAgent}</dd>
              </div>
              {selected.suggestedTool ? (
                <div>
                  <dt>Tool</dt>
                  <dd>{selected.suggestedTool}</dd>
                </div>
              ) : null}
            </dl>
            <div className="squibb-rec-detail__buttons" role="group" aria-label="Operator optional packet actions">
              <button
                type="button"
                className="button button-dark"
                disabled={packetState.status === "saving"}
                onClick={() => stagePacket("pursue_path")}
              >
                Stage this option
              </button>
              <button
                type="button"
                className="button button-outline"
                disabled={packetState.status === "saving"}
                onClick={() => stagePacket("keep_original_path")}
              >
                {selected.keepOriginalPathLabel}
              </button>
              <button
                type="button"
                className="button button-ghost"
                disabled={packetState.status === "saving"}
                onClick={() => stagePacket("request_more_proof")}
              >
                Request proof packet
              </button>
            </div>
            <p className="squibb-rec-detail__preview-note" data-status={packetState.status} role="status">
              {packetState.message}
              {packetState.status === "saved" ? (
                <>
                  <br />
                  Packet: <code>{packetState.packetId}</code>
                  <br />
                  JSON: <code>{packetState.packetPath}</code>
                  <br />
                  Speaker entry: <code>{packetState.speakerEntryPath}</code>
                </>
              ) : null}
            </p>
          </footer>
        </article>
      </div>

      <section className="squibb-rec-ledger panel" aria-labelledby="squibbLedgerTitle">
        <header className="squibb-rec-ledger__header">
          <p className="eyebrow">Bellows packet ledger</p>
          <h2 id="squibbLedgerTitle">What Bellows has actually written</h2>
        </header>
        <div className="squibb-rec-ledger__grid">
          <div>
            <h3>Latest intake packets</h3>
            {ledger.intakes.length > 0 ? (
              <ol className="squibb-rec-ledger__list">
                {ledger.intakes.map((intake) => (
                  <li key={intake.intakeId} className="squibb-rec-ledger__item">
                    <strong>{intake.state}</strong>
                    <span>
                      {intake.answeredCount} of {intake.totalQuestions} fields answered
                    </span>
                    <code>{intake.packetPath}</code>
                    <code>{intake.speakerEntryPath}</code>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="squibb-rec-ledger__empty">
                No saved Bellows intake packets yet.{" "}
                <Link href="/bellows/intake">Start concierge intake</Link> to write the first one.
              </p>
            )}
          </div>
          <div>
            <h3>Latest optional packets</h3>
            {optionPackets.length > 0 ? (
              <ol className="squibb-rec-ledger__list">
                {optionPackets.map((packet) => (
                  <li key={packet.packetId} className="squibb-rec-ledger__item">
                    <strong>{packet.title}</strong>
                    <span>
                      {packet.action} - {packet.state} - {packet.confidence}%
                    </span>
                    <code>{packet.packetPath}</code>
                    <code>{packet.speakerEntryPath}</code>
                    {packet.sourcePacketPath ? <code>Source: {packet.sourcePacketPath}</code> : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="squibb-rec-ledger__empty">No optional recommendation packets staged yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
