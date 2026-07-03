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

type IntakeSaveState =
  | { status: "idle"; message: string }
  | { status: "saving"; message: string }
  | {
      status: "saved";
      message: string;
      intakeId: string;
      packetPath: string;
      speakerEntryPath: string;
    }
  | { status: "error"; message: string };

export function ConciergeIntakeForm() {
  const [answers, setAnswers] = useState<ConciergeIntakeAnswers>(EMPTY_INTAKE_ANSWERS);
  const [submitted, setSubmitted] = useState<SpeakerIntakePacket | null>(null);
  const [saveState, setSaveState] = useState<IntakeSaveState>({
    status: "idle",
    message: "Nothing is saved until you submit. No matching. No profiles."
  });

  const canSubmit = useMemo(
    () => CONCIERGE_INTAKE_QUESTIONS.some((q) => answers[q.id].trim().length > 0),
    [answers]
  );

  function updateField(id: keyof ConciergeIntakeAnswers, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setSubmitted(null);
    setSaveState({
      status: "idle",
      message: "Edits are local until you submit again. No matching. No profiles."
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    const packet = buildSpeakerIntakePacket(answers);
    setSubmitted(packet);
    setSaveState({ status: "saving", message: "Saving Speaker intake for human review." });

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

      setSaveState({
        status: "saved",
        message: String(result.meaning || "Received for human review."),
        intakeId: String(result.intakeId || ""),
        packetPath: String(result.packetPath || ""),
        speakerEntryPath: String(result.speakerEntryPath || "")
      });
    } catch (error) {
      setSaveState({
        status: "error",
        message: error instanceof Error ? error.message : "Could not save this intake."
      });
    }
  }

  return (
    <div className="concierge-intake">
      <header className="concierge-intake__hero panel">
        <p className="eyebrow">Squibb · Concierge Intake · v0</p>
        <h1>Name what you are carrying</h1>
        <p className="concierge-intake__lead">
          Symptoms only — not solutions. We do not ask what partner or service you want. Answers
          format into a Speaker intake packet.
        </p>
        <p className="concierge-intake__avoid" role="note">
          We will not ask: &ldquo;What partner do you need?&rdquo; or &ldquo;What service do you
          want?&rdquo;
        </p>
        <div className="gate-list" aria-label="What intake produces">
          <span>Symptom packet</span>
          <span>Speaker-readable summary</span>
          <span>Recommendation-ready context</span>
          <span>No profile or match created</span>
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
                value={answers[question.id]}
                placeholder={question.placeholder}
                onChange={(event) => updateField(question.id, event.target.value)}
              />
            </li>
          ))}
        </ol>

        <div className="concierge-intake__actions">
          <button type="submit" className="button button-dark" disabled={!canSubmit || saveState.status === "saving"}>
            {saveState.status === "saving" ? "Saving for Speaker" : "Save Speaker packet"}
          </button>
          <p className="concierge-intake__preview-note" data-status={saveState.status} role="status">
            {saveState.message}
            {saveState.status === "saved" ? (
              <>
                <br />
                Intake: <code>{saveState.intakeId}</code>
                <br />
                Packet: <code>{saveState.packetPath}</code>
                <br />
                Speaker entry: <code>{saveState.speakerEntryPath}</code>
              </>
            ) : null}
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
