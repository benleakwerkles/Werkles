import Link from "next/link";
import { Suspense } from "react";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { DashboardAuthGuard } from "@/components/foundry/dashboard-auth-guard";
import { Tier2PageVisual } from "@/components/foundry/tier2-page-visual";
import { CruciblePanel } from "@/components/crucible/crucible-panel";
import { crucibleProviderRuntimeSnapshot } from "@/lib/crucible-provider-runtime";
import { isGhostFleetEnabled } from "@/lib/ghost-fleet";
import { loadOwnerSurfaceState } from "@/lib/owner-surfaces/owner-state";
import { readBellowsOwnerIdFromCookies } from "@/lib/squibb/bellows-owner-session";
import { routeAtmosphere } from "@/lib/workshop-facets";

export const dynamic = "force-dynamic";

export default async function CruciblePage() {
  const fleetOn = isGhostFleetEnabled();
  const state = await loadOwnerSurfaceState(await readBellowsOwnerIdFromCookies());
  const providerRuntime = crucibleProviderRuntimeSnapshot();

  return (
    <CockpitShell>
      <main className={`dashboard-main ${routeAtmosphere.crucible}`}>
      <DashboardAuthGuard next="/dashboard/crucible" allowGhostWalkthrough={fleetOn}>
      <div className="tier2-visual-band">
        <Tier2PageVisual page="crucible" forgeBand iconRail />
      </div>
      <Suspense fallback={<p className="muted">Loading Crucible…</p>}>
        <CruciblePanel showGhostPractice={fleetOn} providerRuntime={providerRuntime} />
      </Suspense>

      <section className="ops-card" aria-labelledby="owner-proof-title">
        <div className="card-heading">
          <p>Your current Intake</p>
          <h2 id="owner-proof-title">
            {state.hasIntake ? "What Werkles cannot vouch for about you yet" : "Nothing to check yet"}
          </h2>
        </div>
        {state.hasIntake ? (
          <>
            <p className="muted">
              These suggestions come from your latest saved Intake. Every check is optional, and none is running
              until you choose to start it.
            </p>
            <ul className="workshop-list">
              {state.proofChecks.map((check) => (
                <li key={check.id}>
                  <strong>
                    {check.label} · not started · {check.priority} priority
                  </strong>
                  <span className="workshop-list__detail">{check.why}</span>
                  <span className="workshop-list__detail">{check.changes}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>
            No Intake is saved for this member yet. Answer the Werkles questions and this page will name checks that
            could answer a specific question in the work.
          </p>
        )}
        <div className="member-selected-surface__actions">
          <Link className="button button-outline" href="/bellows/intake">
            {state.hasIntake ? "Update my answers" : "Answer the questions"}
          </Link>
          <Link className="button button-outline" href="/bellows/recommendations">
            Compare next moves
          </Link>
        </div>
      </section>

      <section className="ops-card" aria-label="How Crucible checks work">
        <div className="card-heading">
          <p>How to read checks</p>
          <h2>Optional verification. Visible signal. No fake trust.</h2>
        </div>
        <p>
          Provider checks are separate from membership. They answer one narrow question at a dated moment; they do
          not make someone a better match or rank one person above another. Add a check only when the work needs it.
        </p>
        <div className="trust-state-strip" aria-label="Crucible member rules">
          <span>Checks are optional</span>
          <span>Dated result, not a ranking</span>
          <span>No wealth leaderboard</span>
        </div>
        <div className="member-selected-surface__actions">
          <Link className="button button-outline" href="/dashboard/profile">
            Update profile
          </Link>
          <Link className="button button-outline" href="/pricing">
            See check pricing
          </Link>
          <Link className="button button-outline" href="/proof">
            How checks work
          </Link>
        </div>
      </section>
      </DashboardAuthGuard>
      </main>
    </CockpitShell>
  );
}
