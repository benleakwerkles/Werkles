import type {
  ActionLifecycle,
  FleetMachineCard,
  ReceiptCenterEntry
} from "@/protocol/index";
import {
  fleetHealthLabel,
  fleetHealthSlug,
  normalizeFleetHealth
} from "@/lib/soledash/megawork-home/fleet-health";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return `${hh}:${mm} UTC`;
  } catch {
    return iso;
  }
}

function evidenceSlug(status: string): string {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "unknown";
}

export function FleetRow({
  fleet,
  fleetStateLoaded
}: {
  fleet: FleetMachineCard[];
  fleetStateLoaded?: boolean;
}) {
  return (
    <section className="mw-fleet" aria-label="Machine fleet">
      <div className="mw-fleet__head-row">
        <h2 className="mw-fleet__title">Machine Fleet</h2>
        <span className={`mw-fleet__feed ${fleetStateLoaded ? "mw-fleet__feed--live" : "mw-fleet__feed--unknown"}`}>
          {fleetStateLoaded ? "FLEET_STATE live" : "FLEET_STATE UNKNOWN"}
        </span>
      </div>
      <div className="mw-fleet__row">
        {fleet.map((machine) => {
          const health = normalizeFleetHealth(machine.status);
          return (
          <article
            key={machine.id}
            className={`mw-fleet__card ${machine.is_local ? "mw-fleet__card--local" : ""} mw-fleet__card--${fleetHealthSlug(health)}`}
            aria-label={`${machine.display_name} machine`}
          >
            <div className="mw-fleet__card-head">
              <div className="mw-fleet__name-block">
                <p className="mw-fleet__name">{machine.display_name}</p>
                <p className="mw-fleet__hostname">{machine.hostname}</p>
              </div>
              <div className="mw-fleet__badges">
                <span
                  className={`mw-fleet__status mw-fleet__status--${fleetHealthSlug(health)}`}
                  title={fleetHealthLabel(health)}
                >
                  {health}
                </span>
                <span
                  className={`mw-fleet__evidence mw-fleet__evidence--${evidenceSlug(machine.evidence_status)}`}
                >
                  {machine.evidence_status}
                </span>
              </div>
            </div>
            <dl className="mw-fleet__dl">
              <div>
                <dt>Active cousins</dt>
                <dd>{machine.active_cousins}</dd>
              </div>
              <div>
                <dt>Current task</dt>
                <dd>{machine.current_task ?? "UNKNOWN"}</dd>
              </div>
              <div>
                <dt>Remote path</dt>
                <dd>{machine.remote_path_status}</dd>
              </div>
              <div>
                <dt>Workstation uniformity</dt>
                <dd>{machine.workstation_uniformity_status}</dd>
              </div>
              <div>
                <dt>Needs operator touch</dt>
                <dd>{machine.needs_operator_touch}</dd>
              </div>
              {machine.latest_receipt_path ? (
                <div>
                  <dt>Latest receipt</dt>
                  <dd className="fm-mono mw-fleet__receipt-link">{machine.latest_receipt_path}</dd>
                </div>
              ) : (
                <div>
                  <dt>Blocker</dt>
                  <dd className="mw-fleet__blocker">{machine.blocker ?? "UNKNOWN"}</dd>
                </div>
              )}
            </dl>
            {machine.is_local ? <p className="mw-fleet__local-tag">You are here</p> : null}
          </article>
          );
        })}
      </div>
    </section>
  );
}

export function MegaWorkHeader({
  mission,
  machineLabel,
  lastRefresh,
  refreshing,
  onRefresh
}: {
  mission: string;
  machineLabel: string;
  lastRefresh: string;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="mw-header" aria-label="MegaWork home">
      <div className="mw-header__logo-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/soledash/branding/logo-a-transparent.png"
          alt="AEYE Inc"
          className="mw-header__logo"
          width={320}
          height={56}
        />
      </div>
      <div className="mw-header__copy">
        <p className="mw-header__eyebrow">SoleDash MegaWork · {machineLabel}</p>
        <h1 className="mw-header__mission">{mission}</h1>
      </div>
      <div className="mw-header__bar">
        <span className="mw-header__time">Updated {formatTime(lastRefresh)}</span>
        <button type="button" className="mw-header__refresh" disabled={refreshing} onClick={onRefresh}>
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </header>
  );
}

export function LastRealActionPin({
  lifecycle,
  receipts
}: {
  lifecycle: ActionLifecycle | null;
  receipts: ReceiptCenterEntry[];
}) {
  const realReceipt = receipts.find((r) => !r.simulated && !r.mock);
  const realAction =
    lifecycle && lifecycle.phase !== "idle" && !lifecycle.simulated && !lifecycle.mock
      ? lifecycle
      : null;

  const pin = realAction
    ? {
        kind: "action" as const,
        label: `${realAction.action?.toUpperCase() ?? "action"} · ${realAction.action_id ?? "—"}`,
        detail: realAction.message,
        at: realAction.updated_at,
        simulated: false
      }
    : realReceipt
      ? {
          kind: "receipt" as const,
          label: realReceipt.target,
          detail: realReceipt.status,
          at: realReceipt.last_update,
          simulated: false
        }
      : null;

  return (
    <section className="mw-real-pin" aria-label="Last real action">
      <h2 className="mw-real-pin__title">Last Real Action</h2>
      {pin ? (
        <div className="mw-real-pin__card">
          <p className="mw-real-pin__label">{pin.label}</p>
          <p className="mw-real-pin__meta">
            <span className="mw-real-pin__live">LIVE</span>
            <span>{pin.detail}</span>
            <span>{formatTime(pin.at)}</span>
          </p>
        </div>
      ) : (
        <p className="mw-real-pin__empty">
          No non-simulated action yet — file-backed receipts marked <strong>simulated</strong> are test
          dispatch only.
        </p>
      )}
    </section>
  );
}

export function ReceiptSearchBar({
  value,
  onChange,
  resultCount,
  totalCount
}: {
  value: string;
  onChange: (v: string) => void;
  resultCount: number;
  totalCount: number;
}) {
  return (
    <div className="mw-receipt-search">
      <label className="mw-receipt-search__label" htmlFor="mw-receipt-search-input">
        Receipt search
      </label>
      <input
        id="mw-receipt-search-input"
        type="search"
        className="mw-receipt-search__input"
        placeholder="Filter by action_id, target, owner, status…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="mw-receipt-search__count">
        {value.trim() ? `${resultCount} of ${totalCount} receipts` : `${totalCount} receipts`}
      </p>
    </div>
  );
}

export function filterReceiptEntries(entries: ReceiptCenterEntry[], query: string): ReceiptCenterEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((entry) => {
    const hay = [
      entry.action_id,
      entry.target,
      entry.owner ?? "",
      entry.status,
      entry.receipt_link ?? ""
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
