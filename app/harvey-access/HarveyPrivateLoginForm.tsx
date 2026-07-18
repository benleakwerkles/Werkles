"use client";

import { FormEvent, useState } from "react";

export default function HarveyPrivateLoginForm() {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/harvey-private-access/login", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          password: String(form.get("password") ?? ""),
          remember: form.get("remember") === "on"
        })
      });
      if (response.ok) {
        window.location.assign("/harvey");
        return;
      }
      const body = await response.json().catch(() => ({})) as { error?: string };
      setError(response.status === 429
        ? "Too many attempts. Harvey is locked briefly before another try."
        : body.error === "HARVEY_PRIVATE_ACCESS_UNAVAILABLE"
          ? "Private Harvey is not configured on this deployment yet."
          : "That password did not open Harvey.");
    } catch {
      setError("Harvey could not reach the private access gate.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 16 }}>
      <label style={{ display: "grid", gap: 8, fontWeight: 800 }}>
        Private Harvey password
        <input
          autoComplete="current-password"
          autoFocus
          name="password"
          required
          type="password"
          style={{ width: "100%", border: "1px solid #6f776f", borderRadius: 10, background: "#080b0c", color: "#fff", padding: "13px 14px", fontSize: 18 }}
        />
      </label>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#cbd1cc", lineHeight: 1.4 }}>
        <input name="remember" type="checkbox" style={{ marginTop: 3 }} />
        Keep this machine signed in for seven days. Leave this off on Medullina or any shared machine.
      </label>
      <button disabled={pending} type="submit" style={{ border: 0, borderRadius: 10, background: pending ? "#80652d" : "#e1ad43", color: "#111", padding: "13px 16px", fontSize: 17, fontWeight: 950, cursor: pending ? "wait" : "pointer" }}>
        {pending ? "Opening secure session…" : "Open Harvey"}
      </button>
      <div aria-live="polite" style={{ minHeight: 24, color: "#ffb4a8", fontWeight: 750 }}>{error}</div>
    </form>
  );
}
