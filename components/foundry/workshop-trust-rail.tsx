"use client";

import Link from "next/link";

import { copy } from "@/lib/copy";

export function WorkshopTrustRail() {
  const { door } = copy.home.anyone;

  return (
    <section className="hero-fold-trust" aria-labelledby="doorTitle">
      <div className="hero-fold-trust__intro">
        <p className="eyebrow">{door.eyebrow}</p>
        <h2 id="doorTitle">{door.headline}</h2>
        <p>{door.body}</p>
        <p className="hero-fold-trust__supporting">{door.closing}</p>
        <Link className="button button-outline" href="/spark">
          {door.cta}
        </Link>
      </div>
    </section>
  );
}
