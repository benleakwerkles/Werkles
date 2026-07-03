import Link from "next/link";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { copy } from "@/lib/copy";

export default async function BlueprintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <CockpitShell>
      <main className="dashboard-main">
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <Link href="/dashboard">Match deck</Link>
          <Link href="/dashboard/blueprints">{copy.dashboard.workshops.navLabel}</Link>
          <Link href="/dashboard/intros">Intros</Link>
        </nav>
        <section className="ops-card">
          <div className="card-heading">
            <p>{copy.dashboard.workshops.kicker}</p>
            <h1>{id}</h1>
          </div>
          <p>{copy.dashboard.workshops.detailBody}</p>
          <p className="muted">
            Workshop detail surfaces grow from profile depth and blueprint narrative. Save context in profile first,
            then use intros when the ask is clear enough to route.
          </p>
          <div className="member-selected-surface__actions">
            <Link className="button button-dark" href="/dashboard/profile">
              Update profile
            </Link>
            <Link className="button button-outline" href="/dashboard/blueprints">
              Back to workshops
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
