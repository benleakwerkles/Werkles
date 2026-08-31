"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type Alignment = "" | "same" | "step" | "different";
type AxisEntry = Readonly<{ self: string; generatedLoaded: boolean; alignment: Alignment }>;
type PerspectiveDraft = Readonly<Record<string, AxisEntry>>;
type ConversationAxis = Readonly<{
  id: "scope" | "bar" | "edge";
  shortLabel: string;
  selfPrompt: string;
  partnerPrompt: string;
  practiceAnswer: string;
  nextConversation: string;
}>;

const AXES: readonly ConversationAxis[] = Object.freeze([
  Object.freeze({
    id: "scope",
    shortLabel: "What is happening",
    selfPrompt: "What's in front of you right now?",
    partnerPrompt: "What would you want to look at first?",
    practiceAnswer: "I would start by naming the first customer and the smallest useful result we could deliver together.",
    nextConversation: "Compare what each of you thinks deserves attention first. If those answers differ, choose one small test before promising a larger plan."
  }),
  Object.freeze({
    id: "bar",
    shortLabel: "What makes it worthwhile",
    selfPrompt: "What would make an hour of this worth it?",
    partnerPrompt: "What would you need from them to be useful?",
    practiceAnswer: "I would want one clear decision, a named owner, and a next step small enough to finish this week.",
    nextConversation: "Trade definitions of a useful hour. Agree on one visible result so effort does not quietly mean different things to each person."
  }),
  Object.freeze({
    id: "edge",
    shortLabel: "What stays yours",
    selfPrompt: "What you'd rather not hand over.",
    partnerPrompt: "What wouldn't you take on?",
    practiceAnswer: "I would not take sole responsibility for money, legal promises, or a deadline we have not checked together.",
    nextConversation: "Say the boundary plainly. A limit named early is easier to work around than resentment discovered after someone has already committed."
  })
]);

const ALIGNMENTS: readonly Readonly<{ id: Exclude<Alignment, "">; label: string; help: string }>[] = Object.freeze([
  Object.freeze({ id: "same", label: "Same read", help: "The two written answers point in the same direction." }),
  Object.freeze({ id: "step", label: "Close, with a step", help: "There is common ground and one difference to discuss." }),
  Object.freeze({ id: "different", label: "Not the same thing yet", help: "The answers need a real conversation before a promise." })
]);

function initialDraft(initialScope: string): PerspectiveDraft {
  return Object.freeze(Object.fromEntries(AXES.map((axis) => [axis.id, Object.freeze({
    self: axis.id === "scope" ? initialScope.trim() : "",
    generatedLoaded: false,
    alignment: "" as Alignment
  })])));
}

function restoreDraft(raw: string, initialScope: string): { draft: PerspectiveDraft; activeId: ConversationAxis["id"] } | null {
  try {
    const parsed = JSON.parse(raw) as { activeId?: string; entries?: Record<string, Partial<AxisEntry>> };
    const activeId = AXES.some((axis) => axis.id === parsed.activeId) ? parsed.activeId as ConversationAxis["id"] : "scope";
    const draft = Object.freeze(Object.fromEntries(AXES.map((axis) => {
      const saved = parsed.entries?.[axis.id];
      const alignment = ALIGNMENTS.some((choice) => choice.id === saved?.alignment) ? saved?.alignment as Alignment : "";
      return [axis.id, Object.freeze({
        self: typeof saved?.self === "string" ? saved.self : axis.id === "scope" ? initialScope.trim() : "",
        generatedLoaded: saved?.generatedLoaded === true,
        alignment: saved?.generatedLoaded === true ? alignment : ""
      })];
    })));
    return { draft, activeId };
  } catch {
    return null;
  }
}

export function PartnerPerspectiveExercise({ formationId, partnerLabel, initialScope = "" }: {
  formationId: string;
  partnerLabel: string;
  initialScope?: string;
}) {
  const storageKey = `werkles:partner-perspective:${formationId}:v2`;
  const [draft, setDraft] = useState<PerspectiveDraft>(() => initialDraft(initialScope));
  const [activeId, setActiveId] = useState<ConversationAxis["id"]>("scope");
  const [restored, setRestored] = useState(false);
  const skipNextPersistence = useRef(false);
  const activeIndex = AXES.findIndex((axis) => axis.id === activeId);
  const active = AXES[activeIndex] ?? AXES[0];
  const entry = draft[active.id];
  const selectedAlignment = useMemo(() => ALIGNMENTS.find((choice) => choice.id === entry.alignment), [entry.alignment]);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(storageKey);
    const restoredDraft = raw ? restoreDraft(raw, initialScope) : null;
    if (restoredDraft) {
      setDraft(restoredDraft.draft);
      setActiveId(restoredDraft.activeId);
    } else if (raw) window.sessionStorage.removeItem(storageKey);
    setRestored(true);
  }, [initialScope, storageKey]);

  useEffect(() => {
    if (!restored) return;
    if (skipNextPersistence.current) {
      skipNextPersistence.current = false;
      return;
    }
    window.sessionStorage.setItem(storageKey, JSON.stringify({ activeId, entries: draft }));
  }, [activeId, draft, restored, storageKey]);

  function updateActive(patch: Partial<AxisEntry>) {
    const next = Object.freeze({ ...draft, [active.id]: Object.freeze({ ...draft[active.id], ...patch }) });
    setDraft(next);
    if (restored) window.sessionStorage.setItem(storageKey, JSON.stringify({ activeId, entries: next }));
  }

  function clearExercise() {
    skipNextPersistence.current = true;
    window.sessionStorage.removeItem(storageKey);
    setDraft(initialDraft(initialScope));
    setActiveId("scope");
  }

  function move(offset: number) {
    setActiveId(AXES[Math.max(0, Math.min(activeIndex + offset, AXES.length - 1))].id);
  }

  return (
    <section className="partner-perspective" aria-labelledby="partner-perspective-title">
      <header className="partner-perspective__hero">
        <div>
          <p className="workshop-eyebrow">Before two Workshops become one Werkle</p>
          <h2 id="partner-perspective-title">Prepare for a real conversation</h2>
          <p>Write your side first. If you want rehearsal, load a clearly labeled practice answer and notice what you would need to ask—not what an algorithm claims about your relationship.</p>
        </div>
        <div className="partner-perspective__progress">
          <span>Three useful conversations</span>
          <strong>{AXES.filter((axis) => draft[axis.id].self.trim()).length} of {AXES.length} started</strong>
          <small>Your words stay in this browser on this device. Nothing here is sent to {partnerLabel}.</small>
        </div>
      </header>

      <aside className="partner-perspective__boundary">
        <strong>This rehearses the conversation after you review the Formation positions.</strong>
        <span>The fixed Ghost positions appear elsewhere on this page. Any extra practice answer here is generic and is never presented as something {partnerLabel} said.</span>
      </aside>

      <nav className="partner-perspective__questions" aria-label="Conversation topics">
        {AXES.map((axis, index) => (
          <button type="button" key={axis.id} aria-current={active.id === axis.id ? "step" : undefined} onClick={() => setActiveId(axis.id)}>
            <span>{index + 1}</span><strong>{axis.shortLabel}</strong>
            <small>{draft[axis.id].self.trim() ? "Your side started" : "Ready when you are"}</small>
          </button>
        ))}
      </nav>

      <article className="partner-perspective__workbench">
        <header><span>Conversation {activeIndex + 1} of {AXES.length}</span><h3>{active.selfPrompt}</h3><p>A sentence is plenty.</p></header>
        <div className="partner-perspective__sides">
          <label className="partner-perspective__side" htmlFor={`perspective-${active.id}`}>
            <span>Your side</span>
            <textarea id={`perspective-${active.id}`} rows={6} value={entry.self} placeholder="Write it the way you would say it." onChange={(event) => updateActive({ self: event.target.value })} />
            {active.id === "scope" && initialScope.trim() ? <small>Started from your latest Intake answer. Change it here if your thinking has moved.</small> : null}
          </label>
          {entry.generatedLoaded ? (
            <section className="partner-perspective__side partner-perspective__generated" aria-label="Generated practice answer">
              <span>Generated practice data — not supplied by {partnerLabel}</span>
              <h4>{active.partnerPrompt}</h4><p>{active.practiceAnswer}</p>
              <button type="button" className="button button-outline" onClick={() => updateActive({ generatedLoaded: false, alignment: "" })}>Remove practice side</button>
            </section>
          ) : (
            <section className="partner-perspective__empty">
              <strong>No additional reply from {partnerLabel} is invented here.</strong>
              <p>Use the fixed Formation positions above, or load a generic example to rehearse how you might continue the conversation.</p>
              <button type="button" className="button button-outline" onClick={() => updateActive({ generatedLoaded: true, alignment: "" })}>Load a generic rehearsal side</button>
            </section>
          )}
        </div>

        {entry.generatedLoaded ? (
          <section className="partner-perspective__comparison">
            <header><span>Your read of this practice example</span><p>This describes only the two answers on screen. It is not a score, compatibility claim, or {partnerLabel}&apos;s position.</p></header>
            <div className="partner-perspective__comparison-choices">
              {ALIGNMENTS.map((choice) => (
                <button type="button" key={choice.id} aria-pressed={entry.alignment === choice.id} onClick={() => updateActive({ alignment: choice.id })}>
                  <strong>{choice.label}</strong><span>{choice.help}</span>
                </button>
              ))}
            </div>
            {selectedAlignment ? (
              <div className="partner-perspective__readout" aria-live="polite">
                <figure className={`partner-perspective__layup partner-perspective__layup--${selectedAlignment.id}`} aria-label={`${selectedAlignment.label}: visual comparison of the two written practice answers`}>
                  <span className="partner-perspective__stock partner-perspective__stock--left">Your words</span><i aria-hidden="true" /><span className="partner-perspective__stock partner-perspective__stock--right">Practice</span>
                </figure>
                <div><strong>{selectedAlignment.label}</strong><p>{active.nextConversation}</p>{selectedAlignment.id === "same" ? <small>Lining up on paper is not the same as agreeing in person.</small> : null}</div>
              </div>
            ) : null}
          </section>
        ) : null}

        <footer>
          <button type="button" className="button button-outline" onClick={clearExercise}>Clear my exercise</button>
          <div><button type="button" className="button button-outline" disabled={activeIndex === 0} onClick={() => move(-1)}>Previous</button><button type="button" className="button button-dark" disabled={activeIndex === AXES.length - 1} onClick={() => move(1)}>Next conversation</button></div>
        </footer>
        <Link href="/dashboard/intros#match-deck-candidates">Back to Match Deck — this work stays in this tab.</Link>
      </article>
    </section>
  );
}
