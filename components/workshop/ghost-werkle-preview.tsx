"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  PARTNERSHIP_PREPARATION_CONTEXT_KEY,
  partnershipPreparationContextFrom,
  type PartnershipPreparationContext
} from "@/lib/bellows/partnership-preparation-context";

export function GhostWerklePreview() {
  const [context, setContext] = useState<PartnershipPreparationContext | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PARTNERSHIP_PREPARATION_CONTEXT_KEY);
      const parsed = stored ? partnershipPreparationContextFrom(JSON.parse(stored)) : null;
      setContext(parsed);
      if (parsed && window.location.hash === "#shared-werkle-preview") {
        window.requestAnimationFrame(() => document.getElementById("shared-werkle-preview")?.scrollIntoView());
      }
    } catch {
      setContext(null);
    }
  }, []);

  if (!context) return null;

  function clearPreview() {
    window.localStorage.removeItem(PARTNERSHIP_PREPARATION_CONTEXT_KEY);
    setContext(null);
  }

  return (
    <section className="workshop-werkle-preview" id="shared-werkle-preview" aria-labelledby="shared-werkle-preview-title">
      <div className="workshop-section-heading">
        <p>Practice room · nothing shared</p>
        <h2 id="shared-werkle-preview-title">See how work with {context.displayName} could begin.</h2>
        <span>
          {context.displayName} is a synthetic profile, not a real member or introduction. This preview creates no
          Werkle, invitation, message, or account record.
        </span>
      </div>

      <div className="workshop-werkle-preview__grid">
        <article>
          <span>Your side</span>
          <h3>Name what you need from the work</h3>
          <p>Your goal, limits, available time, and the part you want another person to own belong here.</p>
          <small>Werkles should use your Workshop; it should not invent these answers.</small>
        </article>
        <article>
          <span>{context.displayName}&apos;s side · synthetic</span>
          <h3>{context.roleLabel}</h3>
          <p><strong>Appears to offer:</strong> {context.offers.join(" · ") || "Nothing stated"}</p>
          <p><strong>Appears to seek:</strong> {context.seeks.join(" · ") || "Nothing stated"}</p>
          <p><strong>Why this profile surfaced:</strong> {context.fitReasons.join(" · ") || "The reason needs more information"}</p>
          <p><strong>What could make it wrong:</strong> {context.fitCautions.join(" · ") || "Fit remains unverified"}</p>
          <small>Claims still need a real conversation and relevant checks.</small>
        </article>
        <article>
          <span>The shared table</span>
          <h3>Decide before either person commits</h3>
          <p>Define the first small outcome, who owns each task, what evidence counts, and when either person can stop.</p>
          <small>Agreement comes before access, money, files, or provider checks.</small>
        </article>
      </div>

      <div className="member-selected-surface__actions">
        <Link className="button button-dark" href={`/dashboard/werkles/formation?candidate=${encodeURIComponent(context.profileId)}`}>
          Build the Shared Company Draft
        </Link>
        <Link className="button button-dark" href="/bellows/library/partnership-alignment">
          Prepare the Conversation
        </Link>
        <Link className="button button-outline" href="/dashboard/intros">
          Back to Match Deck
        </Link>
        <button className="button button-outline" type="button" onClick={clearPreview}>
          Remove Practice Profile
        </button>
      </div>
    </section>
  );
}
