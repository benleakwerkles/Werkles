"use client";

import Link from "next/link";
import { useState } from "react";
import { CockpitShell } from "@/components/foundry/cockpit-shell";
import { copy } from "@/lib/copy";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type IntroRow = {
  id: string;
  blueprint_id: string;
  scout_user_id: string;
  target_user_id: string;
  co_sign_user_id: string;
  status: string;
  created_at: string;
};

export default function IntrosPage() {
  const [intros, setIntros] = useState<IntroRow[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [status, setStatus] = useState(copy.dashboard.intros.idle);

  async function loadIntros() {
    const { data: sessionData } = await getSupabaseBrowser().auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setStatus("Log in before loading intros.");
      return;
    }

    const response = await fetch("/api/intros", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const result = await response.json();

    if (!response.ok) {
      setStatus(result.error || "Could not load intros.");
      return;
    }

    setIntros(result.intros || []);
    setHasLoaded(true);
    setStatus(result.intros?.length ? copy.dashboard.intros.loaded : "No intros yet — profile and workshop context come first.");
  }

  return (
    <CockpitShell>
      <main className="dashboard-main">
        <nav className="dashboard-nav" aria-label="Dashboard navigation">
          <Link href="/dashboard">Match deck</Link>
          <Link href="/dashboard/profile">Profile</Link>
          <Link href="/dashboard/blueprints">{copy.dashboard.workshops.navLabel}</Link>
        </nav>
        <section className="ops-card">
          <div className="card-heading">
            <p>{copy.dashboard.intros.kicker}</p>
            <h1>{copy.dashboard.intros.headline}</h1>
          </div>
          <button className="button button-dark" type="button" onClick={loadIntros}>Load intros</button>
          <p className="muted">
            Intros connect blueprint work to people. Load the queue after your profile has lane, turf, and a clear ask.
          </p>
          <div className="member-selected-surface__actions">
            <Link className="button button-outline" href="/dashboard/profile">
              Update profile first
            </Link>
            <Link className="button button-outline" href="/dashboard/blueprints">
              Open workshops
            </Link>
          </div>
          <div className="intro-queue">
            {intros.map((intro) => (
              <div className="intro-item" key={intro.id}>
                <span className="mini-avatar">I</span>
                <span>
                  <strong>{intro.status}</strong>
                  <small>{intro.blueprint_id}</small>
                </span>
              </div>
            ))}
          </div>
          {hasLoaded && intros.length === 0 ? (
            <section className="ops-card" aria-label="Empty intros queue">
              <div className="card-heading">
                <p>Empty queue</p>
                <h2>No intros yet — that is normal early on.</h2>
              </div>
              <p>
                Intros appear when blueprint work is clear enough to route. Save lane, turf, and skills in profile, add
                workshop context, then load again.
              </p>
              <div className="member-selected-surface__actions">
                <Link className="button button-dark" href="/dashboard/profile">
                  Update profile
                </Link>
                <Link className="button button-outline" href="/dashboard/blueprints">
                  Open workshops
                </Link>
              </div>
            </section>
          ) : null}
          <p className="status-line" role="status">{status}</p>
        </section>
      </main>
    </CockpitShell>
  );
}
