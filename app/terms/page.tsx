import Link from "next/link";

import { SiteHeader } from "@/components/foundry/site-header";
import { copy } from "@/lib/copy";

export const metadata = {
  title: "Terms",
  description: "The deal between you and Werkles, in plain language: what we provide, what we don't promise, and how membership works."
};

const sectionStyle = { marginTop: "2rem" } as const;

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="dashboard-main" style={{ maxWidth: "680px", margin: "0 auto", padding: "56px 22px" }}>
        <p className="eyebrow">Terms</p>
        <h1>The deal, in plain language.</h1>
        <p>
          Werkles refuses to fake certainty on the floor, and we won't fake it here. This is what you get, what
          we don't promise, and how the money works.
        </p>
        <p>
          <small>Last updated July 31, 2026 — draft pending Operator review.</small>
        </p>

        <section style={sectionStyle}>
          <h2>What Werkles is</h2>
          {/* No-ceiling rule (Operator, 2026-07-31): no "small business" framing
             anywhere — anything can be conceived and built here. */}
          <p>
            Werkles is decision support for people building businesses of any size and any ambition: help naming
            what your venture is actually missing, finding reachable people and resources, and checking facts
            before you rely on anyone. There is no ceiling in these terms — your venture, your ideas, and what
            you make of them are yours, at whatever scale you take them to. Werkles claims no ownership of your
            business.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>What Werkles does not promise</h2>
          <p>
            No guarantees of trust, verification outcomes, funding, legal clearance, partner quality, or business
            results. Proof clears the path — it does not make the decision for you, and it does not remove risk.
            Decisions you make with people you meet through Werkles are yours.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Your account</h2>
          <p>
            One person per account, real information, and you're responsible for what happens under your login.
            We can suspend accounts that lie on the floor, harass members, or game the proof layer — that
            protects everyone else's trust.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Membership and money</h2>
          <p>
            Starting is free. Foundry Dues are priced as shown on the <Link href="/pricing">pricing page</Link>{" "}
            and billed through Stripe. You can cancel anytime; access runs through the period you've paid for.
            Exact billing terms appear at checkout before you pay anything.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Verification limits</h2>
          <p>
            Checks run through named providers — Stripe Identity for identity, Plaid for funds, Twilio for phone
            when it connects — and the <Link href="/privacy">privacy page</Link> shows exactly what each one
            holds and what you'd see during a check. Werkles verification is not a consumer report, and Werkles
            is not a consumer reporting agency. Do not use Werkles to make employment, housing, or credit
            decisions. Consumer background checks are not offered.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Liability</h2>
          <p>
            To the extent the law allows, Werkles' liability to you is limited to what you've paid us in the
            twelve months before a claim. We provide the service as-is while the floor is being built.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Changes</h2>
          <p>
            If these terms change in a way that matters, we'll say so plainly on this page with a new date — not
            bury it. Start with the <Link href="/bellows/intake">Werkles questions</Link>.
          </p>
        </section>
      </main>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
