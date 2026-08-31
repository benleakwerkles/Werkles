"use client";

import { type ReactNode, useEffect, useState } from "react";
import { isSignedInForDevPreview, shouldUseDevPreviewAuth } from "@/lib/dev-preview-auth";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/* Client-side gate for member surfaces rendered by server components.
   Middleware can't see the Supabase browser session (localStorage), so the
   check happens here — same pattern as member-dashboard-client (Bean #5). */
/* The server owns walkthrough authority. A public build-time flag must never
   grant a client-side member-area bypass by itself. */
export function DashboardAuthGuard({
  next,
  allowGhostWalkthrough = false,
  children
}: {
  next: string;
  allowGhostWalkthrough?: boolean;
  children: ReactNode;
}) {
  const ghostWalkthrough = allowGhostWalkthrough;
  const [authState, setAuthState] = useState<"checking" | "signed-in">(
    ghostWalkthrough ? "signed-in" : "checking"
  );

  useEffect(() => {
    let cancelled = false;
    const target = `/login?next=${encodeURIComponent(next)}`;

    async function checkAuth() {
      if (ghostWalkthrough) {
        if (!cancelled) setAuthState("signed-in");
        return;
      }
      if (shouldUseDevPreviewAuth()) {
        if (!isSignedInForDevPreview()) {
          window.location.replace(target);
          return;
        }
        if (!cancelled) setAuthState("signed-in");
        return;
      }
      try {
        const { data } = await getSupabaseBrowser().auth.getUser();
        if (!data.user) {
          window.location.replace(target);
          return;
        }
        if (!cancelled) setAuthState("signed-in");
      } catch {
        window.location.replace(target);
      }
    }

    void checkAuth();
    return () => {
      cancelled = true;
    };
  }, [ghostWalkthrough, next]);

  if (authState !== "signed-in") {
    return (
      <section className="ops-card" aria-live="polite">
        <p className="eyebrow">Member area</p>
        <h1>Checking session...</h1>
      </section>
    );
  }

  return children;
}
