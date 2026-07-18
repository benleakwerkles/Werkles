"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isSignedInForDevPreview, shouldUseRuntimePreviewAuth } from "@/lib/dev-preview-auth";
import { clearDevPreviewSession, readDevPreviewSession, writeDevPreviewSession } from "@/lib/dev-preview-session";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type AuthState = "checking" | "signed-in" | "signed-out";

type MemberDashboardClientProps = {
  initialSignedIn?: boolean;
  initialEmail?: string | null;
};

function clearSupabaseBrowserStorage() {
  if (typeof window === "undefined") return;
  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key?.includes("supabase") || key?.startsWith("sb-")) {
        storage.removeItem(key);
      }
    }
  }
}

export function MemberDashboardClient({
  initialSignedIn = false,
  initialEmail = null
}: MemberDashboardClientProps) {
  const [authState, setAuthState] = useState<AuthState>(initialSignedIn ? "signed-in" : "checking");
  const [email, setEmail] = useState<string | null>(initialEmail);

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const preview = shouldUseRuntimePreviewAuth();

      if (preview) {
        const session = readDevPreviewSession();
        if (!session && initialSignedIn && initialEmail) {
          writeDevPreviewSession({
            userId: "dev-preview-user",
            email: initialEmail
          });
          if (!cancelled) {
            setEmail(initialEmail);
            setAuthState("signed-in");
          }
          return;
        }
        if (!session || !isSignedInForDevPreview()) {
          if (!cancelled) setAuthState("signed-out");
          window.location.replace("/login?next=/dashboard");
          return;
        }
        if (!cancelled) {
          setEmail(session.email);
          setAuthState("signed-in");
        }
        return;
      }

      try {
        const { data } = await getSupabaseBrowser().auth.getUser();
        if (!data.user) {
          if (!cancelled) setAuthState("signed-out");
          window.location.replace("/login?next=/dashboard");
          return;
        }
        if (!cancelled) {
          setEmail(data.user.email ?? null);
          setAuthState("signed-in");
        }
      } catch {
        if (!cancelled) setAuthState("signed-out");
        window.location.replace("/login?next=/dashboard");
      }
    }

    void checkAuth();

    return () => {
      cancelled = true;
    };
  }, [initialEmail, initialSignedIn]);

  async function logout() {
    clearDevPreviewSession();
    clearSupabaseBrowserStorage();
    try {
      await getSupabaseBrowser().auth.signOut({ scope: "global" });
    } catch {
      // Preview mode may not have Supabase env. Storage clearing above is the required local logout.
    }
    window.location.replace("/login?logged_out=1");
  }

  if (authState !== "signed-in") {
    return (
      <section className="member-dashboard member-dashboard--checking" aria-live="polite">
        <p className="eyebrow">Member dashboard</p>
        <h1>{authState === "checking" ? "Checking session..." : "Redirecting to login..."}</h1>
      </section>
    );
  }

  return (
    <section className="member-dashboard" aria-label="Member dashboard">
      <section className="ops-card" aria-label="Member floor">
        <div className="card-heading">
          <p>Member floor</p>
          <h2>Build the record before you chase the next surface.</h2>
        </div>
        <p>
          Profile, workshops, intros, and checks each do one job. Foundry Dues test checkout is wired — live keys and
          Crucible provider sessions stay gated.
        </p>
        <div className="member-selected-surface__actions">
          <Link className="button button-dark" href="/dashboard/profile">
            Update profile
          </Link>
          <Link className="button button-outline" href="/dashboard/blueprints">
            Open workshops
          </Link>
          <Link className="button button-outline" href="/dashboard/intros">
            Intros
          </Link>
          <Link className="button button-outline" href="/dashboard/crucible">
            Crucible checks
          </Link>
        </div>
      </section>

      <section className="ops-card member-works-now" aria-label="What works now">
        <div className="card-heading">
          <p>Honest status</p>
          <h2>What works now · what&apos;s paused</h2>
        </div>
        <div className="member-works-now__grid">
          <div>
            <h3>Works now (free + test billing)</h3>
            <ul>
              <li>Account, login, onboarding, and profile</li>
              <li>Member home, workshops, and intros queue</li>
              <li>Private rules recommendations from your saved profile, plus an example walkthrough</li>
              <li>Proof, pricing, and narrative entry paths</li>
              <li>Test-mode Foundry Dues checkout on /membership (Stripe test keys)</li>
              <li>Crucible Identity + Funds provider test on /dashboard/crucible (active members)</li>
            </ul>
            <div className="member-selected-surface__actions">
              <Link className="button button-dark" href="/dashboard/profile">
                Review profile
              </Link>
              <Link className="button button-outline" href="/bellows/recommendations">
                See recommendations
              </Link>
            </div>
          </div>
          <div>
            <h3>Paused (operator gates)</h3>
            <ul>
              <li>Live Stripe keys and live checkout go-live</li>
              <li>Phone, license, reference, employment checks — no API yet</li>
              <li>Background checks — FCRA / counsel blocked</li>
              <li>Push/merge to main without explicit Ben gate</li>
            </ul>
            <p className="muted">
              Crucible Identity + Funds provider test is open for active Foundry members. Other checks stay explicit
              placeholders.
            </p>
            <div className="member-selected-surface__actions">
              <Link className="button button-outline" href="/dashboard/crucible">
                Open Crucible
              </Link>
              <Link className="button button-outline" href="/proof">
                Inspect proof
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="member-next-move-card" aria-label="Your next move">
        <div className="member-next-move-card__copy">
          <p className="member-next-move-card__kicker">Your next move</p>
          <h2>Review your profile.</h2>
          <p>
            Make sure your goal, project details, and missing skills still describe the work you want to move.
          </p>
        </div>
        <dl className="member-next-move-card__facts">
          <div>
            <dt>Action</dt>
            <dd>Review or update your saved profile.</dd>
          </div>
          <div>
            <dt>Reason</dt>
            <dd>Your private recommendation uses the useful work signals already saved there.</dd>
          </div>
          <div>
            <dt>Expected outcome</dt>
            <dd>A profile ready to use for a private rules recommendation.</dd>
          </div>
        </dl>
        <Link className="button button-dark member-next-move-card__button" href="/dashboard/profile">
          Review profile
        </Link>
      </section>

      <section className="ops-card" aria-label="Member work queue">
        <div className="card-heading">
          <p>Work queue</p>
          <h2>Turn one messy need into a useful next step.</h2>
        </div>
        <p>
          Review the profile Werkles uses, then open your private recommendation. The closed intake remains available as
          a walkthrough of the questions, not a saved member workflow.
        </p>
        <div className="member-selected-surface__actions">
          <Link className="button button-dark" href="/dashboard/profile">
            Review profile
          </Link>
          <Link className="button button-outline" href="/bellows/recommendations">
            See recommendations
          </Link>
          <Link className="button button-outline" href="/bellows/recommendations/test-case-0">
            Walk through an example
          </Link>
          <Link className="button button-outline" href="/bellows/intake">
            Closed intake walkthrough
          </Link>
        </div>
      </section>

      <details className="member-dashboard-secondary">
        <summary>Secondary: what Werkles is, what you can do, and supporting links</summary>
        <div className="member-dashboard-secondary__body">
      <div className="member-dashboard__topbar">
        <div>
          <p className="eyebrow">Werkles member home</p>
          <h1>Find the right human help for real work.</h1>
          <p className="member-dashboard__subhead">
            Werkles helps a member turn a messy business need into a clear ask, a short list of
            useful next steps, and a more thoughtful search for people who can actually help.
          </p>
        </div>
        <form action="/api/auth-first/logout" method="post" onSubmit={(event) => {
          event.preventDefault();
          void logout();
        }}>
          <button className="button button-outline member-dashboard__logout" type="submit">
            Logout
          </button>
        </form>
      </div>
      <section className="member-first-screen" aria-label="Werkles member home">
        <article className="member-first-screen__answer member-first-screen__answer--where">
          <p className="member-first-screen__kicker">1. What is Werkles?</p>
          <h2>A guided workshop for getting unstuck.</h2>
          <p>
            Werkles helps people explain what they are building, what decision is in front of them,
            and what kind of person or artifact would move the work forward.
          </p>
        </article>
        <article className="member-first-screen__answer">
          <p className="member-first-screen__kicker">2. Why am I here?</p>
          <h2>You have work that needs a clearer next move.</h2>
          <p>
            You are here to turn a messy idea, decision, or business problem into something a
            useful person can understand and act on.
          </p>
        </article>
        <article className="member-first-screen__answer">
          <p className="member-first-screen__kicker">3. What can I do today?</p>
          <h2>Review your profile and compare a private recommendation.</h2>
          <p>
            Keep your goal and project details current, then see which paths the written rules do not rule out.
          </p>
        </article>
        <article className="member-first-screen__answer">
          <p className="member-first-screen__kicker">4. What should I click next?</p>
          <h2>Review your profile.</h2>
          <p>
            Profile is the first member path for a private recommendation. When it reflects the work, open the
            recommendation page and compare the result.
          </p>
        </article>
      </section>

      <section className="member-selected-surface" aria-label="First member action">
        <div className="member-selected-surface__copy">
          <p className="member-selected-surface__kicker">First useful thing</p>
          <h2>Start with the profile you control.</h2>
          <p>
            Give Werkles a goal, a little project context, and the skills you have or need. The rules can then return a
            private result without saving that result.
          </p>
        </div>
        <div className="member-selected-surface__offer" aria-label="Member artifact details">
          <dl>
            <div>
              <dt>Start here</dt>
              <dd>Review or update the goal and project details in your saved profile.</dd>
            </div>
            <div>
              <dt>Then</dt>
              <dd>Open recommendations and compare the rules-based paths still on the table.</dd>
            </div>
            <div>
              <dt>No guessing</dt>
              <dd>This page starts with the member’s work, the decision, and the next useful step.</dd>
            </div>
          </dl>
          <div className="member-selected-surface__actions">
            <Link className="button button-dark" href="/dashboard/profile">
              Review profile
            </Link>
            <Link className="button button-outline" href="/bellows/recommendations">
              See recommendations
            </Link>
          </div>
        </div>
      </section>

      <section className="member-next-five" aria-label="First five minutes">
        <div>
          <p className="member-next-five__kicker">First 5 minutes</p>
          <h2>Check the profile, then read the recommendation.</h2>
        </div>
        <p>
          Best next move: make sure your saved goal still fits, then compare the private rules result with your own
          judgment.
        </p>
      </section>

      <nav className="dashboard-nav member-dashboard__nav" aria-label="Dashboard navigation">
        <Link href="/">Home</Link>
        <Link href="/dashboard/profile">Profile</Link>
        <Link href="/bellows/recommendations">Recommendations</Link>
        <Link href="/bellows">Bellows</Link>
      </nav>
        </div>
      </details>
    </section>
  );
}
