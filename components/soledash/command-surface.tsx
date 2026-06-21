"use client";

import { useCallback, useState } from "react";

import type {
  ActionReceipt,
  ButtonActionState,
  CommandSurfaceView,
  DispatchResult,
  ProposalCard,
  ProposedBuild
} from "@/lib/soledash/command-surface/v1-types";
import { COUSIN_PLATFORM } from "@/lib/soledash/command-surface/v1-types";

type CommandSurfaceProps = {
  initialView: CommandSurfaceView;
};

type PendingClick = {
  buildId: string;
  decision: string;
  state: ButtonActionState;
};

const STATE_LABELS: Record<ButtonActionState, string> = {
  READY: "Ready",
  CLICKED: "Clicked",
  QUEUED: "Queued",
  DISPATCHED: "Dispatched",
  RUNNING: "Running",
  DONE: "Done",
  FAILED: "Failed",
  NEEDS_HUMAN_HANDS: "Needs human hands",
  BLOCKED_BY_TRUE_HUMAN_GATE: "Blocked by true human gate"
};

const TERMINAL_RECEIPT_DECISIONS = new Set(["yea", "nay", "defer"]);

const RISK_LABELS: Record<ProposedBuild["risk"], string> = {
  low: "Low — routine, reversible",
  medium: "Medium — some judgment calls",
  high: "High — real money or liability"
};

function formatDecision(decision: string): string {
  return decision.replace(/_/g, " ").toUpperCase();
}

function outcomeLabel(receipt: ActionReceipt): string {
  switch (receipt.clicked) {
    case "yea":
      if (receipt.gateBlocked) return "Blocked — true human gate";
      if (receipt.state === "FAILED") return "Failed to approve";
      if (receipt.needsHumanHands) return "Approved — one manual step left";
      if (receipt.state === "DONE" || receipt.state === "DISPATCHED") return "Approved";
      return "Processing approval";
    case "nay":
      return "Declined";
    case "defer":
      return "Snoozed";
    case "more_info":
      return "Reviewing details";
    default:
      return receipt.state.replace(/_/g, " ");
  }
}

function TransportDetails({
  build,
  receipt,
  executionHint,
  degradedSend
}: {
  build: ProposedBuild;
  receipt?: ActionReceipt | null;
  executionHint?: ProposalCard["executionHint"];
  degradedSend?: DispatchResult["degradedSend"] | null;
}) {
  return (
    <div className="cs-transport">
      <p className="cs-transport__label">Transport &amp; machine details</p>
      <dl className="cs-transport__facts">
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
        {build.missionText ? (
          <div>
            <dt>Mission</dt>
            <dd className="cs-mono">{build.missionText}</dd>
          </div>
        ) : null}
        {build.moreInfo ? (
          <div>
            <dt>Notes</dt>
            <dd>{build.moreInfo}</dd>
          </div>
        ) : null}
        {executionHint ? (
          <div>
            <dt>Approval class</dt>
            <dd>
              {executionHint.autoExecutable
                ? "Safe mechanical — auto-dispatch within gates"
                : executionHint.verdict === "TRUE_HUMAN_GATE"
                  ? "True human gate — YEA may block"
                  : executionHint.verdict.replace(/_/g, " ")}
              {executionHint.reason ? ` · ${executionHint.reason}` : ""}
            </dd>
          </div>
        ) : null}
        {receipt?.generated ? (
          <div>
            <dt>Generated</dt>
            <dd className="cs-mono">{receipt.generated}</dd>
          </div>
        ) : null}
        {receipt?.writtenTo ? (
          <div>
            <dt>Written to</dt>
            <dd className="cs-mono">{receipt.writtenTo}</dd>
          </div>
        ) : null}
      </dl>
      {degradedSend ? (
        <div className="cs-degraded cs-degraded--inline">
          <p className="cs-muted">{degradedSend.detail}</p>
          <p className="cs-mono">{degradedSend.outboxPath}</p>
        </div>
      ) : null}
      {receipt?.needsHumanHands && receipt.ownerCousin && COUSIN_PLATFORM[receipt.ownerCousin] ? (
        <button
          type="button"
          className="cs-btn cs-btn--primary"
          onClick={() => window.open(COUSIN_PLATFORM[receipt.ownerCousin!]!, "_blank", "noopener,noreferrer")}
        >
          Open cousin surface (manual step)
        </button>
      ) : null}
    </div>
  );
}

function DecisionReceiptPanel({
  receipt,
  pending
}: {
  receipt: ActionReceipt | null;
  pending: PendingClick | null;
}) {
  const state = pending?.state ?? receipt?.state ?? "READY";
  if (!receipt && !pending) return null;

  const display = receipt ?? {
    clicked: (pending?.decision ?? "yea") as ActionReceipt["clicked"],
    state,
    nextState: "Processing your decision…",
    gateBlocked: false,
    gateReason: null,
    needsHumanHands: false,
    humanHandsReason: null,
    autoExecutable: false,
    generated: null,
    writtenTo: null,
    ownerCousin: null,
    machine: null,
    at: new Date().toISOString(),
    id: "pending",
    buildId: pending?.buildId ?? "",
    buildTitle: "",
    note: null
  };

  return (
    <div className={`cs-receipt cs-receipt--${state.toLowerCase().replace(/_/g, "-")}`} role="status">
      <div className="cs-receipt__head">
        <span className={`cs-state cs-state--${state.toLowerCase().replace(/_/g, "-")}`}>
          {STATE_LABELS[state]}
        </span>
      </div>
      <dl className="cs-receipt__facts cs-receipt__facts--decision">
        <div>
          <dt>Your decision</dt>
          <dd>{formatDecision(display.clicked)}</dd>
        </div>
        <div>
          <dt>Outcome</dt>
          <dd>{outcomeLabel(display)}</dd>
        </div>
        <div>
          <dt>What happens next</dt>
          <dd>{display.nextState}</dd>
        </div>
      </dl>
      {display.needsHumanHands && !display.gateBlocked ? (
        <div className="cs-receipt__hands">
          <strong>Needs your hands once</strong>
          <p>{display.humanHandsReason ?? "One manual step before the cousin can run."}</p>
        </div>
      ) : null}
      {display.gateBlocked && display.gateReason ? (
        <div className="cs-receipt__gate">
          <strong>Blocked by true human gate</strong>
          <p>{display.gateReason}</p>
        </div>
      ) : null}
    </div>
  );
}

function BuildCard({
  card,
  onDecide,
  busy,
  expanded,
  onToggleInfo,
  pending,
  localReceipt,
  degradedSend
}: {
  card: ProposalCard;
  busy: boolean;
  expanded: boolean;
  pending: PendingClick | null;
  localReceipt: ActionReceipt | null;
  degradedSend?: DispatchResult["degradedSend"] | null;
  onDecide: (decision: string) => void;
  onToggleInfo: () => void;
}) {
  const { build, buttonState, lastReceipt, executionHint } = card;
  const receipt = localReceipt ?? lastReceipt;
  const isPending = pending?.buildId === build.id;
  const activeState = isPending ? pending!.state : buttonState;
  const terminalReceipt =
    receipt && (TERMINAL_RECEIPT_DECISIONS.has(receipt.clicked) || receipt.gateBlocked || receipt.state === "FAILED");
  const showButtons = build.status === "proposed" && !terminalReceipt && !isPending;
  const timeToComplete = build.timeToComplete ?? "TBD";

  return (
    <article className={`cs-build cs-build--decision cs-build--${activeState.toLowerCase().replace(/_/g, "-")}`}>
      {build.status !== "proposed" ? (
        <span className={`cs-state cs-state--${activeState.toLowerCase().replace(/_/g, "-")} cs-build__status-chip`}>
          {STATE_LABELS[activeState]}
        </span>
      ) : null}

      <h3 className="cs-build__title">{build.title}</h3>
      <p className="cs-build__proposal">{build.summary}</p>

      <dl className="cs-build__facts cs-build__facts--decision">
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
            <span className={`cs-build__risk cs-build__risk--${build.risk}`}>{build.risk}</span>
            {" — "}
            {RISK_LABELS[build.risk]}
          </dd>
        </div>
        <div>
          <dt>Time to complete</dt>
          <dd>{timeToComplete}</dd>
        </div>
      </dl>

      {expanded ? (
        <TransportDetails
          build={build}
          receipt={receipt}
          executionHint={executionHint}
          degradedSend={degradedSend}
        />
      ) : null}

      <div className="cs-build__action-area">
        {(receipt || isPending) && <DecisionReceiptPanel receipt={receipt} pending={isPending ? pending : null} />}

        {showButtons ? (
          <div className="cs-decisions">
            <button type="button" className="cs-btn cs-btn--yea" disabled={busy} onClick={() => onDecide("yea")}>
              YEA
            </button>
            <button type="button" className="cs-btn cs-btn--nay" disabled={busy} onClick={() => onDecide("nay")}>
              NAY
            </button>
            <button type="button" className="cs-btn" disabled={busy} onClick={onToggleInfo}>
              {expanded ? "HIDE INFO" : "MORE INFO"}
            </button>
            <button type="button" className="cs-btn" disabled={busy} onClick={() => onDecide("defer")}>
              DEFER
            </button>
          </div>
        ) : terminalReceipt ? (
          <div className="cs-decisions cs-decisions--secondary">
            <button type="button" className="cs-btn" disabled={busy} onClick={onToggleInfo}>
              {expanded ? "HIDE INFO" : "MORE INFO"}
            </button>
          </div>
        ) : isPending ? (
          <p className="cs-muted">Recording your decision…</p>
        ) : (
          <div className="cs-decisions cs-decisions--secondary">
            <button type="button" className="cs-btn" disabled={busy} onClick={onToggleInfo}>
              {expanded ? "HIDE INFO" : "MORE INFO"}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function RecentDecisionRow({ receipt }: { receipt: ActionReceipt }) {
  return (
    <li className="cs-receipt-row">
      <span className={`cs-state cs-state--${receipt.state.toLowerCase().replace(/_/g, "-")}`}>
        {STATE_LABELS[receipt.state]}
      </span>
      <strong>{receipt.buildTitle}</strong>
      <span className="cs-muted">
        {formatDecision(receipt.clicked)} → {outcomeLabel(receipt)}
      </span>
      <span className="cs-muted">{receipt.nextState}</span>
      <time className="cs-muted" dateTime={receipt.at}>
        {new Date(receipt.at).toLocaleString()}
      </time>
    </li>
  );
}

function FinishedRow({ build }: { build: ProposedBuild }) {
  return (
    <li className="cs-finished">
      <strong>{build.title}</strong>
      <span>{build.status === "ready" ? "Ready for you to verify" : "In progress with cousin"}</span>
    </li>
  );
}

export function CommandSurface({ initialView }: CommandSurfaceProps) {
  const [view, setView] = useState(initialView);
  const [freeform, setFreeform] = useState("");
  const [busy, setBusy] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<PendingClick | null>(null);
  const [localReceipts, setLocalReceipts] = useState<Record<string, ActionReceipt>>({});
  const [lastDegraded, setLastDegraded] = useState<DispatchResult["degradedSend"] | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/soledash/v1/state", { cache: "no-store" });
    const data = await res.json();
    if (data.ok) setView(data.view);
  }, []);

  async function decide(buildId: string, decision: string) {
    setBusy(true);
    setPending({ buildId, decision, state: "CLICKED" });
    setLastDegraded(null);

    try {
      setPending({ buildId, decision, state: "QUEUED" });

      const res = await fetch("/api/soledash/v1/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buildId, decision })
      });
      const data = await res.json();

      if (decision === "more_info" && data.ok) {
        setExpandedIds((prev) => new Set(prev).add(buildId));
      }

      if (data.receipt) {
        setLocalReceipts((prev) => ({ ...prev, [buildId]: data.receipt }));
      }

      if (data.degradedSend) {
        setLastDegraded(data.degradedSend);
      }

      await refresh();
    } catch (err) {
      const failReceipt: ActionReceipt = {
        id: `local_fail_${Date.now()}`,
        buildId,
        buildTitle: view.proposalCards.find((c) => c.build.id === buildId)?.build.title ?? buildId,
        clicked: decision as ActionReceipt["clicked"],
        state: "FAILED",
        at: new Date().toISOString(),
        generated: null,
        writtenTo: null,
        ownerCousin: null,
        machine: null,
        nextState: err instanceof Error ? err.message : "Could not reach SoleDash — try again.",
        autoExecutable: false,
        needsHumanHands: true,
        humanHandsReason: err instanceof Error ? err.message : "Network or server error.",
        gateBlocked: false,
        gateReason: null,
        note: null
      };
      setLocalReceipts((prev) => ({ ...prev, [buildId]: failReceipt }));
    } finally {
      setPending(null);
      setBusy(false);
    }
  }

  async function toggleMoreInfo(buildId: string) {
    if (expandedIds.has(buildId)) {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(buildId);
        return next;
      });
      return;
    }
    await decide(buildId, "more_info");
  }

  async function submitFreeform(approve = false) {
    setBusy(true);
    try {
      const res = await fetch("/api/soledash/v1/freeform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(approve ? { approve: true } : { text: freeform })
      });
      const data = await res.json();
      if (approve && data.degradedSend) setLastDegraded(data.degradedSend);
      if (approve && data.ok) setFreeform("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  function openDegraded(send: NonNullable<DispatchResult["degradedSend"]>) {
    if (send.cousinPlatform && !send.cousinPlatform.includes("local")) {
      window.open(send.cousinPlatform, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="cs-root">
      <header className="cs-header">
        <p className="soledash-eyebrow">SoleDash · Decision Surface · v2</p>
        <h1>Decisions first</h1>
        <p className="cs-muted">{view.machineLabel} — what, why, impact, risk, time. Transport behind MORE INFO.</p>
      </header>

      <section className="cs-section" aria-labelledby="recent">
        <h2 id="recent">Recent decisions</h2>
        {view.recentReceipts.length === 0 ? (
          <p className="cs-muted">No decisions yet — review the cards below.</p>
        ) : (
          <ul className="cs-receipt-lane">
            {view.recentReceipts.map((r) => (
              <RecentDecisionRow key={r.id} receipt={r} />
            ))}
          </ul>
        )}
      </section>

      <section className="cs-section" aria-labelledby="needsYou">
        <h2 id="needsYou">Needs you now</h2>
        {view.needsYouNow.length === 0 ? (
          <p className="cs-muted">Nothing urgent.</p>
        ) : (
          <ul className="cs-needs">
            {view.needsYouNow.map((item) => (
              <li key={`${item.kind}-${item.title}`} className={`cs-needs__item cs-needs__item--${item.kind}`}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cs-section" aria-labelledby="proposed">
        <h2 id="proposed">On the table</h2>
        <p className="cs-muted">Six proposals — decide YEA, NAY, or DEFER. Machine details only on MORE INFO.</p>
        <div className="cs-builds">
          {view.proposalCards.map((card) => (
            <BuildCard
              key={card.build.id}
              card={card}
              busy={busy}
              expanded={expandedIds.has(card.build.id)}
              pending={pending?.buildId === card.build.id ? pending : null}
              localReceipt={localReceipts[card.build.id] ?? null}
              degradedSend={localReceipts[card.build.id]?.clicked === "yea" ? lastDegraded : null}
              onDecide={(d) => decide(card.build.id, d)}
              onToggleInfo={() => toggleMoreInfo(card.build.id)}
            />
          ))}
        </div>
      </section>

      {view.deferredBuilds.length > 0 ? (
        <section className="cs-section" aria-labelledby="deferred">
          <h2 id="deferred">Snoozed</h2>
          <ul className="cs-deferred-list">
            {view.deferredBuilds.map((b) => (
              <li key={b.id}>
                <strong>{b.title}</strong>
                <span className="cs-muted"> — deferred · expand MORE INFO on card to revisit transport</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="cs-section" aria-labelledby="gates">
        <h2 id="gates">Human gates</h2>
        {view.humanGates.length === 0 ? (
          <p className="cs-muted">No active gates surfaced.</p>
        ) : (
          <ul className="cs-gates">
            {view.humanGates.map((g) => (
              <li key={g.id} className={`cs-gate cs-gate--${g.severity}`}>
                <strong>{g.title}</strong>
                <span>{g.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="cs-section cs-section--freeform" aria-labelledby="freeform">
        <h2 id="freeform">Freeform command</h2>
        <p className="cs-muted">Describe a decision in your words — machine routes behind classify.</p>
        <textarea
          className="cs-textarea cs-textarea--freeform"
          rows={3}
          placeholder="What do you want to decide?"
          value={freeform}
          onChange={(e) => setFreeform(e.target.value)}
        />
        <div className="cs-actions">
          <button type="button" className="cs-btn" disabled={busy || !freeform.trim()} onClick={() => submitFreeform(false)}>
            Classify route
          </button>
        </div>

        {view.freeformPending ? (
          <div className="cs-freeform-pending">
            <p className="cs-muted">{view.freeformPending.summary}</p>
            <button type="button" className="cs-btn cs-btn--yea" disabled={busy} onClick={() => submitFreeform(true)}>
              Approve & dispatch
            </button>
            {lastDegraded ? (
              <div className="cs-degraded">
                <p className="cs-muted">{lastDegraded.detail}</p>
                <button type="button" className="cs-btn cs-btn--primary" onClick={() => openDegraded(lastDegraded)}>
                  {lastDegraded.label}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="cs-section" aria-labelledby="finished">
        <h2 id="finished">Approved · in progress</h2>
        {view.finishedReady.length === 0 ? (
          <p className="cs-muted">Nothing approved yet.</p>
        ) : (
          <ul className="cs-finished-list">
            {view.finishedReady.map((b) => (
              <FinishedRow key={b.id} build={b} />
            ))}
          </ul>
        )}
      </section>

      <section className="cs-section" aria-labelledby="blocked">
        <h2 id="blocked">Blocked · needs your hands</h2>
        {view.blocked.length === 0 && view.needsYouNow.every((n) => n.kind !== "blocker") ? (
          <p className="cs-muted">Clear.</p>
        ) : (
          <ul className="cs-blocked">
            {view.blocked.map((b) => (
              <li key={b.id}>
                {b.title} — {b.blocker ?? b.status}
              </li>
            ))}
          </ul>
        )}
      </section>

      <details className="cs-technical">
        <summary>Machine readback (technical)</summary>
        <p className="cs-mono">
          {view.technical.branch} · {view.technical.commit} · {view.technical.workingTree} ·{" "}
          {view.technical.localhostOk ? "localhost up" : "localhost down"}
        </p>
        <p className="cs-muted">Receipts and outbox paths live under foreman/soledash/ and foreman/handoffs/.</p>
      </details>
    </div>
  );
}
