"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildPersonalBellowsLearningPath } from "@/lib/bellows/personal-learning-path";
import { BELLOWS_DEVICE_ARTIFACTS, bellowsDeviceArtifactForHref } from "@/lib/bellows/device-artifact-catalog";
import { PERSONAL_BELLOWS_PROGRESS_KEY, personalBellowsProgressFrom } from "@/lib/bellows/personal-progress";
import { getClientAccessToken } from "@/lib/client-auth";
import type { SquibbRecommendationSession } from "@/lib/squibb/recommendations";

export function AccountAwarePersonalBellows({ initialSession }: { initialSession: SquibbRecommendationSession }) {
  const [readout, setReadout] = useState<
    | { state: "checking" }
    | { state: "ready"; session: SquibbRecommendationSession }
    | { state: "account_error" }
  >({ state: "checking" });
  const [deviceDrafts, setDeviceDrafts] = useState<ReadonlySet<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const found = new Set<string>();
    try {
      for (const artifact of BELLOWS_DEVICE_ARTIFACTS) {
        if (window.localStorage.getItem(artifact.key) !== null) found.add(artifact.key);
      }
    } catch {
      // Device storage can be unavailable; the path remains useful without status labels.
    }
    setDeviceDrafts(found);
    try {
      const raw = window.localStorage.getItem(PERSONAL_BELLOWS_PROGRESS_KEY);
      const progress = personalBellowsProgressFrom(raw ? JSON.parse(raw) : null);
      setCompletedLessons(new Set(progress.completedLessonSlugs));
    } catch {
      setCompletedLessons(new Set());
    }
  }, []);

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

  const path = useMemo(
    () => readout.state === "ready" ? buildPersonalBellowsLearningPath(readout.session) : [],
    [readout]
  );

  if (readout.state === "checking") {
    return <section className="bellows-personal__empty" aria-live="polite" aria-busy="true"><h2>Building your current learning path.</h2></section>;
  }
  if (readout.state === "account_error") {
    return (
      <section className="bellows-personal__empty" role="alert">
        <h2>Your account learning path did not load.</h2>
        <p>Werkles will not replace it with an example or another browser&apos;s Intake.</p>
        <Link className="button button-dark" href="/bellows/intake">Check my saved Intake</Link>
      </section>
    );
  }
  if (path.length === 0) {
    return (
      <section className="bellows-personal__empty" aria-labelledby="personalBellowsEmptyTitle">
        <p className="eyebrow">Your Intake path is still open</p>
        <h2 id="personalBellowsEmptyTitle">Build a tailored reading path when you&apos;re ready.</h2>
        <p>Your Intake shapes the lessons here. Any saved Werkle work and result notes remain available below.</p>
        <Link className="button button-dark" href="/bellows/intake">Answer the Intake Questions</Link>
      </section>
    );
  }

  const nextLesson = path.find((recommendation) => {
    const lessonSlug = recommendation.lesson.href.split("/").pop() ?? "";
    return !completedLessons.has(lessonSlug);
  }) ?? path[0];
  const nextArtifact = bellowsDeviceArtifactForHref(nextLesson.lesson.href);
  const nextHref = nextArtifact?.personalHref ?? nextLesson.lesson.href;
  const allLessonsCompleted = path.every((recommendation) => {
    const lessonSlug = recommendation.lesson.href.split("/").pop() ?? "";
    return completedLessons.has(lessonSlug);
  });

  return (
    <section className="bellows-personal__path" aria-labelledby="personalPathTitle">
      <div className="bellows-library__section-heading">
        <p className="eyebrow">Suggested from your current readout</p>
        <h2 id="personalPathTitle">Start with {path.length === 1 ? "this lesson" : `these ${path.length}`}.</h2>
        <p>The order follows your current recommendations. Change your answers and this path may change.</p>
      </div>
      <aside className="bellows-personal__resume" aria-labelledby="personalBellowsResumeTitle">
        <div>
          <p className="eyebrow">{allLessonsCompleted ? "Worth returning to" : "Continue where the work is open"}</p>
          <h3 id="personalBellowsResumeTitle">{nextLesson.lesson.title}</h3>
          <p>
            {allLessonsCompleted
              ? "You completed this path on this device. Reopen the first lesson when the situation changes."
              : "This is the first lesson in your current path that is not marked complete on this device."}
          </p>
        </div>
        <Link className="button button-dark" href={nextHref}>
          {allLessonsCompleted ? "Review the Path" : "Continue This Lesson"}
        </Link>
      </aside>
      <ol>
        {path.map((recommendation) => {
          const artifact = bellowsDeviceArtifactForHref(recommendation.lesson.href);
          const hasDeviceDraft = artifact ? deviceDrafts.has(artifact.key) : false;
          const lessonSlug = recommendation.lesson.href.split("/").pop() ?? "";
          const completed = completedLessons.has(lessonSlug);
          return <li key={recommendation.lesson.href}>
            <span>{recommendation.rank}</span>
            <details className="bellows-personal__lesson">
              <summary>
                <span>
                  <small>{completed ? "Completed on this device" : `Suggested from ${recommendation.recommendationTitle}`}</small>
                  <strong>{recommendation.lesson.title}</strong>
                  <span>{recommendation.workingRead}</span>
                </span>
                <b aria-hidden="true">Open the 3-step exercise</b>
              </summary>
              <div className="bellows-personal__lesson-body">
                <ol className="bellows-personal__exercise-list">
                  {recommendation.exercises.map((exercise, index) => (
                    <li key={exercise.title}>
                      <strong>{index + 1}. {exercise.title}</strong>
                      <p>{exercise.action}</p>
                      <small>Leave with: {exercise.output}</small>
                    </li>
                  ))}
                </ol>
                <p><strong>Done when:</strong> {recommendation.finishLine}</p>
                {artifact ? (
                  <p className="bellows-personal__draft-state">
                    {hasDeviceDraft ? "Device draft found—checked when opened." : "Not started on this device."}
                  </p>
                ) : null}
                <p className="bellows-personal__progress-state">
                  {completed ? "Completed on this device—open it again whenever the question changes." : "Not marked complete on this device."}
                </p>
                <Link href={artifact?.personalHref ?? recommendation.lesson.href}>
                  {completed ? "Review This Step" : artifact ? `Open ${artifact.title}` : "Open the Full Public Lesson"} →
                </Link>
              </div>
            </details>
          </li>;
        })}
      </ol>
      <section className="bellows-personal__after" aria-labelledby="personalBellowsAfterTitle">
        <div>
          <p className="eyebrow">Take the learning somewhere useful</p>
          <h3 id="personalBellowsAfterTitle">A lesson is not the finish line.</h3>
          <p>
            Put the result in your Workshop, compare people only when another person is part of the answer,
            or update your Intake when the situation changes.
          </p>
        </div>
        <nav aria-label="Next places after a Personal Bellows path">
          <Link className="button button-dark" href="/dashboard/blueprints">Use It in My Workshop</Link>
          <Link className="button button-outline" href="/dashboard/intros">Compare My Matches</Link>
          <Link className="button button-outline" href="/bellows/intake">Update My Situation</Link>
        </nav>
      </section>
      <p className="bellows-personal__boundary" role="note">
        This path follows your current Intake and can change when your answers change. Public lessons receive none of your answers, and nothing here monitors another person or a shared Werkle.
      </p>
    </section>
  );
}
