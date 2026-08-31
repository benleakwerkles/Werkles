import Link from "next/link";
import Image from "next/image";

import { LocalAwareSiteHeader } from "@/components/foundry/local-aware-site-header";
import { SiteIcon } from "@/components/foundry/site-icon";
import { copy } from "@/lib/copy";
import { getNarrativeAct } from "@/lib/narrative-arc";
import { squibbBellowsAssets, RENDER_BATCH_4_SQUIBB_ENABLED } from "@/lib/render-batch-4-imagery";

const publicBellowsSamples = [
  {
    title: "Compare Suppliers",
    body: "Put every quote against the same requirement, full first-year cost, service response, and missing facts.",
    output: "Leave with a reusable supplier comparison.",
    href: "/bellows/library/supplier-comparison"
  },
  {
    title: "Test the Riskiest Assumption",
    body: "Choose what could sink the next move, set a time and cost limit, and decide what result changes the plan.",
    output: "Leave with a small, honest test.",
    href: "/bellows/library/assumption-test-design"
  },
  {
    title: "Prepare for a Partnership",
    body: "Compare separate answers about work, money, authority, absence, conflict, and exit before drafting an agreement.",
    output: "Leave with the disagreements visible.",
    href: "/bellows/library/partnership-alignment"
  }
] as const;

export const metadata = {
  title: "Learn the floor",
  description: "Practical business lessons, working tools, and clear next steps hosted by Squibb."
};

export default function BellowsPage() {
  const foundryAct = getNarrativeAct("/proof");

  return (
    <>
      <LocalAwareSiteHeader />
      <main className="bellows-main narrative-act-page route-room route-room--bellows workshop-route--bellows">

        <section className="bellows-hero panel bellows-hero--wired">
          <div className="bellows-hero__copy">
            <div className="product-heading">
              <SiteIcon icon="product-bellows" size="lg" className="site-icon--product" />
              <div className="product-heading__copy">
                <p className="eyebrow">{copy.bellows.eyebrow}</p>
                <h1>{copy.bellows.headline}</h1>
              </div>
            </div>
            <p>{copy.bellows.body}</p>
            <p className="muted">{copy.bellows.host}</p>
            <p className="trust-badge">{copy.bellows.shellNote}</p>
            <div className="actions" style={{ marginTop: "1rem" }}>
              <Link className="button button-light" href="/bellows/library">
                Browse the Public Bellows
              </Link>
              <Link className="button button-dark" href="/bellows/intake">
                Tell Werkles what you are building
              </Link>
              <Link className="button button-dark" href="/bellows/recommendations">
                See what Werkles recommends
              </Link>
              <Link className="button button-outline" href="/proof">
                See how Werkles checks claims
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
              <figcaption>Squibb, your guide through the Bellows</figcaption>
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
                <figcaption>Squibb walks each lesson at your pace — no guru talk</figcaption>
              </figure>
              <figure>
                <Image
                  src="/assets/draft/people-v1/people-bellows-learning.jpg"
                  alt="Man at his desk at home, working through a Bellows lesson on his laptop"
                  width={1280}
                  height={720}
                  className="bellows-squibb-gallery__photo"
                />
                <figcaption>What a lesson actually looks like — twenty minutes at the kitchen desk</figcaption>
              </figure>
            </div>
          </section>
        ) : null}

        <section className="bellows-sample-tools" aria-labelledby="bellowsSampleToolsTitle">
          <div className="bellows-sample-tools__heading">
            <p className="eyebrow">Try the work, not a sales pitch</p>
            <h2 id="bellowsSampleToolsTitle">Three things you can make here.</h2>
            <p>Public lessons are open to everyone. Each one ends with a decision tool you can use and revisit.</p>
          </div>
          <div className="bellows-sample-tools__grid">
            {publicBellowsSamples.map((sample) => (
              <article key={sample.href}>
                <h3>{sample.title}</h3>
                <p>{sample.body}</p>
                <strong>{sample.output}</strong>
                <Link className="button button-outline" href={sample.href}>Open This Lesson</Link>
              </article>
            ))}
          </div>
          <Link className="button button-light" href="/bellows/library">Browse Every Public Lesson</Link>
        </section>

        <section className="narrative-act-body panel" aria-labelledby="bellowsPathTitle">
          <p className="eyebrow">A useful place to begin</p>
          <h2 id="bellowsPathTitle">Tell us what is happening. Leave with something you can use.</h2>
          <p>
            Start with the part of the business that feels stuck. Werkles turns your answers into a shorter path,
            practical lessons, and working tools you can return to as the situation changes.
          </p>
          <div className="actions" style={{ marginTop: "1rem" }}>
            <Link className="button button-outline" href="/bellows/recommendations">
              See my recommended next moves
            </Link>
            <Link className="button button-outline" href="/dashboard">
              Member home
            </Link>
            <Link className="button button-outline" href="/proof">
              See how checks work
            </Link>
          </div>
        </section>

        {foundryAct ? (
          <section className="narrative-act-body panel">
            <p className="eyebrow">When you need to look closer</p>
            <h2>Learn enough to make the next decision with your eyes open.</h2>
            <p>
              Squibb helps you compare claims, costs, partners, suppliers, and plans without pretending one lesson
              can make the decision for you.
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
