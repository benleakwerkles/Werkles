import Image from "next/image";
import Link from "next/link";

import type { NarrativeActPage } from "@/lib/narrative-arc";
import { narrativeArcAttribution } from "@/lib/narrative-arc";
import { NarrativeJourneyRail } from "./narrative-journey-rail";

type Props = {
  act: NarrativeActPage;
  children?: React.ReactNode;
};

export function NarrativeActPageLayout({ act, children }: Props) {
  return (
    <main className="narrative-act-page">
      <NarrativeJourneyRail currentSlug={act.slug} />

      <section className="narrative-act-hero">
        <div className="narrative-act-hero__copy">
          <p className="eyebrow">{act.eyebrow}</p>
          <h1>{act.headline}</h1>
          <p className="narrative-act-hero__lede">{act.lede}</p>
          <div className="narrative-act-hero__actions">
            <Link className="button button-light" href={act.ctaHref}>
              {act.ctaLabel}
            </Link>
            {act.nextSlug ? (
              <Link className="button button-ghost" href={act.nextSlug}>
                Continue → {act.nextLabel}
              </Link>
            ) : null}
          </div>
        </div>
        <figure className="narrative-act-hero__figure">
          <Image
            src={act.heroImage}
            alt={act.heroAlt}
            width={1280}
            height={720}
            className="narrative-act-hero__photo"
            priority
          />
        </figure>
      </section>

      {children}

      <p className="narrative-act-page__note" role="note">
        {narrativeArcAttribution}
      </p>
    </main>
  );
}
