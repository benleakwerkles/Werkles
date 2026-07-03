import Link from "next/link";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { copy } from "@/lib/copy";

export default function BlueprintsPage() {
  return (
    <CockpitShell>
      <main className="dashboard-main">
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <Link href="/dashboard">Match deck</Link>
          <Link href="/dashboard/profile">Profile</Link>
          <Link href="/dashboard/intros">Intros</Link>
        </nav>
        <section className="ops-card">
          <div className="card-heading">
            <p>{copy.dashboard.workshops.kicker}</p>
            <h1>{copy.dashboard.workshops.headline}</h1>
          </div>
          <p>{copy.dashboard.workshops.body}</p>
          <p className="muted">
            Workshops hold blueprint narratives — what you are building, who is missing, and what proof you already
            have. Start in profile, then return here as the work grows.
          </p>
          <div className="trust-state-strip" aria-label="Workshop path">
            <span>Profile first</span>
            <span>Blueprint depth optional</span>
            <span>Intros follow clarity</span>
          </div>
          <div className="member-selected-surface__actions">
            <Link className="button button-dark" href="/dashboard/profile">
              Update profile
            </Link>
            <Link className="button button-outline" href="/onboarding">
              Revisit onboarding
            </Link>
            <Link className="button button-outline" href="/dashboard/intros">
              Open intros
            </Link>
          </div>
        </section>
      </main>
    </CockpitShell>
  );
}
