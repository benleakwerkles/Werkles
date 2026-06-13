import type { HandoffEntry, SoleDashData } from "@/lib/soledash/cockpit-data";

function ReadbackRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="soledash-kv">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function HandoffList({ items, emptyLabel }: { items: HandoffEntry[]; emptyLabel?: string }) {
  if (items.length === 0) {
    return <p className="soledash-muted">{emptyLabel ?? "No matching packets on disk."}</p>;
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

function formatLocalhost(record: SoleDashData["localhost"]["current"]) {
  if (record.ok) {
    return `${record.url} — HTTP ${record.httpStatus} @ ${new Date(record.checkedAt).toLocaleString()}`;
  }
  return `Not responding (${record.url}) @ ${new Date(record.checkedAt).toLocaleString()}`;
}

export function SoleDashDashboard({ data }: { data: SoleDashData }) {
  const { readback, mission, humanGate, localhost, crew, outbox, inbox, receipts, plumbing, sources } = data;

  return (
    <div className="soledash-root">
      <header className="soledash-header">
        <div>
          <p className="soledash-eyebrow">Werkles operator cockpit · canonical v1</p>
          <h1>SoleDash</h1>
          <p className="soledash-tagline">What we are working on today — before you start directing.</p>
        </div>
        <p className="soledash-speaker-note">
          Speaker stays the reasoning layer ({plumbing.speaker}). GimpDash stays GD routing ({plumbing.gimpdash}).
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
          <ReadbackRow label="EXECUTION_CONTEXT" value={readback.executionContext} />
        </dl>
      </section>

      <section className="soledash-panel">
        <h2>Localhost status</h2>
        <p className={localhost.current.ok ? "soledash-ok" : "soledash-warn"}>
          <strong>Now:</strong> {formatLocalhost(localhost.current)}
        </p>
        {localhost.lastSuccess ? (
          <p className="soledash-muted">
            <strong>Last success:</strong> {formatLocalhost(localhost.lastSuccess)}
          </p>
        ) : (
          <p className="soledash-muted">No recorded successful localhost probe yet.</p>
        )}
        <p className="soledash-muted soledash-ref">
          Cockpit route: <a href="/soledash">/soledash</a> · Foreman: {plumbing.foreman}
        </p>
      </section>

      <section className="soledash-panel soledash-mission">
        <h2>Today&apos;s mission</h2>
        <p className="soledash-gate">{mission.effectiveGate}</p>
        <h3>{mission.title}</h3>
        <p className="soledash-why">
          <strong>Why:</strong> {mission.why}
        </p>
        {mission.hardStops.length > 0 ? (
          <p className="soledash-stops">
            <strong>Hard stops:</strong> {mission.hardStops.join(" · ")}
          </p>
        ) : null}
      </section>

      <section className="soledash-panel">
        <h2>Human Gate</h2>
        <p className="soledash-gate">{humanGate.effectiveGate}</p>
        <p className="soledash-muted">{humanGate.note}</p>
        <div className="soledash-gate-buttons" role="group" aria-label="Human gate labels (v1 read-only)">
          {humanGate.labels.map((label) => (
            <span key={label} className="soledash-gate-btn" aria-disabled="true">
              {label}
            </span>
          ))}
        </div>
        {humanGate.activeConditions.length > 0 ? (
          <>
            <h3 className="soledash-subhead">Active conditions</h3>
            <ul className="soledash-bullets">
              {humanGate.activeConditions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        ) : null}
        <h3 className="soledash-subhead">Ben must approve</h3>
        <ul className="soledash-bullets soledash-bullets--compact">
          {humanGate.benMustApprove.slice(0, 8).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="soledash-muted soledash-ref">Doctrine: {humanGate.doctrineRef}</p>
      </section>

      <section className="soledash-panel">
        <h2>Crew packets</h2>
        <div className="soledash-grid">
          {crew.map((block) => (
            <article key={block.id} className="soledash-crew-card">
              <h3>{block.label}</h3>
              <p className="soledash-muted">{block.note}</p>
              <HandoffList items={block.outbox} emptyLabel="No recent outbox packets." />
            </article>
          ))}
        </div>
      </section>

      <section className="soledash-panel">
        <h2>Outbox</h2>
        <HandoffList items={outbox} emptyLabel="Outbox empty." />
      </section>

      <section className="soledash-panel">
        <h2>Inbox</h2>
        <HandoffList items={inbox} emptyLabel="Inbox empty." />
      </section>

      <section className="soledash-panel">
        <h2>Receipts</h2>
        <HandoffList items={receipts} emptyLabel="No cousin receipts on disk." />
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
