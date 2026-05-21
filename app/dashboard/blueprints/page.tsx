import Link from "next/link";

export default function BlueprintsPage() {
  return (
    <main className="dashboard-main">
      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        <Link href="/dashboard">Match deck</Link>
        <Link href="/dashboard/profile">Profile</Link>
        <Link href="/dashboard/intros">Intros</Link>
      </nav>
      <section className="ops-card">
        <div className="card-heading">
          <p>Blueprints</p>
          <h1>Project rooms come after profile and auth wiring.</h1>
        </div>
        <p className="status-line">
          This route is reserved for listing the user&apos;s active blueprints, lane rosters, and intro requests.
        </p>
      </section>
    </main>
  );
}
