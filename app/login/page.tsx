"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/foundry/site-header";
import { routeAtmosphere } from "@/lib/workshop-facets";
import { copy } from "@/lib/copy";
import { isAuthStripeTestBlocked } from "@/lib/app-infra-preview";
import { localAuthPreviewTruth } from "@/lib/local-auth-preview-truth";
import { isLocalRoutePreviewUnlocked, isRuntimeRoutePreviewUnlocked } from "@/lib/local-route-preview";
import { getSupabaseBrowser, hasSupabaseBrowserConfig } from "@/lib/supabase/client";

function safeLocalNextPath(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/dashboard";
  }

  try {
    const localOrigin = "https://werkles.local";
    const target = new URL(value, localOrigin);
    return target.origin === localOrigin
      ? `${target.pathname}${target.search}${target.hash}`
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
}

function returnDestinationLabel(path: string) {
  if (path.startsWith("/dashboard/blueprints")) return "your Workshop";
  if (path.startsWith("/bellows/recommendations")) return "your recommendations";
  if (path.startsWith("/dashboard/intros")) return "your introductions";
  if (path.startsWith("/dashboard/profile")) return "your profile";
  if (path.startsWith("/dashboard/crucible")) return "your proof checks";
  return "your member home";
}

export default function LoginPage() {
  const router = useRouter();
  const previewBlocked = isAuthStripeTestBlocked();
  const authConfigured = hasSupabaseBrowserConfig();
  const localPreviewAvailable = isLocalRoutePreviewUnlocked();
  const [previewUnlocked, setPreviewUnlocked] = useState(false);
  const [nextPath, setNextPath] = useState("/dashboard");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(
    previewBlocked
      ? copy.infraPreview.login
      : authConfigured
        ? copy.auth.loginIdle
        : "Account sign-in is not connected here yet. Your last saved Intake is still available below."
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const runtimePreview = params.get("walkthrough") === "1" && isRuntimeRoutePreviewUnlocked();
    setPreviewUnlocked(runtimePreview);
    setNextPath(safeLocalNextPath(params.get("next")));

    if (params.get("logged_out") === "1") {
      setStatus("You're logged out. Sign back in whenever you're ready.");
      return;
    }

    if (params.get("auth_error")) {
      setStatus("That sign-in didn't go through. Check your email and password and try again.");
      return;
    }

    setStatus(
      previewBlocked
        ? copy.infraPreview.login
        : runtimePreview
          ? localAuthPreviewTruth.login
          : authConfigured
            ? copy.auth.loginIdle
            : "Account sign-in is not connected here yet. Your last saved Intake is still available below."
    );
  }, [authConfigured, previewBlocked]);

  async function login() {
    if (previewBlocked) return;
    if (!email.trim() || !password.trim()) {
      setStatus("Enter a username/email and password.");
      return;
    }
    if (!authConfigured) {
      setPassword("");
      setStatus(
        "Your password was not rejected—it was not sent or checked because account sign-in is not connected here. Open your last saved Intake below to continue."
      );
      return;
    }

    try {
      const supabase = getSupabaseBrowser();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus(error.message);
        return;
      }
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        setStatus("Werkles signed in, but could not bind your saved work. Please try again.");
        return;
      }
      const sync = await fetch("/api/auth-first/sync-bellows-owner", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!sync.ok) {
        await supabase.auth.signOut();
        setStatus("Werkles could not reconnect your saved Intake, so it did not open the member area.");
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

  const destinationLabel = returnDestinationLabel(nextPath);
  const useLocalTestAccount = previewUnlocked || (!authConfigured && localPreviewAvailable);

  return (
    <>
      <SiteHeader />
      <main className={`auth-shell auth-shell--return ${routeAtmosphere.auth}`}>
        <section className="login-return" aria-labelledby="login-return-title">
          <header className="login-return__intro">
            <div className="login-return__intro-copy">
              <p className="eyebrow">Welcome back</p>
              <h1 id="login-return-title">Pick up where you left off.</h1>
              <p>Sign in once. Werkles returns you to your work, your people, and the next ideas worth checking.</p>
            </div>
            <figure className="login-return__human">
              <Image
                src="/assets/draft/people-v1/people-bellows-learning.jpg"
                alt="Business owner reviewing notes beside a laptop"
                width={1536}
                height={1024}
                sizes="(max-width: 760px) 100vw, 42vw"
                priority
              />
              <figcaption>Real work has somewhere to come back to.</figcaption>
            </figure>
          </header>

          <div className="login-return__grid">
            <section className="auth-panel login-return__card" aria-labelledby="login-card-title">
              <div className="auth-panel__form-col">
                <p className="eyebrow">Sign in</p>
                <h2 id="login-card-title">Open {destinationLabel}.</h2>
                <p>Your saved work should be waiting where you left it.</p>
                {useLocalTestAccount ? (
                  <form className="form-stack" action="/api/auth-first/dev-preview-login" method="post">
                    <input type="hidden" name="next" value={nextPath} />
                    <input
                      type="hidden"
                      name="email"
                      value={previewUnlocked ? "walkthrough@werkles.local" : "gimprobotester@werkles.local"}
                    />
                    <input type="hidden" name="password" value="local-walkthrough" />
                    <button className="button button-dark" style={{ minHeight: 44 }} type="submit">
                      {previewUnlocked ? "Continue to Werkles" : "Continue as gimprobotester"}
                    </button>
                    {!previewUnlocked ? (
                      <p className="status-line" role="status">
                        This opens the practice member work saved in this browser. It does not check or change your account password.
                      </p>
                    ) : null}
                  </form>
                ) : (
                  <>
                    <form className="form-stack" onSubmit={handleSubmit}>
                      <label className="field">
                        <span>Email</span>
                        <input
                          name="email"
                          type="email"
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
                        {previewBlocked ? "Sign-in disabled" : "Log in"}
                      </button>
                      <p className="status-line" role="status">{status}</p>
                    </form>
                    {localPreviewAvailable ? (
                      <form className="form-stack" action="/api/bellows/intake/recover-local" method="post">
                        <button className="button button-outline" type="submit">
                          Open my last saved Intake
                        </button>
                      </form>
                    ) : null}
                    <Link className="button button-outline" href="/signup">Create an account</Link>
                  </>
                )}
              </div>
            </section>

            <aside className="login-return__board" aria-labelledby="return-board-title">
              <div className="login-return__board-heading">
                <p className="eyebrow">Waiting for you</p>
                <h2 id="return-board-title">Three useful places to return.</h2>
                <p>
                  Go straight to the work, learning, or people that can move your idea forward.
                </p>
              </div>

              <div className="login-return__updates">
                <article>
                  <span>Your work</span>
                  <h3>Pick up the thread</h3>
                  <p>Continue directly to {destinationLabel}.</p>
                </article>
                <article>
                  <span>Your people</span>
                  <h3>Review your Match Deck</h3>
                  <p>Compare current matches and prepare for a real conversation.</p>
                </article>
                <article>
                  <span>Fresh ideas</span>
                  <h3>Continue your Personal Bellows</h3>
                  <p>Return to lessons and working tools shaped by your current recommendations.</p>
                </article>
              </div>

              <p className="login-return__truth">
                Werkles should be useful when you return, not just when you remember to visit.
              </p>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
