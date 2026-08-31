"use client";

import { useEffect, useState } from "react";

import {
  PERSONAL_BELLOWS_PROGRESS_KEY,
  personalBellowsProgressFrom,
  updatePersonalBellowsProgress
} from "@/lib/bellows/personal-progress";

export function PersonalLessonProgress({ lessonSlug, lessonTitle }: { lessonSlug: string; lessonTitle: string }) {
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [status, setStatus] = useState("Checking this device.");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PERSONAL_BELLOWS_PROGRESS_KEY);
      const progress = personalBellowsProgressFrom(raw ? JSON.parse(raw) : null);
      const isCompleted = progress.completedLessonSlugs.includes(lessonSlug);
      setCompleted(isCompleted);
      setStatus(isCompleted ? "Marked complete on this device." : "Not marked complete on this device.");
    } catch {
      setCompleted(false);
      setStatus("This browser could not read lesson progress.");
    }
  }, [lessonSlug]);

  function toggle() {
    const nextCompleted = completed !== true;
    try {
      const raw = window.localStorage.getItem(PERSONAL_BELLOWS_PROGRESS_KEY);
      const current = personalBellowsProgressFrom(raw ? JSON.parse(raw) : null);
      const next = updatePersonalBellowsProgress(current, lessonSlug, nextCompleted);
      window.localStorage.setItem(PERSONAL_BELLOWS_PROGRESS_KEY, JSON.stringify(next));
      setCompleted(nextCompleted);
      setStatus(nextCompleted ? "Marked complete on this device. You can return whenever the situation changes." : "Completion mark removed. Your saved tool drafts were not changed.");
    } catch {
      setStatus("This browser could not save lesson progress. Nothing was sent.");
    }
  }

  return (
    <section className="bellows-personal-progress" aria-labelledby="personalLessonProgressTitle">
      <div>
        <p className="eyebrow">Your path on this device</p>
        <h2 id="personalLessonProgressTitle">Keep {lessonTitle} easy to revisit.</h2>
        <p>Marking this step does not share your work or claim that the business question is permanently solved.</p>
      </div>
      <div>
        <button className="button button-dark" type="button" onClick={toggle} disabled={completed === null}>
          {completed ? "Mark as not done" : "Mark this step complete"}
        </button>
        <p role="status">{status}</p>
      </div>
    </section>
  );
}
