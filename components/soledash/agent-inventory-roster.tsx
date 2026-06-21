"use client";

import { ProvenanceLabel } from "@/components/soledash/provenance-label";
import type { AgentInventoryRoster, AgentRosterEntry } from "@/lib/soledash/agent-inventory/types";
import type { Provenance } from "@/lib/soledash/provenance/types";

function RosterRow({
  entry,
  selected,
  disabled,
  onSelect
}: {
  entry: AgentRosterEntry;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <div className={`sd-agent-roster__row ${selected ? "sd-agent-roster__row--selected" : ""}`}>
      <button
        type="button"
        className="sd-agent-roster__toggle"
        role="radio"
        aria-checked={selected}
        aria-label={`Route to ${entry.aeye} on ${entry.machine}`}
        disabled={disabled || !entry.selectable}
        title={entry.blockReason ?? undefined}
        onClick={onSelect}
      >
        <span className="sd-agent-roster__toggle-dot" />
      </button>
      <dl className="sd-agent-roster__facts">
        <div>
          <dt>Aeye</dt>
          <dd>{entry.aeye}</dd>
        </div>
        <div>
          <dt>Machine</dt>
          <dd>{entry.machine}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span className={`sd-agent-roster__status sd-agent-roster__status--${entry.statusSlug}`}>
              {entry.status}
            </span>
          </dd>
        </div>
        <div className="sd-agent-roster__wide">
          <dt>Current task</dt>
          <dd>{entry.currentTask}</dd>
        </div>
      </dl>
      {entry.blockReason ? <p className="sd-agent-roster__blocker">{entry.blockReason}</p> : null}
    </div>
  );
}

export function AgentInventoryRoster({
  roster,
  loading,
  selectedEntryId,
  disabled,
  onSelect
}: {
  roster: AgentInventoryRoster | null;
  loading: boolean;
  selectedEntryId: string | null;
  disabled?: boolean;
  onSelect: (entry: AgentRosterEntry) => void;
}) {
  const provenance: Provenance = roster
    ? {
        source: roster.fleet_state_loaded ? "FILE" : "LOCAL",
        updatedAt: roster.generated_at,
        detail: roster.source_path ?? "foreman/soledash/FLEET_STATE.json"
      }
    : {
        source: "LOCAL",
        updatedAt: "1970-01-01T00:00:00.000Z",
        detail: "agent inventory loading"
      };

  return (
    <section className="sd-agent-roster" aria-label="Live agent roster">
      <div className="sd-agent-roster__head">
        <p className="sd-agent-roster__label">Live roster</p>
        {roster ? (
          <ProvenanceLabel provenance={provenance} compact />
        ) : (
          <span className="sd-agent-roster__loading-prov">LOCAL · loading</span>
        )}
      </div>
      <p className="sd-agent-roster__hint">Pick who works this — grouped by machine. No typing.</p>

      {loading && !roster ? (
        <p className="sd-agent-roster__empty">Loading fleet roster…</p>
      ) : !roster ? (
        <p className="sd-agent-roster__empty">Roster unavailable — refresh SoleDash.</p>
      ) : (
        <div className="sd-agent-roster__groups" role="radiogroup" aria-label="Route target">
          {roster.groups.map((group) => (
            <div key={group.id} className="sd-agent-roster__group">
              <h4 className="sd-agent-roster__group-title">{group.label}</h4>
              <div className="sd-agent-roster__stack">
                {group.entries.map((entry) => (
                  <RosterRow
                    key={entry.id}
                    entry={entry}
                    selected={selectedEntryId === entry.id}
                    disabled={Boolean(disabled)}
                    onSelect={() => onSelect(entry)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
