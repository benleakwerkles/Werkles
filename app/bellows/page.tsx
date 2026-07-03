import Link from "next/link";
import Image from "next/image";

import { SiteHeader } from "@/components/foundry/site-header";
import { NarrativeJourneyRail } from "@/components/narrative/narrative-journey-rail";
import { copy } from "@/lib/copy";
import { narrativeArcAttribution, getNarrativeAct } from "@/lib/narrative-arc";
import { squibbBellowsAssets, RENDER_BATCH_4_SQUIBB_ENABLED, renderBatch4AttributionNote } from "@/lib/render-batch-4-imagery";

export default function BellowsPage() {
  const foundryAct = getNarrativeAct("/proof");

  return (
    <>
      <SiteHeader />
      <main className="bellows-main narrative-act-page">
        <NarrativeJourneyRail currentSlug="/bellows" />

        <section className="bellows-hero panel bellows-hero--wired">
          <div className="bellows-hero__copy">
            <p className="eyebrow">{copy.bellows.eyebrow}</p>
            <h1>{copy.bellows.headline}</h1>
            <p>{copy.bellows.body}</p>
            <p className="muted">{copy.bellows.host}</p>
            <p className="trust-badge">{copy.bellows.shellNote}</p>
            <div className="actions" style={{ marginTop: "1rem" }}>
              <Link className="button button-dark" href="/bellows/intake">
                Start concierge intake
              </Link>
              <Link className="button button-dark" href="/bellows/recommendations">
                See Squibb recommendations
              </Link>
              <Link className="button button-outline" href="/bellows/recommendations/test-case-0">
                Walk through an example
              </Link>
              <Link className="button button-outline" href="/proof">
                Inspect proof first
              </Link>
            </div>
          </div>
          {RENDER_BATCH_4_SQUIBB_ENABLED ? (
            <figure className="bellows-hero__squibb">
              <Image
                src={squibbBellowsAssets.bustHost}
                alt="Squibb — brass workshop owl host for Bellows lessons"
                width={512}
                height={512}
                className="bellows-hero__squibb-photo"
                priority
              />
              <figcaption>Squibb hosts — draft exploration, not canonical cutout</figcaption>
            </figure>
          ) : null}
        </section>

        {RENDER_BATCH_4_SQUIBB_ENABLED ? (
          <section className="bellows-squibb-gallery" aria-labelledby="bellowsSquibbTitle">
            <h2 id="bellowsSquibbTitle">Squibb on the Bellows floor</h2>
            <div className="bellows-squibb-gallery__grid">
              <figure>
                <Image
                  src={squibbBellowsAssets.lessonCard}
                  alt="Squibb beside a lesson card on the workshop desk"
                  width={800}
                  height={600}
                  className="bellows-squibb-gallery__photo"
                />
                <figcaption>Lesson card host — anti-guru, operator scale</figcaption>
              </figure>
              <figure>
                <Image
                  src={squibbBellowsAssets.workshopDesk}
                  alt="Squibb at workshop desk reviewing notes"
                  width={1280}
                  height={720}
                  className="bellows-squibb-gallery__photo"
                />
                <figcaption>Wide host scene — Bellows curriculum direction</figcaption>
              </figure>
            </div>
            <p className="bellows-squibb-gallery__note" role="note">
              {renderBatch4AttributionNote} Compare against manual cutout path in{" "}
              <code>public/assets/mascot/README.md</code>.
            </p>
          </section>
        ) : null}

        <section className="narrative-act-body panel" aria-labelledby="bellowsPathTitle">
          <p className="eyebrow">First useful path</p>
          <h2 id="bellowsPathTitle">Intake first, recommendation second, proof always visible.</h2>
          <p>
            Bellows should not start by asking which service you want. It starts with the heaviest thing you are trying
            to lift, formats that into a Speaker-readable packet, then shows Squibb's reversible next-step options.
          </p>
          <div className="actions" style={{ marginTop: "1rem" }}>
            <Link className="button button-outline" href="/bellows/recommendations">
              Compare recommendation types
            </Link>
            <Link className="button button-outline" href="/dashboard">
              Member home
            </Link>
            <Link className="button button-outline" href="/proof">
              Inspect proof
            </Link>
          </div>
        </section>

        {foundryAct ? (
          <section className="narrative-act-body panel">
            <p className="eyebrow">After Foundry</p>
            <h2>Learn how the floor actually works</h2>
            <p>
              Bellows sits after the proof act in the journey — once you know what signal to inspect, Squibb helps
              you learn operator math without guru fog.
            </p>
            <Link className="button button-ghost" href={foundryAct.slug}>
              ← {foundryAct.eyebrow}
            </Link>
          </section>
        ) : null}

        <p className="narrative-act-page__note" role="note">
          {narrativeArcAttribution}
        </p>
      </main>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
