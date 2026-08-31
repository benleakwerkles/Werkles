import Link from "next/link";

import { SiteHeader } from "@/components/foundry/site-header";
import { copy } from "@/lib/copy";

export const metadata = {
  title: "Privacy",
  description: "What Werkles collects, who holds it by name, and what verification actually looks like. Plain language, no fog."
};

const sectionStyle = { marginTop: "2rem" } as const;

/* Named providers (Ben, privacy review 2026-07-31: "tell me which specific
   apps that I already trust are going to be seeing and holding my private
   information"). Statuses mirror the membership page's verifier list —
   nothing claimed live that isn't. */
const dataHolders = [
  {
    name: "Supabase",
    role: "Account",
    holds: "Your email, your password (stored only as a one-way hash — unreadable even to us), and your profile",
    werklesSees: "Your email and profile. Never your password.",
    status: "Live today"
  },
  {
    name: "Vercel",
    role: "Hosting",
    holds: "Runs the website itself",
    werklesSees: "Standard hosting logs",
    status: "Live today"
  },
  {
    name: "Stripe",
    role: "Payments",
    holds: "Your card number when you pay dues",
    werklesSees: "Paid / not paid. Never the card.",
    status: "Ready — payments not yet live"
  },
  {
    name: "Stripe Identity",
    role: "Identity",
    holds: "Your ID photo and selfie during an identity check",
    werklesSees: "Pass / fail. Never the photos.",
    status: "Test integration — not yet live"
  },
  {
    name: "Plaid",
    role: "Funds",
    holds: "Your bank sign-in during a funds check",
    werklesSees: "A yes/no answer. Never your login, never your balance.",
    status: "Sandbox — not yet live"
  },
  {
    name: "Twilio",
    role: "Phone",
    holds: "Your phone number, to text a confirmation code",
    werklesSees: "Confirmed / not confirmed",
    status: "Planned — not connected yet"
  }
] as const;

const verificationFlows = [
  {
    id: "identity",
    title: "An identity check — what you'd actually see",
    steps: [
      "You choose to verify — nothing starts without you.",
      "A Stripe Identity window opens. You photograph your ID and take a selfie there — inside Stripe's window, not ours.",
      "Stripe compares them and tells us pass or fail. The photos stay with Stripe under their retention rules.",
      "Your profile shows \u201cIdentity verified\u201d — that's all anyone on Werkles ever sees."
    ]
  },
  {
    id: "funds",
    title: "A funds check — what you'd actually see",
    steps: [
      "Someone asks: \u201ccan you show at least $25k?\u201d You decide whether to answer.",
      "A Plaid window opens and you sign in to your own bank — inside Plaid, not Werkles.",
      /* Locke audit 2026-07-31: current sandbox wiring requests Plaid Assets
         (broader consent scope than yes/no). Wording below stays honest until
         the product scope is narrowed — engineering decision on Ben's plate. */
      "Plaid confirms whether the threshold is met — Werkles is designed to keep only that answer, never your login. This flow is in sandbox today; before it goes live we will publish exactly what Plaid shares.",
      "The answer is designed to expire after 30 days. Nothing about your account stays on Werkles."
    ]
  },
  {
    id: "phone",
    title: "A phone check — what you'd actually see",
    steps: [
      "You enter your number; Twilio texts you a six-digit code.",
      "You type the code back. That's the whole ceremony.",
      "Werkles records \u201cphone confirmed\u201d and nothing else."
    ]
  }
] as const;

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="dashboard-main privacy-page" style={{ maxWidth: "760px", margin: "0 auto", padding: "56px 22px" }}>
        <p className="eyebrow">Privacy</p>
        <h1>Your information, in plain language.</h1>
        <p>
          Werkles exists to help you verify facts before you rely on anyone. That only works if you can verify
          what we do with your information too. No fog here either.
        </p>
        <p>
          <small>Last updated July 31, 2026 — draft pending Operator review.</small>
        </p>

        <section style={sectionStyle}>
          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Account basics.</strong> Your email address and a password, handled by our authentication
              provider. We never see or store your password in readable form.
            </li>
            <li>
              <strong>Profile facts you choose to add.</strong> Name, trade, where you work, your goals and
              timeline. You decide how much of your story to tell.
            </li>
            <li>
              <strong>What you write in intake.</strong> When you describe what's stuck, that text is used to
              build your recommendation — that's its whole job.
            </li>
            <li>
              <strong>Interest-list signups.</strong> Email and lane from the Foundry interest form. Follow-up is
              manual; no automated marketing emails are sent.
            </li>
          </ul>
        </section>

        <section style={sectionStyle} aria-labelledby="privacy-holders-title">
          <h2 id="privacy-holders-title">Who holds what — by name</h2>
          <p>
            No mystery vendors. These are the companies that see or hold your information, what each one keeps,
            and what Werkles itself ever learns.
          </p>
          {/* Ender 2a/2b: the card styling lives on __list (not the section
             class), and __purpose is a one-word micro-label — full sentences
             through it render as tracked-out uppercase teal. */}
          <ul className="membership-verifiers__list privacy-holders" aria-label="Data holders by name">
            {dataHolders.map((holder) => (
              <li key={holder.name}>
                <span className="membership-verifiers__name">{holder.name}</span>
                <span className="membership-verifiers__purpose">{holder.role}</span>
                <span className="privacy-holders__holds">Holds: {holder.holds}</span>
                <span className="privacy-holders__sees">Werkles sees: {holder.werklesSees}</span>
                <span className="membership-verifiers__status">{holder.status}</span>
              </li>
            ))}
          </ul>
        </section>

        <section style={sectionStyle} aria-labelledby="privacy-flows-title">
          <h2 id="privacy-flows-title">What verification actually looks like</h2>
          <p>
            Not a description — the steps themselves, so nothing surprises you when a check begins. Every check
            is opt-in, every check happens inside the provider's own window, and Werkles only ever receives the
            answer.
          </p>
          <div className="membership-floor__grid privacy-flows">
            {verificationFlows.map((flow) => (
              <article className="membership-floor__surface" key={flow.id}>
                <h3>{flow.title}</h3>
                <ol className="privacy-flow-steps">
                  {flow.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <h2>How you know other members are real</h2>
          <p>
            Werkles is not a feed you scroll past bots on. The same checks that protect your information protect
            you from everyone else — and the rule applies to us too.
          </p>
          <p>
            <strong>The rule.</strong> A &ldquo;verified&rdquo; badge appears only when a real check ran through
            one of the providers named above, and you can always see which checks ran before you rely on anyone.
            No check, no badge, no exceptions.
          </p>
          <p>
            <strong>Today.</strong> Verification is in preview. No badge anywhere on Werkles yet reflects a live
            check — when that changes, this page changes first.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>What we use it for</h2>
          <p>
            Running Werkles: naming what your business is missing, showing you reachable help, and keeping your
            Workshop. Nothing else. We do not sell your information. We do not run advertising networks on your
            data.
          </p>
        </section>

        <section id="matching-boundary" style={sectionStyle} aria-labelledby="matching-boundary-title">
          <h2 id="matching-boundary-title">What matching remembers—and what it does not watch</h2>
          <p>
            Match order comes from information you deliberately give Werkles, not a hidden personality score. You
            can change the result by correcting or resubmitting Intake, or by changing your city, state, or work
            style.
          </p>
          <div className="privacy-matching-boundary">
            <article>
              <h3>Used for matching</h3>
              <ul>
                <li>Your latest submitted Intake: what you are building, what is stuck, what you can offer, and what kind of help you want.</li>
                <li>Your profile city, state, and work-style preference when you choose to add them.</li>
                <li>Corrections and choices you deliberately submit for the purpose of improving matches.</li>
              </ul>
            </article>
            <article>
              <h3>Not used to rank people</h3>
              <ul>
                <li>Your bank balance, net worth, or how far you are above a financial eligibility threshold.</li>
                <li>How long you stare at a profile, scrolling, hovering, or ordinary card clicks.</li>
                <li>Browsing outside Werkles, purchased behavioral profiles, or ad-network data.</li>
                <li>Guessed protected or sensitive traits, private messages or calls you did not submit for matching, or precise location inferred from your IP address.</li>
              </ul>
            </article>
          </div>
          <p>
            Practice conversations in the current Match Deck are temporary and do not retrain or reorder your
            matches. If Werkles later adds controls such as “not a fit” or “show me more like this,” the site must
            tell you what will be saved before you use them and let you correct or delete that information.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Verification data, before it goes live</h2>
          <p>
            Proof surfaces on Werkles are currently previews; the provider statuses above say exactly what is and
            isn't connected today. We will update this page before any live check runs. Werkles does not offer
            consumer background checks, and will not until that path is approved by counsel.
          </p>
        </section>

        <section style={sectionStyle}>
          <h2>Your choices</h2>
          <p>
            You can update your profile anytime. You can ask us to export or delete your account data — reach us
            through the <Link href="/bellows/intake">Werkles questions</Link> and we will handle it manually while
            the floor is small.
          </p>
        </section>
      </main>
      <footer className="site-footer">
        <p>{copy.disclaimer}</p>
      </footer>
    </>
  );
}
