"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  PARTNERSHIP_PREPARATION_CONTEXT_KEY,
  partnershipPreparationContextFrom,
  type PartnershipPreparationContext
} from "@/lib/bellows/partnership-preparation-context";

export function FormationArrivalContext({ partnerId }: { partnerId: string }) {
  const [context, setContext] = useState<PartnershipPreparationContext | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PARTNERSHIP_PREPARATION_CONTEXT_KEY);
      const parsed = raw ? partnershipPreparationContextFrom(JSON.parse(raw)) : null;
      setContext(parsed?.profileId === partnerId ? parsed : null);
    } catch {
      setContext(null);
    }
  }, [partnerId]);

  if (!context) return null;

  function clearContext() {
    window.localStorage.removeItem(PARTNERSHIP_PREPARATION_CONTEXT_KEY);
    setContext(null);
  }

  return (
    <section className="werkle-arrival-context" aria-labelledby="werkle-arrival-context-title">
      <div>
        <p className="workshop-eyebrow">Carried from your Match Deck</p>
        <h2 id="werkle-arrival-context-title">Keep the conversation with {context.displayName} in view.</h2>
        <p>This is synthetic practice context—not a real person&apos;s promise. It helps you remember what to examine; it does not enter the shared Werkle unless both sides later accept exact wording.</p>
      </div>
      <dl>
        <div><dt>Appears to offer</dt><dd>{context.offers.join(" · ") || "Nothing specific yet"}</dd></div>
        <div><dt>Appears to need</dt><dd>{context.seeks.join(" · ") || "Nothing specific yet"}</dd></div>
        <div><dt>Could make the fit wrong</dt><dd>{context.fitCautions.join(" · ") || "Fit remains unverified"}</dd></div>
      </dl>
      {context.practiceExchanges.length ? (
        <details>
          <summary>Review the {context.practiceExchanges.length} practice {context.practiceExchanges.length === 1 ? "exchange" : "exchanges"} you already explored</summary>
          <ol>{context.practiceExchanges.map((exchange) => <li key={exchange.questionId}><strong>{exchange.question}</strong><span>{exchange.answer}</span><small>{exchange.source}</small></li>)}</ol>
        </details>
      ) : null}
      <div className="member-selected-surface__actions">
        <Link className="button button-outline" href="/dashboard/intros">Change Practice Profile</Link>
        <button className="button button-ghost" type="button" onClick={clearContext}>Remove This Practice Context</button>
      </div>
    </section>
  );
}
