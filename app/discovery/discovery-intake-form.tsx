"use client";

import { FormEvent, useState } from "react";
import {
  discoveryAssetValues,
  discoveryLaneValues,
  discoveryResponseSpeedValues
} from "@/lib/discovery/schema";

type SubmissionState =
  | { status: "idle"; message: string }
  | { status: "saving"; message: string }
  | { status: "saved"; message: string; intakeId: string }
  | { status: "error"; message: string };

export function DiscoveryIntakeForm() {
  const [submission, setSubmission] = useState<SubmissionState>({
    status: "idle",
    message: "One intake. Werkles compares practical next paths and explains what shaped the recommendation."
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Capture before any await: React nulls currentTarget once the
    // synchronous dispatch ends (crashed the success path — Bean #14).
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      name: String(form.get("name") || ""),
      contact: String(form.get("contact") || ""),
      situation: String(form.get("situation") || ""),
      goal: String(form.get("goal") || ""),
      why_now: String(form.get("why_now") || ""),
      assets: form.getAll("assets").map(String),
      stated_blocker: String(form.get("stated_blocker") || ""),
      tried: String(form.get("tried") || ""),
      constraints: String(form.get("constraints") || ""),
      one_thing: String(form.get("one_thing") || ""),
      lane: String(form.get("lane") || "Unsure"),
      response_speed: String(form.get("response_speed") || "Few days"),
      notes: String(form.get("notes") || "")
    };

    setSubmission({ status: "saving", message: "Saving the intake record." });

    try {
      const response = await fetch("/api/discovery/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const missing = Array.isArray(result.missing) ? ` Missing: ${result.missing.join(", ")}.` : "";
        setSubmission({ status: "error", message: `${result.error || "Could not save intake."}${missing}` });
        return;
      }

      formElement.reset();
      setSubmission({
        status: "saved",
        message: result.meaning || "Received for human review.",
        intakeId: String(result.intake_id || "")
      });
    } catch {
      setSubmission({
        status: "error",
        message: "Could not reach the workshop. Check your connection and try again — nothing you typed was lost."
      });
    }
  }

  return (
    <form className="discovery-intake-form" onSubmit={handleSubmit}>
      <div className="discovery-intake-form__grid">
        <label className="field">
          <span>Name</span>
          <input name="name" autoComplete="name" maxLength={120} required />
        </label>
        <label className="field">
          <span>Email or phone</span>
          <input name="contact" autoComplete="email" maxLength={160} required />
        </label>
      </div>

      <label className="field">
        <span>Where are you right now?</span>
        <textarea
          name="situation"
          rows={4}
          maxLength={800}
          required
          placeholder="Tell us the real starting point: work, project, constraint, mess, or opening."
        />
      </label>

      <label className="field">
        <span>What are you trying to move toward in the next 3-6 months?</span>
        <textarea name="goal" rows={3} maxLength={600} required />
      </label>

      <label className="field">
        <span>Why now?</span>
        <textarea name="why_now" rows={3} maxLength={600} />
      </label>

      <fieldset className="discovery-check-grid">
        <legend>What do you already have to work with?</legend>
        {discoveryAssetValues.map((asset) => (
          <label key={asset}>
            <input name="assets" type="checkbox" value={asset} />
            <span>{asset}</span>
          </label>
        ))}
      </fieldset>

      <label className="field">
        <span>What feels like the biggest thing in your way?</span>
        <textarea name="stated_blocker" rows={3} maxLength={600} required />
      </label>

      <label className="field">
        <span>What have you already tried, and what happened?</span>
        <textarea name="tried" rows={3} maxLength={600} />
      </label>

      <label className="field">
        <span>What cannot change?</span>
        <textarea name="constraints" rows={3} maxLength={600} placeholder="Location, time, money floor or ceiling, obligations, timing, dealbreakers." />
      </label>

      <label className="field">
        <span>If a stranger could hand you one thing right now, what would it be?</span>
        <input name="one_thing" maxLength={160} required />
      </label>

      <div className="discovery-intake-form__grid">
        <label className="field">
          <span>Which lane sounds closest today?</span>
          <select name="lane" defaultValue="Unsure">
            {discoveryLaneValues.map((lane) => (
              <option key={lane} value={lane}>{lane}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>How soon do you want a first answer?</span>
          <select name="response_speed" defaultValue="Few days">
            {discoveryResponseSpeedValues.map((speed) => (
              <option key={speed} value={speed}>{speed}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="field">
        <span>Anything else worth knowing?</span>
        <textarea name="notes" rows={3} maxLength={800} />
      </label>

      <div className="discovery-intake-form__footer">
        <button className="button button-dark" type="submit" disabled={submission.status === "saving"}>
          {submission.status === "saving" ? "Saving" : "Submit intake"}
        </button>
        <p className="status-line" role="status" data-status={submission.status}>
          {submission.message}
          {submission.status === "saved" ? (
            <>
              <br />
              Your reference number: <code>{submission.intakeId}</code>
            </>
          ) : null}
        </p>
      </div>
    </form>
  );
}
