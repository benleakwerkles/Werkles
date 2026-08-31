"use client";

import { FormEvent, useState } from "react";
import { copy } from "@/lib/copy";

export default function BetaSignupForm() {
  const [status, setStatus] = useState(copy.beta.idle);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    setIsSubmitting(true);
    setStatus(copy.beta.loading);

    try {
      const response = await fetch("/api/beta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: String(form.get("email") || ""),
          lane: String(form.get("lane") || "")
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(result.error || "Could not save your request. Please try again.");
        return;
      }

      formElement.reset();
      setStatus(result.note || copy.beta.success);
    } catch {
      setStatus("Could not reach Werkles. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="beta-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" placeholder="you@example.com" required />
      </label>
      <label className="field">
        <span>Lane</span>
        <select name="lane" defaultValue="" required>
          <option value="" disabled>Choose your lane</option>
          {copy.laneOptions.map((lane) => (
            <option key={lane} value={lane}>{lane}</option>
          ))}
        </select>
      </label>
      <button className="button button-dark" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : copy.beta.cta}
      </button>
      <p className="status-line" role="status">{status}</p>
    </form>
  );
}
