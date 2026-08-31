"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { getClientAccessToken } from "@/lib/client-auth";
import { isSignedInForDevPreview, shouldUseRuntimePreviewAuth } from "@/lib/dev-preview-auth";
import { clearDevPreviewSession, readDevPreviewSession, writeDevPreviewSession } from "@/lib/dev-preview-session";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { firstSharedStepFromOperatingBrief } from "@/lib/werkle/operating-brief";
import {
  storedWerkleOperatingBriefFrom,
  storedWerkleOperatingBriefHref,
  WERKLE_OPERATING_BRIEF_DEVICE_KEY
} from "@/lib/werkle/operating-brief-device";

type AuthState = "checking" | "signed-in" | "signed-out";

type MemberDashboardClientProps = {
  initialSignedIn?: boolean;
  initialEmail?: string | null;
  initialHasIntake?: boolean;
};

function clearSupabaseBrowserStorage() {
  if (typeof window === "undefined") return;
  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (key?.includes("supabase") || key?.startsWith("sb-")) storage.removeItem(key);
    }
  }
}

export function MemberDashboardClient({
  initialSignedIn = false,
  initialEmail = null,
  initialHasIntake = false
}: MemberDashboardClientProps) {
  const [authState, setAuthState] = useState<AuthState>(initialSignedIn ? "signed-in" : "checking");
  const [email, setEmail] = useState<string | null>(initialEmail);
  const [hasIntake, setHasIntake] = useState(initialHasIntake);
  const [savedWerkle, setSavedWerkle] = useState<null | { href: string; step: string | null }>(null);

  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      if (shouldUseRuntimePreviewAuth()) {
        const session = readDevPreviewSession();
        if (!session && initialSignedIn && initialEmail) {
          writeDevPreviewSession({ userId: "dev-preview-user", email: initialEmail });
          if (!cancelled) { setEmail(initialEmail); setAuthState("signed-in"); }
          return;
        }
        if (!session || !isSignedInForDevPreview()) {
          if (!cancelled) setAuthState("signed-out");
          window.location.replace("/login?next=/dashboard");
          return;
        }
        if (!cancelled) { setEmail(session.email); setAuthState("signed-in"); }
        return;
      }

      try {
        const { data } = await getSupabaseBrowser().auth.getUser();
        if (!data.user) {
          if (!cancelled) setAuthState("signed-out");
          window.location.replace("/login?next=/dashboard");
          return;
        }
        if (!cancelled) { setEmail(data.user.email ?? null); setAuthState("signed-in"); }
      } catch {
        if (!cancelled) setAuthState("signed-out");
        window.location.replace("/login?next=/dashboard");
      }
    }
    void checkAuth();
    return () => { cancelled = true; };
  }, [initialEmail, initialSignedIn]);

  useEffect(() => {
    if (authState !== "signed-in") return;
    let active = true;
    void (async () => {
      const token = await getClientAccessToken();
      if (!token || token === "dev-preview-token") return;
      const response = await fetch("/api/bellows/workshop/current", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (!response.ok || !active) return;
      const result = await response.json().catch(() => ({}));
      if (active && typeof result?.state?.hasIntake === "boolean") setHasIntake(result.state.hasIntake);
    })().catch(() => undefined);
    return () => { active = false; };
  }, [authState]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WERKLE_OPERATING_BRIEF_DEVICE_KEY);
      if (!raw) return;
      const stored = storedWerkleOperatingBriefFrom(JSON.parse(raw));
      if (!stored) return;
      setSavedWerkle({
        href: storedWerkleOperatingBriefHref(stored),
        step: firstSharedStepFromOperatingBrief(stored.brief)?.text ?? null
      });
    } catch {
      setSavedWerkle(null);
    }
  }, []);

  async function logout() {
    clearDevPreviewSession();
    clearSupabaseBrowserStorage();
    try { await getSupabaseBrowser().auth.signOut({ scope: "global" }); } catch { /* Preview may have no Supabase env. */ }
    window.location.replace("/login?logged_out=1");
  }

  if (authState !== "signed-in") {
    return <section className="member-dashboard member-dashboard--checking" aria-live="polite"><p className="eyebrow">Member home</p><h1>{authState === "checking" ? "Checking session..." : "Redirecting to login..."}</h1></section>;
  }

  return (
    <section className="member-dashboard" aria-label="Member home">
      <div className="member-dashboard__topbar">
        <div>
          <p className="eyebrow">Werkles member home</p>
          <h1>Welcome back.</h1>
          <p className="member-dashboard__subhead">{email ? `Signed in as ${email}. ` : ""}Pick up the work, the learning, or the people search.</p>
        </div>
        <form action="/api/auth-first/logout" method="post" onSubmit={(event) => { event.preventDefault(); void logout(); }}>
          <button className="button button-outline member-dashboard__logout" type="submit">Log out</button>
        </form>
      </div>

      <section className="member-next-move-card" aria-label="Your next move">
        <div className="member-next-move-card__copy">
          <p className="member-next-move-card__kicker">Your next move</p>
          <h2>{hasIntake ? "Your Intake is here. Keep moving." : "Start with one real piece of work."}</h2>
          <p>{hasIntake
            ? "Review the ideas Werkles built from it, continue a Bellows draft, or see who may fit the work."
            : "Tell Werkles what you are trying to make happen and what is getting in the way."}</p>
        </div>
        <div className="member-selected-surface__actions">
          {hasIntake ? (
            <>
              <Link className="button button-dark" href="/bellows/recommendations">Open Recommendations</Link>
              <Link className="button button-outline" href="/bellows/personal">Open My Bellows</Link>
              <Link className="button button-outline" href="/dashboard/intros">Open Match Deck</Link>
              <Link className="button button-outline" href="/bellows/intake">Review Intake</Link>
            </>
          ) : <Link className="button button-dark" href="/bellows/intake">Start Intake</Link>}
        </div>
      </section>

      {savedWerkle ? (
        <section className="member-dashboard__werkle-resume" aria-labelledby="member-werkle-resume-title">
          <div>
            <p className="eyebrow">Shared work in progress</p>
            <h2 id="member-werkle-resume-title">Your practice Werkle has a way back in.</h2>
            <p>{savedWerkle.step ?? "A Werkle Operating Brief is saved on this device."}</p>
            <small>Saved on this device, not to your Werkles account. Nothing was sent to another person.</small>
          </div>
          <Link className="button button-dark" href={savedWerkle.href}>Continue This Werkle</Link>
        </section>
      ) : null}

      <figure className="member-dashboard__human-break">
        <Image
          src="/assets/draft/people-v1/people-partners-clipboard.png"
          alt="Two business partners reviewing a checklist together in their shop"
          width={1536}
          height={1024}
          sizes="(max-width: 900px) 100vw, 900px"
        />
        <figcaption>The point is not another dashboard. It is a clearer conversation around real work.</figcaption>
      </figure>

      <section className="ops-card member-room-map" aria-label="Your Werkles rooms">
        <div className="card-heading"><p>Your rooms</p><h2>The same four doors stay with you.</h2></div>
        <div className="member-room-map__grid">
          <Link href="/dashboard/blueprints"><span>01</span><strong>My Work</strong><small>Shape the plan and return to the next useful move.</small></Link>
          <Link href="/dashboard/intros"><span>02</span><strong>Match Deck</strong><small>Compare people when another person could help.</small></Link>
          <Link href="/bellows/personal"><span>03</span><strong>Bellows</strong><small>Learn what this work needs, then make something usable.</small></Link>
          <Link href="/dashboard/profile"><span>04</span><strong>About Me</strong><small>Correct your profile and choose which claims need proof.</small></Link>
        </div>
      </section>

      <details className="ops-card member-works-now member-works-now--disclosure">
        <summary><span>Service readiness</span><strong>See what works today and what is still being connected.</strong></summary>
        <div className="member-works-now__grid">
          <div><h3>Available now</h3><ul><li>Intake readback, Workshop, and Recommendations</li><li>Personal Bellows lessons and device drafts</li><li>Practice Match Deck and Werkle formation</li><li>Profile and member navigation</li></ul></div>
          <div><h3>Still being prepared</h3><ul><li>Paid checkout where Stripe setup is incomplete</li><li>Live phone, identity, financial, and background checks</li><li>Real introductions and shared member workspaces</li></ul><p className="muted">A preparation screen or sandbox demonstration is never labeled as a completed check.</p></div>
        </div>
      </details>
    </section>
  );
}
