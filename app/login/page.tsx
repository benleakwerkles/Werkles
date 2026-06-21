"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { RouteUnlockBanner } from "@/components/foundry/route-unlock-banner";
import { WorkshopGreeter } from "@/components/foundry/workshop-greeter";
import { NarrativeJourneyRail } from "@/components/narrative/narrative-journey-rail";
import { routeAtmosphere } from "@/lib/workshop-facets";
import { copy } from "@/lib/copy";
import { signInDevPreview } from "@/lib/dev-preview-session";
import { shouldUseDevPreviewAuth } from "@/lib/dev-preview-auth";
import { isAuthStripeTestBlocked } from "@/lib/app-infra-preview";
import { isLocalRoutePreviewUnlocked } from "@/lib/local-route-preview";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { NARRATIVE_V1_WIRE_ENABLED, narrativeV1Assets } from "@/lib/homepage-narrative-imagery";

export default function LoginPage() {
  const previewBlocked = isAuthStripeTestBlocked();
  const devPreview = isLocalRoutePreviewUnlocked();
  const [status, setStatus] = useState(
    previewBlocked
      ? copy.infraPreview.login
      : devPreview
        ? copy.localPreview.loginIdle
        : copy.auth.loginIdle
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (previewBlocked) return;

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    if (shouldUseDevPreviewAuth()) {
      signInDevPreview(email);
      window.location.href = "/onboarding";
      return;
    }

    const { error } = await getSupabaseBrowser().auth.signInWithPassword({ email, password });
    if (error) {
      setStatus(error.message);
      return;
    }

    window.location.href = "/onboarding";
  }

  return (
    <main className={`auth-shell auth-shell--foundry ${routeAtmosphere.auth}`}>
      <NarrativeJourneyRail currentSlug="/proof" />
      <section className="auth-panel auth-panel--split">
        {NARRATIVE_V1_WIRE_ENABLED ? (
          <figure className="auth-panel__spark-photo">
            <Image
              src={narrativeV1Assets.foundryB02FinishedProduct}
              alt="Foundry proof — finished work on the bench"
              width={640}
              height={360}
              className="auth-panel__spark-image"
            />
            <figcaption>Act IV — Foundry</figcaption>
          </figure>
        ) : null}
        <div className="auth-panel__form-col">
          <WorkshopGreeter className="auth-panel-greeter" />
          <RouteUnlockBanner blockedDetail={copy.infraPreview.login} />
          <p className="eyebrow">{copy.brand}</p>
          <h1>{copy.auth.loginTitle}</h1>
          <p>{copy.auth.loginSubhead}</p>
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
                autoComplete="current-password"
                required
                disabled={previewBlocked}
              />
            </label>
            <button className="button button-dark" type="submit" disabled={previewBlocked}>
              {previewBlocked ? "Sign-in disabled (preview)" : "Log in"}
            </button>
            <p className="status-line" role="status">{status}</p>
          </form>
          <Link className="button button-outline" href="/signup">
            Create an account
          </Link>
        </div>
      </section>
    </main>
  );
}
