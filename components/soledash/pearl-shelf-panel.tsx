"use client";

import type { PearlAction, PearlStatus } from "@/lib/pearls/v0/types";
import { TERMINAL_PEARL_STATUSES } from "@/lib/pearls/v0/types";
import { usePearlShelfContext } from "@/lib/pearls/v0/pearl-shelf-context";
import type { PearlShelfRow } from "@/lib/pearls/v0/use-pearl-shelf";

const STATUS_SECTIONS: { status: PearlStatus; title: string; hint: string; empty: string }[] = [
  { status: "NEW", title: "New", hint: "Fresh wisdom nuggets from the crawl.", empty: "No new pearls." },
  { status: "REVIEWED", title: "Reviewed", hint: "Read and ready for promotion.", empty: "No reviewed pearls." },
  { status: "PROMOTED", title: "Promoted", hint: "Linked draft tasks live here.", empty: "No promoted pearls." },
  { status: "ARCHIVED", title: "Archived", hint: "Retired pearls — closed shelf.", empty: "No archived pearls." },
  { status: "KILLED", title: "Killed", hint: "Terminal discard — visually closed.", empty: "No killed pearls." }
];

const ACTION_LABELS: Record<PearlAction, string> = {
  review: "Review",
  promote: "Promote",
  archive: "Archive",
  kill: "Kill"
};

function statusSlug(status: PearlStatus): string {
  return status.toLowerCase();
}

function PearlCard({
  pearl,
  busy,
  onAction
}: {
  pearl: PearlShelfRow;
  busy: boolean;
  onAction: (action: PearlAction) => void;
}) {
  const terminal = TERMINAL_PEARL_STATUSES.has(pearl.status);
  const showDraft = pearl.status === "PROMOTED" && pearl.linked_draft_task;

  return (
    <article
      className={`sd-pearl-card sd-pearl-card--${statusSlug(pearl.status)} ${terminal ? "sd-pearl-card--terminal" : ""}`}
    >
      <header className="sd-pearl-card__head">
        <div>
          <p className="sd-pearl-card__id">
            <code>{pearl.pearl_id}</code>
          </p>
          <h3 className="sd-pearl-card__title">{pearl.title}</h3>
        </div>
        <span className={`sd-pearl-card__status sd-pearl-card__status--${statusSlug(pearl.status)}`}>
          {pearl.status}
        </span>
      </header>

      <dl className="sd-pearl-card__meta">
        <div>
          <dt>Origin</dt>
          <dd>{pearl.origin}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{pearl.source}</dd>
        </div>
        <div className="sd-pearl-card__principle">
          <dt>Core principle</dt>
          <dd>{pearl.core_principle}</dd>
        </div>
      </dl>

      {showDraft ? (
        <div className="sd-pearl-card__draft">
          <p className="sd-pearl-card__draft-label">Linked draft task</p>
          <p className="sd-pearl-card__draft-title">{pearl.linked_draft_task!.title}</p>
          <p className="sd-pearl-card__draft-id">
            <code>{pearl.linked_draft_task!.task_id}</code>
          </p>
          <p className="sd-pearl-card__draft-summary">{pearl.linked_draft_task!.summary}</p>
        </div>
      ) : null}

      {!terminal && pearl.actions.length > 0 ? (
        <footer className="sd-pearl-card__actions">
          {pearl.actions.map((action) => (
            <button
              key={action}
              type="button"
              className={`sd-pearl-card__action sd-pearl-card__action--${action}`}
              disabled={busy}
              onClick={() => onAction(action)}
            >
              {ACTION_LABELS[action]}
            </button>
          ))}
        </footer>
      ) : null}

      {terminal ? <p className="sd-pearl-card__closed">Closed — no further actions.</p> : null}
    </article>
  );
}

export function PearlShelfPanel() {
  const { byStatus, loading, busyId, notice, runAction, pearls } = usePearlShelfContext();

  return (
    <section className="sd-pearl-shelf" aria-label="Pearl shelf">
      <p className="sd-pearl-shelf__lead">
        Crawler pearls — harvested wisdom nuggets on the shelf. Review, promote to draft, or close them out.
      </p>
      {notice ? (
        <p className="sd-pearl-shelf__notice" role="status">
          {notice}
        </p>
      ) : null}
      {loading && pearls.length === 0 ? (
        <p className="sd-pearl-shelf__loading">Loading pearls…</p>
      ) : (
        <div className="sd-pearl-shelf__sections">
        {STATUS_SECTIONS.map((section) => {
          const rows = byStatus[section.status];
          return (
            <section
              key={section.status}
              className={`sd-pearl-section sd-pearl-section--${statusSlug(section.status)}`}
              aria-label={`${section.title} ${rows.length}`}
            >
              <header className="sd-pearl-section__head">
                <h2 className="sd-pearl-section__title">
                  {section.title} <span className="sd-pearl-section__count">{rows.length}</span>
                </h2>
                <p className="sd-pearl-section__hint">{section.hint}</p>
              </header>
              {rows.length === 0 ? (
                <p className="sd-pearl-section__empty">{section.empty}</p>
              ) : (
                <ul className="sd-pearl-section__list">
                  {rows.map((pearl) => (
                    <li key={pearl.pearl_id}>
                      <PearlCard
                        pearl={pearl}
                        busy={busyId === pearl.pearl_id}
                        onAction={(action) => void runAction(pearl.pearl_id, action)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
        </div>
      )}
    </section>
  );
}
