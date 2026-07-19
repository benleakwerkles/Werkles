"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteUnlockBanner } from "@/components/foundry/route-unlock-banner";
import { PublicTrustFooter } from "@/components/foundry/public-trust-footer";
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
import { publicAuthMessage } from "@/lib/public-auth-message";
import { safeMemberReturnPath } from "@/lib/safe-member-return";

export default function LoginPage() {
  const router = useRouter();
  const previewBlocked = isAuthStripeTestBlocked();
  const authAttemptRef = useRef(false);
  const [previewUnlocked, setPreviewUnlocked] = useState(isLocalRoutePreviewUnlocked());
  const [nextPath, setNextPath] = useState("/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
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

  function unlockAuthAttempt() {
    authAttemptRef.current = false;
    setBusy(false);
  }

  async function login() {
    if (previewBlocked) return;
    if (!email.trim() || !password.trim()) {
      setStatus("Enter a username/email and password.");
      return;
    }
    if (authAttemptRef.current) return;

    authAttemptRef.current = true;
    setBusy(true);
    const safeNextPath = safeMemberReturnPath(new URLSearchParams(window.location.search).get("next"));

    if (shouldUseRuntimePreviewAuth()) {
      try {
        signInDevPreview(email);
        router.replace(safeNextPath);
      } catch {
        setStatus(publicAuthMessage({ context: "login", code: "service_unavailable" }));
        unlockAuthAttempt();
      }
      return;
    }

    try {
      const { error } = await getSupabaseBrowser().auth.signInWithPassword({ email, password });
      if (error) {
        setStatus(publicAuthMessage({ context: "login", code: error.code, status: error.status }));
        unlockAuthAttempt();
        return;
      }
    } catch {
      setStatus(publicAuthMessage({ context: "login", code: "service_unavailable" }));
      unlockAuthAttempt();
      return;
    }

    router.replace(safeNextPath);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await login();
  }

  const signupHref = `/signup?next=${encodeURIComponent(nextPath)}`;

  return (
    <>
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
          <form
            className="form-stack"
            action="/api/auth-first/dev-preview-login"
            method="post"
            aria-busy={busy}
            onSubmit={handleSubmit}
          >
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
                disabled={previewBlocked || busy}
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
                disabled={previewBlocked || busy}
              />
            </label>
            <button className="button button-dark" type="submit" disabled={previewBlocked || busy}>
              {previewBlocked ? "Sign-in disabled (preview)" : busy ? "Logging in..." : "Log in"}
            </button>
            <p className="status-line" role="status">{status}</p>
          </form>
          <Link className="button button-outline" href={signupHref}>
            Create an account
          </Link>

          <details className="auth-help">
            <summary>Need help?</summary>
            <p>A confirmation link can expire. If you already started, try logging in with the same details.</p>
          </details>
        </div>
      </section>
    </main>
    <PublicTrustFooter />
    </>
  );
}
