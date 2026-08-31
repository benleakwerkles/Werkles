"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  answerGhostInteractionQuestion,
  ghostInteractionQuestionsFor,
  type GhostInteractionMember,
  type GhostInteractionQuestionId
} from "@/lib/ghost-fleet/interaction";
import {
  buildPartnershipPreparationContext,
  PARTNERSHIP_PREPARATION_CONTEXT_KEY
} from "@/lib/bellows/partnership-preparation-context";
import {
  storedWerkleOperatingBriefFrom,
  storedWerkleOperatingBriefHref,
  WERKLE_OPERATING_BRIEF_DEVICE_KEY
} from "@/lib/werkle/operating-brief-device";
import {
  MATCH_REVIEW_SHELF_DEVICE_KEY,
  MATCH_REVIEW_SHELF_LIMIT,
  matchReviewShelfFrom,
  toggleMatchReviewShelf
} from "@/lib/ghost-fleet/match-review-shelf";

type TranscriptLine = Readonly<{
  questionId: GhostInteractionQuestionId;
  question: string;
  answer: string;
  source: string;
}>;

const HELP_LABELS: Readonly<Record<string, string>> = Object.freeze({
  Backer: "funding, guarantees, or financial experience",
  Builder: "making or delivering the work",
  Operator: "running the day-to-day work",
  Connector: "customers, partners, and useful introductions"
});

export function GhostMemberInteractionLab({ members }: { members: readonly GhostInteractionMember[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(members[0]?.id ?? "");
  const [visibleCount, setVisibleCount] = useState(Math.min(6, members.length));
  const [transcript, setTranscript] = useState<readonly TranscriptLine[]>([]);
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [reviewShelfIds, setReviewShelfIds] = useState<readonly string[]>([]);
  const [existingWerkleHref, setExistingWerkleHref] = useState<string | null>(null);
  const availableMembers = useMemo(
    () => members.filter((member) => !dismissedIds.has(member.id)),
    [dismissedIds, members]
  );
  const visibleMembers = availableMembers.slice(0, visibleCount);
  const comparisonMembers = availableMembers.slice(0, 3);
  const reviewShelfMembers = useMemo(
    () => reviewShelfIds.flatMap((id) => members.find((member) => member.id === id) ?? []),
    [members, reviewShelfIds]
  );
  const selected = useMemo(
    () => availableMembers.find((member) => member.id === selectedId) ?? availableMembers[0] ?? null,
    [availableMembers, selectedId]
  );
  const questions = useMemo(
    () => selected ? ghostInteractionQuestionsFor(selected) : [],
    [selected]
  );

  useEffect(() => {
    setVisibleCount(Math.min(6, members.length));
    setDismissedIds((current) => new Set([...current].filter((id) => members.some((member) => member.id === id))));
    setSelectedId((current) => {
      if (members.some((member) => member.id === current)) return current;
      setTranscript([]);
      return members[0]?.id ?? "";
    });
  }, [members]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WERKLE_OPERATING_BRIEF_DEVICE_KEY);
      const stored = raw ? storedWerkleOperatingBriefFrom(JSON.parse(raw)) : null;
      setExistingWerkleHref(stored ? storedWerkleOperatingBriefHref(stored) : null);
    } catch {
      setExistingWerkleHref(null);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(MATCH_REVIEW_SHELF_DEVICE_KEY);
      const restored = matchReviewShelfFrom(raw ? JSON.parse(raw) : [], members.map((member) => member.id));
      setReviewShelfIds(restored);
      if (!restored.length) window.localStorage.removeItem(MATCH_REVIEW_SHELF_DEVICE_KEY);
    } catch {
      window.localStorage.removeItem(MATCH_REVIEW_SHELF_DEVICE_KEY);
      setReviewShelfIds([]);
    }
  }, [members]);

  if (!members.length) return null;

  function selectMember(id: string) {
    setSelectedId(id);
    setTranscript([]);
  }

  function ask(questionId: GhostInteractionQuestionId) {
    if (!selected) return;
    const question = questions.find((item) => item.id === questionId);
    if (!question) return;
    setTranscript((current) => [
      ...current,
      Object.freeze({
        questionId,
        question: question.label,
        answer: answerGhostInteractionQuestion(selected, questionId),
        source: question.source
      })
    ]);
  }

  function dismissSelected() {
    if (!selected) return;
    const remaining = availableMembers.filter((member) => member.id !== selected.id);
    setDismissedIds((current) => new Set([...current, selected.id]));
    setSelectedId(remaining[0]?.id ?? "");
    setTranscript([]);
    setVisibleCount((current) => Math.min(Math.max(current, 1), Math.max(remaining.length, 1)));
  }

  function restoreDismissed() {
    setDismissedIds(new Set());
    setSelectedId((current) => members.some((member) => member.id === current) ? current : members[0]?.id ?? "");
    setTranscript([]);
    setVisibleCount(Math.min(6, members.length));
  }

  function toggleReviewShelf(id: string) {
    const next = toggleMatchReviewShelf(reviewShelfIds, id);
    setReviewShelfIds(next);
    try {
      if (next.length) window.localStorage.setItem(MATCH_REVIEW_SHELF_DEVICE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(MATCH_REVIEW_SHELF_DEVICE_KEY);
    } catch {
      // The current view still works when device storage is unavailable.
    }
  }

  function openPreparation(destination: string) {
    if (!selected) return;
    try {
      window.localStorage.setItem(
        PARTNERSHIP_PREPARATION_CONTEXT_KEY,
        JSON.stringify(buildPartnershipPreparationContext(selected, transcript))
      );
      router.push(destination);
    } catch {
      router.push(destination);
    }
  }

  return (
    <section className="ops-card ghost-member-lab" aria-labelledby="ghost-member-lab-title">
      <div className="ghost-member-lab__heading">
        <div className="card-heading">
          <p>Try the fit</p>
          <h2 id="ghost-member-lab-title">
            {members.length === 1 ? "One useful possibility to inspect" : `Compare ${members.length} useful possibilities`}
          </h2>
        </div>
        <p className="ghost-member-lab__disclosure" role="note">
          These are practice profiles, not real members. Ask them a few questions to learn what kind of person may fit
          before Werkles introduces anyone.
        </p>
        <p className="ghost-member-lab__count" role="status">
          Showing {visibleMembers.length} of {availableMembers.length} profiles currently in view.
          {dismissedIds.size ? ` ${dismissedIds.size} hidden for this tab.` : ""}
          {members.length < 9 ? " Werkles did not add weaker profiles to fill the deck." : ""}
        </p>
      </div>

      <details className="ghost-member-lab__ranking">
        <summary>How Werkles orders these matches</summary>
        <div className="ghost-member-lab__ranking-grid">
          <section>
            <h3>What moves someone up</h3>
            <p>#1 is the strongest current fit. After that, Werkles favors meaningfully different kinds of help among people who are still strong enough. Your location and work-style choice can break a close call.</p>
          </section>
          <section>
            <h3>What changes the deck</h3>
            <p>Correcting or resubmitting Intake, or deliberately changing your city, state, or work style. Practice questions and card clicks do not change the order.</p>
          </section>
          <section>
            <h3>What we do not use</h3>
            <p>Bank balance, net worth, time spent on a card, scrolling, outside browsing, inferred private traits, or hidden precise location.</p>
          </section>
        </div>
        <p className="ghost-member-lab__ranking-note">
          This is a current order of useful possibilities—not a compatibility percentage or a verdict. <Link href="/privacy#matching-boundary">See the matching privacy boundary.</Link>
        </p>
      </details>

      {comparisonMembers.length > 1 ? (
        <section className="ghost-member-lab__comparison" aria-labelledby="ghostComparisonTitle">
          <div className="ghost-member-lab__comparison-heading">
            <div>
              <p className="ghost-member-lab__eyebrow">Compare before choosing</p>
              <h3 id="ghostComparisonTitle">Why the strongest three are different.</h3>
            </div>
            <p>Fit, useful difference, distance, and unanswered questions stay separate. There is no compatibility percentage.</p>
          </div>
          <div className="ghost-member-lab__comparison-grid">
            {comparisonMembers.map((member) => (
              <article key={member.id} data-selected={member.id === selected?.id}>
                <p><strong>Current order #{member.rank ?? "—"}</strong></p>
                <h4>{member.displayName}</h4>
                <dl>
                  <div><dt>Could add</dt><dd>{HELP_LABELS[member.lane] ?? member.lane}</dd></div>
                  <div><dt>Travel</dt><dd>{member.proximityLabel ?? member.place}</dd></div>
                  <div><dt>Why here</dt><dd>{member.fitReasons[0]?.detail ?? "The reason still needs more information."}</dd></div>
                  <div><dt>Still unknown</dt><dd>{member.fitCautions[0] ?? member.proofGaps[0] ?? "No specific check recorded; fit is still unverified."}</dd></div>
                </dl>
                <button className="button button-outline" type="button" onClick={() => selectMember(member.id)}>
                  Review {firstNameForButton(member.displayName)}
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="ghost-member-lab__review-shelf" aria-labelledby="matchReviewShelfTitle">
        <div>
          <p className="ghost-member-lab__eyebrow">Your comparison shelf</p>
          <h3 id="matchReviewShelfTitle">Profiles you chose to revisit.</h3>
          <p>
            Save up to {MATCH_REVIEW_SHELF_LIMIT}. This is your device-only working list; it does not change Werkles&apos;
            order, notify anyone, or become an introduction.
          </p>
        </div>
        {reviewShelfMembers.length ? (
          <div className="ghost-member-lab__review-shelf-grid">
            {reviewShelfMembers.map((member) => (
              <article key={member.id}>
                <span>Current order #{member.rank ?? "—"}</span>
                <h4>{member.displayName}</h4>
                <p>{member.fitReasons[0]?.detail ?? "The reason still needs more information."}</p>
                <div>
                  <button className="button button-outline" type="button" onClick={() => selectMember(member.id)}>Review Again</button>
                  <button type="button" onClick={() => toggleReviewShelf(member.id)}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="ghost-member-lab__review-shelf-empty">Nothing saved yet. Choose a profile below and use “Save for Comparison.”</p>}
      </section>

      {existingWerkleHref ? (
        <aside className="ghost-member-lab__existing-werkle" aria-labelledby="existing-werkle-title">
          <div>
            <p className="ghost-member-lab__eyebrow">A practice Werkle is already on this device</p>
            <h3 id="existing-werkle-title">Continue that work—or deliberately start another.</h3>
            <p>The saved room stays separate from this selected profile. Nothing here replaces it, contacts anyone, or turns local practice into an account record.</p>
          </div>
          <Link className="button button-dark" href={existingWerkleHref}>Continue Existing Werkle</Link>
        </aside>
      ) : null}

      {!selected ? (
        <div className="ghost-member-lab__all-hidden" role="status">
          <div>
            <p className="ghost-member-lab__eyebrow">Deck cleared for now</p>
            <h3>You hid every practice profile in this tab.</h3>
            <p>Nothing changed your Intake, profile, or match order. Restore the deck whenever you want another look.</p>
          </div>
          <button className="button button-dark" type="button" onClick={restoreDismissed}>Restore Hidden Profiles</button>
        </div>
      ) : (
        <>

      <div className="ghost-member-lab__chooser" role="group" aria-label="Choose a practice profile">
        {visibleMembers.map((member) => (
          <button
            className="ghost-member-lab__person"
            type="button"
            key={member.id}
            aria-pressed={member.id === selected.id}
            onClick={() => selectMember(member.id)}
          >
            <span className="ghost-member-lab__initials" aria-hidden="true">
              {member.displayName
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join("")}
            </span>
            <span>
              {member.rank ? <span className="ghost-member-lab__rank">Current order #{member.rank}</span> : null}
              <strong>{member.displayName}</strong>
              <small>
                {member.roleLabel} · {member.place}
                {member.proximityLabel ? ` · ${member.proximityLabel}` : ""}
              </small>
              <span className="ghost-member-lab__fit-preview">
                May help with {HELP_LABELS[member.lane] ?? member.lane} · {member.fitReasons[0]?.label ?? "reason still needs more information"}
              </span>
            </span>
          </button>
        ))}
      </div>

      {visibleCount < availableMembers.length ? (
        <button
          className="button button-outline ghost-member-lab__more"
          type="button"
          onClick={() => setVisibleCount((current) => Math.min(current + 3, availableMembers.length))}
        >
          Show 3 More Profiles
        </button>
      ) : null}

      <div className="ghost-member-lab__stage">
        <article className="ghost-member-lab__profile" aria-labelledby="ghost-member-profile-title">
          {selected.snapshotNeed ? (
            <aside className="ghost-member-lab__snapshot" role="note">
              <strong>Connected to your working Snapshot</strong>
              <span>The reasons below show what Werkles connected to this profile.</span>
              <small>Built from self-reported Intake details · not independently verified</small>
            </aside>
          ) : null}
          <p className="ghost-member-lab__eyebrow">Selected profile</p>
          {selected.rank ? <p className="ghost-member-lab__selected-rank">Current order #{selected.rank} · based on the latest information you deliberately gave Werkles</p> : null}
          {selected.orderReason ? <p className="ghost-member-lab__order-reason">{selected.orderReason}</p> : null}
          <h3 id="ghost-member-profile-title">{selected.displayName}</h3>
          <p>
            {selected.roleLabel} in {selected.place}. May help with: {HELP_LABELS[selected.lane] ?? selected.lane}.
          </p>
          {selected.proximityLabel ? <p><strong>Travel fit:</strong> {selected.proximityLabel}.</p> : null}
          <dl>
            <div>
              <dt>Can offer</dt>
              <dd>{selected.offers.length ? selected.offers.join(" · ") : "Not stated yet"}</dd>
            </div>
            <div>
              <dt>Looking for</dt>
              <dd>{selected.seeks.length ? selected.seeks.join(" · ") : "Not stated yet"}</dd>
            </div>
            <div>
              <dt>Ready to contact?</dt>
              <dd>
                {selected.introEligibility === "open"
                  ? "Practice only — no real person is contacted"
                  : "Werkles would check this profile before any real contact"}
              </dd>
            </div>
          </dl>
          <div className="ghost-member-lab__view-controls">
            <button type="button" onClick={() => toggleReviewShelf(selected.id)}>
              {reviewShelfIds.includes(selected.id) ? "Remove from My Shortlist" : "Save for Comparison"}
            </button>
            <button type="button" onClick={dismissSelected}>Not a Fit for This Practice</button>
            {dismissedIds.size ? <button type="button" onClick={restoreDismissed}>Restore Hidden Profiles</button> : null}
            <p>Hidden for this tab only. This does not change your Intake, profile, or match ranking.</p>
          </div>
          <div className="ghost-member-lab__fit-readout">
            <section aria-labelledby="ghost-fit-reasons-title">
              <h4 id="ghost-fit-reasons-title">Why this profile is here</h4>
              {selected.fitReasons.length ? (
                <ul>{selected.fitReasons.map((reason, index) => (
                  <li key={`${reason.label}:${index}`}><strong>{reason.label}</strong><span>{reason.detail}</span></li>
                ))}</ul>
              ) : <p>Not enough matching evidence is available to explain this profile yet.</p>}
            </section>
            <section aria-labelledby="ghost-fit-cautions-title">
              <h4 id="ghost-fit-cautions-title">What could make this wrong</h4>
              {selected.fitCautions.length ? (
                <ul>{selected.fitCautions.map((caution, index) => <li key={`${caution}:${index}`}>{caution}</li>)}</ul>
              ) : <p>No specific caution was recorded. That is not the same as verified fit.</p>}
            </section>
          </div>
        </article>

        <div className="ghost-member-lab__conversation">
          <section className="ghost-member-lab__prompt-provenance" aria-labelledby="ghost-prompt-provenance-title">
            <p className="ghost-member-lab__eyebrow">Why these four?</p>
            <h3 id="ghost-prompt-provenance-title">Your answers choose the people. Their profile shapes the questions.</h3>
            <p>
              Your latest Intake and the profile facts you deliberately add affect who reaches this deck and in what
              order. After you choose someone, these four starters come from that practice profile&apos;s stated offer,
              need, unresolved cautions, and possible role.
            </p>
            <p>
              Asking a question here does not change your matches or publish anything about you. <Link href="/bellows/intake">Edit your Intake</Link> or <Link href="/dashboard/profile">profile</Link> to change the information Werkles is allowed to use.
            </p>
            <details>
              <summary>What would another person see about me?</summary>
              <p>
                Right now, nobody else sees a generated conversation about you: these are synthetic profiles and no
                introduction is live. Before real introductions open, Werkles needs a preview where your four starters
                are built only from the project, offer, need, and working preferences you choose to share—and where you
                can correct them before anyone receives them. Clicks, reading time, bank balance, and hidden guesses do
                not belong in that preview.
              </p>
            </details>
          </section>

          <div className="ghost-member-lab__questions" role="group" aria-label={`Questions for ${selected.displayName}`}>
            {questions.map((question) => (
              <button type="button" key={question.id} onClick={() => ask(question.id)}>
                <span>{question.label}</span>
                <small>{question.source}</small>
              </button>
            ))}
          </div>

          <div className="ghost-member-lab__transcript" role="log" aria-live="polite" aria-label="Practice conversation">
            {transcript.length ? (
              transcript.map((line, index) => (
                <div className="ghost-member-lab__exchange" key={`${line.questionId}-${index}`}>
                  <p className="ghost-member-lab__you"><strong>You:</strong> {line.question}</p>
                  <p><strong>{selected.displayName}:</strong> {line.answer}</p>
                </div>
              ))
            ) : (
              <p className="ghost-member-lab__empty">Choose a question to see how this person might answer.</p>
            )}
          </div>

          {transcript.length ? (
            <div className="ghost-member-lab__next-actions">
              <button className="button button-dark" type="button" onClick={() => openPreparation("/bellows/personal/partnership-alignment")}>
                Prepare for a Future Conversation
              </button>
              <button className="button button-outline" type="button" onClick={() => openPreparation(`/dashboard/werkles/formation?candidate=${encodeURIComponent(selected.id)}`)}>
                {existingWerkleHref ? "Start Another Practice Werkle" : "Start a Practice Werkle"}
              </button>
              <button className="button button-outline" type="button" onClick={() => openPreparation("/dashboard/crucible#match-check-context")}>
                Decide What Needs Checking
              </button>
              <button className="ghost-member-lab__reset" type="button" onClick={() => setTranscript([])}>
                Reset practice conversation
              </button>
            </div>
          ) : null}
        </div>
      </div>
        </>
      )}
    </section>
  );
}

function firstNameForButton(displayName: string) {
  return displayName.trim().split(/\s+/)[0] || "Profile";
}
