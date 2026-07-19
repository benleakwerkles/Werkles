import type { Metadata } from "next";
import Link from "next/link";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { routeAtmosphere } from "@/lib/workshop-facets";

export const metadata: Metadata = {
  title: "Public Test Data Notice | Werkles",
  description: "A plain-language account of what Werkles stores and keeps closed during public testing.",
  robots: { index: false, follow: false }
};

export default function PublicTestDataNoticePage() {
  return (
    <CockpitShell showDraftBadge={false}>
      <main className={`dashboard-main membership-page ${routeAtmosphere.proof}`}>
        <nav className="dashboard-nav" aria-label="Public test data notice navigation">
          <Link href="/">Home</Link>
          <Link href="/bellows/recommendations">See the example</Link>
          <Link href="/signup">Create account</Link>
          <Link href="/dashboard/profile">Profile Builder</Link>
        </nav>

        <section className="tier2-page-header tier2-page-header--stack">
          <div className="tier2-page-header__copy membership-hero">
            <p className="eyebrow">Public Test Data Notice</p>
            <h1>What Werkles keeps—and what it does not.</h1>
            <p>
              The public test is meant to be useful without making you guess where your information goes. Here is the
              short version in plain language.
            </p>
          </div>
        </section>

        <section className="membership-grid" aria-label="Public test data facts">
          <article className="ops-card plan-card">
            <p className="plan-kicker">Your account</p>
            <h2>Saved to you</h2>
            <p>
              Your account and the profile details you choose to save are stored for your signed-in account.
            </p>
          </article>

          <article className="ops-card plan-card">
            <p className="plan-kicker">Your recommendation</p>
            <h2>Calculated, not kept</h2>
            <p>
              Your personal rules-based recommendation is computed from your saved profile. The result itself is not
              saved or forwarded.
            </p>
          </article>

          <article className="ops-card plan-card">
            <p className="plan-kicker">Closed for this test</p>
            <h2>No quiet handoffs</h2>
            <p>
              Anonymous intake submission, recommendation-result saving, and Identity or Plaid actions are closed
              during public testing.
            </p>
          </article>
        </section>

        <section className="ops-card membership-trust" aria-labelledby="privacyNextTitle">
          <div className="card-heading">
            <p>You choose the next step</p>
            <h2 id="privacyNextTitle">Look around first. Add a profile only when you are ready.</h2>
          </div>
          <p>
            You can read the public example without signing in. An account is needed before Werkles can use saved
            profile details for a personal result.
          </p>
          <div className="member-selected-surface__actions">
            <Link className="button button-dark" href="/bellows/recommendations">
              See the public example
            </Link>
            <Link className="button button-outline" href="/signup?next=%2Fbellows%2Frecommendations">
              Create account
            </Link>
          </div>
        </section>
      </main>
    </CockpitShell>
  );
}
