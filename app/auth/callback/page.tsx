"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RouteUnlockBanner } from "@/components/foundry/route-unlock-banner";
import { copy } from "@/lib/copy";
import { publicAuthMessage } from "@/lib/public-auth-message";
import { safeMemberReturnPath } from "@/lib/safe-member-return";
import { getSupabaseBrowser } from "@/lib/supabase/client";

function readAuthParams() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const queryParams = new URLSearchParams(window.location.search);
  return { hashParams, queryParams };
}

type CallbackState =
  | { status: "checking" | "redirecting"; message: string }
  | { status: "failed"; message: string; nextPath: string };

export default function AuthCallbackPage() {
  const router = useRouter();
  const callbackStartedRef = useRef(false);
  const [callbackState, setCallbackState] = useState<CallbackState>({
    status: "checking",
    message: "Checking your confirmation."
  });

  useEffect(() => {
    async function confirmAccount() {
      if (callbackStartedRef.current) return;
      callbackStartedRef.current = true;

      const { hashParams, queryParams } = readAuthParams();
      const safeNextPath = safeMemberReturnPath(queryParams.get("next"));
      const onboardingHref = `/onboarding?next=${encodeURIComponent(safeNextPath)}`;

      const hashError = hashParams.get("error");
      if (hashError) {
        setCallbackState({
          status: "failed",
          message: publicAuthMessage({
            context: "callback",
            code: hashParams.get("error_code") || hashError
          }),
          nextPath: safeNextPath
        });
        return;
      }

      const queryError = queryParams.get("error");
      if (queryError) {
        setCallbackState({
          status: "failed",
          message: publicAuthMessage({
            context: "callback",
            code: queryParams.get("error_code") || queryError
          }),
          nextPath: safeNextPath
        });
        return;
      }

      let supabase;
      try {
        supabase = getSupabaseBrowser();
      } catch {
        setCallbackState({
          status: "failed",
          message: publicAuthMessage({ context: "callback", code: "service_unavailable" }),
          nextPath: safeNextPath
        });
        return;
      }

      const code = queryParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setCallbackState({
            status: "failed",
            message: publicAuthMessage({ context: "callback", code: error.code, status: error.status }),
            nextPath: safeNextPath
          });
          return;
        }

        setCallbackState({ status: "redirecting", message: "Confirmed. Opening onboarding." });
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
          setCallbackState({
            status: "failed",
            message: publicAuthMessage({ context: "callback", code: error.code, status: error.status }),
            nextPath: safeNextPath
          });
          return;
        }

        setCallbackState({ status: "redirecting", message: "Confirmed. Opening onboarding." });
        router.replace(onboardingHref);
        return;
      }

      setCallbackState({
        status: "failed",
        message: publicAuthMessage({ context: "callback", code: "missing_confirmation" }),
        nextPath: safeNextPath
      });
    }

    void confirmAccount();
  }, [router]);

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <RouteUnlockBanner blockedDetail={copy.infraPreview.login} />
        <p className="eyebrow">Werkles</p>
        <h1>Opening the gate.</h1>
        {callbackState.status === "failed" ? (
          <>
            <p id="authCallbackStatus" className="status-line" role="alert">
              {callbackState.message}
            </p>
            <nav
              className="member-selected-surface__actions"
              aria-label="Account recovery"
              aria-describedby="authCallbackStatus"
            >
              <Link
                className="button button-dark"
                href={`/login?next=${encodeURIComponent(callbackState.nextPath)}`}
              >
                Log in
              </Link>
              <Link
                className="button button-outline"
                href={`/signup?next=${encodeURIComponent(callbackState.nextPath)}`}
              >
                Create account
              </Link>
            </nav>
          </>
        ) : (
          <p className="status-line" role="status">
            {callbackState.message}
          </p>
        )}
      </section>
    </main>
  );
}
