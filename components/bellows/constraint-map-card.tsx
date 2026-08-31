"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "werkles:bellows:constraint-map:v1";
const MAX_TEXT = 600;
type CauseRow = { cause: string; forEvidence: string; againstEvidence: string; check: string };
type ConstraintDraft = { stop: string; causes: [CauseRow, CauseRow, CauseRow]; checkBy: string };
const blankCause = (): CauseRow => ({ cause: "", forEvidence: "", againstEvidence: "", check: "" });
const blankDraft = (): ConstraintDraft => ({ stop: "", causes: [blankCause(), blankCause(), blankCause()], checkBy: "" });

function validString(value: unknown, max = MAX_TEXT): value is string {
  return typeof value === "string" && value.length <= max;
}

function restoredDraft(value: unknown): ConstraintDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== 3 || !validString(record.stop) || !validString(record.checkBy, 40)) return null;
  if (!Array.isArray(record.causes) || record.causes.length !== 3) return null;
  const causes = record.causes.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const row = value as Record<string, unknown>;
    const keys: Array<keyof CauseRow> = ["cause", "forEvidence", "againstEvidence", "check"];
    if (Object.keys(row).length !== keys.length || !keys.every((key) => validString(row[key]))) return null;
    return Object.fromEntries(keys.map((key) => [key, row[key]])) as CauseRow;
  });
  if (causes.some((cause) => cause === null)) return null;
  return { stop: record.stop, causes: causes as [CauseRow, CauseRow, CauseRow], checkBy: record.checkBy };
}

export function ConstraintMapCard() {
  const [draft, setDraft] = useState<ConstraintDraft>(blankDraft);
  const [status, setStatus] = useState("Nothing is saved or sent from this map.");
  const unresolved = useMemo(() => {
    const fields = [draft.stop, draft.checkBy, ...draft.causes.flatMap((row) => [row.cause, row.forEvidence, row.againstEvidence, row.check])];
    return fields.filter((value) => !value.trim()).length;
  }, [draft]);
  const copyText = useMemo(() => [
    "CONSTRAINT MAP — WORKING DRAFT",
    "This map compares possible causes. It does not diagnose the business or prove a cause.",
    "",
    `Observed stop: ${draft.stop.trim() || "Unwritten"}`,
    "",
    ...draft.causes.flatMap((row, index) => [
      `POSSIBLE CAUSE ${index + 1}: ${row.cause.trim() || "Unwritten"}`,
      `Evidence for: ${row.forEvidence.trim() || "Unknown"}`,
      `Evidence against: ${row.againstEvidence.trim() || "Unknown"}`,
      `Cheapest check: ${row.check.trim() || "Unwritten"}`,
      ""
    ]),
    `Check by: ${draft.checkBy || "No date set"}`,
    `${unresolved} fields remain unresolved.`
  ].join("\n"), [draft, unresolved]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const restored = restoredDraft(JSON.parse(raw));
      if (!restored) {
        setStatus("The saved device map was invalid and was not restored. Nothing was sent.");
        return;
      }
      setDraft(restored);
      setStatus("Saved Constraint Map restored from this device. It was not shared.");
    } catch {
      setStatus("The saved device map could not be read. Nothing was sent.");
    }
  }, []);

  function updateCause(index: number, field: keyof CauseRow, value: string) {
    setDraft((current) => ({ ...current, causes: current.causes.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row) as ConstraintDraft["causes"] }));
    setStatus("Working in this tab. Nothing is saved or sent.");
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      setStatus("Saved on this device. It is not account-saved or shared.");
    } catch {
      setStatus("This browser could not save the map. Nothing was sent.");
    }
  }

  async function copyMap() {
    try {
      await navigator.clipboard.writeText(copyText);
      setStatus("Constraint Map copied. Keep all three causes alive until a real check rules one in or out.");
    } catch {
      setStatus("Clipboard access failed. Your map remains in this tab only.");
    }
  }

  function clear() {
    window.localStorage.removeItem(STORAGE_KEY);
    setDraft(blankDraft());
    setStatus("Device map cleared. Nothing was sent.");
  }

  return (
    <section className="constraint-map" aria-labelledby="constraintMapTitle">
      <header className="constraint-map__header">
        <div><p className="eyebrow">Reusable work product</p><h2 id="constraintMapTitle">Name the stop. Keep three causes alive.</h2><p>Write only what you can observe in the first box. A cause is an explanation to test—not “get a loan,” “find a partner,” or another preferred solution.</p></div>
        <output className="constraint-map__count" aria-live="polite"><strong>{unresolved}</strong><span>fields still unresolved</span></output>
      </header>

      <label className="constraint-map__stop">The work stops when…
        <textarea rows={3} maxLength={MAX_TEXT} value={draft.stop} onChange={(event) => { setDraft((current) => ({ ...current, stop: event.target.value })); setStatus("Working in this tab. Nothing is saved or sent."); }} placeholder="For example: approved jobs wait more than five days before anyone can schedule the equipment." />
      </label>

      <div className="constraint-map__causes">
        {draft.causes.map((row, index) => (
          <fieldset key={index}>
            <legend>Possible cause {index + 1}</legend>
            <label>Cause to test<textarea rows={2} maxLength={MAX_TEXT} value={row.cause} onChange={(event) => updateCause(index, "cause", event.target.value)} placeholder="A specific explanation that could be wrong" /></label>
            <label>Evidence for it<textarea rows={2} maxLength={MAX_TEXT} value={row.forEvidence} onChange={(event) => updateCause(index, "forEvidence", event.target.value)} placeholder="Observed fact, source, and date—or Unknown" /></label>
            <label>Evidence against it<textarea rows={2} maxLength={MAX_TEXT} value={row.againstEvidence} onChange={(event) => updateCause(index, "againstEvidence", event.target.value)} placeholder="Contradiction, exception, or Unknown" /></label>
            <label>Cheapest honest check<textarea rows={2} maxLength={MAX_TEXT} value={row.check} onChange={(event) => updateCause(index, "check", event.target.value)} placeholder="One call, count, quote, trial, observation, or document check" /></label>
          </fieldset>
        ))}
      </div>

      <label className="constraint-map__date">Finish the first check by
        <input type="date" value={draft.checkBy} onChange={(event) => { setDraft((current) => ({ ...current, checkBy: event.target.value })); setStatus("Working in this tab. Nothing is saved or sent."); }} />
      </label>

      <aside className="constraint-map__boundary"><strong>Do not crown a winner from this worksheet.</strong><span>The map makes competing explanations visible. The checks—not the wording—should change which cause you rely on.</span></aside>

      <div className="constraint-map__actions">
        <button className="button button-dark" type="button" onClick={save}>Save on This Device</button>
        <button className="button button-outline" type="button" onClick={copyMap}>Copy Constraint Map</button>
        <button className="button button-ghost" type="button" onClick={clear}>Clear Device Map</button>
        <p role="status">{status}</p>
      </div>
    </section>
  );
}
