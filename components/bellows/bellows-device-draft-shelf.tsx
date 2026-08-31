"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PracticeBoundaryReadout } from "@/components/werkle/practice-boundary-readout";
import { BELLOWS_DEVICE_ARTIFACTS } from "@/lib/bellows/device-artifact-catalog";
import {
  FORMATION_READING_BY_SECTION,
  FORMATION_READING_LAST_REVIEWED
} from "@/lib/bellows/formation-reading";
import { parseRecommendationDraft, recommendationDraftStorageKey } from "@/lib/squibb/recommendation-device-drafts";
import { recommendationSolutionPath } from "@/lib/squibb/recommendation-solution-path";
import { RECOMMENDATION_KINDS, RECOMMENDATION_KIND_LABELS, type RecommendationKind } from "@/lib/squibb/recommendations";
import {
  storedWerkleOperatingBriefFrom,
  storedWerkleOperatingBriefHref,
  WERKLE_OPERATING_BRIEF_DEVICE_KEY,
  type StoredWerkleOperatingBrief
} from "@/lib/werkle/operating-brief-device";
import {
  firstSharedStepFromOperatingBrief,
  type WerkleFirstSharedStep,
  type WerkleOperatingBrief
} from "@/lib/werkle/operating-brief";
import {
  isWerkleFirstSharedActionCurrent,
  WERKLE_FIRST_SHARED_ACTION_KEY,
  werkleFirstSharedActionFrom,
  type WerkleFirstSharedAction
} from "@/lib/werkle/first-shared-action";
import { topicExperimentFor } from "@/lib/werkle/topic-experiment";
import {
  isWerkleSharedActionResultCurrent,
  WERKLE_SHARED_ACTION_RESULT_KEY,
  werkleSharedActionResultFrom,
  type WerkleSharedActionResult
} from "@/lib/werkle/shared-action-result";

const SHARED_WORK = BELLOWS_DEVICE_ARTIFACTS.filter((artifact) => artifact.kind === "shared_work");
const BELLOWS_TOOLS = BELLOWS_DEVICE_ARTIFACTS.filter((artifact) => artifact.kind === "bellows_tool");

export function BellowsDeviceDraftShelf() {
  const [present, setPresent] = useState<ReadonlyMap<string, string> | null>(null);
  const [recommendationDrafts, setRecommendationDrafts] = useState<readonly RecommendationKind[] | null>(null);
  const [firstSharedStep, setFirstSharedStep] = useState<WerkleFirstSharedStep | null>(null);
  const [sharedAction, setSharedAction] = useState<WerkleFirstSharedAction | null>(null);
  const [sharedResult, setSharedResult] = useState<WerkleSharedActionResult | null>(null);
  const [operatingBrief, setOperatingBrief] = useState<WerkleOperatingBrief | null>(null);
  const [storedBrief, setStoredBrief] = useState<StoredWerkleOperatingBrief | null>(null);
  const acceptedTopicCount = operatingBrief?.sections.reduce((count, section) => count + section.rows.length, 0) ?? 0;
  const sharedActionExperiment = sharedAction ? topicExperimentFor(sharedAction.topicId) : null;

  useEffect(() => {
    const found = new Map<string, string>();
    const foundRecommendations: RecommendationKind[] = [];
    let currentSharedStep: WerkleFirstSharedStep | null = null;
    let currentFormationId: string | null = null;
    for (const artifact of BELLOWS_DEVICE_ARTIFACTS) {
      try {
        const raw = window.localStorage.getItem(artifact.key);
        if (raw === null) continue;
        if (artifact.key === WERKLE_OPERATING_BRIEF_DEVICE_KEY) {
          const stored = storedWerkleOperatingBriefFrom(JSON.parse(raw));
          if (stored) {
            found.set(artifact.key, storedWerkleOperatingBriefHref(stored));
            setStoredBrief(stored);
            setOperatingBrief(stored.brief);
            currentSharedStep = firstSharedStepFromOperatingBrief(stored.brief);
            currentFormationId = stored.brief.formationId;
            setFirstSharedStep(currentSharedStep);
          }
        } else {
          found.set(artifact.key, artifact.personalHref);
        }
      } catch {
        setPresent(new Map());
        return;
      }
    }
    for (const kind of RECOMMENDATION_KINDS) {
      try {
        const raw = window.localStorage.getItem(recommendationDraftStorageKey(kind));
        if (parseRecommendationDraft(kind, raw)) foundRecommendations.push(kind);
      } catch {
        setRecommendationDrafts([]);
        break;
      }
    }
    setPresent(found);
    setRecommendationDrafts(foundRecommendations);
    try {
      const rawAction = window.localStorage.getItem(WERKLE_FIRST_SHARED_ACTION_KEY);
      const parsedAction = rawAction ? werkleFirstSharedActionFrom(JSON.parse(rawAction)) : null;
      const currentAction = parsedAction && currentSharedStep && currentFormationId && isWerkleFirstSharedActionCurrent(parsedAction, currentFormationId, currentSharedStep) ? parsedAction : null;
      setSharedAction(currentAction);
      const rawResult = window.localStorage.getItem(WERKLE_SHARED_ACTION_RESULT_KEY);
      const parsedResult = rawResult ? werkleSharedActionResultFrom(JSON.parse(rawResult)) : null;
      setSharedResult(currentAction && parsedResult && isWerkleSharedActionResultCurrent(parsedResult, currentAction) ? parsedResult : null);
    } catch {
      setSharedAction(null);
      setSharedResult(null);
    }
  }, []);

  return (
    <section className="bellows-draft-shelf" aria-labelledby="draftShelfTitle">
      <div className="bellows-library__section-heading">
        <p className="eyebrow">Shared work on this device</p>
        <h2 id="draftShelfTitle">Return to a Werkle already in motion.</h2>
        <p>These are practice artifacts from work with another profile. They stay on this device and do not become agreements.</p>
      </div>
      {storedBrief ? (
        <aside className="bellows-draft-shelf__continuity" aria-labelledby="bellows-continuity-title">
          <div>
            <p className="eyebrow">Continue existing Werkle</p>
            <h3 id="bellows-continuity-title">Reopen the work already saved on this device.</h3>
            <p>
              Saved {new Date(storedBrief.savedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              {acceptedTopicCount ? ` · ${acceptedTopicCount} shared ${acceptedTopicCount === 1 ? "topic" : "topics"}` : " · no shared wording yet"}.
              This returns to the same local Operating Brief; it does not start a new Intake or mean the other person responded again.
            </p>
            <dl aria-label="Saved Werkle boundaries">
              <div><dt>Saved in</dt><dd>This browser on this device</dd></div>
              <div><dt>Partner activity</dt><dd>No new response or acceptance shown</dd></div>
              <div><dt>Next</dt><dd>Review the brief before changing the plan</dd></div>
            </dl>
          </div>
          <Link href={storedWerkleOperatingBriefHref(storedBrief)}>Continue Existing Werkle</Link>
        </aside>
      ) : null}
      <ul>
        {SHARED_WORK.map((artifact) => {
          const savedHref = present?.get(artifact.key);
          const saved = typeof savedHref === "string";
          return (
            <li key={artifact.key}>
              <div><strong>{artifact.title}</strong><span>{present === null ? "Checking this device…" : saved ? "Draft on this device" : "No device draft"}</span></div>
              <Link href={savedHref ?? artifact.personalHref}>{saved ? `Open ${artifact.title} Draft` : `Start ${artifact.title}`}</Link>
            </li>
          );
        })}
      </ul>
      {firstSharedStep ? (
        <aside className="bellows-draft-shelf__shared-step" aria-labelledby="personal-shared-step-title">
          <div>
            <p className="eyebrow">First Shared Step</p>
            <h3 id="personal-shared-step-title">Return to what both sides actually accepted.</h3>
          </div>
          <blockquote><strong>{firstSharedStep.label}</strong><span>{firstSharedStep.text}</span></blockquote>
          <p>Open the Werkle to choose a small action, a volunteer, and a check-back date—or use the guide to talk it through first. None is filled in for you.</p>
          <div className="bellows-draft-shelf__shared-step-actions">
            <Link href={present?.get(WERKLE_OPERATING_BRIEF_DEVICE_KEY) ?? "/dashboard/werkles/formation"}>Continue This Werkle</Link>
            <Link href="/bellows/personal/partnership-alignment">Open Conversation Guide</Link>
          </div>
        </aside>
      ) : null}
      {operatingBrief ? (
        <details className="bellows-draft-shelf__accepted-work">
          <summary>
            <span>What you have settled together</span>
            <strong>{acceptedTopicCount} accepted {acceptedTopicCount === 1 ? "topic" : "topics"}</strong>
          </summary>
          <p>Only current wording both people accepted appears here. Private predictions, parked questions, objections, and generated suggestions stay out.</p>
          <div>
            {operatingBrief.sections.map((section) => (
              <section key={section.id}>
                <h4>{section.label}</h4>
                {section.rows.length ? (
                  <ul>
                    {section.rows.map((row) => (
                      <li key={`${row.topicId}-${row.revision}`}>
                        <strong>{row.label}</strong>
                        <span>{row.text}</span>
                      </li>
                    ))}
                  </ul>
                ) : <span>{section.emptyMessage}</span>}
                <div className="bellows-draft-shelf__reading">
                  <strong>Read together before deciding more</strong>
                  {FORMATION_READING_BY_SECTION[section.id].map((resource) => (
                    <a href={resource.href} key={resource.href} target="_blank" rel="noreferrer">
                      <span>{resource.label}</span>
                      <small>{resource.source} ↗</small>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <small className="bellows-draft-shelf__source-date">Public-source links checked {FORMATION_READING_LAST_REVIEWED}. A link is a starting point, not an endorsement or a decision.</small>
          <Link href={present?.get(WERKLE_OPERATING_BRIEF_DEVICE_KEY) ?? "/dashboard/werkles/formation"}>Open the Full Werkle</Link>
        </details>
      ) : null}
      {operatingBrief ? <PracticeBoundaryReadout titleId="bellows-practice-boundary-title" /> : null}
      {sharedAction ? (
        <aside className="bellows-draft-shelf__action" aria-labelledby="bellows-shared-action-title">
          <div><p className="eyebrow">Proposed shared action · this device</p><h3 id="bellows-shared-action-title">Return to the test you were shaping together.</h3></div>
          <dl>
            <div><dt>Action</dt><dd>{sharedAction.action || "Still open"}</dd></div>
            <div><dt>Volunteer</dt><dd>{sharedAction.volunteer || "Nobody named yet"}</dd></div>
            <div><dt>Check back</dt><dd>{sharedAction.checkIn || "No date yet"}</dd></div>
            <div><dt>Done means</dt><dd>{sharedAction.doneWhen || "Still open"}</dd></div>
          </dl>
          {sharedActionExperiment ? (
            <div className="bellows-draft-shelf__test-return">
              <strong>Compare the result with the original test</strong>
              <span>{sharedActionExperiment.observe}</span>
              <Link href={sharedActionExperiment.bellowsHref}>Open the Relevant Conversation Guide</Link>
            </div>
          ) : null}
          <p>This is a device-local proposal, not an assignment or agreement. Reopen the Werkle to review it against the current accepted wording.</p>
          <Link href={present?.get(WERKLE_OPERATING_BRIEF_DEVICE_KEY) ?? "/dashboard/werkles/formation"}>Review This Shared Action</Link>
        </aside>
      ) : null}
      {sharedResult ? (
        <aside className="bellows-draft-shelf__result" aria-labelledby="bellows-shared-result-title">
          <div><p className="eyebrow">Your result notes · this device</p><h3 id="bellows-shared-result-title">Turn what happened into the next conversation.</h3></div>
          <dl>
            <div><dt>Observed</dt><dd>{sharedResult.observed}</dd></div>
            <div><dt>Your interpretation</dt><dd>{sharedResult.interpretation || "Still uncertain"}</dd></div>
            <div><dt>Decision to discuss</dt><dd>{sharedResult.nextDecision}</dd></div>
          </dl>
          <p>These are one member's notes—not the other person's answer, evidence of mutual agreement, or a company decision.</p>
          <Link href={present?.get(WERKLE_OPERATING_BRIEF_DEVICE_KEY) ?? "/dashboard/werkles/formation"}>Reopen the Werkle Conversation</Link>
        </aside>
      ) : null}
      <div className="bellows-library__section-heading bellows-draft-shelf__recommendation-heading">
        <p className="eyebrow">Your Bellows tools</p>
        <h3>Pick up a private working draft.</h3>
        <p>Each tool validates its own device draft before showing it. Nothing here is account-saved or shared.</p>
      </div>
      <ul>
        {BELLOWS_TOOLS.map((artifact) => {
          const savedHref = present?.get(artifact.key);
          const saved = typeof savedHref === "string";
          return (
            <li key={artifact.key}>
              <div><strong>{artifact.title}</strong><span>{present === null ? "Checking this device…" : saved ? "Draft on this device" : "No device draft"}</span></div>
              <Link href={savedHref ?? artifact.personalHref}>{saved ? `Open ${artifact.title} Draft` : `Start ${artifact.title}`}</Link>
            </li>
          );
        })}
      </ul>
      <div className="bellows-library__section-heading bellows-draft-shelf__recommendation-heading">
        <p className="eyebrow">Saved while comparing next moves</p>
        <h3>Recommendation drafts on this device</h3>
        <p>These are the smaller three-field drafts from Recommendations. They remain separate from the deeper Bellows tools above.</p>
      </div>
      {recommendationDrafts === null ? <p>Checking this device…</p> : recommendationDrafts.length === 0 ? (
        <p className="bellows-draft-shelf__empty">No Recommendation drafts are saved on this device.</p>
      ) : (
        <ul>
          {recommendationDrafts.map((kind) => (
            <li key={kind}>
              <div><strong>{recommendationSolutionPath(kind).artifact.title}</strong><span>From {RECOMMENDATION_KIND_LABELS[kind]}</span></div>
              <Link href={`/bellows/recommendations?option=${kind}`}>Open Exact Option</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
