"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { SquibbRecommendationSurface } from "@/components/squibb/recommendation-surface";
import { getClientAccessToken } from "@/lib/client-auth";
import { readBrowserIntakeDraft } from "@/lib/squibb/browser-intake-draft";
import { buildSpeakerIntakePacket } from "@/lib/squibb/concierge-intake-v0";
import { buildIntakeSourceDocument } from "@/lib/squibb/intake-source-document";
import type { BellowsPacketLedger } from "@/lib/squibb/bellows-ledger";
import {
  buildLiveIntakeRankedDeck,
  type RecommendationKind,
  type SquibbRecommendationSession
} from "@/lib/squibb/recommendations";

function sessionFromBrowserIntake(
  initialSession: SquibbRecommendationSession
): SquibbRecommendationSession | null {
  const draft = readBrowserIntakeDraft(window.localStorage);
  if (!draft?.completed) return null;
  const packet = buildSpeakerIntakePacket(draft.answers, draft.updatedAt || undefined);
  const statedNeed = draft.answers.heaviest_lift.trim();
  const ranked = buildLiveIntakeRankedDeck(statedNeed, packet.speakerFeed.symptomBlock);
  const feeds = ranked.map((item) => item.kind);
  return {
    ...initialSession,
    statedNeed,
    operatorContext: "Completed in this browser",
    squibbIntro: "Werkles received your answers and found a few useful places to begin.",
    ranked,
    source: {
      mode: "browser_intake",
      label: "This browser's Intake",
      detail: "Saved only in this browser profile—not to a Werkles account. Clearing browser data removes it, and another browser or device will not have it.",
      capturedAt: packet.capturedAt,
      answeredCount: packet.symptoms.filter((item) => item.answer.trim()).length,
      totalQuestions: packet.symptoms.length,
      symptomBlock: packet.speakerFeed.symptomBlock,
      fedDocument: buildIntakeSourceDocument("browser-intake", packet, feeds)
    }
  };
}

export function AccountAwareRecommendationSurface({
  initialSession,
  ledger,
  initialKind,
  peopleGateway
}: {
  initialSession: SquibbRecommendationSession;
  ledger: BellowsPacketLedger;
  initialKind?: RecommendationKind;
  peopleGateway?: ReactNode;
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
        setReadout({
          state: "ready",
          session: sessionFromBrowserIntake(initialSession) ?? initialSession,
          ledger
        });
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

  return (
    <SquibbRecommendationSurface
      session={readout.session}
      ledger={readout.ledger}
      initialKind={initialKind}
      peopleGateway={peopleGateway}
    />
  );
}
