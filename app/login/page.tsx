"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteUnlockBanner } from "@/components/foundry/route-unlock-banner";
import { WorkshopGreeter } from "@/components/foundry/workshop-greeter";
import { NarrativeJourneyRail } from "@/components/narrative/narrative-journey-rail";
import { routeAtmosphere } from "@/lib/workshop-facets";
import { copy } from "@/lib/copy";
import { signInDevPreview } from "@/lib/dev-preview-session";
import { shouldUseRuntimePreviewAuth } from "@/lib/dev-preview-auth";
import { isAuthStripeTestBlocked } from "@/lib/app-infra-preview";
import { isLocalRoutePreviewUnlocked, isRuntimeRoutePreviewUnlocked } from "@/lib/local-route-preview";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { NARRATIVE_V1_WIRE_ENABLED, narrativeV1Assets } from "@/lib/homepage-narrative-imagery";
import { safeMemberReturnPath } from "@/lib/safe-member-return";

export default function LoginPage() {
  const router = useRouter();
  const previewBlocked = isAuthStripeTestBlocked();
  const [previewUnlocked, setPreviewUnlocked] = useState(isLocalRoutePreviewUnlocked());
  const [nextPath, setNextPath] = useState("/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(
    previewBlocked
      ? copy.infraPreview.login
      : previewUnlocked
        ? copy.localPreview.loginIdle
        : copy.auth.loginIdle
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const runtimePreview = isRuntimeRoutePreviewUnlocked();
    setPreviewUnlocked(runtimePreview);
    setNextPath(safeMemberReturnPath(params.get("next")));

    if (params.get("logged_out") === "1") {
      setStatus("Logged out. Use the test account to enter again.");
      return;
    }

    if (params.get("auth_error")) {
      setStatus("Enter the test account username/email and password.");
      return;
    }

    setStatus(
      previewBlocked
        ? copy.infraPreview.login
        : runtimePreview
          ? copy.localPreview.loginIdle
          : copy.auth.loginIdle
    );
  }, [previewBlocked]);

  async function login() {
    if (previewBlocked) return;
    if (!email.trim() || !password.trim()) {
      setStatus("Enter a username/email and password.");
      return;
    }

    if (shouldUseRuntimePreviewAuth()) {
      signInDevPreview(email);
      router.replace(nextPath);
      return;
    }

    try {
      const { error } = await getSupabaseBrowser().auth.signInWithPassword({ email, password });
      if (error) {
        setStatus(error.message);
        return;
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Login failed before the gate opened.");
      return;
    }

    router.replace(nextPath);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await login();
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
          <form className="form-stack" action="/api/auth-first/dev-preview-login" method="post" onSubmit={handleSubmit}>
            <input type="hidden" name="next" value={nextPath} />
            <label className="field">
              <span>Email or username</span>
              <input
                name="email"
                type="text"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={previewBlocked}
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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

          <section className="ops-card auth-doorway" aria-label="New here">
            <div className="card-heading">
              <p>New here</p>
              <h2>Start free before you log in.</h2>
            </div>
            <p>
              You do not need an account to inspect proof or compare pricing. Create one when you are ready to save
              profile work and use the member floor.
            </p>
            <div className="trust-state-strip" aria-label="Entry paths">
              <span>Free signup</span>
              <span>Proof before trust</span>
              <span>Pay when useful</span>
            </div>
            <div className="member-selected-surface__actions">
              <Link className="button button-dark" href="/signup">
                Create account
              </Link>
              <Link className="button button-outline" href="/proof">
                Inspect proof
              </Link>
              <Link className="button button-outline" href="/pricing">
                Compare pricing
              </Link>
            </div>
          </section>

          <section className="ops-card auth-doorway" aria-label="Email confirmation help">
            <div className="card-heading">
              <p>Email stuck?</p>
              <h2>Confirmation links expire. Login may still work.</h2>
            </div>
            <p>
              If the confirm email never arrived or the link expired, try logging in anyway — your account may already
              be active. The auth callback page shows what Supabase returned without exposing secrets.
            </p>
            <div className="member-selected-surface__actions">
              <Link className="button button-outline" href="/auth/callback">
                Open auth callback
              </Link>
              <Link className="button button-outline" href="/signup">
                Create a new account
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
