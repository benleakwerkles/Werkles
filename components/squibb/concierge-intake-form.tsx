"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  buildSpeakerIntakePacket,
  CONCIERGE_INTAKE_QUESTIONS,
  EMPTY_INTAKE_ANSWERS,
  formatSpeakerIntakeJson,
  type ConciergeIntakeAnswers,
  type SpeakerIntakePacket
} from "@/lib/squibb/concierge-intake-v0";
import {
  BELLOWS_INTAKE_CLOSED_MESSAGE,
  BELLOWS_INTAKE_SUBMISSION_OPEN
} from "@/lib/squibb/concierge-intake-availability";

type IntakeSaveState =
  | { status: "idle"; message: string }
  | { status: "saving"; message: string }
  | {
      status: "saved";
      message: string;
    }
  | { status: "error"; message: string };

const INTAKE_FIELD_MAX = 600;

export function ConciergeIntakeForm() {
  const [answers, setAnswers] = useState<ConciergeIntakeAnswers>(EMPTY_INTAKE_ANSWERS);
  const [submitted, setSubmitted] = useState<SpeakerIntakePacket | null>(null);
  const [saveState, setSaveState] = useState<IntakeSaveState>({
    status: "idle",
    message: `${BELLOWS_INTAKE_CLOSED_MESSAGE} Nothing you type here is saved or sent.`
  });

  const canSubmit = useMemo(
    () =>
      BELLOWS_INTAKE_SUBMISSION_OPEN &&
      CONCIERGE_INTAKE_QUESTIONS.some((q) => answers[q.id].trim().length > 0),
    [answers]
  );

  function updateField(id: keyof ConciergeIntakeAnswers, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setSubmitted(null);
    setSaveState({
      status: "idle",
      message: `${BELLOWS_INTAKE_CLOSED_MESSAGE} Nothing you type here is saved or sent.`
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!BELLOWS_INTAKE_SUBMISSION_OPEN || !canSubmit) return;
    const packet = buildSpeakerIntakePacket(answers);
    setSubmitted(null);
    setSaveState({ status: "saving", message: "Saving your intake for human review." });

    try {
      const response = await fetch("/api/bellows/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers })
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
        message:
          "Intake received for human review. The public recommendation walkthrough remains example-only."
      });
    } catch {
      setSaveState({
        status: "error",
        message: "The intake could not be received. Nothing should be assumed saved."
      });
    }
  }

  return (
    <div className="concierge-intake">
      <header className="concierge-intake__hero panel">
        <p className="eyebrow">Werkles intake</p>
        <h1>Name what you are carrying</h1>
        <p className="concierge-intake__lead">
          Review the questions below before you share anything. Submission is temporarily closed while secure
          account storage is being connected. Nothing you type here is saved or sent.
        </p>
        <p className="concierge-intake__avoid" role="note">
          We will not ask: &ldquo;What partner do you need?&rdquo; or &ldquo;What service do you
          want?&rdquo;
        </p>
        <div className="gate-list" aria-label="What intake produces">
          <span>Submission closed</span>
          <span>Nothing sent</span>
          <span>Human review required</span>
          <span>No automatic contact</span>
        </div>
      </header>

      <form className="concierge-intake__form panel" onSubmit={handleSubmit} noValidate>
        <ol className="concierge-intake__questions">
          {CONCIERGE_INTAKE_QUESTIONS.map((question, index) => (
            <li key={question.id} className="concierge-intake__field">
              <label htmlFor={question.id}>
                <span className="concierge-intake__num">{index + 1}</span>
                <span className="concierge-intake__label">{question.label}</span>
              </label>
              <p className="concierge-intake__hint">{question.hint}</p>
              <textarea
                id={question.id}
                name={question.id}
                rows={3}
                maxLength={INTAKE_FIELD_MAX}
                value={answers[question.id]}
                placeholder={question.placeholder}
                onChange={(event) => updateField(question.id, event.target.value)}
              />
              <p className="concierge-intake__count" aria-live="polite">
                {answers[question.id].length}/{INTAKE_FIELD_MAX}
              </p>
            </li>
          ))}
        </ol>

        <div className="concierge-intake__actions">
          <button
            type="submit"
            className="button button-dark"
            disabled={!BELLOWS_INTAKE_SUBMISSION_OPEN || !canSubmit || saveState.status === "saving"}
          >
            {!BELLOWS_INTAKE_SUBMISSION_OPEN
              ? "Submission temporarily closed"
              : saveState.status === "saving"
                ? "Submitting"
                : "Submit for review"}
          </button>
          <p className="concierge-intake__preview-note" data-status={saveState.status} role="status">
            {saveState.message}
          </p>
        </div>
      </form>

      {submitted ? (
        <section className="concierge-intake__output panel" aria-labelledby="intakeOutputTitle">
          <h2 id="intakeOutputTitle">Speaker intake packet</h2>
          <p className="concierge-intake__output-summary">{submitted.speakerFeed.summary}</p>

          <div className="concierge-intake__symptom-block">
            <p className="concierge-intake__section-label">Symptom block</p>
            <pre className="concierge-intake__symptom-pre">{submitted.speakerFeed.symptomBlock}</pre>
          </div>

          <div className="concierge-intake__json">
            <p className="concierge-intake__section-label">Structured JSON (Speaker feed)</p>
            <pre className="concierge-intake__json-pre">{formatSpeakerIntakeJson(submitted)}</pre>
          </div>

          <div className="concierge-intake__actions" aria-label="Next steps after intake">
            <Link className="button button-dark" href="/bellows/recommendations">
              Compare next-step options
            </Link>
            <Link className="button button-outline" href="/bellows/recommendations/test-case-0">
              See the walkthrough proof
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
