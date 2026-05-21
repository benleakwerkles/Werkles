import Link from "next/link";
import MatchDeck from "./match-deck";

export default function DashboardPage() {
  return (
    <main className="dashboard-main">
      <nav className="dashboard-nav" aria-label="Dashboard navigation">
        <Link href="/">Home</Link>
        <Link href="/dashboard/profile">Profile</Link>
        <Link href="/dashboard/blueprints">Blueprints</Link>
        <Link href="/dashboard/intros">Intros</Link>
      </nav>
      <MatchDeck />
    </main>
  );
}
