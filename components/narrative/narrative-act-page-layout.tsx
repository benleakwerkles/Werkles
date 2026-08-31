import Image from "next/image";
import Link from "next/link";

import type { NarrativeActPage } from "@/lib/narrative-arc";
type Props = {
  act: NarrativeActPage;
  children?: React.ReactNode;
};

export function NarrativeActPageLayout({ act, children }: Props) {
  // Owner walkthrough 2026-07-27: primary nav stacked above the act rail is
  // repetitive and clunky. Every page using this layout mounts SiteHeader,
  // so the rail is dropped here rather than per page.
  return (
    <main className={`narrative-act-page route-room route-room--${act.id === "foundry" ? "proof" : act.id === "forge" ? "people" : "story"}`}>
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
    </main>
  );
}
