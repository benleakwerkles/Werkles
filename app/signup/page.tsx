"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
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

export default function SignupPage() {
  const previewBlocked = isAuthStripeTestBlocked();
  const devPreview = isLocalRoutePreviewUnlocked();
  const [status, setStatus] = useState(
    previewBlocked
      ? copy.infraPreview.signup
      : devPreview
        ? copy.localPreview.signupIdle
        : copy.auth.signupIdle
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (previewBlocked) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");

    if (password !== confirm) {
      setStatus("Passwords do not match.");
      return;
    }

    if (shouldUseDevPreviewAuth()) {
      signInDevPreview(email);
      window.location.href = "/onboarding";
      return;
    }

    const { data, error } = await getSupabaseBrowser().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    if (data.session) {
      window.location.href = "/onboarding";
      return;
    }

    setStatus("Check your email, then come back to make the first weld.");
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
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required disabled={previewBlocked} />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              disabled={previewBlocked}
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
              disabled={previewBlocked}
            />
          </label>
          <button className="button button-dark" type="submit" disabled={previewBlocked}>
            {previewBlocked ? "Sign-up disabled (preview)" : copy.auth.signupCta}
          </button>
          <p className="status-line" role="status">{status}</p>
        </form>
        <Link className="button button-outline" href="/login">I already have an account</Link>
        </div>
      </section>
    </main>
  );
}
