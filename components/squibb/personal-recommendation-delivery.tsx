"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { classifyPersonalRecommendationResponse } from "@/lib/matching/personal-recommendation-contract";
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
  | { status: "reauth_required" }
  | { status: "profile_required" }
  | { status: "personal"; session: SquibbRecommendationSession }
  | { status: "error" };

const PERSONAL_RECOMMENDATION_CTA_ID = "personalRecommendationDoorway";

export function PersonalRecommendationDelivery({
  exampleSession,
  ledger
}: PersonalRecommendationDeliveryProps) {
  const [delivery, setDelivery] = useState<DeliveryState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const deliveryStatusRef = useRef<HTMLDivElement>(null);
  const focusStatusAfterRetryRef = useRef(false);

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
        if (!active) return;
        if (response.status === 401) {
          setDelivery(
            classifyPersonalRecommendationResponse({
              status: response.status,
              ok: response.ok,
              payload: null
            })
          );
          return;
        }

        const payload: unknown = await response.json().catch(() => null);
        if (!active) return;
        setDelivery(
          classifyPersonalRecommendationResponse({
            status: response.status,
            ok: response.ok,
            payload
          })
        );
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

  useEffect(() => {
    if (!focusStatusAfterRetryRef.current) return;
    deliveryStatusRef.current?.focus({ preventScroll: true });
    focusStatusAfterRetryRef.current = false;
  }, [delivery.status]);

  function retryPersonalRecommendation() {
    focusStatusAfterRetryRef.current = true;
    setDelivery({ status: "loading" });
    setAttempt((current) => current + 1);
  }

  const session = delivery.status === "personal" ? delivery.session : exampleSession;
  const showDeliveryStatus =
    delivery.status === "loading" ||
    delivery.status === "reauth_required" ||
    delivery.status === "profile_required" ||
    delivery.status === "error";
  const continuationAction =
    delivery.status === "signed_out"
      ? {
          label: "Get my own result",
          href: `#${PERSONAL_RECOMMENDATION_CTA_ID}`,
          focusTargetId: PERSONAL_RECOMMENDATION_CTA_ID
        }
      : delivery.status === "reauth_required"
        ? { label: "Sign in again", href: "/login?next=%2Fbellows%2Frecommendations" }
        : delivery.status === "profile_required"
          ? { label: "Complete my profile", href: "/dashboard/profile?next=%2Fbellows%2Frecommendations" }
          : undefined;

  return (
    <>
      {showDeliveryStatus ? (
        <div
          ref={deliveryStatusRef}
          className={`squibb-rec-delivery-status${delivery.status === "error" ? " squibb-rec-delivery-status--error" : ""}`}
          role={delivery.status === "error" ? "alert" : "status"}
          tabIndex={-1}
        >
          {delivery.status === "loading" ? (
            <>Looking for your profile. You can explore the example while we check.</>
          ) : null}
          {delivery.status === "reauth_required" ? (
            <>
              Your session ended.{' '}
              <Link href="/login?next=%2Fbellows%2Frecommendations">Sign in again</Link> to load your private result.
            </>
          ) : null}
          {delivery.status === "profile_required" ? (
            <>
              Your profile needs a goal or project detail.{' '}
              <Link href="/dashboard/profile?next=%2Fbellows%2Frecommendations">Open Profile Builder</Link> to finish it.
            </>
          ) : null}
          {delivery.status === "error" ? (
            <>
              We could not load your result, so the example stays here.{' '}
              <button type="button" className="squibb-rec-delivery-retry" onClick={retryPersonalRecommendation}>
                Try again
              </button>.
            </>
          ) : null}
        </div>
      ) : null}

      <SquibbRecommendationSurface
        key={delivery.status === "personal" ? "personal" : "example"}
        session={session}
        ledger={ledger}
        continuationAction={continuationAction}
      />

      {delivery.status === "signed_out" ? (
        <section
          id={PERSONAL_RECOMMENDATION_CTA_ID}
          className="squibb-rec-delivery-cta panel"
          aria-labelledby="personalRecommendationCtaTitle"
          aria-live="polite"
          tabIndex={-1}
        >
          <p className="eyebrow">Your turn</p>
          <h2 id="personalRecommendationCtaTitle">Want one for your situation?</h2>
          <p>Your private rules-based result is not saved or forwarded.</p>
          <div className="squibb-rec-delivery-cta__actions">
            <div className="squibb-rec-delivery-cta__action-row">
              <Link className="button button-dark" href="/signup?next=%2Fbellows%2Frecommendations">
                Create account
              </Link>
              <p>New here: confirm your email, finish First Weld, and add one useful profile signal.</p>
            </div>
            <div className="squibb-rec-delivery-cta__action-row">
              <Link className="button button-outline" href="/login?next=%2Fbellows%2Frecommendations">
                Sign in
              </Link>
              <p>Already a member: sign in and come straight back.</p>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
