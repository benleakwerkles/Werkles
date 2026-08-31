"use client";

import { useEffect, useState } from "react";

import type { WerkleFirstSharedAction } from "@/lib/werkle/first-shared-action";
import {
  createWerkleSharedActionResult,
  isWerkleSharedActionResultCurrent,
  WERKLE_SHARED_ACTION_RESULT_KEY,
  werkleSharedActionResultFrom,
  type WerkleSharedActionResult
} from "@/lib/werkle/shared-action-result";

type Draft = Pick<WerkleSharedActionResult, "observed" | "interpretation" | "nextDecision">;
const EMPTY: Draft = Object.freeze({ observed: "", interpretation: "", nextDecision: "" });

export function SharedActionResultRecorder({ action }: { action: WerkleFirstSharedAction }) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [status, setStatus] = useState("No result recorded yet. These notes are yours until both people discuss them.");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WERKLE_SHARED_ACTION_RESULT_KEY);
      const parsed = raw ? werkleSharedActionResultFrom(JSON.parse(raw)) : null;
      if (parsed && isWerkleSharedActionResultCurrent(parsed, action)) {
        setDraft({ observed: parsed.observed, interpretation: parsed.interpretation, nextDecision: parsed.nextDecision });
        setStatus("Your result notes were restored from this device. They are not the other person's answer or a mutual decision.");
      } else if (parsed) {
        setDraft(EMPTY);
        setStatus("The accepted source or proposed action changed, so the older result was not loaded.");
      }
    } catch {
      setStatus("This device could not restore the result notes.");
    }
  }, [action.action, action.formationId, action.sourceRevision, action.sourceText, action.topicId, action.updatedAt]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setStatus("Working in this tab. Nothing is shared, accepted, or sent.");
  }

  function save() {
    try {
      const result = createWerkleSharedActionResult(action, draft);
      window.localStorage.setItem(WERKLE_SHARED_ACTION_RESULT_KEY, JSON.stringify(result));
      setStatus("Result notes saved on this device. Bring them to the next conversation; they are not a mutual decision.");
    } catch {
      setStatus("Record what happened and the next decision to discuss before saving.");
    }
  }

  function clear() {
    window.localStorage.removeItem(WERKLE_SHARED_ACTION_RESULT_KEY);
    setDraft(EMPTY);
    setStatus("Result notes cleared. The accepted wording and proposed action were not changed.");
  }

  return (
    <section className="werkle-test-result" aria-labelledby="werkle-test-result-title">
      <header>
        <p className="workshop-eyebrow">Bring the result back</p>
        <h4 id="werkle-test-result-title">What happened—and what should you discuss next?</h4>
        <p>Keep observation separate from interpretation. One person's notes do not become the other person's answer.</p>
      </header>
      <div className="werkle-test-result__fields">
        <label>What did you actually observe?<textarea rows={4} maxLength={800} value={draft.observed} onChange={(event) => update("observed", event.target.value)} placeholder="Specific responses, costs, time, failures, or behavior—not a verdict" /></label>
        <label>What might that mean?<textarea rows={4} maxLength={800} value={draft.interpretation} onChange={(event) => update("interpretation", event.target.value)} placeholder="Your interpretation can be uncertain or left blank" /></label>
        <label>What decision should you discuss next?<textarea rows={3} maxLength={500} value={draft.nextDecision} onChange={(event) => update("nextDecision", event.target.value)} placeholder="Continue, change, stop, or run one more test—still only a proposal" /></label>
      </div>
      <div className="member-selected-surface__actions">
        <button className="button button-dark" type="button" onClick={save}>Save My Result Notes on This Device</button>
        <button className="button button-ghost" type="button" onClick={clear}>Clear Result Notes</button>
      </div>
      <p className="werkle-test-result__status" role="status">{status}</p>
    </section>
  );
}
