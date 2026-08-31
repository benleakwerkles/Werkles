"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { getClientAccessToken } from "@/lib/client-auth";

type ReasonStrength = "Strong" | "Medium" | "Slim" | "CountsAgainst";
type RecommendationAction = {
  label: string;
  kind: string;
  href?: string;
  enabled: boolean;
};
type RecommendationViewModel = {
  recommendation: {
    verdict: string;
    body: string;
    primaryAction: RecommendationAction;
    secondaryActions: RecommendationAction[];
  };
  heardUnderneath: { summary: string; squeeze: string | null; confidenceReason: string };
  askedFor: {
    summary: string;
    laneNeeded: string | null;
    turf: string | null;
    proofPosture: string;
  };
  visibleReasons: { signal: string; strength: ReasonStrength; saw: string; matters: string }[];
  alternatives: { label: string; notFirstBecause: string; couldBecomeRightWhen: string }[];
  trustNote: string;
};

const BAND_LABEL: Record<ReasonStrength, string> = {
  Strong: "Strong evidence",
  Medium: "Medium evidence",
  Slim: "Slim evidence",
  CountsAgainst: "Counts against"
};

const NARROW_CHECKS = [
  ["Identity", "Did a real person complete the identity step?", "/dashboard/crucible#check-identity"],
  ["Phone", "Does this person control the phone number they supplied?", "/dashboard/crucible#check-phone"],
  ["Funds", "Did an account meet an agreed threshold on a specific date?", "/dashboard/crucible#check-funds"]
] as const;

function bandKind(strength: ReasonStrength) {
  return strength === "CountsAgainst" ? "risk" : "evidence";
}

function Band({ strength }: { strength: ReasonStrength }) {
  return <span className={`recview__band recview__band--${bandKind(strength)}`}>{BAND_LABEL[strength]}</span>;
}

function Action({ action, primary = false }: { action: RecommendationAction; primary?: boolean }) {
  const className = primary ? "button button-dark" : "button button-outline";
  if (!action.enabled || !action.href) {
    return <button className={className} type="button" disabled>{action.label}</button>;
  }
  return <Link className={className} href={action.href}>{action.label}</Link>;
}

export function AccountAwareIntrosReadout({ initialView }: { initialView: RecommendationViewModel }) {
  const [readout, setReadout] = useState<
    | { state: "checking" }
    | { state: "ready"; view: RecommendationViewModel }
    | { state: "account_error" }
  >({ state: "checking" });

  useEffect(() => {
    let active = true;
    void (async () => {
      const token = await getClientAccessToken();
      if (!active) return;
      if (!token || token === "dev-preview-token") {
        setReadout({ state: "ready", view: initialView });
        return;
      }
      const response = await fetch("/api/ghost-fleet/intros/current", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store"
      });
      if (!response.ok || !active) {
        setReadout({ state: "account_error" });
        return;
      }
      const result = await response.json().catch(() => ({}));
      if (result?.view) setReadout({ state: "ready", view: result.view as RecommendationViewModel });
      else setReadout({ state: "account_error" });
    })().catch(() => {
      if (active) setReadout({ state: "account_error" });
    });
    return () => {
      active = false;
    };
  }, [initialView]);

  if (readout.state === "checking") {
    return <section className="ops-card" aria-live="polite" aria-busy="true"><h2>Checking what your latest Intake points toward.</h2></section>;
  }
  if (readout.state === "account_error") {
    return (
      <section className="ops-card" role="alert">
        <h2>Your account readout did not load.</h2>
        <p>Werkles will not replace it with a browser-session verdict.</p>
        <Link className="button button-dark" href="/bellows/intake">Check my saved Intake</Link>
      </section>
    );
  }

  const view = readout.view;
  return (
    <>
      <section className="ops-card recview__verdict" aria-labelledby="recview-verdict-title">
        <div className="card-heading"><p>Our current read</p><h2 id="recview-verdict-title">{view.recommendation.verdict}</h2></div>
        <p>{view.recommendation.body}</p>
        <div className="member-selected-surface__actions">
          <Action action={view.recommendation.primaryAction} primary />
          {view.recommendation.secondaryActions.map((action) => <Action action={action} key={action.kind} />)}
        </div>
      </section>

      {view.visibleReasons.length > 0 ? (
        <details className="ops-card recview__reasons">
          <summary>
            <span><small>Why these people surfaced</small><strong id="recview-reasons-title">What Werkles noticed</strong></span>
            <b aria-hidden="true">Open the reasons</b>
          </summary>
          <ul className="recview__reason-rail">
            {view.visibleReasons.map((reason) => (
              <li className="recview__reason" key={reason.signal}>
                <p className="recview__reason-head"><span>{reason.signal}</span><Band strength={reason.strength} /></p>
                <p>{reason.saw}</p><p className="recview__aside">{reason.matters}</p>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <figure className="recview__possibility">
        <Image
          src="/assets/draft/people-v1/people-shared-possibility-v1.png"
          alt="Two people considering materials and possibilities in a shared workshop and kitchen"
          width={1536}
          height={1024}
          sizes="(max-width: 900px) 100vw, 1100px"
        />
        <figcaption>
          <strong>A shortlist is a beginning, not a verdict.</strong>
          <span>Look for the person who helps you see—and build—the next part differently.</span>
        </figcaption>
      </figure>

      <details className="ops-card recview__underneath">
        <summary>See the fuller reasoning</summary>
        <h2>{view.heardUnderneath.summary}</h2>
        {view.heardUnderneath.squeeze ? <p>{view.heardUnderneath.squeeze}</p> : null}
        <p>{view.heardUnderneath.confidenceReason}</p>
        {view.alternatives.length > 0 ? (
          <div className="recview__alt-grid">
            {view.alternatives.map((alternative) => (
              <article className="recview__alt" key={alternative.label}>
                <h3>{alternative.label}</h3>
                <p><strong>Why not first:</strong> {alternative.notFirstBecause}</p>
                <p><strong>What could change:</strong> {alternative.couldBecomeRightWhen}</p>
              </article>
            ))}
          </div>
        ) : null}
      </details>

      <section className="ops-card recview__next" aria-labelledby="recview-next-title">
        <div className="card-heading"><p>Next</p><h2 id="recview-next-title">Keep the work moving</h2></div>
        <div className="recview__check-bridge">
          <div>
            <strong>Would one narrow fact change this decision?</strong>
            <span>Talk first. Add a check only when the answer would change what you do next.</span>
          </div>
          <nav aria-label="Optional checks for a possible match">
            {NARROW_CHECKS.map(([label, question, href]) => (
              <Link href={href} key={label}>
                <strong>{label}</strong><span>{question}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="member-selected-surface__actions">
          <Link className="button button-dark" href="/bellows/recommendations">Compare practical next moves</Link>
          <Link className="button button-outline" href="/dashboard/crucible#match-check-context">Choose a Check for This Match</Link>
        </div>
        <p className="recview__trust-note" role="note">{view.trustNote}</p>
      </section>

      <details className="ops-card recview__self-preview">
        <summary>Preview what another member could see</summary>
        <div className="recview__self-preview-heading">
          <div>
            <p>Not shared yet</p>
            <h2>Your side of a future introduction</h2>
          </div>
          <span>Private preview</span>
        </div>
        <p>
          Real introductions are not open in this build. If they open later, Werkles should show you this limited
          project card first and let you correct it before another member receives anything.
        </p>
        <dl className="recview__self-preview-grid">
          <div><dt>What you are trying to do</dt><dd>{view.askedFor.summary}</dd></div>
          <div><dt>Kind of help you may need</dt><dd>{view.askedFor.laneNeeded ?? "Not narrowed yet"}</dd></div>
          <div><dt>Working area</dt><dd>{view.askedFor.turf ?? "Not deliberately supplied"}</dd></div>
          <div><dt>What still needs checking</dt><dd>{view.askedFor.proofPosture}</dd></div>
        </dl>
        <p className="recview__self-preview-boundary" role="note">
          Not included: bank balance, net worth, precise location, private drafts, clicks, reading time, outside
          browsing, inferred traits, or anything from another Werkle.
        </p>
        <Link className="button button-outline" href="/bellows/intake">Correct What Werkles Knows</Link>
      </details>
    </>
  );
}
