"use client";

import { useEffect, useMemo, useState } from "react";

import {
  PERSONAL_PLAN_CHECK_IN_KEY,
  PERSONAL_PLAN_CHECK_IN_LABELS,
  storedPersonalPlanCheckInFrom,
  type StoredPersonalPlanCheckIn
} from "@/lib/bellows/personal-plan-check-in";
import {
  createWorkshopActionPlan,
  WORKSHOP_ACTION_PLAN_KEY,
  workshopActionPlanDigest,
  workshopActionPlanFrom,
  type WorkshopActionPlan
} from "@/lib/workshop/action-plan-device";

type Draft = Omit<WorkshopActionPlan, "version" | "savedAt">;

const EMPTY: Draft = Object.freeze({
  nextOutcome: "",
  firstTest: "",
  resultRule: "",
  owner: "Me",
  reviewDate: "",
  contextNote: ""
});

export function WorkshopActionBoard() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saved, setSaved] = useState<WorkshopActionPlan | null>(null);
  const [checkIn, setCheckIn] = useState<StoredPersonalPlanCheckIn | null>(null);
  const [status, setStatus] = useState("No Action Plan saved on this device yet.");

  useEffect(() => {
    try {
      const rawPlan = window.localStorage.getItem(WORKSHOP_ACTION_PLAN_KEY);
      const plan = rawPlan ? workshopActionPlanFrom(JSON.parse(rawPlan)) : null;
      if (plan) {
        setSaved(plan);
        setDraft({
          nextOutcome: plan.nextOutcome,
          firstTest: plan.firstTest,
          resultRule: plan.resultRule,
          owner: plan.owner,
          reviewDate: plan.reviewDate,
          contextNote: plan.contextNote
        });
        setStatus("Your saved Action Plan is ready to revise on this device.");
      }
      const rawCheckIn = window.localStorage.getItem(PERSONAL_PLAN_CHECK_IN_KEY);
      setCheckIn(rawCheckIn ? storedPersonalPlanCheckInFrom(JSON.parse(rawCheckIn)) : null);
    } catch {
      setStatus("This browser could not read saved Workshop work.");
    }
  }, []);

  const digest = useMemo(() => saved ? workshopActionPlanDigest(saved) : "", [saved]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function carryCheckIn() {
    if (!checkIn) return;
    const carried = [PERSONAL_PLAN_CHECK_IN_LABELS[checkIn.choice], checkIn.note].filter(Boolean).join(": ");
    update("contextNote", carried);
    setStatus("Bellows context added to the context field only. No plan field was overwritten.");
  }

  function savePlan() {
    try {
      const plan = createWorkshopActionPlan(draft);
      window.localStorage.setItem(WORKSHOP_ACTION_PLAN_KEY, JSON.stringify(plan));
      setSaved(plan);
      setStatus("Action Plan saved on this device. Nothing was shared or added to your account.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Complete the Action Plan before saving.");
    }
  }

  async function copyDigest() {
    if (!digest) return;
    try {
      await navigator.clipboard.writeText(digest);
      setStatus("Action Plan Digest copied. Copying did not share or submit it.");
    } catch {
      setStatus("This browser could not copy the digest. The saved plan is unchanged.");
    }
  }

  function clearPlan() {
    try { window.localStorage.removeItem(WORKSHOP_ACTION_PLAN_KEY); } catch { /* State still clears. */ }
    setDraft(EMPTY);
    setSaved(null);
    setStatus("Action Plan cleared from this device.");
  }

  return (
    <section className="workshop-action-board" aria-labelledby="workshopActionBoardTitle">
      <header className="workshop-action-board__heading">
        <div>
          <p className="workshop-eyebrow">Do the work here</p>
          <h2 id="workshopActionBoardTitle">Build one Action Plan you can return to.</h2>
        </div>
        <p>Choose the next outcome, the smallest test, and the result that will change your decision. This is your working draft—not a shared promise.</p>
      </header>

      {checkIn ? (
        <aside className="workshop-action-board__check-in">
          <div>
            <strong>From your Personal Bellows check-in</strong>
            <p>{PERSONAL_PLAN_CHECK_IN_LABELS[checkIn.choice]}{checkIn.note ? ` — ${checkIn.note}` : ""}</p>
          </div>
          <button className="button button-outline" type="button" onClick={carryCheckIn}>Use This as Context</button>
          <small>Nothing is imported until you choose this. It fills only the context field.</small>
        </aside>
      ) : null}

      <div className="workshop-action-board__fields">
        <label><span>Next outcome</span><textarea rows={3} maxLength={500} value={draft.nextOutcome} onChange={(event) => update("nextOutcome", event.target.value)} placeholder="What should be different when this short plan is finished?" /></label>
        <label><span>First test</span><textarea rows={3} maxLength={700} value={draft.firstTest} onChange={(event) => update("firstTest", event.target.value)} placeholder="What is the smallest real action that will teach you something?" /></label>
        <label><span>What result counts</span><textarea rows={3} maxLength={700} value={draft.resultRule} onChange={(event) => update("resultRule", event.target.value)} placeholder="What observable result means continue, revise, or stop?" /></label>
        <label><span>Owner</span><input maxLength={120} value={draft.owner} onChange={(event) => update("owner", event.target.value)} /></label>
        <label><span>Review date</span><input type="date" value={draft.reviewDate} onChange={(event) => update("reviewDate", event.target.value)} /></label>
        <label className="workshop-action-board__context"><span>Context I chose to carry in <small>Optional</small></span><textarea rows={3} maxLength={800} value={draft.contextNote} onChange={(event) => update("contextNote", event.target.value)} /></label>
      </div>

      <div className="workshop-action-board__actions">
        <button className="button button-dark" type="button" onClick={savePlan}>Save My Action Plan</button>
        {saved ? <button className="button button-outline" type="button" onClick={clearPlan}>Clear It</button> : null}
      </div>
      <p role="status">{status}</p>

      {saved ? (
        <article className="workshop-action-board__digest" aria-labelledby="actionPlanDigestTitle">
          <div className="workshop-action-board__digest-heading">
            <div><p className="workshop-eyebrow">Action Plan Digest</p><h3 id="actionPlanDigestTitle">One page. One test. One review date.</h3></div>
            <button className="button button-outline" type="button" onClick={copyDigest}>Copy Digest</button>
          </div>
          <dl>
            <div><dt>Target outcome</dt><dd>{saved.nextOutcome}</dd></div>
            <div><dt>Immediate test</dt><dd>{saved.firstTest}</dd></div>
            <div><dt>Result that counts</dt><dd>{saved.resultRule}</dd></div>
            <div><dt>Owner</dt><dd>{saved.owner}</dd></div>
            <div><dt>Review date</dt><dd>{saved.reviewDate}</dd></div>
            {saved.contextNote ? <div><dt>Context deliberately carried in</dt><dd>{saved.contextNote}</dd></div> : null}
          </dl>
          <p>Working draft from this device. Not an agreement, provider result, or shared commitment.</p>
        </article>
      ) : null}
    </section>
  );
}
