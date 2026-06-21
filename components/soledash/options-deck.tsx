"use client";

import { useEffect, useMemo, useState } from "react";

import type { DecisionButton, FrontierQueueItem, Proposal } from "@/protocol/index";
import { cardButtons } from "@/lib/soledash/options-deck/card-actions";
import { buildCompanyOptions, verbLabel, type OptionVerb } from "@/lib/soledash/options-deck/build-options";
import { salvoAllowed } from "@/lib/soledash/options-deck/conflicts";
import { lifecycleLabel } from "@/lib/soledash/options-deck/lifecycle";
import type {
  CompanyOption,
  OptionBoardState,
  OptionLifecycleState,
  ReactionEntry,
  SalvoSlot
} from "@/lib/soledash/options-deck/types";
import { COUSIN_TARGETS, type OperatorCousinTarget } from "@/lib/soledash/options-deck/cousins";

const SALVO_VERBS: OptionVerb[] = [
  "dispatch",
  "yea",
  "nay",
  "needs_research",
  "kill_test",
  "human_reality",
  "make_frontier"
];

function formatScore(score: number | null): string {
  if (score == null || Number.isNaN(score)) return "—";
  return score.toFixed(2);
}

function riskSlug(risk: string): string {
  return risk.replace(/[^a-z]+/g, "-") || "unknown";
}

export function ReactionFeed({ entries }: { entries: ReactionEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <section className="sx-reactions" aria-label="Dash reactions">
      <p className="sx-reactions__label">Board reinform — what actually happened</p>
      <ul className="sx-reactions__list">
        {entries.slice(0, 8).map((entry) => (
          <li key={entry.id} className={`sx-reactions__item sx-reactions__item--${entry.tone}`}>
            <span className="sx-reactions__headline">{entry.headline}</span>
            <span className="sx-reactions__detail">{entry.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function OptionsDeck({
  compact,
  queue,
  proposal,
  routeButtons,
  unavailable,
  chatDraft,
  pollSeconds,
  lastRefresh,
  salvoSlots,
  reactions,
  boardStates,
  busy,
  rationale,
  machineFrontierTitle,
  onFireOption,
  onFireSalvo
}: {
  compact?: boolean;
  queue: FrontierQueueItem[];
  proposal: Proposal | null;
  routeButtons: DecisionButton[];
  unavailable: boolean;
  chatDraft: string;
  pollSeconds: number;
  lastRefresh: string;
  salvoSlots: SalvoSlot[];
  reactions: ReactionEntry[];
  boardStates: Record<string, OptionBoardState>;
  busy: boolean;
  rationale?: import("@/protocol/index").Rationale | null;
  machineFrontierTitle?: string | null;
  onFireOption: (option: CompanyOption, verb: OptionVerb, target: OperatorCousinTarget) => void;
  onFireSalvo: (
    options: CompanyOption[],
    verb: OptionVerb,
    target: OperatorCousinTarget
  ) => void | Promise<void>;
}) {
  const options = useMemo(
    () =>
      buildCompanyOptions({
        queue,
        proposal,
        routeButtons,
        unavailable,
        rationale: rationale ?? null,
        machineFrontierTitle: machineFrontierTitle ?? null
      }),
    [queue, proposal, routeButtons, unavailable, rationale, machineFrontierTitle]
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [salvoTarget, setSalvoTarget] = useState<OperatorCousinTarget>("MAKER");
  const [salvoVerb, setSalvoVerb] = useState<OptionVerb>("dispatch");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedOptions = options.filter((o) => selected.has(o.id));
  const salvoCheck = salvoAllowed(selectedOptions, options);
  const attentionWeight = options
    .filter((o) => boardStates[o.id]?.lifecycle === "proposed" && o.score != null)
    .reduce((sum, o) => sum + (o.score ?? 0), 0);

  const secondsSinceRefresh = useMemo(() => {
    try {
      return Math.max(0, Math.floor((Date.now() - new Date(lastRefresh).getTime()) / 1000));
    } catch {
      return tick;
    }
  }, [lastRefresh, tick]);
  const staleIn = Math.max(0, pollSeconds - secondsSinceRefresh);

  const allConflicts = useMemo(() => {
    const hints = new Set<string>();
    for (const o of options) {
      for (const h of o.conflictHints) hints.add(h);
    }
    return Array.from(hints);
  }, [options]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const visible = compact ? options.slice(0, 6) : options;

  return (
    <section className={`sx-deck ${compact ? "sx-deck--compact" : ""}`} aria-label="Company options market">
      <div className="sx-deck__head">
        <div>
          <p className="sx-deck__eyebrow">Starship Explode</p>
          <h2 className="sx-deck__title">{compact ? "Options market" : "Company options market"}</h2>
          <p className="sx-deck__hint">
            Multiple real options · multi-fire when they do not conflict · board updates from receipts, not
            expectations.
          </p>
        </div>
        <div className="sx-deck__arbitrage" aria-label="Opportunity cost">
          <span className="sx-deck__arb-label">Open attention cost</span>
          <span className="sx-deck__arb-value">{attentionWeight.toFixed(2)}</span>
          <span className="sx-deck__arb-label">Reinform in</span>
          <span className={`sx-deck__arb-timer ${staleIn <= 5 ? "sx-deck__arb-timer--hot" : ""}`}>
            {staleIn}s
          </span>
        </div>
      </div>

      {!compact && allConflicts.length > 0 ? (
        <div className="sx-deck__tension" aria-label="Opportunity cost tensions">
          <p className="sx-deck__tension-label">Live tension</p>
          <ul className="sx-deck__tension-list">
            {allConflicts.slice(0, 4).map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="sx-deck__salvo-bar" aria-label="Multi-fire salvo">
        <label className="sx-deck__salvo-field">
          <span>Target</span>
          <select
            value={salvoTarget}
            disabled={busy}
            onChange={(e) => setSalvoTarget(e.target.value as OperatorCousinTarget)}
          >
            {COUSIN_TARGETS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="sx-deck__salvo-field">
          <span>Verb</span>
          <select
            value={salvoVerb}
            disabled={busy}
            onChange={(e) => setSalvoVerb(e.target.value as OptionVerb)}
          >
            {SALVO_VERBS.map((v) => (
              <option key={v} value={v}>
                {verbLabel(v)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="sx-deck__salvo-fire"
          disabled={busy || selectedOptions.length === 0 || unavailable || !salvoCheck.allowed}
          title={
            unavailable
              ? "Live payload unavailable"
              : !salvoCheck.allowed
                ? salvoCheck.reason ?? "Selection conflicts"
                : `Fire ${selectedOptions.length} without conflict`
          }
          onClick={() => void onFireSalvo(selectedOptions, salvoVerb, salvoTarget)}
        >
          {busy ? "Salvo…" : `Multi-fire (${selectedOptions.length})`}
        </button>
      </div>

      {!salvoCheck.allowed && selectedOptions.length > 1 ? (
        <p className="sx-deck__conflict-warn">{salvoCheck.reason}</p>
      ) : null}

      {salvoSlots.length > 0 ? (
        <div className="sx-deck__slots" aria-label="In-flight slots">
          {salvoSlots.slice(0, compact ? 4 : 8).map((slot) => (
            <div key={slot.id} className={`sx-deck__slot sx-deck__slot--${slot.phase}`}>
              <span className="sx-deck__slot-verb">{verbLabel(slot.verb)}</span>
              <span className="sx-deck__slot-title">{slot.optionTitle}</span>
              <span className="sx-deck__slot-target">→ {slot.target}</span>
              {slot.detail ? <span className="sx-deck__slot-detail">{slot.detail}</span> : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className={`sx-deck__grid ${compact ? "sx-deck__grid--compact" : ""}`}>
        {visible.map((option) => (
          <OptionCard
            key={option.id}
            option={option}
            board={boardStates[option.id]}
            selected={selected.has(option.id)}
            busy={busy}
            chatDraft={chatDraft}
            onToggle={() => toggle(option.id)}
            onFire={(verb, target) => onFireOption(option, verb, target)}
          />
        ))}
      </div>

      {!compact ? <ReactionFeed entries={reactions} /> : null}
    </section>
  );
}

function OptionCard({
  option,
  board,
  selected,
  busy,
  chatDraft,
  onToggle,
  onFire
}: {
  option: CompanyOption;
  board?: OptionBoardState;
  selected: boolean;
  busy: boolean;
  chatDraft: string;
  onToggle: () => void;
  onFire: (verb: OptionVerb, target: OperatorCousinTarget) => void;
}) {
  const lifecycle: OptionLifecycleState = board?.lifecycle ?? "proposed";
  const buttons = cardButtons(option, busy, chatDraft);
  const dimmed = Boolean(board?.dimmedReason);

  return (
    <article
      className={`sx-card sx-card--${lifecycle} ${selected ? "sx-card--selected" : ""} ${option.isActiveFrontier ? "sx-card--frontier" : ""} ${!option.enabled ? "sx-card--off" : ""} ${dimmed ? "sx-card--dimmed" : ""}`}
    >
      <div className="sx-card__head">
        <label className="sx-card__pick">
          <input
            type="checkbox"
            checked={selected}
            disabled={!option.enabled || busy || lifecycle !== "proposed"}
            title={lifecycle !== "proposed" ? "Already fired — cannot multi-select" : undefined}
            onChange={onToggle}
          />
          <span className="sx-card__code">{option.code}</span>
        </label>
        <span className={`sx-card__lifecycle sx-card__lifecycle--${lifecycle}`}>{lifecycleLabel(lifecycle)}</span>
      </div>

      <h3 className="sx-card__title">{option.title}</h3>

      <dl className="sx-card__meta">
        <div>
          <dt>Action</dt>
          <dd>{option.action}</dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd>{option.target}</dd>
        </div>
        <div>
          <dt>Expected</dt>
          <dd>{board?.expectedResult ?? option.expectedResult}</dd>
        </div>
        {board?.actualResult ? (
          <div className="sx-card__meta-actual">
            <dt>Actual</dt>
            <dd>{board.actualResult}</dd>
          </div>
        ) : null}
        <div>
          <dt>Time cost</dt>
          <dd>{option.timeCostMin}m</dd>
        </div>
        <div>
          <dt>Risk</dt>
          <dd className={`sx-card__risk sx-card__risk--${riskSlug(option.risk)}`}>{option.risk}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{option.confidence}</dd>
        </div>
        {option.score != null ? (
          <div>
            <dt>Score</dt>
            <dd>{formatScore(option.score)}</dd>
          </div>
        ) : null}
      </dl>

      {option.conflictHints.length > 0 ? (
        <div className="sx-card__conflicts" aria-label="Opportunity cost">
          {option.conflictHints.slice(0, 2).map((hint) => (
            <p key={hint} className="sx-card__conflict-line">
              {hint}
            </p>
          ))}
        </div>
      ) : null}

      {board?.dimmedReason ? <p className="sx-card__dimmed-reason">{board.dimmedReason}</p> : null}

      <div className="sx-card__verbs">
        {buttons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            className={`sx-card__verb sx-card__verb--${btn.id}`}
            disabled={!btn.enabled}
            title={btn.reason ?? `${btn.label} → ${option.target}`}
            onClick={() => onFire(btn.verb, option.target)}
          >
            {btn.label}
          </button>
        ))}
      </div>
    </article>
  );
}
