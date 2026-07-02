import Link from "next/link";
import Image from "next/image";

import { NarrativeJourneyRail } from "@/components/narrative/narrative-journey-rail";
import { narrativeArcPages } from "@/lib/narrative-arc";

export function NarrativeJourneySection() {
  return (
    <section id="story" className="narrative-journey-section" aria-labelledby="storyTitle">
      <div className="narrative-journey-section__intro">
        <p className="eyebrow">Four-act journey</p>
        <h2 id="storyTitle">Spark → Space → Forge → Foundry</h2>
        <p className="narrative-journey-section__lede">
          Four acts, one floor. Follow the arc from Spark to Foundry — or jump to the beat that matches where you
          are on the bench.
        </p>
      </div>
      <NarrativeJourneyRail currentSlug="/" />
      <div className="narrative-journey-section__cards">
        {narrativeArcPages.map((page) => (
          <Link key={page.id} href={page.slug} className="narrative-journey-card">
            <figure className="narrative-journey-card__thumb">
              <Image
                src={page.heroImage}
                alt=""
                width={320}
                height={180}
                className="narrative-journey-card__photo"
              />
            </figure>
            <div className="narrative-journey-card__copy">
              <span className="narrative-journey-card__act">Act {page.act}</span>
              <strong>{page.eyebrow.replace(/^Act [IVX]+ — /, "")}</strong>
              <span>{page.headline}</span>
            </div>
          </Link>
        ))}
        <Link href="/bellows" className="narrative-journey-card narrative-journey-card--bellows">
          <div className="narrative-journey-card__copy">
            <span className="narrative-journey-card__act">Guide</span>
            <strong>Bellows</strong>
            <span>Squibb hosts operator lessons after proof.</span>
          </div>
        </Link>
      </div>
    </section>
  );
}
