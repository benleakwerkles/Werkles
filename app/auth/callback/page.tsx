"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteUnlockBanner } from "@/components/foundry/route-unlock-banner";
import { copy } from "@/lib/copy";
import { safeMemberReturnPath } from "@/lib/safe-member-return";
import { getSupabaseBrowser } from "@/lib/supabase/client";

function readAuthParams() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);
  return { hashParams, queryParams };
}

function decodeAuthMessage(value: string | null) {
  if (!value) return null;
  return decodeURIComponent(value.replace(/\+/g, " "));
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/dashboard");
  const [status, setStatus] = useState("Confirming your account.");

  useEffect(() => {
    async function confirmAccount() {
      const { hashParams, queryParams } = readAuthParams();
      const safeNextPath = safeMemberReturnPath(queryParams.get("next"));
      const onboardingHref = `/onboarding?next=${encodeURIComponent(safeNextPath)}`;
      setNextPath(safeNextPath);

      const hashError = hashParams.get("error");
      if (hashError) {
        const description =
          decodeAuthMessage(hashParams.get("error_description")) ||
          decodeAuthMessage(hashParams.get("error_code")) ||
          hashError;

        if (hashParams.get("error_code") === "otp_expired") {
          setStatus(
            `${description} Request a new confirmation email from Supabase, or log in if your account is already confirmed.`
          );
          return;
        }

        setStatus(description);
        return;
      }

      const queryError = queryParams.get("error");
      if (queryError) {
        setStatus(decodeAuthMessage(queryParams.get("error_description")) || queryError);
        return;
      }

      let supabase;
      try {
        supabase = getSupabaseBrowser();
      } catch (error) {
        setStatus(error instanceof Error ? error.message : "Auth callback failed before the gate opened.");
        return;
      }

      const code = queryParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus(error.message);
          return;
        }

        router.replace(onboardingHref);
        return;
      }

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (error) {
          setStatus(error.message);
          return;
        }

        router.replace(onboardingHref);
        return;
      }

      setStatus("No confirmation code found. Log in with your email and password.");
    }

    confirmAccount();
  }, [router]);

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <RouteUnlockBanner blockedDetail={copy.infraPreview.login} />
        <p className="eyebrow">Werkles</p>
        <h1>Opening the gate.</h1>
        <p className="status-line" role="status">
          {status}
        </p>
        <div className="member-selected-surface__actions">
          <Link className="button button-dark" href={`/onboarding?next=${encodeURIComponent(nextPath)}`}>
            Continue to onboarding
          </Link>
          <Link className="button button-outline" href="/dashboard">
            Member home
          </Link>
          <Link className="button button-outline" href={`/login?next=${encodeURIComponent(nextPath)}`}>
            Back to login
          </Link>
        </div>

        <section className="ops-card auth-doorway" aria-label="Auth recovery">
          <div className="card-heading">
            <p>If this page looks wrong</p>
            <h2>Try login before you re-signup.</h2>
          </div>
          <ul>
            <li>Expired confirmation link — log in with email and password; account may already be active.</li>
            <li>No code in URL — start from signup or login, not this page directly.</li>
            <li>Still stuck — use signup again or check Supabase email templates in operator setup.</li>
          </ul>
          <div className="member-selected-surface__actions">
            <Link className="button button-outline" href={`/signup?next=${encodeURIComponent(nextPath)}`}>
              Create account
            </Link>
            <Link className="button button-outline" href="/proof">
              Inspect proof
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
