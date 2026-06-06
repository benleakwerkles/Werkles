"use client";

import { copy } from "@/lib/copy";

export function WorkshopTrustRail() {
  const { foldTrust } = copy.home;

  return (
    <section className="hero-fold-trust" aria-label="Homepage trust and signup preview">
      <div className="hero-fold-trust__grid">
        <article className="hero-fold-trust__item">
          <p className="eyebrow">The before</p>
          <p>{foldTrust.before}</p>
        </article>
        <article className="hero-fold-trust__item">
          <p className="eyebrow">Proof posture</p>
          <p>{foldTrust.proof}</p>
          <p className="hero-fold-trust__badge">{copy.trust.badge}</p>
        </article>
        <article className="hero-fold-trust__item">
          <p className="eyebrow">If you sign up</p>
          <p>{foldTrust.signup}</p>
          <p className="hero-fold-trust__detail">{copy.hero.signupPreview}</p>
        </article>
      </div>
    </section>
  );
}
