"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SharedActionResultRecorder } from "@/components/werkle/shared-action-result-recorder";

import {
  createWerkleFirstSharedAction,
  isWerkleFirstSharedActionCurrent,
  WERKLE_FIRST_SHARED_ACTION_KEY,
  werkleFirstSharedActionFrom,
  type WerkleFirstSharedAction
} from "@/lib/werkle/first-shared-action";
import type { WerkleFirstSharedStep } from "@/lib/werkle/operating-brief";
import { topicExperimentFor } from "@/lib/werkle/topic-experiment";
import { WERKLE_SHARED_ACTION_RESULT_KEY } from "@/lib/werkle/shared-action-result";

type Draft = Pick<WerkleFirstSharedAction, "action" | "volunteer" | "checkIn" | "doneWhen">;
const EMPTY: Draft = Object.freeze({ action: "", volunteer: "", checkIn: "", doneWhen: "" });

export function FirstSharedActionPlanner({
  formationId,
  step,
  persistAcceptedSource
}: {
  formationId: string;
  step: WerkleFirstSharedStep;
  persistAcceptedSource: () => void;
}) {
  const experiment = topicExperimentFor(step.topicId);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [savedAction, setSavedAction] = useState<WerkleFirstSharedAction | null>(null);
  const [status, setStatus] = useState("Nothing is assigned or promised yet.");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WERKLE_FIRST_SHARED_ACTION_KEY);
      const parsed = raw ? werkleFirstSharedActionFrom(JSON.parse(raw)) : null;
      if (parsed && isWerkleFirstSharedActionCurrent(parsed, formationId, step)) {
        setDraft({ action: parsed.action, volunteer: parsed.volunteer, checkIn: parsed.checkIn, doneWhen: parsed.doneWhen });
        setSavedAction(parsed);
        setStatus("Shared action draft restored from this device. Both people still need to agree to it.");
      } else if (parsed) {
        setSavedAction(null);
        setStatus("The accepted wording changed, so the older action draft was not loaded.");
      }
    } catch {
      setStatus("This device could not restore the shared action draft.");
    }
  }, [formationId, step.revision, step.text, step.topicId]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setStatus("Working in this tab. Nothing is assigned, saved, or sent.");
  }

  function save() {
    try {
      const action = createWerkleFirstSharedAction(formationId, step, draft);
      persistAcceptedSource();
      window.localStorage.setItem(WERKLE_FIRST_SHARED_ACTION_KEY, JSON.stringify(action));
      setSavedAction(action);
      setStatus("Accepted source and proposed action saved on this device. This is not an assignment or agreement.");
    } catch {
      setStatus("Complete the fields with shorter, valid answers before saving.");
    }
  }

  function clear() {
    window.localStorage.removeItem(WERKLE_FIRST_SHARED_ACTION_KEY);
    window.localStorage.removeItem(WERKLE_SHARED_ACTION_RESULT_KEY);
    setDraft(EMPTY);
    setSavedAction(null);
    setStatus("Device draft cleared. The accepted Formation wording was not changed.");
  }

  return (
    <section className="werkle-first-action" aria-labelledby="werkle-first-action-title">
      <div>
        <p className="workshop-eyebrow">Turn shared wording into a small test</p>
        <h4 id="werkle-first-action-title">Plan one action both people can actually review.</h4>
        <p>Werkles will not invent the volunteer, deadline, or result. Write the proposal, then ask the other person to accept or change it.</p>
      </div>
      <div className="werkle-first-action__test-shape">
        <strong>A useful starting shape</strong>
        <span>{experiment.prompt}</span>
        <small>Bring back: {experiment.observe}</small>
      </div>
      <div className="werkle-first-action__fields">
        <label>What will you do?<textarea rows={3} maxLength={500} value={draft.action} onChange={(event) => update("action", event.target.value)} placeholder="One action small enough to finish before the next conversation" /></label>
        <label>Who volunteered?<input maxLength={120} value={draft.volunteer} onChange={(event) => update("volunteer", event.target.value)} placeholder="A person volunteers; Werkles does not assign them" /></label>
        <label>When will you check back?<input type="date" value={draft.checkIn} onChange={(event) => update("checkIn", event.target.value)} /></label>
        <label>What would count as done?<textarea rows={3} maxLength={500} value={draft.doneWhen} onChange={(event) => update("doneWhen", event.target.value)} placeholder="A visible result both people can inspect" /></label>
      </div>
      <div className="member-selected-surface__actions">
        <button className="button button-dark" type="button" onClick={save}>Save Proposed Action on This Device</button>
        {experiment.crucibleHref ? <Link className="button button-outline" href={experiment.crucibleHref}>Choose a Narrow Outside Check</Link> : null}
        <button className="button button-ghost" type="button" onClick={clear}>Clear Action Draft</button>
      </div>
      <p className="werkle-first-action__status" role="status">{status}</p>
      {savedAction ? <SharedActionResultRecorder key={savedAction.updatedAt} action={savedAction} /> : null}
    </section>
  );
}
