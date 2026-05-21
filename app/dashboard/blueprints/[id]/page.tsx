import Link from "next/link";

export default async function BlueprintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="dashboard-main">
      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        <Link href="/dashboard">Match deck</Link>
        <Link href="/dashboard/blueprints">Blueprints</Link>
        <Link href="/dashboard/intros">Intros</Link>
      </nav>
      <section className="ops-card">
        <div className="card-heading">
          <p>Blueprint Detail</p>
          <h1>{id}</h1>
        </div>
        <p className="status-line">
          This page will hold members, lane caps, co-sign candidates, and intro state.
        </p>
      </section>
    </main>
  );
}
