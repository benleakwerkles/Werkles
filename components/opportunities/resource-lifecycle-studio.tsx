"use client";

import { useState } from "react";

import type { BusinessOpportunityCandidate } from "@/lib/opportunities/types";
import {
  sharedDecisionState,
  surfaceResponsibility,
  type ResourceSurface
} from "@/lib/opportunities/resource-lifecycle";

const SURFACE_DETAILS = {
  bellows: {
    label: "Personal Bellows",
    title: "Learn what to compare before anybody makes a call.",
    body: "This room is private. It helps you understand the lead, name what is still unknown, and decide whether it deserves space in your Workshop."
  },
  workshop: {
    label: "Workshop",
    title: "Turn a useful lead into a small piece of owned work.",
    body: "A promising link is not a plan. Give one person one question to answer so the lead can earn—or lose—its place in the business."
  },
  werkle: {
    label: "Shared Werkle",
    title: "Put the same proposal in front of both people.",
    body: "Private notes stay private. The shared room receives the source, the open question, and each participant’s explicit decision."
  }
} as const;

const CHECKS = ["Current availability", "Total cost", "Terms or eligibility", "Fit for the actual work"] as const;

function BellowsWork({ candidate }: { candidate: BusinessOpportunityCandidate }) {
  const [checked, setChecked] = useState<string[]>([]);
  return (
    <div className="resource-lifecycle__work">
      <p className="resource-lifecycle__prompt">What would you need to understand before this became a real option?</p>
      <div className="resource-lifecycle__checks">
        {CHECKS.map((item) => (
          <label key={item}>
            <input
              type="checkbox"
              checked={checked.includes(item)}
              onChange={() => setChecked((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])}
            />
            <span>{item}</span>
          </label>
        ))}
      </div>
      <p className="resource-lifecycle__result">
        {checked.length ? `${checked.length} comparison ${checked.length === 1 ? "question" : "questions"} ready for your Workshop.` : `Start with the unknown Werkles already found: ${candidate.unknowns[0]}`}
      </p>
    </div>
  );
}

function WorkshopWork() {
  const [owner, setOwner] = useState("Me");
  const [question, setQuestion] = useState("What is the total cost for one real job?");
  const [started, setStarted] = useState(false);
  return (
    <div className="resource-lifecycle__work">
      <div className="resource-lifecycle__field-row">
        <label>Who will check it?<select value={owner} onChange={(event) => setOwner(event.target.value)}><option>Me</option><option>Rosa</option><option>Decide together</option></select></label>
        <label>What answer do we need?<input value={question} onChange={(event) => setQuestion(event.target.value)} /></label>
      </div>
      <button className="button button-dark" type="button" onClick={() => setStarted(true)}>Put This on the Work Board</button>
      <p className="resource-lifecycle__result" aria-live="polite">
        {started ? `${owner} owns this check: ${question || "Add one answerable question."}` : "Nothing is assigned until you choose to make it work."}
      </p>
    </div>
  );
}

function WerkleWork() {
  const [you, setYou] = useState<"undecided" | "interested" | "not_for_us">("undecided");
  const [rosa, setRosa] = useState<"undecided" | "interested" | "not_for_us">("undecided");
  const state = sharedDecisionState({ you, rosa });
  const result = state === "accepted_for_shared_work"
    ? "Both people want to investigate it. The proposal can move onto the shared work board."
    : state === "dismissed"
      ? "The proposal does not move forward. Nobody’s private notes were exposed."
      : "This remains a proposal until both people respond.";
  return (
    <div className="resource-lifecycle__work">
      <div className="resource-lifecycle__votes">
        <Decision label="You" value={you} onChange={setYou} />
        <Decision label="Rosa (practice partner)" value={rosa} onChange={setRosa} />
      </div>
      <p className="resource-lifecycle__result" aria-live="polite"><strong>{state.replaceAll("_", " ")}</strong>{result}</p>
    </div>
  );
}

function Decision({ label, value, onChange }: { label: string; value: "undecided" | "interested" | "not_for_us"; onChange: (value: "undecided" | "interested" | "not_for_us") => void }) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <button type="button" aria-pressed={value === "interested"} data-active={value === "interested"} onClick={() => onChange("interested")}>Worth checking</button>
      <button type="button" aria-pressed={value === "not_for_us"} data-active={value === "not_for_us"} onClick={() => onChange("not_for_us")}>Not for us</button>
    </fieldset>
  );
}

export function ResourceLifecycleStudio({ candidate, surface }: { candidate: BusinessOpportunityCandidate; surface: ResourceSurface }) {
  const details = SURFACE_DETAILS[surface];
  return (
    <section className={`resource-lifecycle resource-lifecycle--${surface}`} id="resource-workflow" aria-labelledby="resource-lifecycle-title">
      <header>
        <div><p className="resource-lifecycle__eyebrow">{details.label} · a different job</p><h2 id="resource-lifecycle-title">{details.title}</h2><p>{details.body}</p></div>
        <aside><strong>This room’s responsibility</strong><span>{surfaceResponsibility(surface)}</span></aside>
      </header>
      <article className="resource-lifecycle__lead">
        <div>
          <span>Source lead—not a Werkles recommendation</span>
          <h3>{candidate.name}</h3>
          <p>{candidate.whyItAppeared[0]}</p>
        </div>
        <a href={candidate.sourceUrl} target="_blank" rel="noreferrer">Open the source →</a>
      </article>
      {surface === "bellows" ? <BellowsWork candidate={candidate} /> : surface === "workshop" ? <WorkshopWork /> : <WerkleWork />}
      <p className="resource-lifecycle__boundary">This walkthrough does not contact the organization, check eligibility, make a reservation, submit an application, or expose either person’s private notes.</p>
    </section>
  );
}
