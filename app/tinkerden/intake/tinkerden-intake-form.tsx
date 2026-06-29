"use client";

import { useState, type FormEvent } from "react";

type CreatedPacket = {
  packet_id: string;
  created_at: string;
  status: "DRAFT";
  title: string;
  target_aeye: string;
  target_machine: string;
  mission: string;
  purpose: string;
  return_destination: string;
};

type ApiResult = {
  ok?: boolean;
  error?: string;
  missing?: string[];
  packet?: CreatedPacket;
};

const INITIAL_FORM = {
  title: "",
  target_aeye: "",
  target_machine: "",
  mission: "",
  purpose: "",
  return_destination: "TinkerDen Intake"
};

export function TinkerDenIntakeForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [packet, setPacket] = useState<CreatedPacket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function createCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tinkerden/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const result = (await response.json()) as ApiResult;

      if (!response.ok || !result.ok || !result.packet) {
        setError(result.missing?.length ? `Missing: ${result.missing.join(", ")}` : result.error ?? "Could not create card.");
        return;
      }

      setPacket(result.packet);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create card.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateField(field: keyof typeof INITIAL_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <main className="td-intake">
      <section className="td-intake__panel">
        <p className="td-intake__eyebrow">TinkerDen Intake</p>
        <h1>Chat to Card</h1>
        <p className="td-intake__purpose">Enter packet contents once. TinkerDen generates the DRAFT card in OUTBOX.</p>

        <form className="td-intake__form" data-tinkerden-intake-form onSubmit={createCard}>
          <label>
            <span>title</span>
            <input name="title" value={form.title} onChange={(event) => updateField("title", event.target.value)} required />
          </label>
          <label>
            <span>target_aeye</span>
            <input
              name="target_aeye"
              value={form.target_aeye}
              onChange={(event) => updateField("target_aeye", event.target.value)}
              required
            />
          </label>
          <label>
            <span>target_machine</span>
            <input
              name="target_machine"
              value={form.target_machine}
              onChange={(event) => updateField("target_machine", event.target.value)}
              required
            />
          </label>
          <label>
            <span>mission</span>
            <textarea name="mission" value={form.mission} onChange={(event) => updateField("mission", event.target.value)} required />
          </label>
          <label>
            <span>purpose</span>
            <textarea name="purpose" value={form.purpose} onChange={(event) => updateField("purpose", event.target.value)} required />
          </label>
          <label>
            <span>return_destination</span>
            <input
              name="return_destination"
              value={form.return_destination}
              onChange={(event) => updateField("return_destination", event.target.value)}
              required
            />
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "CREATING..." : "CREATE CARD"}
          </button>
        </form>

        {error ? <p className="td-intake__error" role="alert">{error}</p> : null}
      </section>

      <section className="td-intake__outbox" aria-label="Generated card">
        <h2>Generated OUTBOX Card</h2>
        <div data-generated-card>
        {packet ? (
          <article className="td-spine-card">
            <p><strong>packet_id</strong> {packet.packet_id}</p>
            <p><strong>created_at</strong> {packet.created_at}</p>
            <p><strong>status</strong> {packet.status}</p>
            <p><strong>title</strong> {packet.title}</p>
            <p><strong>target</strong> {packet.target_aeye}</p>
            <p><strong>machine</strong> {packet.target_machine}</p>
            <p><strong>mission</strong> {packet.mission}</p>
            <p><strong>purpose</strong> {packet.purpose}</p>
            <p><strong>return</strong> {packet.return_destination}</p>
            <a href="/tinkerden">Open OUTBOX</a>
          </article>
        ) : (
          <p className="td-intake__empty">No card created yet.</p>
        )}
        </div>
      </section>
    </main>
  );
}
