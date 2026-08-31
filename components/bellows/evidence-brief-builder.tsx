"use client";

import { useEffect, useMemo, useState } from "react";
import {
  decideEvidenceBrief,
  type EvidenceContradiction,
  type EvidenceFreshness,
  type ProfessionalReview
} from "@/lib/bellows/evidence-brief-decision";

const FIELDS = [
  ["claim", "Exact claim", "The equipment will let us complete two more paid jobs each week."],
  ["decision", "Why the claim matters", "This decides whether we buy, rent, or wait."],
  ["sources", "Sources and dates", "Three customer requests observed Aug. 17; two current vendor quotes dated this month."],
  ["supported", "Directly supported", "Customers asked for work requiring the equipment; current quotes establish acquisition cost."],
  ["inference", "Inference—not yet established", "Those requests will become recurring paid demand."],
  ["gap", "Contradiction or unresolved gap", "We do not know whether demand remains after the first month."],
  ["change", "What would change confidence", "Two prepaid jobs or four weeks of comparable rental utilization."],
  ["next", "Next check or outside review", "Rent for one job, record margin, then have the financing structure reviewed if buying still makes sense."]
] as const;

type EvidenceBriefValues = Record<(typeof FIELDS)[number][0], string>;
const STORAGE_KEY = "werkles:bellows:evidence-brief:v2";
const MAX_TEXT = 600;

function emptyBrief(): EvidenceBriefValues {
  return Object.fromEntries(FIELDS.map(([id]) => [id, ""])) as EvidenceBriefValues;
}

function restoredBrief(value: unknown): {
  values: EvidenceBriefValues;
  freshness: EvidenceFreshness;
  contradiction: EvidenceContradiction;
  professionalReview: ProfessionalReview;
} | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const topKeys = ["values", "freshness", "contradiction", "professionalReview"];
  if (Object.keys(record).length !== topKeys.length || !topKeys.every((key) => key in record)) return null;
  if (!record.values || typeof record.values !== "object" || Array.isArray(record.values)) return null;
  const fields = record.values as Record<string, unknown>;
  const fieldIds = FIELDS.map(([id]) => id);
  if (Object.keys(fields).length !== fieldIds.length || !fieldIds.every((id) => typeof fields[id] === "string" && (fields[id] as string).length <= MAX_TEXT)) return null;
  if (!["current_for_decision", "stale", "unknown"].includes(String(record.freshness))) return null;
  if (!["none_identified", "unresolved", "unknown"].includes(String(record.contradiction))) return null;
  if (!["not_identified", "required", "unknown"].includes(String(record.professionalReview))) return null;
  return {
    values: Object.fromEntries(fieldIds.map((id) => [id, fields[id] as string])) as EvidenceBriefValues,
    freshness: record.freshness as EvidenceFreshness,
    contradiction: record.contradiction as EvidenceContradiction,
    professionalReview: record.professionalReview as ProfessionalReview
  };
}

export function EvidenceBriefBuilder() {
  const [values, setValues] = useState<EvidenceBriefValues>(emptyBrief);
  const [freshness, setFreshness] = useState<EvidenceFreshness>("unknown");
  const [contradiction, setContradiction] = useState<EvidenceContradiction>("unknown");
  const [professionalReview, setProfessionalReview] = useState<ProfessionalReview>("unknown");
  const [status, setStatus] = useState("Not saved. Unknowns belong in the brief; do not smooth them over.");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = restoredBrief(JSON.parse(saved));
      if (!parsed) {
        setStatus("The saved device brief was invalid and was not restored. Nothing was sent.");
        return;
      }
      setValues(parsed.values);
      setFreshness(parsed.freshness);
      setContradiction(parsed.contradiction);
      setProfessionalReview(parsed.professionalReview);
      setStatus("Restored from this device. It is not saved to your Werkles account or shared.");
    } catch {
      setStatus("The earlier browser draft could not be restored. Start a fresh brief below.");
    }
  }, []);

  const decision = useMemo(() => decideEvidenceBrief({ fields: values, freshness, contradiction, professionalReview }), [values, freshness, contradiction, professionalReview]);

  const exportText = useMemo(() => [
    "EVIDENCE BRIEF — MEMBER WORKING DRAFT",
    "Not independently verified. Unknowns and contradictions remain visible.",
    "",
    ...FIELDS.map(([id, label]) => `${label}: ${values[id].trim() || "Unknown / not filled yet"}`),
    `Fresh enough for this decision: ${freshness}`,
    `Contradiction status: ${contradiction}`,
    `Professional review: ${professionalReview}`,
    `Werkles bridge: ${decision.heading}`
  ].join("\n"), [values, freshness, contradiction, professionalReview, decision.heading]);

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ values, freshness, contradiction, professionalReview }));
      setStatus("Saved on this device. It is not account-saved or shared.");
    } catch {
      setStatus("This browser blocked the save. The brief remains visible on this page.");
    }
  }

  function clear() {
    window.localStorage.removeItem(STORAGE_KEY);
    setValues(emptyBrief());
    setFreshness("unknown");
    setContradiction("unknown");
    setProfessionalReview("unknown");
    setStatus("Device draft cleared. Nothing was deleted from a Werkles account because this brief was never stored there.");
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(exportText);
      setStatus("Evidence Brief copied. Review every claim, source, date, and gap before sharing or relying on it.");
    } catch {
      setStatus("Copy was blocked. The complete brief remains visible below.");
    }
  }

  return (
    <section className="evidence-brief" aria-labelledby="evidenceBriefTitle">
      <header>
        <p className="eyebrow">Reusable work product</p>
        <h2 id="evidenceBriefTitle">Build an Evidence Brief.</h2>
        <p>Separate what the source actually supports from what you hope it means. A blank or contradiction is a result—not a failure.</p>
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
              onChange={(event) => setValues((current) => ({ ...current, [id]: event.target.value }))}
            />
          </label>
        ))}
      </div>
      <fieldset className="evidence-brief__decision-inputs">
        <legend>Before this brief can point to a next check</legend>
        <label><span>Are the sources current enough for this exact decision?</span>
          <select value={freshness} onChange={(event) => setFreshness(event.target.value as EvidenceFreshness)}>
            <option value="unknown">Unknown</option><option value="current_for_decision">Yes—current for this decision</option><option value="stale">No—stale</option>
          </select>
        </label>
        <label><span>Do the sources contradict each other?</span>
          <select value={contradiction} onChange={(event) => setContradiction(event.target.value as EvidenceContradiction)}>
            <option value="unknown">Unknown</option><option value="none_identified">No contradiction identified</option><option value="unresolved">Yes—unresolved</option>
          </select>
        </label>
        <label><span>Does the next decision require a qualified professional?</span>
          <select value={professionalReview} onChange={(event) => setProfessionalReview(event.target.value as ProfessionalReview)}>
            <option value="unknown">Unknown</option><option value="required">Yes—review required</option><option value="not_identified">Not needed for this decision</option>
          </select>
        </label>
      </fieldset>
      <aside className={`evidence-brief__decision evidence-brief__decision--${decision.state}`} aria-live="polite">
        <p className="eyebrow">Werkles bridge</p>
        <h3>{decision.heading}</h3>
        <p>{decision.detail}</p>
        {decision.missing.length ? <p><strong>Still blank:</strong> {decision.missing.join(", ")}</p> : null}
      </aside>
      <div className="evidence-brief__actions">
        <button type="button" onClick={save}>Save on This Device</button>
        <button type="button" className="button button-outline" onClick={copy}>Copy the Evidence Brief</button>
        <button type="button" className="button button-outline" onClick={clear}>Clear Device Draft</button>
      </div>
      <p className="evidence-brief__status" role="status">{status}</p>
      <aside className="evidence-brief__preview" aria-label="Evidence Brief preview">
        <p className="eyebrow">Your working brief</p>
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
