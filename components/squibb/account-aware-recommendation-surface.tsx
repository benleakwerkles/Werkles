"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SquibbRecommendationSurface } from "@/components/squibb/recommendation-surface";
import { getClientAccessToken } from "@/lib/client-auth";
import type { BellowsPacketLedger } from "@/lib/squibb/bellows-ledger";
import type { RecommendationKind, SquibbRecommendationSession } from "@/lib/squibb/recommendations";

export function AccountAwareRecommendationSurface({
  initialSession,
  ledger,
  initialKind
}: {
  initialSession: SquibbRecommendationSession;
  ledger: BellowsPacketLedger;
  initialKind?: RecommendationKind;
}) {
  const [readout, setReadout] = useState<
    | { state: "checking" }
    | { state: "ready"; session: SquibbRecommendationSession; ledger: BellowsPacketLedger }
    | { state: "account_error" }
  >({ state: "checking" });

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getClientAccessToken();
      if (!active) return;
      if (!token || token === "dev-preview-token") {
        setReadout({ state: "ready", session: initialSession, ledger });
        return;
      }
      const response = await fetch("/api/bellows/recommendations/current", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (!response.ok || !active) {
        setReadout({ state: "account_error" });
        return;
      }
      const result = await response.json().catch(() => ({}));
      if (result?.session) {
        setReadout({
          state: "ready",
          session: result.session as SquibbRecommendationSession,
          ledger: { intakes: [], optionPackets: [] }
        });
      } else {
        setReadout({ state: "account_error" });
      }
    })().catch(() => {
      if (active) setReadout({ state: "account_error" });
    });
    return () => {
      active = false;
    };
  }, [initialSession, ledger]);

  if (readout.state === "checking") {
    return (
      <section className="panel" aria-live="polite" aria-busy="true">
        <p className="eyebrow">Opening your results</p>
        <h1>Checking for your latest saved Intake.</h1>
      </section>
    );
  }

  if (readout.state === "account_error") {
    return (
      <section className="panel" role="alert">
        <p className="eyebrow">Your account result did not load</p>
        <h1>We will not replace it with somebody else&apos;s example.</h1>
        <p>Return to Intake to confirm your saved answers, then try Recommendations again.</p>
        <Link className="button button-dark" href="/bellows/intake">Open my Intake</Link>
      </section>
    );
  }

  return <SquibbRecommendationSurface session={readout.session} ledger={readout.ledger} initialKind={initialKind} />;
}
