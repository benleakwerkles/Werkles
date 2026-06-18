"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { AeyeResourceView, DispatchMatrixRow, DispatchMatrixView } from "@/lib/soledash/dispatch-matrix/types";

function statusClass(status: string): string {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function aeyeAvailClass(a: string): string {
  return a.toLowerCase();
}

function AeyeChip({ resource }: { resource: AeyeResourceView }) {
  return (
    <span
      className={`sd-matrix__aeye sd-matrix__aeye--${aeyeAvailClass(resource.availability)}`}
      title={resource.busy_on ? `Busy on ${resource.busy_on}` : resource.source}
    >
      {resource.label}
    </span>
  );
}

function ProjectRow({
  row,
  selected,
  onToggle
}: {
  row: DispatchMatrixRow;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <article
      className={`sd-matrix__row sd-matrix__row--${statusClass(row.branch_status)} ${selected ? "sd-matrix__row--selected" : ""}`}
    >
      <div className="sd-matrix__row-head">
        {row.selectable ? (
          <button
            type="button"
            className={`sd-matrix__select ${selected ? "sd-matrix__select--on" : ""}`}
            aria-pressed={selected}
            onClick={onToggle}
          >
            {selected ? "Selected" : "Select"}
          </button>
        ) : (
          <span className="sd-matrix__select sd-matrix__select--parked">Parked</span>
        )}
        <div>
          <h3 className="sd-matrix__project">{row.project}</h3>
          <p className="sd-matrix__branch">{row.branch_label}</p>
        </div>
        <span className={`sd-matrix__status sd-matrix__status--${statusClass(row.branch_status)}`}>
          {row.branch_status}
        </span>
      </div>

      <dl className="sd-matrix__meta">
        <div>
          <dt>Benefit</dt>
          <dd>{row.benefit}</dd>
        </div>
        <div>
          <dt>Cost</dt>
          <dd>{row.cost}</dd>
        </div>
        <div>
          <dt>Required Aeyes</dt>
          <dd>{row.required_aeyes.length ? row.required_aeyes.join(" · ") : "none"}</dd>
        </div>
        <div>
          <dt>Available Aeyes</dt>
          <dd>
            {row.available_aeyes.length ? row.available_aeyes.join(" · ") : row.required_aeyes.length ? "—" : "n/a"}
          </dd>
        </div>
      </dl>

      {row.contention_warning ? (
        <p className="sd-matrix__warn" role="alert">
          {row.contention_warning}
        </p>
      ) : null}

      {row.delayed_if_dispatched.length > 0 ? (
        <ul className="sd-matrix__delays">
          {row.delayed_if_dispatched.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      ) : null}

      <p className="sd-matrix__rec">
        <span className="sd-matrix__rec-label">Recommendation</span>
        {row.dispatch_recommendation}
      </p>
    </article>
  );
}

export function DispatchMatrixPanel() {
  const [matrix, setMatrix] = useState<DispatchMatrixView | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (selectedIds: string[]) => {
    const qs = selectedIds.length ? `?selected=${encodeURIComponent(selectedIds.join(","))}` : "";
    const res = await fetch(`/api/soledash/v1/dispatch-matrix${qs}`, { cache: "no-store" });
    const data = await res.json();
    if (data.matrix) setMatrix(data.matrix as DispatchMatrixView);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(selected);
  }, [load, selected]);

  const selectedRows = useMemo(
    () => matrix?.rows.filter((r) => selected.includes(r.id)) ?? [],
    [matrix, selected]
  );

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  if (loading && !matrix) {
    return (
      <section className="sd-matrix" aria-label="Capacity-aware dispatch matrix">
        <p className="sd-matrix__loading">Loading dispatch matrix…</p>
      </section>
    );
  }

  if (!matrix) return null;

  return (
    <section className="sd-matrix" aria-label="Capacity-aware dispatch matrix">
      <div className="sd-matrix__head">
        <div>
          <p className="sd-matrix__eyebrow">Execution matrix · capacity-aware</p>
          <h2 className="sd-matrix__title">Available Aeye Resources + Relevant Mapping</h2>
          <p className="sd-matrix__hint">
            Select projects to see Aeye contention before dispatch. Busy Aeyes show what gets delayed.
          </p>
        </div>
        <span className={`sd-matrix__fleet ${matrix.fleet_state_loaded ? "sd-matrix__fleet--live" : ""}`}>
          {matrix.fleet_state_loaded ? "FLEET_STATE" : "FLEET_STATE unknown"}
        </span>
      </div>

      <div className="sd-matrix__aeyes" aria-label="Available Aeye resources">
        {matrix.aeye_resources.map((r) => (
          <AeyeChip key={r.id} resource={r} />
        ))}
      </div>

      <div className="sd-matrix__grid">
        {matrix.rows.map((row) => (
          <ProjectRow
            key={row.id}
            row={row}
            selected={selected.includes(row.id)}
            onToggle={() => toggle(row.id)}
          />
        ))}
      </div>

      {selectedRows.length > 0 ? (
        <aside className="sd-matrix__selection" aria-label="Selection summary">
          <p className="sd-matrix__selection-label">
            Selected ({selectedRows.length}) — contention preview
          </p>
          <ul className="sd-matrix__selection-list">
            {selectedRows.map((row) => (
              <li key={row.id}>
                <strong>{row.project}</strong> — {row.dispatch_recommendation}
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </section>
  );
}
