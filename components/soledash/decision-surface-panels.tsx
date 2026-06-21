import type {
  CurrentBlocker,
  FrontierOverride,
  FrontierQueueItem,
  QueueRankSource,
  ReceiptCenterEntry,
  ReceiptCenterStatus,
  Rationale
} from "@/protocol/index";

import type { RealityMode } from "@/lib/soledash/decision-surface/reality-mode";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    const ss = String(d.getUTCSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss} UTC`;
  } catch {
    return iso;
  }
}

export function CurrentRealityBanner({
  mode,
  detail
}: {
  mode: RealityMode;
  detail: string;
}) {
  const slug = mode.toLowerCase().replace(/\s+/g, "-");
  return (
    <section className={`fm-reality fm-reality--${slug}`} aria-label="Current reality">
      <p className="fm-reality__label">Current Reality</p>
      <p className="fm-reality__mode">{mode}</p>
      <p className="fm-reality__detail">{detail}</p>
    </section>
  );
}

export function HonestyBadge({
  live,
  simulated,
  compact
}: {
  live: boolean;
  simulated?: boolean;
  compact?: boolean;
}) {
  const label = simulated ? "SIMULATED" : live ? "LIVE" : "MOCK";
  const tone = simulated ? "simulated" : live ? "live" : "mock";
  return (
    <span
      className={`fm-honesty fm-honesty--${tone} ${compact ? "fm-honesty--compact" : ""}`}
      aria-label={simulated ? "Simulated file-backed data" : live ? "Live protocol data" : "Mock placeholder data"}
    >
      {label}
    </span>
  );
}

export function CurrentBlockerPanel({ blocker, dataLive }: { blocker: CurrentBlocker; dataLive: boolean }) {
  return (
    <section className="fm-blocker" aria-label="Current blocker">
      <div className="fm-blocker__head">
        <h2 className="fm-blocker__title">Current Blocker</h2>
        <HonestyBadge live={dataLive && !blocker.mock} compact />
      </div>
      <p className="fm-blocker__headline">{blocker.headline}</p>
      {blocker.detail ? <p className="fm-blocker__detail">{blocker.detail}</p> : null}
    </section>
  );
}

const STATUS_ORDER: ReceiptCenterStatus[] = [
  "drafted",
  "queued",
  "sent",
  "received",
  "working",
  "resolved",
  "failed"
];

export function ReceiptCenterPanel({
  entries,
  dataLive,
  unavailable
}: {
  entries: ReceiptCenterEntry[];
  dataLive: boolean;
  unavailable?: boolean;
}) {
  const allSimulated = entries.length > 0 && entries.every((e) => e.simulated);
  const badgeLive = dataLive && !unavailable && !entries.some((e) => e.mock && !e.simulated);

  const pinned = entries[0] ?? null;
  const rest = entries.slice(1);

  return (
    <section className="fm-receipt-center" aria-label="Receipt center">
      <div className="fm-receipt-center__head">
        <h2 className="fm-receipt-center__title">Receipt Center</h2>
        <HonestyBadge live={badgeLive} simulated={allSimulated && dataLive} compact />
      </div>
      <p className="fm-receipt-center__hint">
        {unavailable
          ? "Cannot load foreman/soledash/receipts/ — live transport unavailable."
          : "Every action appears here — file-backed from foreman/soledash/receipts/."}
      </p>
      {entries.length === 0 ? (
        <p className="fm-receipt-center__empty">No actions yet. Click YEA, route, override, or chat — receipt logs here.</p>
      ) : (
        <>
          {pinned ? (
            <div className="fm-receipt-pin" aria-label="Most recent receipt">
              <p className="fm-receipt-pin__label">Most recent receipt</p>
              <div className="fm-receipt-pin__card">
                <p className="fm-receipt-pin__target">{pinned.target}</p>
                <p className="fm-receipt-pin__meta">
                  <span className={`fm-receipt-status fm-receipt-status--${pinned.status}`}>{pinned.status}</span>
                  {pinned.simulated ? (
                    <span className="fm-receipt-row__mock">SIMULATED</span>
                  ) : pinned.mock ? (
                    <span className="fm-receipt-row__mock">MOCK</span>
                  ) : (
                    <span className="fm-receipt-pin__live">LIVE</span>
                  )}
                  {pinned.mock_test ? (
                    <span className="fm-receipt-row__mock-test">MOCK TEST</span>
                  ) : null}
                  <span className="fm-mono fm-receipt-pin__id">{pinned.action_id}</span>
                  <span>{formatTime(pinned.last_update)}</span>
                </p>
                {pinned.receipt_link ? (
                  <p className="fm-mono fm-receipt-pin__link">{pinned.receipt_link}</p>
                ) : null}
              </div>
            </div>
          ) : null}
          {rest.length > 0 ? (
        <div className="fm-receipt-center__table-wrap">
          <table className="fm-receipt-center__table">
            <thead>
              <tr>
                <th>action_id</th>
                <th>target</th>
                <th>owner</th>
                <th>created</th>
                <th>status</th>
                <th>updated</th>
                <th>receipt</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((entry) => (
                <tr key={entry.action_id} className={`fm-receipt-row fm-receipt-row--${entry.status}`}>
                  <td className="fm-mono">{entry.action_id}</td>
                  <td>{entry.target}</td>
                  <td>{entry.owner ?? "—"}</td>
                  <td>{formatTime(entry.created_at)}</td>
                  <td>
                    <span className={`fm-receipt-status fm-receipt-status--${entry.status}`}>
                      {entry.status}
                    </span>
                    {entry.simulated ? (
                      <span className="fm-receipt-row__mock">SIMULATED</span>
                    ) : entry.mock ? (
                      <span className="fm-receipt-row__mock">MOCK</span>
                    ) : null}
                    {entry.mock_test ? (
                      <span className="fm-receipt-row__mock-test">MOCK TEST</span>
                    ) : null}
                  </td>
                  <td>{formatTime(entry.last_update)}</td>
                  <td className="fm-mono fm-receipt-center__link">{entry.receipt_link ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          ) : null}
        </>
      )}
      <ol className="fm-receipt-center__legend" aria-label="Status legend">
        {STATUS_ORDER.map((s) => (
          <li key={s} className={`fm-receipt-status fm-receipt-status--${s}`}>
            {s}
          </li>
        ))}
      </ol>
    </section>
  );
}

function QueueItemLine({ item, highlight }: { item: FrontierQueueItem; highlight?: boolean }) {
  const evSlug = String(item.evidence_status).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const score = item.score ?? item.weight;

  return (
    <div className={`fm-qvis__line ${highlight ? "fm-qvis__line--highlight" : ""}`}>
      {item.action_code ? <span className="fm-qvis__code">{item.action_code}</span> : null}
      <span className="fm-qvis__title">{item.title}</span>
      <span className="fm-qvis__meta">
        {score != null ? <span className="fm-qvis__score">score {score.toFixed(2)}</span> : null}
        <span className={`fm-qvis__ev fm-qvis__ev--${evSlug}`}>{item.evidence_status}</span>
        {item.owner ? <span className="fm-qvis__owner">owner {item.owner}</span> : null}
      </span>
    </div>
  );
}

export function QueueVisibilityPanel({
  frontier,
  machineFrontier,
  top3Alternatives,
  machineWhyNumberOne,
  dataLive,
  unavailable
}: {
  frontier: FrontierQueueItem | null;
  machineFrontier: FrontierQueueItem | null;
  top3Alternatives: FrontierQueueItem[];
  machineWhyNumberOne?: string | null;
  dataLive: boolean;
  unavailable?: boolean;
}) {
  return (
    <section className="fm-qvis" aria-label="Queue visibility">
      <div className="fm-qvis__head">
        <h2 className="fm-qvis__title">Queue Visibility</h2>
        <HonestyBadge live={dataLive && !unavailable} compact />
      </div>

      <div className="fm-qvis__section">
        <p className="fm-qvis__label">Operator Frontier</p>
        {frontier ? (
          <>
            <QueueItemLine item={frontier} highlight />
            {frontier.rank_source ? (
              <p className="fm-qvis__rank-source">
                rank_source: <strong>{frontier.rank_source.toLowerCase()}</strong>
              </p>
            ) : null}
          </>
        ) : (
          <p className="fm-qvis__empty">
            {unavailable ? "Live payload unavailable." : "No frontier — Dink sets frontier when live."}
          </p>
        )}
      </div>

      {machineFrontier ? (
        <div className="fm-qvis__section">
          <p className="fm-qvis__label">Machine Frontier</p>
          <QueueItemLine item={machineFrontier} />
        </div>
      ) : null}

      <div className="fm-qvis__section">
        <p className="fm-qvis__label">Top 3 Alternatives</p>
        {top3Alternatives.length === 0 ? (
          <p className="fm-qvis__empty">No alternatives queued.</p>
        ) : (
          <div className="fm-qvis__list">
            {top3Alternatives.map((item, i) => (
              <div key={item.proposal_id} className="fm-qvis__alt">
                <span className="fm-qvis__alt-num">#{i + 2}</span>
                <QueueItemLine item={item} />
              </div>
            ))}
          </div>
        )}
      </div>

      {machineFrontier && machineWhyNumberOne ? (
        <div className="fm-qvis__why">
          <p className="fm-qvis__label">Why machine chose #1</p>
          <p className="fm-qvis__why-ref">
            <span className="fm-qvis__code">{machineFrontier.action_code}</span> {machineFrontier.title}
          </p>
          <p className="fm-qvis__why-text">{machineWhyNumberOne}</p>
        </div>
      ) : null}
    </section>
  );
}

function RankSourceBadge({ source }: { source: QueueRankSource }) {
  const slug = source.toLowerCase();
  return <span className={`fm-qbadge fm-qbadge--${slug}`}>{source}</span>;
}

export function FrontierComparisonPanel({
  operatorFrontier,
  machineFrontier,
  source,
  dataLive,
  unavailable
}: {
  operatorFrontier: FrontierQueueItem | null;
  machineFrontier: FrontierQueueItem | null;
  source: QueueRankSource;
  dataLive: boolean;
  unavailable?: boolean;
}) {
  return (
    <section className="fm-frontier-compare" aria-label="Frontier comparison">
      <div className="fm-frontier-compare__head">
        <h2 className="fm-frontier-compare__title">Frontier Comparison</h2>
        <RankSourceBadge source={source} />
        <HonestyBadge live={dataLive && !unavailable} compact />
      </div>
      <div className="fm-frontier-compare__grid">
        <div className="fm-frontier-compare__col">
          <p className="fm-frontier-compare__label">Machine Frontier</p>
          {machineFrontier ? (
            <QueueItemLine item={machineFrontier} />
          ) : (
            <p className="fm-qvis__empty">Dink has not supplied machine_frontier.</p>
          )}
        </div>
        <div className="fm-frontier-compare__col fm-frontier-compare__col--operator">
          <p className="fm-frontier-compare__label">Operator Frontier</p>
          {operatorFrontier ? (
            <>
              <QueueItemLine item={operatorFrontier} highlight />
              {operatorFrontier.rank_source ? (
                <p className="fm-qvis__rank-source">
                  chosen by: <strong>{operatorFrontier.rank_source.toLowerCase()}</strong>
                </p>
              ) : null}
            </>
          ) : (
            <p className="fm-qvis__empty">Dink has not supplied operator frontier.</p>
          )}
        </div>
      </div>
      <p className="fm-frontier-compare__source">
        Frontier source: <strong>{source}</strong>
      </p>
    </section>
  );
}

export function QueueOverridePanel({
  items,
  activeId,
  busy,
  inspectedId,
  dataLive,
  unavailable,
  onInspect,
  onMakeFrontier
}: {
  items: FrontierQueueItem[];
  activeId: string | null;
  busy: boolean;
  inspectedId: string | null;
  dataLive: boolean;
  unavailable?: boolean;
  onInspect: (proposalId: string) => void;
  onMakeFrontier: (proposalId: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="fm-rank fm-rank--override" aria-label="Operator override">
      <div className="fm-rank__head">
        <p className="fm-rank__heading">Operator Override</p>
        <HonestyBadge live={dataLive && !unavailable} compact />
      </div>
      <ol className="fm-rank__list">
        {items.map((item) => {
          const isActive = item.proposal_id === activeId;
          const isInspected = item.proposal_id === inspectedId;
          const evSlug = String(item.evidence_status).toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const score = item.score ?? item.weight;
          const rankSource = item.rank_source ?? "MACHINE";

          return (
            <li
              key={item.proposal_id}
              className={`fm-rank__item ${isActive ? "fm-rank__item--active" : ""} ${isInspected ? "fm-rank__item--inspect" : ""}`}
            >
              <div className="fm-rank__body">
                <div className="fm-rank__title-row">
                  {item.action_code ? <span className="fm-rank__code">{item.action_code}</span> : null}
                  <p className="fm-rank__title">{item.title}</p>
                  <RankSourceBadge source={rankSource} />
                </div>
                <p className="fm-rank__meta">
                  {score != null ? <span className="fm-rank__weight">score {score.toFixed(2)}</span> : null}
                  <span className={`fm-rank__ev fm-rank__ev--${evSlug}`}>{item.evidence_status}</span>
                  {item.owner ? <span className="fm-rank__owner">{item.owner}</span> : null}
                </p>
                <div className="fm-rank__controls">
                  <button
                    type="button"
                    className="fm-rank__btn"
                    disabled={busy}
                    onClick={() => onInspect(item.proposal_id)}
                  >
                    {isInspected ? "Inspecting…" : "Inspect"}
                  </button>
                  <button
                    type="button"
                    className="fm-rank__btn fm-rank__btn--frontier"
                    disabled={busy || isActive}
                    title={isActive ? "Already operator frontier" : busy ? "Queue action in progress" : undefined}
                    onClick={() => onMakeFrontier(item.proposal_id)}
                  >
                    Make Frontier
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function InspectDetail({
  item,
  rationale,
  dataLive
}: {
  item: FrontierQueueItem;
  rationale: Rationale | null;
  dataLive: boolean;
}) {
  return (
    <section className="fm-inspect" aria-label="Inspect detail">
      <div className="fm-inspect__head">
        <h3 className="fm-inspect__title">
          Inspect — {item.action_code ?? item.proposal_id}
        </h3>
        <HonestyBadge live={dataLive} compact />
      </div>
      <p className="fm-inspect__name">{item.title}</p>
      <dl className="fm-inspect__dl">
        <div>
          <dt>Score</dt>
          <dd>{(item.score ?? item.weight)?.toFixed(2) ?? "—"}</dd>
        </div>
        <div>
          <dt>Evidence</dt>
          <dd>{item.evidence_status}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{item.owner ?? "—"}</dd>
        </div>
        <div>
          <dt>Machine rank</dt>
          <dd>{item.machine_rank ?? item.rank}</dd>
        </div>
        <div>
          <dt>Final rank</dt>
          <dd>{item.final_rank ?? item.rank}</dd>
        </div>
      </dl>
      {rationale ? (
        <p className="fm-inspect__why">{rationale.why_this_exists}</p>
      ) : (
        <p className="fm-inspect__why fm-inspect__why--muted">Dink supplies rationale when live.</p>
      )}
    </section>
  );
}

export function FrontierSourcePanel({ override, dataLive }: { override: FrontierOverride; dataLive: boolean }) {
  return (
    <section className="fm-override-banner" aria-label="Frontier override status">
      <div className="fm-override-banner__head">
        <p className="fm-override-banner__title">Queue override</p>
        <div className="fm-override-banner__badges">
          <RankSourceBadge source={override.queue_badge} />
          <HonestyBadge live={dataLive} compact />
        </div>
      </div>
      <dl className="fm-override-banner__dl">
        <div>
          <dt>Machine Recommends</dt>
          <dd>
            <span className="fm-override-banner__code">{override.machine_recommends.action_code}</span>{" "}
            {override.machine_recommends.title}
          </dd>
        </div>
        {override.operator_selected ? (
          <div>
            <dt>Operator Selected</dt>
            <dd>
              <span className="fm-override-banner__code">{override.operator_selected.action_code}</span>{" "}
              {override.operator_selected.title}
            </dd>
          </div>
        ) : null}
        <div>
          <dt>Current Frontier Source</dt>
          <dd>
            <RankSourceBadge source={override.current_source} />
          </dd>
        </div>
      </dl>
    </section>
  );
}
