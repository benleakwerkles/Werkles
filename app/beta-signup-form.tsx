"use client";

import { FormEvent, useState } from "react";
import { copy } from "@/lib/copy";

export default function BetaSignupForm() {
  const [status, setStatus] = useState(copy.beta.idle);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    setStatus(copy.beta.loading);

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
      setStatus(result.error || "Could not save beta signup.");
      return;
    }

    event.currentTarget.reset();
    setStatus(result.note || copy.beta.success);
  }

  return (
    <form className="beta-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" placeholder="you@example.com" required />
      </label>
      <label className="field">
        <span>Lane</span>
        <select name="lane" defaultValue="Builder">
          {copy.laneOptions.map((lane) => (
            <option key={lane} value={lane}>{lane}</option>
          ))}
        </select>
      </label>
      <button className="button button-dark" type="submit">{copy.beta.cta}</button>
      <p className="status-line" role="status">{status}</p>
    </form>
  );
}
