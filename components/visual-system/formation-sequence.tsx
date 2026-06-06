"use client";

import { useState } from "react";
import { STOCK_PREVIEW_ENABLED, stockPreviewFormation } from "@/lib/stock-preview-imagery";
import { laneDisplayOrder, laneById } from "@/lib/visual-system/lanes";
import type { FormationPhase } from "@/lib/visual-system/types";
import { ProfileCard } from "./profile-card";
import type { ProfileCardModel } from "@/lib/visual-system/types";

const phases: { id: FormationPhase; label: string; caption: string }[] = [
  {
    id: "solo",
    label: "1 · Solo",
    caption: "One profile, empty ghost slots, formation not started."
  },
  {
    id: "partial",
    label: "2 · Partial",
    caption: "Three roles filled, precise lines, dossier opening."
  },
  {
    id: "formed",
    label: "3 · Formed",
    caption: "Werkle formed — cards aligned, dossier frame active."
  }
];

const filledByPhase: Record<FormationPhase, (typeof laneDisplayOrder)[number][]> = {
  solo: ["operator"],
  partial: ["operator", "builder", "backer"],
  formed: ["operator", "builder", "backer", "connector", "spark"]
};

const ghostSlotsByPhase: Record<FormationPhase, (typeof laneDisplayOrder)[number][]> = {
  solo: ["builder", "backer", "connector", "spark"],
  partial: ["connector", "spark"],
  formed: []
};

function memberCard(laneId: (typeof laneDisplayOrder)[number], phase: FormationPhase): ProfileCardModel {
  const lane = laneById[laneId];
  const filled = filledByPhase[phase].includes(laneId);
  if (!filled) {
    return {
      state: "undeclared",
      name: "Open slot",
      roleLabel: lane.title,
      formationStatus: `${lane.title} slot open`
    };
  }
  return {
    state: phase === "formed" ? "formed" : "in-formation",
    name: phase === "formed" && laneId === "operator" ? "Jordan Lee" : `${lane.title} member`,
    lane: laneId,
    roleLabel: lane.title,
    formationStatus:
      phase === "formed" ? "Werkle formed" : `In formation · ${filledByPhase[phase].length} of 5 filled`,
    skills: ["Lane skill", "Proof signal"],
    availability: phase === "formed" ? "Active Werkle" : "Formation in progress",
    projectState: "Main Street service roll-up",
    werkileLabel: phase === "formed" ? "Werkle · Riverside Ops" : undefined,
    formedOn: phase === "formed" ? "2026-03-12" : undefined
  };
}

export function FormationSequence() {
  const [phase, setPhase] = useState<FormationPhase>("solo");

  const filled = filledByPhase[phase];
  const ghosts = ghostSlotsByPhase[phase];
  const backdrop = STOCK_PREVIEW_ENABLED ? stockPreviewFormation[phase] : null;

  return (
    <section
      className={`vs-formation${backdrop ? " vs-formation--stock-preview" : ""}`}
      aria-labelledby="formationTitle"
    >
      <div className="vs-formation__controls" role="tablist" aria-label="Formation sequence states">
        {phases.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={phase === p.id}
            className={`vs-formation__tab${phase === p.id ? " is-active" : ""}`}
            onClick={() => setPhase(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className="vs-formation__caption">{phases.find((p) => p.id === phase)?.caption}</p>

      <div
        className={`vs-formation__stage vs-formation__stage--${phase}`}
        role="tabpanel"
        aria-live="polite"
        style={
          backdrop
            ? ({ ["--vs-formation-backdrop" as string]: `url(${backdrop.path})` } as Record<string, string>)
            : undefined
        }
      >
        {backdrop ? (
          <p className="vs-formation__backdrop-caption">{backdrop.scene}</p>
        ) : null}
        <div className="vs-formation__grid">
          {filled.map((laneId) => (
            <div key={laneId} className="vs-formation__slot vs-formation__slot--filled">
              <ProfileCard model={memberCard(laneId, phase)} compact />
            </div>
          ))}
          {ghosts.map((laneId) => (
            <div key={`ghost-${laneId}`} className="vs-formation__slot vs-formation__slot--ghost">
              <div className="vs-ghost-slot">
                <p className="vs-ghost-slot__lane">{laneById[laneId].title}</p>
                <p className="vs-ghost-slot__label">Open slot</p>
              </div>
            </div>
          ))}
        </div>

        <div className={`vs-dossier vs-dossier--${phase}`}>
          <p className="vs-dossier__eyebrow">Werkle dossier</p>
          <h3 className="vs-dossier__title">
            {phase === "formed" ? "Riverside Ops · formed" : "Formation brief · in progress"}
          </h3>
          <p className="vs-dossier__meta">
            {phase === "solo"
              ? "0 of 5 roles · solo operator seeking formation"
              : phase === "partial"
                ? `${filled.length} of 5 roles · partial assembly`
                : "5 of 5 roles · dossier locked"}
          </p>
          <div className="vs-dossier__lines" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </section>
  );
}
