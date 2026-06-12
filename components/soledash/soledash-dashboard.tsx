import type { SoleDashData } from "@/lib/soledash/cockpit-data";

function ReadbackRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="soledash-kv">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function HandoffList({ items }: { items: SoleDashData["receipts"] }) {
  if (items.length === 0) {
    return <p className="soledash-muted">No matching packets on disk.</p>;
  }
  return (
    <ul className="soledash-list">
      {items.map((item) => (
        <li key={item.relPath}>
          <strong>{item.name}</strong>
          <span className="soledash-meta">{new Date(item.modifiedAt).toLocaleString()}</span>
          <pre className="soledash-excerpt">{item.excerpt}</pre>
        </li>
      ))}
    </ul>
  );
}

export function SoleDashDashboard({ data }: { data: SoleDashData }) {
  const { readback, mission, humanGate, crew, receipts, sources } = data;

  return (
    <div className="soledash-root">
      <header className="soledash-header">
        <div>
          <p className="soledash-eyebrow">Werkles operator cockpit · v0</p>
          <h1>SoleDash</h1>
          <p className="soledash-tagline">What we are working on today — before you start directing.</p>
        </div>
        <p className="soledash-speaker-note">
          Speaker stays the reasoning layer. SoleDash is read-first local cockpit.
        </p>
      </header>

      <section className="soledash-panel">
        <h2>LOCAL HANDS READBACK</h2>
        <dl className="soledash-readback">
          <ReadbackRow label="Machine" value={`${readback.werklesName} (${readback.machine})`} />
          <ReadbackRow label="Repo" value={readback.repo} />
          <ReadbackRow label="Branch" value={readback.branch} />
          <ReadbackRow label="Commit" value={`${readback.commit.slice(0, 12)} — ${readback.commitSubject}`} />
          <ReadbackRow label="Working tree" value={readback.workingTree} />
          <ReadbackRow label="Terminal" value={readback.terminal} />
          <ReadbackRow label="Localhost" value={readback.localhost} />
          <ReadbackRow label="Port" value={readback.port} />
          <ReadbackRow label="EXECUTION_CONTEXT" value={readback.executionContext} />
        </dl>
      </section>

      <section className="soledash-panel soledash-mission">
        <h2>Today&apos;s recommended mission</h2>
        <p className="soledash-gate">{mission.effectiveGate}</p>
        <h3>{mission.title}</h3>
        <p className="soledash-why">{mission.why}</p>
        {mission.hardStops.length > 0 ? (
          <p className="soledash-stops">
            <strong>Hard stops:</strong> {mission.hardStops.join(" · ")}
          </p>
        ) : null}
      </section>

      <section className="soledash-panel">
        <h2>Human Gate</h2>
        <p className="soledash-muted">{humanGate.note}</p>
        <div className="soledash-gate-buttons" role="group" aria-label="Human gate labels (v0 read-only)">
          {humanGate.labels.map((label) => (
            <span key={label} className="soledash-gate-btn" aria-disabled="true">
              {label}
            </span>
          ))}
        </div>
        <pre className="soledash-excerpt">{humanGate.summary}</pre>
      </section>

      <section className="soledash-grid">
        {(["maker", "dink", "ender", "petra"] as const).map((key) => {
          const block = crew[key];
          return (
            <article key={key} className="soledash-panel">
              <h2>{block.label}</h2>
              <p className="soledash-muted">{block.note}</p>
              <HandoffList items={block.items} />
            </article>
          );
        })}
      </section>

      <section className="soledash-panel">
        <h2>Receipts / inbox status</h2>
        <HandoffList items={receipts} />
      </section>

      <footer className="soledash-footer">
        <h2>Sources</h2>
        <ul className="soledash-sources">
          {sources.map((s) => (
            <li key={s.path} className={s.loaded ? "ok" : "missing"}>
              {s.path} {s.loaded ? "✓" : "✗"}
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
