"use client";

import { useEffect, useMemo, useState } from "react";

const FIELDS = [
  ["decision", "Decision this test should change", "Whether to offer same-day parts delivery to local repair shops."],
  ["assumption", "Riskiest assumption", "At least three qualifying shops will pay $125 a month for it."],
  ["challenge", "Why it could be wrong", "They may like the idea but use it too rarely to pay every month."],
  ["target", "Who or what can challenge it", "Ten independently owned repair shops within the delivery area."],
  ["test", "Smallest honest test", "Offer a two-week paid pilot with the real service area and response time."],
  ["threshold", "Pass, revise, or stop rule", "Proceed at three paid pilots; revise at one or two; stop at zero."],
  ["limits", "Deadline and cost cap", "Finish in fourteen days; spend no more than $250."],
  ["unknown", "What a pass still will not prove", "Retention, route density, long-term margin, or demand outside this group."]
] as const;

type FieldId = (typeof FIELDS)[number][0];
type AssumptionTestValues = Record<FieldId, string>;
const STORAGE_KEY = "werkles:bellows:assumption-test:v1";
const MAX_TEXT = 600;

function emptyValues(): AssumptionTestValues {
  return Object.fromEntries(FIELDS.map(([id]) => [id, ""])) as AssumptionTestValues;
}

function restoredValues(value: unknown): AssumptionTestValues | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const ids = FIELDS.map(([id]) => id);
  if (Object.keys(record).length !== ids.length || !ids.every((id) => id in record)) return null;
  if (!ids.every((id) => typeof record[id] === "string" && (record[id] as string).length <= MAX_TEXT)) return null;
  return Object.fromEntries(ids.map((id) => [id, record[id] as string])) as AssumptionTestValues;
}

export function AssumptionTestCard() {
  const [values, setValues] = useState<AssumptionTestValues>(emptyValues);
  const [status, setStatus] = useState("Nothing is saved or sent from this public tool.");
  const copyText = useMemo(() => [
    "ASSUMPTION TEST CARD — WORKING DRAFT",
    "A test reduces uncertainty; it does not guarantee an outcome.",
    "",
    ...FIELDS.map(([id, label]) => `${label}: ${values[id].trim() || "Unknown / not filled yet"}`)
  ].join("\n"), [values]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const restored = restoredValues(JSON.parse(raw));
      if (!restored) {
        setStatus("The saved device test was invalid and was not restored. Nothing was sent.");
        return;
      }
      setValues(restored);
      setStatus("Saved Assumption Test restored from this device. It was not shared.");
    } catch {
      setStatus("The saved device test could not be read. Nothing was sent.");
    }
  }, []);

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      setStatus("Saved on this device. It is not account-saved or shared.");
    } catch {
      setStatus("This browser could not save the test. Nothing was sent.");
    }
  }

  function clear() {
    window.localStorage.removeItem(STORAGE_KEY);
    setValues(emptyValues());
    setStatus("Device test cleared. Nothing was sent.");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setStatus("Copied. Set the threshold before you run the test; do not rewrite it after seeing the result.");
    } catch {
      setStatus("Copy was blocked. Your working card remains visible below.");
    }
  }

  return (
    <section className="evidence-brief assumption-test-card" aria-labelledby="assumptionTestCardTitle">
      <header>
        <p className="eyebrow">Reusable work product</p>
        <h2 id="assumptionTestCardTitle">Build an Assumption Test Card.</h2>
        <p>Make one uncertainty cheap enough to inspect before it becomes a purchase, promise, hire, move, loan, or partnership.</p>
      </header>
      <div className="evidence-brief__form">
        {FIELDS.map(([id, label, placeholder]) => (
          <label key={id}>
            <span>{label}</span>
            <textarea
              rows={3}
              maxLength={MAX_TEXT}
              value={values[id]}
              placeholder={placeholder}
              onChange={(event) => { setValues((current) => ({ ...current, [id]: event.target.value })); setStatus("Working in this tab. Nothing is saved or sent."); }}
            />
          </label>
        ))}
      </div>
      <div className="evidence-brief__actions">
        <button type="button" onClick={save}>Save on This Device</button>
        <button className="button button-outline" type="button" onClick={copy}>Copy the Test Card</button>
        <button className="button button-outline" type="button" onClick={clear}>Clear Device Test</button>
      </div>
      <p className="evidence-brief__status" role="status">{status}</p>
      <aside className="evidence-brief__preview" aria-label="Assumption Test Card preview">
        <p className="eyebrow">Your working test</p>
        <dl>
          {FIELDS.map(([id, label]) => (
            <div key={id}>
              <dt>{label}</dt>
              <dd>{values[id].trim() || "Unknown / not filled yet"}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </section>
  );
}
