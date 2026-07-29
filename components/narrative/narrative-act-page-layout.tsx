import Image from "next/image";
import Link from "next/link";

import { SiteIcon } from "@/components/foundry/site-icon";
import type { NarrativeActPage } from "@/lib/narrative-arc";
import { narrativeArcAttribution } from "@/lib/narrative-arc";
import type { SiteIconId } from "@/lib/site-icons";
import { NarrativeJourneyRail } from "./narrative-journey-rail";

type Props = {
  act: NarrativeActPage;
  icon?: SiteIconId;
  children?: React.ReactNode;
};

export function NarrativeActPageLayout({ act, icon, children }: Props) {
  return (
    <main className="narrative-act-page">
      <NarrativeJourneyRail currentSlug={act.slug} />

      <section className="narrative-act-hero">
        <div className="narrative-act-hero__copy">
          {icon ? <SiteIcon icon={icon} size="lg" className="site-icon--product product-hero-icon" /> : null}
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
