import Link from "next/link";
import Image from "next/image";

import { SiteHeader } from "@/components/foundry/site-header";
import { NarrativeJourneyRail } from "@/components/narrative/narrative-journey-rail";
import { copy } from "@/lib/copy";
import { getNarrativeAct } from "@/lib/narrative-arc";
import { squibbBellowsAssets, RENDER_BATCH_4_SQUIBB_ENABLED } from "@/lib/render-batch-4-imagery";

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
              <Link className="button button-dark" href="/bellows/recommendations">
                See recommendations
              </Link>
              <Link
                className="button button-outline"
                href="/dashboard/profile?next=%2Fbellows%2Frecommendations"
              >
                Build your profile
              </Link>
              <Link className="button button-ghost" href="/bellows/intake">
                Review the intake (closed)
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
              <figcaption>Squibb hosts practical lessons from the workshop floor.</figcaption>
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
                <figcaption>A practical lesson, kept close to the work.</figcaption>
              </figure>
              <figure>
                <Image
                  src={squibbBellowsAssets.workshopDesk}
                  alt="Squibb at workshop desk reviewing notes"
                  width={1280}
                  height={720}
                  className="bellows-squibb-gallery__photo"
                />
                <figcaption>Questions, notes, and the next useful step.</figcaption>
              </figure>
            </div>
          </section>
        ) : null}

        <section className="narrative-act-body panel" aria-labelledby="bellowsPathTitle">
          <p className="eyebrow">Start here</p>
          <h2 id="bellowsPathTitle">Recommendations first. Your profile makes them personal.</h2>
          <p>
            Start with the public example. Sign in and build your profile when you want a private, rules-based result.
            Intake submission is temporarily closed while secure account storage is connected.
          </p>
          <div className="actions" style={{ marginTop: "1rem" }}>
            <Link className="button button-dark" href="/bellows/recommendations">
              See a recommendation
            </Link>
            <Link
              className="button button-outline"
              href="/dashboard/profile?next=%2Fbellows%2Frecommendations"
            >
              Build your profile
            </Link>
            <Link className="button button-ghost" href="/bellows/intake">
              Review the intake (closed)
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

      </main>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
