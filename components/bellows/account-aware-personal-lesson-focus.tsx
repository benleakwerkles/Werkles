"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildPersonalBellowsLearningPath } from "@/lib/bellows/personal-learning-path";
import { getClientAccessToken } from "@/lib/client-auth";
import type { SquibbRecommendationSession } from "@/lib/squibb/recommendations";

export function AccountAwarePersonalLessonFocus({
  initialSession,
  publicLessonHref
}: {
  initialSession: SquibbRecommendationSession;
  publicLessonHref: `/bellows/library/${string}`;
}) {
  const [readout, setReadout] = useState<
    | { state: "checking" }
    | { state: "ready"; session: SquibbRecommendationSession }
    | { state: "account_error" }
  >({ state: "checking" });

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getClientAccessToken();
      if (!active) return;
      if (!token || token === "dev-preview-token") {
        setReadout({ state: "ready", session: initialSession });
        return;
      }
      const response = await fetch("/api/bellows/recommendations/current", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (!response.ok || !active) {
        setReadout({ state: "account_error" });
        return;
      }
      const result = await response.json().catch(() => ({}));
      if (result?.session) setReadout({ state: "ready", session: result.session as SquibbRecommendationSession });
      else setReadout({ state: "account_error" });
    })().catch(() => {
      if (active) setReadout({ state: "account_error" });
    });
    return () => {
      active = false;
    };
  }, [initialSession]);

  const step = useMemo(() => {
    if (readout.state !== "ready") return null;
    return buildPersonalBellowsLearningPath(readout.session)
      .find((candidate) => candidate.lesson.href === publicLessonHref) ?? null;
  }, [publicLessonHref, readout]);

  if (readout.state === "checking") {
    return <section className="bellows-personal-lesson-focus" aria-live="polite" aria-busy="true"><h2>Checking why this lesson is in your path.</h2></section>;
  }

  if (readout.state === "account_error") {
    return (
      <section className="bellows-personal-lesson-focus" role="alert">
        <p className="eyebrow">Your account path did not load</p>
        <h2>Werkles will not substitute another browser&apos;s lesson.</h2>
        <Link className="button button-dark" href="/bellows/intake">Check My Saved Intake</Link>
      </section>
    );
  }

  if (!step) {
    return (
      <section className="bellows-personal-lesson-focus" aria-labelledby="personalLessonChangedTitle">
        <p className="eyebrow">Your path changed</p>
        <h2 id="personalLessonChangedTitle">This lesson is not in your current top path.</h2>
        <p>You can still use the lesson below, or return to My Bellows to see what your latest answers put first.</p>
        <Link className="button button-dark" href="/bellows/personal">Return to My Bellows</Link>
      </section>
    );
  }

  return (
    <section className="bellows-personal-lesson-focus" aria-labelledby="personalLessonFocusTitle">
      <header>
        <p className="eyebrow">Your current focus · Step {step.rank}</p>
        <h2 id="personalLessonFocusTitle">Why this lesson is here</h2>
        <p><strong>{step.recommendationTitle}:</strong> {step.workingRead}</p>
      </header>
      <ol>
        {step.exercises.map((exercise, index) => (
          <li key={exercise.title}>
            <span>{index + 1}</span>
            <div><strong>{exercise.title}</strong><p>{exercise.action}</p><small>Leave with: {exercise.output}</small></div>
          </li>
        ))}
      </ol>
      <p className="bellows-personal-lesson-focus__finish"><strong>Done when:</strong> {step.finishLine}</p>
      <p className="bellows-personal-lesson-focus__boundary" role="note">
        This focus is derived from your current recommendation path. The lesson and tool below remain general education and do not receive or display your verbatim Intake answers.
      </p>
    </section>
  );
}
