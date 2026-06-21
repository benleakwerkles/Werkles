"use client";

import { useCallback, useState } from "react";

import type {
  ActionReceipt,
  ProposalCard,
  ProposedBuild
} from "@/lib/soledash/command-surface/v1-types";
import type { FrontierDecision, OsSurfaceView, TransportGap } from "@/lib/soledash/command-surface/os-view";

type SoleDashOsProps = {
  initialView: OsSurfaceView;
};

const RISK_HINT: Record<ProposedBuild["risk"], string> = {
  low: "Routine, reversible",
  medium: "Some judgment calls",
  high: "Real money or liability"
};

function TransportGapPanel({ gap }: { gap: TransportGap }) {
  return (
    <div className="os-gap" role="alert">
      <p className="os-gap__headline">{gap.headline}</p>
      <p className="os-gap__reason">{gap.reason}</p>
      {gap.manualStep ? <p className="os-gap__step">{gap.manualStep}</p> : null}
      {gap.outboxPath ? <p className="os-mono os-gap__path">{gap.outboxPath}</p> : null}
      {gap.cousinPlatform ? (
        <button
          type="button"
          className="os-btn os-btn--primary"
          onClick={() => window.open(gap.cousinPlatform!, "_blank", "noopener,noreferrer")}
        >
          Open cousin surface (you send — SoleDash cannot)
        </button>
      ) : null}
    </div>
  );
}

function FrontierTransport({
  card,
  expanded
}: {
  card: ProposalCard;
  expanded: boolean;
}) {
  if (!expanded) return null;
  const { build, executionHint, lastReceipt } = card;
  const isLocal = build.cousin === "MAKER" || build.cousin === "DINK";
  const externalGap =
    !isLocal && build.status === "proposed"
      ? `After YEA: SoleDash writes the packet; you open ${build.cousin} once (auto-send not wired).`
      : null;
  return (
    <div className="os-transport">
      <p className="os-transport__label">Transport (machine details — not the decision)</p>
      {externalGap ? <p className="os-transport__gap-note">{externalGap}</p> : null}
      <dl className="os-transport__dl">
        <div>
          <dt>Owner</dt>
          <dd>{build.owner}</dd>
        </div>
        <div>
          <dt>Machine</dt>
          <dd>{build.machine}</dd>
        </div>
        <div>
          <dt>Cousin</dt>
          <dd>{build.cousin}</dd>
        </div>
        <div>
          <dt>Mission</dt>
          <dd className="os-mono">{build.missionText}</dd>
        </div>
        {executionHint.reason ? (
          <div>
            <dt>Approval</dt>
            <dd>{executionHint.reason}</dd>
          </div>
        ) : null}
        {lastReceipt?.writtenTo ? (
          <div>
            <dt>Last write</dt>
            <dd className="os-mono">{lastReceipt.writtenTo}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

function FrontierProposal({
  frontier,
  busy,
  expanded,
  onDecide,
  onToggleInfo,
  afterAction
}: {
  frontier: FrontierDecision;
  busy: boolean;
  expanded: boolean;
  afterAction: string | null;
  onDecide: (decision: string) => void;
  onToggleInfo: () => void;
}) {
  const card = frontier.card!;
  const build = card.build;

  return (
    <div className="os-frontier__body">
      <dl className="os-decision-dl">
        <div>
          <dt>Why now</dt>
          <dd>{build.whyNow}</dd>
        </div>
        <div>
          <dt>Impact if yes</dt>
          <dd>{build.expectedImpact}</dd>
        </div>
        <div>
          <dt>Risk</dt>
          <dd>
            {build.risk} — {RISK_HINT[build.risk]}
          </dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{build.timeToComplete ?? "TBD"}</dd>
        </div>
      </dl>

      {frontier.transportGap ? <TransportGapPanel gap={frontier.transportGap} /> : null}

      {afterAction ? (
        <div className="os-after" role="status">
          <p>{afterAction}</p>
        </div>
      ) : null}

      <FrontierTransport card={card} expanded={expanded} />

      <div className="os-actions">
        <button type="button" className="os-btn os-btn--yea" disabled={busy} onClick={() => onDecide("yea")}>
          YEA
        </button>
        <button type="button" className="os-btn os-btn--nay" disabled={busy} onClick={() => onDecide("nay")}>
          NAY
        </button>
        <button type="button" className="os-btn" disabled={busy} onClick={() => onDecide("defer")}>
          DEFER
        </button>
        <button type="button" className="os-btn os-btn--ghost" disabled={busy} onClick={onToggleInfo}>
          {expanded ? "Hide transport" : "More info"}
        </button>
      </div>
    </div>
  );
}

export function SoleDashOs({ initialView }: SoleDashOsProps) {
  const [view, setView] = useState(initialView);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [afterAction, setAfterAction] = useState<string | null>(null);
  const [freeform, setFreeform] = useState("");

  const refresh = useCallback(async () => {
    const res = await fetch("/api/soledash/v1/state?mode=os", { cache: "no-store" });
    const data = await res.json();
    if (data.ok && data.osView) setView(data.osView);
  }, []);

  async function decide(decision: string) {
    const buildId = view.frontier.card?.build.id;
    if (!buildId) return;

    setBusy(true);
    setAfterAction(null);

    try {
      const res = await fetch("/api/soledash/v1/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buildId, decision })
      });
      const data = await res.json();

      if (decision === "more_info" && data.ok) {
        setExpanded(true);
        setAfterAction(data.receipt?.nextState ?? "Details expanded.");
        return;
      }

      if (data.receipt?.nextState) {
        setAfterAction(data.receipt.nextState);
      } else if (data.message) {
        setAfterAction(data.message);
      }

      setExpanded(false);
      await refresh();
    } catch (err) {
      setAfterAction(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleInfo() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    const buildId = view.frontier.card?.build.id;
    if (buildId) await decide("more_info");
    else setExpanded(true);
  }

  async function submitFreeform(approve = false) {
    setBusy(true);
    try {
      await fetch("/api/soledash/v1/freeform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approve ? { approve: true } : { text: freeform })
      });
      if (approve) setFreeform("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const { frontier, instrumentation } = view;
  const hasProposal = frontier.kind === "proposal" && frontier.card;

  return (
    <div className="os-root">
      <header className="os-header">
        <p className="soledash-eyebrow">Phase 0 · Mule Elimination · SoleDash OS</p>
        <p className="os-machine">{view.machineLabel}</p>
      </header>

      <section className="os-frontier" aria-labelledby="frontier-heading">
        <p className="os-frontier__eyebrow" id="frontier-heading">
          Your next decision
        </p>
        <h1 className="os-frontier__title">{frontier.headline}</h1>
        <p className="os-frontier__subline">{frontier.subline}</p>

        {frontier.queueBehind > 0 ? (
          <p className="os-queue-hint">{frontier.queueBehind} more decision{frontier.queueBehind === 1 ? "" : "s"} queued — not shown until you finish this one.</p>
        ) : null}

        {hasProposal ? (
          <FrontierProposal
            frontier={frontier}
            busy={busy}
            expanded={expanded}
            afterAction={afterAction}
            onDecide={decide}
            onToggleInfo={toggleInfo}
          />
        ) : (
          <div className="os-frontier__body">
            {frontier.transportGap ? <TransportGapPanel gap={frontier.transportGap} /> : null}
            {!frontier.transportGap && frontier.kind === "idle" ? (
              <p className="os-idle">Open instrumentation below if you want history — nothing to groom.</p>
            ) : null}
          </div>
        )}
      </section>

      <details className="os-instrumentation">
        <summary>Instrumentation</summary>
        <div className="os-instrumentation__body">
          {instrumentation.recentDecisions.length > 0 ? (
            <>
              <h3>Recent decisions</h3>
              <ul className="os-inst-list">
                {instrumentation.recentDecisions.map((r: ActionReceipt) => (
                  <li key={r.id}>
                    <strong>{r.buildTitle}</strong> — {r.clicked.toUpperCase()}: {r.nextState}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {instrumentation.snoozed.length > 0 ? (
            <>
              <h3>Snoozed ({instrumentation.snoozed.length})</h3>
              <ul className="os-inst-list">
                {instrumentation.snoozed.map((b) => (
                  <li key={b.id}>{b.title}</li>
                ))}
              </ul>
            </>
          ) : null}

          {instrumentation.inProgress.length > 0 ? (
            <>
              <h3>In flight ({instrumentation.inProgress.length})</h3>
              <ul className="os-inst-list">
                {instrumentation.inProgress.map((b) => (
                  <li key={b.id}>{b.title}</li>
                ))}
              </ul>
            </>
          ) : null}

          {instrumentation.blocked.length > 0 ? (
            <>
              <h3>Blocked ({instrumentation.blocked.length})</h3>
              <ul className="os-inst-list">
                {instrumentation.blocked.map((b) => (
                  <li key={b.id}>
                    {b.title} — {b.blocker ?? "needs hands"}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <h3>Override</h3>
          <textarea
            className="os-textarea"
            rows={2}
            placeholder="Other intent…"
            value={freeform}
            onChange={(e) => setFreeform(e.target.value)}
          />
          <div className="os-actions os-actions--compact">
            <button type="button" className="os-btn" disabled={busy || !freeform.trim()} onClick={() => submitFreeform(false)}>
              Classify
            </button>
            {view.freeformPending ? (
              <button type="button" className="os-btn os-btn--yea" disabled={busy} onClick={() => submitFreeform(true)}>
                Approve route
              </button>
            ) : null}
          </div>

          <p className="os-mono os-readback">
            {view.technical.branch} · {view.technical.commit} · {view.technical.workingTree} ·{" "}
            {view.technical.localhostOk ? "localhost up" : "localhost down"}
          </p>
        </div>
      </details>
    </div>
  );
}
