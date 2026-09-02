"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { getClientAccessToken } from "@/lib/client-auth";
import type { GhostFleetPlayableLoopBridge } from "@/lib/ghost-fleet/playable-loop";

type Continuation =
  | { state: "checking" }
  | { state: "ready"; count: number; note: string }
  | { state: "error" };

export function AccountAwarePeopleContinuation({
  initialBridge
}: {
  initialBridge: GhostFleetPlayableLoopBridge | null;
}) {
  const [continuation, setContinuation] = useState<Continuation>({ state: "checking" });

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getClientAccessToken();
      if (!active) return;
      if (!token || token === "dev-preview-token") {
        setContinuation({
          state: "ready",
          count: initialBridge?.candidateCount ?? 0,
          note: "These are practice profiles, not real members. Nothing is sent or introduced from this page."
        });
        return;
      }
      const response = await fetch("/api/ghost-fleet/intros/current", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (!response.ok || !active) {
        setContinuation({ state: "error" });
        return;
      }
      const result = await response.json().catch(() => ({}));
      setContinuation({
        state: "ready",
        count: Array.isArray(result?.members) ? result.members.length : 0,
        note: typeof result?.locationMessage === "string"
          ? result.locationMessage
          : "Your account Intake is being used for this practice shortlist."
      });
    })().catch(() => {
      if (active) setContinuation({ state: "error" });
    });
    return () => {
      active = false;
    };
  }, [initialBridge]);

  if (continuation.state === "checking") {
    return <p className="muted" aria-live="polite" aria-busy="true">Checking whether a person belongs among your next steps.</p>;
  }

  return (
    <section className="ops-card recommendation-people-gateway" aria-labelledby="ghost-fleet-next-title">
      <div className="card-heading">
        <p>People</p>
        <h2 id="ghost-fleet-next-title">Meet People With Similar Ambitions</h2>
      </div>
      {continuation.state === "error" ? (
        <p role="alert">Your account shortlist did not load. Werkles will not substitute another browser&apos;s practice matches.</p>
      ) : (
        <>
          <p>{continuation.count > 0
            ? `${continuation.count} practice ${continuation.count === 1 ? "profile lines" : "profiles line"} up with parts of what you are trying to build.`
            : "No practice profile has a strong enough reason to appear yet."}</p>
          <p className="muted" role="note">{continuation.note}</p>
        </>
      )}
      <div className="member-selected-surface__actions">
        <Link className="button button-outline" href="/dashboard/intros">Meet People Who May Fit</Link>
      </div>
      <figure className="recommendation-people-gateway__photo">
        <Image
          src="/assets/draft/people-v1/people-shared-possibility-v1.png"
          alt="Two people comparing possibilities in a shared workshop"
          width={1536}
          height={1024}
          sizes="(max-width: 760px) 100vw, 18rem"
        />
      </figure>
    </section>
  );
}
