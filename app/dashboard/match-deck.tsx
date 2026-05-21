"use client";

import { useState } from "react";
import { copy } from "@/lib/copy";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type MatchRow = {
  target_user_id: string;
  score: number;
  factors: Record<string, string>;
};

export default function MatchDeck() {
  const [blueprintId, setBlueprintId] = useState("");
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [status, setStatus] = useState("Enter a blueprint UUID to call the Supabase matching function.");

  async function loadMatches() {
    const { data: sessionData } = await getSupabaseBrowser().auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setStatus("Log in before loading production matches.");
      return;
    }

    if (!blueprintId) {
      setStatus("Blueprint UUID is required.");
      return;
    }

    const response = await fetch(`/api/matches?blueprint_id=${encodeURIComponent(blueprintId)}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const result = await response.json();

    if (!response.ok) {
      setStatus(result.error || "Could not load matches.");
      return;
    }

    setMatches(result.matches || []);
    setActiveIndex(0);
    setStatus(result.matches?.length ? "Production match factors loaded." : copy.actions.decline);
  }

  const active = matches[activeIndex];

  return (
    <section className="dashboard-grid">
      <article className="ops-card">
        <div className="card-heading">
          <p>Match Deck</p>
          <h1>Production matching, one blueprint at a time.</h1>
        </div>
        <label className="field">
          <span>Blueprint UUID</span>
          <input
            value={blueprintId}
            onChange={(event) => setBlueprintId(event.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
          />
        </label>
        <button className="button button-dark" type="button" onClick={loadMatches}>Load matches</button>
        <p className="status-line" role="status">{status}</p>
      </article>

      <article className="candidate-card">
        {active ? (
          <>
            <div className="candidate-top">
              <span className="avatar connector" aria-hidden="true">W</span>
              <div>
                <h2>{active.target_user_id.slice(0, 8)}</h2>
                <div className="meta-row">
                  <span className="tag">Candidate UUID</span>
                  <span className="verified-tag">Server scored</span>
                </div>
              </div>
              <span className="score">{active.score}</span>
            </div>
            <ul className="reason-list factor-list">
              {Object.entries(active.factors || {}).map(([key, value]) => (
                <li key={key}>
                  <strong>{key.replaceAll("_", " ")}</strong>
                  <span>{value}</span>
                </li>
              ))}
            </ul>
            <p className="compliance-note">{copy.disclaimer}</p>
            <div className="candidate-actions">
              <button
                className="button button-outline"
                type="button"
                onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
              >
                Back
              </button>
              <button
                className="button button-dark"
                type="button"
                onClick={() => setActiveIndex(Math.min(matches.length - 1, activeIndex + 1))}
              >
                Next
              </button>
              <span className="status-line">{activeIndex + 1} of {matches.length}</span>
            </div>
          </>
        ) : (
          <div className="candidate-empty">No production matches loaded yet.</div>
        )}
      </article>
    </section>
  );
}
