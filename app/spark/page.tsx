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

/* people-v1 pass (2026-08-02): photoreal portraits whose jobs read at a
   glance — the DJ rig confused the walkthrough ("is she djing?"). */
const industryPortraits = [
  {
    src: "/assets/draft/people-v1/people-florist-lean.png",
    alt: "Florist leaning on her clean counter with a finished bouquet",
    label: "The florist pricing her first retail lease"
  },
  {
    src: "/assets/draft/people-v1/people-vet-exam.jpg",
    alt: "Veterinarian gently examining a golden retriever in a bright clinic room",
    label: "The vet leaving the group practice"
  },
  {
    src: "/assets/draft/people-v1/people-barber-sweeping.jpg",
    alt: "Barber sweeping his shop floor between customers",
    label: "The barber going out on his own"
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
          <p>
            Not a feature list — this is the shape of the four free surfaces. (Sample data; verification
            providers are listed with live status on the <Link href="/privacy">privacy page</Link>.)
          </p>
          {/* Show-don't-tell (Operator, Spark review 2026-07-31): each former bullet
             is now a miniature of the real surface, in the membership-floor
             mock language the Codex crew established. */}
          <div className="membership-floor__grid spark-floor">
            <article className="membership-floor__surface">
              <div className="membership-floor__surface-head">
                <span aria-hidden="true">01</span>
                <p>Say it your way</p>
              </div>
              <h3>No forms about "what partner do you want."</h3>
              <div className="spark-mock-intake">
                <p className="spark-mock-intake__you">
                  &ldquo;I need $40k for a second van and ceramic-coating gear.&rdquo;
                </p>
                <p className="spark-mock-intake__squibb">
                  A useful next comparison might be one lender sized to the step and one bay lease. Want to see
                  what each route would cost?
                </p>
              </div>
            </article>
            <article className="membership-floor__surface">
              <div className="membership-floor__surface-head">
                <span aria-hidden="true">02</span>
                <p>A profile that fits</p>
              </div>
              <h3>Your situation, not a template.</h3>
              {/* Ender 1a: no ✓ on profile fields — a check there asserts the
                 trade/location were verified, the claim Locke just removed. */}
              <ul className="spark-mock-rows" aria-label="Profile preview">
                <li>Trade: mobile detailing</li>
                <li>Where: Norfolk, 23503</li>
                <li>Lane: Operator</li>
              </ul>
            </article>
            <article className="membership-floor__surface">
              <div className="membership-floor__surface-head">
                <span aria-hidden="true">03</span>
                <p>Bellows</p>
              </div>
              <h3>Learn how the dream actually gets built.</h3>
              <ul className="spark-mock-rows" aria-label="Lesson preview">
                <li>
                  What a lease actually costs <span className="membership-verifiers__purpose">done</span>
                </li>
                <li>
                  Pricing your first 90 days <span className="membership-verifiers__purpose">in progress</span>
                </li>
                <li>
                  When a partner beats a loan <span className="membership-verifiers__purpose">next</span>
                </li>
              </ul>
            </article>
            <article className="membership-floor__surface">
              <div className="membership-floor__surface-head">
                <span aria-hidden="true">04</span>
                <p>Proof, shown first</p>
              </div>
              <h3>See how checks work before you trust anyone.</h3>
              <ul aria-label="Proof receipt preview">
                <li>Identity — verified (Stripe Identity)</li>
                <li>Funds at least $25k — yes (Plaid)</li>
              </ul>
              <p>Never the raw balance. Never a guess.</p>
              {/* Locke audit 2026-07-31: without this line the mock reads as a
                 live receipt — a stranger could claim they were told live
                 verification exists today. */}
              <p className="spark-mock-note">
                Sample receipt — live checks arrive with the providers named on the privacy page.
              </p>
            </article>
          </div>
          <p>
            Foundry Dues add the working layer when you are ready: guarded introductions, verification workflows,
            and a Workshop where your venture gets built. Membership supports the tools and guarded access—never a guaranteed outcome.
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
          {/* Ender verdict 2026-07-31: "behemoth" is negative-coded; the
             anthem quote moved to the last line of the page where it's earned. */}
          <p>And no ceiling: the corner bakery and the next household name start from the same first step.</p>
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
          {/* O'Shaughnessy's "Ode" (1873, public domain) — Wonka's line. One
             controlled surprise, last line on the page, after the plain
             checkable copy has earned it (Ender placement verdict). */}
          <p className="spark-anthem">We are the music makers, and we are the dreamers of dreams.</p>
        </section>
      </NarrativeActPageLayout>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
