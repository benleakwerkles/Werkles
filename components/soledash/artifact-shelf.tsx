"use client";

import type { ArtifactShelfItem } from "@/lib/soledash/artifact-shelf/types";
import { useArtifactShelf } from "@/lib/soledash/artifact-shelf/use-artifact-shelf";
import { useDenZoneOpen } from "@/lib/soledash/wonka-den-room/den-zone-context";

function ArtifactCard({ item }: { item: ArtifactShelfItem }) {
  const openZone = useDenZoneOpen();

  return (
    <article className="sd-artifact-card">
      <header className="sd-artifact-card__head">
        <h3 className="sd-artifact-card__title">{item.label}</h3>
        <span className="sd-artifact-card__status">{item.status}</span>
      </header>
      <dl className="sd-artifact-card__meta">
        <div>
          <dt>Owner</dt>
          <dd>{item.owner}</dd>
        </div>
        <div>
          <dt>Last receipt</dt>
          <dd>{item.lastReceipt}</dd>
        </div>
      </dl>
      <footer className="sd-artifact-card__foot">
        <span className="sd-artifact-card__path">{item.sourcePath}</span>
        <button type="button" className="sd-artifact-card__open" onClick={() => openZone(item.openZone)}>
          Open
        </button>
      </footer>
    </article>
  );
}

export function ArtifactShelfStrip({ receiptAttention }: { receiptAttention: number }) {
  const { artifacts, loading } = useArtifactShelf(receiptAttention);
  const openZone = useDenZoneOpen();

  return (
    <section className="sd-artifact-shelf-strip" aria-label="Operator shelf">
      <header className="sd-artifact-shelf-strip__head">
        <h2 className="sd-artifact-shelf-strip__title">Operator Shelf</h2>
        <p className="sd-artifact-shelf-strip__lead">Pointers to proof homes — status, owner, last receipt, one tap to open.</p>
      </header>
      <div className="sd-artifact-shelf-strip__rail" role="list">
        {(loading && artifacts.length === 0 ? PLACEHOLDER_ARTIFACTS : artifacts).map((item) => (
          <article key={item.id} className="sd-artifact-tile" role="listitem">
            <p className="sd-artifact-tile__label">{item.label}</p>
            <p className="sd-artifact-tile__status">{loading && artifacts.length === 0 ? "Loading…" : item.status}</p>
            <p className="sd-artifact-tile__owner">
              <span>Owner</span> {item.owner}
            </p>
            <p className="sd-artifact-tile__receipt">
              <span>Last receipt</span> {item.lastReceipt}
            </p>
            <button
              type="button"
              className="sd-artifact-tile__open"
              disabled={loading && artifacts.length === 0}
              onClick={() => openZone(item.openZone)}
            >
              Open
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ArtifactShelfPanel({ receiptAttention }: { receiptAttention: number }) {
  const { artifacts, loading, loadedAt } = useArtifactShelf(receiptAttention);

  return (
    <section className="sd-artifact-shelf-panel" aria-label="Operator shelf detail">
      <p className="sd-artifact-shelf-panel__lead">
        Five operator links — pointers to the real drawers so nothing pretends to be a duplicate shelf.
        {loadedAt ? ` · Updated ${new Date(loadedAt).toLocaleTimeString()}` : null}
      </p>
      {loading && artifacts.length === 0 ? (
        <p className="sd-artifact-shelf-panel__loading">Loading shelf…</p>
      ) : (
        <div className="sd-artifact-shelf-panel__grid">
          {artifacts.map((item) => (
            <ArtifactCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

const PLACEHOLDER_ARTIFACTS: ArtifactShelfItem[] = [
  { id: "receipt-drawer", label: "Receipt Drawer", status: "…", owner: "…", lastReceipt: "…", openZone: "receipt-wall", sourcePath: "…" },
  { id: "approval-registry", label: "Approval Registry", status: "…", owner: "…", lastReceipt: "…", openZone: "receipt-wall", sourcePath: "…" },
  { id: "agent-roster", label: "Agent Roster", status: "…", owner: "…", lastReceipt: "…", openZone: "machine-wall", sourcePath: "…" },
  { id: "permission-swatter", label: "Permission Swatter", status: "…", owner: "…", lastReceipt: "…", openZone: "permission-swatter", sourcePath: "…" },
  { id: "crawler", label: "Crawler", status: "…", owner: "…", lastReceipt: "…", openZone: "pearl-shelf", sourcePath: "…" }
];
