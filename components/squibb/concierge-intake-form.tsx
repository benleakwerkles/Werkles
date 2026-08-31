"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  buildSpeakerIntakePacket,
  conciergeIntakeFieldLimit,
  CONCIERGE_INTAKE_QUESTIONS,
  EMPTY_INTAKE_ANSWERS,
  type ConciergeIntakeAnswers,
  type SpeakerIntakePacket
} from "@/lib/squibb/concierge-intake-v0";
import {
  BELLOWS_INTAKE_CLOSED_MESSAGE,
  BELLOWS_INTAKE_SUBMISSION_OPEN
} from "@/lib/squibb/concierge-intake-availability";
import { getClientAccessToken } from "@/lib/client-auth";

type IntakeSaveState =
  | { status: "idle"; message: string }
  | { status: "saving"; message: string }
  | {
      status: "saved";
      message: string;
      intakeId: string;
      packetPath: string;
      speakerEntryPath: string;
      shadowRunId: string;
    }
  | { status: "error"; message: string };

const INTAKE_FIELD_MAX = 600;
const INTAKE_GOAL_FIELD_MAX = conciergeIntakeFieldLimit("heaviest_lift");
const INTAKE_DRAFT_KEY = "werkles_concierge_intake_draft_v1";

const BUSINESS_STAGES = [
  "Just an idea",
  "Testing it",
  "First customers or users",
  "Running and trying to grow",
  "Changing or rebuilding it"
] as const;

const BLOCKER_CHOICES = [
  "Customers or sales",
  "Money to keep going",
  "Time or capacity",
  "Tools, equipment, or space",
  "Skills or credentials",
  "A teammate or adviser",
  "Paperwork, legal, or compliance",
  "Choosing between two paths",
  "Not sure yet"
] as const;

const ASSET_CHOICES = [
  "An idea or prototype",
  "Skills or credentials",
  "Customers or revenue",
  "Money or credit",
  "Time to work on it",
  "Tools, equipment, or a place",
  "A team or useful relationships",
  "An existing company or documents",
  "Nothing yet"
] as const;

const PATH_CHOICES = [
  "Loan or funding",
  "Partner or co-owner",
  "Employee or contractor",
  "Tool or system",
  "Training or adviser",
  "Moving or changing location"
] as const;

const PATH_STATUSES = ["", "Considering", "Tried", "Ruled out"] as const;
type PathStatus = (typeof PATH_STATUSES)[number];

const IDLE_MESSAGE = BELLOWS_INTAKE_SUBMISSION_OPEN
  ? "Your draft is kept in this browser as you type. Submit when you want Werkles to rebuild the results."
  : "Your draft is kept in this browser on this device. Account submission is temporarily paused.";

type ConciergeIntakeFormProps = {
  initialAnswers?: ConciergeIntakeAnswers;
};

function pathStatusesFromAnswer(value: string): Record<string, PathStatus> {
  const next: Record<string, PathStatus> = {};
  for (const line of value.split(/\r?\n/)) {
    const match = /^(Considering|Tried|Ruled out)\s+—\s+(.+)$/.exec(line.trim());
    if (match && PATH_CHOICES.includes(match[2] as (typeof PATH_CHOICES)[number])) {
      next[match[2]] = match[1] as PathStatus;
    }
  }
  return next;
}

function isDraftAnswers(value: unknown): value is ConciergeIntakeAnswers {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return CONCIERGE_INTAKE_QUESTIONS.every((question) => {
    const answer = record[question.id];
    return typeof answer === "string" && answer.length <= conciergeIntakeFieldLimit(question.id);
  });
}

export function ConciergeIntakeForm({ initialAnswers = EMPTY_INTAKE_ANSWERS }: ConciergeIntakeFormProps) {
  const [answers, setAnswers] = useState<ConciergeIntakeAnswers>(initialAnswers);
  const [pathStatuses, setPathStatuses] = useState<Record<string, PathStatus>>({});
  const [draftReady, setDraftReady] = useState(false);
  const [hasDirtyBrowserDraft, setHasDirtyBrowserDraft] = useState(false);
  const [accountSaveAvailable, setAccountSaveAvailable] = useState(false);
  const submissionId = useRef<string | null>(null);
  const [submitted, setSubmitted] = useState<SpeakerIntakePacket | null>(null);
  const [saveState, setSaveState] = useState<IntakeSaveState>({
    status: "idle",
    message: IDLE_MESSAGE
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(INTAKE_DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { answers?: unknown; dirty?: unknown };
        if (isDraftAnswers(parsed.answers)) {
          setAnswers(parsed.answers);
          setHasDirtyBrowserDraft(parsed.dirty === true);
          setPathStatuses(pathStatusesFromAnswer(parsed.answers.already_tried));
          setSaveState({
            status: "idle",
            message: parsed.dirty === true
              ? "Your unfinished browser draft is back."
              : "Checking for your latest account-saved Intake."
          });
        }
      } else {
        setPathStatuses(pathStatusesFromAnswer(initialAnswers.already_tried));
      }
    } catch {
      // A corrupt browser draft is ignored; the last submitted Intake remains.
    } finally {
      setDraftReady(true);
    }
  }, [initialAnswers]);

  useEffect(() => {
    if (!draftReady) return;
    let active = true;
    void (async () => {
      const token = await getClientAccessToken();
      const isAccountToken = Boolean(token && token !== "dev-preview-token");
      if (!active) return;
      setAccountSaveAvailable(isAccountToken);
      if (!isAccountToken || hasDirtyBrowserDraft) return;

      const response = await fetch("/api/bellows/intake/current", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (!response.ok || !active) return;
      const result = await response.json().catch(() => ({}));
      const restored = result?.intake?.answers;
      if (isDraftAnswers(restored)) {
        setAnswers(restored);
        setPathStatuses(pathStatusesFromAnswer(restored.already_tried));
        setSaveState({ status: "idle", message: "Your latest account-saved Intake is back." });
      }
    })().catch(() => {
      // Account restoration fails closed; the browser draft remains untouched.
    });
    return () => {
      active = false;
    };
  }, [draftReady, hasDirtyBrowserDraft]);

  useEffect(() => {
    if (!draftReady || !hasDirtyBrowserDraft) return;
    window.localStorage.setItem(
      INTAKE_DRAFT_KEY,
      JSON.stringify({ version: "v2", dirty: true, updatedAt: new Date().toISOString(), answers })
    );
  }, [answers, draftReady, hasDirtyBrowserDraft]);

  const canSubmit =
    BELLOWS_INTAKE_SUBMISSION_OPEN &&
    CONCIERGE_INTAKE_QUESTIONS.filter((q) => q.required).every(
      (q) => answers[q.id].trim().length > 0
  );

  function updateField(id: keyof ConciergeIntakeAnswers, value: string) {
    setHasDirtyBrowserDraft(true);
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setSubmitted(null);
    setSaveState({
      status: "idle",
      message: BELLOWS_INTAKE_SUBMISSION_OPEN
        ? "Draft saved in this browser. Submit when you want Werkles to rebuild the results."
        : IDLE_MESSAGE
    });
  }

  function toggleChoice(
    id: "time_cost" | "resources_on_hand",
    choice: string,
    checked: boolean
  ) {
    const current = answers[id]
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean);
    const next = checked
      ? [...new Set([...current, choice])]
      : current.filter((item) => item !== choice);
    updateField(id, next.join("; "));
  }

  function updatePathStatus(path: string, status: PathStatus) {
    const next = { ...pathStatuses, [path]: status };
    if (!status) delete next[path];
    setPathStatuses(next);
    updateField(
      "already_tried",
      PATH_CHOICES.flatMap((choice) => (next[choice] ? [`${next[choice]} — ${choice}`] : [])).join("\n")
    );
  }

  function choiceSelected(id: "time_cost" | "resources_on_hand", choice: string) {
    return answers[id]
      .split(";")
      .map((item) => item.trim())
      .includes(choice);
  }

  const unanswered = CONCIERGE_INTAKE_QUESTIONS.filter(
    (question) => !answers[question.id].trim()
  ).map((question) => question.label);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!BELLOWS_INTAKE_SUBMISSION_OPEN || !canSubmit) return;
    const packet = buildSpeakerIntakePacket(answers);
    setSubmitted(null);
    setSaveState({
      status: "saving",
      message: accountSaveAvailable ? "Saving this Intake to your account." : "Saving this Betsy walkthrough."
    });

    try {
      const token = await getClientAccessToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch("/api/bellows/intake", {
        method: "POST",
        credentials: "same-origin",
        headers,
        body: JSON.stringify({
          answers,
          clientSubmissionId: submissionId.current ??= window.crypto.randomUUID()
        })
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSaveState({
          status: "error",
          message: String(result.error || "Could not save this intake.")
        });
        return;
      }

      setSubmitted(packet);
      setSaveState({
        status: "saved",
        message: String(result.meaning || "Received for human review."),
        intakeId: String(result.intakeId || ""),
        packetPath: String(result.packetPath || ""),
        speakerEntryPath: String(result.speakerEntryPath || ""),
        shadowRunId: String(result.shadow_run_id || "")
      });
      window.localStorage.removeItem(INTAKE_DRAFT_KEY);
      setHasDirtyBrowserDraft(false);
      submissionId.current = null;
      /* This must be a document navigation, not a cached App Router transition.
         The POST may have just established the HttpOnly owner cookie that the
         Recommendations server component needs for its first render. */
      window.location.assign("/bellows/recommendations");
    } catch (error) {
      setSaveState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not save this intake."
      });
    }
  }

  return (
    <div className="concierge-intake">
      {!BELLOWS_INTAKE_SUBMISSION_OPEN ? (
        <section className="concierge-intake__closed panel" aria-labelledby="closedIntakeTitle">
          <div>
            <p className="eyebrow">The questions are open</p>
            <h2 id="closedIntakeTitle">Build your Intake now. Keep the draft here.</h2>
            <p className="concierge-intake__lead">
              Your answers stay in this browser while account submission is paused. You can review and edit the
              complete Intake without losing the worksheet again.
            </p>
          </div>
          <p className="concierge-intake__closed-note" role="status">
            {BELLOWS_INTAKE_CLOSED_MESSAGE}
          </p>
        </section>
      ) : null}

      <header className="concierge-intake__hero panel">
        <p className="eyebrow">Tell Werkles what you are building</p>
        <h1>Let&apos;s figure out what would help most.</h1>
        <p className="concierge-intake__lead">
          Tell us what you are making, what you have, and what is stuck. We will turn it into one working
          Snapshot, then use it to suggest next moves and people worth exploring.
        </p>
        <p className="concierge-intake__avoid" role="note">
          We will not choose the solution before hearing you.
        </p>
        <p className="concierge-intake__storage-truth" role="note">
          {!BELLOWS_INTAKE_SUBMISSION_OPEN ? (
            <><strong>Browser draft only for now.</strong> Account submission is paused, but this worksheet remains available.</>
          ) : accountSaveAvailable ? (
            <><strong>Account saving is on.</strong> Submit once and your latest Intake follows this sign-in.</>
          ) : (
            <><strong>Saved in this browser only.</strong> It will not follow you to another device until account saving is connected.</>
          )}
        </p>
        <div className="gate-list" aria-label="What intake produces">
          <span>One working Snapshot</span>
          <span>Practical next moves</span>
          <span>Possible people to explore</span>
          <span>Nothing sent automatically</span>
        </div>
      </header>

      <form className="concierge-intake__form panel" onSubmit={handleSubmit} noValidate>
        <section className="concierge-intake__chapter" aria-labelledby="intakeChapterGoal">
          <header className="concierge-intake__chapter-head">
            <span>1</span>
            <div>
              <p className="eyebrow">What you are working on</p>
              <h2 id="intakeChapterGoal">What are you making?</h2>
              <p>One ordinary sentence is enough.</p>
            </div>
          </header>

          <div className="concierge-intake__field">
            <label htmlFor="heaviest_lift">
              <span className="concierge-intake__label">What are you trying to make real?</span>
              <span className="concierge-intake__required">Required</span>
            </label>
            <textarea
              id="heaviest_lift"
              name="heaviest_lift"
              rows={5}
              maxLength={INTAKE_GOAL_FIELD_MAX}
              required
              value={answers.heaviest_lift}
              placeholder="For example: Turn my weekend catering work into a dependable business."
              onChange={(event) => updateField("heaviest_lift", event.target.value)}
            />
            <p className="concierge-intake__count">{answers.heaviest_lift.length.toLocaleString()} / {INTAKE_GOAL_FIELD_MAX.toLocaleString()}</p>
          </div>

          <fieldset className="concierge-intake__choice-field">
            <legend>Where is it today? <span>Required</span></legend>
            <p>Choose the closest answer. You can correct this later.</p>
            <div className="concierge-intake__choice-grid">
              {BUSINESS_STAGES.map((stage) => (
                <label key={stage} className="concierge-intake__choice">
                  <input
                    type="radio"
                    name="business_stage"
                    value={stage}
                    checked={answers.business_stage === stage}
                    onChange={() => updateField("business_stage", stage)}
                  />
                  <span>{stage}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="concierge-intake__field">
            <label htmlFor="success_twelve_months">
              <span className="concierge-intake__label">What would a good next year look like?</span>
              <span className="concierge-intake__optional">Optional</span>
            </label>
            <textarea
              id="success_twelve_months"
              name="success_twelve_months"
              rows={2}
              maxLength={INTAKE_FIELD_MAX}
              value={answers.success_twelve_months}
              placeholder="For example: Ten repeat customers and weekends back with my family."
              onChange={(event) => updateField("success_twelve_months", event.target.value)}
            />
          </div>
        </section>

        <section className="concierge-intake__chapter" aria-labelledby="intakeChapterBlocker">
          <header className="concierge-intake__chapter-head">
            <span>2</span>
            <div>
              <p className="eyebrow">What is in the way</p>
              <h2 id="intakeChapterBlocker">What is stopping it?</h2>
              <p>This changes the order of the options.</p>
            </div>
          </header>

          <fieldset className="concierge-intake__choice-field">
            <legend>What is getting in the way right now? <span>Pick at least one</span></legend>
            <div className="concierge-intake__choice-grid concierge-intake__choice-grid--wide">
              {BLOCKER_CHOICES.map((choice) => (
                <label key={choice} className="concierge-intake__choice">
                  <input
                    type="checkbox"
                    checked={choiceSelected("time_cost", choice)}
                    onChange={(event) => toggleChoice("time_cost", choice, event.target.checked)}
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="concierge-intake__field">
            <label htmlFor="stuck_decision">
              <span className="concierge-intake__label">What specific task or decision is stuck?</span>
              <span className="concierge-intake__optional">Optional detail</span>
            </label>
            <textarea
              id="stuck_decision"
              name="stuck_decision"
              rows={2}
              maxLength={INTAKE_FIELD_MAX}
              value={answers.stuck_decision}
              placeholder="For example: Decide whether to sell a small pilot first or look for funding now."
              onChange={(event) => updateField("stuck_decision", event.target.value)}
            />
          </div>

          <fieldset className="concierge-intake__path-field">
            <legend>Have you tried or ruled out any of these?</legend>
            <p>Past attempts stay past attempts. Choosing “Ruled out” will not turn that path into a recommendation.</p>
            <div className="concierge-intake__path-grid">
              {PATH_CHOICES.map((path) => (
                <label key={path}>
                  <span>{path}</span>
                  <select
                    value={pathStatuses[path] ?? ""}
                    onChange={(event) => updatePathStatus(path, event.target.value as PathStatus)}
                  >
                    {PATH_STATUSES.map((status) => (
                      <option key={status || "not-specified"} value={status}>
                        {status || "Not specified"}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <figure className="concierge-intake__breather">
          <Image
            src="/assets/draft/people-v1/people-spark-idea-moment.jpg"
            alt="A person pausing over a notebook to think through a real next move"
            width={1536}
            height={1024}
            sizes="(max-width: 640px) 100vw, 960px"
          />
          <figcaption>
            <strong>Different problems need different answers.</strong>
            <span>People, tools, money, and places are not interchangeable.</span>
          </figcaption>
        </figure>

        <section className="concierge-intake__chapter" aria-labelledby="intakeChapterAssets">
          <header className="concierge-intake__chapter-head">
            <span>3</span>
            <div>
              <p className="eyebrow">What you already have</p>
              <h2 id="intakeChapterAssets">What do you already have?</h2>
              <p>This helps with next steps now and possible matches later.</p>
            </div>
          </header>

          <fieldset className="concierge-intake__choice-field">
            <legend>What do you already have to work with?</legend>
            <div className="concierge-intake__choice-grid concierge-intake__choice-grid--wide">
              {ASSET_CHOICES.map((choice) => (
                <label key={choice} className="concierge-intake__choice">
                  <input
                    type="checkbox"
                    checked={choiceSelected("resources_on_hand", choice)}
                    onChange={(event) => toggleChoice("resources_on_hand", choice, event.target.checked)}
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="concierge-intake__field concierge-intake__field-grid">
            <label htmlFor="what_you_offer">
              <span className="concierge-intake__label">What could you help someone else with?</span>
              <span className="concierge-intake__optional">Optional</span>
              <textarea
                id="what_you_offer"
                name="what_you_offer"
                rows={3}
                maxLength={INTAKE_FIELD_MAX}
                value={answers.what_you_offer}
                placeholder="For example: Price jobs, repair small engines, or introduce local suppliers."
                onChange={(event) => updateField("what_you_offer", event.target.value)}
              />
            </label>
            <label htmlFor="constraints">
              <span className="concierge-intake__label">What cannot change?</span>
              <span className="concierge-intake__optional">Optional</span>
              <textarea
                id="constraints"
                name="constraints"
                rows={3}
                maxLength={INTAKE_FIELD_MAX}
                value={answers.constraints}
                placeholder="For example: I cannot move, quit my job yet, or risk more than $2,000."
                onChange={(event) => updateField("constraints", event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="concierge-intake__brief" aria-labelledby="workingBriefTitle">
          <header>
            <p className="eyebrow">Your working brief</p>
            <h2 id="workingBriefTitle">Here is what Werkles will use.</h2>
            <p>Change any answer above before submitting. Empty parts remain unknown; Werkles will not fill them in.</p>
          </header>
          <dl>
            <div><dt>Goal</dt><dd>{answers.heaviest_lift || "Not answered yet"}</dd></div>
            <div><dt>Stage</dt><dd>{answers.business_stage || "Not answered yet"}</dd></div>
            <div><dt>Blocker</dt><dd>{answers.time_cost || "Not answered yet"}</dd></div>
            <div><dt>Paths tried or ruled out</dt><dd>{answers.already_tried || "None specified"}</dd></div>
            <div><dt>What you have</dt><dd>{answers.resources_on_hand || "Not answered yet"}</dd></div>
            <div><dt>What you can offer</dt><dd>{answers.what_you_offer || "Unknown"}</dd></div>
          </dl>
          {unanswered.length > 0 ? <p className="concierge-intake__unknowns">Still unknown: {unanswered.join("; ")}</p> : null}
        </section>

        <div className="concierge-intake__actions">
          <button
            type="submit"
            className="button button-dark"
            disabled={!BELLOWS_INTAKE_SUBMISSION_OPEN || !canSubmit || saveState.status === "saving"}
          >
            {!BELLOWS_INTAKE_SUBMISSION_OPEN
              ? "Account submission paused"
              : saveState.status === "saving"
                ? "Reviewing your answers"
                : "Show me what might help"}
          </button>
          <p className="concierge-intake__preview-note" data-status={saveState.status} role="status">
            {saveState.message}
          </p>
        </div>
      </form>

      {submitted ? (
        <section className="concierge-intake__output panel" aria-labelledby="intakeOutputTitle">
          <h2 id="intakeOutputTitle">What we heard</h2>
          <p className="concierge-intake__output-summary">{submitted.speakerFeed.summary}</p>

          <div className="concierge-intake__symptom-block">
            <p className="concierge-intake__section-label">Your situation</p>
            <pre className="concierge-intake__symptom-pre">{submitted.speakerFeed.symptomBlock}</pre>
          </div>

          <div className="concierge-intake__actions" aria-label="Next steps after intake">
            <Link className="button button-dark" href="/bellows/recommendations">
              See your ranked next steps
            </Link>
            <Link className="button button-ghost" href="/dashboard">
              Back to member home
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
