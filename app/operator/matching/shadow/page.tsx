import Link from "next/link";
import type { Metadata } from "next";

import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { LEVERAGE_LABELS } from "@/lib/matching/leverage";
import { pathsForNotMatchDisplay } from "@/lib/matching/score-paths";
import { readLatestShadowRuns } from "@/lib/matching/shadow-pipeline";
import { RECOMMENDATION_KIND_LABELS } from "@/lib/squibb/recommendations";
import { isMatchingPublicEnabled } from "@/lib/matching/feature-flags";

export const metadata: Metadata = {
  title: "Matching Shadow | Werkles",
  description: "Operator review of autonomous matching engine shadow runs.",
  robots: { index: false, follow: false }
};

export default async function MatchingShadowPage() {
  const runs = await readLatestShadowRuns(12);
  const publicEnabled = isMatchingPublicEnabled();

  return (
    <CockpitShell>
      <main className="dashboard-main workshop-route--billing">
        <nav className="dashboard-nav" aria-label="Matching shadow navigation">
          <Link href="/operator/gate-knockout">Gate Knockout</Link>
          <Link href="/operator/human-gates">Human Gate Hub</Link>
          <Link href="/bellows/recommendations">Squibb recommendations</Link>
        </nav>

        <section className="ops-card">
          <div className="card-heading">
            <p>Autonomous matching</p>
            <h1>Shadow runs</h1>
          </div>
          <p>
            Pipeline: <strong>signals → Layer 0 → not-match → path score → Speaker facts → Squibb voice</strong>.
            Public delivery: <strong>{publicEnabled ? "ON" : "OFF (shadow)"}</strong>.
          </p>
          <p className="muted">
            Doctrine: <code>company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md</code> · Ratify Speaker
            Charter V1 then flip with <code>APPROVE MATCHING AUTONOMOUS GO-LIVE</code>.
          </p>
        </section>

        {runs.length === 0 ? (
          <section className="ops-card">
            <p>No shadow runs yet. Submit an intake on /discovery or /bellows/intake.</p>
          </section>
        ) : (
          runs.map((run) => {
            const card = run.speaker.recommendationCard;
            return (
              <section className="ops-card" key={run.runId} aria-labelledby={`run-${run.runId}`}>
                <div className="card-heading">
                  <p>
                    {run.source} · {run.notMatch.outcome} · Layer 0 {run.layer0.confidence}
                  </p>
                  <h2 id={`run-${run.runId}`}>{run.runId}</h2>
                </div>
                <p className="muted">
                  Intake: <code>{run.intakeId}</code> · {run.createdAt}
                </p>

                <h3>Layer 0 — need translation</h3>
                <p>
                  <strong>Stated:</strong> {card.whatYouAskedFor}
                </p>
                <p>
                  <strong>Translated:</strong> {card.whatWeHeardUnderneath}
                </p>
                <p>
                  <strong>Leverage:</strong> {LEVERAGE_LABELS[run.signals.leverage.primaryHypothesis]}
                </p>
                <p>
                  <strong>Smallest step:</strong> {run.layer0.smallestReversibleStep}
                </p>

                <h3>Not-match layer</h3>
                <p>{run.notMatch.headline}</p>
                {pathsForNotMatchDisplay(run.notMatch).length > 0 && (
                  <ul>
                    {pathsForNotMatchDisplay(run.notMatch).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}

                <h3>Recommendation card</h3>
                <ol>
                  <li>
                    <strong>What you asked for:</strong> {card.whatYouAskedFor}
                  </li>
                  <li>
                    <strong>What we heard:</strong> {card.whatWeHeardUnderneath}
                  </li>
                  <li>
                    <strong>Visible reasons:</strong>
                    <ul>
                      {card.visibleReasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </li>
                  <li>
                    <strong>Recommendation ({card.recommendation.type}):</strong> {card.recommendation.headline}
                  </li>
                  <li>
                    <strong>Why not alternatives:</strong>
                    <ul>
                      {card.whyNotAlternatives.map((a) => (
                        <li key={a.path}>
                          {a.path}: {a.reason}
                        </li>
                      ))}
                    </ul>
                  </li>
                  <li>
                    <strong>Next steps:</strong>
                    <ul>
                      {card.whatToDoNext.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </li>
                </ol>

                <h3>Squibb — voice</h3>
                <p>{run.squibb.intro}</p>
                <p>{run.squibb.topPathNote}</p>

                <h3>Ranked paths</h3>
                <ol>
                  {run.speaker.scoredPaths.map((p) => (
                    <li key={p.kind}>
                      {RECOMMENDATION_KIND_LABELS[p.kind]} — score {p.score} ({p.confidenceLabel})
                      {p.disqualified ? " · DISQUALIFIED" : ""}
                    </li>
                  ))}
                </ol>
              </section>
            );
          })
        )}
      </main>
    </CockpitShell>
  );
}
