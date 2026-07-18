"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { RouteUnlockBanner } from "@/components/foundry/route-unlock-banner";
import { routeAtmosphere } from "@/lib/workshop-facets";
import { copy } from "@/lib/copy";
import { isAuthStripeTestBlocked } from "@/lib/app-infra-preview";
import { signInDevPreview } from "@/lib/dev-preview-session";
import { shouldUseDevPreviewAuth } from "@/lib/dev-preview-auth";
import { isLocalRoutePreviewUnlocked } from "@/lib/local-route-preview";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { NARRATIVE_V1_WIRE_ENABLED, narrativeV1Assets } from "@/lib/homepage-narrative-imagery";
import { NarrativeJourneyRail } from "@/components/narrative/narrative-journey-rail";
import { publicAuthMessage } from "@/lib/public-auth-message";
import { safeMemberReturnPath } from "@/lib/safe-member-return";

export default function SignupPage() {
  const previewBlocked = isAuthStripeTestBlocked();
  const devPreview = isLocalRoutePreviewUnlocked();
  const authAttemptRef = useRef(false);
  const [nextPath, setNextPath] = useState("/dashboard");
  const [busy, setBusy] = useState(false);
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [status, setStatus] = useState(
    previewBlocked
      ? copy.infraPreview.signup
      : devPreview
        ? copy.localPreview.signupIdle
        : copy.auth.signupIdle
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(safeMemberReturnPath(params.get("next")));
  }, []);

  function unlockAuthAttempt() {
    authAttemptRef.current = false;
    setBusy(false);
    setConfirmationPending(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (previewBlocked) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    const safeNextPath = safeMemberReturnPath(new URLSearchParams(window.location.search).get("next"));
    const onboardingHref = `/onboarding?next=${encodeURIComponent(safeNextPath)}`;

    if (password !== confirm) {
      setStatus("Passwords do not match.");
      return;
    }
    if (authAttemptRef.current) return;

    authAttemptRef.current = true;
    setBusy(true);

    try {
      if (shouldUseDevPreviewAuth()) {
        signInDevPreview(email);
        window.location.href = onboardingHref;
        return;
      }

      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", safeNextPath);

      const { data, error } = await getSupabaseBrowser().auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callbackUrl.toString()
        }
      });

      if (error) {
        setStatus(publicAuthMessage({ context: "signup", code: error.code, status: error.status }));
        unlockAuthAttempt();
        return;
      }

      if (data.user && !data.session) {
        const identities = data.user.identities ?? [];
        if (identities.length === 0) {
          setStatus(publicAuthMessage({ context: "signup", code: "possible_existing_account" }));
          unlockAuthAttempt();
          return;
        }
      }

      if (data.session) {
        window.location.href = onboardingHref;
        return;
      }

      setConfirmationPending(true);
      setStatus("Check your email, then come back to start onboarding.");
    } catch {
      setStatus(publicAuthMessage({ context: "signup", code: "service_unavailable" }));
      unlockAuthAttempt();
    }
  }

  return (
    <main className={`auth-shell auth-shell--spark ${routeAtmosphere.auth}`}>
      <NarrativeJourneyRail currentSlug="/spark" />
      <section className="auth-panel auth-panel--split">
        {NARRATIVE_V1_WIRE_ENABLED ? (
          <figure className="auth-panel__spark-photo">
            <Image
              src={narrativeV1Assets.sparkC01KitchenTable}
              alt="Spark beat — thought in progress at the kitchen table"
              width={640}
              height={360}
              className="auth-panel__spark-image"
            />
            <figcaption>Act I — Spark</figcaption>
          </figure>
        ) : null}
        <div className="auth-panel__form-col">
        <RouteUnlockBanner blockedDetail={copy.infraPreview.signup} />
        <p className="eyebrow">{copy.brand}</p>
        <h1>{copy.auth.signupTitle}</h1>
        <p>{copy.auth.signupSubhead}</p>
        <form className="form-stack" aria-busy={busy && !confirmationPending} onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required disabled={previewBlocked || busy} />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={previewBlocked || busy}
            />
          </label>
          <label className="field">
            <span>Confirm password</span>
            <input
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={previewBlocked || busy}
            />
          </label>
          <button className="button button-dark" type="submit" disabled={previewBlocked || busy}>
            {previewBlocked
              ? "Sign-up disabled (preview)"
              : confirmationPending
                ? "Check your email"
                : busy
                  ? "Creating account..."
                  : copy.auth.signupCta}
          </button>
          <p className="status-line" role="status">{status}</p>
        </form>
        <Link className="button button-outline" href={`/login?next=${encodeURIComponent(nextPath)}`}>
          I already have an account
        </Link>

          <details className="auth-help">
            <summary>What happens next?</summary>
            <p>Confirm your email, then finish onboarding. Foundry Dues stay optional.</p>
          </details>
        </div>
      </section>
    </main>
  );
}
