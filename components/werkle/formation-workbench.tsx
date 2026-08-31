"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PartnerPerspectiveExercise } from "@/components/werkle/partner-perspective-exercise";
import { FormationArrivalContext } from "@/components/werkle/formation-arrival-context";
import { FirstSharedActionPlanner } from "@/components/werkle/first-shared-action-planner";
import { PracticeBoundaryReadout } from "@/components/werkle/practice-boundary-readout";
import { TopicExperimentCard } from "@/components/werkle/topic-experiment-card";

import {
  createWerkleOperatingBrief,
  firstSharedStepFromOperatingBrief,
  isWerkleOperatingBriefCurrent,
  openTopicsForOperatingBriefSection,
  type WerkleOperatingBrief
} from "@/lib/werkle/operating-brief";
import {
  isWerkleFirstSharedActionCurrent,
  WERKLE_FIRST_SHARED_ACTION_KEY,
  werkleFirstSharedActionFrom
} from "@/lib/werkle/first-shared-action";

import {
  createStoredWerkleOperatingBrief,
  storedWerkleOperatingBriefFrom,
  WERKLE_OPERATING_BRIEF_DEVICE_KEY
} from "@/lib/werkle/operating-brief-device";
import { WERKLE_OPERATING_BRIEF_CHANGE_EVENT } from "@/lib/member-work-location";

import {
  cleanWerkleText,
  createWerkleFormationDraft,
  restoreWerkleFormationDraft,
  werkleActiveStatement,
  werkleFormationSummary,
  werkleTopicStatus,
  type WerkleFormationDraft,
  type WerkleFormationEvent,
  type WerkleFormationSeed,
  type WerkleParticipantId,
  type WerkleResolutionChoice,
  type WerkleTopicDefinition,
  type WerkleTopicDraft,
  type WerkleTopicId,
  type WerkleTopicStatus
} from "@/lib/werkle/formation";

const GROUPS = [
  { id: "foundation", label: "The company underneath the idea", detail: "Purpose, customer, and the first honest test." },
  { id: "working_agreement", label: "How the work would run", detail: "Responsibilities, decisions, and contributions." },
  { id: "hard_edges", label: "The questions friendship cannot answer for you", detail: "Money, proof, exit, ownership, privacy, and unknowns." }
] as const;

const STATUS_COPY: Record<WerkleTopicStatus, { label: string; detail: string }> = {
  unstarted: { label: "Not opened", detail: "Neither person has proposed a direction." },
  proposed: { label: "Waiting on someone", detail: "A proposal exists, but the exact result is not mutual yet." },
  accepted: { label: "Both accepted", detail: "Both sides chose the same result. Joint wording is tied to one exact revision." },
  objected: { label: "Different answers", detail: "The disagreement stays visible until both people choose what to do with it." },
  parked: { label: "Parked on purpose", detail: "Both people agreed not to force an answer yet." },
  private: { label: "Kept out", detail: "Both people agreed this material stays in the source Workshops." }
};

function sourcePreview(text: string, limit = 220): { preview: string; shortened: boolean } {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return { preview: clean, shortened: false };
  const slice = clean.slice(0, limit);
  const lastStop = Math.max(slice.lastIndexOf(". "), slice.lastIndexOf("; "), slice.lastIndexOf(", "));
  const end = lastStop >= 120 ? lastStop + 1 : slice.lastIndexOf(" ");
  return { preview: `${slice.slice(0, Math.max(end, 120)).trim()}…`, shortened: true };
}

const CHOICES: readonly Readonly<{ id: WerkleResolutionChoice; owner: string; partner: string; help: string }>[] = Object.freeze([
  Object.freeze({ id: "owner", owner: "Use your wording", partner: "Use their wording", help: "Carry the statement from Your Workshop into the proposed Werkle." }),
  Object.freeze({ id: "partner", owner: "Use their wording", partner: "Use your wording", help: "Carry the statement from the other Workshop into the proposed Werkle." }),
  Object.freeze({ id: "combine", owner: "Write this together", partner: "Write this together", help: "Create new joint wording while keeping links to both originals." }),
  Object.freeze({ id: "private", owner: "Keep this out", partner: "Keep this out", help: "Leave both source statements in their original Workshops." }),
  Object.freeze({ id: "park", owner: "Leave this unresolved", partner: "Leave this unresolved", help: "Keep the disagreement visible without pretending it is settled." })
]);

function actorLabel(seed: WerkleFormationSeed, actor: WerkleParticipantId) {
  return actor === "owner" ? seed.ownerLabel : seed.partnerLabel;
}

function actorDecisionCopy(seed: WerkleFormationSeed, actor: WerkleParticipantId) {
  return actor === "owner" && seed.ownerLabel === "You"
    ? { possessive: "your", subject: "You decide" }
    : { possessive: `${actorLabel(seed, actor)}'s`, subject: `${actorLabel(seed, actor)} decides` };
}

function workshopOwnerLabel(seed: WerkleFormationSeed, actor: WerkleParticipantId) {
  if (actor === "owner" && seed.ownerLabel === "You") return "Your";
  const label = actorLabel(seed, actor);
  return label.endsWith("s") ? `${label}'` : `${label}'s`;
}

function eventNow(topicId: WerkleTopicId, actor: WerkleParticipantId, kind: WerkleFormationEvent["kind"], detail: string): WerkleFormationEvent {
  return Object.freeze({
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${topicId}-${Date.now()}`,
    topicId,
    actor,
    kind,
    detail,
    at: new Date().toISOString()
  });
}

function updateTopicDraft(
  current: WerkleFormationDraft,
  topicId: WerkleTopicId,
  nextTopic: WerkleTopicDraft,
  event?: WerkleFormationEvent
): WerkleFormationDraft {
  return Object.freeze({
    ...current,
    updatedAt: new Date().toISOString(),
    topics: Object.freeze({ ...current.topics, [topicId]: Object.freeze(nextTopic) }),
    events: event ? Object.freeze([...current.events, event].slice(-240)) : current.events
  });
}

function choiceLabel(seed: WerkleFormationSeed, actor: WerkleParticipantId, choice: WerkleResolutionChoice | null) {
  if (!choice) return "No answer yet";
  if (choice === "owner") return `Use ${seed.ownerLabel === "You" ? "your" : `${seed.ownerLabel}'s`} wording`;
  if (choice === "partner") return `Use ${seed.partnerLabel}'s wording`;
  if (choice === "combine") return "Write this together";
  if (choice === "private") return "Keep this out of the Werkle";
  return "Leave this unresolved";
}

function SharedStatement({ definition, topic }: { definition: WerkleTopicDefinition; topic: WerkleTopicDraft }) {
  const statement = werkleActiveStatement(definition, topic);
  if (!statement) return null;
  const provenance = topic.choices.owner === "combine"
    ? `${definition.ownerSource.origin} + ${definition.partnerSource.origin}`
    : topic.choices.owner === "owner"
      ? definition.ownerSource.origin
      : definition.partnerSource.origin;
  return (
    <article className="werkle-floor__statement">
      <span>{definition.label}</span>
      <p>{statement}</p>
      <small>Comes from: {provenance}</small>
    </article>
  );
}

function JointEditor({
  definition,
  topic,
  onCommit
}: {
  definition: WerkleTopicDefinition;
  topic: WerkleTopicDraft;
  onCommit: (topicId: WerkleTopicId, value: string) => void;
}) {
  const [value, setValue] = useState(topic.jointText);
  useEffect(() => setValue(topic.jointText), [topic.jointText]);
  return (
    <label htmlFor={`joint-${definition.id}`}>
      <span>Proposed joint wording · revision {topic.revision}</span>
      <textarea
        id={`joint-${definition.id}`}
        rows={4}
        maxLength={1400}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={(event) => onCommit(definition.id, event.currentTarget.value)}
      />
    </label>
  );
}

export function WerkleFormationWorkbench({ seed }: { seed: WerkleFormationSeed }) {
  const [draft, setDraft] = useState<WerkleFormationDraft>(() => createWerkleFormationDraft(seed));
  const actor: WerkleParticipantId = "owner";
  const [activeTopicId, setActiveTopicId] = useState<WerkleTopicId>(() => seed.definitions[0].id);
  const [restored, setRestored] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Opening a private formation draft on this device.");
  const [operatingBrief, setOperatingBrief] = useState<WerkleOperatingBrief | null>(null);
  const [briefStatus, setBriefStatus] = useState("Build a brief when you want a clean readout of the wording you both accept.");
  const summary = useMemo(() => werkleFormationSummary(seed, draft), [seed, draft]);
  const operatingBriefIsCurrent = operatingBrief ? isWerkleOperatingBriefCurrent(operatingBrief, seed, draft) : false;
  const firstSharedStep = operatingBrief && operatingBriefIsCurrent
    ? firstSharedStepFromOperatingBrief(operatingBrief)
    : null;
  const firstChangeAfterBrief = operatingBrief?.updatedAt
    ? draft.events.find((event) => new Date(event.at).getTime() > new Date(operatingBrief.updatedAt ?? 0).getTime())
    : undefined;
  const staleBriefReason = firstChangeAfterBrief
    ? `${actorLabel(seed, firstChangeAfterBrief.actor)} updated an answer.`
    : "An accepted answer changed.";

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(seed.storageKey);
      const parsed = raw ? restoreWerkleFormationDraft(JSON.parse(raw), seed) : null;
      if (parsed) {
        setDraft(parsed);
        setSaveStatus("Your formation draft was restored in this browser on this device.");
      } else if (raw) {
        setSaveStatus("An invalid old draft was ignored. Your source Workshops were not changed.");
      } else {
        setSaveStatus("New private formation draft opened in this browser. Nothing has been shared or sent.");
      }

      const rawBrief = window.localStorage.getItem(WERKLE_OPERATING_BRIEF_DEVICE_KEY);
      const storedBrief = rawBrief ? storedWerkleOperatingBriefFrom(JSON.parse(rawBrief)) : null;
      if (storedBrief?.brief.formationId === seed.formationId) {
        if (parsed && isWerkleOperatingBriefCurrent(storedBrief.brief, seed, parsed)) {
          setOperatingBrief(storedBrief.brief);
          setBriefStatus("Operating Brief restored from this device and checked against the current accepted wording.");
        } else {
          window.localStorage.removeItem(WERKLE_OPERATING_BRIEF_DEVICE_KEY);
          window.dispatchEvent(new Event(WERKLE_OPERATING_BRIEF_CHANGE_EVENT));
          const rawAction = window.localStorage.getItem(WERKLE_FIRST_SHARED_ACTION_KEY);
          const action = rawAction ? werkleFirstSharedActionFrom(JSON.parse(rawAction)) : null;
          if (action?.formationId === seed.formationId) window.localStorage.removeItem(WERKLE_FIRST_SHARED_ACTION_KEY);
          setBriefStatus("A saved Brief could not be matched to the current accepted wording, so it and its shared-action draft were removed.");
        }
      }
    } catch {
      setSaveStatus("This device could not restore the formation draft. Your source Workshops were not changed.");
    } finally {
      setRestored(true);
    }
  }, [seed]);

  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(seed.storageKey, JSON.stringify(draft));
      if (draft.updatedAt) setSaveStatus("Saved in this browser on this device only. It will not appear on another computer. Both source Workshops remain unchanged.");
    } catch {
      setSaveStatus("This device could not save the latest change. Keep this tab open until you finish reviewing it.");
    }
  }, [draft, restored, seed.storageKey]);

  useEffect(() => {
    if (!operatingBrief || operatingBriefIsCurrent) return;
    try {
      const raw = window.localStorage.getItem(WERKLE_OPERATING_BRIEF_DEVICE_KEY);
      const stored = raw ? storedWerkleOperatingBriefFrom(JSON.parse(raw)) : null;
      if (stored?.brief.formationId === seed.formationId) {
        window.localStorage.removeItem(WERKLE_OPERATING_BRIEF_DEVICE_KEY);
        window.dispatchEvent(new Event(WERKLE_OPERATING_BRIEF_CHANGE_EVENT));
        setBriefStatus("An accepted answer changed, so the saved device brief was removed. Update the brief before saving it again.");
      }
      const rawAction = window.localStorage.getItem(WERKLE_FIRST_SHARED_ACTION_KEY);
      const action = rawAction ? werkleFirstSharedActionFrom(JSON.parse(rawAction)) : null;
      const currentStep = firstSharedStepFromOperatingBrief(createWerkleOperatingBrief(seed, draft));
      if (action?.formationId === seed.formationId && (!currentStep || !isWerkleFirstSharedActionCurrent(action, seed.formationId, currentStep))) {
        window.localStorage.removeItem(WERKLE_FIRST_SHARED_ACTION_KEY);
        setBriefStatus("An accepted answer changed, so the older brief and shared-action draft were removed. Update the brief before planning the next action.");
      }
    } catch {
      setBriefStatus("An accepted answer changed. Update the brief before relying on the saved device copy.");
    }
  }, [operatingBrief, operatingBriefIsCurrent, seed.formationId]);

  function choose(topicId: WerkleTopicId, choice: WerkleResolutionChoice) {
    setDraft((current) => {
      const topic = current.topics[topicId];
      const nextTopic: WerkleTopicDraft = {
        ...topic,
        choices: Object.freeze({ ...topic.choices, [actor]: choice }),
        acceptedRevision: Object.freeze({ ...topic.acceptedRevision, [actor]: null })
      };
      return updateTopicDraft(current, topicId, nextTopic, eventNow(topicId, actor, "choice", choiceLabel(seed, actor, choice)));
    });
  }

  function rewrite(topicId: WerkleTopicId, value: string) {
    const cleaned = cleanWerkleText(value);
    setDraft((current) => {
      const topic = current.topics[topicId];
      if (!cleaned || cleaned === topic.jointText) return current;
      const nextTopic: WerkleTopicDraft = {
        ...topic,
        jointText: cleaned,
        revision: topic.revision + 1,
        acceptedRevision: Object.freeze({ owner: null, partner: null })
      };
      return updateTopicDraft(current, topicId, nextTopic, eventNow(topicId, actor, "rewrite", `Rewrote the joint proposal as revision ${nextTopic.revision}; both approvals reset.`));
    });
  }

  function acceptJoint(topicId: WerkleTopicId) {
    setDraft((current) => {
      const topic = current.topics[topicId];
      if (topic.choices[actor] !== "combine") return current;
      const nextTopic: WerkleTopicDraft = {
        ...topic,
        acceptedRevision: Object.freeze({ ...topic.acceptedRevision, [actor]: topic.revision })
      };
      return updateTopicDraft(current, topicId, nextTopic, eventNow(topicId, actor, "accept", `Accepted joint wording revision ${topic.revision}.`));
    });
  }

  function applySyntheticPartnerResponse(topicId: WerkleTopicId) {
    setDraft((current) => {
      const topic = current.topics[topicId];
      const nextTopic: WerkleTopicDraft = {
        ...topic,
        choices: Object.freeze({ ...topic.choices, partner: "combine" }),
        acceptedRevision: Object.freeze({ ...topic.acceptedRevision, partner: topic.revision })
      };
      return updateTopicDraft(
        current,
        topicId,
        nextTopic,
        eventNow(
          topicId,
          "partner",
          "accept",
          `Applied ${seed.partnerLabel}'s synthetic practice response to joint wording revision ${topic.revision}.`
        )
      );
    });
  }

  function withdrawPendingChoice(topicId: WerkleTopicId) {
    setDraft((current) => {
      const topic = current.topics[topicId];
      if (topic.choices[actor] === null || werkleTopicStatus(topic) === "accepted") return current;
      const nextTopic: WerkleTopicDraft = {
        ...topic,
        choices: Object.freeze({ ...topic.choices, [actor]: null }),
        acceptedRevision: Object.freeze({ ...topic.acceptedRevision, [actor]: null })
      };
      return updateTopicDraft(current, topicId, nextTopic, eventNow(topicId, actor, "withdraw", "Took back a pending answer before mutual acceptance."));
    });
  }

  function setNote(topicId: WerkleTopicId, value: string) {
    setDraft((current) => {
      const topic = current.topics[topicId];
      return updateTopicDraft(current, topicId, {
        ...topic,
        notes: Object.freeze({ ...topic.notes, [actor]: cleanWerkleText(value, 500) })
      });
    });
  }

  function recordNote(topicId: WerkleTopicId) {
    setDraft((current) => {
      const topic = current.topics[topicId];
      const note = topic.notes[actor];
      if (!note) return current;
      const lastMatchingNote = [...current.events].reverse().find((event) => event.topicId === topicId && event.actor === actor && event.kind === "note");
      if (lastMatchingNote?.detail === note) return current;
      return Object.freeze({ ...current, events: Object.freeze([...current.events, eventNow(topicId, actor, "note", note)].slice(-240)) });
    });
  }

  function resetDraft() {
    window.localStorage.removeItem(seed.storageKey);
    try {
      const raw = window.localStorage.getItem(WERKLE_OPERATING_BRIEF_DEVICE_KEY);
      const stored = raw ? storedWerkleOperatingBriefFrom(JSON.parse(raw)) : null;
      if (stored?.brief.formationId === seed.formationId) window.localStorage.removeItem(WERKLE_OPERATING_BRIEF_DEVICE_KEY);
    } catch {
      window.localStorage.removeItem(WERKLE_OPERATING_BRIEF_DEVICE_KEY);
    }
    window.dispatchEvent(new Event(WERKLE_OPERATING_BRIEF_CHANGE_EVENT));
    try {
      const rawAction = window.localStorage.getItem(WERKLE_FIRST_SHARED_ACTION_KEY);
      const action = rawAction ? werkleFirstSharedActionFrom(JSON.parse(rawAction)) : null;
      if (action?.formationId === seed.formationId) window.localStorage.removeItem(WERKLE_FIRST_SHARED_ACTION_KEY);
    } catch {
      window.localStorage.removeItem(WERKLE_FIRST_SHARED_ACTION_KEY);
    }
    setDraft(createWerkleFormationDraft(seed));
    setOperatingBrief(null);
    setBriefStatus("Practice formation reset. Build a new brief after both sides accept wording.");
    setSaveStatus("Practice formation reset. Neither source Workshop was changed.");
  }

  function refreshOperatingBrief() {
    setOperatingBrief(createWerkleOperatingBrief(seed, draft));
    setBriefStatus("Operating Brief updated from the exact wording both people currently accept.");
  }

  async function copyOperatingBrief() {
    if (!operatingBrief || !operatingBriefIsCurrent) {
      setBriefStatus("The answers changed. Update the brief before copying it.");
      return;
    }
    const sections = operatingBrief.sections.flatMap((section) => [
      section.label,
      ...(section.rows.length
        ? section.rows.flatMap((row) => [`${row.label}: ${row.text}`, `Source: ${row.sourceTrail.join(" + ")}`])
        : [section.emptyMessage]),
      ""
    ]);
    const copy = [operatingBrief.title, operatingBrief.boundaryCopy, "", ...sections].join("\n").trim();
    try {
      await navigator.clipboard.writeText(copy);
      setBriefStatus("Copied the current Operating Brief. Copying it does not make it an agreement.");
    } catch {
      setBriefStatus("This browser did not allow copying. The brief is still visible below.");
    }
  }

  function saveOperatingBriefToDevice() {
    if (!operatingBrief || !operatingBriefIsCurrent) {
      setBriefStatus("The answers changed. Update the brief before saving it.");
      return;
    }
    try {
      const stored = createStoredWerkleOperatingBrief(seed.partnerId, operatingBrief);
      window.localStorage.setItem(WERKLE_OPERATING_BRIEF_DEVICE_KEY, JSON.stringify(stored));
      window.dispatchEvent(new Event(WERKLE_OPERATING_BRIEF_CHANGE_EVENT));
      setBriefStatus("Saved on this device. Personal Bellows can bring you back to this exact practice Werkle.");
    } catch {
      setBriefStatus("This browser could not save the Operating Brief. It is still visible in this tab.");
    }
  }

  const timeline = [...draft.events].reverse();
  const activeDefinition = seed.definitions.find((definition) => definition.id === activeTopicId) ?? seed.definitions[0];
  const activeTopic = draft.topics[activeDefinition.id];
  const activeStatus = werkleTopicStatus(activeTopic);
  const activeChoice = activeTopic.choices[actor];
  const activeNeedsNote = activeStatus === "objected" || activeStatus === "parked" || activeChoice === "park";
  const acceptedDefinitions = seed.definitions.filter((definition) => werkleTopicStatus(draft.topics[definition.id]) === "accepted");
  const nextOpenDefinition = seed.definitions.find((definition) => werkleTopicStatus(draft.topics[definition.id]) !== "accepted");

  return (
    <div className="werkle-workbench" id="formation-table">
      <aside className="werkle-trust-rail" aria-label="Practice Werkle boundaries">
        <div>
          <span>Practice Werkle</span>
          <strong>Only exact wording accepted by both people enters the shared room.</strong>
        </div>
        <p>No compatibility score is calculated. This draft stays in this browser and is not saved to your account.</p>
      </aside>

      <section className="werkle-arrival" aria-labelledby="werkle-arrival-title">
        <div>
          <p className="workshop-eyebrow">Why these two Workshops are at the same table</p>
          <h2 id="werkle-arrival-title">A match opened the door. It did not create a partnership.</h2>
          <p>{seed.reasonForTable}</p>
        </div>
        <div className="werkle-arrival__people" aria-label="Formation participants">
          <article><span>Your private room</span><strong>{seed.ownerLabel}</strong><small>Original Workshop stays intact</small></article>
          <span aria-hidden="true">+</span>
          <article><span>Synthetic practice member</span><strong>{seed.partnerLabel}</strong><small>Nothing here contacts a real person</small></article>
        </div>
        <aside>
          <strong>Nothing moves by accident.</strong>
          <span>Each topic keeps its source, both answers, exact joint wording, and any objection. Silence is never approval.</span>
        </aside>
      </section>

      <section className="werkle-dashboard" aria-labelledby="werkle-dashboard-title">
        <div>
          <p className="workshop-eyebrow">Formation readout</p>
          <h2 id="werkle-dashboard-title">Agreement is a state, not a vibe.</h2>
          <p>{summary.floorReady ? "The minimum working floor is visible." : "The shared company floor is not ready yet. Resolve the foundation without hiding the hard parts."}</p>
        </div>
        <dl className="werkle-dashboard__counts">
          <div><dt>Both accepted</dt><dd>{summary.counts.accepted}</dd></div>
          <div><dt>Waiting</dt><dd>{summary.counts.proposed + summary.counts.unstarted}</dd></div>
          <div><dt>Different answers</dt><dd>{summary.counts.objected}</dd></div>
          <div><dt>Parked / private</dt><dd>{summary.counts.parked + summary.counts.private}</dd></div>
        </dl>
        <div className="werkle-dashboard__readiness">
          <p><strong>Working Werkle floor:</strong> {summary.floorReady ? "Ready to inspect" : "Not ready"}</p>
          <p><strong>Adviser handoff:</strong> {summary.adviserReady ? "Questions are explicit" : "Important questions are still hidden or unanswered"}</p>
          <small>No compatibility score is calculated here. These counts only report what the two people have actually decided.</small>
          {nextOpenDefinition ? (
            <a
              className="werkle-dashboard__next"
              href="#formation-studio"
              onClick={() => setActiveTopicId(nextOpenDefinition.id)}
            >
              Work on next: {nextOpenDefinition.label} <span aria-hidden="true">→</span>
            </a>
          ) : null}
        </div>
      </section>

      {nextOpenDefinition ? <TopicExperimentCard topicId={nextOpenDefinition.id} label={nextOpenDefinition.label} /> : null}

      <section className="werkle-actor werkle-ghost-profile" aria-labelledby="werkle-actor-title">
        <div>
          <p className="workshop-eyebrow">A two-sided practice conversation</p>
          <h2 id="werkle-actor-title">You answer for you. {seed.partnerLabel} answers from a fictional profile.</h2>
          <p>{seed.partnerProfile.summary}</p>
        </div>
        <dl className="werkle-ghost-profile__facts">
          <div><dt>Work pace</dt><dd>{seed.partnerProfile.workPace}</dd></div>
          <div><dt>Follow-through</dt><dd>{seed.partnerProfile.followThrough}</dd></div>
          <div><dt>Decisions</dt><dd>{seed.partnerProfile.decisionStyle}</dd></div>
          <div><dt>Disagreement</dt><dd>{seed.partnerProfile.disagreementStyle}</dd></div>
          <div><dt>Availability</dt><dd>{seed.partnerProfile.availability}</dd></div>
          <div><dt>Contribution</dt><dd>{seed.partnerProfile.contributionPosture}</dd></div>
        </dl>
        <aside className="werkle-ghost-profile__money">
          <strong>Fictional money posture</strong>
          <p>{seed.partnerProfile.financialScenario}</p>
        </aside>
        <div className="werkle-ghost-profile__boundary">
          <strong>Your side stays yours.</strong>
          <span>You can react to {seed.partnerLabel}&apos;s fixed practice answers, but you cannot edit or impersonate them.</span>
        </div>
      </section>

      <FormationArrivalContext partnerId={seed.partnerId} />
      <PartnerPerspectiveExercise
        formationId={seed.formationId}
        partnerLabel={seed.partnerLabel}
        initialScope={seed.definitions.find((definition) => definition.id === "purpose")?.ownerSource.text ?? ""}
      />

      <section className="werkle-formation-ledger" aria-labelledby="werkle-ledger-title">
        <div>
          <p className="workshop-eyebrow">The Werkle taking shape</p>
          <h2 id="werkle-ledger-title">Only mutual decisions cross this line.</h2>
        </div>
        <div className="werkle-formation-ledger__track">
          {acceptedDefinitions.length ? acceptedDefinitions.map((definition) => (
            <button type="button" key={definition.id} onClick={() => setActiveTopicId(definition.id)}>
              <span>Both accepted</span>
              <strong>{definition.label}</strong>
              <small>Revision {draft.topics[definition.id].revision}</small>
            </button>
          )) : <p>No shared wording yet. Your first mutual decision will appear here.</p>}
        </div>
      </section>

      <section className="werkle-studio" id="formation-studio" aria-labelledby="werkle-studio-title">
        <nav className="werkle-topic-index" aria-label="Formation topics">
          <div className="werkle-topic-index__intro">
            <p className="workshop-eyebrow">Formation map</p>
            <h2 id="werkle-studio-title">Choose one question. Work it together.</h2>
            <p>{summary.counts.accepted} of {seed.definitions.length} topics are mutual.</p>
          </div>
          {GROUPS.map((group, groupIndex) => {
            const definitions = seed.definitions.filter((definition) => definition.group === group.id);
            return (
              <section key={group.id} aria-labelledby={`werkle-index-${group.id}`}>
                <header>
                  <span>{groupIndex + 1}</span>
                  <div><strong id={`werkle-index-${group.id}`}>{group.label}</strong><small>{group.detail}</small></div>
                </header>
                <div>
                  {definitions.map((definition) => {
                    const status = werkleTopicStatus(draft.topics[definition.id]);
                    return (
                      <button
                        type="button"
                        key={definition.id}
                        className={`werkle-topic-index__button werkle-topic-index__button--${status}`}
                        aria-current={activeDefinition.id === definition.id ? "step" : undefined}
                        onClick={() => setActiveTopicId(definition.id)}
                      >
                        <span aria-hidden="true" />
                        <strong>{definition.label}</strong>
                        <small>{STATUS_COPY[status].label}</small>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </nav>

        <div className="werkle-studio__workspace">
          <header className="werkle-studio__header">
            <div>
              <p>{activeDefinition.floor ? "Working Werkle floor" : activeDefinition.adviserGate ? "Before an adviser handoff" : "Formation question"}</p>
              <h2>{activeDefinition.label}</h2>
              <span>{activeDefinition.question}</span>
            </div>
            <div className={`werkle-studio__state werkle-studio__state--${activeStatus}`}>
              <span>{activeStatus === "accepted" ? "Mutual wording" : "Not mutual yet"}</span>
              <strong>{STATUS_COPY[activeStatus].label}</strong>
              <small>{STATUS_COPY[activeStatus].detail}</small>
            </div>
          </header>

          <p className="werkle-studio__why"><strong>Why this matters:</strong> {activeDefinition.why}</p>

          <div className="werkle-merge-canvas">
            <article className="werkle-merge-canvas__source werkle-merge-canvas__source--owner">
              <span>Your Workshop</span>
              <strong>{seed.ownerLabel}</strong>
              <p>{sourcePreview(activeDefinition.ownerSource.text).preview}</p>
              {sourcePreview(activeDefinition.ownerSource.text).shortened ? (
                <details className="werkle-merge-canvas__full-source">
                  <summary>Read your full source wording</summary>
                  <p>{activeDefinition.ownerSource.text}</p>
                </details>
              ) : null}
              <small>{activeDefinition.ownerSource.origin}</small>
            </article>

            <article className="werkle-merge-canvas__source werkle-merge-canvas__source--partner">
              <span>What {seed.partnerLabel} says</span>
              <strong>{seed.partnerLabel}</strong>
              <p>{sourcePreview(activeDefinition.partnerSource.text).preview}</p>
              {sourcePreview(activeDefinition.partnerSource.text).shortened ? (
                <details className="werkle-merge-canvas__full-source">
                  <summary>Read their full source wording</summary>
                  <p>{activeDefinition.partnerSource.text}</p>
                </details>
              ) : null}
              <small>{activeDefinition.partnerSource.origin}</small>
              <div className="werkle-ghost-opinion">
                <strong>Why {seed.partnerLabel} sees it that way</strong>
                <p>{activeDefinition.partnerPosition.reason}</p>
                <blockquote>“{activeDefinition.partnerPosition.question}”</blockquote>
                <small>Generated practice opinion · synthetic and unverified</small>
              </div>
            </article>

            <article className="werkle-merge-canvas__shared">
              <header>
                <span>Shared Werkle</span>
                <strong>{activeStatus === "accepted" ? "This is the answer you would both work from" : "Build the answer you would both work from"}</strong>
              </header>

              <div className="werkle-topic__decisions">
                <p><strong>Your answer:</strong> compare your Workshop with {seed.partnerLabel}&apos;s fixed practice answer. Use yours, use theirs, write a third answer together, keep the subject private, or leave it unresolved.</p>
                <div role="group" aria-label={`${activeDefinition.label} decision for ${actorLabel(seed, actor)}`}>
                  {CHOICES.map((choice) => (
                    <button type="button" key={choice.id} aria-pressed={activeChoice === choice.id} onClick={() => choose(activeDefinition.id, choice.id)} title={choice.help}>
                      {choice[actor]}
                    </button>
                  ))}
                </div>
                <dl>
                  <div><dt>{seed.ownerLabel}</dt><dd>{choiceLabel(seed, "owner", activeTopic.choices.owner)}</dd></div>
                  <div><dt>{seed.partnerLabel}</dt><dd>{choiceLabel(seed, "partner", activeTopic.choices.partner)}</dd></div>
                </dl>
                {activeChoice !== null && activeStatus !== "accepted" ? (
                  <button className="werkle-topic__withdraw" type="button" onClick={() => withdrawPendingChoice(activeDefinition.id)}>Take back my pending answer</button>
                ) : null}
              </div>

              {(activeChoice === "combine" || activeTopic.choices.owner === "combine" || activeTopic.choices.partner === "combine") ? (
                <div className="werkle-topic__joint">
                  <JointEditor definition={activeDefinition} topic={activeTopic} onCommit={rewrite} />
                  <div>
                    <button className="button button-dark" type="button" disabled={activeChoice !== "combine" || activeTopic.acceptedRevision[actor] === activeTopic.revision} onClick={() => acceptJoint(activeDefinition.id)}>
                      {activeTopic.acceptedRevision[actor] === activeTopic.revision ? "You accepted this exact wording" : `Accept revision ${activeTopic.revision}`}
                    </button>
                    <button
                      className="button button-outline"
                      type="button"
                      disabled={activeTopic.acceptedRevision.partner === activeTopic.revision}
                      onClick={() => applySyntheticPartnerResponse(activeDefinition.id)}
                    >
                      {activeTopic.acceptedRevision.partner === activeTopic.revision
                        ? `${seed.partnerLabel}'s synthetic response applied`
                        : `Apply ${seed.partnerLabel}'s synthetic response`}
                    </button>
                    <p>{seed.ownerLabel}: {activeTopic.acceptedRevision.owner === activeTopic.revision ? "accepted" : "not accepted"} · {seed.partnerLabel}: {activeTopic.acceptedRevision.partner === activeTopic.revision ? "accepted" : "not accepted"}</p>
                    <small>Practice only: this applies the fictional profile to this exact revision. A real member would have to review and accept the wording themselves.</small>
                  </div>
                  <small>Editing even one word creates a new revision and resets both approvals.</small>
                </div>
              ) : null}

              {activeNeedsNote ? (
                <label className="werkle-topic__note" htmlFor={`note-${activeDefinition.id}-${actor}`}>
                  <span>Why {actor === "owner" && seed.ownerLabel === "You" ? "you are" : `${actorLabel(seed, actor)} is`} not agreeing yet</span>
                  <textarea id={`note-${activeDefinition.id}-${actor}`} rows={3} maxLength={500} value={activeTopic.notes[actor]} onChange={(event) => setNote(activeDefinition.id, event.target.value)} onBlur={() => recordNote(activeDefinition.id)} placeholder="Say what is unresolved, what information would help, or what boundary cannot be crossed." />
                </label>
              ) : null}

              {activeDefinition.lesson ? <p className="werkle-topic__help"><strong>Useful here:</strong> <Link href={activeDefinition.lesson.href}>{activeDefinition.lesson.label}</Link></p> : null}
            </article>
          </div>
        </div>
      </section>

      <figure className="werkle-formation-pause">
        <Image
          src="/assets/draft/people-v1/place-space-just-leased.jpg"
          alt="An empty storefront with keys and a lease waiting on the counter"
          width={1536}
          height={1024}
        />
        <figcaption>
          <strong>The keys can wait.</strong>
          <span>Settle what each person expects before the space, money, or promises become shared.</span>
        </figcaption>
      </figure>

      <section className="werkle-floor" id="formation-floor" aria-labelledby="werkle-floor-title">
        <header><p className="workshop-eyebrow">The proposed shared company floor</p><h2 id="werkle-floor-title">Only mutual decisions enter this room.</h2><span>Private, parked, and disputed material stays visible in the formation ledger above but does not become shared company language.</span></header>
        <div className="werkle-floor__grid">
          {summary.rows.map(({ definition, topic }) => <SharedStatement definition={definition} topic={topic} key={definition.id} />)}
          {summary.counts.accepted === 0 ? <p className="werkle-floor__empty">Nothing has cleared both sides yet. That is more honest than a full room built from assumptions.</p> : null}
        </div>
        <aside>
          <strong>This does not form a company or create an agreement.</strong>
          <span>Werkles helps the participants preserve sources, expose disagreement, and prepare better questions. Entity, ownership, tax, financing, employment, and contract decisions belong with each person&apos;s independent advisers.</span>
        </aside>
      </section>

      <section className="werkle-operating-brief" id="formation-operating-brief" aria-labelledby="werkle-operating-brief-title">
        <header>
          <div>
            <p className="workshop-eyebrow">A usable readout of mutual decisions</p>
            <h2 id="werkle-operating-brief-title">Werkle Operating Brief</h2>
            <p>See what you both accepted—and which conversations still need both people.</p>
          </div>
          <div className="member-selected-surface__actions">
            <button className="button button-dark" type="button" onClick={refreshOperatingBrief}>
              {operatingBrief ? "Update with our latest answers" : "Build the Operating Brief"}
            </button>
            <button className="button button-outline" type="button" onClick={copyOperatingBrief} disabled={!operatingBrief || !operatingBriefIsCurrent}>
              Copy current brief
            </button>
            <button className="button button-outline" type="button" onClick={saveOperatingBriefToDevice} disabled={!operatingBrief || !operatingBriefIsCurrent}>
              Save on this device
            </button>
          </div>
        </header>

        <p className="werkle-operating-brief__status" role="status">
          <strong>{operatingBrief && !operatingBriefIsCurrent ? "The brief is out of date." : operatingBrief ? "Current brief." : "No brief built yet."}</strong>{" "}
          {operatingBrief && !operatingBriefIsCurrent ? `${staleBriefReason} Update to see the new version; the previous snapshot is hidden.` : briefStatus}
        </p>

        {firstSharedStep ? (
          <article className="werkle-first-shared-step" aria-labelledby="werkle-first-shared-step-title">
            <div>
              <p className="workshop-eyebrow">First Shared Step</p>
              <h3 id="werkle-first-shared-step-title">Start with the first thing you both actually accepted.</h3>
              <p>This is a conversation anchor, not an assigned task. Werkles will not invent the owner, deadline, or promise.</p>
            </div>
            <blockquote>
              <strong>{firstSharedStep.label}</strong>
              <p>{firstSharedStep.text}</p>
              <small>Exact shared wording · version {firstSharedStep.revision} · {firstSharedStep.sourceTrail.join(" + ")}</small>
            </blockquote>
            <FirstSharedActionPlanner formationId={seed.formationId} step={firstSharedStep} persistAcceptedSource={saveOperatingBriefToDevice} />
            <Link className="button button-outline" href="/bellows/personal/partnership-alignment">Open the conversation guide</Link>
          </article>
        ) : null}

        {operatingBrief && operatingBriefIsCurrent ? (
          <div className="werkle-operating-brief__sections">
            {operatingBrief.sections.map((section) => {
              const openTopics = openTopicsForOperatingBriefSection(section.id, seed, draft);
              return <article key={section.id}>
                <h3>{section.label}</h3>
                {section.rows.length ? (
                  <div>
                    {section.rows.map((row) => (
                      <section key={row.topicId}>
                        <strong>{row.label}</strong>
                        <p>{row.text}</p>
                        <small>Comes from: {row.sourceTrail.join(" + ")} · version {row.revision}{row.adviserReview ? " · take this question to the right adviser before relying on it" : ""}</small>
                      </section>
                    ))}
                  </div>
                ) : <p className="werkle-operating-brief__empty">{section.emptyMessage}</p>}
                {openTopics.length ? (
                  <div className="werkle-operating-brief__open-topics">
                    <strong>Still to settle</strong>
                    <ul>
                      {openTopics.map((topic) => (
                        <li key={topic.topicId}><span>{topic.label}</span><small>{STATUS_COPY[topic.status].label}</small></li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>;
            })}
          </div>
        ) : null}

        <PracticeBoundaryReadout titleId="formation-practice-boundary-title" />
      </section>

      <section className="werkle-history" id="formation-history" aria-labelledby="werkle-history-title">
        <div><p className="workshop-eyebrow">Revisitable by design</p><h2 id="werkle-history-title">The room remembers how the answer changed.</h2><p>An objection does not vanish just because the two people later agree. That history is part of the value.</p></div>
        {timeline.length ? <><p className="werkle-history__count">Showing the full formation history · {timeline.length} {timeline.length === 1 ? "event" : "events"}</p><ol>{timeline.map((event) => {
          const definition = seed.definitions.find((item) => item.id === event.topicId);
          return <li key={event.id}><span>{actorLabel(seed, event.actor)}</span><strong>{definition?.label ?? event.topicId}</strong><p>{event.detail}</p><small>{new Date(event.at).toLocaleString()}</small></li>;
        })}</ol></> : <p className="werkle-history__empty">No decisions yet. The first choice will start the formation history.</p>}
      </section>

      <section className="werkle-save" aria-label="Formation draft controls">
        <div><strong>Your source Workshops are untouched.</strong><p role="status">{saveStatus}</p><small>This practice draft is not saved to your Werkles account and will not follow you to another browser or device.</small></div>
        <div className="member-selected-surface__actions">
          <Link className="button button-dark" href="/bellows/personal/partnership-alignment">Open the Personal Bellows handoff</Link>
          <Link className="button button-outline" href="/dashboard/intros">Return to Match Deck</Link>
          <button className="button button-outline" type="button" onClick={resetDraft}>Reset this practice formation</button>
        </div>
      </section>
    </div>
  );
}
