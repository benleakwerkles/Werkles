"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { isPersonalRecommendationResponse } from "@/lib/matching/personal-recommendation-contract";
import type { BellowsPacketLedger } from "@/lib/squibb/bellows-ledger";
import type { SquibbRecommendationSession } from "@/lib/squibb/recommendations";
import { getSupabaseBrowser, hasSupabaseBrowserConfig } from "@/lib/supabase/client";
import { SquibbRecommendationSurface } from "./recommendation-surface";

type PersonalRecommendationDeliveryProps = {
  exampleSession: SquibbRecommendationSession;
  ledger: BellowsPacketLedger;
};

type DeliveryState =
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "profile_required" }
  | { status: "personal"; session: SquibbRecommendationSession }
  | { status: "error" };

export function PersonalRecommendationDelivery({
  exampleSession,
  ledger
}: PersonalRecommendationDeliveryProps) {
  const [delivery, setDelivery] = useState<DeliveryState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadPersonalRecommendation() {
      if (!hasSupabaseBrowserConfig()) {
        if (active) setDelivery({ status: "signed_out" });
        return;
      }

      try {
        const { data } = await getSupabaseBrowser().auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          if (active) setDelivery({ status: "signed_out" });
          return;
        }

        const response = await fetch("/api/bellows/recommendations/personal", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const payload: unknown = await response.json().catch(() => null);

        if (!active) return;
        if (!response.ok || !isPersonalRecommendationResponse(payload)) {
          setDelivery({ status: "error" });
          return;
        }
        if (payload.status === "profile_required") {
          setDelivery({ status: "profile_required" });
          return;
        }
        setDelivery({ status: "personal", session: payload.session });
      } catch {
        if (active) setDelivery({ status: "error" });
      }
    }

    void loadPersonalRecommendation();
    return () => {
      active = false;
      controller.abort();
    };
  }, [attempt]);

  function retryPersonalRecommendation() {
    setDelivery({ status: "loading" });
    setAttempt((current) => current + 1);
  }

  const session = delivery.status === "personal" ? delivery.session : exampleSession;

  return (
    <>
      {delivery.status === "loading" ? (
        <p className="squibb-rec-delivery-status" role="status">
          Checking this browser for a signed-in profile. The example remains visible while we check.
        </p>
      ) : null}
      {delivery.status === "signed_out" ? (
        <p className="squibb-rec-delivery-status" role="status">
          You are viewing an example. <Link href="/login?next=%2Fbellows%2Frecommendations">Sign in</Link> or{" "}
          <Link href="/signup?next=%2Fbellows%2Frecommendations">create an account</Link> to request a private
          rules-based recommendation from your saved profile.
        </p>
      ) : null}
      {delivery.status === "profile_required" ? (
        <p className="squibb-rec-delivery-status" role="status">
          You are signed in, but your profile needs a goal or project detail before Werkles can rank a personal result.{' '}
          <Link href="/dashboard/profile?next=%2Fbellows%2Frecommendations">Open Profile Builder</Link>.
        </p>
      ) : null}
      {delivery.status === "personal" ? (
        <p className="squibb-rec-delivery-status" role="status">
          Private rules result loaded from your saved profile. Inputs: goal, project details, offered and sought skills,
          industry, lane, work preference, location, and timeline. The result itself was not saved or forwarded.{' '}
          <Link href="/dashboard/profile?next=%2Fbellows%2Frecommendations">Edit profile</Link>.
        </p>
      ) : null}
      {delivery.status === "error" ? (
        <p className="squibb-rec-delivery-status squibb-rec-delivery-status--error" role="alert">
          A personal recommendation could not be loaded. The page below is still an example.{' '}
          <button type="button" className="squibb-rec-delivery-retry" onClick={retryPersonalRecommendation}>
            Try again
          </button>{' '}
          or <Link href="/dashboard/profile?next=%2Fbellows%2Frecommendations">review Profile Builder</Link>.
        </p>
      ) : null}

      <SquibbRecommendationSurface
        key={delivery.status === "personal" ? "personal" : "example"}
        session={session}
        ledger={ledger}
      />
    </>
  );
}
