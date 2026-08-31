"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getClientAccessToken } from "@/lib/client-auth";
import type { OwnerSurfaceState } from "@/lib/owner-surfaces/owner-state";
import { RECOMMENDATION_KIND_LABELS } from "@/lib/squibb/recommendations";

function memberFacingOpenQuestion(value: string): string {
  if (/third-party verification not attached/i.test(value)) {
    return "Outside facts and documents have not been checked yet.";
  }
  if (/funds posture not verified/i.test(value)) {
    return "Any money available for this work has not been checked yet.";
  }
  if (/identity not verified/i.test(value)) {
    return "Identity has not been checked yet.";
  }
  return value;
}

export function AccountAwareWorkshopState({ initialState }: { initialState: OwnerSurfaceState }) {
  const [readout, setReadout] = useState<
    | { mode: "checking" }
    | { mode: "ready"; state: OwnerSurfaceState }
    | { mode: "account_error" }
  >({ mode: "checking" });

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getClientAccessToken();
      if (!active) return;
      if (!token || token === "dev-preview-token") {
        setReadout({ mode: "ready", state: initialState });
        return;
      }
      const response = await fetch("/api/bellows/workshop/current", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (!response.ok || !active) {
        setReadout({ mode: "account_error" });
        return;
      }
      const result = await response.json().catch(() => ({}));
      if (result?.state) setReadout({ mode: "ready", state: result.state as OwnerSurfaceState });
      else setReadout({ mode: "account_error" });
    })().catch(() => {
      if (active) setReadout({ mode: "account_error" });
    });
    return () => {
      active = false;
    };
  }, [initialState]);

  if (readout.mode === "checking") {
    return (
      <section className="workshop-empty" aria-live="polite" aria-busy="true">
        <div className="workshop-empty__intro">
          <div><p className="workshop-eyebrow">Opening your Workshop</p><h2>Checking for your latest saved Intake.</h2></div>
        </div>
      </section>
    );
  }

  if (readout.mode === "account_error") {
    return (
      <section className="workshop-empty" role="alert">
        <div className="workshop-empty__intro">
          <div>
            <p className="workshop-eyebrow">Your account Workshop did not load</p>
            <h2>We will not fill it with another browser&apos;s work.</h2>
            <p>Open Intake to confirm your saved answers, then return here.</p>
          </div>
          <Link className="button button-dark" href="/bellows/intake">Open my Intake</Link>
        </div>
      </section>
    );
  }

  const state = readout.state;
  return (
    <>
      {state.hasIntake ? (
        <section className="workshop-plan" aria-labelledby="workshop-plan-title">
          <div className="workshop-section-heading">
            <p>Your Intake is in</p>
            <h2 id="workshop-plan-title">Werkles used your answers to shape the working read below.</h2>
            <span>
              {state.answeredCount} of {state.totalQuestions} questions answered. Your complete wording stays in Intake,
              where you can review or change it without rereading it all here.
            </span>
          </div>
          <div className="member-selected-surface__actions">
            <Link className="button button-outline" href="/bellows/intake">Review or Change My Intake</Link>
          </div>
        </section>
      ) : (
        <WorkshopEmpty />
      )}

      {state.opportunityCase ? (
        <section className="workshop-room" aria-labelledby="workshop-working-read-title">
          <div className="workshop-section-heading">
            <p>Werkles&apos;s working read</p>
            <h2 id="workshop-working-read-title">The idea, the doubt, and the paths worth testing</h2>
            <span>This is an early read from your answers, not a verdict. Change your Intake whenever it misses.</span>
          </div>
          <div className="workshop-room__grid">
            <article className="workshop-room__card">
              <span className="workshop-room__number">A</span><h3>Paths worth comparing first</h3>
              <p>{state.opportunityCase.paths.filter((path) => path.support === "directly_supported").slice(0, 3)
                .map((path) => RECOMMENDATION_KIND_LABELS[path.kind]).join(" · ") || "The current answers do not directly support a path yet."}</p>
              <small>{state.opportunityCase.notMatch.outcome === "proceed" ? "Compare these before choosing" : "Slow down before choosing a path"}</small>
            </article>
            <article className="workshop-room__card">
              <span className="workshop-room__number">B</span><h3>What still needs an answer</h3>
              <p>{state.opportunityCase.hypotheses[0]?.missingEvidence.slice(0, 3).map(memberFacingOpenQuestion).join(" ") || "Nothing important is missing from this early read."}</p>
              <small>We won&apos;t guess.</small>
            </article>
            <article className="workshop-room__card">
              <span className="workshop-room__number">C</span><h3>Turn one path into useful work</h3>
              <p>Recommendations opens the strongest paths into a working draft, a deeper Bellows lesson, and a clear finish line.</p>
              <small>A starting order—not a promise of success</small>
            </article>
          </div>
        </section>
      ) : null}

      {state.hasIntake ? (
        <section className="workshop-next" aria-labelledby="workshop-next-title">
          <div>
            <p className="workshop-eyebrow">Next useful move</p>
            <h2 id="workshop-next-title">Compare the plan before you compare people.</h2>
            <p>Recommendations shows possible next moves and why each one surfaced. Match Deck comes later—only if a person is actually part of the answer.</p>
          </div>
          <Link className="button button-dark" href="/bellows/recommendations">Open Recommendations</Link>
        </section>
      ) : null}
    </>
  );
}

const emptyBriefFields = [
  ["Goal", "What are you trying to make happen first?", "Waiting for Intake"],
  ["Bottleneck", "Which task or decision is stopping it today?", "Waiting for Intake"],
  ["Assets", "What do you already have working for you?", "Waiting for Intake"],
  ["Constraints", "What cannot change—time, place, money, or control?", "Waiting for Intake"]
] as const;

function WorkshopEmpty() {
  return (
    <section className="workshop-empty" aria-labelledby="workshop-empty-title">
      <div className="workshop-empty__intro">
        <div><p className="workshop-eyebrow">Your bench is clear</p><h2 id="workshop-empty-title">Give us the real-world version first.</h2><p>You do not need a business plan or the right vocabulary.</p></div>
        <Link className="button button-dark" href="/bellows/intake">Start Intake</Link>
      </div>
      <div className="workshop-empty__fields" aria-label="Blank Workshop plan">
        {emptyBriefFields.map(([label, prompt, fieldState]) => (
          <article className="workshop-empty__field" key={label}><p>{label}</p><h3>{prompt}</h3><span aria-hidden="true" /><small>{fieldState}</small></article>
        ))}
      </div>
    </section>
  );
}
