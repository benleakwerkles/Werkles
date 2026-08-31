"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  PARTNERSHIP_PREPARATION_CONTEXT_KEY,
  partnershipPreparationContextFrom,
  type PartnershipPreparationContext
} from "@/lib/bellows/partnership-preparation-context";
import {
  isWerkleFirstSharedActionCurrent,
  WERKLE_FIRST_SHARED_ACTION_KEY,
  werkleFirstSharedActionFrom,
  type WerkleFirstSharedAction
} from "@/lib/werkle/first-shared-action";
import { firstSharedStepFromOperatingBrief } from "@/lib/werkle/operating-brief";
import {
  storedWerkleOperatingBriefFrom,
  WERKLE_OPERATING_BRIEF_DEVICE_KEY
} from "@/lib/werkle/operating-brief-device";

export function MatchCheckContext({ showEmpty = false }: { showEmpty?: boolean }) {
  const [context, setContext] = useState<PartnershipPreparationContext | null | undefined>(undefined);
  const [sharedAction, setSharedAction] = useState<WerkleFirstSharedAction | null>(null);
  const [claim, setClaim] = useState("");
  const [status, setStatus] = useState("Nothing is saved or sent.");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PARTNERSHIP_PREPARATION_CONTEXT_KEY);
      setContext(raw ? partnershipPreparationContextFrom(JSON.parse(raw)) : null);
      const rawAction = window.localStorage.getItem(WERKLE_FIRST_SHARED_ACTION_KEY);
      const rawBrief = window.localStorage.getItem(WERKLE_OPERATING_BRIEF_DEVICE_KEY);
      const storedBrief = rawBrief ? storedWerkleOperatingBriefFrom(JSON.parse(rawBrief)) : null;
      const currentStep = storedBrief ? firstSharedStepFromOperatingBrief(storedBrief.brief) : null;
      const parsedAction = rawAction ? werkleFirstSharedActionFrom(JSON.parse(rawAction)) : null;
      setSharedAction(parsedAction && storedBrief && currentStep && isWerkleFirstSharedActionCurrent(parsedAction, storedBrief.brief.formationId, currentStep) ? parsedAction : null);
      if ((raw || rawAction) && window.location.hash === "#match-check-context") {
        window.requestAnimationFrame(() => document.getElementById("match-check-context")?.scrollIntoView());
      }
    } catch {
      setContext(null);
    }
  }, []);

  if (context === undefined) return null;
  if (!context && !sharedAction) {
    return showEmpty ? (
      <section className="ops-card match-check-context" id="match-check-context" aria-labelledby="match-check-empty-title">
        <div className="card-heading"><p>Checks follow the work</p><h2 id="match-check-empty-title">Choose a profile before choosing a check.</h2></div>
        <p>Start with fit, useful differences, and a conversation. Bring a profile here only when a specific claim would change the next decision.</p>
        <Link className="button button-outline" href="/dashboard/intros">Open Match Deck</Link>
      </section>
    ) : null;
  }

  function useQuestion() {
    if (claim.trim().length < 10) {
      setStatus("Name the exact claim that would change your decision first.");
      return;
    }
    setStatus("Question ready. Ask the person first; compare the checks below only if outside evidence is necessary.");
    window.dispatchEvent(new Event("werkles:open-check-catalog"));
    window.requestAnimationFrame(() => {
      document.querySelector(".crucible-check-catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <section className="ops-card match-check-context" id="match-check-context" aria-labelledby="match-check-title">
      <div className="card-heading">
        <p>Before any check</p>
        <h2 id="match-check-title">
          {context ? `What would you actually need to know about ${context.displayName}?` : "What would you need to know before relying on this shared action?"}
        </h2>
      </div>
      {context ? (
        <>
          <p>{context.displayName} is a synthetic practice profile—not a member, introduction, or verified person.</p>
          <div className="member-works-now__grid">
            <div><h3>Why this profile surfaced</h3><p>{context.fitReasons[0] ?? "The current match reason needs more information."}</p></div>
            <div><h3>What could make the fit wrong</h3><p>{context.fitCautions[0] ?? "No specific caution is recorded; fit is still unverified."}</p></div>
          </div>
        </>
      ) : null}
      {sharedAction ? (
        <aside className="match-check-context__action" aria-labelledby="match-check-action-title">
          <div><p>From the proposed shared action on this device</p><h3 id="match-check-action-title">Check only what could change this plan.</h3></div>
          <dl>
            <div><dt>Action</dt><dd>{sharedAction.action || "Still open"}</dd></div>
            <div><dt>Volunteer</dt><dd>{sharedAction.volunteer || "Nobody named yet"}</dd></div>
            <div><dt>Check back</dt><dd>{sharedAction.checkIn || "No date yet"}</dd></div>
            <div><dt>Done means</dt><dd>{sharedAction.doneWhen || "Still open"}</dd></div>
          </dl>
          <p>This device draft is not proof, an assignment, or an agreement. Provider checks should answer one necessary claim—not grade the person or the partnership.</p>
        </aside>
      ) : null}
      <label className="match-check-context__claim">
        <span>The claim that would change your next decision</span>
        <textarea
          rows={3}
          maxLength={500}
          value={claim}
          onChange={(event) => { setClaim(event.target.value); setStatus("Nothing is saved or sent."); }}
          placeholder={sharedAction ? "For example: Is the permit required before this test can legally begin?" : "For example: Can this person legally perform the licensed work they offered in this state?"}
        />
      </label>
      <ol>
        <li><strong>Ask directly first.</strong> Availability, expectations, goals, and working style usually need a conversation—not a provider.</li>
        <li><strong>Use one narrow check only if needed.</strong> Identity, phone control, a license record, and a dated funds threshold answer different questions.</li>
        <li><strong>Read the limit beside the result.</strong> A completed check never proves broad trust, fit, or future behavior.</li>
      </ol>
      <div className="member-selected-surface__actions">
        <button className="button button-dark" type="button" onClick={useQuestion}>Use This Question Below</button>
        {context ? <Link className="button button-outline" href="/bellows/personal/partnership-alignment">Prepare the Conversation</Link> : null}
        {sharedAction ? <Link className="button button-outline" href="/dashboard/werkles/formation">Return to Formation</Link> : null}
        {context ? <Link className="button button-outline" href="/dashboard/intros">Back to Match Deck</Link> : null}
      </div>
      <p className="status-line" role="status">{status}</p>
    </section>
  );
}
