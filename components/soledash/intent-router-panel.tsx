"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  IntentRouteAction,
  IntentRouterProposal,
  IntentRouterView
} from "@/lib/soledash/intent-router/types";
import type { IntentMemoryAction, IntentMemoryPanel } from "@/lib/soledash/intent-memory/types";

const POLL_MS = 5000;

function stateSlug(state: string): string {
  return state.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function routeTone(proposal: IntentRouterProposal): string {
  if (proposal.state === "BLOCKED") return "bad";
  if (proposal.availability.routeMode === "live") return "ok";
  if (proposal.availability.routeMode === "outbox_only") return "warn";
  return "idle";
}

function ActionButton({
  action,
  label,
  busy,
  disabled,
  onAction
}: {
  action: IntentRouteAction;
  label: string;
  busy: boolean;
  disabled?: boolean;
  onAction: (action: IntentRouteAction) => void;
}) {
  return (
    <button
      type="button"
      className={`intent-router__action intent-router__action--${action.replace("_", "-")}`}
      disabled={busy || disabled}
      onClick={() => onAction(action)}
    >
      {busy ? "..." : label}
    </button>
  );
}

function IntentMemoryCard({
  panel,
  busy,
  onContinue,
  onEditIntent,
  onAction
}: {
  panel: IntentMemoryPanel;
  busy: boolean;
  onContinue: () => void;
  onEditIntent: () => void;
  onAction: (action: Extract<IntentMemoryAction, "send_petra" | "send_bean" | "park">) => void;
}) {
  return (
    <article className="intent-router__memory" aria-label="Intent Memory">
      <div className="intent-router__proposal-head">
        <div>
          <p className="intent-router__label">Intent Memory</p>
          <h3 className="intent-router__title">{panel.interpreted_command}</h3>
        </div>
        <span className={`intent-router__state intent-router__state--${panel.route_confidence}`}>
          {panel.route_confidence} confidence
        </span>
      </div>

      <dl className="intent-router__dl">
        <div>
          <dt>Interpreted intent</dt>
          <dd>{panel.interpreted_command}</dd>
        </div>
        <div>
          <dt>Active constraints</dt>
          <dd>{panel.route_confidence_note}</dd>
        </div>
      </dl>

      <div className="intent-router__memory-list">
        {panel.prior_findings.slice(0, 5).map((finding) => (
          <section key={finding.id} className="intent-router__memory-finding">
            <div className="intent-router__memory-finding-head">
              <p className="intent-router__subhead">{finding.label}</p>
              <span className={`intent-router__route intent-router__route--${finding.confidence === "high" ? "ok" : finding.confidence === "medium" ? "warn" : "idle"}`}>
                {finding.confidence}
              </span>
            </div>
            <dl className="intent-router__memory-dl">
              <div>
                <dt>Related finding</dt>
                <dd>{finding.summary}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{finding.source}</dd>
              </div>
              <div>
                <dt>Why it matters now</dt>
                <dd>{finding.why_it_matters_now}</dd>
              </div>
              <div>
                <dt>Recommended caution</dt>
                <dd>{finding.recommended_caution}</dd>
              </div>
            </dl>
          </section>
        ))}
      </div>

      <div className="intent-router__actions">
        <button type="button" className="intent-router__action intent-router__action--approve" disabled={busy} onClick={onContinue}>
          CONTINUE
        </button>
        <button type="button" className="intent-router__action" disabled={busy} onClick={onEditIntent}>
          EDIT INTENT
        </button>
        <button type="button" className="intent-router__action intent-router__action--needs-research" disabled={busy} onClick={() => onAction("send_petra")}>
          SEND TO PETRA
        </button>
        <button type="button" className="intent-router__action intent-router__action--kill-test" disabled={busy} onClick={() => onAction("send_bean")}>
          SEND TO BEAN
        </button>
        <button type="button" className="intent-router__action intent-router__action--reject" disabled={busy} onClick={() => onAction("park")}>
          PARK
        </button>
      </div>
    </article>
  );
}

function ProposalCard({
  proposal,
  busy,
  onAction,
  editing,
  editedIntent,
  onStartEdit,
  onEditedIntent,
  onSubmitEdit
}: {
  proposal: IntentRouterProposal;
  busy: boolean;
  editing: boolean;
  editedIntent: string;
  onAction: (action: IntentRouteAction) => void;
  onStartEdit: () => void;
  onEditedIntent: (value: string) => void;
  onSubmitEdit: () => void;
}) {
  const tone = routeTone(proposal);

  return (
    <article className={`intent-router__proposal intent-router__proposal--${stateSlug(proposal.state)}`}>
      <div className="intent-router__proposal-head">
        <div>
          <p className="intent-router__label">Proposed dispatch card</p>
          <h3 className="intent-router__title">{proposal.interpretedIntent}</h3>
        </div>
        <span className={`intent-router__state intent-router__state--${stateSlug(proposal.state)}`}>
          {proposal.state.replace(/_/g, " ")}
        </span>
      </div>

      <dl className="intent-router__dl">
        <div>
          <dt>Interpreted intent</dt>
          <dd>{proposal.interpretedIntent}</dd>
        </div>
        <div>
          <dt>Task type</dt>
          <dd>{proposal.category}</dd>
        </div>
        <div>
          <dt>Required capability</dt>
          <dd>{proposal.requiredCapability}</dd>
        </div>
        <div>
          <dt>Owner</dt>
          <dd>{proposal.selectedAeyes.label}</dd>
        </div>
        <div>
          <dt>Machine</dt>
          <dd>{proposal.selectedMachine}</dd>
        </div>
        <div>
          <dt>Availability</dt>
          <dd>
            <span className={`intent-router__route intent-router__route--${tone}`}>
              {proposal.availability.routeMode.replace("_", " ")}
            </span>{" "}
            {proposal.availability.primaryAeyeAvailability}
          </dd>
        </div>
        <div>
          <dt>Expected receipt</dt>
          <dd>{proposal.expectedReceipt}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{proposal.confidence}</dd>
        </div>
      </dl>

      <div className="intent-router__why">
        <p className="intent-router__subhead">Why selected</p>
        <ul>
          {proposal.whySelected.map((why) => (
            <li key={why}>{why}</li>
          ))}
        </ul>
      </div>

      <div className="intent-router__why">
        <p className="intent-router__subhead">Alternatives rejected</p>
        <ul>
          {proposal.alternativesRejected.map((why) => (
            <li key={why}>{why}</li>
          ))}
        </ul>
      </div>

      {proposal.availability.knownBlockers.length > 0 ? (
        <div className="intent-router__blockers" role="status">
          <p className="intent-router__subhead">Known blockers</p>
          <ul>
            {proposal.availability.knownBlockers.slice(0, 3).map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {proposal.receipt ? (
        <div className="intent-router__receipt" role="status">
          <p className="intent-router__subhead">Receipt</p>
          <p>{proposal.receipt.summary}</p>
          {proposal.receipt.outboxPath ? <code>{proposal.receipt.outboxPath}</code> : null}
          {proposal.receipt.blocker ? <p className="intent-router__receipt-blocker">{proposal.receipt.blocker}</p> : null}
          <p>{proposal.receipt.nextAction}</p>
        </div>
      ) : null}

      {proposal.nextDecision ? <p className="intent-router__next">{proposal.nextDecision}</p> : null}

      {editing ? (
        <div className="intent-router__edit">
          <label htmlFor="intent-router-edit">Edit route</label>
          <textarea
            id="intent-router-edit"
            rows={3}
            value={editedIntent}
            onChange={(e) => onEditedIntent(e.target.value)}
          />
          <button type="button" className="intent-router__action" disabled={busy || !editedIntent.trim()} onClick={onSubmitEdit}>
            Save edited route
          </button>
        </div>
      ) : null}

      <div className="intent-router__actions">
        <ActionButton action="approve" label="APPROVE" busy={busy} onAction={onAction} />
        <button type="button" className="intent-router__action" disabled={busy} onClick={onStartEdit}>
          EDIT ROUTE
        </button>
        <ActionButton action="reject" label="REJECT" busy={busy} onAction={onAction} />
        <ActionButton action="needs_research" label="NEEDS RESEARCH" busy={busy} onAction={onAction} />
        <ActionButton action="kill_test" label="KILL TEST" busy={busy} onAction={onAction} />
      </div>
    </article>
  );
}

export function IntentRouterPanel({ onRefresh }: { onRefresh?: () => void | Promise<void> }) {
  const [view, setView] = useState<IntentRouterView | null>(null);
  const [intent, setIntent] = useState("Build Mobile SD");
  const [memoryPanel, setMemoryPanel] = useState<IntentMemoryPanel | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editedIntent, setEditedIntent] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/soledash/v1/intent-router", { cache: "no-store" });
    const data = (await res.json()) as IntentRouterView;
    setView(data);
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  async function propose() {
    const text = intent.trim();
    if (!text) return;
    setBusy(true);
    setStatus("Retrieving intent memory...");
    setEditing(false);
    try {
      const res = await fetch("/api/soledash/v1/intent-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data.panel) {
        setMemoryPanel(data.panel as IntentMemoryPanel);
        setStatus("Review memory before routing.");
      } else {
        setStatus(data.error ?? "Intent memory failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function continueFromMemory() {
    const panel = memoryPanel;
    if (!panel) return;
    setBusy(true);
    setStatus("Creating proposed dispatch route...");
    try {
      const res = await fetch("/api/soledash/v1/intent-router", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: panel.raw_command })
      });
      const data = await res.json();
      if (data.proposal) {
        setMemoryPanel(null);
        setView((prev) => ({
          ok: true,
          latestProposal: data.proposal,
          recent: [data.proposal, ...(prev?.recent ?? []).filter((p) => p.id !== data.proposal.id)].slice(0, 5),
          proposalDir: prev?.proposalDir ?? "foreman/soledash/intent-router/proposals",
          receiptDir: prev?.receiptDir ?? "foreman/soledash/intent-router/receipts"
        }));
        setStatus("Review route before firing.");
      } else {
        setStatus(data.error ?? "Intent route failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function runMemoryAction(action: Extract<IntentMemoryAction, "send_petra" | "send_bean" | "park">) {
    const panel = memoryPanel;
    if (!panel) return;
    setBusy(true);
    setStatus(`${action.replace("_", " ")}...`);
    try {
      const res = await fetch("/api/soledash/v1/intent-memory/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          panel,
          park_reason: action === "park" ? "Operator parked from Intent Memory" : undefined
        })
      });
      const data = await res.json();
      setStatus(data.result?.detail ?? data.error ?? (res.ok ? "Memory action complete." : "Memory action blocked."));
      if (data.result?.ok) {
        setMemoryPanel(null);
        if (onRefresh) await onRefresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function act(action: IntentRouteAction) {
    const proposal = view?.latestProposal;
    if (!proposal) return;

    setBusy(true);
    setStatus(`${action.replace("_", " ")}...`);
    try {
      const res = await fetch("/api/soledash/v1/intent-router/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposal_id: proposal.id, action })
      });
      const data = await res.json();
      if (data.proposal) {
        setView((prev) => ({
          ok: true,
          latestProposal: data.proposal,
          recent: [data.proposal, ...(prev?.recent ?? []).filter((p) => p.id !== data.proposal.id)].slice(0, 5),
          proposalDir: prev?.proposalDir ?? "foreman/soledash/intent-router/proposals",
          receiptDir: prev?.receiptDir ?? "foreman/soledash/intent-router/receipts"
        }));
      }
      setStatus(data.message ?? (res.ok ? "Action complete." : "Action blocked."));
      if (onRefresh) await onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function submitEdit() {
    const proposal = view?.latestProposal;
    if (!proposal || !editedIntent.trim()) return;
    setBusy(true);
    setStatus("Editing route...");
    try {
      const res = await fetch("/api/soledash/v1/intent-router/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposal_id: proposal.id,
          action: "edit_route",
          edited_intent: editedIntent
        })
      });
      const data = await res.json();
      if (data.proposal) {
        setView((prev) => ({
          ok: true,
          latestProposal: data.proposal,
          recent: [data.proposal, ...(prev?.recent ?? []).filter((p) => p.id !== data.proposal.id)].slice(0, 5),
          proposalDir: prev?.proposalDir ?? "foreman/soledash/intent-router/proposals",
          receiptDir: prev?.receiptDir ?? "foreman/soledash/intent-router/receipts"
        }));
        setIntent(data.proposal.rawIntent);
      }
      setEditing(false);
      setStatus(data.message ?? (res.ok ? "Route edited." : "Edit blocked."));
    } finally {
      setBusy(false);
    }
  }

  const proposal = view?.latestProposal ?? null;

  return (
    <section className="intent-router" aria-label="Automatica intent router">
      <div className="intent-router__head">
        <div>
          <p className="intent-router__eyebrow">Automatica intent router</p>
          <h2 className="intent-router__heading">Say the work. SD picks the route.</h2>
        </div>
        <p className="intent-router__dirs">
          Cards <code>{view?.proposalDir ?? "..."}</code>
        </p>
      </div>

      <div className="intent-router__input-row">
        <label className="intent-router__input-label" htmlFor="intent-router-input">
          Operator intent
        </label>
        <input
          id="intent-router-input"
          type="text"
          value={intent}
          placeholder="Build Mobile SD"
          disabled={busy}
          onChange={(e) => setIntent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void propose();
          }}
        />
        <button type="button" disabled={busy || !intent.trim()} onClick={() => void propose()}>
          Route
        </button>
      </div>

      {status ? <p className="intent-router__status">{status}</p> : null}

      {memoryPanel ? (
        <IntentMemoryCard
          panel={memoryPanel}
          busy={busy}
          onContinue={() => void continueFromMemory()}
          onEditIntent={() => {
            setIntent(memoryPanel.raw_command);
            setMemoryPanel(null);
            setStatus("Edit intent, then route again.");
          }}
          onAction={(action) => void runMemoryAction(action)}
        />
      ) : proposal ? (
        <ProposalCard
          proposal={proposal}
          busy={busy}
          editing={editing}
          editedIntent={editedIntent}
          onAction={(action) => void act(action)}
          onStartEdit={() => {
            setEditedIntent(proposal.rawIntent);
            setEditing((open) => !open);
          }}
          onEditedIntent={setEditedIntent}
          onSubmitEdit={() => void submitEdit()}
        />
      ) : (
        <p className="intent-router__empty">No proposed route yet.</p>
      )}
    </section>
  );
}
