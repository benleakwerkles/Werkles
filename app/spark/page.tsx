import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/foundry/site-header";
import { NarrativeActPageLayout } from "@/components/narrative/narrative-act-page-layout";
import { copy } from "@/lib/copy";
import { getNarrativeAct } from "@/lib/narrative-arc";

export const metadata = {
  title: "Start free",
  description:
    "What Werkles is, what signing up provides, and who it is for — plain answers before you make an account."
};

const industryPortraits = [
  {
    src: "/assets/draft/industry-breadth/werkles-industry-florist.png",
    alt: "Florist arranging a bouquet behind her shop counter",
    label: "The florist pricing her first retail lease"
  },
  {
    src: "/assets/draft/industry-breadth/werkles-industry-veterinarian.png",
    alt: "Veterinarian examining a golden retriever in a small clinic",
    label: "The vet leaving the group practice"
  },
  {
    src: "/assets/draft/industry-breadth/werkles-industry-dj.png",
    alt: "DJ setting up her mobile rig before an event",
    label: "The DJ turning weekends into a company"
  }
];

export default function SparkPage() {
  const act = getNarrativeAct("/spark");
  if (!act) return null;

  return (
    <>
      <SiteHeader />
      <NarrativeActPageLayout act={act}>
        <section className="narrative-act-body panel" aria-label="What Werkles is">
          <h2>Most people arrive asking for a partner or money.</h2>
          <p>
            Sometimes that is exactly right. Often the real unlock is smaller, cheaper, and closer — an oven, a
            lender sized to the step, a license, one introduction. Werkles finds the need underneath the ask, shows
            you the options and the risks, and helps you verify the facts before you rely on anyone. The decision
            stays yours.
          </p>
        </section>

        <section className="narrative-act-body panel" aria-label="What signing up provides">
          <h2>What a free account gets you</h2>
          <ul className="spark-signup-list">
            <li>Tell us what is stuck, in your own words — no forms about "what partner do you want."</li>
            <li>A profile and a lane, so recommendations fit your situation instead of a template.</li>
            <li>Bellows — learn how the thing you are dreaming about actually gets built.</li>
            <li>See exactly how proof and verification work before you trust anyone with anything.</li>
          </ul>
          <p>
            Foundry Dues add the working layer when you are ready: guarded introductions, verification workflows,
            and a Workshop where your venture gets built. Dues buy runway and tools — never a guaranteed outcome.
          </p>
        </section>

        <section className="narrative-act-body panel" aria-label="The three rooms">
          <h2>Three rooms, plain names</h2>
          <div className="spark-taxonomy-strip">
            <div className="spark-taxonomy-chip">
              <strong>Bellows</strong>
              <span>Learn how to build the dream.</span>
            </div>
            <div className="spark-taxonomy-chip">
              <strong>Foundry</strong>
              <span>The membership and the people in it.</span>
            </div>
            <div className="spark-taxonomy-chip">
              <strong>Workshop</strong>
              <span>Where your venture lives and gets built.</span>
            </div>
          </div>
        </section>

        <section className="narrative-act-body panel" aria-label="Who Werkles is for">
          <h2>Built for every trade — not just the toolbelt ones</h2>
          <p>
            Bakers, bookkeepers, accountants, DJs, dog walkers, vets, florists, funeral-home directors — anyone
            leaving the perceived safety of a firm to build something of their own.
          </p>
          <div className="spark-industry-strip">
            {industryPortraits.map((p) => (
              <figure key={p.src} className="spark-industry-card">
                <Image src={p.src} alt={p.alt} width={819} height={614} className="spark-industry-photo" />
                <figcaption>{p.label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="narrative-act-body panel" aria-label="Start">
          <h2>Start with the need, not the paperwork.</h2>
          <div className="member-selected-surface__actions">
            <Link className="button button-dark" href="/signup">
              Start free
            </Link>
            <Link className="button button-outline" href="/bellows/intake">
              {copy.hero.primaryCta}
            </Link>
            <Link className="button button-outline" href="/proof">
              See how proof works
            </Link>
          </div>
        </section>
      </NarrativeActPageLayout>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
